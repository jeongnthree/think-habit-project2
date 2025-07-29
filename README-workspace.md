# Think-Habit Workspace

Think-Habit 프로젝트의 통합 워크스페이스입니다.

## 프로젝트 구조

```
think-habit-project/
├── think-habit-lite/              # Next.js 웹 애플리케이션
├── think-habit-journal-app/       # Electron 데스크톱 앱
├── think-habit-group-widget/      # 단체용 임베드 위젯
├── shared/                        # 공통 라이브러리
│   ├── types/                     # TypeScript 타입 정의
│   ├── utils/                     # 공통 유틸리티 함수
│   ├── constants/                 # 공통 상수
│   └── api-client/                # API 클라이언트
└── package.json.workspace         # 워크스페이스 설정
```

## 각 프로젝트 설명

### think-habit-lite

- **기술**: Next.js 15 + React 19 + TypeScript
- **목적**: Think-Habit 메인 웹 애플리케이션
- **기능**: 아픈 생각습관 진단과 처방, 사용자 관리, 훈련 일지, 커뮤니티 게시판

### think-habit-journal-app

- **기술**: Electron + React + TypeScript + SQLite
- **목적**: 개인용 데스크톱 일지 앱
- **기능**: 오프라인 일지 작성, 자동 동기화, 파일 관리

### think-habit-group-widget

- **기술**: React + TypeScript + Vite
- **목적**: 단체/조직용 임베드 위젯
- **기능**: 실시간 진행률, 리더보드, 커스터마이징

### shared

- **types**: 모든 프로젝트에서 사용하는 공통 타입
- **utils**: 날짜, 검증 등 공통 유틸리티 함수
- **constants**: API 엔드포인트, 설정값 등
- **api-client**: Think-Habit API 클라이언트 라이브러리

## 개발 명령어

```bash
# 워크스페이스 활성화 (필요시)
mv package.json.workspace package.json

# 각 프로젝트 개발 서버 실행
npm run dev:web      # 웹 애플리케이션
npm run dev:app      # 데스크톱 앱
npm run dev:widget   # 위젯

# 전체 빌드
npm run build:all

# 전체 테스트
npm run test:all
```

## 설치 및 실행

1. **의존성 설치**

   ```bash
   # 각 프로젝트별로 설치
   cd think-habit-lite && npm install
   cd ../think-habit-journal-app && npm install
   cd ../think-habit-group-widget && npm install
   ```

2. **개발 서버 실행**

   ```bash
   # 웹 앱
   cd think-habit-lite && npm run dev

   # 데스크톱 앱
   cd think-habit-journal-app && npm run dev

   # 위젯
   cd think-habit-group-widget && npm run dev
   ```

## 배포

- **웹 앱**: Vercel/Netlify
- **데스크톱 앱**: GitHub Releases (Windows/macOS/Linux)
- **위젯**: CDN 배포 (jsDelivr/unpkg)
