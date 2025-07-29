-- Training Journals 테이블 생성
-- 데스크톱/모바일 앱에서 동기화되는 일지들을 위한 테이블

CREATE TABLE IF NOT EXISTS training_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  external_id VARCHAR(255), -- 외부 앱에서의 ID
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}', -- 이미지 URL 배열
  image_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  sync_source VARCHAR(50) DEFAULT 'web' CHECK (sync_source IN ('web', 'desktop_app', 'mobile_app')),
  app_version VARCHAR(50),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- 중복 방지를 위한 유니크 제약
  UNIQUE(external_id, sync_source)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_training_journals_user_id ON training_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_training_journals_category_id ON training_journals(category_id);
CREATE INDEX IF NOT EXISTS idx_training_journals_external_id ON training_journals(external_id);
CREATE INDEX IF NOT EXISTS idx_training_journals_sync_source ON training_journals(sync_source);
CREATE INDEX IF NOT EXISTS idx_training_journals_is_public ON training_journals(is_public);
CREATE INDEX IF NOT EXISTS idx_training_journals_created_at ON training_journals(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_training_journals_updated_at 
  BEFORE UPDATE ON training_journals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE training_journals ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "Users can access own training journals" ON training_journals
    FOR ALL USING (
        user_id = auth.uid()
        OR is_public = true
        OR EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'coach')
        )
    );

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO training_journals (
  user_id, 
  category_id, 
  external_id,
  title, 
  content, 
  image_urls,
  image_count,
  is_public, 
  sync_source, 
  app_version
) VALUES 
(
  (SELECT user_id FROM user_profiles LIMIT 1),
  (SELECT id FROM categories WHERE name = '비판적 사고' LIMIT 1),
  'desktop_journal_001',
  '[데스크톱] 비판적 사고 훈련 일지',
  '데스크톱 앱에서 작성한 비판적 사고 훈련 일지입니다. 오늘은 정보의 출처를 확인하고 다양한 관점에서 생각해보는 연습을 했습니다.',
  '{}',
  0,
  true,
  'desktop_app',
  '1.0.0'
),
(
  (SELECT user_id FROM user_profiles LIMIT 1),
  (SELECT id FROM categories WHERE name = '창의적 사고' LIMIT 1),
  'mobile_journal_001',
  '[모바일] 창의적 사고 훈련',
  '모바일 앱에서 작성한 창의적 사고 훈련 일지입니다. 새로운 아이디어를 생성하고 기존 방식과 다른 접근법을 시도해보았습니다.',
  '{}',
  0,
  true,
  'mobile_app',
  '1.0.0'
);