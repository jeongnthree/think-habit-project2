-- Community System Migration
-- 커뮤니티 기능을 위한 데이터베이스 스키마 업데이트

-- 1. Comments 테이블 업데이트 (기존 테이블 개선)
-- comment_type에 'comment' 추가 및 updated_at 컬럼 추가
ALTER TABLE comments 
DROP CONSTRAINT IF EXISTS comments_comment_type_check;

ALTER TABLE comments 
ADD CONSTRAINT comments_comment_type_check 
CHECK (comment_type IN ('advice', 'encouragement', 'question', 'comment'));

-- updated_at 컬럼 추가 (없는 경우)
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- updated_at 트리거 추가
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at 
  BEFORE UPDATE ON comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Encouragements 테이블 생성 (새로운 테이블)
CREATE TABLE IF NOT EXISTS encouragements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID REFERENCES journals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- 한 사용자가 같은 일지에 중복 격려 방지
  UNIQUE(journal_id, user_id)
);

-- 3. 인덱스 생성 (성능 최적화)

-- Comments 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_comments_journal_id ON comments(journal_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Encouragements 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_encouragements_journal_id ON encouragements(journal_id);
CREATE INDEX IF NOT EXISTS idx_encouragements_user_id ON encouragements(user_id);

-- Journals 테이블 인덱스 (공개 일지 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_journals_public ON journals(is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_journals_category_public ON journals(category_id, is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_journals_student_public ON journals(student_id, is_public) WHERE is_public = true;

-- 복합 인덱스 (페이지네이션 최적화)
CREATE INDEX IF NOT EXISTS idx_journals_public_pagination ON journals(is_public, created_at DESC, id) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_comments_journal_created ON comments(journal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_encouragements_journal_created ON encouragements(journal_id, created_at DESC);

-- 4. RLS (Row Level Security) 정책 설정

-- Comments 테이블 RLS 활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 공개 일지의 댓글은 모든 인증된 사용자가 읽을 수 있음
CREATE POLICY "Public journal comments are viewable by authenticated users" ON comments
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM journals 
      WHERE journals.id = comments.journal_id 
      AND journals.is_public = true
    )
  );

-- 인증된 사용자는 공개 일지에 댓글을 작성할 수 있음
CREATE POLICY "Authenticated users can insert comments on public journals" ON comments
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM journals 
      WHERE journals.id = journal_id 
      AND journals.is_public = true
    )
  );

-- 사용자는 자신의 댓글만 수정/삭제할 수 있음
CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = author_id);

-- Encouragements 테이블 RLS 활성화
ALTER TABLE encouragements ENABLE ROW LEVEL SECURITY;

-- 공개 일지의 격려는 모든 인증된 사용자가 볼 수 있음
CREATE POLICY "Public journal encouragements are viewable by authenticated users" ON encouragements
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM journals 
      WHERE journals.id = encouragements.journal_id 
      AND journals.is_public = true
    )
  );

-- 인증된 사용자는 공개 일지에 격려를 할 수 있음
CREATE POLICY "Authenticated users can encourage public journals" ON encouragements
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM journals 
      WHERE journals.id = journal_id 
      AND journals.is_public = true
    )
  );

-- 사용자는 자신의 격려만 삭제할 수 있음
CREATE POLICY "Users can delete their own encouragements" ON encouragements
  FOR DELETE USING (auth.uid() = user_id);

-- 5. 유용한 뷰 생성 (쿼리 최적화)

-- 공개 일지와 관련 정보를 한 번에 조회하는 뷰
CREATE OR REPLACE VIEW public_journals_with_stats AS
SELECT 
  j.id,
  j.student_id,
  j.category_id,
  j.title,
  j.content,
  j.attachments,
  j.is_public,
  j.created_at,
  j.updated_at,
  up.full_name as author_name,
  c.name as category_name,
  COALESCE(comment_counts.count, 0) as comment_count,
  COALESCE(encouragement_counts.count, 0) as encouragement_count
FROM journals j
LEFT JOIN user_profiles up ON j.student_id = up.user_id
LEFT JOIN categories c ON j.category_id = c.id
LEFT JOIN (
  SELECT journal_id, COUNT(*) as count
  FROM comments
  GROUP BY journal_id
) comment_counts ON j.id = comment_counts.journal_id
LEFT JOIN (
  SELECT journal_id, COUNT(*) as count
  FROM encouragements
  GROUP BY journal_id
) encouragement_counts ON j.id = encouragement_counts.journal_id
WHERE j.is_public = true;

-- 댓글과 작성자 정보를 함께 조회하는 뷰
CREATE OR REPLACE VIEW comments_with_authors AS
SELECT 
  c.id,
  c.journal_id,
  c.author_id,
  c.content,
  c.comment_type,
  c.created_at,
  c.updated_at,
  up.full_name as author_name,
  up.role as author_role
FROM comments c
LEFT JOIN user_profiles up ON c.author_id = up.user_id;

-- 6. 샘플 데이터 삽입 (테스트용)

-- 샘플 공개 일지 생성 (실제 사용자 ID가 있을 때만)
-- INSERT INTO journals (student_id, category_id, title, content, is_public) 
-- SELECT 
--   up.user_id,
--   c.id,
--   '비판적 사고 훈련 - 뉴스 분석',
--   '오늘 접한 뉴스 기사에 대해 비판적으로 분석해보았습니다...',
--   true
-- FROM user_profiles up, categories c 
-- WHERE up.role = 'student' AND c.name = '비판적 사고'
-- LIMIT 1;

-- 7. 함수 생성 (편의 기능)

-- 특정 일지의 격려 수를 반환하는 함수
CREATE OR REPLACE FUNCTION get_encouragement_count(journal_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM encouragements 
    WHERE journal_id = journal_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- 특정 사용자가 특정 일지를 격려했는지 확인하는 함수
CREATE OR REPLACE FUNCTION user_has_encouraged(journal_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM encouragements 
    WHERE journal_id = journal_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- 특정 일지의 댓글 수를 반환하는 함수
CREATE OR REPLACE FUNCTION get_comment_count(journal_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM comments 
    WHERE journal_id = journal_uuid
  );
END;
$$ LANGUAGE plpgsql;