-- Think-Habit 진단 시스템 설정 스크립트
-- 이 파일을 Supabase SQL 에디터에서 실행하세요

-- 1. 기존 user_profiles 테이블이 있는지 확인하고 없으면 생성
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'learner' CHECK (role IN ('admin', 'coach', 'learner')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 진단 시스템 테이블들 생성
-- (schema-diagnosis-system.sql 내용을 여기에 복사)

-- 진단지 템플릿
CREATE TABLE IF NOT EXISTS diagnostic_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('basic', 'goal_specific')),
    target_goal VARCHAR(100),
    questions JSONB NOT NULL,
    scoring_rules JSONB NOT NULL,
    habit_mapping JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- 아픈 생각습관 정의
CREATE TABLE IF NOT EXISTS thinking_habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    severity_levels JSONB NOT NULL,
    symptoms JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 진단 세션
CREATE TABLE IF NOT EXISTS diagnostic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    template_id UUID NOT NULL REFERENCES diagnostic_templates(id),
    goal_context VARCHAR(255),
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_questions INTEGER,
    answered_questions INTEGER DEFAULT 0,
    session_data JSONB
);

-- 진단 응답
CREATE TABLE IF NOT EXISTS diagnostic_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    response_value JSONB NOT NULL,
    response_score INTEGER,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 진단 결과
CREATE TABLE IF NOT EXISTS diagnostic_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
    identified_habits JSONB NOT NULL,
    primary_habit_id UUID REFERENCES thinking_habits(id),
    severity_scores JSONB NOT NULL,
    recommendations JSONB,
    analysis_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 처방 템플릿
CREATE TABLE IF NOT EXISTS prescription_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES thinking_habits(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    treatment_approach TEXT NOT NULL,
    training_modules JSONB NOT NULL,
    duration_weeks INTEGER DEFAULT 4,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    success_criteria JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 개인별 처방
CREATE TABLE IF NOT EXISTS user_prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    diagnostic_result_id UUID NOT NULL REFERENCES diagnostic_results(id),
    habit_id UUID NOT NULL REFERENCES thinking_habits(id),
    prescription_template_id UUID NOT NULL REFERENCES prescription_templates(id),
    customized_plan JSONB NOT NULL,
    assigned_categories JSONB,
    start_date DATE DEFAULT CURRENT_DATE,
    target_end_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    progress_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 처방 효과 추적
CREATE TABLE IF NOT EXISTS prescription_effectiveness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES user_prescriptions(id),
    evaluation_date DATE DEFAULT CURRENT_DATE,
    improvement_score INTEGER CHECK (improvement_score BETWEEN 1 AND 10),
    user_feedback TEXT,
    objective_metrics JSONB,
    next_steps JSONB,
    evaluated_by UUID REFERENCES user_profiles(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_user_id ON diagnostic_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_status ON diagnostic_sessions(status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_responses_session_id ON diagnostic_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_results_session_id ON diagnostic_results(session_id);
CREATE INDEX IF NOT EXISTS idx_user_prescriptions_user_id ON user_prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prescriptions_status ON user_prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescription_effectiveness_prescription_id ON prescription_effectiveness(prescription_id);

-- RLS 정책 활성화
ALTER TABLE diagnostic_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE thinking_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_effectiveness ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- 진단 템플릿은 모든 사용자가 읽기 가능
CREATE POLICY IF NOT EXISTS "Anyone can read active diagnostic templates" ON diagnostic_templates
    FOR SELECT USING (is_active = true);

-- 아픈 생각습관은 모든 사용자가 읽기 가능
CREATE POLICY IF NOT EXISTS "Anyone can read active thinking habits" ON thinking_habits
    FOR SELECT USING (is_active = true);

-- 사용자는 자신의 진단 데이터만 접근 가능
CREATE POLICY IF NOT EXISTS "Users can access own diagnostic sessions" ON diagnostic_sessions
    FOR ALL USING (
        user_id IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
        )
    );

CREATE POLICY IF NOT EXISTS "Users can access own diagnostic responses" ON diagnostic_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM diagnostic_sessions ds
            JOIN user_profiles up ON ds.user_id = up.id
            WHERE ds.id = session_id AND (
                up.user_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
                )
            )
        )
    );

CREATE POLICY IF NOT EXISTS "Users can access own diagnostic results" ON diagnostic_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM diagnostic_sessions ds
            JOIN user_profiles up ON ds.user_id = up.id
            WHERE ds.id = session_id AND (
                up.user_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
                )
            )
        )
    );

CREATE POLICY IF NOT EXISTS "Users can access own prescriptions" ON user_prescriptions
    FOR ALL USING (
        user_id IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
        )
    );

-- 관리자/코치는 모든 데이터 접근 가능
CREATE POLICY IF NOT EXISTS "Admins and coaches can access all effectiveness data" ON prescription_effectiveness
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
        )
    );