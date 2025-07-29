// import { Database } from 'better-sqlite3';  // 기존 주석 처리된 줄
// import { Database } from 'better-sqlite3';
import { Database, FileMetadata, Journal, User } from "../../shared/types";
// 나머지 코드는 그대로...
// src/main/database/queries.ts
//import { Database } from "better-sqlite3";
//import { FileMetadata, Journal, User } from "../../shared/types";

export class DatabaseQueries {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // Users 관련 쿼리
  public insertUser(user: Omit<User, "createdAt">): User {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, name, token, refresh_token, avatar_url, preferences)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      user.id,
      user.email,
      user.name,
      user.token || null,
      user.refreshToken || null,
      user.avatarUrl || null,
      JSON.stringify(user.preferences || {}),
    );

    return this.getUserById(user.id)!;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const setClause = Object.keys(updates)
      .filter((key) => key !== "id" && key !== "createdAt")
      .map((key) => `${this.camelToSnake(key)} = ?`)
      .join(", ");

    if (!setClause) return this.getUserById(id);

    const values = Object.entries(updates)
      .filter(([key]) => key !== "id" && key !== "createdAt")
      .map(([key, value]) => {
        if (key === "preferences") return JSON.stringify(value);
        return value;
      });

    const stmt = this.db.prepare(`
      UPDATE users 
      SET ${setClause}
      WHERE id = ?
    `);

    stmt.run(...values, id);
    return this.getUserById(id);
  }

  public getUserById(id: string): User | null {
    const stmt = this.db.prepare("SELECT * FROM users WHERE id = ?");
    const row = stmt.get(id) as any;
    return row ? this.mapRowToUser(row) : null;
  }

  public getUserByEmail(email: string): User | null {
    const stmt = this.db.prepare("SELECT * FROM users WHERE email = ?");
    const row = stmt.get(email) as any;
    return row ? this.mapRowToUser(row) : null;
  }

  public deleteUser(id: string): boolean {
    const stmt = this.db.prepare("DELETE FROM users WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Journals 관련 쿼리
  public insertJournal(
    journal: Omit<Journal, "createdAt" | "updatedAt">,
  ): Journal {
    const stmt = this.db.prepare(`
      INSERT INTO journals (
        id, user_id, type, title, content, sync_status, server_id, 
        server_version, local_version, tags, is_favorite, is_archived
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      journal.id,
      journal.userId,
      journal.type,
      journal.title,
      JSON.stringify(journal.content),
      journal.syncStatus || "local",
      journal.serverId || null,
      journal.serverVersion || 0,
      journal.localVersion || 1,
      JSON.stringify(journal.tags || []),
      journal.isFavorite || false,
      journal.isArchived || false,
    );

    return this.getJournalById(journal.id)!;
  }

  public updateJournal(id: string, updates: Partial<Journal>): Journal | null {
    const setClause = Object.keys(updates)
      .filter((key) => key !== "id" && key !== "createdAt")
      .map((key) => `${this.camelToSnake(key)} = ?`)
      .join(", ");

    if (!setClause) return this.getJournalById(id);

    const values = Object.entries(updates)
      .filter(([key]) => key !== "id" && key !== "createdAt")
      .map(([key, value]) => {
        if (key === "content" || key === "tags") return JSON.stringify(value);
        return value;
      });

    const stmt = this.db.prepare(`
      UPDATE journals 
      SET ${setClause}
      WHERE id = ?
    `);

    stmt.run(...values, id);
    return this.getJournalById(id);
  }

  public getJournalById(id: string): Journal | null {
    const stmt = this.db.prepare("SELECT * FROM journals WHERE id = ?");
    const row = stmt.get(id) as any;
    return row ? this.mapRowToJournal(row) : null;
  }

  public getJournalsByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: "structured" | "photo";
      archived?: boolean;
      favorite?: boolean;
    },
  ): Journal[] {
    let query = "SELECT * FROM journals WHERE user_id = ?";
    const params: any[] = [userId];

    if (options?.type) {
      query += " AND type = ?";
      params.push(options.type);
    }

    if (options?.archived !== undefined) {
      query += " AND is_archived = ?";
      params.push(options.archived);
    }

    if (options?.favorite !== undefined) {
      query += " AND is_favorite = ?";
      params.push(options.favorite);
    }

    query += " ORDER BY created_at DESC";

    if (options?.limit) {
      query += " LIMIT ?";
      params.push(options.limit);

      if (options?.offset) {
        query += " OFFSET ?";
        params.push(options.offset);
      }
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map((row) => this.mapRowToJournal(row));
  }

  public getUnsyncedJournals(): Journal[] {
    const stmt = this.db.prepare(`
      SELECT * FROM journals 
      WHERE sync_status IN ('local', 'pending') 
      ORDER BY created_at ASC
    `);
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToJournal(row));
  }

  public deleteJournal(id: string): boolean {
    const stmt = this.db.prepare("DELETE FROM journals WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  public searchJournals(
    userId: string,
    searchTerm: string,
    options?: {
      type?: "structured" | "photo";
      limit?: number;
    },
  ): Journal[] {
    let query = `
      SELECT * FROM journals 
      WHERE user_id = ? AND (
        title LIKE ? OR 
        json_extract(content, '$.notes') LIKE ? OR
        json_extract(content, '$.description') LIKE ?
      )
    `;

    const searchPattern = `%${searchTerm}%`;
    const params: any[] = [userId, searchPattern, searchPattern, searchPattern];

    if (options?.type) {
      query += " AND type = ?";
      params.push(options.type);
    }

    query += " ORDER BY created_at DESC";

    if (options?.limit) {
      query += " LIMIT ?";
      params.push(options.limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map((row) => this.mapRowToJournal(row));
  }

  // Files 관련 쿼리
  public insertFile(file: Omit<FileMetadata, "createdAt">): FileMetadata {
    const stmt = this.db.prepare(`
      INSERT INTO files (
        id, journal_id, file_path, file_name, file_size, 
        file_type, mime_type, server_url, thumbnail_path, upload_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      file.id,
      file.journalId,
      file.filePath,
      file.fileName,
      file.fileSize,
      file.fileType,
      file.mimeType || null,
      file.serverUrl || null,
      file.thumbnailPath || null,
      file.uploadStatus || "local",
    );

    return this.getFileById(file.id)!;
  }

  public getFileById(id: string): FileMetadata | null {
    const stmt = this.db.prepare("SELECT * FROM files WHERE id = ?");
    const row = stmt.get(id) as any;
    return row ? this.mapRowToFile(row) : null;
  }

  public getFilesByJournalId(journalId: string): FileMetadata[] {
    const stmt = this.db.prepare(
      "SELECT * FROM files WHERE journal_id = ? ORDER BY created_at ASC",
    );
    const rows = stmt.all(journalId) as any[];
    return rows.map((row) => this.mapRowToFile(row));
  }

  public updateFileUploadStatus(
    id: string,
    status: string,
    serverUrl?: string,
  ): boolean {
    const stmt = this.db.prepare(`
      UPDATE files 
      SET upload_status = ?, server_url = ?
      WHERE id = ?
    `);
    const result = stmt.run(status, serverUrl || null, id);
    return result.changes > 0;
  }

  public deleteFile(id: string): boolean {
    const stmt = this.db.prepare("DELETE FROM files WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // 범용 메서드
  public executeRaw(sql: string, params?: any[]): any {
    const stmt = this.db.prepare(sql);
    return params ? stmt.all(...params) : stmt.all();
  }

  public insertRecord(table: string, data: object): any {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => "?").join(", ");
    const stmt = this.db.prepare(
      `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
    );
    return stmt.run(...Object.values(data));
  }

  public updateRecord(table: string, data: object, where: object): any {
    const setClause = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    const whereClause = Object.keys(where)
      .map((key) => `${key} = ?`)
      .join(" AND ");
    const stmt = this.db.prepare(
      `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`,
    );
    return stmt.run(...Object.values(data), ...Object.values(where));
  }

  public deleteRecord(table: string, where: object): any {
    const whereClause = Object.keys(where)
      .map((key) => `${key} = ?`)
      .join(" AND ");
    const stmt = this.db.prepare(`DELETE FROM ${table} WHERE ${whereClause}`);
    return stmt.run(...Object.values(where));
  }

  // Helper methods
  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      token: row.token,
      refreshToken: row.refresh_token,
      avatarUrl: row.avatar_url,
      preferences: row.preferences ? JSON.parse(row.preferences) : {},
      lastSync: row.last_sync ? new Date(row.last_sync) : undefined,
      createdAt: new Date(row.created_at),
    };
  }

  private mapRowToJournal(row: any): Journal {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      content: JSON.parse(row.content),
      syncStatus: row.sync_status,
      serverId: row.server_id,
      serverVersion: row.server_version,
      localVersion: row.local_version,
      tags: row.tags ? JSON.parse(row.tags) : [],
      isFavorite: Boolean(row.is_favorite),
      isArchived: Boolean(row.is_archived),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      syncedAt: row.synced_at ? new Date(row.synced_at) : undefined,
    };
  }

  private mapRowToFile(row: any): FileMetadata {
    return {
      id: row.id,
      journalId: row.journal_id,
      filePath: row.file_path,
      fileName: row.file_name,
      fileSize: row.file_size,
      fileType: row.file_type,
      mimeType: row.mime_type,
      serverUrl: row.server_url,
      thumbnailPath: row.thumbnail_path,
      uploadStatus: row.upload_status,
      createdAt: new Date(row.created_at),
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}
