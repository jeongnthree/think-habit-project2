// app/api/journals/route.ts
// Journal 목록 조회 및 생성 API 엔드포인트

import {
  ApiResponseBuilder,
  checkRateLimit,
  parseQueryParams,
  parseRequestBody,
  requireAuth,
  withErrorHandling,
} from "@/lib/api-helpers";
import { JournalService } from "@/lib/journal-service";
import { parseCreateJournalRequest } from "@/lib/journal-validation";
import type { CreateJournalDto, JournalListResponse } from "@/shared/types";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/journals
 * 사용자의 Journal 목록 조회 (필터링, 정렬, 페이지네이션 지원)
 */
export const GET = withErrorHandling(
  async (request: NextRequest): Promise<NextResponse> => {
    // 인증 확인
    const { user, response: authResponse } = await requireAuth(request);
    if (authResponse) return authResponse;

    // Rate limiting 확인
    if (!checkRateLimit(user!.id, 200, 60000)) {
      return ApiResponseBuilder.error(
        "요청이 너무 많습니다. 잠시 후 다시 시도해주세요",
        429,
      );
    }

    // 쿼리 파라미터 파싱
    const { filter, pagination, sort } = parseQueryParams(request);

    try {
      const journalService = JournalService.getInstance();

      // 사용자 Journal 목록 조회
      const journals = await journalService.getUserJournals(
        user!.id,
        filter,
        {
          sortBy: sort.sortBy as any,
          order: sort.order,
        },
        pagination,
      );

      // 전체 개수 조회
      const total = await journalService.getUserJournalsCount(user!.id, filter);

      // 응답 데이터 구성
      const response: JournalListResponse = {
        journals,
        total,
        page: pagination.page,
        limit: pagination.limit,
        hasNext: pagination.page * pagination.limit < total,
        hasPrev: pagination.page > 1,
      };

      return ApiResponseBuilder.success(
        response,
        "일지 목록을 성공적으로 조회했습니다",
      );
    } catch (error) {
      console.error("GET /api/journals error:", error);
      return ApiResponseBuilder.internalError();
    }
  },
);

/**
 * POST /api/journals
 * 새로운 Journal 생성
 */
export const POST = withErrorHandling(
  async (request: NextRequest): Promise<NextResponse> => {
    // 인증 확인
    const { user, response: authResponse } = await requireAuth(request);
    if (authResponse) return authResponse;

    // Rate limiting 확인 (생성은 더 엄격하게)
    if (!checkRateLimit(`create_${user!.id}`, 50, 60000)) {
      return ApiResponseBuilder.error(
        "생성 요청이 너무 많습니다. 잠시 후 다시 시도해주세요",
        429,
      );
    }

    // 요청 바디 파싱 및 검증
    const { data: requestData, response: parseResponse } =
      await parseRequestBody(request, parseCreateJournalRequest);

    if (parseResponse) return parseResponse;

    try {
      // Journal 데이터 구성
      const journalData: CreateJournalDto = {
        ...requestData!,
        userId: user!.id,
      };

      const journalService = JournalService.getInstance();

      // Journal 생성
      const newJournal = await journalService.createJournal(journalData);

      // 자동 동기화 트리거 (백그라운드)
      journalService.autoSync().catch((error) => {
        console.error("Auto sync failed after journal creation:", error);
      });

      return ApiResponseBuilder.success(
        newJournal,
        "일지가 성공적으로 생성되었습니다",
      );
    } catch (error) {
      console.error("POST /api/journals error:", error);

      if (error instanceof Error && error.message.includes("validation")) {
        return ApiResponseBuilder.error(error.message, 400);
      }

      return ApiResponseBuilder.internalError();
    }
  },
);

/**
 * OPTIONS /api/journals
 * CORS preflight 요청 처리
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
