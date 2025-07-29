// app/api/journals/sync/route.ts
// Journal 동기화 관련 API 엔드포인트

import {
  ApiResponseBuilder,
  checkRateLimit,
  parseRequestBody,
  requireAuth,
  withErrorHandling,
} from "@/lib/api-helpers";
import { JournalService } from "@/lib/journal-service";
import { JournalSyncService } from "@/lib/journal-sync";
import { NetworkMonitor } from "@/lib/network-monitor";
import type { SyncResult } from "@/shared/types";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/journals/sync
 * 수동 동기화 트리거
 */
export const POST = withErrorHandling(
  async (request: NextRequest): Promise<NextResponse> => {
    // 인증 확인
    const { user, response: authResponse } = await requireAuth(request);
    if (authResponse) return authResponse;

    // Rate limiting (동기화는 매우 엄격하게 - 너무 자주 호출되면 안됨)
    if (!checkRateLimit(`sync_${user!.id}`, 20, 60000)) {
      return ApiResponseBuilder.error(
        "동기화 요청이 너무 많습니다. 1분 후 다시 시도해주세요",
        429,
      );
    }

    // 요청 바디 파싱 (옵션)
    const { data: requestData } = await parseRequestBody(request);

    const syncOptions = {
      force: requestData?.force === true, // 강제 동기화 여부
      direction: requestData?.direction || "both", // 'upload', 'download', 'both'
      journalIds: requestData?.journalIds || null, // 특정 일지만 동기화
    };

    try {
      // 네트워크 상태 확인
      const networkMonitor = NetworkMonitor.getInstance();
      const networkStatus = await networkMonitor.getStatus();

      if (!networkStatus.isOnline) {
        return ApiResponseBuilder.error(
          "네트워크 연결이 필요합니다. 인터넷 연결을 확인해주세요",
          503,
        );
      }

      if (networkStatus.quality === "poor") {
        return ApiResponseBuilder.error(
          "네트워크 상태가 불안정합니다. 잠시 후 다시 시도해주세요",
          503,
        );
      }

      const journalService = JournalService.getInstance();
      const syncService = JournalSyncService.getInstance();

      let syncResult: SyncResult;

      // 동기화 방향에 따른 처리
      if (
        syncOptions.direction === "upload" ||
        syncOptions.direction === "both"
      ) {
        // 로컬 → 서버 동기화
        if (syncOptions.journalIds) {
          // 특정 일지들만 동기화
          const results = await Promise.allSettled(
            syncOptions.journalIds.map(async (id: string) => {
              const journal = await journalService.getJournal(id);
              if (journal && journal.userId === user!.id) {
                return await syncService.syncToServer(journal);
              }
              throw new Error(`Journal ${id} not found or access denied`);
            }),
          );

          const successful = results
            .filter((r) => r.status === "fulfilled")
            .map((r) => (r as PromiseFulfilledResult<SyncResult>).value);

          syncResult = {
            success: successful.length > 0,
            syncedJournals: successful.flatMap((r) => r.syncedJournals),
            failedJournals: successful.flatMap((r) => r.failedJournals),
            conflicts: successful.flatMap((r) => r.conflicts),
            error: results.some((r) => r.status === "rejected")
              ? "일부 일지 동기화 실패"
              : undefined,
          };
        } else {
          // 모든 미동기화 일지 업로드
          syncResult = await syncService.syncAllToServer(user!.id);
        }
      }

      if (
        syncOptions.direction === "download" ||
        syncOptions.direction === "both"
      ) {
        // 서버 → 로컬 동기화
        const downloadResult = await syncService.syncFromServer(user!.id);

        if (syncOptions.direction === "both" && syncResult!) {
          // 양방향 동기화 결과 병합
          syncResult = {
            success: syncResult.success && downloadResult.success,
            syncedJournals: [
              ...syncResult.syncedJournals,
              ...downloadResult.syncedJournals,
            ],
            failedJournals: [
              ...syncResult.failedJournals,
              ...downloadResult.failedJournals,
            ],
            conflicts: [...syncResult.conflicts, ...downloadResult.conflicts],
            error: syncResult.error || downloadResult.error,
          };
        } else {
          syncResult = downloadResult;
        }
      }

      // 동기화 통계 업데이트
      await syncService.updateSyncStatistics(user!.id, syncResult!);

      const message = syncResult!.success
        ? `동기화가 완료되었습니다. 성공: ${syncResult!.syncedJournals.length}개, 실패: ${syncResult!.failedJournals.length}개`
        : "동기화 중 오류가 발생했습니다";

      return ApiResponseBuilder.success(syncResult!, message);
    } catch (error) {
      console.error("POST /api/journals/sync error:", error);

      if (error instanceof Error) {
        return ApiResponseBuilder.error(`동기화 실패: ${error.message}`, 500);
      }

      return ApiResponseBuilder.internalError();
    }
  },
);

/**
 * GET /api/journals/sync
 * 동기화 상태 및 통계 조회
 */
export const GET = withErrorHandling(
  async (request: NextRequest): Promise<NextResponse> => {
    // 인증 확인
    const { user, response: authResponse } = await requireAuth(request);
    if (authResponse) return authResponse;

    try {
      const journalService = JournalService.getInstance();
      const syncService = JournalSyncService.getInstance();
      const networkMonitor = NetworkMonitor.getInstance();

      // 동기화 상태 정보 수집
      const [syncStatus, syncStatistics, networkStatus, unsyncedCount] =
        await Promise.all([
          syncService.getSyncStatus(user!.id),
          syncService.getSyncStatistics(user!.id),
          networkMonitor.getStatus(),
          journalService.getUnsyncedJournalsCount(user!.id),
        ]);

      const statusInfo = {
        syncStatus,
        statistics: syncStatistics,
        network: networkStatus,
        unsyncedJournals: unsyncedCount,
        lastSync: syncStatistics.lastSyncTime,
        nextAutoSync: syncService.getNextAutoSyncTime(),
      };

      return ApiResponseBuilder.success(
        statusInfo,
        "동기화 상태를 성공적으로 조회했습니다",
      );
    } catch (error) {
      console.error("GET /api/journals/sync error:", error);
      return ApiResponseBuilder.internalError();
    }
  },
);

/**
 * DELETE /api/journals/sync
 * 동기화 이력 및 충돌 데이터 정리
 */
export const DELETE = withErrorHandling(
  async (request: NextRequest): Promise<NextResponse> => {
    // 인증 확인
    const { user, response: authResponse } = await requireAuth(request);
    if (authResponse) return authResponse;

    // Rate limiting
    if (!checkRateLimit(`sync_cleanup_${user!.id}`, 5, 60000)) {
      return ApiResponseBuilder.error("정리 요청이 너무 많습니다", 429);
    }

    try {
      const syncService = JournalSyncService.getInstance();

      // 동기화 로그 및 충돌 데이터 정리
      const cleanupResult = await syncService.cleanupSyncData(user!.id);

      return ApiResponseBuilder.success(
        cleanupResult,
        "동기화 데이터가 성공적으로 정리되었습니다",
      );
    } catch (error) {
      console.error("DELETE /api/journals/sync error:", error);
      return ApiResponseBuilder.internalError();
    }
  },
);

/**
 * OPTIONS /api/journals/sync
 * CORS preflight 요청 처리
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
