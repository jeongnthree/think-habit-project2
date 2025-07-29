// lib/journal-sync.ts
// Think-Habit Journal App - Supabase 동기화 서비스

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import {
  BatchSyncResult,
  Journal,
  SyncError,
  SyncProgress,
  SyncResult,
  User,
} from "../shared/types";
import { SYNC_QUERIES } from "./database/queries";
import { journalService } from "./journal-service";
import { networkMonitor } from "./network-monitor";

/**
 * Supabase 동기화 서비스 클래스
 */
export class JournalSyncService {
  private static instance: JournalSyncService;
  private supabase: SupabaseClient;
  private syncQueue: Journal[] = [];
  private isAutoSyncEnabled = true;
  private syncInProgress = false;
  private retryQueue: Array<{
    journal: Journal;
    retryCount: number;
    lastError?: string;
  }> = [];
  private maxRetries = 3;
  private currentUser: User | null = null;

  // 동기화 진행 상황 콜백
  private progressCallbacks: Array<(progress: SyncProgress) => void> = [];

  private constructor() {
    // Supabase 클라이언트 초기화 (환경변수에서 설정 가져오기)
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );

    // 네트워크 상태 변화 감지
    networkMonitor.onNetworkChange((isOnline) => {
      if (isOnline && this.isAutoSyncEnabled) {
        this.startAutoSync();
      }
    });

