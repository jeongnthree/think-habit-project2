# 보안 가이드라인

## 환경변수 관리

### 절대 커밋하면 안 되는 파일들

- `.env.local`
- `.env.production`
- `.env.development`
- 모든 실제 키가 포함된 파일

### 안전한 키 관리

1. **Service Role Key**: 서버사이드에서만 사용
2. **Anon Key**: 클라이언트에서 사용 (공개되어도 RLS로 보호)
3. **개발/프로덕션 키 분리**: 다른 Supabase 프로젝트 사용 권장

## Supabase 보안 설정

### RLS (Row Level Security) 정책

- 모든 테이블에 RLS 활성화
- 사용자별 데이터 접근 제한
- 관리자/코치 권한 분리

### 데이터베이스 보안

```sql
-- 예시: 사용자는 자신의 데이터만 접근
CREATE POLICY "Users can only access own data" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);
```

## API 보안

### 인증 검사

- 모든 API 엔드포인트에서 사용자 인증 확인
- 권한별 접근 제어 (admin, coach, user)

### 입력 검증

- Zod 스키마를 사용한 입력 검증
- SQL 인젝션 방지
- XSS 공격 방지

## 배포 보안

### 환경변수 설정

- Vercel/Netlify 환경변수에 실제 키 설정
- 프로덕션용 별도 Supabase 프로젝트 사용

### HTTPS 강제

- 모든 통신 HTTPS 사용
- Secure 쿠키 설정

## 모니터링

### 로그 관리

- 민감한 정보 로그에 기록 금지
- 에러 로그 모니터링
- 비정상적 접근 패턴 감지

### 정기 보안 점검

- 키 순환 (3-6개월마다)
- 의존성 보안 업데이트
- 접근 권한 검토

## 사고 대응

### 키 노출 시 대응

1. 즉시 키 비활성화
2. 새 키 생성 및 교체
3. 로그 분석으로 피해 범위 확인
4. 사용자 알림 (필요시)

### 연락처

- 보안 이슈 신고: security@think-habit.com
- 긴급 상황: 즉시 키 비활성화 후 연락
