# Think-Habit Project 배포 가이드

## 🚀 Vercel 배포 방법

### 1. 사전 준비
```bash
# Node.js 18+ 필요
node --version  # v18.0.0 이상 확인

# 의존성 설치
npm install

# 빌드 테스트
npm run build
```

### 2. 환경 변수 설정
`.env.local` 파일 생성 (또는 Vercel Dashboard에서 설정):

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth 설정 (선택사항)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 앱 URL (자동 설정됨)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 3. Vercel CLI로 배포

#### 방법 1: Vercel CLI 사용
```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

#### 방법 2: GitHub 연동 (추천)
1. GitHub에 코드 푸시
2. [vercel.com](https://vercel.com) 접속
3. "New Project" → GitHub 저장소 선택
4. 환경 변수 설정
5. "Deploy" 클릭

### 4. 도메인 설정 (선택사항)
Vercel Dashboard에서:
1. Project Settings → Domains
2. 커스텀 도메인 추가
3. DNS 설정 업데이트

## 📋 배포 체크리스트

- [x] `vercel.json` 설정 완료
- [x] `next.config.ts` 최적화 적용
- [x] 환경 변수 예시 파일 생성
- [ ] 빌드 테스트 통과
- [ ] 환경 변수 실제 값 설정
- [ ] Vercel 프로젝트 생성
- [ ] 배포 테스트

## 🔧 문제 해결

### 빌드 오류
```bash
# 캐시 클리어
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### 환경 변수 오류
- Vercel Dashboard에서 Environment Variables 확인
- `NEXT_PUBLIC_` 접두사 확인
- 민감한 정보는 암호화 설정

### 성능 최적화
- 이미지 최적화 적용됨
- 정적 파일 캐싱 설정됨
- 압축 활성화됨
- TypeScript/ESLint 검증 활성화

## 📞 지원
배포 중 문제 발생 시:
1. 이 문서의 문제 해결 섹션 확인
2. Vercel 공식 문서 참조
3. GitHub Issues에 문의

---
Generated: $(date)