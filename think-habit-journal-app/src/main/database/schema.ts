// src/main/database/schema.ts
export const createTableQueries = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      token TEXT,
      refresh_token TEXT,
      avatar_url TEXT,
      preferences TEXT DEFAULT '{}',
      last_sync DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  journals: `
    CREATE TABLE IF NOT EXISTS journals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('structured', 'photo')),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      sync_status TEXT DEFAULT 'local' CHECK (sync_status IN ('local', 'synced', 'pending', 'conflict')),
      server_id TEXT,
      server_version INTEGER DEFAULT 0,
      local_version INTEGER DEFAULT 1,
      tags TEXT DEFAULT '[]',
      is_favorite BOOLEAN DEFAULT FALSE,
      is_archived BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `,

  files: `
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      journal_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      mime_type TEXT,
      server_url TEXT,
      thumbnail_path TEXT,
      upload_status TEXT DEFAULT 'local' CHECK (upload_status IN ('local', 'uploading', 'uploaded', 'failed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE
    )
  `,

  sync_queue: `
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
      data TEXT,
      conflict_data TEXT,
      priority INTEGER DEFAULT 0,
      retry_count INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 3,
      error_message TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME
    )
  `,

  settings: `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  journal_templates: `
    CREATE TABLE IF NOT EXISTS journal_templates (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('structured', 'photo')),
      template_data TEXT NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      is_system BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    )
  `,
};

export const createIndexQueries = [
  "CREATE INDEX IF NOT EXISTS idx_journals_user_id ON journals (user_id)",
  "CREATE INDEX IF NOT EXISTS idx_journals_sync_status ON journals (sync_status)",
  "CREATE INDEX IF NOT EXISTS idx_journals_type ON journals (type)",
  "CREATE INDEX IF NOT EXISTS idx_journals_created_at ON journals (created_at DESC)",
  "CREATE INDEX IF NOT EXISTS idx_journals_updated_at ON journals (updated_at DESC)",
  "CREATE INDEX IF NOT EXISTS idx_journals_server_id ON journals (server_id)",

  "CREATE INDEX IF NOT EXISTS idx_files_journal_id ON files (journal_id)",
  "CREATE INDEX IF NOT EXISTS idx_files_upload_status ON files (upload_status)",

  "CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue (status)",
  "CREATE INDEX IF NOT EXISTS idx_sync_queue_table_record ON sync_queue (table_name, record_id)",
  "CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue (priority DESC, created_at ASC)",

  "CREATE INDEX IF NOT EXISTS idx_journal_templates_user_id ON journal_templates (user_id)",
  "CREATE INDEX IF NOT EXISTS idx_journal_templates_type ON journal_templates (type)",
];

export const createTriggerQueries = [
  `
    CREATE TRIGGER IF NOT EXISTS update_journals_timestamp 
    AFTER UPDATE ON journals
    BEGIN
      UPDATE journals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `,

  `
    CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
    BEGIN
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `,

  `
    CREATE TRIGGER IF NOT EXISTS update_settings_timestamp 
    AFTER UPDATE ON settings
    BEGIN
      UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
    END
  `,

  `
    CREATE TRIGGER IF NOT EXISTS journal_sync_queue_insert
    AFTER INSERT ON journals
    WHEN NEW.sync_status = 'local'
    BEGIN
      INSERT INTO sync_queue (table_name, record_id, operation, data)
      VALUES ('journals', NEW.id, 'create', json_object(
        'id', NEW.id,
        'user_id', NEW.user_id,
        'type', NEW.type,
        'title', NEW.title,
        'content', NEW.content
      ));
    END
  `,

  `
    CREATE TRIGGER IF NOT EXISTS journal_sync_queue_update
    AFTER UPDATE ON journals
    WHEN NEW.sync_status = 'pending' AND OLD.sync_status != 'pending'
    BEGIN
      INSERT INTO sync_queue (table_name, record_id, operation, data)
      VALUES ('journals', NEW.id, 'update', json_object(
        'id', NEW.id,
        'user_id', NEW.user_id,
        'type', NEW.type,
        'title', NEW.title,
        'content', NEW.content
      ));
    END
  `,
];

export const defaultSettings = [
  {
    key: "app_version",
    value: "1.0.0",
    type: "string",
    description: "앱 버전",
  },
  {
    key: "auto_sync",
    value: "true",
    type: "boolean",
    description: "자동 동기화 사용",
  },
  {
    key: "sync_interval",
    value: "300",
    type: "number",
    description: "동기화 간격 (초)",
  },
  {
    key: "offline_mode",
    value: "false",
    type: "boolean",
    description: "오프라인 모드",
  },
  {
    key: "backup_enabled",
    value: "true",
    type: "boolean",
    description: "자동 백업 사용",
  },
  {
    key: "backup_interval",
    value: "24",
    type: "number",
    description: "백업 간격 (시간)",
  },
  {
    key: "image_quality",
    value: "80",
    type: "number",
    description: "이미지 품질 (1-100)",
  },
  {
    key: "max_image_size",
    value: "5",
    type: "number",
    description: "최대 이미지 크기 (MB)",
  },
];
