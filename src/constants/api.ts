/**
 * API 엔드포인트 상수 정의
 */

// API 기본 설정
export const API_CONFIG = {
  BASE_URL: "/api",
  TIMEOUT: 30000, // 30초
  RETRY_COUNT: 3,
} as const;

// 인증 관련 API
export const AUTH_API = {
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  LOGOUT: "/api/auth/logout",
  REFRESH: "/api/auth/refresh",
  RESET_PASSWORD: "/api/auth/reset-password",
  VERIFY_EMAIL: "/api/auth/verify-email",
  PROFILE: "/api/auth/profile",
} as const;

// 사용자 관련 API
export const USER_API = {
  LIST: "/api/users",
  DETAIL: "/api/users/[id]",
  CREATE: "/api/users",
  UPDATE: "/api/users/[id]",
  DELETE: "/api/users/[id]",
  PROFILE: "/api/users/profile",
  CHANGE_PASSWORD: "/api/users/change-password",
} as const;

// 설문조사 관련 API
export const SURVEY_API = {
  LIST: "/api/surveys",
  DETAIL: "/api/surveys/[id]",
  CREATE: "/api/surveys",
  UPDATE: "/api/surveys/[id]",
  DELETE: "/api/surveys/[id]",
  SUBMIT: "/api/surveys/submit",
  RESULTS: "/api/surveys/[id]/results",
} as const;

// 처방 관련 API
export const PRESCRIPTION_API = {
  LIST: "/api/prescriptions",
  DETAIL: "/api/prescriptions/[id]",
  CREATE: "/api/prescriptions",
  UPDATE: "/api/prescriptions/[id]",
  DELETE: "/api/prescriptions/[id]",
  BY_USER: "/api/prescriptions/user/[userId]",
  BY_SUPERVISOR: "/api/prescriptions/supervisor/[supervisorId]",
} as const;

// 훈련 기록 관련 API
export const TRAINING_API = {
  LIST: "/api/training-records",
  DETAIL: "/api/training-records/[id]",
  CREATE: "/api/training-records",
  UPDATE: "/api/training-records/[id]",
  DELETE: "/api/training-records/[id]",
  BY_USER: "/api/training-records/user/[userId]",
  BY_DATE: "/api/training-records/date/[date]",
  STATISTICS: "/api/training-records/statistics",
} as const;

// 감독 기록 관련 API
export const SUPERVISOR_RECORD_API = {
  LIST: "/api/supervisor-records",
  DETAIL: "/api/supervisor-records/[id]",
  CREATE: "/api/supervisor-records",
  UPDATE: "/api/supervisor-records/[id]",
  DELETE: "/api/supervisor-records/[id]",
  BY_LEARNER: "/api/supervisor-records/learner/[learnerId]",
  BY_SUPERVISOR: "/api/supervisor-records/supervisor/[supervisorId]",
} as const;

// 개인 기록 관련 API
export const PERSONAL_RECORD_API = {
  LIST: "/api/personal-records",
  DETAIL: "/api/personal-records/[id]",
  CREATE: "/api/personal-records",
  UPDATE: "/api/personal-records/[id]",
  DELETE: "/api/personal-records/[id]",
  BY_USER: "/api/personal-records/user/[userId]",
  LATEST: "/api/personal-records/latest/[userId]",
} as const;

// 대시보드 및 통계 API
export const DASHBOARD_API = {
  USER_STATS: "/api/dashboard/user-stats",
  SUPERVISOR_STATS: "/api/dashboard/supervisor-stats",
  ADMIN_STATS: "/api/dashboard/admin-stats",
  ACTIVITIES: "/api/dashboard/activities",
  NOTIFICATIONS: "/api/dashboard/notifications",
} as const;

// 관리자 전용 API
export const ADMIN_API = {
  SYSTEM_INFO: "/api/admin/system",
  USER_MANAGEMENT: "/api/admin/users",
  BACKUP: "/api/admin/backup",
  RESTORE: "/api/admin/restore",
  LOGS: "/api/admin/logs",
  SETTINGS: "/api/admin/settings",
} as const;

// 파일 업로드 관련 API
export const UPLOAD_API = {
  AVATAR: "/api/upload/avatar",
  DOCUMENT: "/api/upload/document",
  EXPORT: "/api/export",
  IMPORT: "/api/import",
} as const;

// HTTP 상태 코드
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// API 에러 메시지
export const API_ERRORS = {
  NETWORK_ERROR: "네트워크 연결을 확인해주세요.",
  TIMEOUT_ERROR: "요청 시간이 초과되었습니다.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  FORBIDDEN: "접근 권한이 없습니다.",
  NOT_FOUND: "요청한 정보를 찾을 수 없습니다.",
  VALIDATION_ERROR: "입력 정보를 확인해주세요.",
  SERVER_ERROR: "서버 오류가 발생했습니다.",
  UNKNOWN_ERROR: "알 수 없는 오류가 발생했습니다.",
} as const;

// 페이지네이션 기본값
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;
