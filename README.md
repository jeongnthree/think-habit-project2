# Think-Habit Lite

생각하는 습관을 기르는 간단하고 효과적인 훈련 플랫폼

## 📋 프로젝트 개요

Think-Habit Lite는 비판적 사고, 창의적 사고, 감정 조절 등 다양한 사고 능력을 체계적으로 훈련할 수 있는 웹 애플리케이션입니다. 학습자는 할당받은 카테고리에 따라 일지를 작성하고, 커뮤니티를 통해 다른 학습자들과 경험을 공유할 수 있습니다.

## ✨ 주요 기능

### 🎯 핵심 기능
- **카테고리 관리**: 관리자가 다양한 사고 훈련 카테고리를 생성하고 관리
- **카테고리 할당**: 학습자별로 맞춤형 카테고리 할당 및 목표 설정
- **훈련 일지 작성**: 템플릿 기반의 체계적인 일지 작성 시스템
- **댓글 시스템**: 감독/코치의 피드백 및 학습자 간 소통
- **진행률 대시보드**: 개인별 훈련 진행 상황 및 통계 확인

### 🌟 추가 기능
- **커뮤니티 게시판**: 공개 일지 공유 및 상호 격려
- **알림 시스템**: 할당, 댓글 등 주요 활동 알림
- **반응형 디자인**: 모바일 친화적 UI/UX
- **PWA 지원**: 앱과 같은 사용자 경험

## 🛠 기술 스택

### Frontend
- **Next.js 15**: React 기반 풀스택 프레임워크
- **TypeScript**: 타입 안전성을 위한 정적 타입 언어
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크
- **React Hook Form**: 폼 상태 관리
- **Zod**: 스키마 검증

### Backend
- **Next.js API Routes**: 서버리스 API 엔드포인트
- **Supabase**: 백엔드 서비스 (데이터베이스, 인증, 스토리지)

### 개발 도구
- **Jest**: 단위 테스트 프레임워크
- **Playwright**: E2E 테스트 도구
- **ESLint & Prettier**: 코드 품질 및 포맷팅
- **Husky**: Git 훅 관리

### 배포 및 인프라
- **Docker**: 컨테이너화
- **GitHub Actions**: CI/CD 파이프라인
- **Vercel/Netlify**: 배포 플랫폼 (권장)

## 🚀 시작하기

### 사전 요구사항
- Node.js 18.x 이상
- npm 또는 yarn
- Supabase 계정

### 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone https://github.com/your-username/think-habit-lite.git
   cd think-habit-lite
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   ```bash
   cp .env.example .env.local
   ```
   
   `.env.local` 파일을 열어 다음 값들을 설정하세요:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **데이터베이스 설정**
   ```bash
   # Supabase에서 제공하는 SQL 스크립트 실행
   # database/schema.sql
   # database/rls-policies.sql
   # database/indexes.sql
   ```

5. **개발 서버 실행**
   ```bash
   npm run dev
   ```

   브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📁 프로젝트 구조

```
think-habit-lite/
├── src/
│   ├── app/                    # Next.js 13+ App Router
│   │   ├── api/               # API 라우트
│   │   ├── dashboard/         # 대시보드 페이지
│   │   ├── training/          # 훈련 관련 페이지
│   │   ├── community/         # 커뮤니티 페이지
│   │   └── admin/             # 관리자 페이지
│   ├── components/            # 재사용 가능한 컴포넌트
│   │   ├── ui/               # 기본 UI 컴포넌트
│   │   ├── layout/           # 레이아웃 컴포넌트
│   │   └── training/         # 훈련 관련 컴포넌트
│   ├── lib/                  # 라이브러리 설정
│   ├── types/                # TypeScript 타입 정의
│   ├── utils/                # 유틸리티 함수
│   └── __tests__/            # 테스트 파일
├── database/                 # 데이터베이스 스키마
├── e2e/                     # E2E 테스트
├── public/                  # 정적 파일
└── docs/                    # 문서
```

## 🧪 테스트

### 단위 테스트
```bash
npm run test              # 테스트 실행
npm run test:watch        # 감시 모드로 테스트
npm run test:coverage     # 커버리지 포함 테스트
```

### E2E 테스트
```bash
npm run test:e2e          # E2E 테스트 실행
npm run test:e2e:ui       # UI 모드로 E2E 테스트
npm run test:e2e:debug    # 디버그 모드로 E2E 테스트
```

### 코드 품질
```bash
npm run lint              # ESLint 검사
npm run lint:fix          # ESLint 자동 수정
npm run type-check        # TypeScript 타입 검사
npm run format            # Prettier 포맷팅
```

## 🐳 Docker 배포

### Docker로 빌드 및 실행
```bash
npm run docker:build     # Docker 이미지 빌드
npm run docker:run       # Docker 컨테이너 실행
```

### Docker Compose 사용
```bash
npm run docker:compose   # 서비스 시작
npm run docker:compose:down  # 서비스 중지
```

## 📊 모니터링 및 분석

### 성능 모니터링
- 웹 바이탈 메트릭 추적
- 번들 크기 분석: `npm run analyze`
- 메모리 사용량 모니터링

### 에러 추적
- 클라이언트/서버 에러 로깅
- Sentry 연동 (선택사항)
- 헬스체크 엔드포인트: `/api/health`

## 🔧 개발 가이드

### 코딩 컨벤션
- TypeScript 사용 필수
- ESLint + Prettier 설정 준수
- 컴포넌트는 함수형으로 작성
- 커스텀 훅 활용 권장

### 커밋 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 프로세스 또는 보조 도구 변경
```

### 브랜치 전략
- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

## 🚀 배포

### Vercel 배포 (권장)
1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. 자동 배포 설정

### 수동 배포
```bash
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버 실행
```

## 📈 로드맵

### v1.1 (예정)
- [ ] 실시간 알림 시스템
- [ ] 파일 업로드 기능
- [ ] 고급 통계 및 분석
- [ ] 모바일 앱 (React Native)

### v1.2 (예정)
- [ ] 다국어 지원
- [ ] 테마 커스터마이징
- [ ] API 문서화
- [ ] 관리자 대시보드 고도화

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원 및 문의

- 이슈 리포트: [GitHub Issues](https://github.com/your-username/think-habit-lite/issues)
- 이메일: support@think-habit-lite.com
- 문서: [Wiki](https://github.com/your-username/think-habit-lite/wiki)

## 🙏 감사의 말

- [Next.js](https://nextjs.org/) - 웹 프레임워크
- [Supabase](https://supabase.com/) - 백엔드 서비스
- [Tailwind CSS](https://tailwindcss.com/) - CSS 프레임워크
- [Vercel](https://vercel.com/) - 배포 플랫폼

---

**Think-Habit Lite**로 더 나은 사고 습관을 만들어보세요! 🧠✨