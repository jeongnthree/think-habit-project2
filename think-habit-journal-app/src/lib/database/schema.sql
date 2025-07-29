-- lib/database/schema.sql
-- Think-Habit Journal App - SQLite 데이터베이스 스키마 정의

-- 사용자 정보 테이블
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  token TEXT,
  refresh_token TEXT,
  avatar_url TEXT,
  preferences TEXT, -- JSON 형태로 저장
  last_sync DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 일지 메인 테이블
CREATE TABLE IF NOT EXISTS journals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('structured', 'photo')),
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- JSON 형태로 저장 (StructuredContent 또는 PhotoContent)
  sync_status TEXT DEFAULT 'local' CHECK (sync_status IN ('local', 'synced', 'pending', 'conflict')),
  server_id TEXT, -- Supabase에서의 ID
  server_version INTEGER DEFAULT 0,
  local_version INTEGER DEFAULT 1,
  tags TEXT, -- JSON 배열 형태로 저장
  is_favorite BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 파일 메타데이터 테이블 (사진 및 첨부파일)
CREATE TABLE IF NOT EXISTS journal_files (
  id TEXT PRIMARY KEY,
  journal_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  mime_type TEXT,
  server_url TEXT, -- 업로드 후 서버 URL
  thumbnail_path TEXT,
  upload_status TEXT DEFAULT 'local' CHECK (upload_status IN ('local', 'uploading', 'uploaded', 'failed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE
);

-- 동기화 로그 테이블
CREATE TABLE IF NOT EXISTS sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_id TEXT,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('upload', 'download', 'conflict_resolution')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  details TEXT, -- JSON 형태로 저장
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE
);

-- 애플리케이션 설정 테이블
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 백업 정보 테이블
CREATE TABLE IF NOT EXISTS backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backup_path TEXT NOT NULL,
  backup_size INTEGER,
  journal_count INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

-- ===== 인덱스 생성 (성능 최적화) =====

-- 일지 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_type ON journals(type);
CREATE INDEX IF NOT EXISTS idx_journals_sync_status ON journals(sync_status);
CREATE INDEX IF NOT EXISTS idx_journals_created_at ON journals(created_at);
CREATE INDEX IF NOT EXISTS idx_journals_updated_at ON journals(updated_at);
CREATE INDEX IF NOT EXISTS idx_journals_is_favorite ON journals(is_favorite);
CREATE INDEX IF NOT EXISTS idx_journals_is_archived ON journals(is_archived);
CREATE INDEX IF NOT EXISTS idx_journals_server_id ON journals(server_id);

-- 복합 인덱스 (자주 사용되는 쿼리 조합)
CREATE INDEX IF NOT EXISTS idx_journals_user_type ON journals(user_id, type);
CREATE INDEX IF NOT EXISTS idx_journals_user_sync ON journals(user_id, sync_status);
CREATE INDEX IF NOT EXISTS idx_journals_user_created ON journals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journals_user_favorite ON journals(user_id, is_favorite);

-- 파일 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_journal_files_journal_id ON journal_files(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_files_upload_status ON journal_files(upload_status);
CREATE INDEX IF NOT EXISTS idx_journal_files_created_at ON journal_files(created_at);

-- 동기화 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_sync_logs_journal_id ON sync_logs(journal_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at);

-- 사용자 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_sync ON users(last_sync);

-- ===== 트리거 생성 (자동 업데이트) =====

-- 일지 수정 시 updated_at 자동 업데이트
CREATE TRIGGER IF NOT EXISTS trigger_journals_updated_at
  AFTER UPDATE ON journals
  BEGIN
    UPDATE journals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- 사용자 수정 시 updated_at 자동 업데이트
CREATE TRIGGER IF NOT EXISTS trigger_users_updated_at
  AFTER UPDATE ON users
  BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- 설정 수정 시 updated_at 자동 업데이트
CREATE TRIGGER IF NOT EXISTS trigger_app_settings_updated_at
  AFTER UPDATE ON app_settings
  BEGIN
    UPDATE app_settings SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
  END;

-- 일지 삭제 시 관련 파일도 함께 삭제 (외래키 제약조건과 중복이지만 명시적으로)
CREATE TRIGGER IF NOT EXISTS trigger_journals_delete_files
  AFTER DELETE ON journals
  BEGIN
    DELETE FROM journal_files WHERE journal_id = OLD.id;
    DELETE FROM sync_logs WHERE journal_id = OLD.id;
  END;

-- ===== 기본 데이터 삽입 =====

-- 기본 애플리케이션 설정
INSERT OR IGNORE INTO app_settings (key, value) VALUES 
  ('auto_sync', 'true'),
  ('sync_interval', '30'),
  ('auto_backup', 'true'),
  ('backup_interval', '24'),
  ('max_backups', '7'),
  ('theme', 'system'),
  ('language', 'ko'),
  ('notification_sync_complete', 'true'),
  ('notification_reminder_enabled', 'false'),
  ('notification_reminder_time', '20:00'),
  ('max_file_size', '10485760'), -- 10MB
  ('supported_image_types', '["image/jpeg","image/jpg","image/png","image/webp","image/gif"]'),
  ('database_version', '1.0.0');

-- ===== 뷰 생성 (자주 사용되는 쿼리 최적화) =====

-- 사용자별 일지 통계 뷰
CREATE VIEW IF NOT EXISTS user_journal_stats AS
SELECT 
  u.id as user_id,
  u.name as user_name,
  COUNT(j.id) as total_journals,
  COUNT(CASE WHEN j.type = 'structured' THEN 1 END) as structured_journals,
  COUNT(CASE WHEN j.type = 'photo' THEN 1 END) as photo_journals,
  COUNT(CASE WHEN j.is_favorite = 1 THEN 1 END) as favorite_journals,
  COUNT(CASE WHEN j.is_archived = 1 THEN 1 END) as archived_journals,
  COUNT(CASE WHEN j.sync_status = 'local' THEN 1 END) as unsynced_journals,
  COUNT(CASE WHEN j.created_at >= date('now', '-7 days') THEN 1 END) as weekly_journals,
  COUNT(CASE WHEN j.created_at >= date('now', '-30 days') THEN 1 END) as monthly_journals,
  MAX(j.created_at) as last_journal_date,
  u.last_sync
FROM users u
LEFT JOIN journals j ON u.id = j.user_id AND j.is_archived = 0
GROUP BY u.id, u.name, u.last_sync;

-- 최근 일지 뷰 (미리보기용)
CREATE VIEW IF NOT EXISTS recent_journals AS
SELECT 
  j.id,
  j.user_id,
  j.type,
  j.title,
  j.sync_status,
  j.is_favorite,
  j.created_at,
  j.updated_at,
  CASE 
    WHEN j.type = 'structured' THEN 
      (SELECT COUNT(*) FROM json_each(json_extract(j.content, '$.tasks')) WHERE json_extract(value, '$.completed') = 1) || '/' ||
      (SELECT COUNT(*) FROM json_each(json_extract(j.content, '$.tasks'))) || ' 완료'
    WHEN j.type = 'photo' THEN 
      (SELECT COUNT(*) FROM json_each(json_extract(j.content, '$.photos'))) || '개 사진'
    ELSE ''
  END as preview,
  substr(
    CASE 
      WHEN j.type = 'structured' THEN json_extract(j.content, '$.notes')
      WHEN j.type = 'photo' THEN json_extract(j.content, '$.description')
      ELSE ''
    END, 1, 100
  ) as content_preview
FROM journals j
WHERE j.is_archived = 0
ORDER BY j.updated_at DESC;

-- ===== PRAGMA 설정 (성능 및 안정성) =====

-- 외래키 제약조건 활성화
PRAGMA foreign_keys = ON;

-- WAL 모드 활성화 (동시성 향상)
PRAGMA journal_mode = WAL;

-- 동기화 모드 설정 (안정성과 성능의 균형)
PRAGMA synchronous = NORMAL;

-- 캐시 크기 설정 (메모리 사용량 조절)
PRAGMA cache_size = -64000; -- 64MB

-- 임시 저장소를 메모리에 설정
PRAGMA temp_store = MEMORY;