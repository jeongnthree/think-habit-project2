import { Journal } from "../types/journal";
import { errorHandlingService } from "./ErrorHandlingService";
import { errorReportingService } from "./ErrorReportingService";
import { MultiPlatformDatabaseService } from "./MultiPlatformDatabaseService";
import {
  PlatformAdapter,
  SyncConfig,
  SyncResult,
} from "./platforms/PlatformAdapter";
import { SyncQueueManager } from "./SyncQueueManager";

// 다중 플랫폼 일지 인터페이스
export interface MultiPlatformJournal extends Journal {
  platformStatus: Map<string, PlatformSyncStatus>;
  platformConfigs: Map<string, JournalPlatformConfig>;
}

// 플랫폼별 동기화 상태
export interface PlatformSyncStatus {
  platformId: string;
  status: "pending" | "syncing" | "synced" | "failed";
  lastAttempt?: Date;
  lastSuccess?: Date;
  error?: any;
  retryCount: number;
  platformJournalId?: string;
  platformUrl?: string;
}

// 일지별 플랫폼 설정
export interface JournalPlatformConfig extends SyncConfig {
  platformId: string;
  enabled: boolean;
}

// 다중 동기화 결과
export interface MultiSyncResult {
  journalId: string;
  results: Map<string, SyncResult>;
  overallSuccess: boolean;
  successCount: number;
  failureCount: number;
}

// 동기화 큐 아이템
interface SyncQueueItem {
  journalId: string;
  platformId: string;
  priority: "low" | "normal" | "high";
  retryCount: number;
  scheduledAt: Date;
}

export class MultiPlatformSyncService {
  private adapters: Map<string, PlatformAdapter> = new Map();
  private readonly maxConcurrentSyncs = 3;
  private queueManager?: SyncQueueManager;

  constructor() {
    this.initializeErrorHandling();
  }

  private initializeErrorHandling(): void {
    // 모든 어댑터에 오류 처리 서비스 설정
    for (const adapter of this.adapters.values()) {
      adapter.setErrorHandlingService(errorHandlingService);
      adapter.setErrorReportingService(errorReportingService);
    }
  }

  // 플랫폼 어댑터 등록
  async registerPlatform(adapter: PlatformAdapter): Promise<void> {
    this.adapters.set(adapter.id, adapter);
    console.log(`Platform registered: ${adapter.name} (${adapter.id})`);
  }

  // 플랫폼 어댑터 등록 해제
  async unregisterPlatform(platformId: string): Promise<void> {
    this.adapters.delete(platformId);
    console.log(`Platform unregistered: ${platformId}`);
  }

  // 등록된 플랫폼 목록 조회
  getRegisteredPlatforms(): PlatformAdapter[] {
    return Array.from(this.adapters.values());
  }

  // 특정 플랫폼 어댑터 조회
  getAdapter(platformId: string): PlatformAdapter | undefined {
    return this.adapters.get(platformId);
  }

  // 일지를 여러 플랫폼에 동기화
  async syncJournal(journal: MultiPlatformJournal): Promise<MultiSyncResult> {
    const results = new Map<string, SyncResult>();
    const enabledPlatforms = this.getEnabledPlatforms(journal);

    console.log(
      `Starting multi-platform sync for journal ${journal.id} to ${enabledPlatforms.length} platforms`,
    );

    // 병렬 동기화 실행 (최대 동시 실행 수 제한)
    const syncPromises = this.createSyncPromises(
      journal,
      enabledPlatforms,
      results,
    );

    // 모든 동기화 완료 대기 (실패해도 계속 진행)
    await Promise.allSettled(syncPromises);

    const successCount = Array.from(results.values()).filter(
      (r) => r.success,
    ).length;
    const failureCount = results.size - successCount;

    const multiSyncResult: MultiSyncResult = {
      journalId: journal.id,
      results,
      overallSuccess: failureCount === 0,
      successCount,
      failureCount,
    };

    console.log(
      `Multi-platform sync completed: ${successCount} success, ${failureCount} failed`,
    );

    return multiSyncResult;
  }

  // 실패한 동기화 재시도
  async retryFailedSync(
    journalId: string,
    platformIds?: string[],
  ): Promise<void> {
    const journal = await this.getJournal(journalId);
    if (!journal) {
      throw new Error(`Journal not found: ${journalId}`);
    }

    const failedPlatforms = platformIds || this.getFailedPlatforms(journal);

    if (!this.queueManager) {
      throw new Error("Queue manager not initialized");
    }

    for (const platformId of failedPlatforms) {
      await this.queueManager.addToQueue(journalId, platformId, "high");
    }
  }

