// app/api/journals/[id]/route.ts
// 개별 Journal 조회, 수정, 삭제 API 엔드포인트

import {
  ApiResponseBuilder,
  checkRateLimit,
  isValidJournalId,
  parseRequestBody,
  requireAuth,
  validateJournalOwnership,
  withErrorHandling,
} from "@/lib/api-helpers";
import { JournalService } from "@/lib/journal-service";
import { parseUpdateJournalRequest } from "@/lib/journal-validation";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/journals/[id]
 * 특정 Journal 조회
 */
export const GET = withErrorHandling(
  async (
    request: NextRequest,
    { params }: RouteParams,
  ): Promise<NextResponse> => {
    // 인증 확인
    const { user, response: authResponse } = await requireAuth(request);
    if (authResponse) return authResponse;

    // Journal ID 검증
    if (!isValidJournalId(params.id)) {
      return ApiResponseBuilder.error("올바르지 않은 일지 ID입니다", 400);
    }

    // Rate limiting
    if (!checkRateLimit(`get_${user!.id}`, 300, 60000)) {
      return ApiResponseBuilder.error("요청이 너무 많습니다", 429);
    }

    try {
      const journalService = JournalService.getInstance();

      // Journal 조회
      const journal = await journalService.getJournal(params.id);

      if (!journal) {
        return ApiResponseBuilder.notFound("일지");
      }

      // 소유권 확인
      if (journal.userId !== user!.id) {
        return ApiResponseBuilder.forbidden();
      }

      return ApiResponseBuilder.success(
        journal,
        "일지를 성공적으로 조회했습니다",
      );
    } catch (error) {
      console.error(`GET /api/journals/${params.id} error:`, error);
      return ApiResponseBuilder.internalError();
    }
  },
);

/**
 * PUT /api/journals/[id]
 * Journal 수정
 */
export const PUT = withErrorHandling(
  async (
    request: NextRequest,
    { params }: RouteParams,
  ): Promise<NextResponse> => {
    // 인증 확인
    const { user, response: authResponse } = await requireAuth(request);
    if (authResponse) return authResponse;

    // Journal ID 검증
    if (!isValidJournalId(params.id)) {
      return ApiResponseBuilder.error("올바르지 않은 일지 ID입니다", 400);
    }

    // Rate limiting (수정은 더 엄격하게)
    if (!checkRateLimit(`update_${user!.id}`, 100, 60000)) {
      return ApiResponseBuilder.error("수정 요청이 너무 많습니다", 429);
    }

    // 소유권 사전 확인
    const hasOwnership = await validateJournalOwnership(params.id, user!.id);
    if (!hasOwnership) {
      return ApiResponseBuilder.forbidden();
    }

    // 요청 바디 파싱 및 검증
    const { data: updateData, response: parseResponse } =
      await parseRequestBody(request, parseUpdateJournalRequest);

    if (parseResponse) return parseResponse;

    try {
      const journalService = JournalService.getInstance();

      // Journal 수정
      const updatedJournal = await journalService.updateJournal(
        params.id,
        updateData!,
      );

      if (!updatedJournal) {
        return ApiResponseBuilder.notFound("일지");
      }

      // 자동 동기화 트리거 (백그라운드)
      journalService.autoSync().catch((error) => {
        console.error("Auto sync failed after journal update:", error);
      });

      return ApiResponseBuilder.success(
        updatedJournal,
        "일지가 성공적으로 수정되었습니다",
      );
    } catch (error) {
      console.error(`PUT /api/journals/${params.id} error:`, error);

      if (error instanceof Error && error.message.includes("validation")) {
        return ApiResponseBuilder.error(error.message, 400);
      }

      return ApiResponseBuilder.internalError();
    }
  },
);

/**
 * DELETE /api/journals/[id]
 * Journal 삭제
 */
export const DELETE = withErrorHandling(
  async (
    request: NextRequest,
    { params }: RouteParams,
  ): Promise<NextResponse> => {
    // 인증 확인
    const { user, response: authResponse } = await requireAuth(request);
    if (authResponse) return authResponse;

    // Journal ID 검증
    if (!isValidJournalId(params.id)) {
      return ApiResponseBuilder.error("올바르지 않은 일지 ID입니다", 400);
    }

    // Rate limiting (삭제는 가장 엄격하게)
    if (!checkRateLimit(`delete_${user!.id}`, 50, 60000)) {
      return ApiResponseBuilder.error("삭제 요청이 너무 많습니다", 429);
    }

    // 소유권 사전 확인
    const hasOwnership = await validateJournalOwnership(params.id, user!.id);
    if (!hasOwnership) {
      return ApiResponseBuilder.forbidden();
    }

    try {
      const journalService = JournalService.getInstance();

      // 삭제 전에 Journal 존재 확인
      const journal = await journalService.getJournal(params.id);
      if (!journal) {
        return ApiResponseBuilder.notFound("일지");
      }

      // Journal 삭제
      const success = await journalService.deleteJournal(params.id);

      if (!success) {
        return ApiResponseBuilder.error("일지 삭제에 실패했습니다", 500);
      }

      // 자동 동기화 트리거 (백그라운드)
      journalService.autoSync().catch((error) => {
        console.error("Auto sync failed after journal deletion:", error);
      });

      return ApiResponseBuilder.success(
        { deleted: true, journalId: params.id },
        "일지가 성공적으로 삭제되었습니다",
      );
    } catch (error) {
      console.error(`DELETE /api/journals/${params.id} error:`, error);
      return ApiResponseBuilder.internalError();
    }
  },
);

/**
 * OPTIONS /api/journals/[id]
 * CORS preflight 요청 처리
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
