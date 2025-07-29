/**
 * 브라우저 스토리지 관련 유틸리티 함수들
 */

// 로컬 스토리지 안전한 접근을 위한 래퍼
export const storage = {
  // 값 저장
  set: <T>(key: string, value: T): boolean => {
    try {
      if (typeof window === "undefined") return false;

      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      console.error("로컬 스토리지 저장 실패:", error);
      return false;
    }
  },

  // 값 가져오기
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      if (typeof window === "undefined") return defaultValue || null;

      const item = localStorage.getItem(key);
      if (item === null) return defaultValue || null;

      return JSON.parse(item) as T;
    } catch (error) {
      console.error("로컬 스토리지 읽기 실패:", error);
      return defaultValue || null;
    }
  },

  // 값 삭제
  remove: (key: string): boolean => {
    try {
      if (typeof window === "undefined") return false;

      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("로컬 스토리지 삭제 실패:", error);
      return false;
    }
  },

  // 모든 값 삭제
  clear: (): boolean => {
    try {
      if (typeof window === "undefined") return false;

      localStorage.clear();
      return true;
    } catch (error) {
      console.error("로컬 스토리지 전체 삭제 실패:", error);
      return false;
    }
  },

  // 키 존재 여부 확인
  has: (key: string): boolean => {
    try {
      if (typeof window === "undefined") return false;

      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error("로컬 스토리지 확인 실패:", error);
      return false;
    }
  },
};

// 세션 스토리지 래퍼
export const sessionStorage = {
  set: <T>(key: string, value: T): boolean => {
    try {
      if (typeof window === "undefined") return false;

      const serializedValue = JSON.stringify(value);
      window.sessionStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      console.error("세션 스토리지 저장 실패:", error);
      return false;
    }
  },

  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      if (typeof window === "undefined") return defaultValue || null;

      const item = window.sessionStorage.getItem(key);
      if (item === null) return defaultValue || null;

      return JSON.parse(item) as T;
    } catch (error) {
      console.error("세션 스토리지 읽기 실패:", error);
      return defaultValue || null;
    }
  },

  remove: (key: string): boolean => {
    try {
      if (typeof window === "undefined") return false;

      window.sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("세션 스토리지 삭제 실패:", error);
      return false;
    }
  },

  clear: (): boolean => {
    try {
      if (typeof window === "undefined") return false;

      window.sessionStorage.clear();
      return true;
    } catch (error) {
      console.error("세션 스토리지 전체 삭제 실패:", error);
      return false;
    }
  },
};

// 사용자 설정 관련 스토리지 키들
export const STORAGE_KEYS = {
  USER_PREFERENCES: "user_preferences",
  THEME: "theme",
  LANGUAGE: "language",
  LAST_LOGIN: "last_login",
  DRAFT_SURVEY: "draft_survey",
  TEMP_DATA: "temp_data",
} as const;

// 사용자 설정 타입
export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: "ko" | "en";
  notifications: boolean;
  autoSave: boolean;
}

// 사용자 설정 관리
export const userPreferences = {
  get: (): UserPreferences => {
    return storage.get<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES, {
      theme: "system",
      language: "ko",
      notifications: true,
      autoSave: true,
    })!;
  },

  set: (preferences: Partial<UserPreferences>): boolean => {
    const current = userPreferences.get();
    const updated = { ...current, ...preferences };
    return storage.set(STORAGE_KEYS.USER_PREFERENCES, updated);
  },

  reset: (): boolean => {
    return storage.remove(STORAGE_KEYS.USER_PREFERENCES);
  },
};
