// lib/journal-validation.ts
// Think-Habit Journal App - Zod 기반 데이터 유효성 검증 시스템

import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { z } from "zod";
import { Journal, JournalValidationError, TodoItem } from "../shared/types";

// DOMPurify 초기화 (Node.js 환경에서)
const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

// ===== 기본 스키마 정의 =====

/**
 * UUID 검증 스키마
 */
const uuidSchema = z.string().uuid({
  message: "올바른 ID 형식이 아닙니다",
});

/**
 * 제목 검증 스키마
 */
const titleSchema = z
  .string()
  .min(1, "제목은 필수 입력 항목입니다")
  .max(100, "제목은 100자를 초과할 수 없습니다")
  .trim();

/**
 * 노트 검증 스키마
 */
const notesSchema = z
  .string()
  .max(5000, "노트는 5000자를 초과할 수 없습니다")
  .optional()
  .default("");

/**
 * 태그 검증 스키마
 */
const tagsSchema = z
  .array(
    z
      .string()
      .min(1, "태그는 빈 문자열일 수 없습니다")
      .max(20, "태그는 20자를 초과할 수 없습니다")
      .trim(),
  )
  .max(10, "태그는 최대 10개까지 추가할 수 있습니다")
  .optional();

// ===== TodoItem 검증 스키마 =====

/**
 * TodoItem 검증 스키마
 */
const todoItemSchema = z.object({
  id: uuidSchema,
  text: z
    .string()
    .min(1, "할 일 내용은 필수 입력 항목입니다")
    .max(200, "할 일 내용은 200자를 초과할 수 없습니다")
    .trim(),
  completed: z.boolean(),
  order: z
    .number()
    .int("순서는 정수여야 합니다")
    .min(0, "순서는 0 이상이어야 합니다"),
  createdAt: z.date().optional(),
});

// ===== PhotoItem 검증 스키마 =====

/**
 * 지원되는 이미지 MIME 타입
 */
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/**
 * PhotoItem 검증 스키마
 */
const photoItemSchema = z.object({
  id: uuidSchema,
  fileName: z
    .string()
    .min(1, "파일명은 필수 입력 항목입니다")
    .max(255, "파일명은 255자를 초과할 수 없습니다"),
  filePath: z.string().min(1, "파일 경로는 필수 입력 항목입니다"),
  fileSize: z
    .number()
    .int("파일 크기는 정수여야 합니다")
    .min(1, "파일 크기는 1바이트 이상이어야 합니다")
    .max(10 * 1024 * 1024, "파일 크기는 10MB를 초과할 수 없습니다")
    .optional(),
  mimeType: z
    .enum(SUPPORTED_IMAGE_TYPES, {
      errorMap: () => ({ message: "지원되지 않는 이미지 형식입니다" }),
    })
    .optional(),
  caption: z.string().max(500, "캡션은 500자를 초과할 수 없습니다").optional(),
  order: z
    .number()
    .int("순서는 정수여야 합니다")
    .min(0, "순서는 0 이상이어야 합니다"),
  serverUrl: z.string().url("올바른 URL 형식이 아닙니다").optional(),
  createdAt: z.date().optional(),
});

// ===== 콘텐츠 검증 스키마 =====

/**
 * StructuredContent 검증 스키마
 */
const structuredContentSchema = z.object({
  tasks: z
    .array(todoItemSchema)
    .min(1, "최소 1개의 할 일이 필요합니다")
    .max(50, "할 일은 최대 50개까지 추가할 수 있습니다"),
  notes: notesSchema,
  completionRate: z
    .number()
    .min(0, "완료율은 0 이상이어야 합니다")
    .max(100, "완료율은 100 이하여야 합니다")
    .optional(),
});

/**
 * PhotoContent 검증 스키마
 */
const photoContentSchema = z.object({
  photos: z
    .array(photoItemSchema)
    .min(1, "최소 1개의 사진이 필요합니다")
    .max(20, "사진은 최대 20개까지 업로드할 수 있습니다"),
  description: z
    .string()
    .max(2000, "설명은 2000자를 초과할 수 없습니다")
    .default(""),
});

// ===== Journal 검증 스키마 =====

/**
 * CreateJournal DTO 검증 스키마
 */
