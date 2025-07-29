/**
 * 플랫폼 독립적인 서비스를 위한 인터페이스
 * 웹과 Electron 환경 모두에서 일관된 API를 제공합니다.
 */

// 스토리지 인터페이스
export interface StorageService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

// 알림 인터페이스
export interface NotificationService {
  show(title: string, message: string): Promise<void>;
}

// 앱 정보 인터페이스
export interface AppInfoService {
  getVersion(): Promise<string>;
  getPlatformName(): Promise<string>;
  isElectron(): boolean;
}

// 통합 플랫폼 서비스 인터페이스
export interface PlatformService {
  storage: StorageService;
  notification: NotificationService;
  appInfo: AppInfoService;
}

/**
 * 웹 환경을 위한 스토리지 서비스 구현
 * localStorage를 사용하여 데이터를 저장합니다.
 */
class WebStorageService implements StorageService {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (typeof window === 'undefined') return null;
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`스토리지에서 데이터 가져오기 실패 (${key}):`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`스토리지에 데이터 저장 실패 (${key}):`, error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`스토리지에서 데이터 삭제 실패 (${key}):`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      localStorage.clear();
    } catch (error) {
      console.error('스토리지 초기화 실패:', error);
    }
  }
}

/**
 * 웹 환경을 위한 알림 서비스 구현
 * 브라우저의 Notification API를 사용합니다.
 */
class WebNotificationService implements NotificationService {
  async show(title: string, message: string): Promise<void> {
    try {
      if (typeof window === 'undefined') return;

      // 브라우저 알림 권한 확인
      if (Notification.permission === 'granted') {
        new Notification(title, { body: message });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body: message });
        }
      }

      // 콘솔에도 출력 (개발 및 폴백용)
      console.log(`알림: ${title} - ${message}`);
    } catch (error) {
      console.error('알림 표시 실패:', error);
      // 폴백: 콘솔에 출력
      console.log(`알림: ${title} - ${message}`);
    }
  }
}

/**
 * 웹 환경을 위한 앱 정보 서비스 구현
 */
class WebAppInfoService implements AppInfoService {
  async getVersion(): Promise<string> {
    // 웹 환경에서는 하드코딩된 버전 또는 환경 변수 사용
    return process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0-web';
  }

  async getPlatformName(): Promise<string> {
    return '웹';
  }

  isElectron(): boolean {
    return false;
  }
}

/**
 * 웹 환경을 위한 통합 플랫폼 서비스
 */
class WebPlatformService implements PlatformService {
  storage: StorageService;
  notification: NotificationService;
  appInfo: AppInfoService;

  constructor() {
    this.storage = new WebStorageService();
    this.notification = new WebNotificationService();
    this.appInfo = new WebAppInfoService();

    if (typeof window !== 'undefined') {
      console.log('웹 플랫폼 서비스가 초기화되었습니다.');
    }
  }
}

// 플랫폼 서비스 인스턴스
let platformServiceInstance: PlatformService | null = null;

// 플랫폼 서비스 인스턴스 가져오기
export function getPlatformService(): PlatformService {
  if (!platformServiceInstance) {
    platformServiceInstance = new WebPlatformService();
  }
  return platformServiceInstance;
}

// 플랫폼 서비스 인스턴스 내보내기
export const platformService =
  typeof window !== 'undefined'
    ? getPlatformService()
    : (null as unknown as PlatformService);
