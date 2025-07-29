-- Think-Habit 진단 시스템 기본 데이터

-- 1. 기본 아픈 생각습관 정의
INSERT INTO thinking_habits (id, name, description, category, severity_levels, symptoms) VALUES
(
    gen_random_uuid(),
    '완벽주의적 사고',
    '모든 것을 완벽하게 해야 한다는 강박적 사고 패턴',
    '인지적 왜곡',
    '{"1": "가끔 완벽을 추구", "2": "자주 완벽을 추구", "3": "항상 완벽해야 함", "4": "완벽하지 않으면 실패", "5": "완벽주의로 인한 마비"}'::jsonb,
    '["미루기", "과도한 자기비판", "결정 회피", "스트레스 증가"]'::jsonb
),
(
    gen_random_uuid(),
    '흑백논리적 사고',
    '모든 것을 극단적으로 좋거나 나쁘게만 판단하는 사고 패턴',
    '인지적 왜곡',
    '{"1": "가끔 극단적 판단", "2": "자주 극단적 판단", "3": "대부분 극단적 판단", "4": "항상 극단적 판단", "5": "중간 지점을 전혀 인식 못함"}'::jsonb,
    '["관계 갈등", "감정 기복", "결정 어려움", "스트레스"]'::jsonb
),
(
    gen_random_uuid(),
    '파국적 사고',
    '작은 문제를 큰 재앙으로 확대해석하는 사고 패턴',
    '인지적 왜곡',
    '{"1": "가끔 과장", "2": "자주 과장", "3": "대부분 과장", "4": "항상 최악 예상", "5": "현실 인식 불가"}'::jsonb,
    '["불안 증가", "회피 행동", "우울감", "신체 증상"]'::jsonb
),
(
    gen_random_uuid(),
    '개인화 사고',
    '모든 부정적 상황을 자신의 탓으로 돌리는 사고 패턴',
    '인지적 왜곡',
    '{"1": "가끔 자책", "2": "자주 자책", "3": "대부분 자책", "4": "항상 자책", "5": "타인 책임 인식 불가"}'::jsonb,
    '["자존감 저하", "우울감", "사회적 위축", "자기비판"]'::jsonb
),
(
    gen_random_uuid(),
    '감정적 추론',
    '감정을 사실로 받아들이는 사고 패턴',
    '인지적 왜곡',
    '{"1": "가끔 감정에 의존", "2": "자주 감정에 의존", "3": "대부분 감정에 의존", "4": "항상 감정이 사실", "5": "논리적 사고 불가"}'::jsonb,
    '["잘못된 판단", "관계 문제", "의사결정 어려움", "감정 조절 문제"]'::jsonb
);

-- 2. 기본 진단지 템플릿
INSERT INTO diagnostic_templates (id, name, description, type, questions, scoring_rules, habit_mapping) VALUES
(
    gen_random_uuid(),
    '기본 사고습관 진단',
    '일반적인 사고 패턴과 인지적 왜곡을 진단하는 기본 진단지',
    'basic',
    '{
        "sections": [
            {
                "title": "완벽주의 성향",
                "questions": [
                    {
                        "id": "perfectionism_1",
                        "text": "일을 할 때 완벽하지 않으면 의미가 없다고 생각한다",
                        "type": "likert",
                        "scale": 5,
                        "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"]
                    },
                    {
                        "id": "perfectionism_2", 
                        "text": "실수를 하면 자신을 심하게 비난한다",
                        "type": "likert",
                        "scale": 5,
                        "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"]
                    },
                    {
                        "id": "perfectionism_3",
                        "text": "완벽하게 할 수 없다면 아예 시작하지 않는다",
                        "type": "likert", 
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
                        "type": "likert",
                        "scale": 5,
                        "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"]
                    },
                    {
                        "id": "blackwhite_2",
                        "text": "중간 지점이나 회색 영역을 인정하기 어렵다",
                        "type": "likert",
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
                        "type": "likert",
                        "scale": 5,
                        "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"]
                    },
                    {
                        "id": "catastrophic_2",
                        "text": "앞으로 일어날 일에 대해 걱정이 많다",
                        "type": "likert",
                        "scale": 5,
                        "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"]
                    }
                ]
            },
            {
                "title": "개인화 사고 성향", 
                "questions": [
                    {
                        "id": "personalization_1",
                        "text": "나쁜 일이 생기면 내 탓이라고 생각한다",
                        "type": "likert",
                        "scale": 5,
                        "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"]
                    },
                    {
                        "id": "personalization_2",
                        "text": "다른 사람이 기분 나빠하면 내가 뭔가 잘못했다고 생각한다",
                        "type": "likert",
                        "scale": 5,
                        "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"]
                    }
                ]
            },
            {
                "title": "감정적 추론 성향",
                "questions": [
                    {
                        "id": "emotional_1",
                        "text": "기분이 나쁘면 실제로 나쁜 일이 일어날 것이라고 생각한다",
                        "type": "likert",
                        "scale": 5,
                        "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"]
                    },
                    {
                        "id": "emotional_2",
                        "text": "감정이 사실을 말해준다고 믿는다",
                        "type": "likert",
                        "scale": 5,
                        "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"]
                    }
                ]
            }
        ]
    }'::jsonb,
    '{
        "scoring": {
            "perfectionism": {
                "questions": ["perfectionism_1", "perfectionism_2", "perfectionism_3"],
                "max_score": 15,
                "thresholds": {"low": 5, "medium": 9, "high": 12}
            },
            "blackwhite": {
                "questions": ["blackwhite_1", "blackwhite_2"], 
                "max_score": 10,
                "thresholds": {"low": 3, "medium": 6, "high": 8}
            },
            "catastrophic": {
                "questions": ["catastrophic_1", "catastrophic_2"],
                "max_score": 10, 
                "thresholds": {"low": 3, "medium": 6, "high": 8}
            },
            "personalization": {
                "questions": ["personalization_1", "personalization_2"],
                "max_score": 10,
                "thresholds": {"low": 3, "medium": 6, "high": 8}
            },
            "emotional": {
                "questions": ["emotional_1", "emotional_2"],
                "max_score": 10,
                "thresholds": {"low": 3, "medium": 6, "high": 8}
            }
        }
    }'::jsonb,
    '{
        "habit_mapping": {
            "perfectionism": "완벽주의적 사고",
            "blackwhite": "흑백논리적 사고", 
            "catastrophic": "파국적 사고",
            "personalization": "개인화 사고",
            "emotional": "감정적 추론"
        }
    }'::jsonb
);

