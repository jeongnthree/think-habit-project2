-- lib/database/migrations/002_create_journal_photos.sql
-- 파일 시스템 개선 마이그레이션

-- journal_files 테이블이 이미 schema.sql에서 생성되므로
-- 추가적인 개선사항들만 적용

-- 파일 썸네일 테이블 생성 (이미지 최적화)
CREATE TABLE IF NOT EXISTS file_thumbnails (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  size TEXT NOT NULL, -- 'small', 'medium', 'large'
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES journal_files (id) ON DELETE CASCADE
);

-- 파일 업로드 진행률 테이블
CREATE TABLE IF NOT EXISTS upload_progress (
  file_id TEXT PRIMARY KEY,
  bytes_uploaded INTEGER DEFAULT 0,
  total_bytes INTEGER NOT NULL,
  upload_speed INTEGER DEFAULT 0, -- bytes per second
  estimated_time_remaining INTEGER DEFAULT 0, -- seconds
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES journal_files (id) ON DELETE CASCADE
);

-- 임시 파일 추적 테이블 (정리용)
CREATE TABLE IF NOT EXISTS temp_files (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  purpose TEXT NOT NULL, -- 'thumbnail', 'upload', 'export' 등
  journal_id TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE
);

-- 파일 썸네일 인덱스
CREATE INDEX IF NOT EXISTS idx_file_thumbnails_file_id ON file_thumbnails(file_id);
CREATE INDEX IF NOT EXISTS idx_file_thumbnails_size ON file_thumbnails(size);

-- 업로드 진행률 인덱스  
CREATE INDEX IF NOT EXISTS idx_upload_progress_updated_at ON upload_progress(updated_at);

-- 임시 파일 인덱스
CREATE INDEX IF NOT EXISTS idx_temp_files_expires_at ON temp_files(expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_files_purpose ON temp_files(purpose);

-- 업로드 진행률 업데이트 트리거
CREATE TRIGGER IF NOT EXISTS trigger_upload_progress_updated_at
  AFTER UPDATE ON upload_progress
  BEGIN
    UPDATE upload_progress SET updated_at = CURRENT_TIMESTAMP WHERE file_id = NEW.file_id;
  END;

-- 파일 삭제 시 관련 데이터 정리 트리거
CREATE TRIGGER IF NOT EXISTS trigger_journal_files_delete_related
  AFTER DELETE ON journal_files
  BEGIN
    DELETE FROM file_thumbnails WHERE file_id = OLD.id;
    DELETE FROM upload_progress WHERE file_id = OLD.id;
    DELETE FROM temp_files WHERE journal_id IN (
      SELECT journal_id FROM journal_files WHERE id = OLD.id
    );
  END;

-- 만료된 임시 파일 정리를 위한 뷰
CREATE VIEW IF NOT EXISTS expired_temp_files AS
SELECT * FROM temp_files 
WHERE expires_at < datetime('now');

-- 파일 업로드 상태별 통계 뷰
CREATE VIEW IF NOT EXISTS file_upload_stats AS
SELECT 
  upload_status,
  COUNT(*) as file_count,
  SUM(file_size) as total_size,
  AVG(file_size) as avg_size,
  MIN(created_at) as oldest_file,
  MAX(created_at) as newest_file
FROM journal_files 
GROUP BY upload_status;

-- 썸네일 생성 상태 뷰
CREATE VIEW IF NOT EXISTS thumbnail_status AS
SELECT 
  jf.id as file_id,
  jf.file_name,
  jf.mime_type,
  jf.file_size,
  COUNT(ft.id) as thumbnail_count,
  GROUP_CONCAT(ft.size) as available_sizes
FROM journal_files jf
LEFT JOIN file_thumbnails ft ON jf.id = ft.file_id
WHERE jf.mime_type LIKE 'image/%'
GROUP BY jf.id, jf.file_name, jf.mime_type, jf.file_size;