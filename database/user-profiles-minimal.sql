-- 사용자 프로필 테이블 생성 (진단 시스템용 최소 버전)

-- 1. 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE, -- Supabase auth.users.id 참조
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'coach', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- 3. 개발용 임시 사용자 생성
INSERT INTO user_profiles (id, user_id, email, name, role) 
SELECT * FROM (VALUES
    ('550e8400-e29b-41d4-a716-446655440000'::UUID, '550e8400-e29b-41d4-a716-446655440000'::UUID, 'test@example.com', '테스트 사용자', 'user')
) AS t(id, user_id, email, name, role)
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = t.user_id);

-- 성공 메시지
DO $$
BEGIN
    RAISE NOTICE 'user_profiles 테이블 생성 완료!';
    RAISE NOTICE '개발용 임시 사용자 추가됨';
END $$;