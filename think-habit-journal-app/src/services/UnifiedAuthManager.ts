// 웹과 앱 간 통합 인증 관리 서비스
import { ElectronAuthService, AuthToken, AuthResult } from './ElectronAuthService';

export interface SyncConfig {
  webUrl: string;
  syncInterval: number; // 분 단위
  autoSync: boolean;
}

export class UnifiedAuthManager {
  private static instance: UnifiedAuthManager;
  private electronAuth: ElectronAuthService;
  private syncTimer: NodeJS.Timeout | null = null;
  
  private config: SyncConfig = {
    webUrl: 'http://localhost:3003',
    syncInterval: 10, // 10분마다 동기화
    autoSync: true
  };

  private constructor() {
    this.electronAuth = ElectronAuthService.getInstance();
  }

  public static getInstance(): UnifiedAuthManager {
    if (!UnifiedAuthManager.instance) {
      UnifiedAuthManager.instance = new UnifiedAuthManager();
    }
    return UnifiedAuthManager.instance;
  }

  /**
   * 통합 인증 시스템 초기화
   */
  async initialize(): Promise<void> {
    console.log('🔧 통합 인증 시스템 초기화');

    // 기존 인증 상태 확인
    const isAuthenticated = await this.electronAuth.isAuthenticated();
    console.log('📊 현재 인증 상태:', isAuthenticated ? '인증됨' : '미인증');

    // 자동 동기화 시작
    if (this.config.autoSync) {
      this.startAutoSync();
    }

    // 웹과의 초기 동기화 시도
    await this.syncFromWeb();
  }

  /**
   * Google OAuth 로그인 (통합)
   */
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      console.log('🚀 통합 Google 로그인 시작');

      // Electron AuthService를 통해 로그인
      const result = await this.electronAuth.signInWithGoogle();

      if (result.success) {
        console.log('✅ Google 로그인 성공');
        
        // 웹에도 인증 상태 동기화
        await this.syncToWeb(result.token!);
        
        // 자동 동기화 시작
        if (this.config.autoSync) {
          this.startAutoSync();
        }
      }

