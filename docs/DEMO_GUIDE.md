# 🚀 Think-Habit 프로젝트 시연 가이드

## 📋 시연 전 체크리스트

### ✅ 필수 확인사항

- [ ] 메인 웹사이트 실행 중 (`npm run dev`)
- [ ] 포트 3000 사용 가능
- [ ] 브라우저 준비 (Chrome 권장)

---

## 🎯 1단계: 메인 웹사이트 확인

### 1.1 웹사이트 접속

```
URL: http://localhost:3000
```

**확인사항:**

- [ ] 메인 페이지 정상 로드
- [ ] 헤더/푸터 표시
- [ ] 네비게이션 메뉴 작동

### 1.2 로그인 테스트

```
URL: http://localhost:3000/login
이메일: test@think-habit.com
패스워드: test123
```

**확인사항:**

- [ ] 로그인 폼 표시
- [ ] 로그인 성공
- [ ] 대시보드로 자동 리다이렉트

### 1.3 대시보드 확인

```
URL: http://localhost:3000/dashboard (자동 이동)
```

**확인사항:**

- [ ] 사용자 정보 표시
- [ ] 통계 데이터 표시
- [ ] 메뉴 정상 작동

---

## 🎯 2단계: Journal App 확인

### 2.1 Journal App 실행

```
터미널에서 실행:
cd think-habit-journal-app
npm run simple-web
```

**또는 웹 개발 서버:**

```
npm run dev:web
```

### 2.2 Journal App 접속

```
URL: http://localhost:9002
```

**확인사항:**

- [ ] Journal App 웹 버전 로드
- [ ] "Electron API not available. Running in browser" 메시지 (정상)
- [ ] 일지 작성 인터페이스 표시
- [ ] 동기화 버튼 확인

---

## 🎯 3단계: 동기화 기능 테스트

### 3.1 자동 동기화 테스트

```
터미널에서 실행:
node test-journal-app-sync.js
```

**확인사항:**

- [ ] 메인 웹사이트 상태 확인 성공
- [ ] 동기화 API 테스트 성공
- [ ] 커뮤니티에서 데스크톱 일지 확인

### 3.2 커뮤니티 확인

```
URL: http://localhost:3000/community
```

**확인사항:**

- [ ] 동기화된 일지들 표시
- [ ] 🖥️ 데스크톱 출처 아이콘 확인
- [ ] 일지 내용 정상 표시

---

## 🎯 4단계: API 시스템 확인

### 4.1 전체 API 테스트

```
터미널에서 실행:
node test-final-login.js
```

**확인사항:**

- [ ] 4/4 API 테스트 성공
- [ ] 헬스체크 정상
- [ ] 로그인 API 정상
- [ ] 대시보드 API 정상
- [ ] 카테고리 API 정상

### 4.2 동기화 API 테스트

```
터미널에서 실행:
node test-sync-api-fixed.js
```

**확인사항:**

- [ ] 동기화 성공 (2/2)
- [ ] 상태 확인 API 정상
- [ ] 커뮤니티 연동 확인

---

## 🎯 5단계: 실제 사용 시나리오

### 5.1 Journal App에서 일지 작성

1. `http://localhost:9002` 접속
2. 새 일지 작성
3. 제목: "시연용 테스트 일지"
4. 내용: 자유롭게 작성
5. 저장

### 5.2 동기화 실행

1. Journal App에서 "동기화" 버튼 클릭
2. 동기화 진행 상황 확인
3. 성공 메시지 확인

### 5.3 메인 웹사이트에서 확인

1. `http://localhost:3000/community` 접속
2. 방금 작성한 일지 확인
3. 🖥️ 데스크톱 출처 아이콘 확인

---

## 🎯 6단계: 추가 기능 확인

### 6.1 회원가입 기능

```
URL: http://localhost:3000/signup
```

**테스트 데이터:**

```
이메일: demo@example.com
패스워드: DemoPassword123!
이름: 시연 사용자
```

### 6.2 다양한 페이지 확인

- [ ] About 페이지: `http://localhost:3000/about`
- [ ] Education 페이지: `http://localhost:3000/education`
- [ ] Training 페이지: `http://localhost:3000/training`

---

## 🚨 문제 해결 가이드

### 메인 웹사이트가 안 열릴 때

```bash
# 개발 서버 재시작
npm run dev

# 포트 확인
netstat -an | findstr :3000
```

### Journal App이 안 열릴 때

```bash
# think-habit-journal-app 폴더에서
npm install
npm run simple-web
```

### 동기화가 안 될 때

```bash
# API 상태 확인
node test-final-login.js

# 동기화 테스트
node test-sync-api-fixed.js
```

---

## 🎉 시연 포인트

### 💡 강조할 점들

1. **완전한 풀스택 애플리케이션**
   - Next.js 15 + React 19
   - Supabase 데이터베이스
   - TypeScript 완전 지원

2. **크로스 플랫폼 Journal App**
   - Electron 데스크톱 앱
   - 웹 버전 동시 지원
   - 실시간 동기화

3. **안정적인 동기화 시스템**
   - 양방향 데이터 동기화
   - 출처 구분 표시
   - 에러 처리 완비

4. **현대적 개발 환경**
   - 컴포넌트 기반 아키텍처
   - API 우선 설계
   - 테스트 자동화

### 🎯 시연 순서 추천

1. 메인 웹사이트 로그인 → 대시보드
2. Journal App 실행 → 일지 작성
3. 동기화 버튼 클릭 → 진행 상황 확인
4. 메인 웹사이트 커뮤니티 → 동기화된 일지 확인
5. API 테스트 스크립트 실행 → 기술적 완성도 증명

---

## 📞 응급 연락처

**문제 발생 시 확인할 것들:**

1. 터미널 에러 메시지
2. 브라우저 개발자 도구 콘솔
3. 네트워크 탭에서 API 호출 상태
4. 포트 충돌 여부

**빠른 복구 명령어:**

```bash
# 전체 재시작
npm run dev

# Journal App 재시작
cd think-habit-journal-app && npm run simple-web

# API 테스트
node test-final-login.js
```

---

## 🎊 성공 기준

### ✅ 시연 성공 체크리스트

- [ ] 메인 웹사이트 로그인 성공
- [ ] Journal App 웹 버전 실행 성공
- [ ] 일지 작성 및 동기화 성공
- [ ] 커뮤니티에서 동기화된 일지 확인
- [ ] API 테스트 스크립트 모두 성공

**모든 항목이 체크되면 시연 준비 완료! 🎉**
