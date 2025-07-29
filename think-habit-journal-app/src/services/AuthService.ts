import { platformService } from "./platform";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
  };
  private listeners: ((state: AuthState) => void)[] = [];

  constructor() {
    // 앱 시작 시 저장된 토큰 확인
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      const tokenData = await this.getStoredTokens();
      if (tokenData && this.isTokenValid(tokenData)) {
        // 토큰이 유효하면 사용자 정보 복원
        const user = await this.getStoredUser();
        if (user) {
          this.updateAuthState({
            isAuthenticated: true,
            user,
            loading: false,
            error: null,
          });
        } else {
          // 사용자 정보가 없으면 로그아웃 상태로 설정
          this.updateAuthState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null,
          });
        }
      } else {
        // 토큰이 없거나 만료되었으면 로그아웃 상태로 설정
        this.updateAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
      this.clearAuthData();
      // 오류 발생 시에도 loading을 false로 설정
      this.updateAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : "인증 초기화 실패",
      });
    }
  }

  async login(credentials: LoginCredentials): Promise<void> {
    this.updateAuthState({ ...this.authState, loading: true, error: null });

    try {
      // Think-Habit API 로그인 요청
      const response = await this.makeAuthRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      const { user, accessToken, refreshToken, expiresIn } = response;

      // 토큰 저장
      await this.storeTokens({
        accessToken,
        refreshToken,
        expiresAt: Date.now() + expiresIn * 1000,
      });

      // 사용자 정보 저장
      await this.storeUser(user);

      this.updateAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
      });

      // 로그인 성공 알림
      await platformService.notification.show(
        "로그인 성공",
        `${user.name}님, 환영합니다!`,
      );
    } catch (error) {
      this.updateAuthState({
        ...this.authState,
        loading: false,
        error:
          error instanceof Error ? error.message : "로그인에 실패했습니다.",
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // 서버에 로그아웃 요청
      const tokenData = await this.getStoredTokens();
      if (tokenData) {
        await this.makeAuthRequest("/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenData.accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      this.clearAuthData();

      // 로그아웃 알림
      await platformService.notification.show(
        "로그아웃",
        "성공적으로 로그아웃되었습니다.",
      );
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const tokenData = await this.getStoredTokens();
      if (!tokenData?.refreshToken) {
        return false;
      }

      const response = await this.makeAuthRequest("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: tokenData.refreshToken }),
      });

      const { accessToken, refreshToken, expiresIn } = response;

      await this.storeTokens({
        accessToken,
        refreshToken,
        expiresAt: Date.now() + expiresIn * 1000,
      });

      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.clearAuthData();
      return false;
    }
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    const tokenData = await this.getStoredTokens();
    if (!tokenData) return;

    // 토큰이 5분 내에 만료되면 리프레시
    const fiveMinutes = 5 * 60 * 1000;
    if (tokenData.expiresAt - Date.now() < fiveMinutes) {
      await this.refreshToken();
    }
  }

  async getValidToken(): Promise<string | null> {
    await this.refreshTokenIfNeeded();
    const tokenData = await this.getStoredTokens();
    return tokenData?.accessToken || null;
  }

  private async makeAuthRequest(
    endpoint: string,
    options: RequestInit,
  ): Promise<any> {
    const baseUrl =
      process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api";

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private async storeTokens(tokenData: TokenData): Promise<void> {
    await platformService.storage.set("tokens", tokenData);
  }

  private async getStoredTokens(): Promise<TokenData | null> {
    return await platformService.storage.get<TokenData>("tokens");
  }

  private async storeUser(user: AuthUser): Promise<void> {
    await platformService.storage.set("user", user);
  }

  private async getStoredUser(): Promise<AuthUser | null> {
    return await platformService.storage.get<AuthUser>("user");
  }

  private isTokenValid(tokenData: TokenData): boolean {
    return tokenData.expiresAt > Date.now();
  }

  private async clearAuthData(): Promise<void> {
    await platformService.storage.set("tokens", null);
    await platformService.storage.set("user", null);

    this.updateAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    });
  }

  private updateAuthState(newState: AuthState): void {
    this.authState = newState;
    this.listeners.forEach((listener) => listener(newState));
  }

  // 상태 구독
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);

    // 현재 상태 즉시 전달
    listener(this.authState);

    // 구독 해제 함수 반환
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getAuthState(): AuthState {
    return this.authState;
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  getCurrentUser(): AuthUser | null {
    return this.authState.user;
  }
}

// 싱글톤 인스턴스
export const authService = new AuthService();
export default AuthService;
