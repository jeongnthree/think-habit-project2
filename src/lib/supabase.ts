import { Database } from '@/types/database';
import { createClient } from '@supabase/supabase-js';

// Supabase URL과 키 설정 (실제 환경 변수 사용)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key_for_development';

// 유효한 URL인지 확인하는 함수
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Supabase 클라이언트 초기화 로그
console.log('🚀 Supabase 클라이언트 초기화:', {
  url: supabaseUrl,
  keyPrefix: supabaseAnonKey.substring(0, 10) + '...',
  isValidUrl: isValidUrl(supabaseUrl),
});

// localStorage 사용 가능 여부 확인 (클라이언트에서만)
const isLocalStorageAvailable = () => {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__localStorage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('localStorage is not available:', e);
    return false;
  }
};

// Supabase 클라이언트 생성
export const supabase = createClient<Database>(
  isValidUrl(supabaseUrl) ? supabaseUrl : 'https://example.supabase.co',
  supabaseAnonKey,
  {
    auth: {
      persistSession: isLocalStorageAvailable(),
      storageKey: 'think-habit-auth',
      storage: isLocalStorageAvailable() ? (typeof window !== 'undefined' ? window.localStorage : undefined) : undefined,
    },
  }
);
