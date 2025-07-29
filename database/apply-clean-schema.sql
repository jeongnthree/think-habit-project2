-- Supabase 데이터베이스 완전 정리 및 새 스키마 적용
-- 실행 순서: 1. cleanup-tables.sql → 2. apply-clean-schema.sql

-- ============================================
-- 1단계: 기존 데이터 백업 (선택사항)
-- ============================================

-- 중요한 사용자 데이터가 있다면 먼저 백업
-- CREATE TABLE backup_users AS SELECT * FROM users;
-- CREATE TABLE backup_journals AS SELECT * FROM training_journals;

-- ============================================
-- 2단계: 정리된 스키마 적용
-- ============================================

-- 1. 사용자 테이블 (Google OAuth 연동)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  role INTEGER DEFAULT 1, -- 1: 학습자, 2: 지도자, 3: 관리자
  status VARCHAR(20) DEFAULT 'active',
  profile JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. 저널 카테고리
CREATE TABLE IF NOT EXISTS journal_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. 훈련 저널
CREATE TABLE IF NOT EXISTS training_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES journal_categories(id),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. 커뮤니티 게시글 (공개 저널)
CREATE TABLE IF NOT EXISTS community_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID REFERENCES training_journals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200),
  summary TEXT,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. 댓글
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID REFERENCES community_journals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 3단계: 인덱스 생성 (성능 최적화)
-- ============================================

-- 사용자 이메일 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 저널 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_training_journals_user_id ON training_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_training_journals_category_id ON training_journals(category_id);
CREATE INDEX IF NOT EXISTS idx_training_journals_created_at ON training_journals(created_at DESC);

-- 커뮤니티 저널 인덱스
CREATE INDEX IF NOT EXISTS idx_community_journals_created_at ON community_journals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_journals_user_id ON community_journals(user_id);

-- 댓글 인덱스
CREATE INDEX IF NOT EXISTS idx_comments_journal_id ON comments(journal_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- ============================================
-- 4단계: 기본 데이터 삽입
-- ============================================

INSERT INTO journal_categories (name, description, template) VALUES
('일반', '자유로운 형식의 일지', '오늘의 생각과 경험을 기록해보세요.'),
('감정관리', '감정 인식 및 조절 훈련', '오늘 느낀 감정: 
감정의 원인: 
대처 방법: '),
('사고훈련', '논리적 사고력 향상', '문제 상황: 
분석: 
해결책: '),
('습관개선', '나쁜 습관 교정', '개선하고 싶은 습관: 
오늘의 실천: 
느낀 점: ')
ON CONFLICT DO NOTHING;

-- ============================================
-- 5단계: RLS (Row Level Security) 설정
-- ============================================

-- 사용자 테이블 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth_id = auth.uid());

-- 저널 테이블 RLS  
ALTER TABLE training_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own journals" ON training_journals FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can create own journals" ON training_journals FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can update own journals" ON training_journals FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own journals" ON training_journals FOR DELETE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- 커뮤니티 저널 RLS (공개 읽기)
ALTER TABLE community_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view public journals" ON community_journals FOR SELECT USING (true);
CREATE POLICY "Users can create community journals" ON community_journals FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- 댓글 RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- 성공 메시지
SELECT 'Clean schema applied successfully! Database is now optimized for Google OAuth.' as status;