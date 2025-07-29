-- Soft Delete System Migration
-- 일지 삭제 및 복구 기능을 위한 데이터베이스 스키마 확장

-- 1. journals 테이블에 soft delete 컬럼 추가
ALTER TABLE journals 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- 2. 감사 로그 테이블 생성 (삭제/복구 기록용)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_journals_deleted_at ON journals(deleted_at);
CREATE INDEX IF NOT EXISTS idx_journals_deleted_by ON journals(deleted_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 4. RLS 정책 설정
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 감사 로그: 관리자만 접근 가능
CREATE POLICY "audit_logs_admin_policy" ON audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 사용자는 자신의 행동 로그만 조회 가능
CREATE POLICY "audit_logs_user_policy" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- 5. 기존 journals 테이블 RLS 정책 업데이트 (soft delete 고려)
-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "journals_select_policy" ON journals;
DROP POLICY IF EXISTS "journals_insert_policy" ON journals;
DROP POLICY IF EXISTS "journals_update_policy" ON journals;
DROP POLICY IF EXISTS "journals_delete_policy" ON journals;

-- 일지 조회: 본인 일지 또는 공개 일지 (삭제되지 않은 것만)
CREATE POLICY "journals_select_policy" ON journals
  FOR SELECT USING (
    deleted_at IS NULL AND (
      student_id = auth.uid() OR 
      is_public = true OR
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'coach', 'teacher')
      )
    )
  );

-- 일지 생성: 본인만 가능
CREATE POLICY "journals_insert_policy" ON journals
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- 일지 수정: 본인 일지만 가능 (삭제되지 않은 것만)
CREATE POLICY "journals_update_policy" ON journals
  FOR UPDATE USING (
    deleted_at IS NULL AND (
      student_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'coach', 'teacher')
      )
    )
  );

-- 일지 삭제: 본인 일지 또는 관리자/코치
CREATE POLICY "journals_delete_policy" ON journals
  FOR UPDATE USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'coach', 'teacher')
    )
  );

-- 6. 삭제된 일지 조회를 위한 별도 정책 (관리자/코치용)
CREATE POLICY "journals_deleted_admin_policy" ON journals
  FOR SELECT USING (
    deleted_at IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'coach', 'teacher')
    )
  );

-- 7. 뷰 생성: 활성 일지만 조회하는 뷰
CREATE OR REPLACE VIEW active_journals AS
SELECT * FROM journals 
WHERE deleted_at IS NULL;

-- 8. 뷰 생성: 삭제된 일지만 조회하는 뷰 (관리자용)
CREATE OR REPLACE VIEW deleted_journals AS
SELECT * FROM journals 
WHERE deleted_at IS NOT NULL;

-- 9. 함수 생성: 일지 soft delete
CREATE OR REPLACE FUNCTION soft_delete_journal(
  journal_id UUID,
  deleter_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE journals 
  SET 
    deleted_at = now(),
    deleted_by = deleter_id,
    updated_at = now()
  WHERE id = journal_id AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 함수 생성: 일지 복구
CREATE OR REPLACE FUNCTION restore_journal(
  journal_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE journals 
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    updated_at = now()
  WHERE id = journal_id AND deleted_at IS NOT NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 함수 생성: 영구 삭제 (관리자만)
CREATE OR REPLACE FUNCTION permanent_delete_journal(
  journal_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM journals WHERE id = journal_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 트리거 생성: 일지 삭제 시 자동 감사 로그 생성
CREATE OR REPLACE FUNCTION log_journal_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- soft delete인 경우
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (
      NEW.deleted_by,
      'journal_soft_delete',
      'journal',
      NEW.id,
      jsonb_build_object(
        'title', NEW.title,
        'journal_type', NEW.journal_type,
        'was_public', NEW.is_public,
        'deleted_at', NEW.deleted_at
      )
    );
  END IF;
  
  -- 복구인 경우
  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (
      auth.uid(),
      'journal_restore',
      'journal',
      NEW.id,
      jsonb_build_object(
        'title', NEW.title,
        'journal_type', NEW.journal_type,
        'restored_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER journal_deletion_audit_trigger
  AFTER UPDATE ON journals
  FOR EACH ROW
  EXECUTE FUNCTION log_journal_deletion();

-- 13. 트리거 생성: 영구 삭제 시 감사 로그 생성
CREATE OR REPLACE FUNCTION log_journal_permanent_deletion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    'journal_permanent_delete',
    'journal',
    OLD.id,
    jsonb_build_object(
      'title', OLD.title,
      'journal_type', OLD.journal_type,
      'was_public', OLD.is_public,
      'was_deleted_at', OLD.deleted_at,
      'permanently_deleted_at', now()
    )
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER journal_permanent_deletion_audit_trigger
  BEFORE DELETE ON journals
  FOR EACH ROW
  EXECUTE FUNCTION log_journal_permanent_deletion();