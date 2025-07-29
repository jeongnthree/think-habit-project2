// app/api/journals/stats/route.ts
// Journal 통계 API

import {
  ApiResponseBuilder,
  requireAuth,
  withErrorHandling,
} from "@/lib/api-helpers";
import { JournalService } from "@/lib/journal-service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandling(
  async (request: NextRequest): Promise<NextResponse> => {
    const { user, response: authResponse } = await requireAuth(request);
    if (authResponse) return authResponse;

    try {
      const journalService = JournalService.getInstance();
      const stats = await journalService.getUserStats(user!.id);

      return ApiResponseBuilder.success(
        stats,
        "통계를 성공적으로 조회했습니다",
      );
    } catch (error) {
      console.error("GET /api/journals/stats error:", error);
      return ApiResponseBuilder.internalError();
    }
  },
);

// app/api/journals/search/route.ts
// Journal 검색 API

import { parseQueryParams } from "@/lib/api-helpers";

export const GET = withErrorHandling(
  async (request: NextRequest): Promise<NextResponse> => {
    const { user, response: authResponse } = await requireAuth(request);
    if (authResponse) return authResponse;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return ApiResponseBuilder.error("검색어는 2글자 이상 입력해주세요", 400);
    }

    try {
      const journalService = JournalService.getInstance();
      const { pagination } = parseQueryParams(request);

      const results = await journalService.searchJournals(
        user!.id,
        query.trim(),
        pagination,
      );

      return ApiResponseBuilder.success(results, "검색을 완료했습니다");
    } catch (error) {
      console.error("GET /api/journals/search error:", error);
      return ApiResponseBuilder.internalError();
    }
  },
);

// app/api/journals/export/route.ts
// Journal 내보내기 API

import { checkRateLimit } from "@/lib/api-helpers";

export const GET = withErrorHandling(
  async (request: NextRequest): Promise<NextResponse> => {
    const { user, response: authResponse } = await requireAuth(request);
    if (authResponse) return authResponse;

    // Rate limiting (내보내기는 리소스 집약적)
    if (!checkRateLimit(`export_${user!.id}`, 5, 300000)) {
      // 5분에 5회
      return ApiResponseBuilder.error("내보내기 요청이 너무 많습니다", 429);
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    if (!["json", "csv"].includes(format)) {
      return ApiResponseBuilder.error(
        "지원되지 않는 형식입니다. json 또는 csv를 사용해주세요",
        400,
      );
    }

    try {
      const journalService = JournalService.getInstance();

      // 모든 일지 조회
      const journals = await journalService.getUserJournals(
        user!.id,
        {},
        { sortBy: "createdAt", order: "asc" },
      );

      if (format === "csv") {
        // CSV 형식으로 변환
        const csvContent = convertJournalsToCSV(journals);

        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="journals_${user!.id}_${new Date().toISOString().split("T")[0]}.csv"`,
          },
        });
      } else {
        // JSON 형식
        const jsonContent = JSON.stringify(journals, null, 2);

        return new NextResponse(jsonContent, {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="journals_${user!.id}_${new Date().toISOString().split("T")[0]}.json"`,
          },
        });
      }
    } catch (error) {
      console.error("GET /api/journals/export error:", error);
      return ApiResponseBuilder.internalError();
    }
  },
);

function convertJournalsToCSV(journals: any[]): string {
  const headers = [
    "ID",
    "Title",
    "Type",
    "Created At",
    "Updated At",
    "Sync Status",
    "Content Preview",
  ];

  const rows = journals.map((journal) => [
    journal.id,
    `"${journal.title.replace(/"/g, '""')}"`,
    journal.type,
    journal.createdAt,
    journal.updatedAt,
    journal.syncStatus,
    `"${getContentPreview(journal.content).replace(/"/g, '""')}"`,
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

function getContentPreview(content: any): string {
  if (content.tasks) {
    return content.tasks
      .slice(0, 3)
      .map((task: any) => task.text)
      .join("; ");
  } else if (content.description) {
    return content.description.substring(0, 100);
  }
  return "";
}

// app/api/journals/bulk/route.ts
// 대량 작업 API

import { parseRequestBody } from "@/lib/api-helpers";

export const POST = withErrorHandling(
  async (request: NextRequest): Promise<NextResponse> => {
    const { user, response: authResponse } = await requireAuth(request);
    if (authResponse) return authResponse;

    // Rate limiting
    if (!checkRateLimit(`bulk_${user!.id}`, 10, 300000)) {
      // 5분에 10회
      return ApiResponseBuilder.error("대량 작업 요청이 너무 많습니다", 429);
    }

    const { data: requestData, response: parseResponse } =
      await parseRequestBody(request);
    if (parseResponse) return parseResponse;

    const { action, journalIds } = requestData!;

    if (!action || !Array.isArray(journalIds) || journalIds.length === 0) {
      return ApiResponseBuilder.error("action과 journalIds가 필요합니다", 400);
    }

    if (journalIds.length > 100) {
      return ApiResponseBuilder.error(
        "한 번에 최대 100개까지 처리할 수 있습니다",
        400,
      );
    }

    try {
      const journalService = JournalService.getInstance();
      let results = { success: 0, failed: 0, errors: [] as string[] };

      switch (action) {
        case "delete":
          for (const id of journalIds) {
            try {
              const success = await journalService.deleteJournal(id);
              if (success) results.success++;
              else results.failed++;
            } catch (error) {
              results.failed++;
              results.errors.push(
                `${id}: ${error instanceof Error ? error.message : "Unknown error"}`,
              );
            }
          }
          break;

        case "archive":
          for (const id of journalIds) {
            try {
              await journalService.toggleArchive(id);
              results.success++;
            } catch (error) {
              results.failed++;
              results.errors.push(
                `${id}: ${error instanceof Error ? error.message : "Unknown error"}`,
              );
            }
          }
          break;

        case "sync":
          for (const id of journalIds) {
            try {
              await journalService.syncJournal(id);
              results.success++;
            } catch (error) {
              results.failed++;
              results.errors.push(
                `${id}: ${error instanceof Error ? error.message : "Unknown error"}`,
              );
            }
          }
          break;

        default:
          return ApiResponseBuilder.error("지원되지 않는 작업입니다", 400);
      }

      const message = `${action} 작업 완료: 성공 ${results.success}개, 실패 ${results.failed}개`;
      return ApiResponseBuilder.success(results, message);
    } catch (error) {
      console.error("POST /api/journals/bulk error:", error);
      return ApiResponseBuilder.internalError();
    }
  },
);
