-- Supabase Storage 설정 및 RLS 정책

-- 1. Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public) 
VALUES ('journal-photos', 'journal-photos', true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-memos', 'voice-memos', false);

-- 2. Storage RLS 정책 설정

-- 사진 업로드 정책 (사용자는 자신의 폴더에만 업로드 가능)
CREATE POLICY "Users can upload their own photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'journal-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 사진 조회 정책 (공개 사진은 모두 조회 가능, 비공개는 본인만)
CREATE POLICY "Users can view photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'journal-photos' AND (
      -- 공개 일지의 사진은 모두 조회 가능
      EXISTS (
        SELECT 1 FROM journals j
        JOIN journal_photos jp ON j.id = jp.journal_id
        WHERE jp.photo_url LIKE '%' || name || '%'
        AND j.is_public = true
      )
      OR
      -- 본인의 사진은 항상 조회 가능
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- 음성 메모 정책 (본인만 업로드/조회 가능)
CREATE POLICY "Users can upload their own voice memos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'voice-memos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own voice memos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'voice-memos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. 파일 삭제 정책 (본인 파일만 삭제 가능)
CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    (bucket_id = 'journal-photos' OR bucket_id = 'voice-memos') AND
    (storage.foldername(name))[1] = auth.uid()::text
  );