// import { Database } from 'better-sqlite3';  // 기존 주석 처리된 줄
import { Database } from "../../shared/types"; // 이 줄 추가

// 나머지 코드는 그대로...
// src/main/database/migrations.ts
//import { Database } from "better-sqlite3";
import {
  createIndexQueries,
  createTableQueries,
  createTriggerQueries,
  defaultSettings,
} from "./schema";

interface Migration {
  version: number;
  description: string;
  up: (db: Database) => void;
  down: (db: Database) => void;
}

export class MigrationManager {
  private db: Database;
  private migrations: Migration[];

  constructor(db: Database) {
    this.db = db;
    this.migrations = this.getMigrations();
    this.initializeMigrationTable();
  }

  private initializeMigrationTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        execution_time INTEGER,
        checksum TEXT
      )
    `);
  }

  private getMigrations(): Migration[] {
    return [
      {
        version: 1,
        description: "Initial schema - Create base tables",
        up: (db) => {
          console.log("Creating base tables...");
          Object.entries(createTableQueries).forEach(([tableName, query]) => {
            console.log(`Creating table: ${tableName}`);
            db.exec(query);
          });
        },
        down: (db) => {
          const tables = [
            "journal_templates",
            "settings",
            "sync_queue",
            "files",
            "journals",
            "users",
          ];
          tables.forEach((table) => {
            db.exec(`DROP TABLE IF EXISTS ${table}`);
          });
        },
      },

      {
        version: 2,
        description: "Add indexes for performance optimization",
        up: (db) => {
          console.log("Creating indexes...");
          createIndexQueries.forEach((query, index) => {
            console.log(
              `Creating index ${index + 1}/${createIndexQueries.length}`,
            );
            db.exec(query);
          });
        },
        down: (db) => {
          const indexes = [
            "idx_journals_user_id",
            "idx_journals_sync_status",
            "idx_journals_type",
            "idx_journals_created_at",
            "idx_journals_updated_at",
            "idx_journals_server_id",
            "idx_files_journal_id",
            "idx_files_upload_status",
            "idx_sync_queue_status",
            "idx_sync_queue_table_record",
            "idx_sync_queue_priority",
            "idx_journal_templates_user_id",
            "idx_journal_templates_type",
          ];
          indexes.forEach((index) => {
            db.exec(`DROP INDEX IF EXISTS ${index}`);
          });
        },
      },

      {
        version: 3,
        description: "Add triggers for automatic timestamps and sync queue",
        up: (db) => {
          console.log("Creating triggers...");
          createTriggerQueries.forEach((query, index) => {
            console.log(
              `Creating trigger ${index + 1}/${createTriggerQueries.length}`,
            );
            db.exec(query);
          });
        },
        down: (db) => {
          const triggers = [
            "update_journals_timestamp",
            "update_users_timestamp",
            "update_settings_timestamp",
            "journal_sync_queue_insert",
            "journal_sync_queue_update",
          ];
          triggers.forEach((trigger) => {
            db.exec(`DROP TRIGGER IF EXISTS ${trigger}`);
          });
        },
      },

      {
        version: 4,
        description: "Insert default settings and system data",
        up: (db) => {
          console.log("Inserting default settings...");
          const insertSetting = db.prepare(`
            INSERT OR IGNORE INTO settings (key, value, type, description)
            VALUES (?, ?, ?, ?)
          `);

          defaultSettings.forEach((setting) => {
            insertSetting.run(
              setting.key,
              setting.value,
              setting.type,
              setting.description,
            );
          });

          console.log("Inserting default journal templates...");
          const insertTemplate = db.prepare(`
            INSERT OR IGNORE INTO journal_templates (id, name, type, template_data, is_default, is_system)
            VALUES (?, ?, ?, ?, ?, ?)
          `);

          // 기본 구조화된 일지 템플릿
          const structuredTemplate = {
            tasks: [
              { id: "1", text: "오늘의 목표 설정", completed: false, order: 1 },
              {
                id: "2",
                text: "중요한 작업 3가지 선정",
                completed: false,
                order: 2,
              },
              { id: "3", text: "진행 상황 점검", completed: false, order: 3 },
              { id: "4", text: "하루 마무리 정리", completed: false, order: 4 },
            ],
            notes: "",
          };

          insertTemplate.run(
            "default_structured",
            "기본 구조화된 일지",
            "structured",
            JSON.stringify(structuredTemplate),
            true,
            true,
          );

          // 기본 사진 일지 템플릿
          const photoTemplate = {
            photos: [],
            description: "",
          };

          insertTemplate.run(
            "default_photo",
            "기본 사진 일지",
            "photo",
            JSON.stringify(photoTemplate),
            true,
            true,
          );
        },
        down: (db) => {
          db.exec(
            "DELETE FROM settings WHERE key IN (SELECT key FROM settings LIMIT 8)",
          );
          db.exec("DELETE FROM journal_templates WHERE is_system = TRUE");
        },
      },
    ];
  }

  public async runMigrations(): Promise<void> {
    const currentVersion = this.getCurrentVersion();
    const pendingMigrations = this.migrations.filter(
      (m) => m.version > currentVersion,
    );

    if (pendingMigrations.length === 0) {
      console.log("No pending migrations");
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      const startTime = Date.now();
      console.log(
        `Running migration ${migration.version}: ${migration.description}`,
      );

      const transaction = this.db.transaction(() => {
        try {
          migration.up(this.db);

          const executionTime = Date.now() - startTime;
          const checksum = this.calculateChecksum(migration);

          this.db
            .prepare(
              `
            INSERT INTO schema_migrations (version, description, execution_time, checksum)
            VALUES (?, ?, ?, ?)
          `,
            )
            .run(
              migration.version,
              migration.description,
              executionTime,
              checksum,
            );

          console.log(
            `Migration ${migration.version} completed in ${executionTime}ms`,
          );
        } catch (error) {
          console.error(`Migration ${migration.version} failed:`, error);
          throw error;
        }
      });

      transaction();
    }

    console.log("All migrations completed successfully");
  }

  public async rollback(targetVersion: number): Promise<void> {
    const currentVersion = this.getCurrentVersion();

    if (targetVersion >= currentVersion) {
      console.log("Target version is same or higher than current version");
      return;
    }

    const migrationsToRollback = this.migrations
      .filter((m) => m.version > targetVersion && m.version <= currentVersion)
      .sort((a, b) => b.version - a.version); // 역순으로 롤백

    console.log(`Rolling back ${migrationsToRollback.length} migrations`);

    for (const migration of migrationsToRollback) {
      console.log(
        `Rolling back migration ${migration.version}: ${migration.description}`,
      );

      const transaction = this.db.transaction(() => {
        try {
          migration.down(this.db);
          this.db
            .prepare("DELETE FROM schema_migrations WHERE version = ?")
            .run(migration.version);
          console.log(`Migration ${migration.version} rolled back`);
        } catch (error) {
          console.error(
            `Rollback of migration ${migration.version} failed:`,
            error,
          );
          throw error;
        }
      });

      transaction();
    }

    console.log("Rollback completed successfully");
  }

  private getCurrentVersion(): number {
    try {
      const result = this.db
        .prepare("SELECT MAX(version) as version FROM schema_migrations")
        .get() as { version: number | null };
      return result?.version || 0;
    } catch (error) {
      return 0;
    }
  }

  private calculateChecksum(migration: Migration): string {
    const crypto = require("crypto");
    const content = `${migration.version}${migration.description}${migration.up.toString()}`;
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  public getMigrationStatus(): any[] {
    const appliedMigrations = this.db
      .prepare(
        `
      SELECT version, description, applied_at, execution_time
      FROM schema_migrations
      ORDER BY version
    `,
      )
      .all();

    return this.migrations.map((migration) => {
      const applied = appliedMigrations.find(
        (am) => am.version === migration.version,
      );
      return {
        version: migration.version,
        description: migration.description,
        applied: !!applied,
        appliedAt: applied?.applied_at,
        executionTime: applied?.execution_time,
      };
    });
  }
}