    // 주기적 동기화 (30분마다)
    setInterval(
      () => {
        if (networkMonitor.isOnline() && this.isAutoSyncEnabled) {
          this.startAutoSync();
        }
      },
      30 * 60 * 1000,
    );
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): JournalSyncService {
    if (!JournalSyncService.instance) {
      JournalSyncService.instance = new JournalSyncService();
    }
    return JournalSyncService.instance;
  }

  /**
   * 현재 사용자 설정
   */
  public setCurrentUser(user: User): void {
    this.currentUser = user;
  }

  // ===== 개별 동기화 메서드들 =====

  /**
   * 개별 일지를 서버로 동기화
   */
  public async syncToServer(journal: Journal): Promise<SyncResult> {
    if (!this.currentUser) {
      return {
        success: false,
        journalId: journal.id,
        error: "인증된 사용자가 없습니다",
      };
    }

    if (!networkMonitor.isOnline()) {
      // 오프라인 상태면 큐에 추가
      this.addToSyncQueue(journal);
      return {
        success: true,
        journalId: journal.id,
        syncedAt: new Date(),
      };
    }

    try {
      const syncResult = await this.uploadJournalToSupabase(journal);

      if (syncResult.success) {
        // 로컬 동기화 상태 업데이트
        await this.updateLocalSyncStatus(
          journal.id,
          "synced",
          syncResult.serverId,
        );

        // 동기화 로그 기록
        await this.logSyncResult(journal.id, "upload", "success");
      } else {
        // 실패 시 재시도 큐에 추가
        this.addToRetryQueue(journal, syncResult.error);
        await this.logSyncResult(
          journal.id,
          "upload",
          "failed",
          syncResult.error,
        );
      }

      return syncResult;
    } catch (error) {
      console.error("동기화 중 오류:", error);
      this.addToRetryQueue(journal, error.message);
      await this.logSyncResult(journal.id, "upload", "failed", error.message);

      return {
        success: false,
        journalId: journal.id,
        error: error.message,
      };
    }
  }

  /**
   * 서버에서 사용자의 모든 일지 동기화
   */
  public async syncFromServer(userId: string): Promise<Journal[]> {
    if (!networkMonitor.isOnline()) {
      throw new Error("네트워크 연결이 필요합니다");
    }

    try {
      // Supabase에서 사용자 일지 조회
      const { data: remoteJournals, error } = await this.supabase
        .from("journals")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        throw new Error(`서버 데이터 조회 실패: ${error.message}`);
      }

      const syncedJournals: Journal[] = [];

      for (const remoteJournal of remoteJournals || []) {
        try {
          const localJournal = journalService.getJournal(
            remoteJournal.id,
            userId,
          );

          if (!localJournal) {
            // 로컬에 없으면 새로 생성
            const newJournal =
              await this.createLocalJournalFromRemote(remoteJournal);
            syncedJournals.push(newJournal);
          } else {
            // 충돌 해결
            const resolvedJournal = await this.handleSyncConflict(
              localJournal,
              remoteJournal,
            );
            syncedJournals.push(resolvedJournal);
          }

          await this.logSyncResult(remoteJournal.id, "download", "success");
        } catch (error) {
          console.error(`일지 ${remoteJournal.id} 동기화 실패:`, error);
          await this.logSyncResult(
            remoteJournal.id,
            "download",
            "failed",
            error.message,
          );
        }
      }

      return syncedJournals;
    } catch (error) {
      console.error("서버 동기화 실패:", error);
      throw error;
    }
  }

  /**
   * 동기화되지 않은 일지 목록 조회
   */
  public getUnsyncedJournals(): Journal[] {
    if (!this.currentUser) return [];

    return journalService.getUnsyncedJournals(this.currentUser.id);
  }

  // ===== 자동 동기화 시스템 =====

  /**
   * 자동 동기화 시작
   */
  public async startAutoSync(): Promise<BatchSyncResult> {
    if (this.syncInProgress || !this.currentUser) {
      return this.createEmptyBatchResult();
    }

    this.syncInProgress = true;
    const startTime = new Date();

    try {
      // 진행 상황 초기화
      this.notifyProgress({
        current: 0,
        total: 0,
        stage: "preparing",
      });

      // 1. 로컬에서 서버로 업로드
      const uploadResult = await this.uploadUnsyncedJournals();

      // 2. 서버에서 로컬로 다운로드
      const downloadResult = await this.downloadRemoteChanges();

      // 3. 재시도 큐 처리
      const retryResult = await this.processRetryQueue();

      // 진행 상황 완료 알림
      this.notifyProgress({
        current: uploadResult.syncedJournals + downloadResult.length,
        total: uploadResult.totalJournals + downloadResult.length,
        stage: "completed",
      });

      const batchResult: BatchSyncResult = {
        success: true,
        totalJournals: uploadResult.totalJournals + downloadResult.length,
        syncedJournals: uploadResult.syncedJournals + downloadResult.length,
        failedJournals: uploadResult.failedJournals,
        conflicts: uploadResult.conflicts,
        errors: [...uploadResult.errors, ...retryResult.errors],
        startedAt: startTime,
        completedAt: new Date(),
      };

      return batchResult;
    } catch (error) {
      console.error("자동 동기화 실패:", error);
      return {
        success: false,
        totalJournals: 0,
        syncedJournals: 0,
        failedJournals: 0,
        conflicts: 0,
        errors: [
          {
            code: "SYNC_ERROR",
            message: error.message,
            retryable: true,
            timestamp: new Date(),
          },
        ],
        startedAt: startTime,
        completedAt: new Date(),
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * 동기화되지 않은 일지들을 서버로 업로드
   */
  private async uploadUnsyncedJournals(): Promise<{
    totalJournals: number;
    syncedJournals: number;
    failedJournals: number;
    conflicts: number;
    errors: SyncError[];
  }> {
    const unsyncedJournals = this.getUnsyncedJournals();
    const errors: SyncError[] = [];
    let syncedCount = 0;
    let failedCount = 0;
    let conflictCount = 0;

    this.notifyProgress({
      current: 0,
      total: unsyncedJournals.length,
      stage: "uploading",
    });

    for (let i = 0; i < unsyncedJournals.length; i++) {
      const journal = unsyncedJournals[i];

      this.notifyProgress({
        current: i + 1,
        total: unsyncedJournals.length,
        stage: "uploading",
        currentJournal: journal.title,
      });

      try {
        const result = await this.syncToServer(journal);

        if (result.success) {
          syncedCount++;
          if (result.conflictResolution) {
            conflictCount++;
          }
        } else {
          failedCount++;
          errors.push({
            code: "SYNC_ERROR",
            message: result.error || "알 수 없는 오류",
            retryable: true,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        failedCount++;
        errors.push({
          code: "SYNC_ERROR",
          message: error.message,
          retryable: true,
          timestamp: new Date(),
        });
      }
    }

    return {
      totalJournals: unsyncedJournals.length,
      syncedJournals: syncedCount,
      failedJournals: failedCount,
      conflicts: conflictCount,
      errors,
    };
  }

  /**
   * 서버의 변경사항을 로컬로 다운로드
   */
  private async downloadRemoteChanges(): Promise<Journal[]> {
    if (!this.currentUser) return [];

    this.notifyProgress({
      current: 0,
      total: 1,
      stage: "downloading",
    });

    const syncedJournals = await this.syncFromServer(this.currentUser.id);

    this.notifyProgress({
      current: 1,
      total: 1,
      stage: "downloading",
    });

    return syncedJournals;
  }

  // ===== 충돌 해결 =====

  /**
   * 로컬과 원격 일지 간의 충돌 해결
   */
  private async handleSyncConflict(
    localJournal: Journal,
    remoteData: any,
  ): Promise<Journal> {
    const remoteUpdatedAt = new Date(remoteData.updated_at);
    const localUpdatedAt = localJournal.updatedAt;

    // 최신 타임스탬프 기준으로 우선순위 결정
    if (remoteUpdatedAt > localUpdatedAt) {
      // 원격이 더 최신이면 로컬 업데이트
      return await this.updateLocalJournalFromRemote(
        localJournal.id,
        remoteData,
      );
    } else if (localUpdatedAt > remoteUpdatedAt) {
      // 로컬이 더 최신이면 서버 업데이트
      const syncResult = await this.uploadJournalToSupabase(localJournal);
      if (syncResult.success) {
        await this.updateLocalSyncStatus(
          localJournal.id,
          "synced",
          syncResult.serverId,
        );
      }
      return localJournal;
    } else {
      // 같은 시간이면 버전 비교
      if (remoteData.server_version > (localJournal.serverVersion || 0)) {
        return await this.updateLocalJournalFromRemote(
          localJournal.id,
          remoteData,
        );
      } else {
        const syncResult = await this.uploadJournalToSupabase(localJournal);
        if (syncResult.success) {
          await this.updateLocalSyncStatus(
            localJournal.id,
            "synced",
            syncResult.serverId,
          );
        }
        return localJournal;
      }
    }
  }

  // ===== Supabase 연동 메서드들 =====

  /**
   * 일지를 Supabase에 업로드
   */
  private async uploadJournalToSupabase(
    journal: Journal,
  ): Promise<SyncResult & { serverId?: string }> {
    try {
      const uploadData = {
        id: journal.serverId || uuidv4(),
        user_id: journal.userId,
        type: journal.type,
        title: journal.title,
        content: journal.content,
        tags: journal.tags,
        is_favorite: journal.isFavorite,
        is_archived: journal.isArchived,
        local_version: journal.localVersion,
        created_at: journal.createdAt.toISOString(),
        updated_at: journal.updatedAt.toISOString(),
      };

      const { data, error } = await this.supabase
        .from("journals")
        .upsert(uploadData, { onConflict: "id" })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        journalId: journal.id,
        serverId: data.id,
        syncedAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        journalId: journal.id,
        error: error.message,
      };
    }
  }

  /**
   * 원격 데이터로부터 로컬 일지 생성
   */
  private async createLocalJournalFromRemote(
    remoteData: any,
  ): Promise<Journal> {
    const journal: Journal = {
      id: remoteData.local_id || uuidv4(),
      userId: remoteData.user_id,
      type: remoteData.type,
      title: remoteData.title,
      content: remoteData.content,
      syncStatus: "synced",
      serverId: remoteData.id,
      serverVersion: remoteData.server_version,
      localVersion: remoteData.local_version,
      tags: remoteData.tags,
      isFavorite: remoteData.is_favorite,
      isArchived: remoteData.is_archived,
      createdAt: new Date(remoteData.created_at),
      updatedAt: new Date(remoteData.updated_at),
      syncedAt: new Date(),
    };

    // 로컬 데이터베이스에 직접 삽입 (검증 생략)
    const db = journalService["db"];
    const stmt = db.prepare(`
      INSERT INTO journals (
        id, user_id, type, title, content, sync_status, server_id,
        server_version, local_version, tags, is_favorite, is_archived,
        created_at, updated_at, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      journal.id,
      journal.userId,
      journal.type,
      journal.title,
      JSON.stringify(journal.content),
      journal.syncStatus,
      journal.serverId,
      journal.serverVersion,
      journal.localVersion,
      JSON.stringify(journal.tags),
      journal.isFavorite ? 1 : 0,
      journal.isArchived ? 1 : 0,
      journal.createdAt.toISOString(),
      journal.updatedAt.toISOString(),
      journal.syncedAt?.toISOString(),
    );

    return journal;
  }

  /**
   * 원격 데이터로 로컬 일지 업데이트
   */
  private async updateLocalJournalFromRemote(
    journalId: string,
    remoteData: any,
  ): Promise<Journal> {
    const db = journalService["db"];
    const stmt = db.prepare(`
      UPDATE journals SET
        title = ?, content = ?, tags = ?, is_favorite = ?, is_archived = ?,
        server_version = ?, sync_status = 'synced', synced_at = ?
      WHERE id = ?
    `);

    stmt.run(
      remoteData.title,
      JSON.stringify(remoteData.content),
      JSON.stringify(remoteData.tags),
      remoteData.is_favorite ? 1 : 0,
      remoteData.is_archived ? 1 : 0,
      remoteData.server_version,
      new Date().toISOString(),
      journalId,
    );

    return journalService.getJournal(journalId, remoteData.user_id)!;
  }

  // ===== 유틸리티 메서드들 =====

  /**
   * 동기화 큐에 일지 추가
   */
  private addToSyncQueue(journal: Journal): void {
    if (!this.syncQueue.find((j) => j.id === journal.id)) {
      this.syncQueue.push(journal);
    }
  }

  /**
   * 재시도 큐에 일지 추가
   */
  private addToRetryQueue(journal: Journal, error?: string): void {
    const existingEntry = this.retryQueue.find(
      (entry) => entry.journal.id === journal.id,
    );

    if (existingEntry) {
      existingEntry.retryCount++;
      existingEntry.lastError = error;
    } else {
      this.retryQueue.push({
        journal,
        retryCount: 1,
        lastError: error,
      });
    }
  }

  /**
   * 재시도 큐 처리
   */
  private async processRetryQueue(): Promise<{ errors: SyncError[] }> {
    const errors: SyncError[] = [];
    const toRetry = this.retryQueue.filter(
      (entry) => entry.retryCount <= this.maxRetries,
    );

    for (const entry of toRetry) {
      try {
        const result = await this.syncToServer(entry.journal);

        if (result.success) {
          // 성공하면 큐에서 제거
          this.retryQueue = this.retryQueue.filter(
            (item) => item.journal.id !== entry.journal.id,
          );
        } else {
          entry.retryCount++;
          entry.lastError = result.error;
        }
      } catch (error) {
        entry.retryCount++;
        entry.lastError = error.message;
      }
    }

    // 최대 재시도 횟수를 초과한 항목들은 에러로 처리
    const failedEntries = this.retryQueue.filter(
      (entry) => entry.retryCount > this.maxRetries,
    );
    for (const entry of failedEntries) {
      errors.push({
        code: "SYNC_ERROR",
        message: entry.lastError || "최대 재시도 횟수 초과",
        retryable: false,
        timestamp: new Date(),
      });
    }

    // 실패한 항목들을 큐에서 제거
    this.retryQueue = this.retryQueue.filter(
      (entry) => entry.retryCount <= this.maxRetries,
    );

    return { errors };
  }

  /**
   * 로컬 동기화 상태 업데이트
   */
  private async updateLocalSyncStatus(
    journalId: string,
    status: string,
    serverId?: string,
  ): Promise<void> {
    const db = journalService["db"];
    const stmt = db.prepare(`
      UPDATE journals 
      SET sync_status = ?, server_id = ?, synced_at = ?
      WHERE id = ?
    `);

    stmt.run(status, serverId, new Date().toISOString(), journalId);
  }

  /**
   * 동기화 로그 기록
   */
  private async logSyncResult(
    journalId: string,
    syncType: string,
    status: string,
    error?: string,
  ): Promise<void> {
    const db = journalService["db"];
    const stmt = db.prepare(SYNC_QUERIES.INSERT_SYNC_LOG);

    stmt.run({
      journalId,
      syncType,
      status,
      errorMessage: error || null,
      details: JSON.stringify({ timestamp: new Date().toISOString() }),
    });
  }

  /**
   * 진행 상황 알림
   */
  private notifyProgress(progress: SyncProgress): void {
    this.progressCallbacks.forEach((callback) => {
      try {
        callback(progress);
      } catch (error) {
        console.error("진행 상황 콜백 오류:", error);
      }
    });
  }

  /**
   * 빈 배치 결과 생성
   */
  private createEmptyBatchResult(): BatchSyncResult {
    return {
      success: true,
      totalJournals: 0,
      syncedJournals: 0,
      failedJournals: 0,
      conflicts: 0,
      errors: [],
      startedAt: new Date(),
      completedAt: new Date(),
    };
  }

  // ===== 공개 API =====

  /**
   * 자동 동기화 활성화/비활성화
   */
  public setAutoSync(enabled: boolean): void {
    this.isAutoSyncEnabled = enabled;
  }

  /**
   * 진행 상황 콜백 등록
   */
  public onSyncProgress(callback: (progress: SyncProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * 동기화 상태 확인
   */
  public getSyncStatus(): {
    inProgress: boolean;
    queueLength: number;
    retryQueueLength: number;
    lastSync?: Date;
  } {
    return {
      inProgress: this.syncInProgress,
      queueLength: this.syncQueue.length,
      retryQueueLength: this.retryQueue.length,
      lastSync: this.currentUser?.lastSync,
    };
  }
}

/**
 * JournalSyncService 싱글톤 인스턴스 내보내기
 */
export const journalSyncService = JournalSyncService.getInstance();
