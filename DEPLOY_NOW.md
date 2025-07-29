# 🚀 생각습관.com 배포 - 지금 바로 시작!

## ✅ 모든 준비 완료!

코드가 GitHub에 커밋되었고, 배포 설정이 모두 완료되었습니다.

---

## 🎯 **Vercel 배포 3단계**

### 1️⃣ **Vercel 계정 생성 & GitHub 연결**
1. [vercel.com](https://vercel.com) 접속
2. "Continue with GitHub" 클릭
3. GitHub 계정으로 로그인

### 2️⃣ **프로젝트 배포**
1. Vercel Dashboard에서 "New Project" 클릭
2. **think-habit-project2** 저장소 선택
3. "Import" 클릭
4. 설정 확인:
   ```
   Framework Preset: Next.js
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```
5. 환경 변수 설정:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://gmvqcycnppuzixugzxvy.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdnFjeWNucHB1eml4dWd6eHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMTU0NzYsImV4cCI6MjA2Nzg5MTQ3Nn0.5NodA2qksds_fUdlzgx7OZnN8OvzHitzdSvTdBWqoo8
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdnFjeWNucHB1eml4dWd6eHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjMxNTQ3NiwiZXhwIjoyMDY3ODkxNDc2fQ.Gn6jKaZ0oojtWXlIxsS0ygPgZASOseTb_23S2Yy5Q7o
   NEXT_PUBLIC_GOOGLE_CLIENT_ID = YOUR_GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET = YOUR_GOOGLE_CLIENT_SECRET
   NEXT_PUBLIC_APP_URL = https://생각습관.com
   NEXTAUTH_URL = https://생각습관.com
   NEXTAUTH_SECRET = think-habit-secret-2025
   ```
6. "Deploy" 클릭

### 3️⃣ **생각습관.com 도메인 연결**
1. 배포 완료 후, Vercel Dashboard → Settings → Domains
2. "생각습관.com" 입력
3. DNS 설정 (도메인 등록업체에서):
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```
4. DNS 전파 대기 (5-10분)

---

## 🌐 **배포 완료 후 확인할 URL들**

### 메인 사이트
- https://생각습관.com (또는 임시 vercel URL)

### 다운로드 페이지들
- https://생각습관.com/downloads
- https://생각습관.com/downloads/widget-setup-tool.html
- https://생각습관.com/downloads/WIDGET_FEATURES_DEMO.html

### 주요 기능들
- https://생각습관.com/community
- https://생각습관.com/diagnosis
- https://생각습관.com/training
- https://생각습관.com/dashboard

---

## 🎉 **MVP 출시 완료 시나리오**

배포가 성공하면:

### 📱 **사용자 경험**
1. **웹사이트 방문**: 생각습관.com에서 진단 테스트 체험
2. **앱 다운로드**: journal-app 다운로드해서 개인 훈련
3. **단체 활용**: 위젯 설치 도구로 5분만에 홈페이지에 추가

### 🏢 **단체/기관 홍보**
```
🎯 생각습관 훈련 시스템 오픈!
✅ 웹 진단: https://생각습관.com/diagnosis
✅ 개인 앱: https://생각습관.com/downloads
✅ 단체 위젯: 5분 설치 https://생각습관.com/downloads/widget-setup-tool.html
```

### 📊 **성과 측정**
- Vercel Analytics로 방문자 추적
- 다운로드 수 확인
- 위젯 설치 현황 파악

---

## 🚨 **배포 중 문제 발생 시**

### 빌드 오류
- Vercel Functions 로그 확인
- Environment Variables 재확인

### 도메인 연결 오류
- DNS 전파 시간 대기 (최대 24시간)
- CNAME 레코드 정확성 확인

### 기능 오류
- Supabase 연결 상태 확인
- 브라우저 콘솔 에러 확인

---

## 🎯 **지금 바로 시작하세요!**

1. **Vercel.com 접속** → GitHub 연결
2. **think-habit-project2 Import**  
3. **환경 변수 복사/붙여넣기**
4. **Deploy 클릭**
5. **생각습관.com 도메인 연결**

**5-10분 후면 생각습관.com이 전 세계에 공개됩니다!** 🌍✨