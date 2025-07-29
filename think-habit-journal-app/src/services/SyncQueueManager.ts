import {
  MultiPlatformDatabaseService,
  SyncQueueItem,
} from "./MultiPlatformDatabaseService";
import {
  MultiPlatformJournal,
  MultiPlatformSyncService,
} from "./MultiPlatformSyncService";

export interface QueueProcessingOptions {
  maxConcurrent: number;
  retryDelay: number;
  maxRetries: number;
  batchSize: number;
}

export interface QueueStatistics {
  totalItems: number;
  pendingItems: number;
  processingItems: number;
  failedItems: number;
  completedToday: number;
  averageProcessingTime: number;
}

export class SyncQueueManager {
  private dbService: MultiPlatformDatabaseService;
  private syncService: MultiPlatformSyncService;
  private isProcessing = false;
  private processingItems = new Set<string>();
  private options: QueueProcessingOptions;
  private processingStats = {
    totalProcessed: 0,
    totalProcessingTime: 0,
    completedToday: 0,
    lastResetDate: new Date().toDateString(),
  };

  constructor(
    dbService: MultiPlatformDatabaseService,
    syncService: MultiPlatformSyncService,
    options: Partial<QueueProcessingOptions> = {},
  ) {
    this.dbService = dbService;
    this.syncService = syncService;
    this.options = {
      maxConcurrent: options.maxConcurrent || 3,
      retryDelay: options.retryDelay || 1000,
      maxRetries: options.maxRetries || 3,
      batchSize: options.batchSize || 10,
    };

    // 주기적으로 큐 처리 (30초마다)
    setInterval(() => {
      this.processQueue();
    }, 30000);

    // 하루가 지나면 통계 리셋
    setInterval(() => {
      this.resetDailyStats();
    }, 60000); // 1분마다 체크
  }

  // 큐에 동기화 작업 추가
  async addToQueue(
    journalId: string,
    platformId: string,
    priority: "low" | "normal" | "high" = "normal",
    scheduledAt?: Date,
  ): Promise<string> {
    const queueItem: Omit<SyncQueueItem, "id" | "createdAt"> = {
      journalId,
      platformId,
      priority,
      retryCount: 0,
      maxRetries: this.options.maxRetries,
      scheduledAt: scheduledAt || new Date(),
      errorMessage: undefined,
    };

    const id = await this.dbService.addToSyncQueue(queueItem);
    console.log(
      `Added sync job to queue: ${journalId} -> ${platformId} (${id})`,
    );

    // 즉시 처리 시도 (우선순위가 높은 경우)
    if (priority === "high" && !this.isProcessing) {
      setTimeout(() => this.processQueue(), 100);
    }

    return id;
  }

  // 큐 처리 시작
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const availableSlots =
        this.options.maxConcurrent - this.processingItems.size;
      if (availableSlots <= 0) {
        return;
      }

      // 처리할 아이템들 조회
      const queueItems = await this.dbService.getSyncQueue(
        Math.min(availableSlots, this.options.batchSize),
      );

      if (queueItems.length === 0) {
        return;
      }

      console.log(`Processing ${queueItems.length} sync queue items`);

