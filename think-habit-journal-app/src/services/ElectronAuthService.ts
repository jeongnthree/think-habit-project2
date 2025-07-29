// Electron 앱용 Google OAuth 인증 서비스
import { BrowserWindow } from 'electron';

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
  };
  token?: string;
  error?: string;
}

export interface AuthToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  user_id: string;
}

export class ElectronAuthService {
  private static instance: ElectronAuthService;
  private static readonly WEB_AUTH_URL = 'http://localhost:3003';
  private static readonly LOCAL_CALLBACK_PORT = 8888;
  
  private authWindow: BrowserWindow | null = null;
  private authServer: any = null;

  private constructor() {}

  public static getInstance(): ElectronAuthService {
    if (!ElectronAuthService.instance) {
      ElectronAuthService.instance = new ElectronAuthService();
    }
    return ElectronAuthService.instance;
  }

  /**
   * Google OAuth 로그인 시작
   */
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      console.log('🚀 Electron Google OAuth 시작');

      // 1. 웹 OAuth URL 생성
      const authUrl = `${ElectronAuthService.WEB_AUTH_URL}/auth/google?app=desktop&port=${ElectronAuthService.LOCAL_CALLBACK_PORT}`;
      
      // 2. 인증 창 열기
      this.authWindow = new BrowserWindow({
        width: 500,
        height: 700,
        show: true,
        resizable: false,
        webSecurity: true,
        nodeIntegration: false,
        contextIsolation: true,
        title: 'Think-Habit - Google 로그인'
      });

      // 3. 로컬 콜백 서버 시작
      const authPromise = this.startCallbackServer();

      // 4. Google OAuth 페이지 로드
      await this.authWindow.loadURL(authUrl);

      // 5. 창 닫힘 이벤트 처리
      this.authWindow.on('closed', () => {
        this.authWindow = null;
        this.stopCallbackServer();
      });

      // 6. 인증 결과 대기
      const result = await authPromise;
      
      // 7. 인증 창 닫기
      if (this.authWindow) {
        this.authWindow.close();
        this.authWindow = null;
      }

