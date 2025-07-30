-- Think-Habit 진단 시스템 완전 최소 버전 (스키마 + 데이터)

-- 1. 아픈 생각습관 테이블
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

-- 2. 진단지 템플릿 테이블
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 진단 세션 테이블
CREATE TABLE IF NOT EXISTS diagnostic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    template_id UUID NOT NULL REFERENCES diagnostic_templates(id),
    goal_context VARCHAR(255),
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_questions INTEGER,
    answered_questions INTEGER DEFAULT 0,
    session_data JSONB
);

-- 4. 진단 응답 테이블
CREATE TABLE IF NOT EXISTS diagnostic_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    response_value JSONB NOT NULL,
    response_score INTEGER,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 진단 결과 테이블
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

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_user_id ON diagnostic_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_status ON diagnostic_sessions(status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_responses_session_id ON diagnostic_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_results_session_id ON diagnostic_results(session_id);

-- 기본 데이터 삽입 (중복 방지)
INSERT INTO thinking_habits (id, name, description, category, severity_levels, symptoms) 
SELECT * FROM (VALUES
    ('550e8400-e29b-41d4-a716-446655440001'::UUID, '완벽주의적 사고', '모든 것을 완벽하게 해야 한다는 강박적 사고 패턴', '인지적 왜곡', '{"1": "가끔 완벽을 추구", "2": "자주 완벽을 추구", "3": "항상 완벽해야 함", "4": "완벽하지 않으면 실패", "5": "완벽주의로 인한 마비"}'::jsonb, '["미루기", "과도한 자기비판", "결정 회피", "스트레스 증가"]'::jsonb),
    ('550e8400-e29b-41d4-a716-446655440002'::UUID, '흑백논리적 사고', '모든 것을 극단적으로 좋거나 나쁘게만 판단하는 사고 패턴', '인지적 왜곡', '{"1": "가끔 극단적 판단", "2": "자주 극단적 판단", "3": "대부분 극단적 판단", "4": "항상 극단적 판단", "5": "중간 지점을 전혀 인식 못함"}'::jsonb, '["관계 갈등", "감정 기복", "결정 어려움", "스트레스"]'::jsonb),
    ('550e8400-e29b-41d4-a716-446655440003'::UUID, '파국적 사고', '작은 문제를 큰 재앙으로 확대해석하는 사고 패턴', '인지적 왜곡', '{"1": "가끔 과장", "2": "자주 과장", "3": "대부분 과장", "4": "항상 최악 예상", "5": "현실 인식 불가"}'::jsonb, '["불안 증가", "회피 행동", "우울감", "신체 증상"]'::jsonb)
) AS t(id, name, description, category, severity_levels, symptoms)
WHERE NOT EXISTS (SELECT 1 FROM thinking_habits WHERE id = t.id);

INSERT INTO diagnostic_templates (id, name, description, type, questions, scoring_rules, habit_mapping) 
SELECT * FROM (VALUES
    ('550e8400-e29b-41d4-a716-446655440010'::UUID, '기본 사고습관 진단', '일반적인 사고 패턴과 인지적 왜곡을 진단하는 기본 진단지', 'basic', '{
        "sections": [
            {
                "title": "완벽주의 성향",
                "questions": [
                    {
                        "id": "perfectionism_1",
                        "text": "일을 할 때 완벽하지 않으면 의미가 없다고 생각한다",
                        "type": "scale",
                        "scale": 5,
                        "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"]
                    },
                    {
                        "id": "perfectionism_2", 
                        "text": "실수를 하면 자신을 심하게 비난한다",
                        "type": "scale",
                        "scale": 5,
                        "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"]
                    }
                ]
            },
            {
                "title": "흑백논리 성향",
                "questions": [
                    {
                        "id": "blackwhite_1",
                        "text": "사람이나 상황을 좋거나 나쁘게만 판단한다",
                        "type": "scale",
                        "scale": 5,
                        "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"]
                    }
                ]
            },
            {
                "title": "파국적 사고 성향",
                "questions": [
                    {
                        "id": "catastrophic_1",
                        "text": "작은 문제가 생기면 최악의 상황을 먼저 생각한다",
                        "type": "scale",
                        "scale": 5,
                        "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"]
                    }
                ]
            }
        ]
    }'::jsonb, '{
        "scoring": {
            "perfectionism": {
                "questions": ["perfectionism_1", "perfectionism_2"],
                "max_score": 10,
                "thresholds": {"low": 3, "medium": 6, "high": 8}
            },
            "blackwhite": {
                "questions": ["blackwhite_1"], 
                "max_score": 5,
                "thresholds": {"low": 2, "medium": 3, "high": 4}
            },
            "catastrophic": {
                "questions": ["catastrophic_1"],
                "max_score": 5,
                "thresholds": {"low": 2, "medium": 3, "high": 4}
            }
        }
    }'::jsonb, '{
        "habit_mapping": {
            "perfectionism": "완벽주의적 사고",
            "blackwhite": "흑백논리적 사고", 
            "catastrophic": "파국적 사고"
        }
    }'::jsonb)
) AS t(id, name, description, type, questions, scoring_rules, habit_mapping)
WHERE NOT EXISTS (SELECT 1 FROM diagnostic_templates WHERE id = t.id);

-- 성공 메시지
DO $$
BEGIN
    RAISE NOTICE '진단 시스템 설정 완료!';
    RAISE NOTICE '테이블 생성: thinking_habits, diagnostic_templates, diagnostic_sessions, diagnostic_responses, diagnostic_results';
    RAISE NOTICE '기본 데이터 삽입: 3개 사고습관, 1개 진단지 템플릿';
END $$;