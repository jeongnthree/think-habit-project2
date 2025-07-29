-- Training Journal System Migration
-- 훈련 일지 시스템을 위한 데이터베이스 스키마 확장

-- 1. 태스크 템플릿 테이블 (코치/관리자가 생성하는 to-do list 항목들)
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  difficulty_level VARCHAR(10) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  estimated_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. 태스크 완료 기록 테이블 (구조화된 일지에서 체크된 항목들)
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID REFERENCES journals(id) ON DELETE CASCADE NOT NULL,
  task_template_id UUID REFERENCES task_templates(id) ON DELETE CASCADE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completion_note TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(journal_id, task_template_id)
);

-- 3. 일지 사진 테이블 (사진 일지용)
CREATE TABLE IF NOT EXISTS journal_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID REFERENCES journals(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER DEFAULT 0,
  file_size INTEGER,
  file_type VARCHAR(50),
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. 진행률 추적 테이블 (주간 목표 달성률 등)
CREATE TABLE IF NOT EXISTS progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL,
  target_count INTEGER DEFAULT 1,
  completed_count INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_entry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, category_id, week_start_date)
);

-- 트리거 설정 (updated_at 자동 업데이트)
CREATE TRIGGER update_task_templates_updated_at 
  BEFORE UPDATE ON task_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_tracking_updated_at 
  BEFORE UPDATE ON progress_tracking 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_task_templates_category_id ON task_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_order_index ON task_templates(category_id, order_index);