export const createJournalSchema = z.object({
  type: z.enum(["structured", "photo"], {
    errorMap: () => ({
      message: "일지 타입은 structured 또는 photo여야 합니다",
    }),
  }),
  title: titleSchema,
  content: z.union(
    [
      structuredContentSchema.omit({ completionRate: true }),
      photoContentSchema,
    ],
    {
      errorMap: () => ({ message: "올바른 콘텐츠 형식이 아닙니다" }),
    },
  ),
  tags: tagsSchema,
});

/**
 * UpdateJournal DTO 검증 스키마
 */
export const updateJournalSchema = z.object({
  title: titleSchema.optional(),
  content: z.union([structuredContentSchema, photoContentSchema]).optional(),
  tags: tagsSchema,
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

/**
 * Journal 완전 검증 스키마
 */
export const journalSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  type: z.enum(["structured", "photo"]),
  title: titleSchema,
  content: z.union([structuredContentSchema, photoContentSchema]),
  syncStatus: z.enum(["local", "synced", "pending", "conflict"]),
  serverId: z.string().optional(),
  serverVersion: z.number().int().min(0).optional(),
  localVersion: z.number().int().min(0).optional(),
  tags: tagsSchema,
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  syncedAt: z.date().optional(),
});

// ===== 필터링 검증 스키마 =====

/**
 * JournalFilter 검증 스키마
 */
export const journalFilterSchema = z
  .object({
    type: z.enum(["structured", "photo"]).optional(),
    syncStatus: z.enum(["local", "synced", "pending", "conflict"]).optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
    searchText: z
      .string()
      .max(100, "검색어는 100자를 초과할 수 없습니다")
      .optional(),
    tags: z.array(z.string().trim()).optional(),
    isFavorite: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    completionRate: z
      .object({
        min: z.number().min(0).max(100).optional(),
        max: z.number().min(0).max(100).optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.dateFrom && data.dateTo) {
        return data.dateFrom <= data.dateTo;
      }
      return true;
    },
    {
      message: "시작 날짜는 종료 날짜보다 늦을 수 없습니다",
      path: ["dateFrom"],
    },
  )
  .refine(
    (data) => {
      if (
        data.completionRate?.min !== undefined &&
        data.completionRate?.max !== undefined
      ) {
        return data.completionRate.min <= data.completionRate.max;
      }
      return true;
    },
    {
      message: "최소 완료율은 최대 완료율보다 클 수 없습니다",
      path: ["completionRate", "min"],
    },
  );

// ===== 유틸리티 함수들 =====

/**
 * 콘텐츠 보안 처리 (XSS 방지)
 */
export const sanitizeContent = (content: string): string => {
  if (!content) return "";

  // HTML 태그 제거 및 안전한 문자만 유지
  const sanitized = purify.sanitize(content, {
    ALLOWED_TAGS: [], // 모든 HTML 태그 제거
    ALLOWED_ATTR: [], // 모든 속성 제거
    KEEP_CONTENT: true, // 텍스트 내용은 유지
  });

  return sanitized.trim();
};

/**
 * Journal 데이터 검증
 */
export const validateJournalData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
):
  | { success: true; data: T }
  | { success: false; errors: JournalValidationError[] } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: JournalValidationError[] = error.errors.map((err) => ({
        code: "VALIDATION_ERROR",
        message: err.message,
        field: err.path.join("."),
        timestamp: new Date(),
      }));
      return { success: false, errors };
    }

    // 예상치 못한 에러
    return {
      success: false,
      errors: [
        {
          code: "VALIDATION_ERROR",
          message: "알 수 없는 검증 오류가 발생했습니다",
          timestamp: new Date(),
        },
      ],
    };
  }
};

/**
 * CreateJournal 요청 파싱 및 검증
 */
