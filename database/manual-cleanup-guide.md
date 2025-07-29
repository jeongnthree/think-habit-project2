# Supabase 테이블 수동 정리 가이드

## 1. Supabase Dashboard 접속
- https://supabase.com → 프로젝트 선택
- 좌측 메뉴에서 "SQL Editor" 클릭

## 2. 현재 테이블 목록 확인
다음 SQL을 실행하여 현재 테이블 목록을 확인하세요:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

## 3. 1단계: 기존 테이블 삭제
`cleanup-tables.sql` 파일의 내용을 복사해서 SQL Editor에 붙여넣고 실행:

```sql
-- 외래키가 있는 테이블부터 삭제
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS community_journals CASCADE;
DROP TABLE IF EXISTS training_journals CASCADE;
DROP TABLE IF EXISTS journal_categories CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS journals CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 기타 가능한 테이블들 삭제 (오류 발생해도 무시)
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS auth_sessions CASCADE;
DROP TABLE IF EXISTS file_uploads CASCADE;
-- ... (나머지 테이블들)
```

## 4. 2단계: 새 스키마 적용
`apply-clean-schema.sql` 파일의 내용을 복사해서 SQL Editor에 붙여넣고 실행:

```sql
-- 1. 사용자 테이블 (Google OAuth 연동)
CREATE TABLE IF NOT EXISTS users (
  auth_id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  role INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active',
  profile JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ... (나머지 테이블들)
```

## 5. 결과 확인
정리가 완료된 후 다시 테이블 목록을 확인:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

다음 5개 테이블만 남아있어야 합니다:
- comments
- community_journals  
- journal_categories
- training_journals
- users

## 6. 완료 확인
웹사이트 http://localhost:3002 에서 Google 로그인이 정상 작동하는지 확인하세요.

---
**주의사항**: 
- 기존 데이터가 삭제됩니다
- 필요시 백업을 먼저 생성하세요
- 오류가 발생해도 계속 진행하세요 (테이블이 없으면 오류 발생하지만 무시)