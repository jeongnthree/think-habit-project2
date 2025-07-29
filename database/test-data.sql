-- 테스트용 데이터 생성 스크립트

-- 1. 테스트용 사용자 프로필 생성 (실제 UUID 사용)
INSERT INTO user_profiles (user_id, email, full_name, role) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'student1@example.com', '김철수', 'student'),
('550e8400-e29b-41d4-a716-446655440001', 'teacher1@example.com', '이선생', 'teacher'),
('550e8400-e29b-41d4-a716-446655440002', 'admin1@example.com', '관리자', 'admin');

-- 2. 테스트용 할당 생성
INSERT INTO assignments (student_id, category_id, assigned_by, weekly_goal) 
SELECT 
  '550e8400-e29b-41d4-a716-446655440000', -- 김철수
  c.id,
  '550e8400-e29b-41d4-a716-446655440002', -- 관리자
  2
FROM categories c 
WHERE c.name IN ('비판적 사고', '창의적 사고', '감정 조절')
LIMIT 3;

-- 3. 테스트용 일지 생성
INSERT INTO journals (student_id, category_id, title, content, is_public)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000', -- 김철수
  c.id,
  c.name || ' 훈련 일지',
  '오늘의 ' || c.name || ' 훈련을 진행했습니다. 많은 것을 배웠습니다.',
  true
FROM categories c 
WHERE c.name = '비판적 사고'
LIMIT 1;