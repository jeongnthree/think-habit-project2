-- Think-Habit Lite 사진 일지 확장 스키마

-- 1. journals 테이블에 일지 타입 컬럼 추가
ALTER TABLE journals 
ADD COLUMN journal_type VARCHAR(20) DEFAULT 'structured' 
CHECK (journal_type IN ('structured', 'photo', 'mixed'));

-- 2. 사진 일지 테이블 생성
CREATE TABLE IF NOT EXISTS journal_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID REFERENCES journals(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  ocr_text TEXT,
  auto_tags TEXT[] DEFAULT '{}',
  file_size INTEGER,
  file_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. 구조화된 응답 테이블 생성
CREATE TABLE IF NOT EXISTS journal_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID REFERENCES journals(id) ON DELETE CASCADE NOT NULL,
  question_id VARCHAR(50) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. 음성 메모 테이블 생성
CREATE TABLE IF NOT EXISTS journal_voice_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID REFERENCES journals(id) ON DELETE CASCADE NOT NULL,
  voice_url TEXT NOT NULL,
  transcription TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. 인덱스 생성
CREATE INDEX idx_journal_photos_journal_id ON journal_photos(journal_id);
CREATE INDEX idx_journal_responses_journal_id ON journal_responses(journal_id);
CREATE INDEX idx_journal_voice_memos_journal_id ON journal_voice_memos(journal_id);

-- 6. 스토리지 버킷 정책 (Supabase에서 실행)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('journal-photos', 'journal-photos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('voice-memos', 'voice-memos', false);

-- 7. RLS 정책 (Row Level Security)
ALTER TABLE journal_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_voice_memos ENABLE ROW LEVEL SECURITY;

-- 사진 접근 정책
CREATE POLICY "Users can view their own journal photos" ON journal_photos
  FOR SELECT USING (
    journal_id IN (
      SELECT id FROM journals WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own journal photos" ON journal_photos
  FOR INSERT WITH CHECK (
    journal_id IN (
      SELECT id FROM journals WHERE student_id = auth.uid()
    )
  );

-- 응답 접근 정책
CREATE POLICY "Users can view their own journal responses" ON journal_responses
  FOR SELECT USING (
    journal_id IN (
      SELECT id FROM journals WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own journal responses" ON journal_responses
  FOR INSERT WITH CHECK (
    journal_id IN (
      SELECT id FROM journals WHERE student_id = auth.uid()
    )
  );