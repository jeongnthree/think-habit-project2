/**
 * 애플리케이션 비즈니스 로직 상수
 */

// 사용자 역할
export const USER_ROLES = {
  LEARNER: 1,
  SUPERVISOR: 2,
  ADMIN: 3,
} as const;

export const USER_ROLE_NAMES = {
  [USER_ROLES.LEARNER]: '학습자',
  [USER_ROLES.SUPERVISOR]: '감독',
  [USER_ROLES.ADMIN]: '관리자',
} as const;

// 소속 타입
export const AFFILIATIONS = {
  INDIVIDUAL: '개인',
  FAMILY: '가족',
  GROUP: '단체',
  TUTORING: '과외',
} as const;

// 평점 범위
export const RATING = {
  MIN: 1,
  MAX: 10,
  DEFAULT: 5,
} as const;

// 설문조사 설정
export const SURVEY_CONFIG = {
  MIN_TEXT_LENGTH: 10,
  MAX_TEXT_LENGTH: 1000,
  GOALS_MAX_LENGTH: 500,
  HABITS_MAX_LENGTH: 500,
  SELF_INFO_MIN_SCORE: 1,
  SELF_INFO_MAX_SCORE: 10,
} as const;

// 훈련 기록 설정
export const TRAINING_CONFIG = {
  MIN_PRACTICE_COUNT: 0,
  MAX_PRACTICE_COUNT: 100,
  MIN_STUDY_LENGTH: 10,
  MAX_STUDY_LENGTH: 2000,
  MIN_NOTES_LENGTH: 5,
  MAX_NOTES_LENGTH: 1000,
} as const;

// 처방 설정
export const PRESCRIPTION_CONFIG = {
  MIN_THEORY_LENGTH: 50,
  MAX_THEORY_LENGTH: 2000,
  MIN_PRACTICE_LENGTH: 30,
  MAX_PRACTICE_LENGTH: 1500,
} as const;

// 감독 기록 설정
export const SUPERVISOR_RECORD_CONFIG = {
  MIN_OBSERVATION_LENGTH: 20,
  MAX_OBSERVATION_LENGTH: 1000,
  MIN_SUGGESTION_LENGTH: 10,
  MAX_SUGGESTION_LENGTH: 500,
  MIN_ENCOURAGEMENT_LENGTH: 5,
  MAX_ENCOURAGEMENT_LENGTH: 300,
} as const;

// 날짜 관련 설정
export const DATE_CONFIG = {
  MIN_AGE: 5,
  MAX_AGE: 120,
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATE_FORMAT: 'YYYY년 MM월 DD일',
} as const;

// 파일 업로드 설정
export const FILE_CONFIG = {
  AVATAR_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  DOCUMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'text/plain',
    'application/msword',
  ],
} as const;

// 알림 설정
export const NOTIFICATION_CONFIG = {
  AUTO_DISMISS_TIME: 5000, // 5초
  MAX_NOTIFICATIONS: 5,
  TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
  },
} as const;

// 세션 설정
export const SESSION_CONFIG = {
  TIMEOUT: 24 * 60 * 60 * 1000, // 24시간
  REFRESH_THRESHOLD: 30 * 60 * 1000, // 30분
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30일
} as const;

// 검색 설정
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 100,
  DEBOUNCE_DELAY: 300, // 300ms
  MAX_RESULTS: 50,
} as const;

// 이메일 설정
export const EMAIL_CONFIG = {
  VERIFICATION_EXPIRY: 24 * 60 * 60 * 1000, // 24시간
  PASSWORD_RESET_EXPIRY: 1 * 60 * 60 * 1000, // 1시간
  SUPPORT_EMAIL: 'support@thinking-habits.com',
  NO_REPLY_EMAIL: 'noreply@thinking-habits.com',
} as const;

// 보안 설정
export const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  LOGIN_ATTEMPT_LIMIT: 5,
  LOGIN_LOCKOUT_TIME: 15 * 60 * 1000, // 15분
  SESSION_COOKIE_NAME: 'thinking-habits-session',
} as const;

// 통계 및 리포트 설정
export const STATS_CONFIG = {
  DEFAULT_PERIOD_DAYS: 30,
  MAX_PERIOD_DAYS: 365,
  CHART_COLORS: [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#EC4899',
    '#6B7280',
  ],
} as const;

// 애플리케이션 메타 정보
export const APP_INFO = {
  NAME: '생각습관 교육 플랫폼',
  SHORT_NAME: '생각습관',
  VERSION: '1.0.0',
  DESCRIPTION:
    '전문가 주도의 체계적인 진단, 처방, 훈련을 통해 건강한 생각습관을 만드는 플랫폼',
  AUTHOR: 'Thinking Habits Team',
  CONTACT_EMAIL: 'contact@thinking-habits.com',
  WEBSITE: 'https://생각습관.com',
  COPYRIGHT: '© 2025 생각습관',
  TRADEMARK: '생각습관™ 및 생각습관.com™은 등록된 상표입니다.',
  DOMAIN: '생각습관.com',
} as const;

// 기본 메시지
export const MESSAGES = {
  LOADING: '로딩 중...',
  NO_DATA: '데이터가 없습니다.',
  ERROR_OCCURRED: '오류가 발생했습니다.',
  SUCCESS_SAVE: '성공적으로 저장되었습니다.',
  SUCCESS_DELETE: '성공적으로 삭제되었습니다.',
  SUCCESS_UPDATE: '성공적으로 수정되었습니다.',
  CONFIRM_DELETE: '정말로 삭제하시겠습니까?',
  UNSAVED_CHANGES: '저장하지 않은 변경사항이 있습니다.',
} as const;
