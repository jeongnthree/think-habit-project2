# 📱 Think-Habit 모바일 앱 보안 가이드

## 🏗️ 안전한 아키텍처

### 전체 구조
```
[모바일 앱] → [백엔드 API] → [Supabase Database & Storage]
     ↓              ↓                    ↓
  User Token    Service Key      실제 데이터 저장
```

## 🔐 인증 시스템

### 1. 사용자 로그인
```javascript
// 모바일 앱에서
const loginResponse = await fetch('https://your-api.com/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: userEmail,
    password: userPassword
  })
});

const { token, user } = await loginResponse.json();
// 토큰을 안전하게 저장 (Keychain/KeyStore)
```

### 2. API 요청 시 토큰 사용
```javascript
const apiCall = await fetch('https://your-api.com/journals', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(journalData)
});
```

## 🖼️ 안전한 이미지 업로드

### 모바일 앱에서 이미지 업로드
```javascript
// React Native 예시
import { launchImageLibrary } from 'react-native-image-picker';

const uploadImage = async () => {
  // 1. 이미지 선택
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.8,
    maxWidth: 1200,
    maxHeight: 1200
  });

  if (result.assets && result.assets[0]) {
    const imageFile = result.assets[0];
    
    // 2. FormData 생성
    const formData = new FormData();
    formData.append('image', {
      uri: imageFile.uri,
      type: imageFile.type,
      name: imageFile.fileName || 'image.jpg'
    });
    formData.append('journalId', journalId);

    // 3. 백엔드 API로 업로드 (Service Role Key는 서버에만 있음)
    const response = await fetch('https://your-api.com/upload/image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'multipart/form-data'
      },
      body: formData
    });

    const { imageUrl } = await response.json();
    return imageUrl;
  }
};
```

### 백엔드 API 서버 구현 (Node.js/Express 예시)
```javascript
// server.js
const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// ⚠️ Service Role Key는 서버 환경변수에만 저장
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 서버에서만 사용
);

// 이미지 업로드 엔드포인트
app.post('/upload/image', 
  authenticateToken, // JWT 토큰 검증 미들웨어
  upload.single('image'), 
  async (req, res) => {
    try {
      const { journalId } = req.body;
      const userId = req.user.id; // JWT에서 추출
      const imageFile = req.file;

      // Supabase Storage에 업로드
      const fileName = `${userId}/${journalId}/${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('journal-images')
        .upload(fileName, imageFile.buffer, {
          contentType: imageFile.mimetype,
          cacheControl: '3600'
        });

      if (error) throw error;

      // 공개 URL 생성
      const { data: urlData } = supabase.storage
        .from('journal-images')
        .getPublicUrl(fileName);

      res.json({ 
        success: true, 
        imageUrl: urlData.publicUrl 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
);
```

## 🛡️ 보안 모범 사례

### 1. 토큰 저장
```javascript
// React Native
import { Keychain } from 'react-native-keychain';

// 토큰 저장
await Keychain.setInternetCredentials(
  'think-habit-token',
  'user',
  authToken
);

// 토큰 조회
const credentials = await Keychain.getInternetCredentials('think-habit-token');
const token = credentials.password;
```

### 2. API 요청 보안
```javascript
// API 클라이언트 설정
const apiClient = axios.create({
  baseURL: 'https://your-secure-api.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 요청 인터셉터 (토큰 자동 추가)
apiClient.interceptors.request.use(async (config) => {
  const token = await getStoredToken(); // Keychain에서 토큰 조회
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 (토큰 만료 처리)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 재로그인 유도
      await clearStoredToken();
      navigateToLogin();
    }
    return Promise.reject(error);
  }
);
```

### 3. 오프라인 지원
```javascript
// 오프라인 상태 관리
import NetInfo from '@react-native-async-storage/async-storage';

const uploadJournal = async (journalData) => {
  const isConnected = await NetInfo.fetch().then(state => state.isConnected);
  
  if (isConnected) {
    // 온라인: 즉시 서버로 업로드
    return await apiClient.post('/journals', journalData);
  } else {
    // 오프라인: 로컬에 저장 후 나중에 동기화
    await AsyncStorage.setItem(
      `offline_journal_${Date.now()}`, 
      JSON.stringify(journalData)
    );
    
    // 네트워크 복구 시 자동 동기화
    scheduleSync();
  }
};
```

## 🚀 배포 시 고려사항

### 1. 환경 설정
```bash
# 백엔드 서버 환경변수
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # 절대 클라이언트에 노출 안됨
JWT_SECRET=your-jwt-secret
NODE_ENV=production
```

### 2. 보안 헤더
```javascript
// Express 보안 설정
const helmet = require('helmet');
const cors = require('cors');

app.use(helmet()); // 보안 헤더 설정
app.use(cors({
  origin: ['your-mobile-app://'], // 모바일 앱만 허용
  credentials: true
}));
```

### 3. SSL/TLS 인증서
- HTTPS 필수 사용
- 인증서 피닝 (Certificate Pinning) 적용

## 📊 모니터링

### 1. 로깅
```javascript
// 보안 이벤트 로깅
const logSecurityEvent = (event, userId, details) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    userId,
    details,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  }));
};
```

### 2. 에러 추적
- Sentry, Bugsnag 등을 통한 실시간 모니터링
- 민감한 정보는 로그에서 제외

## 🎯 요약

1. **절대 원칙**: Service Role Key는 서버에서만 사용
2. **아키텍처**: 모바일 앱 → 백엔드 API → Supabase
3. **인증**: JWT 토큰 기반 인증 시스템
4. **저장**: 민감한 정보는 Keychain/KeyStore 사용
5. **통신**: HTTPS + 적절한 CORS 설정
6. **모니터링**: 보안 이벤트 로깅 및 추적