// lib/database/connection.ts
// Think-Habit Journal App - SQLite 데이터베이스 연결 관리

import Database from "better-sqlite3";
import { app } from "electron";
import * as fs from "fs";
import * as path from "path";
import { DatabaseConfig } from "../../shared/types";

/**
 * 데이터베이스 연결 관리 클래스
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database | null = null;
  private config: DatabaseConfig;
  private isInitialized = false;

  private constructor(config?: Partial<DatabaseConfig>) {
    // 기본 설정
    const userDataPath = app.getPath("userData");
    const defaultConfig: DatabaseConfig = {
      path: path.join(userDataPath, "think-habit-journal.db"),
      encrypted: false,
      backupPath: path.join(userDataPath, "backups"),
    };

    this.config = { ...defaultConfig, ...config };
    this.ensureDirectories();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(config?: Partial<DatabaseConfig>): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager(config);
    }
    return DatabaseManager.instance;
  }

  /**
   * 필요한 디렉토리 생성
   */
  private ensureDirectories(): void {
    const dbDir = path.dirname(this.config.path);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    if (this.config.backupPath && !fs.existsSync(this.config.backupPath)) {
      fs.mkdirSync(this.config.backupPath, { recursive: true });
    }
  }

  /**
   * 데이터베이스 연결 및 초기화
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    try {
      console.log(`데이터베이스 연결 중: ${this.config.path}`);

      // SQLite 데이터베이스 연결
      this.db = new Database(this.config.path, {
        verbose:
          process.env.NODE_ENV === "development" ? console.log : undefined,
        fileMustExist: false, // 파일이 없으면 생성
      });

      // 데이터베이스 설정 적용
      this.applyDatabaseSettings();

      // 스키마 초기화
      await this.initializeSchema();

      // 마이그레이션 실행
      await this.runMigrations();

      this.isInitialized = true;
      console.log("데이터베이스 초기화 완료");
    } catch (error) {
      console.error("데이터베이스 초기화 실패:", error);
      throw new Error(`데이터베이스 초기화 실패: ${error.message}`);
    }
  }

  /**
   * 데이터베이스 설정 적용
   */
  private applyDatabaseSettings(): void {
    if (!this.db) throw new Error("데이터베이스가 연결되지 않았습니다");

    // 기본 PRAGMA 설정
    this.db.pragma("foreign_keys = ON");
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("synchronous = NORMAL");
    this.db.pragma("cache_size = -64000"); // 64MB
    this.db.pragma("temp_store = MEMORY");

    console.log("데이터베이스 설정 적용 완료");
  }

  /**
   * 스키마 초기화
   */
  private async initializeSchema(): Promise<void> {
    if (!this.db) throw new Error("데이터베이스가 연결되지 않았습니다");

    try {
      // 스키마 파일 읽기
      const schemaPath = path.join(__dirname, "schema.sql");
      const schemaSQL = fs.readFileSync(schemaPath, "utf8");

      // 스키마 실행 (여러 문장을 분리하여 실행)
      const statements = schemaSQL
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        try {
          this.db.exec(statement);
        } catch (error) {
          // 이미 존재하는 객체에 대한 에러는 무시
          if (!error.message.includes("already exists")) {
            console.warn(
              "스키마 문장 실행 중 경고:",
              statement.substring(0, 100),
              error.message,
            );
          }
        }
      }

      console.log("스키마 초기화 완료");
    } catch (error) {
      console.error("스키마 초기화 실패:", error);
      throw error;
    }
  }

  /**
   * 마이그레이션 실행
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error("데이터베이스가 연결되지 않았습니다");

    try {
      // 마이그레이션 테이블 생성
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version TEXT PRIMARY KEY,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const migrationsDir = path.join(__dirname, "migrations");

      // 마이그레이션 디렉토리가 존재하는지 확인
      if (!fs.existsSync(migrationsDir)) {
        console.log("마이그레이션 디렉토리가 없습니다. 건너뜁니다.");
        return;
      }

      // 마이그레이션 파일 목록 가져오기
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort();

      // 이미 적용된 마이그레이션 확인
      const appliedMigrations = this.db
        .prepare("SELECT version FROM schema_migrations")
        .all()
        .map((row: any) => row.version);

      // 새로운 마이그레이션 실행
      for (const migrationFile of migrationFiles) {
        const version = path.basename(migrationFile, ".sql");

        if (appliedMigrations.includes(version)) {
          continue; // 이미 적용된 마이그레이션
        }

        console.log(`마이그레이션 실행 중: ${migrationFile}`);

        const migrationSQL = fs.readFileSync(
          path.join(migrationsDir, migrationFile),
          "utf8",
        );

        // 트랜잭션으로 마이그레이션 실행
        const transaction = this.db.transaction(() => {
          this.db!.exec(migrationSQL);
          this.db!.prepare(
            "INSERT INTO schema_migrations (version) VALUES (?)",
          ).run(version);
        });

        transaction();
        console.log(`마이그레이션 완료: ${migrationFile}`);
      }

      console.log("모든 마이그레이션 완료");
    } catch (error) {
      console.error("마이그레이션 실패:", error);
      throw error;
    }
  }

  /**
   * 데이터베이스 인스턴스 반환
   */
  public getDatabase(): Database.Database {
    if (!this.db || !this.isInitialized) {
      throw new Error(
        "데이터베이스가 초기화되지 않았습니다. initialize()를 먼저 호출하세요.",
      );
    }
    return this.db;
  }

  /**
   * 데이터베이스 백업 생성
   */
  public async createBackup(description?: string): Promise<string> {
    if (!this.db) throw new Error("데이터베이스가 연결되지 않았습니다");

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFileName = `think-habit-backup-${timestamp}.db`;
      const backupPath = path.join(this.config.backupPath!, backupFileName);

      // 백업 실행
      await this.db.backup(backupPath);

      // 백업 정보 기록
      const backupSize = fs.statSync(backupPath).size;
      const journalCount = this.db
        .prepare("SELECT COUNT(*) as count FROM journals")
        .get() as { count: number };

      this.db
        .prepare(
          `
          INSERT INTO backups (backup_path, backup_size, journal_count, description)
          VALUES (?, ?, ?, ?)
        `,
        )
        .run(
          backupPath,
          backupSize,
          journalCount.count,
          description || "Auto backup",
        );

      console.log(`백업 생성 완료: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error("백업 생성 실패:", error);
      throw error;
    }
  }

  /**
   * 오래된 백업 정리
   */
  public async cleanupOldBackups(maxBackups: number = 7): Promise<void> {
    if (!this.db) throw new Error("데이터베이스가 연결되지 않았습니다");

    try {
      // 오래된 백업 목록 조회
      const oldBackups = this.db
        .prepare(
          `
          SELECT backup_path FROM backups 
          ORDER BY created_at DESC 
          LIMIT -1 OFFSET ?
        `,
        )
        .all(maxBackups) as { backup_path: string }[];

      // 파일 삭제 및 레코드 제거
      for (const backup of oldBackups) {
        if (fs.existsSync(backup.backup_path)) {
          fs.unlinkSync(backup.backup_path);
        }

        this.db
          .prepare("DELETE FROM backups WHERE backup_path = ?")
          .run(backup.backup_path);
      }

      if (oldBackups.length > 0) {
        console.log(`오래된 백업 ${oldBackups.length}개 정리 완료`);
      }
    } catch (error) {
      console.error("백업 정리 실패:", error);
      throw error;
    }
  }

  /**
   * 데이터베이스 상태 확인
   */
  public getStatus(): {
    connected: boolean;
    initialized: boolean;
    path: string;
    size: number;
    journalCount: number;
    lastBackup?: Date;
  } {
    const status = {
      connected: !!this.db,
      initialized: this.isInitialized,
      path: this.config.path,
      size: 0,
      journalCount: 0,
      lastBackup: undefined as Date | undefined,
    };

    if (fs.existsSync(this.config.path)) {
      status.size = fs.statSync(this.config.path).size;
    }

    if (this.db && this.isInitialized) {
      try {
        const result = this.db
          .prepare("SELECT COUNT(*) as count FROM journals")
          .get() as { count: number };
        status.journalCount = result.count;

        const lastBackup = this.db
          .prepare("SELECT MAX(created_at) as last_backup FROM backups")
          .get() as { last_backup: string | null };

        if (lastBackup.last_backup) {
          status.lastBackup = new Date(lastBackup.last_backup);
        }
      } catch (error) {
        console.warn("상태 확인 중 오류:", error);
      }
    }

    return status;
  }

  /**
   * 데이터베이스 연결 종료
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log("데이터베이스 연결 종료");
    }
  }

  /**
   * 트랜잭션 실행
   */
  public transaction<T>(fn: (db: Database.Database) => T): T {
    if (!this.db) throw new Error("데이터베이스가 연결되지 않았습니다");

    const transaction = this.db.transaction(fn);
    return transaction(this.db);
  }

  /**
   * 데이터베이스 무결성 검사
   */
  public async checkIntegrity(): Promise<boolean> {
    if (!this.db) return false;

    try {
      const result = this.db.pragma("integrity_check");
      return result.length === 1 && result[0].integrity_check === "ok";
    } catch (error) {
      console.error("무결성 검사 실패:", error);
      return false;
    }
  }

  /**
   * 데이터베이스 최적화 (VACUUM)
   */
  public async optimize(): Promise<void> {
    if (!this.db) throw new Error("데이터베이스가 연결되지 않았습니다");

    try {
      console.log("데이터베이스 최적화 시작...");
      this.db.exec("VACUUM");
      console.log("데이터베이스 최적화 완료");
    } catch (error) {
      console.error("데이터베이스 최적화 실패:", error);
      throw error;
    }
  }
}

/**
 * 데이터베이스 매니저 인스턴스 내보내기 (싱글톤)
 */
export const dbManager = DatabaseManager.getInstance();

/**
 * 데이터베이스 초기화 헬퍼 함수
 */
export const initializeDatabase = async (
  config?: Partial<DatabaseConfig>,
): Promise<Database.Database> => {
  const manager = DatabaseManager.getInstance(config);
  await manager.initialize();
  return manager.getDatabase();
};
