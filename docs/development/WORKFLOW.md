# Think-Habit 멀티 툴 작업 플로우

## 🔄 작업 전환 시 필수 절차

### 키로 → VSCode 전환 시

```bash
# 1. 현재 작업 저장
npm run sync:before-switch

# 2. 커밋 (변경사항이 있다면)
git commit -m "feat(web): 키로에서 작업한 내용"
git push origin main

# 3. VSCode에서 최신 코드 받기
git pull origin main
```

### VSCode → 키로 전환 시

```bash
# 1. VSCode에서 작업 저장
git add .
git commit -m "feat(electron): VSCode에서 작업한 내용"
git push origin main

# 2. 키로에서 최신 코드 받기
npm run sync:after-switch
```

## 📁 작업 영역 분리

### 키로 담당 영역

- `src/` - Next.js 웹 애플리케이션
- `.kiro/specs/` - 프로젝트 스펙 관리
- `database/` - 데이터베이스 스키마
- `e2e/` - E2E 테스트
- `src/__tests__/` - 단위/통합 테스트

### VSCode + Claude 담당 영역

- `think-habit-journal-app/` - Electron 애플리케이션
- 빠른 프로토타이핑
- 실험적 기능 개발

### 공통 영역 (주의 필요)

- `shared/` - 양쪽에서 사용하는 공통 코드
- `package.json` - 워크스페이스 설정
- `README.md` - 프로젝트 문서

## ⚠️ 충돌 방지 규칙

1. **같은 파일 동시 수정 금지**
2. **shared/ 폴더 수정 시 상대방에게 알림**
3. **package.json 변경 시 테스트 후 커밋**
4. **매일 작업 시작 전 git pull**

## 🚨 문제 해결

### 머지 충돌 발생 시

```bash
git status
git diff
# 충돌 해결 후
git add .
git commit -m "fix: 머지 충돌 해결"
```

### 의존성 문제 시

```bash
rm -rf node_modules package-lock.json
npm install
npm run sync:check
```