      // 병렬 처리
      const processingPromises = queueItems.map((item) =>
        this.processQueueItem(item),
      );
      await Promise.allSettled(processingPromises);
    } catch (error) {
      console.error("Error processing sync queue:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  // 개별 큐 아이템 처리
  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    const startTime = Date.now();
    this.processingItems.add(item.id);

    try {
      console.log(
        `Processing sync: ${item.journalId} -> ${item.platformId} (attempt ${item.retryCount + 1})`,
      );

      // 일지 조회 (실제 구현에서는 JournalService 사용)
      const journal = await this.getJournalForSync(
        item.journalId,
        item.platformId,
      );
      if (!journal) {
        console.warn(`Journal not found for sync: ${item.journalId}`);
        await this.dbService.removeSyncQueueItem(item.id);
        return;
      }

      // 플랫폼 어댑터 조회
      const adapter = this.syncService.getAdapter(item.platformId);
      if (!adapter) {
        console.warn(`Platform adapter not found: ${item.platformId}`);
        await this.dbService.removeSyncQueueItem(item.id);
        return;
      }

      // 동기화 실행
      const platformConfig = journal.platformConfigs.get(item.platformId);
      if (!platformConfig) {
        console.warn(
          `Platform config not found: ${item.journalId} -> ${item.platformId}`,
        );
        await this.dbService.removeSyncQueueItem(item.id);
        return;
      }

      const result = await adapter.syncJournal(journal, platformConfig);

      if (result.success) {
        // 성공 시 큐에서 제거
        await this.dbService.removeSyncQueueItem(item.id);

        // 통계 업데이트
        this.updateProcessingStats(Date.now() - startTime, true);

        console.log(
          `Sync completed successfully: ${item.journalId} -> ${item.platformId}`,
        );
      } else {
        // 실패 시 재시도 처리
        await this.handleSyncFailure(
          item,
          result.error?.message || "Unknown error",
        );
      }
    } catch (error) {
      console.error(
        `Sync processing error: ${item.journalId} -> ${item.platformId}:`,
        error,
      );
      await this.handleSyncFailure(
        item,
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      this.processingItems.delete(item.id);
    }
  }

  // 동기화 실패 처리
  private async handleSyncFailure(
    item: SyncQueueItem,
    errorMessage: string,
  ): Promise<void> {
    const newRetryCount = item.retryCount + 1;

    if (newRetryCount >= item.maxRetries) {
      // 최대 재시도 횟수 초과 시 큐에서 제거
      console.error(
        `Max retries exceeded for sync: ${item.journalId} -> ${item.platformId}`,
      );
      await this.dbService.removeSyncQueueItem(item.id);
      return;
    }

    // 지수 백오프로 재시도 시간 계산
    const retryDelay = this.options.retryDelay * Math.pow(2, newRetryCount - 1);
    const nextScheduledAt = new Date(Date.now() + retryDelay);

    // 큐 아이템 업데이트
    await this.dbService.updateSyncQueueItem(item.id, {
      retryCount: newRetryCount,
      lastAttempt: new Date(),
      errorMessage,
      scheduledAt: nextScheduledAt,
    });

    console.log(
      `Scheduled retry for sync: ${item.journalId} -> ${item.platformId} (attempt ${newRetryCount + 1} at ${nextScheduledAt.toISOString()})`,
    );
  }

  // 일지 조회 (동기화용)
  private async getJournalForSync(
    journalId: string,
    platformId: string,
  ): Promise<MultiPlatformJournal | null> {
    // 실제 구현에서는 JournalService와 연동
    // 여기서는 데이터베이스에서 플랫폼 설정과 상태를 조회하여 MultiPlatformJournal 생성

    try {
      const platformStatus = await this.dbService.getSyncStatus(
        journalId,
        platformId,
      );
      const platformConfigs =
        await this.dbService.getJournalPlatformConfigs(journalId);

      // 기본 일지 정보는 별도 서비스에서 조회해야 함
      // 임시로 null 반환
      return null;
    } catch (error) {
      console.error(`Failed to get journal for sync: ${journalId}`, error);
      return null;
    }
  }

  // 큐 통계 조회
  async getQueueStatistics(): Promise<QueueStatistics> {
    const queueItems = await this.dbService.getSyncQueue();

    const totalItems = queueItems.length;
    const pendingItems = queueItems.filter(
      (item) =>
        item.scheduledAt <= new Date() && item.retryCount < item.maxRetries,
    ).length;
    const processingItems = this.processingItems.size;
    const failedItems = queueItems.filter(
      (item) => item.retryCount >= item.maxRetries,
    ).length;

    return {
      totalItems,
      pendingItems,
      processingItems,
      failedItems,
      completedToday: this.processingStats.completedToday,
      averageProcessingTime:
        this.processingStats.totalProcessed > 0
          ? this.processingStats.totalProcessingTime /
            this.processingStats.totalProcessed
          : 0,
    };
  }

  // 특정 일지의 큐 상태 조회
  async getJournalQueueStatus(journalId: string): Promise<
    {
      platformId: string;
      status: "queued" | "processing" | "failed";
      retryCount: number;
      scheduledAt: Date;
      errorMessage?: string;
    }[]
  > {
    const allQueueItems = await this.dbService.getSyncQueue();
    const journalItems = allQueueItems.filter(
      (item) => item.journalId === journalId,
    );

    return journalItems.map((item) => ({
      platformId: item.platformId,
      status: this.processingItems.has(item.id)
        ? "processing"
        : item.retryCount >= item.maxRetries
          ? "failed"
          : "queued",
      retryCount: item.retryCount,
      scheduledAt: item.scheduledAt,
      errorMessage: item.errorMessage,
    }));
  }

  // 큐 정리 (오래된 실패 항목 제거)
  async cleanupQueue(olderThanDays: number = 7): Promise<number> {
    await this.dbService.cleanupOldSyncQueue(olderThanDays);

    // 정리된 항목 수 반환 (실제로는 DB에서 반환해야 함)
    return 0;
  }

  // 큐 일시 정지/재개
  pauseQueue(): void {
    this.isProcessing = true;
    console.log("Sync queue paused");
  }

  resumeQueue(): void {
    this.isProcessing = false;
    console.log("Sync queue resumed");

    // 즉시 처리 시작
    setTimeout(() => this.processQueue(), 100);
  }

  // 특정 플랫폼의 큐 항목들 제거
  async clearPlatformQueue(platformId: string): Promise<void> {
    const queueItems = await this.dbService.getSyncQueue();
    const platformItems = queueItems.filter(
      (item) => item.platformId === platformId,
    );

    for (const item of platformItems) {
      await this.dbService.removeSyncQueueItem(item.id);
    }

    console.log(
      `Cleared ${platformItems.length} queue items for platform ${platformId}`,
    );
  }

  // 처리 통계 업데이트
  private updateProcessingStats(
    processingTime: number,
    success: boolean,
  ): void {
    this.processingStats.totalProcessed++;
    this.processingStats.totalProcessingTime += processingTime;

    if (success) {
      this.processingStats.completedToday++;
    }
  }

  // 일일 통계 리셋
  private resetDailyStats(): void {
    const today = new Date().toDateString();
    if (this.processingStats.lastResetDate !== today) {
      this.processingStats.completedToday = 0;
      this.processingStats.lastResetDate = today;
    }
  }

  // 큐 상태 조회
  isQueueProcessing(): boolean {
    return this.isProcessing;
  }

  getProcessingCount(): number {
    return this.processingItems.size;
  }

  // 우선순위 큐 처리 (긴급한 동기화)
  async processHighPriorityQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    const highPriorityItems = await this.dbService.getSyncQueue(
      this.options.maxConcurrent,
    );
    const urgentItems = highPriorityItems.filter(
      (item) => item.priority === "high",
    );

    if (urgentItems.length > 0) {
      console.log(`Processing ${urgentItems.length} high priority sync items`);

      const processingPromises = urgentItems.map((item) =>
        this.processQueueItem(item),
      );
      await Promise.allSettled(processingPromises);
    }
  }
}
