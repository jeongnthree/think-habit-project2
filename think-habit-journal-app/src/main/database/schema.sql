-- database/schema.sql
-- Think-Habit Journal 데이터베이스 스키마

-- 사용자 테이블
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT,
    refresh_token TEXT,
    avatar_url TEXT,
    preferences TEXT, -- JSON string
    last_sync DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 저널 테이블
CREATE TABLE journals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('structured', 'photo')),
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- JSON string
    sync_status TEXT NOT NULL DEFAULT 'local' CHECK (sync_status IN ('local', 'synced', 'pending', 'conflict')),
    server_id TEXT,
    server_version INTEGER DEFAULT 0,
    local_version INTEGER DEFAULT 1,
    tags TEXT, -- JSON array string
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    synced_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 파일 메타데이터 테이블
CREATE TABLE file_metadata (
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
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX idx_journals_user_id ON journals(user_id);
CREATE INDEX idx_journals_created_at ON journals(created_at);
CREATE INDEX idx_journals_sync_status ON journals(sync_status);
CREATE INDEX idx_journals_type ON journals(type);
CREATE INDEX idx_file_metadata_journal_id ON file_metadata(journal_id);

-- 트리거: updated_at 자동 업데이트
CREATE TRIGGER update_users_updated_at 
    AFTER UPDATE ON users
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_journals_updated_at 
    AFTER UPDATE ON journals
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE journals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;