export const parseCreateJournalRequest = (data: unknown) => {
  // 먼저 콘텐츠 보안 처리
  if (data && typeof data === "object" && data !== null) {
    const journalData = data as any;

    // 제목 보안 처리
    if (journalData.title) {
      journalData.title = sanitizeContent(journalData.title);
    }

    // 콘텐츠별 보안 처리
    if (journalData.content) {
      if (journalData.content.notes) {
        journalData.content.notes = sanitizeContent(journalData.content.notes);
      }

      if (journalData.content.description) {
        journalData.content.description = sanitizeContent(
          journalData.content.description,
        );
      }

      // TodoItem 텍스트 보안 처리
      if (journalData.content.tasks) {
        journalData.content.tasks = journalData.content.tasks.map(
          (task: any) => ({
            ...task,
            text: task.text ? sanitizeContent(task.text) : task.text,
          }),
        );
      }

      // PhotoItem 캡션 보안 처리
      if (journalData.content.photos) {
        journalData.content.photos = journalData.content.photos.map(
          (photo: any) => ({
            ...photo,
            caption: photo.caption
              ? sanitizeContent(photo.caption)
              : photo.caption,
          }),
        );
      }
    }

    // 태그 보안 처리
    if (journalData.tags) {
      journalData.tags = journalData.tags.map((tag: string) =>
        sanitizeContent(tag),
      );
    }
  }

  return validateJournalData(createJournalSchema, data);
};

/**
 * UpdateJournal 요청 파싱 및 검증
 */
export const parseUpdateJournalRequest = (data: unknown) => {
  // CreateJournal과 동일한 보안 처리 적용
  if (data && typeof data === "object" && data !== null) {
    const journalData = data as any;

    if (journalData.title) {
      journalData.title = sanitizeContent(journalData.title);
    }

    if (journalData.content) {
      if (journalData.content.notes) {
        journalData.content.notes = sanitizeContent(journalData.content.notes);
      }

      if (journalData.content.description) {
        journalData.content.description = sanitizeContent(
          journalData.content.description,
        );
      }

      if (journalData.content.tasks) {
        journalData.content.tasks = journalData.content.tasks.map(
          (task: any) => ({
            ...task,
            text: task.text ? sanitizeContent(task.text) : task.text,
          }),
        );
      }

      if (journalData.content.photos) {
        journalData.content.photos = journalData.content.photos.map(
          (photo: any) => ({
            ...photo,
            caption: photo.caption
              ? sanitizeContent(photo.caption)
              : photo.caption,
          }),
        );
      }
    }

    if (journalData.tags) {
      journalData.tags = journalData.tags.map((tag: string) =>
        sanitizeContent(tag),
      );
    }
  }

  return validateJournalData(updateJournalSchema, data);
};

/**
 * JournalFilter 요청 파싱 및 검증
 */
export const parseJournalFilterRequest = (data: unknown) => {
  // 검색어 보안 처리
  if (data && typeof data === "object" && data !== null) {
    const filterData = data as any;

    if (filterData.searchText) {
      filterData.searchText = sanitizeContent(filterData.searchText);
    }

    if (filterData.tags) {
      filterData.tags = filterData.tags.map((tag: string) =>
        sanitizeContent(tag),
      );
    }
  }

  return validateJournalData(journalFilterSchema, data);
};

/**
 * 완료율 자동 계산
 */
export const calculateCompletionRate = (tasks: TodoItem[]): number => {
  if (tasks.length === 0) return 0;

  const completedTasks = tasks.filter((task) => task.completed).length;
  return Math.round((completedTasks / tasks.length) * 100);
};

/**
 * 파일 크기 유효성 검증
 */
export const validateFileSize = (
  fileSize: number,
  maxSize: number = 10 * 1024 * 1024,
): boolean => {
  return fileSize > 0 && fileSize <= maxSize;
};

/**
 * 이미지 MIME 타입 유효성 검증
 */
export const validateImageMimeType = (mimeType: string): boolean => {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType as any);
};

/**
 * 배치 검증 (여러 Journal 동시 검증)
 */
export const validateJournalBatch = (
  journals: unknown[],
): {
  validJournals: Journal[];
  invalidJournals: { index: number; errors: JournalValidationError[] }[];
} => {
  const validJournals: Journal[] = [];
  const invalidJournals: { index: number; errors: JournalValidationError[] }[] =
    [];

  journals.forEach((journal, index) => {
    const result = validateJournalData(journalSchema, journal);

    if (result.success) {
      validJournals.push(result.data);
    } else {
      invalidJournals.push({ index, errors: result.errors });
    }
  });

  return { validJournals, invalidJournals };
};

// ===== 내보내기 =====

export {
  photoContentSchema,
  photoItemSchema,
  structuredContentSchema,
  SUPPORTED_IMAGE_TYPES,
  todoItemSchema,
};
