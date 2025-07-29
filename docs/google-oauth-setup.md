# Google OAuth 설정 가이드

이 문서는 Think-Habit Lite 프로젝트에서 Google OAuth를 설정하는 방법을 안내합니다.

## 1. Google Cloud Console에서 OAuth 클라이언트 ID 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 로그인합니다.
2. 프로젝트를 생성하거나 기존 프로젝트를 선택합니다.
3. 왼쪽 메뉴에서 "API 및 서비스" > "사용자 인증 정보"로 이동합니다.
4. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID"를 클릭합니다.
5. 애플리케이션 유형으로 "웹 애플리케이션"을 선택합니다.
6. 이름을 입력합니다 (예: "Think-Habit Lite").
7. "승인된 자바스크립트 원본"에 앱 URL을 추가합니다:
   - 개발 환경: `http://localhost:3000`
   - 프로덕션 환경: `https://your-production-domain.com`
8. "승인된 리디렉션 URI"에 콜백 URL을 추가합니다:
   - 개발 환경: `http://localhost:3000/api/auth/google/callback`
   - 프로덕션 환경: `https://your-production-domain.com/api/auth/google/callback`
9. "만들기"를 클릭합니다.
10. 생성된 "클라이언트 ID"와 "클라이언트 보안 비밀번호"를 기록해둡니다.

## 2. 환경 변수 설정

프로젝트 루트에 있는 `.env.local` 파일에 다음 변수를 설정합니다:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

프로덕션 환경에서는 리디렉션 URI를 프로덕션 도메인으로 변경하세요.

## 3. Supabase 설정

1. [Supabase 대시보드](https://app.supabase.io/)에 로그인합니다.
2. 프로젝트를 선택합니다.
3. 왼쪽 메뉴에서 "Authentication" > "Providers"로 이동합니다.
4. "Google" 제공자를 찾아 활성화합니다.
5. Google Cloud Console에서 얻은 클라이언트 ID와 클라이언트 보안 비밀번호를 입력합니다.
6. "Save"를 클릭합니다.

## 4. 테스트

1. 개발 서버를 재시작합니다.
2. 로그인 페이지로 이동합니다.
3. "Google로 로그인" 버튼을 클릭합니다.
4. Google 계정을 선택하고 권한을 부여합니다.
5. 성공적으로 로그인되면 대시보드로 리디렉션됩니다.

## 문제 해결

### 리디렉션 URI 불일치 오류

오류 메시지: "redirect_uri_mismatch"

해결 방법:

- Google Cloud Console에서 승인된 리디렉션 URI가 정확히 일치하는지 확인합니다.
- 프로토콜(http/https), 도메인, 포트, 경로가 모두 정확히 일치해야 합니다.

### 인증 오류

오류 메시지: "invalid_client"

해결 방법:

- 클라이언트 ID와 보안 비밀번호가 올바르게 설정되었는지 확인합니다.
- Google Cloud Console에서 OAuth 동의 화면이 구성되었는지 확인합니다.

### CORS 오류

해결 방법:

- Google Cloud Console에서 승인된 자바스크립트 원본이 올바르게 설정되었는지 확인합니다.
- API 라우트에서 적절한 CORS 헤더를 설정합니다.

## 보안 고려사항

- 클라이언트 보안 비밀번호(GOOGLE_CLIENT_SECRET)는 절대 클라이언트 측 코드에 노출되지 않도록 주의하세요.
- 항상 서버 측 API 라우트를 통해 토큰 교환 및 인증 처리를 수행하세요.
- 적절한 CSRF 보호 메커니즘을 구현하세요.
