// lib/network-monitor.ts
// Think-Habit Journal App - 네트워크 상태 모니터링

/**
 * 네트워크 상태 모니터링 클래스
 */
export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private isOnlineStatus = true;
  private listeners: Array<(isOnline: boolean) => void> = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private lastOnlineTime = new Date();
  private lastOfflineTime: Date | null = null;

  private constructor() {
    this.initializeNetworkMonitoring();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  /**
   * 네트워크 모니터링 초기화
   */
  private initializeNetworkMonitoring(): void {
    // Electron 환경에서는 navigator.onLine을 사용
    if (typeof window !== "undefined" && "navigator" in window) {
      // 초기 상태 설정
      this.isOnlineStatus = navigator.onLine;

      // 브라우저 이벤트 리스너 등록
      window.addEventListener("online", this.handleOnline.bind(this));
      window.addEventListener("offline", this.handleOffline.bind(this));
    }

    // 주기적으로 네트워크 상태 확인 (30초마다)
    this.startPeriodicCheck();
  }

  /**
   * 온라인 상태가 된 경우 처리
   */
  private handleOnline(): void {
    if (!this.isOnlineStatus) {
      console.log("네트워크 연결 복구됨");
      this.isOnlineStatus = true;
      this.lastOnlineTime = new Date();
      this.notifyListeners(true);
    }
  }

  /**
   * 오프라인 상태가 된 경우 처리
   */
  private handleOffline(): void {
    if (this.isOnlineStatus) {
      console.log("네트워크 연결 끊어짐");
      this.isOnlineStatus = false;
      this.lastOfflineTime = new Date();
      this.notifyListeners(false);
    }
  }

  /**
   * 주기적 네트워크 상태 확인 시작
   */
  private startPeriodicCheck(): void {
    this.checkInterval = setInterval(async () => {
      await this.checkNetworkConnectivity();
    }, 30000); // 30초마다 확인
  }

  /**
   * 실제 네트워크 연결 상태 확인 (서버 핑 테스트)
   */
  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      // Supabase 서버로 간단한 핑 테스트
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃

      const response = await fetch(process.env.SUPABASE_URL + "/rest/v1/", {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY!,
        },
      });

      clearTimeout(timeoutId);

      const isOnline = response.ok;

      // 상태가 변경되었으면 처리
      if (isOnline !== this.isOnlineStatus) {
        if (isOnline) {
          this.handleOnline();
        } else {
          this.handleOffline();
        }
      }

      return isOnline;
    } catch (error) {
      // 네트워크 오류 시 오프라인으로 간주
      if (this.isOnlineStatus) {
        this.handleOffline();
      }
      return false;
    }
  }

  /**
   * 리스너들에게 상태 변화 알림
   */
  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach((listener) => {
      try {
        listener(isOnline);
      } catch (error) {
        console.error("네트워크 상태 리스너 오류:", error);
      }
    });
  }

  // ===== 공개 API =====

  /**
   * 현재 온라인 상태 반환
   */
  public isOnline(): boolean {
    return this.isOnlineStatus;
  }

  /**
   * 현재 오프라인 상태 반환
   */
  public isOffline(): boolean {
    return !this.isOnlineStatus;
  }

  /**
   * 네트워크 상태 변화 리스너 등록
   */
  public onNetworkChange(listener: (isOnline: boolean) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 네트워크 상태 변화 리스너 제거
   */
  public removeNetworkChangeListener(
    listener: (isOnline: boolean) => void,
  ): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 수동으로 네트워크 상태 확인
   */
  public async checkConnection(): Promise<boolean> {
    return await this.checkNetworkConnectivity();
  }

  /**
   * 네트워크 상태 통계 반환
   */
  public getNetworkStats(): {
    isOnline: boolean;
    lastOnlineTime: Date;
    lastOfflineTime: Date | null;
    uptime: number; // 온라인 상태 지속 시간 (밀리초)
    downtime: number | null; // 오프라인 상태 지속 시간 (밀리초)
  } {
    const now = new Date();

    return {
      isOnline: this.isOnlineStatus,
      lastOnlineTime: this.lastOnlineTime,
      lastOfflineTime: this.lastOfflineTime,
      uptime: this.isOnlineStatus
        ? now.getTime() - this.lastOnlineTime.getTime()
        : 0,
      downtime:
        this.lastOfflineTime && !this.isOnlineStatus
          ? now.getTime() - this.lastOfflineTime.getTime()
          : null,
    };
  }

  /**
   * 모니터링 중지
   */
  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // 브라우저 이벤트 리스너 제거
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline.bind(this));
      window.removeEventListener("offline", this.handleOffline.bind(this));
    }

    // 모든 리스너 제거
    this.listeners = [];
  }

  /**
   * 모니터링 재시작
   */
  public restart(): void {
    this.stop();
    this.initializeNetworkMonitoring();
  }

  /**
   * 연결 품질 테스트 (지연시간 측정)
   */
  public async testConnectionQuality(): Promise<{
    latency: number; // 밀리초
    quality: "excellent" | "good" | "fair" | "poor" | "unavailable";
  }> {
    try {
      const startTime = performance.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

      const response = await fetch(process.env.SUPABASE_URL + "/rest/v1/", {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY!,
        },
      });

      clearTimeout(timeoutId);
      const endTime = performance.now();
      const latency = endTime - startTime;

      if (!response.ok) {
        return { latency: -1, quality: "unavailable" };
      }

      // 지연시간에 따른 품질 평가
      let quality: "excellent" | "good" | "fair" | "poor" | "unavailable";
      if (latency < 100) {
        quality = "excellent";
      } else if (latency < 300) {
        quality = "good";
      } else if (latency < 1000) {
        quality = "fair";
      } else {
        quality = "poor";
      }

      return { latency: Math.round(latency), quality };
    } catch (error) {
      return { latency: -1, quality: "unavailable" };
    }
  }

  /**
   * 네트워크 유형 감지 (가능한 경우)
   */
  public getConnectionType(): string {
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const connection = (navigator as any).connection;
      return connection?.effectiveType || connection?.type || "unknown";
    }
    return "unknown";
  }

  /**
   * 데이터 절약 모드 확인
   */
  public isDataSaverEnabled(): boolean {
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const connection = (navigator as any).connection;
      return connection?.saveData === true;
    }
    return false;
  }
}

/**
 * NetworkMonitor 싱글톤 인스턴스 내보내기
 */
export const networkMonitor = NetworkMonitor.getInstance();
