# Think-Habit 프로젝트 동기화 체크리스트

## 🔄 작업 전 필수 체크사항

### 키로에서 작업 시작 전

```bash
# 1. 현재 상태 확인
git status
git log --oneline -5

# 2. 최신 코드 가져오기
git pull origin main

# 3. 워크스페이스 상태 확인
npm run lint:all
npm run type-check
```

### VSCode + Claude 작업 후 키로 복귀 시

```bash
# 1. 변경사항 확인
git status
git diff

# 2. 커밋 전 검증
npm run lint:all
npm run test:all

# 3. 커밋 및 푸시
git add .
git commit -m "feat(electron): [작업 내용 요약]"
git push origin main
```

## 📁 프로젝트 구조 매핑

### 현재 구조

```
think-habit-workspace/
├── src/                          # 메인 Next.js 웹앱
├── think-habit-journal-app/      # Electron 앱 (VSCode 작업)
├── think-habit-group-widget/     # 위젯 컴포넌트
├── think-habit-lite/             # 라이트 버전
└── shared/                       # 공통 코드
```

### 역할 분담

- **키로**: 웹앱(src/), 스펙 관리(.kiro/), 테스트, 아키텍처
- **VSCode + Claude**: Electron 앱(think-habit-journal-app/), 빠른 프로토타이핑

## ⚠️ 주의사항

### 충돌 방지

1. 같은 파일을 동시에 수정하지 않기
2. shared/ 폴더 수정 시 양쪽 도구에서 확인
3. package.json 변경 시 워크스페이스 전체 영향 고려

### 코드 품질 유지

1. 커밋 전 항상 lint 실행
2. 타입 에러 해결 후 커밋
3. 테스트 실패 시 수정 후 진행

## 🚨 문제 발생 시 대응

### 머지 충돌

```bash
git status
git merge --abort  # 필요시
git pull --rebase origin main
```

### 의존성 충돌

```bash
rm -rf node_modules package-lock.json
npm install
```

### 타입 에러

```bash
npm run type-check
# 에러 확인 후 수정
```
