// src/main/services/AuthService.ts
import { BrowserWindow } from "electron";
import Store from "electron-store";
import { decode } from "jsonwebtoken";

export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  subscription?: "free" | "premium";
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
}

class AuthService {
  private store: Store;
  private currentUser: User | null = null;
  private currentToken: string | null = null;
  private currentRefreshToken: string | null = null;
  private refreshTokenTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Secure storage for auth data
    this.store = new Store({
      name: "auth-store",
      encryptionKey: "think-habit-auth-key", // In production, use a proper key
      defaults: {
        user: null,
        token: null,
        refreshToken: null,
        rememberMe: false,
      },
    });

    // Restore authentication state on startup
    this.restoreAuthState();
  }

  /**
   * Login with email and password
   */
  async login(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      // Here we would integrate with Think-Habit API
      // For now, implementing with Supabase Auth
      const { supabase } = await import("../../shared/supabase");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (data.user && data.session) {
        const user: User = {
          id: data.user.id,
          email: data.user.email || credentials.email,
          displayName:
            data.user.user_metadata?.display_name ||
            data.user.email?.split("@")[0] ||
            "User",
        };

        const authResult: AuthResult = {
          success: true,
          user,
          token: data.session.access_token,
          refreshToken: data.session.refresh_token,
        };

        // Store authentication data
        await this.storeAuthData(authResult, credentials.rememberMe);

        // Set up token refresh
        this.setupTokenRefresh(data.session.expires_in || 3600);

        return authResult;
      }

      return {
        success: false,
        error: "Login failed: Invalid response",
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  }

  /**
   * Logout user and clear stored data
   */
  async logout(): Promise<void> {
    try {
      // Sign out from Supabase
      const { supabase } = await import("../../shared/supabase");
      await supabase.auth.signOut();

      // Clear local storage
      this.clearAuthData();

      // Clear refresh timer
      if (this.refreshTokenTimer) {
        clearTimeout(this.refreshTokenTimer);
        this.refreshTokenTimer = null;
      }

      // Notify renderer process
      this.notifyAuthStateChange();
    } catch (error) {
      console.error("Logout error:", error);
      // Even if server logout fails, clear local data
      this.clearAuthData();
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<boolean> {
    try {
      if (!this.currentRefreshToken) {
        await this.logout();
        return false;
      }

      const { supabase } = await import("../../shared/supabase");
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: this.currentRefreshToken,
      });

      if (error || !data.session) {
        console.error("Token refresh failed:", error);
        await this.logout();
        return false;
      }

      // Update stored tokens
      this.currentToken = data.session.access_token;
      this.currentRefreshToken = data.session.refresh_token;

      // Update secure storage
      this.store.set("token", this.currentToken);
      this.store.set("refreshToken", this.currentRefreshToken);

      // Set up next refresh
      this.setupTokenRefresh(data.session.expires_in || 3600);

      console.log("Token refreshed successfully");
      return true;
    } catch (error) {
      console.error("Token refresh error:", error);
      await this.logout();
      return false;
    }
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return {
      isAuthenticated: !!this.currentToken && !!this.currentUser,
      user: this.currentUser,
      token: this.currentToken,
      refreshToken: this.currentRefreshToken,
    };
  }

  /**
   * Check if current token is valid
   */
  isTokenValid(): boolean {
    if (!this.currentToken) return false;

    try {
      const decoded = decode(this.currentToken) as any;
      if (!decoded || !decoded.exp) return false;

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp > currentTime;
    } catch (error) {
      console.error("Token validation error:", error);
      return false;
    }
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.isTokenValid() ? this.currentToken : null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Store authentication data securely
   */
  private async storeAuthData(
    authResult: AuthResult,
    rememberMe: boolean = false,
  ): Promise<void> {
    this.currentUser = authResult.user || null;
    this.currentToken = authResult.token || null;
    this.currentRefreshToken = authResult.refreshToken || null;

    if (rememberMe) {
      // Store persistently
      this.store.set("user", this.currentUser);
      this.store.set("token", this.currentToken);
      this.store.set("refreshToken", this.currentRefreshToken);
      this.store.set("rememberMe", true);
    } else {
      // Clear persistent storage but keep in memory for session
      this.store.delete("user");
      this.store.delete("token");
      this.store.delete("refreshToken");
      this.store.set("rememberMe", false);
    }

    // Notify renderer process
    this.notifyAuthStateChange();
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    this.currentUser = null;
    this.currentToken = null;
    this.currentRefreshToken = null;

    // Clear secure storage
    this.store.delete("user");
    this.store.delete("token");
    this.store.delete("refreshToken");
    this.store.delete("rememberMe");

    this.notifyAuthStateChange();
  }

  /**
   * Restore authentication state from storage
   */
  private restoreAuthState(): void {
    const rememberMe = this.store.get("rememberMe", false) as boolean;

    if (rememberMe) {
      this.currentUser = this.store.get("user", null) as User | null;
      this.currentToken = this.store.get("token", null) as string | null;
      this.currentRefreshToken = this.store.get("refreshToken", null) as
        | string
        | null;

      // Validate restored token
      if (this.currentToken && !this.isTokenValid()) {
        // Token expired, try to refresh
        this.refreshAccessToken();
      } else if (this.currentToken) {
        // Set up refresh for valid token
        const decoded = decode(this.currentToken) as any;
        if (decoded && decoded.exp) {
          const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
          this.setupTokenRefresh(expiresIn);
        }
      }
    }
  }

  /**
   * Setup automatic token refresh
   */
  private setupTokenRefresh(expiresInSeconds: number): void {
    if (this.refreshTokenTimer) {
      clearTimeout(this.refreshTokenTimer);
    }

    // Refresh token 5 minutes before expiry
    const refreshTime = Math.max(expiresInSeconds - 300, 60) * 1000;

    this.refreshTokenTimer = setTimeout(() => {
      this.refreshAccessToken();
    }, refreshTime);

    console.log(`Token refresh scheduled in ${refreshTime / 1000} seconds`);
  }

  /**
   * Notify renderer process about auth state changes
   */
  private notifyAuthStateChange(): void {
    const allWindows = BrowserWindow.getAllWindows();
    const authState = this.getAuthState();

    allWindows.forEach((window) => {
      window.webContents.send("auth-state-changed", authState);
    });
  }
}

// Export singleton instance
export const authService = new AuthService();
