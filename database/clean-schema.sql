-- Think-Habit 정리된 스키마 (Google OAuth 기반)
-- 필수 테이블만 유지하고 단순화

-- 1. 사용자 테이블 (Google OAuth 연동)
CREATE TABLE IF NOT EXISTS users (
  auth_id UUID PRIMARY KEY,
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
  user_id UUID REFERENCES users(auth_id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES users(auth_id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES users(auth_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 기본 데이터 삽입
INSERT INTO journal_categories (name, description, template) VALUES
('일반', '자유로운 형식의 일지', '오늘의 생각과 경험을 기록해보세요.'),
('감정관리', '감정 인식 및 조절 훈련', '오늘 느낀 감정: \n감정의 원인: \n대처 방법: '),
('사고훈련', '논리적 사고력 향상', '문제 상황: \n분석: \n해결책: '),
('습관개선', '나쁜 습관 교정', '개선하고 싶은 습관: \n오늘의 실천: \n느낀 점: ')
ON CONFLICT DO NOTHING;