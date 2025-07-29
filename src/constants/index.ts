// 라우트 관련 상수
export {
  PUBLIC_ROUTES,
  AUTH_ROUTES,
  USER_ROUTES,
  SUPERVISOR_ROUTES,
  ADMIN_ROUTES,
  DEV_ROUTES,
  PROTECTED_ROUTE_PATTERNS,
  ROLE_BASED_ROUTES,
  DEFAULT_REDIRECTS,
  NAVIGATION,
} from "./routes";

// API 관련 상수
export {
  API_CONFIG,
  AUTH_API,
  USER_API,
  SURVEY_API,
  PRESCRIPTION_API,
  TRAINING_API,
  SUPERVISOR_RECORD_API,
  PERSONAL_RECORD_API,
  DASHBOARD_API,
  ADMIN_API,
  UPLOAD_API,
  HTTP_STATUS,
  API_ERRORS,
  PAGINATION,
} from "./api";

// 애플리케이션 비즈니스 로직 상수
export {
  USER_ROLES,
  USER_ROLE_NAMES,
  AFFILIATIONS,
  RATING,
  SURVEY_CONFIG,
  TRAINING_CONFIG,
  PRESCRIPTION_CONFIG,
  SUPERVISOR_RECORD_CONFIG,
  DATE_CONFIG,
  FILE_CONFIG,
  NOTIFICATION_CONFIG,
  SESSION_CONFIG,
  SEARCH_CONFIG,
  EMAIL_CONFIG,
  SECURITY_CONFIG,
  STATS_CONFIG,
  APP_INFO,
  MESSAGES,
} from "./app";

// UI 관련 상수
export {
  COLORS,
  BREAKPOINTS,
  SPACING,
  FONT_SIZES,
  Z_INDEX,
  ANIMATION_DURATION,
  SHADOWS,
  BORDER_RADIUS,
  BUTTON_SIZES,
  INPUT_SIZES,
  ICON_SIZES,
  LAYOUT,
  GRID,
  FORM,
  CARD,
  MODAL,
} from "./ui";

// 타입 정의
export type RouteType = string;
export type ApiEndpoint = string;
export type UserRoleType = 1 | 2 | 3;
export type AffiliationType = "개인" | "가족" | "단체" | "과외"; // 직접 값으로 정의
export type ColorType = string;
export type ButtonSizeType = "XS" | "SM" | "MD" | "LG" | "XL"; // 키값으로 정의
export type InputSizeType = "SM" | "MD" | "LG"; // 키값으로 정의
