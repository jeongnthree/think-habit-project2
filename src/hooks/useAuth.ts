// hooks/useAuth.ts
'use client';

import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

// 사용자 역할 타입 정의
export type UserRole = 1 | 2 | 3; // 1: 학습자, 2: 감독, 3: 관리자

// 사용자 프로필 인터페이스
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  role_name: string;
  name?: string;
  avatar_url?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  profile: {
    name?: string;
    avatar_url?: string;
    phone?: string;
    preferences?: {
      notifications?: {
        email?: boolean;
        sms?: boolean;
        push?: boolean;
      };
      privacy?: {
        profile_visibility?: 'public' | 'private';
        data_sharing?: boolean;
      };
    };
  };
  created_at: string;
  updated_at: string;
}

// 인증 상태 인터페이스
export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

// 로그인 파라미터 인터페이스
export interface SignInParams {
  email: string;
  password: string;
  remember?: boolean;
}

// 회원가입 파라미터 인터페이스
export interface SignUpParams {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
  organizationName?: string;
  organizationType?: string;
  familyName?: string;
  tutorName?: string;
  [key: string]: any; // 추가 데이터를 위한 인덱스 시그니처
}

// 비밀번호 재설정 파라미터
export interface ResetPasswordParams {
  email: string;
}

// 비밀번호 업데이트 파라미터
export interface UpdatePasswordParams {
  password: string;
}

// 프로필 업데이트 파라미터
export interface UpdateProfileParams {
  name?: string;
  phone?: string;
  avatar_url?: string;
  preferences?: UserProfile['profile']['preferences'];
}

/**
 * 사용자 인증 상태를 관리하는 커스텀 훅
 * Supabase Auth와 완전히 통합된 인증 시스템
 */
