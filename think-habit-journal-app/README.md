# 🎯 Think-Habit Journal Desktop App

Think-Habit 생각습관 개선을 위한 데스크톱 훈련 일지 애플리케이션입니다.

## ✨ 주요 기능

- 📝 **구조화된 일지 작성** - 템플릿 기반 체계적 일지 작성
- 📷 **사진 일지** - 이미지와 함께하는 자유로운 일지
- 📊 **대시보드** - 개인 진행 상황 및 통계 확인
- 🔄 **동기화** - 클라우드 기반 데이터 동기화
- 🎨 **테마 지원** - 라이트/다크 모드
- 📱 **반응형 UI** - 다양한 화면 크기 지원
- 🔐 **보안** - 안전한 인증 및 데이터 보호

## 🚀 빠른 시작

### 개발 환경 설정

1. **저장소 클론**

```bash
git clone <repository-url>
cd think-habit-journal-app
```

2. **의존성 설치**

```bash
npm install
```

3. **개발 서버 시작**

```bash
npm run dev
```

이 명령어는 다음을 자동으로 실행합니다:

- Webpack Dev Server (렌더러 프로세스) - http://localhost:3001
- TypeScript 컴파일 (메인 프로세스)
- Electron 앱 실행

### 개별 프로세스 실행

렌더러 프로세스만 실행:

```bash
npm run dev:renderer
```

메인 프로세스만 실행:

```bash
npm run dev:main
```

## 🛠️ 빌드

### 개발 빌드

```bash
npm run build
```

### 프로덕션 패키징

```bash
npm run pack    # 패키징만
npm run dist    # 배포용 인스톨러 생성
```

## 📁 프로젝트 구조

```
think-habit-journal-app/
├── src/
│   ├── main/                 # 메인 프로세스
│   │   ├── main.ts          # Electron 메인 프로세스
│   │   └── preload.ts       # Preload 스크립트
│   ├── renderer/            # 렌더러 프로세스
│   │   ├── App.tsx          # 메인 React 컴포넌트
│   │   ├── index.tsx        # 진입점
│   │   └── index.html       # HTML 템플릿
│   ├── components/          # React 컴포넌트
│   │   ├── auth/           # 인증 관련
│   │   ├── dashboard/      # 대시보드
│   │   ├── journal/        # 일지 작성
│   │   └── ...
│   ├── services/           # 비즈니스 로직
│   ├── hooks/              # React 훅
│   ├── utils/              # 유틸리티
│   └── types/              # TypeScript 타입
├── assets/                 # 정적 자산
├── database/              # 데이터베이스 스키마
├── scripts/               # 빌드/개발 스크립트
└── dist/                  # 빌드 출력
```

## 🔧 개발 도구

### 코드 품질

```bash
npm run lint        # ESLint 실행
npm run lint:fix    # 자동 수정
npm run type-check  # TypeScript 타입 검사
```

### 정리

```bash
npm run clean       # 빌드 파일 정리
```

## ⚙️ 설정

### 환경 변수

`.env` 파일에서 설정:

```env
# Supabase 설정
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 개발 모드
NODE_ENV=development
```

### TypeScript 설정

- `tsconfig.json` - 전체 프로젝트 설정
- `tsconfig.main.json` - 메인 프로세스 설정
- `tsconfig.renderer.json` - 렌더러 프로세스 설정

### Webpack 설정

- `webpack.renderer.config.js` - 렌더러 프로세스 번들링

## 🧪 테스트

```bash
npm run test        # 테스트 실행 (설정 필요)
```

## 📦 배포

### Electron Builder 설정

`package.json`에서 빌드 설정:

```json
{
  "build": {
    "appId": "com.think-habit.journal",
    "productName": "Think-Habit Journal",
    "directories": {
      "output": "release"
    },
    "files": ["dist/**/*", "assets/**/*"],
    "mac": {
      "category": "public.app-category.productivity"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

## 🐛 문제 해결

### 일반적인 문제

1. **포트 충돌**
   - 3001 포트가 사용 중인 경우 `webpack.renderer.config.js`에서 포트 변경

2. **TypeScript 컴파일 오류**

   ```bash
   npm run type-check
   ```

3. **의존성 문제**

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **빌드 캐시 문제**
   ```bash
   npm run clean
   npm run build
   ```

### 로그 확인

개발 모드에서는 다음 로그를 확인할 수 있습니다:

- `[Renderer]` - 렌더러 프로세스 로그
- `[Main]` - 메인 프로세스 로그
- `[TSC]` - TypeScript 컴파일 로그

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원

- 📧 이메일: support@think-habit.com
- 🐛 버그 리포트: GitHub Issues
- 📖 문서: 프로젝트 위키

---

Made with ❤️ by Think-Habit Team
