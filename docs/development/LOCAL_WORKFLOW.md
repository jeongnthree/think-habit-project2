# 로컬 전용 Think-Habit 작업 플로우

## 🏠 로컬 환경에서의 멀티 툴 작업 관리

### 기본 원칙

- Git을 로컬 버전 관리로만 사용
- 각 도구 전환 시 로컬 커밋으로 상태 저장
- 파일 시스템 기반 동기화

## 🔄 작업 전환 플로우

### 키로 → VSCode 전환 시

```bash
# 1. 현재 작업 상태 체크
npm run sync:check

# 2. 로컬 저장 (변경사항이 있다면)
npm run sync:local

# 3. VSCode에서 작업 시작
# (별도 명령 불필요 - 같은 폴더 사용)
```

### VSCode → 키로 전환 시

```bash
# 1. VSCode에서 작업 완료 후 저장
git add .
git commit -m "feat(electron): VSCode 작업 완료"

# 2. 키로에서 상태 체크
npm run sync:check
```

## 📁 작업 영역 관리

### 키로 전용 영역

- `src/` - Next.js 웹 애플리케이션
- `.kiro/specs/` - 프로젝트 스펙
- `database/` - DB 스키마
- `e2e/`, `src/__tests__/` - 테스트

### VSCode 전용 영역

- `think-habit-journal-app/` - Electron 앱
- 실험적 기능 개발

### 공유 영역 (주의)

- `shared/` - 공통 코드
- `package.json` - 워크스페이스 설정

## 🛡️ 충돌 방지 전략

### 1. 파일 레벨 분리

```
키로 작업: src/app/, src/components/training/
VSCode 작업: think-habit-journal-app/
```

### 2. 작업 전 체크

```bash
npm run sync:check  # 항상 실행
```

### 3. 정기적 로컬 저장

```bash
npm run sync:local  # 작업 단위별 저장
```

## 📊 상태 모니터링

### 일일 체크 (매일 작업 시작 시)

```bash
npm run sync:check
```

### 주간 점검 (매주 금요일)

```bash
npm run lint:all
npm run test:all
git log --oneline -10  # 최근 커밋 확인
```

## 🚨 문제 해결

### 파일 충돌 시

1. 현재 작업 백업: `cp -r . ../backup-$(date +%Y%m%d)`
2. Git 상태 확인: `git status`
3. 충돌 파일 수동 병합
4. 테스트: `npm run sync:check`

### 의존성 문제 시

```bash
rm -rf node_modules package-lock.json
npm install
npm run sync:check
```

## 💡 로컬 작업 팁

1. **자주 커밋**: 작은 단위로 자주 로컬 저장
2. **명확한 메시지**: 어떤 도구에서 작업했는지 명시
3. **백업 습관**: 중요한 작업 전 폴더 복사
4. **테스트 우선**: 변경 후 항상 `sync:check` 실행

## 📝 커밋 메시지 컨벤션

```
feat(web): 키로에서 웹 기능 추가
feat(electron): VSCode에서 일렉트론 기능 추가
fix(shared): 공통 코드 버그 수정
sync: 도구 전환을 위한 상태 저장
```