export const useAuth = () => {
  // 인증 상태 관리
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
  });

  /**
   * 에러 상태 설정
   */
  const setError = useCallback((error: string | null) => {
    setAuthState(prev => ({ ...prev, error, loading: false }));
  }, []);

  /**
   * 로딩 상태 설정
   */
  const setLoading = useCallback((loading: boolean) => {
    setAuthState(prev => ({ ...prev, loading }));
  }, []);

  /**
   * 사용자 프로필 조회
   */
  const fetchUserProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select(
            `
          id,
          email,
          role,
          profile,
          status,
          created_at,
          updated_at
        `
          )
          .eq('auth_id', userId)
          .single();

        if (error) {
          console.error('프로필 조회 오류:', error);
          return null;
        }

        // 역할 이름 변환
        const role_name =
          data.role === 1
            ? '학습자'
            : data.role === 2
              ? '감독'
              : data.role === 3
                ? '관리자'
                : '알 수 없음';

        return {
          ...data,
          role_name,
          name: data.profile?.name,
          avatar_url: data.profile?.avatar_url,
          phone: data.profile?.phone,
        } as UserProfile;
      } catch (error) {
        console.error('프로필 조회 중 예외 발생:', error);
        return null;
      }
    },
    []
  );

  /**
   * 인증 상태 업데이트
   */
  const updateAuthState = useCallback(
    async (user: User | null, session: Session | null) => {
      setLoading(true);
      setError(null);

      try {
        if (user && session) {
          // 사용자 프로필 조회
          const profile = await fetchUserProfile(user.id);

          setAuthState({
            user,
            profile,
            session,
            loading: false,
            error: null,
          });
        } else {
          // 로그아웃 상태
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('인증 상태 업데이트 오류:', error);
        setError('인증 상태 업데이트 중 오류가 발생했습니다.');
      }
    },
    [fetchUserProfile, setLoading, setError]
  );

  /**
   * 로그인 (임시로 API 사용)
   */
  const signIn = useCallback(
    async ({ email, password, remember = false }: SignInParams) => {
      setLoading(true);
      setError(null);

      try {
        // 임시로 API 로그인 사용
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          throw new Error('로그인 요청이 실패했습니다.');
        }

        const result = await response.json();

        if (result.success) {
          // 로그인 성공 처리
          localStorage.setItem('auth_token', result.token);
          localStorage.setItem('auth_user', JSON.stringify(result.user));

          // Remember me 기능 (선택사항)
          if (remember) {
            localStorage.setItem('rememberUser', 'true');
          }

          // 인증 상태 업데이트 (임시 사용자 객체 생성)
          const mockUser = {
            id: result.user.id,
            email: result.user.email,
            user_metadata: { name: result.user.name },
            app_metadata: {},
            aud: 'authenticated',
            created_at: result.user.createdAt,
            updated_at: result.user.updatedAt,
          } as User;

          const mockProfile = {
            id: result.user.id,
            email: result.user.email,
            role: 1 as UserRole,
            role_name: '학습자',
            name: result.user.name,
            status: 'active' as const,
            profile: {
              name: result.user.name,
              preferences: {
                notifications: { email: true, sms: false, push: true },
                privacy: {
                  profile_visibility: 'public' as const,
                  data_sharing: false,
                },
              },
            },
            created_at: result.user.createdAt,
            updated_at: result.user.updatedAt,
          } as UserProfile;

          setAuthState({
            user: mockUser,
            profile: mockProfile,
            session: null,
            loading: false,
            error: null,
          });

          return { data: { user: mockUser }, error: null };
        } else {
          throw new Error(result.error || '로그인에 실패했습니다.');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : '로그인 중 오류가 발생했습니다.';
        setError(errorMessage);
        return { data: null, error: errorMessage };
      }
    },
    [setLoading, setError]
  );

  /**
   * 회원가입
   */
  const signUp = useCallback(
    async (params: SignUpParams) => {
      const { email, password, name, phone, role = 1 } = params;
      setLoading(true);
      setError(null);

      try {
        // 1. Supabase Auth에 사용자 등록
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              name,
              phone,
              role,
              organizationName: params.organizationName,
              organizationType: params.organizationType,
              familyName: params.familyName,
              tutorName: params.tutorName,
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          // 2. Users 테이블에 프로필 정보 저장
          const { error: profileError } = await supabase.from('users').insert({
            auth_id: data.user.id,
            email: email.trim().toLowerCase(),
            role,
            profile: {
              name,
              phone,
              preferences: {
                notifications: {
                  email: true,
                  sms: false,
                  push: true,
                },
                privacy: {
                  profile_visibility: 'public',
                  data_sharing: false,
                },
              },
            },
            status: 'active',
          });

          if (profileError) {
            console.error('프로필 생성 오류:', profileError);
            // Auth 사용자는 생성되었지만 프로필 생성 실패
            throw new Error(
              '회원가입은 완료되었지만 프로필 설정 중 오류가 발생했습니다.'
            );
          }
        }

        return { data, error: null };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : '회원가입 중 오류가 발생했습니다.';
        setError(errorMessage);
        return { data: null, error: errorMessage };
      }
    },
    [setLoading, setError]
  );

  /**
   * Google 소셜 로그인 (직접 구현)
   */
  const signInWithGoogle = useCallback(
    async (redirectTo?: string) => {
      setLoading(true);
      setError(null);

      try {
        console.log('🚀 직접 Google OAuth 시작');

        // 직접 Google OAuth URL로 리다이렉트
        const authUrl = `/auth/google${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;
        
        // 페이지 리다이렉트
        window.location.href = authUrl;

        return { error: null };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Google 로그인 중 오류가 발생했습니다.';
        console.error('Google 로그인 오류:', errorMessage);
        setError(errorMessage);
        return { error: errorMessage };
      } finally {
        // OAuth 리다이렉트가 발생하지 않은 경우에만 로딩 해제
        setTimeout(() => setLoading(false), 1000);
      }
    },
    [setLoading, setError]
  );

  /**
   * 로그아웃
   */
  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // 로컬 스토리지 정리
      localStorage.removeItem('rememberUser');

      return { error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '로그아웃 중 오류가 발생했습니다.';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, [setLoading, setError]);

  /**
   * 비밀번호 재설정 이메일 발송
   */
  const resetPassword = useCallback(
    async ({ email }: ResetPasswordParams) => {
      setLoading(true);
      setError(null);

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          }
        );

        if (error) {
          throw error;
        }

        return { error: null };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : '비밀번호 재설정 중 오류가 발생했습니다.';
        setError(errorMessage);
        return { error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  /**
   * 비밀번호 업데이트
   */
  const updatePassword = useCallback(
    async ({ password }: UpdatePasswordParams) => {
      setLoading(true);
      setError(null);

      try {
        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) {
          throw error;
        }

        return { error: null };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : '비밀번호 업데이트 중 오류가 발생했습니다.';
        setError(errorMessage);
        return { error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  /**
   * 프로필 업데이트
   */
  const updateProfile = useCallback(
    async (updates: UpdateProfileParams) => {
      if (!authState.user || !authState.profile) {
        setError('로그인이 필요합니다.');
        return { error: '로그인이 필요합니다.' };
      }

      setLoading(true);
      setError(null);

      try {
        const { error } = await supabase
          .from('users')
          .update({
            profile: {
              ...authState.profile.profile,
              ...updates,
            },
          })
          .eq('auth_id', authState.user.id);

        if (error) {
          throw error;
        }

        // 프로필 재조회
        const updatedProfile = await fetchUserProfile(authState.user.id);
        if (updatedProfile) {
          setAuthState(prev => ({
            ...prev,
            profile: updatedProfile,
            loading: false,
          }));
        }

        return { error: null };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : '프로필 업데이트 중 오류가 발생했습니다.';
        setError(errorMessage);
        return { error: errorMessage };
      }
    },
    [authState.user, authState.profile, fetchUserProfile, setLoading, setError]
  );

  /**
   * 사용자 역할 확인 함수들
   */
  const isLearner = useCallback(
    () => authState.profile?.role === 1,
    [authState.profile]
  );
  const isSupervisor = useCallback(
    () => authState.profile?.role === 2,
    [authState.profile]
  );
  const isAdmin = useCallback(
    () => authState.profile?.role === 3,
    [authState.profile]
  );
  const isExpert = useCallback(
    () => authState.profile?.role && authState.profile.role >= 2,
    [authState.profile]
  );

  /**
   * 권한 확인
   */
  const hasPermission = useCallback(
    (requiredRole: UserRole) => {
      return authState.profile?.role && authState.profile.role >= requiredRole;
    },
    [authState.profile]
  );

  /**
   * 세션 갱신
   */
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '세션 갱신 중 오류가 발생했습니다.';
      console.error('세션 갱신 오류:', errorMessage);
      return { data: null, error: errorMessage };
    }
  }, []);

  /**
   * 초기화 및 인증 상태 감지
   */
  useEffect(() => {
    let mounted = true;

    // 초기 세션 확인
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (mounted) {
          await updateAuthState(session?.user || null, session);
        }
      } catch (error) {
        console.error('초기 인증 상태 확인 오류:', error);
        if (mounted) {
          setError('인증 상태 확인 중 오류가 발생했습니다.');
        }
      }
    };

    initializeAuth();

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        console.log('Auth state changed:', event, session?.user?.id);
        await updateAuthState(session?.user || null, session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [updateAuthState, setError]);

  return {
    // 상태
    user: authState.user,
    profile: authState.profile,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,

    // 인증 여부
    isAuthenticated: !!authState.user && !!authState.profile,

    // 인증 액션
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    updateProfile,

    // 역할 확인
    isLearner,
    isSupervisor,
    isAdmin,
    isExpert,
    hasPermission,

    // 유틸리티
    refreshSession,
    setError,
  };
};
