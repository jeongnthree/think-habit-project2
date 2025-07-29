import Database from "better-sqlite3";
import { GroupInfo } from "./GroupManagementService";
import {
  JournalPlatformConfig,
  PlatformSyncStatus,
} from "./MultiPlatformSyncService";
import { SyncConfig, Template } from "./platforms/PlatformAdapter";

// Platform configuration interface
export interface PlatformConfigData {
  id: string;
  name: string;
  type: "think-habit" | "group";
  isEnabled: boolean;
  authConfig: any;
  syncConfig: SyncConfig;
  apiEndpoint?: string;
  customHeaders?: Record<string, string>;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Sync queue item interface
export interface SyncQueueItem {
  id: string;
  journalId: string;
  platformId: string;
  priority: "low" | "normal" | "high";
  retryCount: number;
  maxRetries: number;
  scheduledAt: Date;
  lastAttempt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

export class MultiPlatformDatabaseService {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    // Read and execute the schema file
    // In a real implementation, you would read the SQL file and execute it
    // For now, we'll define the essential tables inline

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS platform_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('think-habit', 'group')),
        is_enabled BOOLEAN DEFAULT TRUE,
        auth_config TEXT NOT NULL,
        sync_config TEXT NOT NULL,
        api_endpoint TEXT,
        custom_headers TEXT,
        last_sync_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS platform_templates (
        id TEXT PRIMARY KEY,
        platform_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK (type IN ('structured', 'photo')),
        template_data TEXT NOT NULL,
        version TEXT DEFAULT '1.0.0',
        is_default BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (platform_id) REFERENCES platform_configs (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS journal_platform_status (
        journal_id TEXT NOT NULL,
        platform_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'syncing', 'synced', 'failed')),
        last_attempt DATETIME,
        last_success DATETIME,
        error_message TEXT,
        error_type TEXT,
        retry_count INTEGER DEFAULT 0,
        platform_journal_id TEXT,
        platform_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (journal_id, platform_id)
      );