  // 모든 미동기화 일지 동기화
  async syncAllPending(): Promise<void> {
    const pendingJournals = await this.getPendingJournals();

    for (const journal of pendingJournals) {
      const pendingPlatforms = this.getPendingPlatforms(journal);

      for (const platformId of pendingPlatforms) {
        await this.addToSyncQueue({
          journalId: journal.id,
          platformId,
          priority: "normal",
          retryCount: 0,
          scheduledAt: new Date(),
        });
      }
    }

    this.processQueue();
  }

  // 플랫폼 연결 상태 확인
  async validatePlatformConnections(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    const validationPromises = Array.from(this.adapters.entries()).map(
      async ([platformId, adapter]) => {
        try {
          const isValid = await adapter.validateConnection();
          results.set(platformId, isValid);
        } catch (error) {
          console.error(
            `Connection validation failed for ${platformId}:`,
            error,
          );
          results.set(platformId, false);
        }
      },
    );

    await Promise.allSettled(validationPromises);

    return results;
  }

  // 플랫폼별 템플릿 동기화
  async syncTemplates(): Promise<void> {
    const syncPromises = Array.from(this.adapters.values()).map(
      async (adapter) => {
        try {
          const templates = await adapter.getTemplates();
          await this.saveTemplates(adapter.id, templates);
          console.log(
            `Templates synced for ${adapter.name}: ${templates.length} templates`,
          );
        } catch (error) {
          console.error(`Failed to sync templates for ${adapter.name}:`, error);
        }
      },
    );

    await Promise.allSettled(syncPromises);
  }

  // 동기화 통계 조회
  getSyncStatistics(): {
    totalPlatforms: number;
    activePlatforms: number;
    queueSize: number;
    isProcessing: boolean;
  } {
    return {
      totalPlatforms: this.adapters.size,
      activePlatforms: Array.from(this.adapters.values()).filter(
        (a) => a.validateConnection,
      ).length,
      queueSize: this.syncQueue.length,
      isProcessing: this.isProcessingQueue,
    };
  }

  // Private methods

  private getEnabledPlatforms(journal: MultiPlatformJournal): string[] {
    return Array.from(journal.platformConfigs.entries())
      .filter(([_, config]) => config.enabled)
      .map(([platformId, _]) => platformId);
  }

  private createSyncPromises(
    journal: MultiPlatformJournal,
    platformIds: string[],
    results: Map<string, SyncResult>,
  ): Promise<void>[] {
    const semaphore = new Semaphore(this.maxConcurrentSyncs);

    return platformIds.map((platformId) =>
      semaphore.acquire().then(async (release) => {
        try {
          const result = await this.syncToPlatform(journal, platformId);
          results.set(platformId, result);
          this.updateSyncStatus(journal, platformId, result);
        } catch (error) {
          const errorResult: SyncResult = {
            success: false,
            error: {
              type: "PLATFORM_ERROR" as any,
              message: error instanceof Error ? error.message : "Unknown error",
              retryable: true,
            },
          };
          results.set(platformId, errorResult);
          this.updateSyncStatus(journal, platformId, errorResult);
        } finally {
          release();
        }
      }),
    );
  }

  private async syncToPlatform(
    journal: MultiPlatformJournal,
    platformId: string,
  ): Promise<SyncResult> {
    const adapter = this.adapters.get(platformId);
    if (!adapter) {
      throw new Error(`Platform adapter not found: ${platformId}`);
    }

    const config = journal.platformConfigs.get(platformId);
    if (!config) {
      throw new Error(`Platform config not found: ${platformId}`);
    }

    // 동기화 상태 업데이트
    this.updateSyncStatus(journal, platformId, null, "syncing");

    return await adapter.syncJournal(journal, config);
  }

