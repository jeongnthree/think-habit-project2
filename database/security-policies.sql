-- 보안 정책 강화

-- 1. 사용자 프로필 보안
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'coach')
        )
    );

-- 2. 진단 세션 보안
CREATE POLICY "Users can access own diagnostic sessions" ON diagnostic_sessions
    FOR ALL USING (
        user_id = (
            SELECT id FROM user_profiles 
            WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'coach')
        )
    );

-- 3. 훈련 일지 보안
CREATE POLICY "Users can access own journals" ON training_journals
    FOR ALL USING (
        user_id = (
            SELECT id FROM user_profiles 
            WHERE user_id = auth.uid()
        )
        OR is_public = true
        OR EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'coach')
        )
    );

-- 4. 관리자 전용 테이블 보안
CREATE POLICY "Admin only access" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 5. API 키 사용 제한 (함수)
CREATE OR REPLACE FUNCTION check_api_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- API 사용량 제한 로직
    IF (SELECT COUNT(*) FROM diagnostic_sessions 
        WHERE user_id = NEW.user_id 
        AND created_at > NOW() - INTERVAL '1 hour') > 10 THEN
        RAISE EXCEPTION 'Too many requests per hour';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 감사 로그 테이블
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 민감한 데이터 암호화 (예시)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 개인정보 암호화 함수
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(encrypt(data::bytea, 'encryption_key', 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql;

-- 8. 세션 타임아웃 설정
ALTER DATABASE postgres SET statement_timeout = '30s';
ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '10min';