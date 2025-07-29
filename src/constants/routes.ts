/**
 * 라우트 경로 상수 정의
 */

// 공개 페이지
export const PUBLIC_ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  CONTACT: "/contact",
  PRIVACY: "/privacy",
  TERMS: "/terms",
} as const;

// 인증 관련 페이지
export const AUTH_ROUTES = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  RESET_PASSWORD: "/auth/reset-password",
  VERIFY_EMAIL: "/auth/verify-email",
  LOGOUT: "/auth/logout",
} as const;

// 사용자 대시보드
export const USER_ROUTES = {
  DASHBOARD: "/dashboard",
  PROFILE: "/dashboard/profile",
  SETTINGS: "/dashboard/settings",
  SURVEY: "/dashboard/survey",
  RESULTS: "/dashboard/results",
  TRAINING: "/dashboard/training",
  TRAINING_RECORDS: "/dashboard/training/records",
  TRAINING_NEW: "/dashboard/training/new",
} as const;

// 전문가/감독 페이지
export const SUPERVISOR_ROUTES = {
  DASHBOARD: "/supervisor/dashboard",
  STUDENTS: "/supervisor/students",
  STUDENT_DETAIL: "/supervisor/students/[id]",
  DIAGNOSES: "/supervisor/diagnoses",
  PRESCRIPTIONS: "/supervisor/prescriptions",
  PRESCRIPTION_NEW: "/supervisor/prescriptions/new",
  REPORTS: "/supervisor/reports",
} as const;

// 관리자 페이지
export const ADMIN_ROUTES = {
  DASHBOARD: "/admin/dashboard",
  USERS: "/admin/users",
  USER_DETAIL: "/admin/users/[id]",
  SURVEYS: "/admin/surveys",
  STATISTICS: "/admin/statistics",
  SETTINGS: "/admin/settings",
  SYSTEM: "/admin/system",
} as const;

// API 테스트 및 개발 도구
export const DEV_ROUTES = {
  TEST_CONNECTION: "/test-connection",
  API_DOCS: "/api-docs",
  COMPONENTS: "/dev/components",
} as const;

// 보호된 라우트 패턴
export const PROTECTED_ROUTE_PATTERNS = [
  "/dashboard",
  "/supervisor",
  "/admin",
] as const;

// 역할별 접근 가능한 라우트
export const ROLE_BASED_ROUTES = {
  1: [...Object.values(USER_ROUTES)], // 학습자
  2: [...Object.values(USER_ROUTES), ...Object.values(SUPERVISOR_ROUTES)], // 감독
  3: [
    ...Object.values(USER_ROUTES),
    ...Object.values(SUPERVISOR_ROUTES),
    ...Object.values(ADMIN_ROUTES),
  ], // 관리자
} as const;

// 리다이렉트 기본 경로
export const DEFAULT_REDIRECTS = {
  AFTER_LOGIN: {
    1: USER_ROUTES.DASHBOARD, // 학습자
    2: SUPERVISOR_ROUTES.DASHBOARD, // 감독
    3: ADMIN_ROUTES.DASHBOARD, // 관리자
  },
  AFTER_LOGOUT: PUBLIC_ROUTES.HOME,
  UNAUTHORIZED: AUTH_ROUTES.LOGIN,
} as const;

// 네비게이션 메뉴 구성
export const NAVIGATION = {
  PUBLIC: [
    { name: "홈", href: PUBLIC_ROUTES.HOME },
    { name: "소개", href: PUBLIC_ROUTES.ABOUT },
    { name: "문의", href: PUBLIC_ROUTES.CONTACT },
  ],
  USER: [
    { name: "대시보드", href: USER_ROUTES.DASHBOARD },
    { name: "설문조사", href: USER_ROUTES.SURVEY },
    { name: "훈련기록", href: USER_ROUTES.TRAINING },
    { name: "결과확인", href: USER_ROUTES.RESULTS },
    { name: "프로필", href: USER_ROUTES.PROFILE },
  ],
  SUPERVISOR: [
    { name: "대시보드", href: SUPERVISOR_ROUTES.DASHBOARD },
    { name: "학습자 관리", href: SUPERVISOR_ROUTES.STUDENTS },
    { name: "진단관리", href: SUPERVISOR_ROUTES.DIAGNOSES },
    { name: "처방관리", href: SUPERVISOR_ROUTES.PRESCRIPTIONS },
    { name: "리포트", href: SUPERVISOR_ROUTES.REPORTS },
  ],
  ADMIN: [
    { name: "관리자 대시보드", href: ADMIN_ROUTES.DASHBOARD },
    { name: "사용자 관리", href: ADMIN_ROUTES.USERS },
    { name: "설문 관리", href: ADMIN_ROUTES.SURVEYS },
    { name: "통계", href: ADMIN_ROUTES.STATISTICS },
    { name: "시스템 설정", href: ADMIN_ROUTES.SETTINGS },
  ],
} as const;