      return result;

    } catch (error) {
      console.error('❌ 통합 Google 로그인 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * 로그아웃 (통합)
   */
  async signOut(): Promise<void> {
    try {
      console.log('👋 통합 로그아웃 시작');

      // 자동 동기화 중지
      this.stopAutoSync();

      // 앱에서 로그아웃
      await this.electronAuth.signOut();

      // 웹에서도 로그아웃 (선택적)
      await this.signOutFromWeb();

      console.log('✅ 통합 로그아웃 완료');

    } catch (error) {
      console.error('❌ 통합 로그아웃 실패:', error);
    }
  }

  /**
   * 웹에서 앱으로 인증 상태 동기화
   */
  async syncFromWeb(): Promise<boolean> {
    try {
      console.log('📥 웹 → 앱 인증 동기화 시도');

      // 웹에서 현재 인증 상태 확인
      const webAuthStatus = await this.checkWebAuthStatus();
      
      if (!webAuthStatus.isAuthenticated) {
        console.log('📭 웹에서 인증된 사용자 없음');
        return false;
      }

      // 앱의 현재 인증 상태 확인
      const appAuthStatus = await this.electronAuth.isAuthenticated();
      
      if (appAuthStatus) {
        // 둘 다 인증된 상태면 토큰 일치 여부 확인
        const appToken = this.electronAuth.getStoredAuthData();
        if (appToken && this.isTokenValid(appToken, webAuthStatus.token)) {
          console.log('✅ 이미 동기화됨');
          return true;
        }
      }

      // 웹의 토큰을 앱에 적용
      const syncResult = await this.applyWebTokenToApp(webAuthStatus.token, webAuthStatus.user);
      
      if (syncResult) {
        console.log('✅ 웹 → 앱 동기화 성공');
      } else {
        console.log('❌ 웹 → 앱 동기화 실패');
      }

      return syncResult;

    } catch (error) {
      console.error('❌ 웹 → 앱 동기화 오류:', error);
      return false;
    }
  }

  /**
   * 앱에서 웹으로 인증 상태 동기화
   */
  async syncToWeb(token: string): Promise<boolean> {
    try {
      console.log('📤 앱 → 웹 인증 동기화 시도');

      const response = await fetch(`${this.config.webUrl}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          source: 'desktop_app',
          token: token,
          timestamp: Date.now()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 앱 → 웹 동기화 성공');
        return true;
      } else {
        console.log('❌ 앱 → 웹 동기화 실패:', result.error);
        return false;
      }

    } catch (error) {
      console.error('❌ 앱 → 웹 동기화 오류:', error);
      return false;
    }
  }

  /**
   * 웹 인증 상태 확인 (Supabase 기반)
   */
  private async checkWebAuthStatus(): Promise<{
    isAuthenticated: boolean;
    token?: string;
    user?: any;
  }> {
    try {
      // 웹 앱의 Supabase 세션 확인
      const response = await fetch(`${this.config.webUrl}/api/auth/status`, {
        method: 'GET',
        credentials: 'include' // 쿠키 포함
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.isAuthenticated && data.session) {
          return {
            isAuthenticated: true,
            token: data.session.access_token,
            user: data.user || data.session.user
          };
        }
      }

      return { isAuthenticated: false };

    } catch (error) {
      console.error('웹 인증 상태 확인 실패:', error);
      return { isAuthenticated: false };
    }
  }

  /**
   * 웹 토큰을 앱에 적용
   */
  private async applyWebTokenToApp(webToken: string, user: any): Promise<boolean> {
    try {
      // 웹 토큰을 앱 형식으로 변환
      const appToken: AuthToken = {
        access_token: webToken,
        expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24시간
        user_id: user.id
      };

      // 앱에 토큰 저장 (ElectronAuthService의 private 메서드 사용을 위해 우회)
      const { app } = require('electron');
      const path = require('path');
      const fs = require('fs');

      const userDataPath = app.getPath('userData');
      const authFilePath = path.join(userDataPath, 'auth.json');

      const authData = {
        token: appToken,
        user: user,
        syncedFromWeb: true,
        updatedAt: new Date().toISOString()
      };

      fs.writeFileSync(authFilePath, JSON.stringify(authData, null, 2));
      console.log('💾 웹 토큰이 앱에 저장됨');

      return true;

    } catch (error) {
      console.error('웹 토큰 적용 실패:', error);
      return false;
    }
  }

  /**
   * 웹에서 로그아웃
   */
  private async signOutFromWeb(): Promise<void> {
    try {
      await fetch(`${this.config.webUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      console.log('👋 웹 로그아웃 완료');
    } catch (error) {
      console.error('웹 로그아웃 실패:', error);
    }
  }

  /**
   * 토큰 유효성 확인
   */
  private isTokenValid(appToken: AuthToken, webToken: any): boolean {
    // 간단한 토큰 일치 확인
    return appToken.access_token === webToken || 
           appToken.user_id === webToken?.user_id;
  }

  /**
   * 자동 동기화 시작
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    const intervalMs = this.config.syncInterval * 60 * 1000;
    
    this.syncTimer = setInterval(async () => {
      console.log('🔄 자동 인증 동기화 실행');
      await this.syncFromWeb();
    }, intervalMs);

    console.log(`⏰ 자동 동기화 시작: ${this.config.syncInterval}분 간격`);
  }

  /**
   * 자동 동기화 중지
   */
  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('⏸️ 자동 동기화 중지됨');
    }
  }

  /**
   * 현재 인증 상태 조회
   */
  async getAuthStatus(): Promise<{
    isAuthenticated: boolean;
    user?: any;
    source?: 'app' | 'web' | 'synced';
  }> {
    const isAuthenticated = await this.electronAuth.isAuthenticated();
    
    if (isAuthenticated) {
      const user = await this.electronAuth.getCurrentUser();
      const authData = this.getStoredAuthData();
      
      return {
        isAuthenticated: true,
        user: user,
        source: authData?.syncedFromWeb ? 'synced' : 'app'
      };
    }

    return { isAuthenticated: false };
  }

  /**
   * 저장된 인증 데이터 조회 (확장)
   */
  private getStoredAuthData(): any {
    try {
      const { app } = require('electron');
      const path = require('path');
      const fs = require('fs');

      const userDataPath = app.getPath('userData');
      const authFilePath = path.join(userDataPath, 'auth.json');

      if (!fs.existsSync(authFilePath)) {
        return null;
      }

      return JSON.parse(fs.readFileSync(authFilePath, 'utf8'));

    } catch (error) {
      console.error('인증 데이터 조회 실패:', error);
      return null;
    }
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 자동 동기화 설정 변경 시 재시작
    if (newConfig.autoSync !== undefined || newConfig.syncInterval !== undefined) {
      this.stopAutoSync();
      if (this.config.autoSync) {
        this.startAutoSync();
      }
    }

    console.log('⚙️ 통합 인증 설정 업데이트:', this.config);
  }
}