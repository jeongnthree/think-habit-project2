// 날짜 관련 유틸리티
export {
  calculateAge,
  formatDate,
  getDaysDifference,
  getRelativeTime,
  getTodayString,
} from './date';

// 검증 관련 유틸리티
export {
  isEmpty,
  isValidBirthDate,
  isValidEmail,
  isValidName,
  isValidPassword,
  isValidPhoneNumber,
  isValidRating,
  isValidTextLength,
  isValidUrl,
  validateUserRegistration,
  type ValidationResult,
} from './validation';

// 일지 검증 관련 유틸리티
export {
  customValidationRules,
  validatePhotoJournal,
  validateStructuredJournal,
  validateTaskTemplate,
  type JournalEditData,
  type PhotoJournalData,
  type StructuredJournalData,
  type TaskTemplateData,
} from './journal-validation';

// 에러 복구 관련 유틸리티
export {
  analyzeNetworkError,
  fetchWithRetry,
  getRecoveryStrategy,
  isRetryableError,
  retryWithBackoff,
  submitFormWithRetry,
  uploadFileWithRetry,
  type NetworkErrorInfo,
  type RetryOptions,
} from './error-recovery';

// 포맷팅 관련 유틸리티
export {
  capitalize,
  formatAffiliation,
  formatFileSize,
  formatNumber,
  formatPhoneNumber,
  formatProgress,
  formatRatingToStars,
  formatRatingWithColor,
  formatUserRole,
  slugify,
  truncateText,
} from './format';

// 스토리지 관련 유틸리티
export {
  STORAGE_KEYS,
  sessionStorage,
  storage,
  userPreferences,
  type UserPreferences,
} from './storage';

// 공통 헬퍼 함수
export const cn = (
  ...classes: (string | undefined | null | boolean)[]
): string => {
  return classes.filter(Boolean).join(' ');
};

// 디바운스 함수
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

// 쓰로틀 함수
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let isThrottled = false;

  return (...args: Parameters<T>) => {
    if (!isThrottled) {
      func(...args);
      isThrottled = true;

      setTimeout(() => {
        isThrottled = false;
      }, delay);
    }
  };
};

// 랜덤 ID 생성
export const generateId = (length: number = 8): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};
