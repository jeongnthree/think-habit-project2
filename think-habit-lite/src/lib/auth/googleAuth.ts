import {
  AuthResult,
  GoogleAuthResponse,
  GoogleOAuthConfig,
  GoogleUserInfo,
} from "../types/auth";

// Google OAuth 설정
const GOOGLE_CONFIG: GoogleOAuthConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  redirectUri:
    process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/auth/callback",
  scope: ["openid", "email", "profile"],
};

class GoogleAuthService {
  private config: GoogleOAuthConfig;

  constructor(config: GoogleOAuthConfig = GOOGLE_CONFIG) {
    this.config = config;
  }

  /**
   * Google OAuth 로그인 URL 생성
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      scope: this.config.scope.join(" "),
      access_type: "offline",
      prompt: "consent",
      state: this.generateState(),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Google OAuth 팝업 로그인
   */
  async loginWithPopup(): Promise<AuthResult> {
    try {
      const authUrl = this.getAuthUrl();

      // 팝업 창 열기
      const popup = window.open(
        authUrl,
        "google-login",
        "width=500,height=600,scrollbars=yes,resizable=yes",
      );

      if (!popup) {
        throw new Error("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
      }

      // 팝업에서 인증 완료 대기
      const result = await this.waitForPopupResult(popup);
      return result;
    } catch (error) {
      console.error("Google 로그인 오류:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Google 로그인에 실패했습니다.",
      };
    }
  }

  /**
   * 인증 코드로 토큰 교환
   */
  async exchangeCodeForToken(code: string): Promise<GoogleAuthResponse> {
    const tokenEndpoint = "https://oauth2.googleapis.com/token";

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      code,
      grant_type: "authorization_code",
      redirect_uri: this.config.redirectUri,
    });

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error("토큰 교환에 실패했습니다.");
    }

    return response.json();
  }

  /**
   * 액세스 토큰으로 사용자 정보 가져오기
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const userInfoEndpoint = "https://www.googleapis.com/oauth2/v2/userinfo";

    const response = await fetch(userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("사용자 정보를 가져오는데 실패했습니다.");
    }

    return response.json();
  }

  /**
   * Electron 환경에서의 Google 로그인
   */
  async loginWithElectron(): Promise<AuthResult> {
    try {
      // Electron의 BrowserWindow를 사용한 인증
      if (typeof window !== "undefined" && (window as any).electronAPI) {
        const result = await (window as any).electronAPI.googleAuth(
          this.getAuthUrl(),
        );
        return this.processAuthResult(result);
      } else {
        // 웹 환경에서는 팝업 사용
        return this.loginWithPopup();
      }
    } catch (error) {
      console.error("Electron Google 로그인 오류:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Google 로그인에 실패했습니다.",
      };
    }
  }

  /**
   * 팝업 결과 대기
   */
  private waitForPopupResult(popup: Window): Promise<AuthResult> {
    return new Promise((resolve) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          resolve({
            success: false,
            error: "로그인이 취소되었습니다.",
          });
        }
      }, 1000);

      // 메시지 리스너 (팝업에서 인증 완료 시)
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === "GOOGLE_AUTH_SUCCESS") {
          clearInterval(checkClosed);
          window.removeEventListener("message", messageListener);
          popup.close();

          this.processAuthCode(event.data.code)
            .then(resolve)
            .catch((error) =>
              resolve({
                success: false,
                error: error.message,
              }),
            );
        }

        if (event.data.type === "GOOGLE_AUTH_ERROR") {
          clearInterval(checkClosed);
          window.removeEventListener("message", messageListener);
          popup.close();
          resolve({
            success: false,
            error: event.data.error,
          });
        }
      };

      window.addEventListener("message", messageListener);
    });
  }

  /**
   * 인증 코드 처리
   */
  private async processAuthCode(code: string): Promise<AuthResult> {
    try {
      const tokenResponse = await this.exchangeCodeForToken(code);
      const userInfo = await this.getUserInfo(tokenResponse.access_token);

      return {
        success: true,
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          provider: "google",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: tokenResponse.access_token,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Google 인증 처리 중 오류가 발생했습니다.",
      );
    }
  }

  /**
   * 인증 결과 처리
   */
  private async processAuthResult(result: any): Promise<AuthResult> {
    if (result.success && result.code) {
      return this.processAuthCode(result.code);
    } else {
      return {
        success: false,
        error: result.error || "Google 로그인에 실패했습니다.",
      };
    }
  }

  /**
   * 상태 값 생성 (CSRF 보호)
   */
  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    try {
      // Google 로그아웃 (선택사항)
      // await fetch('https://accounts.google.com/logout');

      // 로컬 토큰 제거
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  }
}

export default GoogleAuthService;
