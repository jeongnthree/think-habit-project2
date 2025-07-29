-- Think-Habit Lite RLS Policies (간소화)
-- 보안 정책을 단순하고 명확하게 설정

-- RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 1. user_profiles 정책
-- 사용자는 자신의 프로필만 읽기/수정, 관리자는 모든 접근
CREATE POLICY "Users can read own profile" 
ON user_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admin full access for profiles" 
ON user_profiles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 2. categories 정책
-- 모든 사용자 읽기 가능, 관리자만 쓰기 가능
CREATE POLICY "Public read access for categories" 
ON categories FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin full access for categories" 
ON categories FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 3. assignments 정책
-- 학습자는 자신의 할당만 읽기, 관리자/교사/코치는 관리 가능
CREATE POLICY "Students can read own assignments" 
ON assignments FOR SELECT 
USING (
  auth.uid() = student_id AND is_active = true
);

CREATE POLICY "Admin and teachers can manage assignments" 
ON assignments FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'teacher', 'coach')
  )
);

-- 4. journals 정책 (핵심)
-- 학습자는 할당받은 카테고리의 일지만 관리 가능
CREATE POLICY "Students can manage own journals for assigned categories" 
ON journals FOR ALL 
USING (
  auth.uid() = student_id AND
  category_id IN (
    SELECT category_id 
    FROM assignments 
    WHERE student_id = auth.uid() 
    AND is_active = true
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  )
);

-- 공개된 일지는 모든 사용자 읽기 가능
CREATE POLICY "Public can read shared journals" 
ON journals FOR SELECT 
USING (is_public = true);

-- 교사/코치는 담당 학습자의 일지 읽기 가능 (비공개 포함)
CREATE POLICY "Teachers can read student journals" 
ON journals FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'coach', 'admin')
  )
);

-- 5. comments 정책
-- 모든 사용자 읽기 가능, 교사/코치/관리자만 댓글 작성 가능
CREATE POLICY "Public can read comments" 
ON comments FOR SELECT 
USING (true);

CREATE POLICY "Teachers can create comments" 
ON comments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'coach', 'admin')
  )
);

CREATE POLICY "Authors can update own comments" 
ON comments FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own comments" 
ON comments FOR DELETE 
USING (auth.uid() = author_id);

-- 6. notifications 정책
-- 사용자는 자신의 알림만 관리 가능
CREATE POLICY "Users can manage own notifications" 
ON notifications FOR ALL 
USING (auth.uid() = user_id);

-- 시스템에서 알림 생성 (서버 사이드에서 처리)
CREATE POLICY "System can create notifications" 
ON notifications FOR INSERT 
WITH CHECK (true);

-- 댓글 작성 시 자동 알림 생성 함수
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- 일지 작성자에게 알림 발송
  INSERT INTO notifications (user_id, type, title, message)
  SELECT 
    j.student_id,
    'comment',
    '새로운 댓글이 달렸습니다',
    '회원님의 훈련 일지 "' || j.title || '"에 새로운 댓글이 달렸습니다.'
  FROM journals j
  WHERE j.id = NEW.journal_id
  AND j.student_id != NEW.author_id; -- 자신의 댓글에는 알림 안함
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 댓글 알림 트리거
CREATE TRIGGER comment_notification_trigger
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION create_comment_notification();

-- 할당 시 자동 알림 생성 함수
CREATE OR REPLACE FUNCTION create_assignment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- 학습자에게 할당 알림 발송
  INSERT INTO notifications (user_id, type, title, message)
  SELECT 
    NEW.student_id,
    'assignment',
    '새로운 카테고리가 할당되었습니다',
    '새로운 훈련 카테고리가 할당되었습니다. 주당 ' || NEW.weekly_goal || '회 훈련을 목표로 해보세요.'
  WHERE NEW.is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 할당 알림 트리거
CREATE TRIGGER assignment_notification_trigger
  AFTER INSERT ON assignments
  FOR EACH ROW EXECUTE FUNCTION create_assignment_notification();