      CREATE TABLE IF NOT EXISTS journal_platform_configs (
        journal_id TEXT NOT NULL,
        platform_id TEXT NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        privacy TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'private', 'group-only')),
        custom_title TEXT,
        content_filter TEXT,
        tags TEXT,
        priority INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (journal_id, platform_id)
      );

      CREATE TABLE IF NOT EXISTS group_info (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        api_endpoint TEXT NOT NULL,
        auth_type TEXT NOT NULL CHECK (auth_type IN ('oauth', 'api-key', 'custom')),
        features TEXT,
        membership_status TEXT DEFAULT 'active' CHECK (membership_status IN ('pending', 'active', 'inactive')),
        member_count INTEGER,
        admin_contact TEXT,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        journal_id TEXT NOT NULL,
        platform_id TEXT NOT NULL,
        priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_attempt DATETIME,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_platform_configs_type ON platform_configs(type);
      CREATE INDEX IF NOT EXISTS idx_platform_configs_enabled ON platform_configs(is_enabled);
      CREATE INDEX IF NOT EXISTS idx_journal_platform_status_journal ON journal_platform_status(journal_id);
      CREATE INDEX IF NOT EXISTS idx_journal_platform_status_status ON journal_platform_status(status);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue(priority);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_scheduled ON sync_queue(scheduled_at);
    `);
  }

  // Platform Configuration Methods
  async savePlatformConfig(config: PlatformConfigData): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO platform_configs 
      (id, name, type, is_enabled, auth_config, sync_config, api_endpoint, custom_headers, last_sync_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      config.id,
      config.name,
      config.type,
      config.isEnabled,
      JSON.stringify(config.authConfig),
      JSON.stringify(config.syncConfig),
      config.apiEndpoint,
      config.customHeaders ? JSON.stringify(config.customHeaders) : null,
      config.lastSyncAt?.toISOString(),
    );
  }

  async getPlatformConfig(
    platformId: string,
  ): Promise<PlatformConfigData | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM platform_configs WHERE id = ?
    `);

    const row = stmt.get(platformId) as any;
    if (!row) return null;

    return this.mapPlatformConfigRow(row);
  }

  async getAllPlatformConfigs(): Promise<PlatformConfigData[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM platform_configs ORDER BY created_at
    `);

    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapPlatformConfigRow(row));
  }

  async deletePlatformConfig(platformId: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM platform_configs WHERE id = ?
    `);

    stmt.run(platformId);
  }

  // Template Methods
  async saveTemplates(
    platformId: string,
    templates: Template[],
  ): Promise<void> {
    const deleteStmt = this.db.prepare(`
      DELETE FROM platform_templates WHERE platform_id = ?
    `);

    const insertStmt = this.db.prepare(`
      INSERT INTO platform_templates 
      (id, platform_id, name, description, type, template_data, version, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      deleteStmt.run(platformId);

      for (const template of templates) {
        insertStmt.run(
          template.id,
          platformId,
          template.name,
          template.description,
          template.type,
          JSON.stringify(template.content),
          template.version,
          template.isDefault,
        );
      }
    });

    transaction();
  }

  async getTemplates(platformId?: string): Promise<Template[]> {
    let stmt;
    let params: any[] = [];

    if (platformId) {
      stmt = this.db.prepare(`
        SELECT * FROM platform_templates WHERE platform_id = ? ORDER BY is_default DESC, name
      `);
      params = [platformId];
    } else {
      stmt = this.db.prepare(`
        SELECT * FROM platform_templates ORDER BY platform_id, is_default DESC, name
      `);
    }

    const rows = stmt.all(...params) as any[];
    return rows.map((row) => this.mapTemplateRow(row));
  }

  // Journal Platform Status Methods
  async saveSyncStatus(
    journalId: string,
    platformId: string,
    status: PlatformSyncStatus,
  ): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO journal_platform_status 
      (journal_id, platform_id, status, last_attempt, last_success, error_message, error_type, 
       retry_count, platform_journal_id, platform_url, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      journalId,
      platformId,
      status.status,
      status.lastAttempt?.toISOString(),
      status.lastSuccess?.toISOString(),
      status.error?.message,
      status.error?.type,
      status.retryCount,
      status.platformJournalId,
      status.platformUrl,
    );
  }

  async getSyncStatus(
    journalId: string,
    platformId?: string,
  ): Promise<Map<string, PlatformSyncStatus>> {
    let stmt;
    let params: any[] = [journalId];

    if (platformId) {
      stmt = this.db.prepare(`
        SELECT * FROM journal_platform_status WHERE journal_id = ? AND platform_id = ?
      `);
      params.push(platformId);
    } else {
      stmt = this.db.prepare(`
        SELECT * FROM journal_platform_status WHERE journal_id = ?
      `);
    }

    const rows = stmt.all(...params) as any[];
    const statusMap = new Map<string, PlatformSyncStatus>();

    for (const row of rows) {
      statusMap.set(row.platform_id, this.mapSyncStatusRow(row));
    }

    return statusMap;
  }

  // Journal Platform Config Methods
  async saveJournalPlatformConfig(
    journalId: string,
    platformId: string,
    config: JournalPlatformConfig,
  ): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO journal_platform_configs 
      (journal_id, platform_id, enabled, privacy, custom_title, content_filter, tags, priority, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      journalId,
      platformId,
      config.enabled,
      config.privacy,
      config.customTitle,
      JSON.stringify(config.contentFilter),
      JSON.stringify(config.tags),
      config.priority,
    );
  }

  async getJournalPlatformConfigs(
    journalId: string,
  ): Promise<Map<string, JournalPlatformConfig>> {
    const stmt = this.db.prepare(`
      SELECT * FROM journal_platform_configs WHERE journal_id = ?
    `);

    const rows = stmt.all(journalId) as any[];
    const configMap = new Map<string, JournalPlatformConfig>();

    for (const row of rows) {
      configMap.set(row.platform_id, this.mapJournalPlatformConfigRow(row));
    }

    return configMap;
  }

  // Group Info Methods
  async saveGroupInfo(groupInfo: GroupInfo): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO group_info 
      (id, name, description, api_endpoint, auth_type, features, membership_status, 
       member_count, admin_contact, joined_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      groupInfo.id,
      groupInfo.name,
      groupInfo.description,
      groupInfo.apiEndpoint,
      groupInfo.authType,
      JSON.stringify(groupInfo.features),
      groupInfo.membershipStatus,
      groupInfo.memberCount,
      groupInfo.adminContact,
      groupInfo.joinedAt?.toISOString(),
    );
  }

  async getGroupInfo(groupId: string): Promise<GroupInfo | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM group_info WHERE id = ?
    `);

    const row = stmt.get(groupId) as any;
    if (!row) return null;

    return this.mapGroupInfoRow(row);
  }

  async getAllGroupInfo(): Promise<GroupInfo[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM group_info ORDER BY joined_at DESC
    `);

    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapGroupInfoRow(row));
  }

  async deleteGroupInfo(groupId: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM group_info WHERE id = ?
    `);

    stmt.run(groupId);
  }

  // Sync Queue Methods
  async addToSyncQueue(
    item: Omit<SyncQueueItem, "id" | "createdAt">,
  ): Promise<string> {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = this.db.prepare(`
      INSERT INTO sync_queue 
      (id, journal_id, platform_id, priority, retry_count, max_retries, scheduled_at, last_attempt, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      item.journalId,
      item.platformId,
      item.priority,
      item.retryCount,
      item.maxRetries,
      item.scheduledAt.toISOString(),
      item.lastAttempt?.toISOString(),
      item.errorMessage,
    );

    return id;
  }

  async getSyncQueue(limit?: number): Promise<SyncQueueItem[]> {
    let sql = `
      SELECT * FROM sync_queue 
      WHERE scheduled_at <= CURRENT_TIMESTAMP 
      ORDER BY priority DESC, scheduled_at ASC
    `;

    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapSyncQueueRow(row));
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM sync_queue WHERE id = ?
    `);

    stmt.run(id);
  }

  async updateSyncQueueItem(
    id: string,
    updates: Partial<SyncQueueItem>,
  ): Promise<void> {
    const fields = [];
    const values = [];

    if (updates.retryCount !== undefined) {
      fields.push("retry_count = ?");
      values.push(updates.retryCount);
    }

    if (updates.lastAttempt !== undefined) {
      fields.push("last_attempt = ?");
      values.push(updates.lastAttempt.toISOString());
    }

    if (updates.errorMessage !== undefined) {
      fields.push("error_message = ?");
      values.push(updates.errorMessage);
    }

    if (updates.scheduledAt !== undefined) {
      fields.push("scheduled_at = ?");
      values.push(updates.scheduledAt.toISOString());
    }

    if (fields.length === 0) return;

    const sql = `UPDATE sync_queue SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);

    const stmt = this.db.prepare(sql);
    stmt.run(...values);
  }

  // Helper methods for mapping database rows to objects
  private mapPlatformConfigRow(row: any): PlatformConfigData {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      isEnabled: Boolean(row.is_enabled),
      authConfig: JSON.parse(row.auth_config),
      syncConfig: JSON.parse(row.sync_config),
      apiEndpoint: row.api_endpoint,
      customHeaders: row.custom_headers
        ? JSON.parse(row.custom_headers)
        : undefined,
      lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapTemplateRow(row: any): Template {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      content: JSON.parse(row.template_data),
      version: row.version,
      platformId: row.platform_id,
      platformName: "", // Will be filled by the service
      isDefault: Boolean(row.is_default),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapSyncStatusRow(row: any): PlatformSyncStatus {
    return {
      platformId: row.platform_id,
      status: row.status,
      lastAttempt: row.last_attempt ? new Date(row.last_attempt) : undefined,
      lastSuccess: row.last_success ? new Date(row.last_success) : undefined,
      error: row.error_message
        ? {
            type: row.error_type,
            message: row.error_message,
            retryable: true, // Default, should be determined by error type
          }
        : undefined,
      retryCount: row.retry_count,
      platformJournalId: row.platform_journal_id,
      platformUrl: row.platform_url,
    };
  }

  private mapJournalPlatformConfigRow(row: any): JournalPlatformConfig {
    return {
      platformId: row.platform_id,
      enabled: Boolean(row.enabled),
      privacy: row.privacy,
      autoSync: true, // Default value
      contentFilter: JSON.parse(row.content_filter),
      customTitle: row.custom_title,
      tags: JSON.parse(row.tags),
      priority: row.priority,
    };
  }

  private mapGroupInfoRow(row: any): GroupInfo {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      apiEndpoint: row.api_endpoint,
      authType: row.auth_type,
      features: JSON.parse(row.features),
      membershipStatus: row.membership_status,
      joinedAt: row.joined_at ? new Date(row.joined_at) : undefined,
      memberCount: row.member_count,
      adminContact: row.admin_contact,
    };
  }

  private mapSyncQueueRow(row: any): SyncQueueItem {
    return {
      id: row.id,
      journalId: row.journal_id,
      platformId: row.platform_id,
      priority: row.priority,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      scheduledAt: new Date(row.scheduled_at),
      lastAttempt: row.last_attempt ? new Date(row.last_attempt) : undefined,
      errorMessage: row.error_message,
      createdAt: new Date(row.created_at),
    };
  }

  // Cleanup and maintenance
  async cleanupOldSyncQueue(olderThanDays: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const stmt = this.db.prepare(`
      DELETE FROM sync_queue 
      WHERE created_at < ? AND retry_count >= max_retries
    `);

    stmt.run(cutoffDate.toISOString());
  }

  async getStatistics(): Promise<{
    totalPlatforms: number;
    activePlatforms: number;
    totalGroups: number;
    activeGroups: number;
    queueSize: number;
    failedSyncs: number;
  }> {
    const stats = {
      totalPlatforms: 0,
      activePlatforms: 0,
      totalGroups: 0,
      activeGroups: 0,
      queueSize: 0,
      failedSyncs: 0,
    };

    // Platform stats
    const platformStats = this.db
      .prepare(
        `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_enabled = 1 THEN 1 END) as active
      FROM platform_configs
    `,
      )
      .get() as any;

    stats.totalPlatforms = platformStats.total;
    stats.activePlatforms = platformStats.active;

    // Group stats
    const groupStats = this.db
      .prepare(
        `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN membership_status = 'active' THEN 1 END) as active
      FROM group_info
    `,
      )
      .get() as any;

    stats.totalGroups = groupStats.total;
    stats.activeGroups = groupStats.active;

    // Queue stats
    const queueStats = this.db
      .prepare(
        `
      SELECT COUNT(*) as size FROM sync_queue
    `,
      )
      .get() as any;

    stats.queueSize = queueStats.size;

    // Failed sync stats
    const failedStats = this.db
      .prepare(
        `
      SELECT COUNT(*) as failed FROM journal_platform_status WHERE status = 'failed'
    `,
      )
      .get() as any;

    stats.failedSyncs = failedStats.failed;

    return stats;
  }

  close(): void {
    this.db.close();
  }
}
