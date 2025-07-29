-- lib/database/migrations/001_create_journals.sql
-- 초기 일지 테이블 생성 마이그레이션

-- 기본 일지 테이블이 이미 schema.sql에서 생성되므로
-- 여기서는 추가적인 개선사항들만 적용

-- 일지 테이블에 전문 검색을 위한 FTS 테이블 생성
CREATE VIRTUAL TABLE IF NOT EXISTS journals_fts USING fts5(
  journal_id UNINDEXED,
  title,
  content_text,
  tags,
  content='journals',
  content_rowid='rowid'
);

-- FTS 테이블을 위한 트리거 생성 (일지 추가 시)
CREATE TRIGGER IF NOT EXISTS journals_fts_insert 
  AFTER INSERT ON journals 
  BEGIN
    INSERT INTO journals_fts(journal_id, title, content_text, tags)
    VALUES (
      NEW.id,
      NEW.title,
      CASE 
        WHEN NEW.type = 'structured' THEN 
          NEW.title || ' ' || 
          COALESCE(json_extract(NEW.content, '$.notes'), '') || ' ' ||
          (SELECT group_concat(json_extract(value, '$.text'), ' ') 
           FROM json_each(json_extract(NEW.content, '$.tasks')))
        WHEN NEW.type = 'photo' THEN 
          NEW.title || ' ' || 
          COALESCE(json_extract(NEW.content, '$.description'), '') || ' ' ||
          (SELECT group_concat(json_extract(value, '$.caption'), ' ') 
           FROM json_each(json_extract(NEW.content, '$.photos')))
        ELSE NEW.title
      END,
      COALESCE(NEW.tags, '[]')
    );
  END;

-- FTS 테이블을 위한 트리거 생성 (일지 수정 시)
CREATE TRIGGER IF NOT EXISTS journals_fts_update
  AFTER UPDATE ON journals
  BEGIN
    UPDATE journals_fts SET
      title = NEW.title,
      content_text = CASE 
        WHEN NEW.type = 'structured' THEN 
          NEW.title || ' ' || 
          COALESCE(json_extract(NEW.content, '$.notes'), '') || ' ' ||
          (SELECT group_concat(json_extract(value, '$.text'), ' ') 
           FROM json_each(json_extract(NEW.content, '$.tasks')))
        WHEN NEW.type = 'photo' THEN 
          NEW.title || ' ' || 
          COALESCE(json_extract(NEW.content, '$.description'), '') || ' ' ||
          (SELECT group_concat(json_extract(value, '$.caption'), ' ') 
           FROM json_each(json_extract(NEW.content, '$.photos')))
        ELSE NEW.title
      END,
      tags = COALESCE(NEW.tags, '[]')
    WHERE journal_id = NEW.id;
  END;

-- FTS 테이블을 위한 트리거 생성 (일지 삭제 시)
CREATE TRIGGER IF NOT EXISTS journals_fts_delete
  AFTER DELETE ON journals
  BEGIN
    DELETE FROM journals_fts WHERE journal_id = OLD.id;
  END;

-- 기존 데이터가 있다면 FTS 테이블에 추가
INSERT INTO journals_fts(journal_id, title, content_text, tags)
SELECT 
  id,
  title,
  CASE 
    WHEN type = 'structured' THEN 
      title || ' ' || 
      COALESCE(json_extract(content, '$.notes'), '') || ' ' ||
      COALESCE((SELECT group_concat(json_extract(value, '$.text'), ' ') 
                FROM json_each(json_extract(content, '$.tasks'))), '')
    WHEN type = 'photo' THEN 
      title || ' ' || 
      COALESCE(json_extract(content, '$.description'), '') || ' ' ||
      COALESCE((SELECT group_concat(json_extract(value, '$.caption'), ' ') 
                FROM json_each(json_extract(content, '$.photos'))), '')
    ELSE title
  END,
  COALESCE(tags, '[]')
FROM journals 
WHERE id NOT IN (SELECT journal_id FROM journals_fts);