  private updateSyncStatus(
    journal: MultiPlatformJournal,
    platformId: string,
    result: SyncResult | null,
    status?: "pending" | "syncing" | "synced" | "failed",
  ): void {
    const currentStatus = journal.platformStatus.get(platformId) || {
      platformId,
      status: "pending",
      retryCount: 0,
    };

    if (status) {
      currentStatus.status = status;
    }

    if (result) {
      currentStatus.lastAttempt = new Date();

      if (result.success) {
        currentStatus.status = "synced";
        currentStatus.lastSuccess = new Date();
        currentStatus.platformJournalId = result.platformJournalId;
        currentStatus.platformUrl = result.platformUrl;
        currentStatus.retryCount = 0;
      } else {
        currentStatus.status = "failed";
        currentStatus.error = result.error;
        currentStatus.retryCount++;
      }
    }

    journal.platformStatus.set(platformId, currentStatus);

    // 데이터베이스에 상태 저장
    this.saveSyncStatus(journal.id, platformId, currentStatus);
  }

  private getFailedPlatforms(journal: MultiPlatformJournal): string[] {
    return Array.from(journal.platformStatus.entries())
      .filter(([_, status]) => status.status === "failed")
      .map(([platformId, _]) => platformId);
  }

  private getPendingPlatforms(journal: MultiPlatformJournal): string[] {
    return Array.from(journal.platformStatus.entries())
      .filter(([_, status]) => status.status === "pending")
      .map(([platformId, _]) => platformId);
  }

  private async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    // 중복 제거
    const existingIndex = this.syncQueue.findIndex(
      (q) => q.journalId === item.journalId && q.platformId === item.platformId,
    );

    if (existingIndex >= 0) {
      this.syncQueue[existingIndex] = item;
    } else {
      this.syncQueue.push(item);
    }

    // 우선순위별 정렬
    this.syncQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.syncQueue.length > 0) {
        const item = this.syncQueue.shift()!;

        try {
          const journal = await this.getJournal(item.journalId);
          if (journal) {
            await this.syncToPlatform(journal, item.platformId);
          }
        } catch (error) {
          console.error(
            `Queue sync failed for ${item.journalId}:${item.platformId}:`,
            error,
          );

          // 재시도 로직
          if (item.retryCount < this.maxRetries) {
            const retryDelay = Math.pow(2, item.retryCount) * 1000; // 지수 백오프
            setTimeout(() => {
              this.addToSyncQueue({
                ...item,
                retryCount: item.retryCount + 1,
                scheduledAt: new Date(Date.now() + retryDelay),
              });
            }, retryDelay);
          }
        }

        // 큐 처리 간 잠시 대기
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // 데이터베이스 서비스 설정
  private dbService?: MultiPlatformDatabaseService;

  setDatabaseService(dbService: MultiPlatformDatabaseService): void {
    this.dbService = dbService;

    // SyncQueueManager 초기화
    if (!this.queueManager) {
      this.queueManager = new SyncQueueManager(dbService, this);
    }
  }

  getQueueManager(): SyncQueueManager | undefined {
    return this.queueManager;
  }

  // 데이터베이스 관련 메서드들
  private async getJournal(
    journalId: string,
  ): Promise<MultiPlatformJournal | null> {
    if (!this.dbService) return null;

    // 기본 일지 정보 조회 (실제 구현에서는 JournalService 사용)
    // const journal = await journalService.getJournal(journalId);
    // if (!journal) return null;

    // 플랫폼 상태 및 설정 조회
    const platformStatus = await this.dbService.getSyncStatus(journalId);
    const platformConfigs =
      await this.dbService.getJournalPlatformConfigs(journalId);

    // MultiPlatformJournal 객체 생성
    // return {
    //   ...journal,
    //   platformStatus,
    //   platformConfigs
    // };

    return null; // 임시로 null 반환
  }

  private async getPendingJournals(): Promise<MultiPlatformJournal[]> {
    if (!this.dbService) return [];

    // 실제 구현에서는 journal_platform_status에서 pending 상태인 일지들 조회
    return [];
  }

  private async saveSyncStatus(
    journalId: string,
    platformId: string,
    status: PlatformSyncStatus,
  ): Promise<void> {
    if (this.dbService) {
      await this.dbService.saveSyncStatus(journalId, platformId, status);
    }
  }

  private async saveTemplates(
    platformId: string,
    templates: any[],
  ): Promise<void> {
    if (this.dbService) {
      await this.dbService.saveTemplates(platformId, templates);
    }
  }
}

// 세마포어 클래스 (동시 실행 수 제한)
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve(() => this.release());
      } else {
        this.waitQueue.push(() => {
          this.permits--;
          resolve(() => this.release());
        });
      }
    });
  }

  private release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift()!;
      next();
    }
  }
}
