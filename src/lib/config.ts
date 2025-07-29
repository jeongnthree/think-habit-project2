/**
 * 애플리케이션 환경 설정 관리
 */

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_CLIENT: typeof window !== 'undefined',
} as const;

export const SUPABASE_CONFIG = {
  URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
} as const;

export const GOOGLE_CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  REDIRECT_URI: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || '',
} as const;

export const APP_CONFIG = {
  URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NAME: process.env.NEXT_PUBLIC_APP_NAME || '생각습관',
  DOMAIN: process.env.NEXT_PUBLIC_DOMAIN || '생각습관.com',
} as const;

/**
 * 설정 유효성 검사
 */
export const validateConfig = () => {
  const errors: string[] = [];

  // 프로덕션 환경에서 필수 설정 검사
  if (ENV.IS_PRODUCTION) {
    if (
      !SUPABASE_CONFIG.URL ||
      SUPABASE_CONFIG.URL === 'https://example.supabase.co'
    ) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.');
    }

    if (
      !SUPABASE_CONFIG.ANON_KEY ||
      SUPABASE_CONFIG.ANON_KEY.includes('dummy')
    ) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 개발 환경 설정
 */
export const DEV_CONFIG = {
  MOCK_SUPABASE_URL: 'https://example.supabase.co',
  MOCK_SUPABASE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjE1MzgwMCwiZXhwIjoxOTMxNzI5ODAwfQ.mock',
  ENABLE_OAUTH_SIMULATION: true,
} as const;
