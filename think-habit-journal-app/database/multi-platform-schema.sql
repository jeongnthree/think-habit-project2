-- Multi-Platform Sync Database Schema Extensions

-- Platform configurations table
CREATE TABLE IF NOT EXISTS platform_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('think-habit', 'group')),
  is_enabled BOOLEAN DEFAULT TRUE,
  auth_config TEXT NOT NULL, -- JSON string containing auth configuration
  sync_config TEXT NOT NULL, -- JSON string containing sync configuration
  api_endpoint TEXT,
  custom_headers TEXT, -- JSON string for custom HTTP headers
  last_sync_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Platform templates table
CREATE TABLE IF NOT EXISTS platform_templates (
  id TEXT PRIMARY KEY,
  platform_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('structured', 'photo')),
  template_data TEXT NOT NULL, -- JSON string containing template structure
  version TEXT DEFAULT '1.0.0',
  is_default BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (platform_id) REFERENCES platform_configs (id) ON DELETE CASCADE
);

-- Journal platform status table (tracks sync status per platform)
CREATE TABLE IF NOT EXISTS journal_platform_status (
  journal_id TEXT NOT NULL,
  platform_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'syncing', 'synced', 'failed')),
  last_attempt DATETIME,
  last_success DATETIME,
  error_message TEXT,
  error_type TEXT,
  retry_count INTEGER DEFAULT 0,
  platform_journal_id TEXT, -- ID on the target platform
  platform_url TEXT, -- URL on the target platform
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (journal_id, platform_id),
  FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE,
  FOREIGN KEY (platform_id) REFERENCES platform_configs (id) ON DELETE CASCADE
);

-- Journal platform configurations (per-journal platform settings)
CREATE TABLE IF NOT EXISTS journal_platform_configs (
  journal_id TEXT NOT NULL,
  platform_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  privacy TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'private', 'group-only')),
  custom_title TEXT,
  content_filter TEXT, -- JSON string containing filter rules
  tags TEXT, -- JSON array of tags
  priority INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (journal_id, platform_id),
  FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE,
  FOREIGN KEY (platform_id) REFERENCES platform_configs (id) ON DELETE CASCADE
);

-- Group information table
CREATE TABLE IF NOT EXISTS group_info (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  api_endpoint TEXT NOT NULL,
  auth_type TEXT NOT NULL CHECK (auth_type IN ('oauth', 'api-key', 'custom')),
  features TEXT, -- JSON array of supported features
  membership_status TEXT DEFAULT 'active' CHECK (membership_status IN ('pending', 'active', 'inactive')),
  member_count INTEGER,
  admin_contact TEXT,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sync queue table (for retry and offline sync)
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE,
  FOREIGN KEY (platform_id) REFERENCES platform_configs (id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_configs_type ON platform_configs(type);
CREATE INDEX IF NOT EXISTS idx_platform_configs_enabled ON platform_configs(is_enabled);
CREATE INDEX IF NOT EXISTS idx_platform_templates_platform ON platform_templates(platform_id);
CREATE INDEX IF NOT EXISTS idx_platform_templates_type ON platform_templates(type);
CREATE INDEX IF NOT EXISTS idx_journal_platform_status_journal ON journal_platform_status(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_platform_status_platform ON journal_platform_status(platform_id);
CREATE INDEX IF NOT EXISTS idx_journal_platform_status_status ON journal_platform_status(status);
CREATE INDEX IF NOT EXISTS idx_journal_platform_configs_journal ON journal_platform_configs(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_platform_configs_platform ON journal_platform_configs(platform_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue(priority);
CREATE INDEX IF NOT EXISTS idx_sync_queue_scheduled ON sync_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_group_info_status ON group_info(membership_status);

-- Triggers to update timestamps
CREATE TRIGGER IF NOT EXISTS update_platform_configs_timestamp 
  AFTER UPDATE ON platform_configs
  BEGIN
    UPDATE platform_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_platform_templates_timestamp 
  AFTER UPDATE ON platform_templates
  BEGIN
    UPDATE platform_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_journal_platform_status_timestamp 
  AFTER UPDATE ON journal_platform_status
  BEGIN
    UPDATE journal_platform_status SET updated_at = CURRENT_TIMESTAMP 
    WHERE journal_id = NEW.journal_id AND platform_id = NEW.platform_id;
  END;

CREATE TRIGGER IF NOT EXISTS update_journal_platform_configs_timestamp 
  AFTER UPDATE ON journal_platform_configs
  BEGIN
    UPDATE journal_platform_configs SET updated_at = CURRENT_TIMESTAMP 
    WHERE journal_id = NEW.journal_id AND platform_id = NEW.platform_id;
  END;

CREATE TRIGGER IF NOT EXISTS update_group_info_timestamp 
  AFTER UPDATE ON group_info
  BEGIN
    UPDATE group_info SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Insert default Think-Habit platform configuration
INSERT OR IGNORE INTO platform_configs (
  id, 
  name, 
  type, 
  is_enabled, 
  auth_config, 
  sync_config,
  api_endpoint
) VALUES (
  'think-habit',
  'Think-Habit',
  'think-habit',
  TRUE,
  '{"endpoint": "https://api.think-habit.com", "authType": "oauth"}',
  '{"autoSync": true, "privacy": "public", "contentFilter": {"excludePersonalNotes": false, "excludePhotos": false, "excludeTags": [], "customRules": []}}',
  'https://api.think-habit.com'
);

-- Views for easier querying
CREATE VIEW IF NOT EXISTS v_platform_sync_summary AS
SELECT 
  p.id as platform_id,
  p.name as platform_name,
  p.type as platform_type,
  p.is_enabled,
  COUNT(jps.journal_id) as total_journals,
  COUNT(CASE WHEN jps.status = 'synced' THEN 1 END) as synced_count,
  COUNT(CASE WHEN jps.status = 'failed' THEN 1 END) as failed_count,
  COUNT(CASE WHEN jps.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN jps.status = 'syncing' THEN 1 END) as syncing_count,
  MAX(jps.last_success) as last_sync_success
FROM platform_configs p
LEFT JOIN journal_platform_status jps ON p.id = jps.platform_id
GROUP BY p.id, p.name, p.type, p.is_enabled;

CREATE VIEW IF NOT EXISTS v_journal_sync_status AS
SELECT 
  j.id as journal_id,
  j.title,
  j.type as journal_type,
  j.created_at,
  COUNT(jps.platform_id) as total_platforms,
  COUNT(CASE WHEN jps.status = 'synced' THEN 1 END) as synced_platforms,
  COUNT(CASE WHEN jps.status = 'failed' THEN 1 END) as failed_platforms,
  COUNT(CASE WHEN jps.status = 'pending' THEN 1 END) as pending_platforms,
  CASE 
    WHEN COUNT(CASE WHEN jps.status = 'failed' THEN 1 END) > 0 THEN 'failed'
    WHEN COUNT(CASE WHEN jps.status = 'pending' THEN 1 END) > 0 THEN 'pending'
    WHEN COUNT(CASE WHEN jps.status = 'syncing' THEN 1 END) > 0 THEN 'syncing'
    WHEN COUNT(CASE WHEN jps.status = 'synced' THEN 1 END) = COUNT(jps.platform_id) THEN 'synced'
    ELSE 'unknown'
  END as overall_status
FROM journals j
LEFT JOIN journal_platform_status jps ON j.id = jps.journal_id
LEFT JOIN platform_configs p ON jps.platform_id = p.id AND p.is_enabled = TRUE
GROUP BY j.id, j.title, j.type, j.created_at;