-- 3. 목표별 진단지 템플릿 (예시: 학습 목표)
INSERT INTO diagnostic_templates (id, name, description, type, target_goal, questions, scoring_rules, habit_mapping) VALUES
(
    gen_random_uuid(),
    '학습 목표 달성 진단',
    '학습 목표 달성을 방해하는 사고 패턴을 진단',
    'goal_specific',
    '학습',
    '{
        "sections": [
            {
                "title": "학습에 대한 사고 패턴",
                "questions": [
                    {
                        "id": "learning_perfectionism_1",
                        "text": "공부할 때 완벽하게 이해하지 못하면 다음으로 넘어가지 않는다",
                        "type": "likert",
                        "scale": 5,
                        "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"]
                    },
                    {
                        "id": "learning_catastrophic_1", 
                        "text": "시험에서 실수하면 모든 것이 끝났다고 생각한다",
                        "type": "likert",
                        "scale": 5,
                        "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"]
                    },
                    {
                        "id": "learning_blackwhite_1",
                        "text": "성적이 좋지 않으면 나는 공부를 못하는 사람이라고 생각한다",
                        "type": "likert",
                        "scale": 5,
                        "labels": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"]
                    }
                ]
            }
        ]
    }'::jsonb,
    '{
        "scoring": {
            "learning_habits": {
                "questions": ["learning_perfectionism_1", "learning_catastrophic_1", "learning_blackwhite_1"],
                "max_score": 15,
                "thresholds": {"low": 5, "medium": 9, "high": 12}
            }
        }
    }'::jsonb,
    '{
        "habit_mapping": {
            "learning_perfectionism_1": "완벽주의적 사고",
            "learning_catastrophic_1": "파국적 사고", 
            "learning_blackwhite_1": "흑백논리적 사고"
        }
    }'::jsonb
);

-- 4. 기본 처방 템플릿 (테이블 존재 확인 후 실행)
DO $$
BEGIN
    -- prescription_templates 테이블이 존재하는지 확인
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prescription_templates') THEN
        INSERT INTO prescription_templates (habit_id, name, description, treatment_approach, training_modules, duration_weeks, difficulty_level, success_criteria) 
        SELECT 
            th.id,
            th.name || ' 개선 프로그램',
            th.name || '을 개선하기 위한 체계적 훈련 프로그램',
            CASE 
                WHEN th.name = '완벽주의적 사고' THEN '점진적 노출과 인지 재구성을 통한 완벽주의 완화'
                WHEN th.name = '흑백논리적 사고' THEN '회색지대 인식 훈련과 균형잡힌 사고 연습'
                WHEN th.name = '파국적 사고' THEN '현실적 사고와 문제해결 기술 훈련'
                WHEN th.name = '개인화 사고' THEN '책임 분산과 객관적 관점 훈련'
                WHEN th.name = '감정적 추론' THEN '사실과 감정 분리 훈련'
            END,
            CASE 
                WHEN th.name = '완벽주의적 사고' THEN '{"modules": ["완벽주의 인식", "점진적 목표 설정", "실수 수용 연습", "자기 수용"]}'
                WHEN th.name = '흑백논리적 사고' THEN '{"modules": ["중간 지점 찾기", "다양한 관점 연습", "균형잡힌 평가", "유연한 사고"]}'
                WHEN th.name = '파국적 사고' THEN '{"modules": ["현실 점검", "최악 시나리오 대처", "문제 해결 기술", "불안 관리"]}'
                WHEN th.name = '개인화 사고' THEN '{"modules": ["책임 분석", "외부 요인 인식", "객관적 평가", "자존감 향상"]}'
                WHEN th.name = '감정적 추론' THEN '{"modules": ["감정 인식", "사실 확인", "논리적 분석", "감정 조절"]}'
            END::jsonb,
            4,
            CASE 
                WHEN th.name IN ('완벽주의적 사고', '파국적 사고') THEN 3
                ELSE 2
            END,
            '{"completion_rate": 80, "consistency_days": 20, "self_assessment_improvement": 3}'::jsonb
        FROM thinking_habits th;
        
        RAISE NOTICE 'Prescription templates inserted successfully';
    ELSE
        RAISE NOTICE 'prescription_templates table does not exist, skipping insert';
    END IF;
END $$;

COMMENT ON TABLE thinking_habits IS '기본 아픈 생각습관 데이터가 입력됨';
COMMENT ON TABLE diagnostic_templates IS '기본 진단지와 목표별 진단지 템플릿이 입력됨';
COMMENT ON TABLE prescription_templates IS '각 아픈 생각습관별 기본 처방 템플릿이 입력됨';