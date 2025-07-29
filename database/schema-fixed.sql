-- Think-Habit Lite Database Schema (간소화) - 수정된 버전
-- 핵심 기능에 집중한 간단한 훈련 일지 시스템

-- 1. 사용자 프로필 테이블 (Supabase Auth 확장)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'coach', 'student')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id)
);

-- 2. 카테고리 테이블 (간소화)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  template TEXT, -- 간단한 텍스트 템플릿
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. 카테고리 할당 테이블 (간소화)
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  weekly_goal INTEGER DEFAULT 1 CHECK (weekly_goal > 0),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(student_id, category_id)
);

-- 4. 훈련 일지 테이블 (간소화)
CREATE TABLE IF NOT EXISTS journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}', -- 파일 URL 배열
  journal_type VARCHAR(20) DEFAULT 'structured' CHECK (journal_type IN ('structured', 'photo', 'mixed')),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. 댓글 테이블 (간소화)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID REFERENCES journals(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  comment_type VARCHAR(20) DEFAULT 'encouragement' CHECK (comment_type IN ('advice', 'encouragement', 'question')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. 알림 테이블 (간소화)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 트리거 함수: updated_at 자동 업데이트 (수정된 버전)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 설정
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at 
  BEFORE UPDATE ON assignments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journals_updated_at 
  BEFORE UPDATE ON journals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 기본 데이터 삽입
INSERT INTO categories (name, description, template) VALUES
('비판적 사고', '정보를 분석하고 평가하는 능력을 기르는 훈련', '오늘 접한 정보나 상황에 대해 다음 질문들을 생각해보세요:
1. 이 정보의 출처는 신뢰할 만한가?
2. 다른 관점에서는 어떻게 볼 수 있을까?
3. 숨겨진 가정이나 편견은 없을까?
4. 결론을 내리기에 충분한 근거가 있는가?'),
('창의적 사고', '새로운 아이디어를 생성하고 문제를 창의적으로 해결하는 능력', '오늘의 창의적 사고 훈련:
1. 해결하고 싶은 문제나 개선하고 싶은 상황은?
2. 기존의 접근 방식은 무엇인가?
3. 전혀 다른 관점에서 접근한다면?
4. 새로운 아이디어 3가지를 제시해보세요.'),
('논리적 사고', '체계적이고 논리적으로 사고하는 능력을 기르는 훈련', '논리적 사고 연습:
1. 오늘 내린 중요한 결정이나 판단은?
2. 그 결정의 근거와 논리는 무엇인가?
3. 논리적 오류나 빈틈은 없었는가?
4. 더 나은 논리적 접근 방법은?'),
('감정 조절', '감정을 인식하고 적절히 관리하는 능력', '감정 조절 성찰:
1. 오늘 경험한 강한 감정은?
2. 그 감정의 원인과 배경은?
3. 감정에 어떻게 반응했는가?
4. 더 건설적인 반응 방법은?'),
('의사소통', '효과적으로 소통하고 관계를 형성하는 능력', '의사소통 돌아보기:
1. 오늘 중요한 대화나 소통 상황은?
2. 상대방의 입장을 충분히 이해했는가?
3. 내 의견을 명확하게 전달했는가?
4. 더 나은 소통 방법은?');

-- 관리자 계정 생성 (실제로는 Supabase Auth를 통해 생성)
-- INSERT INTO user_profiles (user_id, email, full_name, role) VALUES
-- ('admin-uuid', 'admin@example.com', '관리자', 'admin');