CREATE INDEX IF NOT EXISTS idx_task_completions_journal_id ON task_completions(journal_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_template_id ON task_completions(task_template_id);
CREATE INDEX IF NOT EXISTS idx_journal_photos_journal_id ON journal_photos(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_photos_order_index ON journal_photos(journal_id, order_index);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_user_category ON progress_tracking(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_week ON progress_tracking(week_start_date);
CREATE INDEX IF NOT EXISTS idx_journals_student_category ON journals(student_id, category_id);
CREATE INDEX IF NOT EXISTS idx_journals_created_at ON journals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journals_type ON journals(journal_type);

-- 샘플 태스크 템플릿 데이터 삽입
INSERT INTO task_templates (category_id, title, description, order_index, difficulty_level, estimated_minutes) 
SELECT 
  c.id,
  task.title,
  task.description,
  task.order_index,
  task.difficulty_level,
  task.estimated_minutes
FROM categories c
CROSS JOIN (
  VALUES 
    ('정보의 출처 확인하기', '오늘 접한 정보의 출처가 신뢰할 만한지 검토해보세요', 1, 'easy', 5),
    ('다른 관점에서 생각해보기', '같은 상황을 다른 관점에서 바라보는 연습을 해보세요', 2, 'medium', 10),
    ('숨겨진 가정 찾기', '내 생각 속에 숨어있는 가정이나 편견이 없는지 점검해보세요', 3, 'hard', 15),
    ('근거의 충분성 평가하기', '결론을 내리기에 충분한 근거가 있는지 평가해보세요', 4, 'medium', 10)
) AS task(title, description, order_index, difficulty_level, estimated_minutes)
WHERE c.name = '비판적 사고';

INSERT INTO task_templates (category_id, title, description, order_index, difficulty_level, estimated_minutes) 
SELECT 
  c.id,
  task.title,
  task.description,
  task.order_index,
  task.difficulty_level,
  task.estimated_minutes
FROM categories c
CROSS JOIN (
  VALUES 
    ('문제 상황 정의하기', '해결하고 싶은 문제나 개선하고 싶은 상황을 명확히 정의해보세요', 1, 'easy', 5),
    ('기존 접근법 분석하기', '현재 사용되고 있는 기존의 접근 방식을 분석해보세요', 2, 'medium', 10),
    ('새로운 관점 탐색하기', '전혀 다른 관점에서 문제에 접근해보는 연습을 해보세요', 3, 'hard', 15),
    ('창의적 아이디어 제시하기', '새로운 아이디어를 최소 3가지 이상 제시해보세요', 4, 'hard', 20)
) AS task(title, description, order_index, difficulty_level, estimated_minutes)
WHERE c.name = '창의적 사고';

INSERT INTO task_templates (category_id, title, description, order_index, difficulty_level, estimated_minutes) 
SELECT 
  c.id,
  task.title,
  task.description,
  task.order_index,
  task.difficulty_level,
  task.estimated_minutes
FROM categories c
CROSS JOIN (
  VALUES 
    ('결정 상황 기록하기', '오늘 내린 중요한 결정이나 판단을 기록해보세요', 1, 'easy', 5),
    ('근거와 논리 분석하기', '그 결정의 근거와 논리적 과정을 분석해보세요', 2, 'medium', 10),
    ('논리적 오류 점검하기', '논리적 오류나 빈틈이 없었는지 점검해보세요', 3, 'hard', 15),
    ('개선 방안 모색하기', '더 나은 논리적 접근 방법을 모색해보세요', 4, 'medium', 10)
) AS task(title, description, order_index, difficulty_level, estimated_minutes)
WHERE c.name = '논리적 사고';

INSERT INTO task_templates (category_id, title, description, order_index, difficulty_level, estimated_minutes) 
SELECT 
  c.id,
  task.title,
  task.description,
  task.order_index,
  task.difficulty_level,
  task.estimated_minutes
FROM categories c
CROSS JOIN (
  VALUES 
    ('감정 상황 인식하기', '오늘 경험한 강한 감정 상황을 인식하고 기록해보세요', 1, 'easy', 5),
    ('감정 원인 분석하기', '그 감정의 원인과 배경을 분석해보세요', 2, 'medium', 10),
    ('반응 패턴 점검하기', '감정에 어떻게 반응했는지 점검해보세요', 3, 'medium', 10),
    ('건설적 대응 방안 찾기', '더 건설적인 반응 방법을 찾아보세요', 4, 'hard', 15)
) AS task(title, description, order_index, difficulty_level, estimated_minutes)
WHERE c.name = '감정 조절';

INSERT INTO task_templates (category_id, title, description, order_index, difficulty_level, estimated_minutes) 
SELECT 
  c.id,
  task.title,
  task.description,
  task.order_index,
  task.difficulty_level,
  task.estimated_minutes
FROM categories c
CROSS JOIN (
  VALUES 
    ('소통 상황 기록하기', '오늘의 중요한 대화나 소통 상황을 기록해보세요', 1, 'easy', 5),
    ('상대방 입장 이해하기', '상대방의 입장을 충분히 이해했는지 점검해보세요', 2, 'medium', 10),
    ('의견 전달 평가하기', '내 의견을 명확하게 전달했는지 평가해보세요', 3, 'medium', 10),
    ('소통 개선 방안 모색하기', '더 나은 소통 방법을 모색해보세요', 4, 'medium', 10)
) AS task(title, description, order_index, difficulty_level, estimated_minutes)
WHERE c.name = '의사소통';

-- 권한 설정 (RLS - Row Level Security)
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- 태스크 템플릿: 모든 사용자가 읽기 가능, 관리자/코치만 수정 가능
CREATE POLICY "task_templates_select_policy" ON task_templates
  FOR SELECT USING (true);

CREATE POLICY "task_templates_insert_policy" ON task_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'coach', 'teacher')
    )
  );

CREATE POLICY "task_templates_update_policy" ON task_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'coach', 'teacher')
    )
  );

CREATE POLICY "task_templates_delete_policy" ON task_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'coach', 'teacher')
    )
  );

-- 태스크 완료: 본인 일지의 완료 기록만 접근 가능
CREATE POLICY "task_completions_policy" ON task_completions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM journals j 
      WHERE j.id = task_completions.journal_id 
      AND j.student_id = auth.uid()
    )
  );

-- 일지 사진: 본인 일지의 사진만 접근 가능
CREATE POLICY "journal_photos_policy" ON journal_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM journals j 
      WHERE j.id = journal_photos.journal_id 
      AND j.student_id = auth.uid()
    )
  );

-- 진행률 추적: 본인 데이터만 접근 가능
CREATE POLICY "progress_tracking_policy" ON progress_tracking
  FOR ALL USING (user_id = auth.uid());

-- 관리자는 모든 데이터 접근 가능
CREATE POLICY "admin_full_access_task_completions" ON task_completions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "admin_full_access_journal_photos" ON journal_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "admin_full_access_progress_tracking" ON progress_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );