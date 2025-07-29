// utils/validation-helpers.ts
// Think-Habit Journal App - 공통 검증 유틸리티 함수

import { z } from "zod";

/**
 * 한국어 에러 메시지 매핑
 */
export const ERROR_MESSAGES = {
  // 공통 에러
  REQUIRED: "필수 입력 항목입니다",
  INVALID_FORMAT: "올바른 형식이 아닙니다",
  TOO_LONG: "입력 길이가 너무 깁니다",
  TOO_SHORT: "입력 길이가 너무 짧습니다",
  INVALID_TYPE: "올바른 데이터 타입이 아닙니다",

  // 문자열 관련
  STRING_TOO_LONG: (max: number) => `${max}자를 초과할 수 없습니다`,
  STRING_TOO_SHORT: (min: number) => `최소 ${min}자 이상 입력해야 합니다`,
  STRING_EMPTY: "빈 문자열은 허용되지 않습니다",

  // 숫자 관련
  NUMBER_TOO_LARGE: (max: number) => `${max}를 초과할 수 없습니다`,
  NUMBER_TOO_SMALL: (min: number) => `${min} 이상이어야 합니다`,
  NUMBER_NOT_INTEGER: "정수여야 합니다",

  // 배열 관련
  ARRAY_TOO_LONG: (max: number) => `최대 ${max}개까지 가능합니다`,
  ARRAY_TOO_SHORT: (min: number) => `최소 ${min}개 이상 필요합니다`,
  ARRAY_EMPTY: "최소 1개 이상의 항목이 필요합니다",

  // 날짜 관련
  INVALID_DATE: "올바른 날짜 형식이 아닙니다",
  DATE_TOO_EARLY: "날짜가 너무 이릅니다",
  DATE_TOO_LATE: "날짜가 너무 늦습니다",

  // 파일 관련
  FILE_TOO_LARGE: (maxMB: number) =>
    `파일 크기는 ${maxMB}MB를 초과할 수 없습니다`,
  INVALID_FILE_TYPE: "지원되지 않는 파일 형식입니다",

  // Journal 특화 에러
  JOURNAL_TITLE_REQUIRED: "일지 제목은 필수 입력 항목입니다",
  JOURNAL_CONTENT_REQUIRED: "일지 내용은 필수 입력 항목입니다",
  TASK_TEXT_REQUIRED: "할 일 내용은 필수 입력 항목입니다",
  PHOTO_REQUIRED: "최소 1개의 사진이 필요합니다",

  // 검색 및 필터
  SEARCH_TOO_LONG: "검색어는 100자를 초과할 수 없습니다",
  INVALID_DATE_RANGE: "시작 날짜는 종료 날짜보다 늦을 수 없습니다",
  INVALID_COMPLETION_RANGE: "최소 완료율은 최대 완료율보다 클 수 없습니다",
} as const;

/**
 * 공통 검증 스키마 팩토리 함수들
 */
export const createValidationSchemas = () => {
  // UUID 패턴 (더 관대한 검증)
  const uuid = () => z.string().min(1, ERROR_MESSAGES.REQUIRED);

  // 제한된 문자열
  const limitedString = (min: number = 1, max: number = 255) =>
    z
      .string()
      .min(min, ERROR_MESSAGES.STRING_TOO_SHORT(min))
      .max(max, ERROR_MESSAGES.STRING_TOO_LONG(max))
      .trim();

  // 선택적 제한된 문자열
  const optionalLimitedString = (max: number = 255) =>
    z.string().max(max, ERROR_MESSAGES.STRING_TOO_LONG(max)).trim().optional();

  // 양의 정수
  const positiveInteger = (min: number = 0, max?: number) => {
    let schema = z
      .number()
      .int(ERROR_MESSAGES.NUMBER_NOT_INTEGER)
      .min(min, ERROR_MESSAGES.NUMBER_TOO_SMALL(min));

    if (max !== undefined) {
      schema = schema.max(max, ERROR_MESSAGES.NUMBER_TOO_LARGE(max));
    }

    return schema;
  };

  // 제한된 배열
  const limitedArray = <T>(
    itemSchema: z.ZodSchema<T>,
    min: number = 1,
    max: number = 100,
  ) =>
    z
      .array(itemSchema)
      .min(min, ERROR_MESSAGES.ARRAY_TOO_SHORT(min))
      .max(max, ERROR_MESSAGES.ARRAY_TOO_LONG(max));

  // 날짜 범위 검증
  const dateRange = () =>
    z
      .object({
        from: z.date(),
        to: z.date(),
      })
      .refine((data) => data.from <= data.to, {
        message: ERROR_MESSAGES.INVALID_DATE_RANGE,
        path: ["from"],
      });

  // 숫자 범위 검증
  const numberRange = (min: number = 0, max: number = 100) =>
    z
      .object({
        min: z.number().min(min).max(max).optional(),
        max: z.number().min(min).max(max).optional(),
      })
      .refine(
        (data) => {
          if (data.min !== undefined && data.max !== undefined) {
            return data.min <= data.max;
          }
          return true;
        },
        {
          message: ERROR_MESSAGES.INVALID_COMPLETION_RANGE,
          path: ["min"],
        },
      );

  return {
    uuid,
    limitedString,
    optionalLimitedString,
    positiveInteger,
    limitedArray,
    dateRange,
    numberRange,
  };
};

/**
 * 검증 결과 포맷터
 */
export class ValidationFormatter {
  /**
   * Zod 에러를 사용자 친화적인 메시지로 변환
   */
  static formatZodError(error: z.ZodError): string[] {
    return error.errors.map((err) => {
      const field = err.path.join(".");
      const message = err.message;

      // 필드명이 있으면 포함하여 메시지 구성
      if (field) {
        return `${field}: ${message}`;
      }

      return message;
    });
  }

  /**
   * 단일 필드 에러 메시지 생성
   */
  static createFieldError(field: string, message: string): string {
    return `${field}: ${message}`;
  }

  /**
   * 복합 에러 메시지 생성 (여러 필드 에러를 하나로 합치기)
   */
  static combineErrors(errors: string[]): string {
    if (errors.length === 0) return "";
    if (errors.length === 1) return errors[0];

    return `다음 문제를 해결해주세요:\n${errors.map((err) => `• ${err}`).join("\n")}`;
  }
}

/**
 * 공통 정규표현식 패턴
 */
export const VALIDATION_PATTERNS = {
  // 한글, 영어, 숫자, 공백, 기본 특수문자만 허용
  SAFE_TEXT: /^[가-힣a-zA-Z0-9\s\-_.!?()]+$/,

  // 파일명 (영어, 숫자, 하이픈, 언더스코어, 점만 허용)
  FILENAME: /^[a-zA-Z0-9\-_.]+$/,

  // 태그 (한글, 영어, 숫자만 허용)
  TAG: /^[가-힣a-zA-Z0-9]+$/,

  // 색상 헥스 코드
  HEX_COLOR: /^#[0-9A-Fa-f]{6}$/,

  // 시간 형식 (HH:mm)
  TIME_FORMAT: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
} as const;

/**
 * 안전한 텍스트 검증
 */
export const validateSafeText = (text: string): boolean => {
  return VALIDATION_PATTERNS.SAFE_TEXT.test(text);
};

/**
 * 파일명 검증
 */
export const validateFileName = (fileName: string): boolean => {
  return VALIDATION_PATTERNS.FILENAME.test(fileName);
};

/**
 * 태그 검증
 */
export const validateTag = (tag: string): boolean => {
  return VALIDATION_PATTERNS.TAG.test(tag);
};

/**
 * 파일 크기 포맷터
 */
export const formatFileSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

/**
 * 비동기 검증 헬퍼
 */
export class AsyncValidator {
  /**
   * 지연 검증 (디바운싱)
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          resolve(func(...args));
        }, delay);
      });
    };
  }

  /**
   * 여러 검증을 병렬로 실행
   */
  static async validateParallel<T>(
    validators: Array<() => Promise<T>>,
  ): Promise<T[]> {
    return Promise.all(validators.map((validator) => validator()));
  }

  /**
   * 첫 번째 성공한 검증 결과 반환
   */
  static async validateRace<T>(
    validators: Array<() => Promise<T>>,
  ): Promise<T> {
    return Promise.race(validators.map((validator) => validator()));
  }
}

/**
 * 검증 에러 수집기
 */
export class ValidationErrorCollector {
  private errors: Array<{ field: string; message: string }> = [];

  /**
   * 에러 추가
   */
  addError(field: string, message: string): void {
    this.errors.push({ field, message });
  }

  /**
   * 조건부 에러 추가
   */
  addErrorIf(condition: boolean, field: string, message: string): void {
    if (condition) {
      this.addError(field, message);
    }
  }

  /**
   * 에러 여부 확인
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * 에러 목록 반환
   */
  getErrors(): Array<{ field: string; message: string }> {
    return [...this.errors];
  }

  /**
   * 포맷된 에러 메시지 반환
   */
  getFormattedErrors(): string {
    return ValidationFormatter.combineErrors(
      this.errors.map((err) =>
        ValidationFormatter.createFieldError(err.field, err.message),
      ),
    );
  }

  /**
   * 에러 초기화
   */
  clear(): void {
    this.errors = [];
  }
}

/**
 * 사전 정의된 검증 스키마들
 */
export const CommonSchemas = createValidationSchemas();
