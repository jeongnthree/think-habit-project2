// lib/api-helpers.ts
// Think-Habit3 프로젝트의 API 공통 유틸리티

import { authOptions } from "@/lib/auth";
import type {
  ApiResponse,
  JournalFilter,
  PaginationOptions,
} from "@/shared/types";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * API 응답 표준화 유틸리티
 */
export class ApiResponseBuilder {
  static success<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      message,
    });
  }

  static error(error: string, status = 400): NextResponse<ApiResponse<null>> {
    return NextResponse.json(
      {
        success: false,
        error,
        message: error,
      },
      { status },
    );
  }

  static unauthorized(): NextResponse<ApiResponse<null>> {
    return NextResponse.json(
      {
        success: false,
        error: "인증이 필요합니다",
        message: "로그인 후 다시 시도해주세요",
      },
      { status: 401 },
    );
  }

  static forbidden(): NextResponse<ApiResponse<null>> {
    return NextResponse.json(
      {
        success: false,
        error: "접근 권한이 없습니다",
        message: "해당 리소스에 접근할 권한이 없습니다",
      },
      { status: 403 },
    );
  }

  static notFound(resource = "리소스"): NextResponse<ApiResponse<null>> {
    return NextResponse.json(
      {
        success: false,
        error: `${resource}를 찾을 수 없습니다`,
        message: `요청하신 ${resource}가 존재하지 않습니다`,
      },
      { status: 404 },
    );
  }

  static internalError(): NextResponse<ApiResponse<null>> {
    return NextResponse.json(
      {
        success: false,
        error: "서버 내부 오류가 발생했습니다",
        message: "잠시 후 다시 시도해주세요",
      },
      { status: 500 },
    );
  }
}

/**
 * 인증 미들웨어
 */
export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      user: null,
      response: ApiResponseBuilder.unauthorized(),
    };
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name!,
    },
    response: null,
  };
}

/**
 * 요청 바디 파싱 및 검증
 */
export async function parseRequestBody<T>(
  request: NextRequest,
  validator?: (data: any) => T,
): Promise<{ data: T | null; response: NextResponse | null }> {
  try {
    const body = await request.json();

    if (validator) {
      const validatedData = validator(body);
      return { data: validatedData, response: null };
    }

    return { data: body, response: null };
  } catch (error) {
    console.error("Request body parsing error:", error);
    return {
      data: null,
      response: ApiResponseBuilder.error("잘못된 요청 형식입니다"),
    };
  }
}

/**
 * 쿼리 파라미터에서 필터 및 페이지네이션 옵션 추출
 */
export function parseQueryParams(request: NextRequest): {
  filter: JournalFilter;
  pagination: PaginationOptions;
  sort: { sortBy: string; order: "asc" | "desc" };
} {
  const { searchParams } = new URL(request.url);

  // 필터링 옵션
  const filter: JournalFilter = {};

  if (searchParams.get("type")) {
    filter.type = searchParams.get("type") as "structured" | "photo";
  }

  if (searchParams.get("searchQuery")) {
    filter.searchQuery = searchParams.get("searchQuery")!;
  }

  if (searchParams.get("dateFrom")) {
    filter.dateFrom = new Date(searchParams.get("dateFrom")!);
  }

  if (searchParams.get("dateTo")) {
    filter.dateTo = new Date(searchParams.get("dateTo")!);
  }

  if (searchParams.get("syncStatus")) {
    filter.syncStatus = searchParams.get("syncStatus") as any;
  }

  if (searchParams.get("tags")) {
    filter.tags = searchParams.get("tags")!.split(",");
  }

  if (searchParams.get("completionRateMin")) {
    filter.completionRateMin = Number(searchParams.get("completionRateMin"));
  }

  if (searchParams.get("completionRateMax")) {
    filter.completionRateMax = Number(searchParams.get("completionRateMax"));
  }

  // 페이지네이션 옵션
  const pagination: PaginationOptions = {
    page: Number(searchParams.get("page")) || 1,
    limit: Math.min(Number(searchParams.get("limit")) || 20, 100), // 최대 100개 제한
  };

  // 정렬 옵션
  const sort = {
    sortBy: searchParams.get("sortBy") || "createdAt",
    order: (searchParams.get("order") as "asc" | "desc") || "desc",
  };

  return { filter, pagination, sort };
}

/**
 * 사용자 권한 검증 (Journal 소유권 확인)
 */
export async function validateJournalOwnership(
  journalId: string,
  userId: string,
): Promise<boolean> {
  try {
    // 실제 구현에서는 JournalService를 사용하여 소유권 확인
    // 여기서는 기본 구조만 제공
    const { JournalService } = await import("@/lib/journal-service");
    const journalService = JournalService.getInstance();

    const journal = await journalService.getJournal(journalId);
    return journal?.userId === userId;
  } catch (error) {
    console.error("Journal ownership validation error:", error);
    return false;
  }
}

/**
 * 에러 처리 래퍼
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("API Handler Error:", error);

      // Zod 검증 에러
      if (error && typeof error === "object" && "issues" in error) {
        const message =
          error.issues?.map((issue: any) => issue.message).join(", ") ||
          "입력 데이터가 올바르지 않습니다";
        return ApiResponseBuilder.error(message, 400) as R;
      }

      // 일반 에러
      if (error instanceof Error) {
        return ApiResponseBuilder.error(error.message, 400) as R;
      }

      return ApiResponseBuilder.internalError() as R;
    }
  };
}

/**
 * CORS 헤더 설정
 */
export function setCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  return response;
}

/**
 * 요청 제한 (간단한 rate limiting)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests = 100,
  windowMs = 60000, // 1분
): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(identifier);

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (userRequests.count >= maxRequests) {
    return false;
  }

  userRequests.count++;
  return true;
}

/**
 * 파일 업로드 검증
 */
export function validateFileUpload(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "파일 크기는 10MB를 초과할 수 없습니다",
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "JPEG, PNG, WebP 형식만 지원됩니다",
    };
  }

  return { valid: true };
}

/**
 * Journal ID 검증 (UUID 형식)
 */
export function isValidJournalId(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
