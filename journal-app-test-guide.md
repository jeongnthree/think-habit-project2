# Think-Habit Journal 데스크톱 앱 테스트 가이드

## 📋 개요
이 가이드는 Think-Habit Journal 데스크톱 앱에서 훈련 일지를 작성하고, 웹사이트 커뮤니티에 동기화하여 표시되는 것을 확인하는 방법을 설명합니다.

## 🚀 실행 방법

### 1. 웹 서버 실행 (필수)
먼저 메인 웹사이트가 실행되어 있어야 합니다:
```bash
cd D:\사용자\think-habit-project2
npm run dev
```
웹사이트가 http://localhost:3000 에서 실행됩니다.

### 2. 데스크톱 앱 실행

#### 방법 1: 개발 모드로 실행
```bash
cd think-habit-journal-app
npm install  # 처음 실행하는 경우만
npm run dev
```

#### 방법 2: 웹 버전으로 실행 (권장)
```bash
cd think-habit-journal-app
npm run dev:web
```
브라우저에서 http://localhost:9001 접속

#### 방법 3: 간단한 웹 서버로 실행
```bash
cd think-habit-journal-app
npm run simple-web
```
브라우저에서 http://localhost:8080 접속

## 📝 일지 작성 및 동기화 테스트

### 1. 데스크톱 앱에서 일지 작성
1. 앱 실행 후 "새 일지 작성" 클릭
2. 다음 정보 입력:
   - **제목**: 테스트 일지 제목 (예: "데스크톱 앱 테스트")
   - **카테고리**: 원하는 카테고리 선택
   - **내용**: 일지 내용 작성
   - **공개 설정**: "공개" 선택 (중요!)
3. "저장" 버튼 클릭

### 2. 웹사이트로 동기화
1. 데스크톱 앱에서 "웹사이트 동기화" 버튼 클릭
2. 동기화 진행 상태 확인
3. "동기화 완료" 메시지 확인

### 3. 커뮤니티에서 확인
1. 웹 브라우저에서 http://localhost:3000/community 접속
2. 방금 작성한 일지가 표시되는지 확인
3. 일지 제목 앞에 "[데스크톱]" 표시가 있는지 확인

## 🔍 디버깅 방법

### 1. 콘솔 로그 확인
- **웹 서버 콘솔**: 동기화 API 호출 로그 확인
  ```
  🔍 커뮤니티 API 디버깅:
  앱 일지 개수: X
  📱 동기화된 앱 일지 목록:
  ```

- **데스크톱 앱 콘솔** (브라우저 개발자 도구 F12):
  ```
  🚀 syncJournalsToWebsite 메서드 시작
  📚 동기화할 일지 개수: X
  📤 API 요청 데이터: {...}
  ✅ 동기화 성공
  ```

### 2. 네트워크 탭 확인
브라우저 개발자 도구의 Network 탭에서:
- `/api/journals/sync` POST 요청 확인
- `/api/community/journals` GET 요청 확인

## 🔧 문제 해결

### 일지가 커뮤니티에 표시되지 않는 경우:
1. **공개 설정 확인**: 일지가 "공개"로 설정되어 있는지 확인
2. **동기화 상태 확인**: localStorage에서 `synced_to_website` 값 확인
3. **사용자 ID 확인**: WebsiteSyncService.ts의 Mock 사용자 ID 확인
4. **데이터베이스 확인**: Supabase 대시보드에서 training_journals 테이블 확인

### 동기화 실패하는 경우:
1. **API 엔드포인트 확인**: http://localhost:3000/api/journals/sync 접근 가능한지 확인
2. **CORS 설정 확인**: 콘솔에서 CORS 에러가 없는지 확인
3. **네트워크 연결 확인**: 웹 서버가 실행 중인지 확인

## 📊 예상 결과

성공적으로 동기화되면:
1. 데스크톱 앱에서 "동기화 완료" 메시지 표시
2. 웹 서버 콘솔에 동기화 로그 출력
3. 커뮤니티 페이지에 일지 표시
4. training_journals 테이블에 데이터 저장
5. community_posts 테이블에도 데이터 저장 (공개 일지인 경우)

## 💡 추가 테스트

### 이미지 포함 일지 테스트:
1. 데스크톱 앱에서 이미지를 포함한 일지 작성
2. 동기화 후 커뮤니티에서 이미지 표시 확인

### 자동 동기화 테스트:
1. 데스크톱 앱에서 "자동 동기화 설정" 활성화
2. 30분마다 자동으로 동기화되는지 확인

## 📌 주의사항

1. **Mock 데이터**: 현재 사용자 인증이 Mock으로 되어 있어 실제 사용자 ID가 필요합니다
2. **localStorage 사용**: 데스크톱 앱이 웹 버전으로 실행될 때 localStorage를 사용합니다
3. **포트 충돌**: 웹 서버(3000)와 데스크톱 앱(9001 또는 8080) 포트가 충돌하지 않도록 주의

## 🔗 관련 파일
- `/think-habit-journal-app/src/services/WebsiteSyncService.ts` - 동기화 서비스
- `/src/app/api/journals/sync/route.ts` - 동기화 API
- `/src/app/api/community/journals/route.ts` - 커뮤니티 일지 API
- `/src/app/community/page.tsx` - 커뮤니티 페이지