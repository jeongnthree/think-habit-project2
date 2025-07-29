import { z } from 'zod';

// URL 파라미터 검증 스키마
export const journalRouteParamsSchema = z.object({
  categoryId: z.string().uuid('유효하지 않은 카테고리 ID입니다'),
});

export const journalOptionalParamsSchema = z.object({
  categoryId: z.string().uuid().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  type: z.enum(['structured', 'photo', 'all']).optional(),
});

// URL 파라미터 검증 함수
export function validateJournalRouteParams(
  params: Record<string, string | null>
) {
  try {
    const categoryId = params.categoryId;
    if (!categoryId) {
      return {
        success: false,
        error: '카테고리 ID가 필요합니다.',
        data: null,
      };
    }

    const result = journalRouteParamsSchema.parse({ categoryId });
    return {
      success: true,
      error: null,
      data: result,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || '잘못된 파라미터입니다.',
        data: null,
      };
    }
    return {
      success: false,
      error: '파라미터 검증 중 오류가 발생했습니다.',
      data: null,
    };
  }
}

// 선택적 파라미터 검증 함수
export function validateOptionalParams(params: Record<string, string | null>) {
  try {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== null)
    );

    const result = journalOptionalParamsSchema.parse(cleanParams);
    return {
      success: true,
      error: null,
      data: result,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || '잘못된 파라미터입니다.',
        data: null,
      };
    }
    return {
      success: false,
      error: '파라미터 검증 중 오류가 발생했습니다.',
      data: null,
    };
  }
}

// URL 생성 헬퍼 함수
export function buildJournalUrl(
  basePath: string,
  params: { categoryId?: string; page?: number; type?: string }
) {
  const searchParams = new URLSearchParams();

  if (params.categoryId) {
    searchParams.set('categoryId', params.categoryId);
  }
  if (params.page && params.page > 1) {
    searchParams.set('page', params.page.toString());
  }
  if (params.type && params.type !== 'all') {
    searchParams.set('type', params.type);
  }

  const queryString = searchParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}
