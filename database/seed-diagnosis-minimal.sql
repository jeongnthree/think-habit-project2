-- Think-Habit 진단 시스템 최소 시드 데이터 (필수만)

-- 1. 기본 아픈 생각습관 정의
INSERT INTO thinking_habits (id, name, description, category, severity_levels, symptoms) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    '완벽주의적 사고',
    '모든 것을 완벽하게 해야 한다는 강박적 사고 패턴',
    '인지적 왜곡',
    '{"1": "가끔 완벽을 추구", "2": "자주 완벽을 추구", "3": "항상 완벽해야 함", "4": "완벽하지 않으면 실패", "5": "완벽주의로 인한 마비"}'::jsonb,
    '["미루기", "과도한 자기비판", "결정 회피", "스트레스 증가"]'::jsonb
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    '흑백논리적 사고',
    '모든 것을 극단적으로 좋거나 나쁘게만 판단하는 사고 패턴',
    '인지적 왜곡',
    '{"1": "가끔 극단적 판단", "2": "자주 극단적 판단", "3": "대부분 극단적 판단", "4": "항상 극단적 판단", "5": "중간 지점을 전혀 인식 못함"}'::jsonb,
    '["관계 갈등", "감정 기복", "결정 어려움", "스트레스"]'::jsonb
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    '파국적 사고',
    '작은 문제를 큰 재앙으로 확대해석하는 사고 패턴',
    '인지적 왜곡',
    '{"1": "가끔 과장", "2": "자주 과장", "3": "대부분 과장", "4": "항상 최악 예상", "5": "현실 인식 불가"}'::jsonb,
    '["불안 증가", "회피 행동", "우울감", "신체 증상"]'::jsonb
);

-- 2. 기본 진단지 템플릿
INSERT INTO diagnostic_templates (id, name, description, type, questions, scoring_rules, habit_mapping) VALUES
(
    '550e8400-e29b-41d4-a716-446655440010',
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
                    }
                ]
            }
        ]
    }'::jsonb,
    '{
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
    }'::jsonb,
    '{
        "habit_mapping": {
            "perfectionism": "완벽주의적 사고",
            "blackwhite": "흑백논리적 사고", 
            "catastrophic": "파국적 사고"
        }
    }'::jsonb
);

COMMENT ON TABLE thinking_habits IS '기본 아픈 생각습관 데이터 (최소 버전)';
COMMENT ON TABLE diagnostic_templates IS '기본 진단지 템플릿 (최소 버전)';