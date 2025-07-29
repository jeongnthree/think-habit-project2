-- Think-Habit 진단 시스템 데이터베이스 스키마

-- 1. 진단지 템플릿 (기본 진단 + 목표별 진단)
CREATE TABLE diagnostic_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('basic', 'goal_specific')),
    target_goal VARCHAR(100), -- 목표별 진단의 경우 대상 목표
    questions JSONB NOT NULL, -- 질문 데이터 (유연한 구조)
    scoring_rules JSONB NOT NULL, -- 채점 규칙
    habit_mapping JSONB NOT NULL, -- 아픈 생각습관 매핑 규칙
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- 2. 아픈 생각습관 정의
CREATE TABLE thinking_habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    severity_levels JSONB NOT NULL, -- 심각도 레벨 정의
    symptoms JSONB, -- 증상 설명
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 진단 세션 (사용자가 진단을 실시하는 단위)
CREATE TABLE diagnostic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    template_id UUID NOT NULL REFERENCES diagnostic_templates(id),
    goal_context VARCHAR(255), -- 진단 시 설정한 목표
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_questions INTEGER,
    answered_questions INTEGER DEFAULT 0,
    session_data JSONB -- 세션별 메타데이터
);

-- 4. 진단 응답 (각 질문에 대한 사용자 응답)
CREATE TABLE diagnostic_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL, -- 질문 식별자
    question_text TEXT NOT NULL, -- 질문 내용 (기록용)
    response_value JSONB NOT NULL, -- 응답 값 (숫자, 텍스트, 선택지 등)
    response_score INTEGER, -- 계산된 점수
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 진단 결과 (분석된 아픈 생각습관)
CREATE TABLE diagnostic_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
    identified_habits JSONB NOT NULL, -- 식별된 아픈 생각습관들과 점수
    primary_habit_id UUID REFERENCES thinking_habits(id), -- 가장 심각한 습관
    severity_scores JSONB NOT NULL, -- 각 영역별 심각도 점수
    recommendations JSONB, -- 기본 권장사항
    analysis_summary TEXT, -- 분석 요약
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 처방 템플릿 (아픈 생각습관별 처방)
CREATE TABLE prescription_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES thinking_habits(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    treatment_approach TEXT NOT NULL, -- 치료 접근법
    training_modules JSONB NOT NULL, -- 연결될 훈련 모듈들
    duration_weeks INTEGER DEFAULT 4, -- 권장 훈련 기간
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    success_criteria JSONB, -- 성공 기준
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 개인별 처방 (사용자에게 할당된 구체적 처방)
CREATE TABLE user_prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    diagnostic_result_id UUID NOT NULL REFERENCES diagnostic_results(id),
    habit_id UUID NOT NULL REFERENCES thinking_habits(id),
    prescription_template_id UUID NOT NULL REFERENCES prescription_templates(id),
    customized_plan JSONB NOT NULL, -- 개인 맞춤화된 처방 계획
    assigned_categories JSONB, -- 할당된 훈련 카테고리들
    start_date DATE DEFAULT CURRENT_DATE,
    target_end_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    progress_data JSONB, -- 진행 상황 데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 처방 효과 추적
CREATE TABLE prescription_effectiveness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES user_prescriptions(id),
    evaluation_date DATE DEFAULT CURRENT_DATE,
    improvement_score INTEGER CHECK (improvement_score BETWEEN 1 AND 10),
    user_feedback TEXT,
    objective_metrics JSONB, -- 객관적 지표 (일지 완성률, 연속일 등)
    next_steps JSONB, -- 다음 단계 권장사항
    evaluated_by UUID REFERENCES user_profiles(id) -- 평가자 (코치/관리자)
);

-- 인덱스 생성
CREATE INDEX idx_diagnostic_sessions_user_id ON diagnostic_sessions(user_id);
CREATE INDEX idx_diagnostic_sessions_status ON diagnostic_sessions(status);
CREATE INDEX idx_diagnostic_responses_session_id ON diagnostic_responses(session_id);
CREATE INDEX idx_diagnostic_results_session_id ON diagnostic_results(session_id);
CREATE INDEX idx_user_prescriptions_user_id ON user_prescriptions(user_id);
CREATE INDEX idx_user_prescriptions_status ON user_prescriptions(status);
CREATE INDEX idx_prescription_effectiveness_prescription_id ON prescription_effectiveness(prescription_id);

-- RLS 정책 (Row Level Security)
ALTER TABLE diagnostic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_effectiveness ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 진단 데이터만 접근 가능
CREATE POLICY "Users can access own diagnostic sessions" ON diagnostic_sessions
    FOR ALL USING (user_id = auth.uid() OR 
                   EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'coach')));

CREATE POLICY "Users can access own diagnostic responses" ON diagnostic_responses
    FOR ALL USING (EXISTS (SELECT 1 FROM diagnostic_sessions WHERE id = session_id AND 
                          (user_id = auth.uid() OR 
                           EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'coach')))));

CREATE POLICY "Users can access own diagnostic results" ON diagnostic_results
    FOR ALL USING (EXISTS (SELECT 1 FROM diagnostic_sessions WHERE id = session_id AND 
                          (user_id = auth.uid() OR 
                           EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'coach')))));

CREATE POLICY "Users can access own prescriptions" ON user_prescriptions
    FOR ALL USING (user_id = auth.uid() OR 
                   EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'coach')));

-- 관리자/코치는 모든 데이터 접근 가능
CREATE POLICY "Admins and coaches can access all data" ON prescription_effectiveness
    FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'coach')));

COMMENT ON TABLE diagnostic_templates IS '진단지 템플릿 - 기본 진단과 목표별 진단 포함';
COMMENT ON TABLE thinking_habits IS '아픈 생각습관 정의 및 분류';
COMMENT ON TABLE diagnostic_sessions IS '사용자별 진단 실시 세션';
COMMENT ON TABLE diagnostic_responses IS '진단 질문별 사용자 응답';
COMMENT ON TABLE diagnostic_results IS '진단 분석 결과 및 식별된 아픈 생각습관';
COMMENT ON TABLE prescription_templates IS '아픈 생각습관별 처방 템플릿';
COMMENT ON TABLE user_prescriptions IS '사용자별 맞춤 처방 및 훈련 계획';
COMMENT ON TABLE prescription_effectiveness IS '처방 효과 추적 및 평가';