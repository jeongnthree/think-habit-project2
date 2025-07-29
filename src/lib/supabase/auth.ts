// Supabase 인증 유틸리티 함수들
import { supabase } from '../supabase';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  provider?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  token?: string;
}

/**
 * Google OAuth 로그인 시작 (직접 구현)
 */
export async function signInWithGoogle(redirectTo: string = '/dashboard'): Promise<{ error: Error | null }> {
  try {
    console.log('🚀 직접 Google OAuth 시작');
    
    // 직접 Google OAuth URL로 리다이렉트
    const authUrl = `/auth/google${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;
    
    console.log('리디렉션 경로:', authUrl);
    
    // 페이지 리다이렉트
    window.location.href = authUrl;
    
    return { error: null };

  } catch (err) {
    console.error('❌ Google OAuth 시작 중 예외:', err);
    return { error: err as Error };
  }
}

/**
 * 이메일/패스워드로 로그인
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    console.log('🔐 이메일 로그인 시도:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ 이메일 로그인 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }

    if (data.user) {
      console.log('✅ 이메일 로그인 성공:', data.user.email);
      
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name,
          avatar_url: data.user.user_metadata?.avatar_url,
          provider: 'email'
        },
        token: data.session?.access_token
      };
    }

    return {
      success: false,
      error: '로그인에 실패했습니다.'
    };

  } catch (err) {
    console.error('❌ 이메일 로그인 중 예외:', err);
    return {
      success: false,
      error: '로그인 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 회원가입 (이메일/패스워드)
 */
export async function signUpWithEmail(
  email: string, 
  password: string, 
  name: string
): Promise<AuthResult> {
  try {
    console.log('📝 회원가입 시도:', email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          full_name: name,
        }
      }
    });

    if (error) {
      console.error('❌ 회원가입 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }

    if (data.user) {
      console.log('✅ 회원가입 성공:', data.user.email);
      
      // 이메일 확인이 필요한 경우
      if (!data.session) {
        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email!,
            name: name,
            provider: 'email'
          },
          error: '회원가입이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요.'
        };
      }

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: name,
          provider: 'email'
        },
        token: data.session?.access_token
      };
    }

    return {
      success: false,
      error: '회원가입에 실패했습니다.'
    };

  } catch (err) {
    console.error('❌ 회원가입 중 예외:', err);
    return {
      success: false,
      error: '회원가입 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 로그아웃
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    console.log('👋 로그아웃 시작');

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('❌ 로그아웃 실패:', error);
      return { error };
    }

    console.log('✅ 로그아웃 완료');
    return { error: null };

  } catch (err) {
    console.error('❌ 로그아웃 중 예외:', err);
    return { error: err as Error };
  }
}

/**
 * 현재 세션 정보 조회
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ 세션 조회 실패:', error);
      return { session: null, error };
    }

    return { session, error: null };

  } catch (err) {
    console.error('❌ 세션 조회 중 예외:', err);
    return { session: null, error: err as Error };
  }
}

/**
 * 현재 사용자 정보 조회
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.user_metadata?.full_name,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      provider: user.app_metadata?.provider
    };

  } catch (err) {
    console.error('❌ 사용자 정보 조회 중 예외:', err);
    return null;
  }
}

/**
 * 인증 상태 변경 리스너
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔄 인증 상태 변경:', event, session?.user?.email);
    
    if (session?.user) {
      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
        avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        provider: session.user.app_metadata?.provider
      };
      callback(authUser);
    } else {
      callback(null);
    }
  });
}