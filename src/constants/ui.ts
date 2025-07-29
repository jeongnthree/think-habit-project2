/**
 * UI 관련 상수 정의
 */

// 컬러 팔레트
export const COLORS = {
  PRIMARY: {
    50: "#eff6ff",
    100: "#dbeafe",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
  },
  SECONDARY: {
    50: "#f8fafc",
    100: "#f1f5f9",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
  },
  SUCCESS: {
    50: "#f0fdf4",
    100: "#dcfce7",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
  },
  WARNING: {
    50: "#fffbeb",
    100: "#fef3c7",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
  },
  ERROR: {
    50: "#fef2f2",
    100: "#fee2e2",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
  },
  GRAY: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
} as const;

// 브레이크포인트
export const BREAKPOINTS = {
  SM: "640px",
  MD: "768px",
  LG: "1024px",
  XL: "1280px",
  "2XL": "1536px",
} as const;

// 간격 (spacing)
export const SPACING = {
  XS: "0.25rem", // 4px
  SM: "0.5rem", // 8px
  MD: "1rem", // 16px
  LG: "1.5rem", // 24px
  XL: "2rem", // 32px
  "2XL": "3rem", // 48px
  "3XL": "4rem", // 64px
} as const;

// 폰트 크기
export const FONT_SIZES = {
  XS: "0.75rem", // 12px
  SM: "0.875rem", // 14px
  BASE: "1rem", // 16px
  LG: "1.125rem", // 18px
  XL: "1.25rem", // 20px
  "2XL": "1.5rem", // 24px
  "3XL": "1.875rem", // 30px
  "4XL": "2.25rem", // 36px
  "5XL": "3rem", // 48px
} as const;

// Z-Index 값
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
} as const;

// 애니메이션 지속 시간
export const ANIMATION_DURATION = {
  FAST: "150ms",
  NORMAL: "300ms",
  SLOW: "500ms",
} as const;

// 그림자
export const SHADOWS = {
  SM: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  MD: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  LG: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  XL: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
} as const;

// 둥근 모서리
export const BORDER_RADIUS = {
  NONE: "0",
  SM: "0.125rem", // 2px
  DEFAULT: "0.25rem", // 4px
  MD: "0.375rem", // 6px
  LG: "0.5rem", // 8px
  XL: "0.75rem", // 12px
  "2XL": "1rem", // 16px
  "3XL": "1.5rem", // 24px
  FULL: "9999px",
} as const;

// 버튼 사이즈
export const BUTTON_SIZES = {
  XS: {
    padding: "px-2 py-1",
    fontSize: FONT_SIZES.XS,
    height: "1.5rem", // 24px
  },
  SM: {
    padding: "px-3 py-1.5",
    fontSize: FONT_SIZES.SM,
    height: "2rem", // 32px
  },
  MD: {
    padding: "px-4 py-2",
    fontSize: FONT_SIZES.BASE,
    height: "2.5rem", // 40px
  },
  LG: {
    padding: "px-6 py-3",
    fontSize: FONT_SIZES.LG,
    height: "3rem", // 48px
  },
  XL: {
    padding: "px-8 py-4",
    fontSize: FONT_SIZES.XL,
    height: "3.5rem", // 56px
  },
} as const;

// 인풋 사이즈
export const INPUT_SIZES = {
  SM: {
    padding: "px-3 py-1.5",
    fontSize: FONT_SIZES.SM,
    height: "2rem",
  },
  MD: {
    padding: "px-4 py-2",
    fontSize: FONT_SIZES.BASE,
    height: "2.5rem",
  },
  LG: {
    padding: "px-4 py-3",
    fontSize: FONT_SIZES.LG,
    height: "3rem",
  },
} as const;

// 아이콘 사이즈
export const ICON_SIZES = {
  XS: "1rem", // 16px
  SM: "1.25rem", // 20px
  MD: "1.5rem", // 24px
  LG: "2rem", // 32px
  XL: "2.5rem", // 40px
} as const;

// 레이아웃 설정
export const LAYOUT = {
  HEADER_HEIGHT: "4rem", // 64px
  SIDEBAR_WIDTH: "16rem", // 256px
  FOOTER_HEIGHT: "3rem", // 48px
  CONTAINER_MAX_WIDTH: "80rem", // 1280px
  CONTENT_PADDING: SPACING.LG,
} as const;

// 그리드 설정
export const GRID = {
  COLUMNS_SM: 1,
  COLUMNS_MD: 2,
  COLUMNS_LG: 3,
  COLUMNS_XL: 4,
  GAP_SM: SPACING.SM,
  GAP_MD: SPACING.MD,
  GAP_LG: SPACING.LG,
} as const;

// 폼 관련 설정
export const FORM = {
  LABEL_SPACING: "mb-2",
  INPUT_SPACING: "mb-4",
  ERROR_SPACING: "mt-1",
  BUTTON_SPACING: "mt-6",
  FIELDSET_SPACING: "mb-6",
} as const;

// 카드 설정
export const CARD = {
  PADDING: SPACING.LG,
  BORDER_RADIUS: BORDER_RADIUS.LG,
  SHADOW: SHADOWS.DEFAULT,
  HOVER_SHADOW: SHADOWS.MD,
} as const;

// 모달 설정
export const MODAL = {
  BACKDROP_COLOR: "rgba(0, 0, 0, 0.5)",
  MAX_WIDTH: "32rem", // 512px
  PADDING: SPACING.LG,
  BORDER_RADIUS: BORDER_RADIUS.LG,
} as const;
