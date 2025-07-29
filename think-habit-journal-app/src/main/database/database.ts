// src/main/database/database.ts
import { app } from "electron";
import * as fs from "fs";
import * as path from "path";
import { DatabaseConfig } from "../../shared/types";

// 간단한 메모리 기반 데이터베이스 (better-sqlite3 대신)
export class DatabaseManager {
  private data: { [table: string]: any[] } = {};
  private config: DatabaseConfig;

  constructor(config?: Partial<DatabaseConfig>) {
    this.config = {
      path:
        config?.path || path.join(app.getPath("userData"), "think-habit.json"),
      encrypted: config?.encrypted || false,
      backupPath:
        config?.backupPath || path.join(app.getPath("userData"), "backups"),
    };

    this.initializeTables();
  }

  public async initialize(): Promise<void> {
    try {
      await this.loadData();
      console.log("Database initialized successfully:", this.config.path);
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }

  private initializeTables(): void {
    this.data = {
      users: [],
      journals: [],
      files: [],
    };
  }

  private async loadData(): Promise<void> {
    const dbDir = path.dirname(this.config.path);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    if (fs.existsSync(this.config.path)) {
      try {
        const fileContent = fs.readFileSync(this.config.path, "utf8");
        this.data = JSON.parse(fileContent);
      } catch (error) {
        console.error("Failed to load existing data:", error);
        this.initializeTables();
      }
    }
  }

  public getDatabase(): any {
    return this;
  }

  public close(): void {
    this.saveDatabase();
    console.log("Database connection closed");
  }

  public saveDatabase(): void {
    try {
      const jsonData = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(this.config.path, jsonData, "utf8");
    } catch (error) {
      console.error("Failed to save database:", error);
    }
  }

  // 간단한 쿼리 메서드들
  public insertRecord(table: string, record: any): any {
    if (!this.data[table]) {
      this.data[table] = [];
    }

    const newRecord = {
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      ...record,
    };

    this.data[table].push(newRecord);
    this.saveDatabase();

    return newRecord;
  }

  public getAllRecords(table: string): any[] {
    return this.data[table] || [];
  }

  public getRecordById(table: string, id: string): any | null {
    const records = this.data[table] || [];
    return records.find((record: any) => record.id === id) || null;
  }
}
