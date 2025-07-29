interface Journal {
  id: string;
  title: string;
  content: string;
  category_id: string;
  category_name: string;
  created_at: string;
  updated_at: string;
  is_public: number;
  user_id: string;
  user_name: string;
  synced_to_website?: number;
  last_synced_at?: string;
  image_urls?: string[]; // 이미지 URL 배열 추가
  image_count?: number; // 이미지 개수 추가
}

export interface JournalSyncData {
  id: string;
  title: string;
  content: string;
  category_id: string;
  category_name: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  user_id: string;
  user_name: string;
  app_version: string;
  sync_source: "desktop_app" | "mobile_app" | "web";
  image_urls?: string[]; // Supabase Storage 이미지 URL 배열
  image_count?: number; // 이미지 개수
}

export interface SyncResult {
  journal_id: string;
  success: boolean;
  action?: "created" | "updated";
  error?: string;
}

export interface SyncResponse {
  success: boolean;
  message?: string;
  results?: SyncResult[];
  summary?: {
    total: number;
    success: number;
    failed: number;
  };
  error?: string;
}

export class WebsiteSyncService {
  private static instance: WebsiteSyncService;
  private websiteUrl: string;
  private syncInProgress: boolean = false;
  private autoSyncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // 브라우저 환경에서 process 객체 안전하게 처리
    try {
      this.websiteUrl =
        (typeof process !== "undefined" && process.env?.WEBSITE_URL) ||
        "http://localhost:3000";
    } catch (error) {
      this.websiteUrl = "http://localhost:3000";
    }
  }

  public static getInstance(): WebsiteSyncService {
    if (!WebsiteSyncService.instance) {
      WebsiteSyncService.instance = new WebsiteSyncService();
    }
    return WebsiteSyncService.instance;
  }

  /**
   * 웹사이트로 일지 동기화
   */
  public async syncJournalsToWebsite(): Promise<SyncResponse> {
    console.log("🚀 syncJournalsToWebsite 메서드 시작");

    if (this.syncInProgress) {
      console.log("⏸️ 이미 동기화 진행 중");
      return {
        success: false,
        error: "Sync already in progress",
      };
    }

    try {
      this.syncInProgress = true;
      console.log("🔒 동기화 진행 상태로 설정");

      // 1. 사용자 인증 확인 (Mock)
      console.log("👤 사용자 인증 확인 중...");
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        console.log("❌ 사용자 인증 실패");
        return {
          success: false,
          error: "User not authenticated",
        };
      }
      console.log("✅ 사용자 인증 성공:", currentUser);

      // 2. 동기화할 일지 가져오기 (공개 일지만)
      console.log("📚 동기화할 일지 가져오는 중...");
      const journals = await this.getJournalsForSync();
      console.log("📊 동기화할 일지 개수:", journals.length);

      if (journals.length === 0) {
        console.log("📭 동기화할 일지가 없음");
        return {
          success: true,
          message: "No journals to sync",
          summary: { total: 0, success: 0, failed: 0 },
        };
      }

      // 3. 웹사이트 API로 동기화 요청
      console.log("🔑 인증 토큰 가져오는 중...");
      const authToken = await this.getAuthToken();
      console.log("🔑 인증 토큰:", authToken ? "있음" : "없음");

      const syncData = {
        journals: journals,
        user_token: authToken || currentUser.id,
      };

      console.log("📤 API 요청 데이터:", {
        journalCount: journals.length,
        userToken: syncData.user_token,
        websiteUrl: this.websiteUrl,
      });

      console.log(
        "🌐 웹사이트 API 호출 중:",
        `${this.websiteUrl}/api/journals/sync`,
      );
      const response = await fetch(`${this.websiteUrl}/api/journals/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Think-Habit-Journal-App/1.0.0",
        },
        body: JSON.stringify(syncData),
      });

      console.log("📡 API 응답 상태:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("❌ API 응답 에러 내용:", errorText);
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
        );
      }

      const result: SyncResponse = await response.json();

      console.log("📥 동기화 API 응답:", JSON.stringify(result, null, 2));

      // 4. 동기화 성공한 일지들의 상태 업데이트
      if (result.success && result.results) {
        console.log("✅ 동기화 성공, 상태 업데이트 중...");
        await this.updateSyncStatus(result.results);
      } else {
        console.error("❌ 동기화 실패:", result.error);
      }

      return result;
    } catch (error) {
      console.log("💥 동기화 중 예외 발생:", error);
      console.error("Website sync error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      console.log("🔓 동기화 진행 상태 해제");
      this.syncInProgress = false;
    }
  }

  /**
   * 현재 사용자 정보 가져오기
   */
  private async getCurrentUser(): Promise<any | null> {
    // Mock 사용자 정보 (실제 구현에서는 authService 사용)
    // 메인 웹사이트에서 사용하는 실제 사용자 ID 사용
    return {
      id: "8236e966-ba4c-46d8-9cda-19bc67ec305d",
      name: "테스트 사용자",
      email: "test@think-habit.com",
    };
  }

  /**
   * 유효한 인증 토큰 가져오기
   */
  private async getAuthToken(): Promise<string | null> {
    // Mock 토큰 (실제 구현에서는 authService 사용)
    // 메인 웹사이트에서 사용하는 실제 사용자 ID 사용
    return "8236e966-ba4c-46d8-9cda-19bc67ec305d";
  }

  /**
   * 동기화할 일지 데이터 준비
   */
  private async getJournalsForSync(): Promise<JournalSyncData[]> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) return [];

      // 공개 일지 중 아직 동기화되지 않았거나 업데이트된 일지들 가져오기
      const lastSyncTime = await this.getLastSyncTime();

      const journals = await this.getJournalsFromDatabase(
        currentUser.id,
        lastSyncTime,
      );

      return journals.map((journal: Journal) => ({
        id: journal.id,
        title: journal.title,
        content: journal.content,
        category_id: journal.category_id,
        category_name: journal.category_name || "기타",
        created_at: journal.created_at,
        updated_at: journal.updated_at,
        is_public: Boolean(journal.is_public),
        user_id: currentUser.id,
        user_name: journal.user_name || currentUser.name || "사용자",
        app_version: "1.0.0",
        sync_source: "desktop_app" as const,
        image_urls: journal.image_urls || [], // 이미지 URL들 포함
        image_count:
          journal.image_count ||
          (journal.image_urls ? journal.image_urls.length : 0), // 이미지 개수 포함
      }));
    } catch (error) {
      console.error("Error getting journals for sync:", error);
      return [];
    }
  }

  /**
   * 데이터베이스에서 동기화할 일지들 가져오기
   */
  private async getJournalsFromDatabase(
    userId: string,
    lastSyncTime: string,
  ): Promise<Journal[]> {
    try {
      // SQLite 쿼리 실행 (실제 구현에서는 better-sqlite3 사용)
      const query = `
        SELECT j.*, c.name as category_name
        FROM journals j
        LEFT JOIN categories c ON j.category_id = c.id
        WHERE j.user_id = ? 
          AND j.is_public = 1
          AND (j.synced_to_website = 0 OR j.updated_at > ?)
        ORDER BY j.updated_at DESC
      `;

      // localStorage에서 저장된 일지들 가져오기 (안전한 접근)
      let storedJournals = [];
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          storedJournals = JSON.parse(localStorage.getItem("journals") || "[]");
        } else {
          console.warn("localStorage not available in this environment");
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error);
        storedJournals = [];
      }

      // 아직 동기화되지 않은 일지들만 필터링
      console.log("📊 저장된 일지 총 개수:", storedJournals.length);
      console.log(
        "📊 저장된 일지 목록:",
        storedJournals.map((j) => ({
          id: j.id,
          title: j.title,
          is_public: j.is_public,
          synced_to_website: j.synced_to_website,
        })),
      );

      const unsyncedJournals = storedJournals.filter(
        (journal: any) => !journal.synced_to_website && journal.is_public,
      );

      console.log("🔄 동기화할 일지 개수:", unsyncedJournals.length);
      console.log(
        "🔄 동기화할 일지:",
        unsyncedJournals.map((j) => ({
          id: j.id,
          title: j.title,
          is_public: j.is_public,
        })),
      );

      // Mock 데이터와 실제 저장된 일지 합치기
      const mockJournals: Journal[] = [
        ...unsyncedJournals.map((journal: any) => ({
          id: journal.id,
          title: journal.title,
          content: journal.content,
          category_id: journal.category_id,
          category_name: journal.category_name,
          created_at: journal.created_at,
          updated_at: journal.updated_at,
          is_public: journal.is_public ? 1 : 0,
          user_id: journal.user_id,
          user_name: journal.user_name,
          synced_to_website: 0,
          image_urls: journal.image_urls || [], // 이미지 URL 배열
          image_count:
            journal.image_count ||
            (journal.image_urls ? journal.image_urls.length : 0), // 이미지 개수
        })),
        // 기본 테스트 일지 (필요시)
        {
          id: `journal-${Date.now()}-demo`,
          title: "데모 완벽주의 극복 훈련",
          content:
            '오늘은 완벽주의 성향을 극복하는 훈련을 했습니다. 실수를 받아들이고 "충분히 좋다"는 기준을 설정하는 연습을 진행했습니다.',
          category_id: "cat-1",
          category_name: "완벽주의 극복",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_public: 1,
          user_id: userId,
          user_name: "사용자",
          synced_to_website: 0,
        },
      ];

      return mockJournals;
    } catch (error) {
      console.error("Database query error:", error);
      return [];
    }
  }

  /**
   * 동기화 상태 업데이트
   */
  private async updateSyncStatus(results: SyncResult[]): Promise<void> {
    try {
      const successfulSyncs = results.filter((r) => r.success);

      if (successfulSyncs.length === 0) return;

      // 성공한 일지들의 동기화 상태 업데이트
      for (const result of successfulSyncs) {
        await this.updateJournalSyncStatus(result.journal_id);
      }

      // 마지막 동기화 시간 업데이트
      await this.updateLastSyncTime();

      console.log(`Updated sync status for ${successfulSyncs.length} journals`);
    } catch (error) {
      console.error("Error updating sync status:", error);
    }
  }

  /**
   * 개별 일지의 동기화 상태 업데이트
   */
  private async updateJournalSyncStatus(journalId: string): Promise<void> {
    try {
      console.log(`Marking journal ${journalId} as synced to website`);

      // localStorage에서 일지 동기화 상태 업데이트 (안전한 접근)
      let storedJournals = [];
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          storedJournals = JSON.parse(localStorage.getItem("journals") || "[]");
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error);
        return;
      }
      const updatedJournals = storedJournals.map((journal: any) => {
        if (journal.id === journalId) {
          return {
            ...journal,
            synced_to_website: true,
            last_synced_at: new Date().toISOString(),
          };
        }
        return journal;
      });

      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("journals", JSON.stringify(updatedJournals));
        console.log(`✅ Journal ${journalId} marked as synced`);
      }
    } catch (error) {
      console.error(
        `Error updating sync status for journal ${journalId}:`,
        error,
      );
    }
  }

  /**
   * 마지막 동기화 시간 가져오기
   */
  private async getLastSyncTime(): Promise<string> {
    try {
      // localStorage에서 마지막 동기화 시간 가져오기
      const lastSync = localStorage.getItem("last_website_sync");
      return lastSync || "1970-01-01T00:00:00.000Z";
    } catch (error) {
      console.error("Error getting last sync time:", error);
      return "1970-01-01T00:00:00.000Z";
    }
  }

  /**
   * 마지막 동기화 시간 업데이트
   */
  private async updateLastSyncTime(): Promise<void> {
    try {
      const now = new Date().toISOString();
      localStorage.setItem("last_website_sync", now);
      console.log(`Updated last sync time: ${now}`);
    } catch (error) {
      console.error("Error updating last sync time:", error);
    }
  }

  /**
   * 자동 동기화 설정
   */
  public async enableAutoSync(intervalMinutes: number = 30): Promise<void> {
    // 기존 인터벌 클리어
    this.disableAutoSync();

    // 새 인터벌 설정
    const intervalMs = intervalMinutes * 60 * 1000;

    this.autoSyncInterval = setInterval(async () => {
      try {
        console.log("Auto-syncing journals to website...");
        const result = await this.syncJournalsToWebsite();

        if (result.success) {
          console.log("Auto-sync completed:", result.summary);

          // 성공 알림 (선택적)
          if (result.summary && result.summary.success > 0) {
            console.log(
              `동기화 완료: ${result.summary.success}개의 일지가 웹사이트에 동기화되었습니다.`,
            );
          }
        } else {
          console.error("Auto-sync failed:", result.error);
        }
      } catch (error) {
        console.error("Auto-sync error:", error);
      }
    }, intervalMs);

    // 자동 동기화 설정 저장
    localStorage.setItem("auto_sync_enabled", "true");
    localStorage.setItem("auto_sync_interval", intervalMinutes.toString());

    console.log(`Auto-sync enabled: every ${intervalMinutes} minutes`);
  }

  /**
   * 자동 동기화 비활성화
   */
  public async disableAutoSync(): Promise<void> {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }

    // 자동 동기화 설정 저장
    localStorage.setItem("auto_sync_enabled", "false");

    console.log("Auto-sync disabled");
  }

  /**
   * 자동 동기화 상태 확인
   */
  public async isAutoSyncEnabled(): Promise<boolean> {
    try {
      return localStorage.getItem("auto_sync_enabled") === "true";
    } catch (error) {
      console.error("Error checking auto-sync status:", error);
      return false;
    }
  }

  /**
   * 동기화 상태 확인
   */
  public async checkSyncStatus(): Promise<{
    needsSync: boolean;
    pendingCount: number;
    lastSyncTime: string;
    isAutoSyncEnabled: boolean;
  }> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return {
          needsSync: false,
          pendingCount: 0,
          lastSyncTime: "Never",
          isAutoSyncEnabled: false,
        };
      }

      const lastSyncTime = await this.getLastSyncTime();
      const journals = await this.getJournalsFromDatabase(
        currentUser.id,
        lastSyncTime,
      );
      const isAutoSyncEnabled = await this.isAutoSyncEnabled();

      return {
        needsSync: journals.length > 0,
        pendingCount: journals.length,
        lastSyncTime:
          lastSyncTime === "1970-01-01T00:00:00.000Z" ? "Never" : lastSyncTime,
        isAutoSyncEnabled,
      };
    } catch (error) {
      console.error("Error checking sync status:", error);
      return {
        needsSync: false,
        pendingCount: 0,
        lastSyncTime: "Error",
        isAutoSyncEnabled: false,
      };
    }
  }

  /**
   * 동기화 진행 상태 확인
   */
  public isSyncInProgress(): boolean {
    return this.syncInProgress;
  }
}