      return result;

    } catch (error) {
      console.error('❌ Google OAuth 실패:', error);
      
      // 정리
      if (this.authWindow) {
        this.authWindow.close();
        this.authWindow = null;
      }
      this.stopCallbackServer();

      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * 로컬 콜백 서버 시작
   */
  private startCallbackServer(): Promise<AuthResult> {
    return new Promise((resolve, reject) => {
      const express = require('express');
      const app = express();

      app.use(express.json());

      // 인증 성공 콜백 (OAuth 표준 플로우)
      app.get('/auth/callback', async (req: any, res: any) => {
        const { code, error, state } = req.query;

        console.log('📨 OAuth 콜백 수신:', { 
          hasCode: !!code, 
          error,
          state
        });

        if (error) {
          res.send(`
            <html>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #e74c3c;">로그인 실패</h2>
                <p>${error}</p>
                <p>이 창을 닫아주세요.</p>
                <script>setTimeout(() => window.close(), 3000);</script>
              </body>
            </html>
          `);
          
          resolve({
            success: false,
            error: error as string
          });
          return;
        }

        if (code) {
          try {
            console.log('🔄 웹 서버로 토큰 교환 요청');
            
            // 웹 서버의 데스크톱 OAuth 엔드포인트로 코드 전송
            const response = await fetch(`${ElectronAuthService.WEB_AUTH_URL}/api/auth/google/desktop`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ code, state })
            });

            const result = await response.json();

            if (result.success && result.user && result.token) {
              res.send(`
                <html>
                  <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: #27ae60;">로그인 성공!</h2>
                    <p>환영합니다, ${result.user.name}님!</p>
                    <p>잠시 후 이 창이 자동으로 닫힙니다.</p>
                    <script>setTimeout(() => window.close(), 2000);</script>
                  </body>
                </html>
              `);

              // 토큰과 사용자 정보 저장
              this.storeAuthData({
                access_token: result.token,
                expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24시간
                user_id: result.user.id
              });

              resolve({
                success: true,
                user: result.user,
                token: result.token
              });

            } else {
              throw new Error(result.error || '토큰 교환에 실패했습니다.');
            }

          } catch (exchangeError) {
            console.error('토큰 교환 실패:', exchangeError);
            
            res.send(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                  <h2 style="color: #e74c3c;">로그인 실패</h2>
                  <p>토큰 교환 중 오류가 발생했습니다.</p>
                  <p>이 창을 닫아주세요.</p>
                  <script>setTimeout(() => window.close(), 3000);</script>
                </body>
              </html>
            `);
            
            resolve({
              success: false,
              error: '토큰 교환에 실패했습니다.'
            });
          }
        } else {
          resolve({
            success: false,
            error: '인증 코드를 받지 못했습니다.'
          });
        }
      });

      // 서버 시작
      this.authServer = app.listen(ElectronAuthService.LOCAL_CALLBACK_PORT, () => {
        console.log(`🖥️ 로컬 콜백 서버 시작: http://localhost:${ElectronAuthService.LOCAL_CALLBACK_PORT}`);
      });

      // 서버 에러 처리
      this.authServer.on('error', (error: any) => {
        console.error('콜백 서버 오류:', error);
        reject(new Error(`콜백 서버 시작 실패: ${error.message}`));
      });

      // 타임아웃 설정 (5분)
      setTimeout(() => {
        reject(new Error('인증 시간이 초과되었습니다.'));
      }, 5 * 60 * 1000);
    });
  }

  /**
   * 콜백 서버 중지
   */
  private stopCallbackServer(): void {
    if (this.authServer) {
      this.authServer.close();
      this.authServer = null;
      console.log('🛑 콜백 서버 중지됨');
    }
  }

  /**
   * 인증 데이터 저장
   */
  private storeAuthData(token: AuthToken): void {
    try {
      const { app } = require('electron');
      const path = require('path');
      const fs = require('fs');

      const userDataPath = app.getPath('userData');
      const authFilePath = path.join(userDataPath, 'auth.json');

      const authData = {
        token,
        updatedAt: new Date().toISOString()
      };

      fs.writeFileSync(authFilePath, JSON.stringify(authData, null, 2));
      console.log('💾 인증 데이터 저장됨:', authFilePath);

    } catch (error) {
      console.error('인증 데이터 저장 실패:', error);
    }
  }

  /**
   * 저장된 인증 데이터 조회
   */
  getStoredAuthData(): AuthToken | null {
    try {
      const { app } = require('electron');
      const path = require('path');
      const fs = require('fs');

      const userDataPath = app.getPath('userData');
      const authFilePath = path.join(userDataPath, 'auth.json');

      if (!fs.existsSync(authFilePath)) {
        return null;
      }

      const authData = JSON.parse(fs.readFileSync(authFilePath, 'utf8'));
      const token = authData.token;

      // 토큰 만료 확인
      if (token.expires_at && Date.now() > token.expires_at) {
        console.log('🕐 토큰 만료됨');
        this.clearStoredAuthData();
        return null;
      }

      return token;

    } catch (error) {
      console.error('인증 데이터 조회 실패:', error);
      return null;
    }
  }

  /**
   * 저장된 인증 데이터 삭제
   */
  clearStoredAuthData(): void {
    try {
      const { app } = require('electron');
      const path = require('path');
      const fs = require('fs');

      const userDataPath = app.getPath('userData');
      const authFilePath = path.join(userDataPath, 'auth.json');

      if (fs.existsSync(authFilePath)) {
        fs.unlinkSync(authFilePath);
        console.log('🗑️ 인증 데이터 삭제됨');
      }

    } catch (error) {
      console.error('인증 데이터 삭제 실패:', error);
    }
  }

  /**
   * 현재 로그인 상태 확인
   */
  async isAuthenticated(): Promise<boolean> {
    const token = this.getStoredAuthData();
    return token !== null;
  }

  /**
   * 로그아웃
   */
  async signOut(): Promise<void> {
    this.clearStoredAuthData();
    console.log('👋 로그아웃 완료');
  }

  /**
   * 사용자 정보 조회
   */
  async getCurrentUser(): Promise<any | null> {
    const token = this.getStoredAuthData();
    if (!token) return null;

    try {
      // 웹 API에서 사용자 정보 조회
      const response = await fetch(`${ElectronAuthService.WEB_AUTH_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token.access_token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        return userData.user;
      }

      return null;

    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      return null;
    }
  }
}