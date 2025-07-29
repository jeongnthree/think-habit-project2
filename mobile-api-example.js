// 모바일 앱용 안전한 API 클라이언트 예시

class ThinkHabitMobileAPI {
  constructor(baseURL, storage) {
    this.baseURL = baseURL || 'https://your-api.think-habit.com';
    this.storage = storage; // AsyncStorage 또는 SecureStorage
    this.token = null;
  }

  // 🔐 사용자 인증
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (data.success) {
        this.token = data.token;
        await this.storage.setItem('auth_token', data.token);
        await this.storage.setItem('user_data', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 📝 일지 작성 (이미지 포함)
  async createJournal(journalData, images = []) {
    try {
      // 1. 먼저 이미지 업로드
      const imageUrls = [];
      if (images.length > 0) {
        const uploadResult = await this.uploadImages(images);
        if (uploadResult.success) {
          imageUrls.push(...uploadResult.urls);
        } else {
          throw new Error(`이미지 업로드 실패: ${uploadResult.error}`);
        }
      }

      // 2. 일지 데이터와 이미지 URL 함께 저장
      const payload = {
        ...journalData,
        image_urls: imageUrls,
        image_count: imageUrls.length
      };

      const response = await this.apiCall('/journals', 'POST', payload);
      return response;
    } catch (error) {
      console.error('일지 작성 실패:', error);
      return { success: false, error: error.message };
    }
  }

  // 🖼️ 안전한 이미지 업로드
  async uploadImages(images) {
    try {
      const formData = new FormData();
      
      images.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `image_${index}.jpg`
        });
      });

      const response = await fetch(`${this.baseURL}/upload/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`,
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔄 일지 동기화
  async syncJournals() {
    try {
      // 1. 로컬에 저장된 미동기화 일지들 가져오기
      const unsyncedJournals = await this.getUnsyncedJournals();
      
      if (unsyncedJournals.length === 0) {
        return { success: true, message: '동기화할 일지가 없습니다.' };
      }

      // 2. 서버로 일괄 동기화
      const response = await this.apiCall('/journals/sync', 'POST', {
        journals: unsyncedJournals
      });

      // 3. 성공한 일지들 동기화 상태 업데이트
      if (response.success && response.results) {
        await this.updateSyncStatus(response.results);
      }

      return response;
    } catch (error) {
      console.error('동기화 실패:', error);
      return { success: false, error: error.message };
    }
  }

  // 🌐 네트워크 상태에 따른 처리
  async createJournalSmart(journalData, images = []) {
    const isOnline = await this.checkNetworkStatus();
    
    if (isOnline) {
      // 온라인: 즉시 서버로 업로드
      return await this.createJournal(journalData, images);
    } else {
      // 오프라인: 로컬에 저장 후 나중에 동기화
      const localJournal = {
        ...journalData,
        id: `local_${Date.now()}`,
        images: images, // Base64 또는 로컬 파일 경로
        synced: false,
        created_offline: true
      };
      
      await this.saveLocalJournal(localJournal);
      
      return { 
        success: true, 
        message: '오프라인 상태에서 저장됨. 온라인 연결 시 자동 동기화됩니다.',
        offline: true
      };
    }
  }

  // 🔧 유틸리티 메서드들
  async getToken() {
    if (!this.token) {
      this.token = await this.storage.getItem('auth_token');
    }
    return this.token;
  }

  async apiCall(endpoint, method = 'GET', data = null) {
    const token = await this.getToken();
    
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    if (response.status === 401) {
      // 토큰 만료 시 재로그인 필요
      await this.logout();
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    }

    return await response.json();
  }

  async checkNetworkStatus() {
    try {
      const response = await fetch(`${this.baseURL}/health`, { 
        timeout: 3000 
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getUnsyncedJournals() {
    const journals = await this.storage.getItem('local_journals');
    return journals ? JSON.parse(journals).filter(j => !j.synced) : [];
  }

  async saveLocalJournal(journal) {
    const existingJournals = await this.getUnsyncedJournals();
    existingJournals.push(journal);
    await this.storage.setItem('local_journals', JSON.stringify(existingJournals));
  }

  async updateSyncStatus(results) {
    const localJournals = await this.getUnsyncedJournals();
    const updatedJournals = localJournals.map(journal => {
      const result = results.find(r => r.journal_id === journal.id);
      if (result && result.success) {
        return { ...journal, synced: true, server_id: result.server_id };
      }
      return journal;
    });
    
    await this.storage.setItem('local_journals', JSON.stringify(updatedJournals));
  }

  async logout() {
    this.token = null;
    await this.storage.removeItem('auth_token');
    await this.storage.removeItem('user_data');
  }
}

// 사용 예시 (React Native)
export default class JournalService {
  constructor() {
    this.api = new ThinkHabitMobileAPI(
      'https://api.think-habit.com', 
      require('@react-native-async-storage/async-storage').default
    );
  }

  async createPhotoJournal(title, content, categoryId, images) {
    const journalData = {
      title,
      content,
      category_id: categoryId,
      type: 'photo',
      is_public: true
    };

    return await this.api.createJournalSmart(journalData, images);
  }

  async syncAllJournals() {
    return await this.api.syncJournals();
  }
}

/* 
사용 방법:

import JournalService from './JournalService';

const journalService = new JournalService();

// 사진 일지 작성
const result = await journalService.createPhotoJournal(
  '오늘의 훈련',
  '완벽주의 극복 훈련을 했습니다.',
  'category-1',
  [{ uri: 'file://...', type: 'image/jpeg' }]
);

// 동기화
const syncResult = await journalService.syncAllJournals();
*/