// 통합 인증 시스템을 사용하는 useAuth 훅
import { useEffect, useState } from "react";
import { UnifiedAuthManager } from "../services/UnifiedAuthManager";
import { AuthResult } from "../services/ElectronAuthService";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  authSource?: 'app' | 'web' | 'synced';
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  syncWithWeb: () => Promise<{ success: boolean; message?: string }>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authSource, setAuthSource] = useState<'app' | 'web' | 'synced'>();

  const authManager = UnifiedAuthManager.getInstance();

  // 통합 인증 시스템 초기화 및 상태 구독
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🚀 통합 인증 시스템 초기화 시작');
      
      // 통합 인증 매니저 초기화
      await authManager.initialize();
      
      // 현재 인증 상태 확인
      await refreshAuth();
      
    } catch (err) {
      console.error('❌ 인증 시스템 초기화 실패:', err);
      setError(err instanceof Error ? err.message : '인증 시스템 초기화 실패');
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔐 이메일 로그인 시도:', { email });
      
      // 현재 이메일/비밀번호 로그인은 미구현
      // Google OAuth를 사용하도록 안내
      throw new Error('현재 Google 로그인만 지원됩니다. Google 로그인을 사용해주세요.');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "로그인 실패";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Google 로그인 시도 (통합 인증)');
      
      const result: AuthResult = await authManager.signInWithGoogle();
      
      if (result.success && result.user) {
        setUser({
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          avatar_url: result.user.avatar_url,
        });
        setIsAuthenticated(true);
        setAuthSource('app');
        setError(null);

        console.log('✅ Google 로그인 성공:', result.user.name);
        return { success: true };

      } else {
        const errorMsg = result.error || 'Google 로그인에 실패했습니다.';
        setError(errorMsg);
        console.error('❌ Google 로그인 실패:', errorMsg);
        return { success: false, error: errorMsg };
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      console.error('❌ Google 로그인 중 오류:', err);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('👋 통합 로그아웃 시작');
      await authManager.signOut();
      
      // 상태 초기화
      setUser(null);
      setIsAuthenticated(false);
      setAuthSource(undefined);
      
      console.log('✅ 로그아웃 완료');

    } catch (err) {
      console.error('❌ 로그아웃 실패:', err);
      setError(err instanceof Error ? err.message : "로그아웃 실패");
    } finally {
      setLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      console.log('🔍 인증 상태 새로고침');
      
      const authStatus = await authManager.getAuthStatus();
      
      setUser(authStatus.user || null);
      setIsAuthenticated(authStatus.isAuthenticated);
      setAuthSource(authStatus.source);
      setError(null);
      
      console.log('📊 새로고침된 인증 상태:', {
        isAuthenticated: authStatus.isAuthenticated,
        source: authStatus.source,
        userName: authStatus.user?.name
      });

    } catch (err) {
      console.error('❌ 인증 상태 새로고침 실패:', err);
      setError(err instanceof Error ? err.message : '인증 상태 확인 실패');
      setUser(null);
      setIsAuthenticated(false);
      setAuthSource(undefined);
    } finally {
      setLoading(false);
    }
  };

  const syncWithWeb = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log('🔄 웹과 수동 동기화 시작');
      
      const syncResult = await authManager.syncFromWeb();
      
      if (syncResult) {
        // 동기화 후 상태 새로고침
        await refreshAuth();
        return { 
          success: true, 
          message: '웹과 인증 상태가 동기화되었습니다.' 
        };
      } else {
        return { 
          success: false, 
          message: '웹에서 인증된 사용자가 없거나 동기화에 실패했습니다.' 
        };
      }

    } catch (err) {
      console.error('❌ 웹 동기화 실패:', err);
      return { 
        success: false, 
        message: '웹과의 동기화 중 오류가 발생했습니다.' 
      };
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    authSource,
    login,
    loginWithGoogle,
    logout,
    refreshAuth,
    syncWithWeb,
  };
};
