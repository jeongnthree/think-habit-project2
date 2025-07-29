# 🚀 Think-Habit Project 배포 완료 가이드

## 🌐 배포 도메인: **생각습관.com**

모든 배포 설정이 완료되었습니다. **생각습관.com** 도메인으로 배포를 진행합니다!

### ✅ 완료된 설정들

1. **Vercel 최적화 설정** (`vercel.json`)
   - 빌드 최적화
   - CORS 헤더 설정
   - 캐싱 최적화
   - 리다이렉트 설정

2. **Next.js 프로덕션 설정** (`next.config.ts`)
   - 성능 최적화
   - 보안 헤더
   - 이미지 최적화
   - **생각습관.com** 도메인 설정

3. **환경 변수 템플릿** (`.env.example`)
   - Supabase 설정
   - Google OAuth 설정
   - **생각습관.com** URL 설정

4. **자동 배포 스크립트** (`deploy.sh`)
   - 환경 체크
   - 빌드 테스트
   - 자동 배포

---

## 🎯 배포 진행 방법

### 방법 1: GitHub 연동 배포 (추천)
1. 코드를 GitHub에 푸시
2. [vercel.com](https://vercel.com) 접속
3. "New Project" 선택
4. GitHub 저장소 연결
5. 환경 변수 설정
6. "Deploy" 클릭
7. **생각습관.com** 도메인 연결

### 방법 2: 자동 스크립트 사용
```bash
./deploy.sh
```

### 방법 3: 수동 배포
```bash
npm install
npm run build
npm install -g vercel
vercel --prod
```

---

## 🔐 배포 전 필수 설정

### 1. 환경 변수 설정
```env
# 생각습관.com 도메인
NEXT_PUBLIC_APP_URL=https://생각습관.com

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth 설정
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. 도메인 연결 설정
Vercel Dashboard에서:
1. Project Settings → Domains
2. **생각습관.com** 추가
3. DNS 설정:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

### 3. Google OAuth 업데이트
Google Cloud Console에서:
- **승인된 JavaScript 원본**: `https://생각습관.com`
- **승인된 리디렉션 URI**: `https://생각습관.com/api/auth/callback/google`

---

## 🌐 배포 URL

**메인 사이트**: https://생각습관.com

### 주요 페이지들:
- 홈페이지: https://생각습관.com
- 다운로드: https://생각습관.com/downloads
- 위젯 설치 도구: https://생각습관.com/downloads/widget-setup-tool.html
- 커뮤니티: https://생각습관.com/community
- 진단 테스트: https://생각습관.com/diagnosis

---

## 📋 배포 후 확인사항

### ✅ 도메인 연결 확인
- [ ] https://생각습관.com 접속 가능
- [ ] SSL 인증서 정상 작동
- [ ] 모든 하위 페이지 접근 가능

### ✅ 다운로드 기능
- [ ] journal-app 다운로드 (https://생각습관.com/downloads/think-habit-windows.exe)
- [ ] 그룹 위젯 다운로드 (https://생각습관.com/downloads/think-habit-group-widget.zip)
- [ ] 설치 가이드 접근

### ✅ 위젯 설치 도구
- [ ] 5분 설치 도구 정상 작동
- [ ] 생성된 위젯 코드에 생각습관.com 도메인 포함
- [ ] 모든 탭 기능 정상 작동

---

## 🎉 배포 성공 시 활용 방안

### 📱 사용자 안내
```
🎯 생각습관 훈련 시스템 오픈!
✅ 웹사이트: https://생각습관.com
✅ 데스크톱 앱: https://생각습관.com/downloads
✅ 단체용 위젯: 5분만에 설치 가능
```

### 🏢 단체/기관 홍보
```
교회, 학교, 회사에서 사용할 수 있는
생각습관 그룹 위젯을 홈페이지에 추가하세요!

설치 도구: https://생각습관.com/downloads/widget-setup-tool.html
```

### 📊 SEO 최적화
- 한국어 도메인으로 검색 최적화
- "생각습관", "사고력 훈련" 등 키워드 노출
- 국내 사용자 접근성 향상

---

## 🛠️ 도메인 관련 추가 설정

### DNS 설정 (도메인 등록업체에서)
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

### Vercel에서 도메인 추가
1. Vercel Dashboard → 프로젝트 선택
2. Settings → Domains
3. "생각습관.com" 입력
4. DNS 설정 안내 따라하기

---

**생각습관.com으로 배포할 준비 완료! 🚀**

이제 실제 배포를 진행하시겠어요?