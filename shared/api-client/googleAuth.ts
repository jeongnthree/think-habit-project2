import { AuthResult } from '../types/auth';

// 구글 OAuth 설정
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_REDIRECT_URI =
  process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
  (typeof window !== 'undefined'
    ? `${window.location.origin}/api/auth/google/callback`
    : 'http://localhost:3000/api/auth/google/callback');

// 구글 사용자 정보 인터페이스
interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
}

// 구글 OAuth 응답 인터페이스
interface GoogleAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token?: string;
}

class GoogleAuthService {
  private clientId: string;
  private redirectUri: string;
  private scope: string;

  constructor() {
    this.clientId = GOOGLE_CLIENT_ID;
    this.redirectUri = GOOGLE_REDIRECT_URI;
    this.scope = ['openid', 'profile', 'email'].join(' ');

    if (!this.clientId) {
      console.warn(
        'Google Client ID가 설정되지 않았습니다. 환경변수 NEXT_PUBLIC_GOOGLE_CLIENT_ID를 확인하세요.'
      );
    }
  }

  /**
   * 팝업을 통한 구글 로그인
   */
  async loginWithPopup(): Promise<AuthResult> {
    try {
      if (!this.clientId) {
        throw new Error('Google Client ID가 설정되지 않았습니다.');
      }

      // 구글 OAuth URL 생성
      const authUrl = this.buildAuthUrl();

      // 팝업 창 열기
      const popup = this.openPopup(authUrl);

      // 팝업에서 인증 완료 대기
      const authCode = await this.waitForAuthCode(popup);

      // 인증 코드를 토큰으로 교환
      const tokenResponse = await this.exchangeCodeForToken(authCode);

      // 사용자 정보 가져오기
      const userInfo = await this.getUserInfo(tokenResponse.access_token);

      // 백엔드에 사용자 정보 전송하여 로그인 처리
      const loginResult = await this.processGoogleLogin(
        userInfo,
        tokenResponse
      );

      return loginResult;
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '구글 로그인에 실패했습니다.',
        user: undefined,
      };
    }
  }

  /**
   * 리다이렉트를 통한 구글 로그인
   */
  loginWithRedirect(): void {
    if (!this.clientId) {
      console.error('Google Client ID가 설정되지 않았습니다.');
      return;
    }

    const authUrl = this.buildAuthUrl();
    window.location.href = authUrl;
  }

  /**
   * OAuth URL 생성
   */
  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scope,
      access_type: 'offline',
      prompt: 'consent',
      state: this.generateState(),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * 팝업 창 열기
   */
  private openPopup(url: string): Window {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      url,
      'google-login',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      throw new Error(
        '팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.'
      );
    }

    return popup;
  }

  /**
   * 팝업에서 인증 코드 대기
   */
  private waitForAuthCode(popup: Window): Promise<string> {
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkClosed);
            reject(new Error('사용자가 로그인을 취소했습니다.'));
          }
        } catch (error) {
          // Cross-Origin-Opener-Policy 오류 무시
          console.warn('팝업 상태 확인 중 오류 (무시됨):', error);
        }
      }, 1000);

      // 메시지 리스너 등록
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          resolve(event.data.code);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          reject(new Error(event.data.error || '구글 로그인에 실패했습니다.'));
        }
      };

      window.addEventListener('message', messageListener);

      // 타임아웃 설정 (5분)
      setTimeout(
        () => {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          if (!popup.closed) {
            popup.close();
          }
          reject(new Error('로그인 시간이 초과되었습니다.'));
        },
        5 * 60 * 1000
      );
    });
  }

  /**
   * 인증 코드를 토큰으로 교환
   */
  private async exchangeCodeForToken(
    code: string
  ): Promise<GoogleAuthResponse> {
    const response = await fetch('/api/auth/google/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '토큰 교환에 실패했습니다.');
    }

    return response.json();
  }

  /**
   * 구글 사용자 정보 가져오기
   */
  private async getUserInfo(accessToken: string): Promise<GoogleUser> {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('사용자 정보를 가져오는데 실패했습니다.');
    }

    return response.json();
  }

  /**
   * 백엔드에서 구글 로그인 처리
   */
  private async processGoogleLogin(
    userInfo: GoogleUser,
    tokenResponse: GoogleAuthResponse
  ): Promise<AuthResult> {
    const response = await fetch('/api/auth/google/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInfo,
        accessToken: tokenResponse.access_token,
        idToken: tokenResponse.id_token,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '로그인 처리에 실패했습니다.');
    }

    const result = await response.json();
    return {
      success: true,
      user: result.user,
      error: undefined,
    };
  }

  /**
   * 상태 값 생성 (CSRF 보호)
   */
  private generateState(): string {
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint32Array(4);
      window.crypto.getRandomValues(array);
      return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join(
        ''
      );
    } else {
      // 서버 사이드 렌더링을 위한 대체 구현
      return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
      );
    }
  }

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    try {
      // 구글 세션 로그아웃 (선택사항)
      // window.open('https://accounts.google.com/logout', '_blank');
      // 로컬 세션 정리는 메인 AuthService에서 처리
    } catch (error) {
      console.error('Google 로그아웃 오류:', error);
    }
  }

  /**
   * 현재 로그인 상태 확인
   */
  isConfigured(): boolean {
    return !!this.clientId;
  }
}

export default GoogleAuthService;
