import { z } from 'zod';

// Base journal validation schema
export const baseJournalSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요.')
    .max(200, '제목은 200자 이하로 입력해주세요.')
    .trim(),
  category_id: z.string().uuid('유효하지 않은 카테고리 ID입니다.'),
  is_public: z.boolean().default(false),
});

// Structured journal validation schema
export const structuredJournalSchema = baseJournalSchema.extend({
  journal_type: z.literal('structured'),
  task_completions: z
    .array(
      z.object({
        task_template_id: z.string().uuid('유효하지 않은 태스크 ID입니다.'),
        is_completed: z.boolean(),
        completion_note: z
          .string()
          .max(500, '완료 메모는 500자 이하로 입력해주세요.')
          .optional()
          .transform(val => val?.trim() || ''),
      })
    )
    .min(1, '최소 하나의 태스크가 필요합니다.')
    .refine(
      completions => {
        // At least one task should be completed
        return completions.some(tc => tc.is_completed);
      },
      {
        message: '최소 하나의 태스크를 완료해주세요.',
      }
    ),
  reflection: z
    .string()
    .max(1000, '성찰 내용은 1000자 이하로 입력해주세요.')
    .optional()
    .transform(val => val?.trim() || ''),
});

// Photo journal validation schema
export const photoJournalSchema = baseJournalSchema.extend({
  journal_type: z.literal('photo'),
  photos: z
    .array(z.instanceof(File))
    .min(1, '최소 1장의 사진을 업로드해주세요.')
    .max(10, '최대 10장까지 업로드할 수 있습니다.')
    .refine(
      files => {
        // Check file types
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/heic',
          'image/webp',
        ];
        return files.every(file => allowedTypes.includes(file.type));
      },
      {
        message: '지원되는 이미지 형식: JPG, PNG, HEIC, WebP',
      }
    )
    .refine(
      files => {
        // Check file sizes (10MB each)
        const maxSize = 10 * 1024 * 1024;
        return files.every(file => file.size <= maxSize);
      },
      {
        message: '각 파일의 크기는 10MB 이하여야 합니다.',
      }
    ),
  photo_descriptions: z
    .array(
      z.string().max(200, '사진 설명은 200자 이하로 입력해주세요.').optional()
    )
    .optional(),
  description: z
    .string()
    .max(1000, '전체 설명은 1000자 이하로 입력해주세요.')
    .optional()
    .transform(val => val?.trim() || ''),
});

// Task template validation schema
export const taskTemplateSchema = z.object({
  title: z
    .string()
    .min(1, '태스크 제목을 입력해주세요.')
    .max(200, '태스크 제목은 200자 이하로 입력해주세요.')
    .trim(),
  description: z
    .string()
    .max(1000, '태스크 설명은 1000자 이하로 입력해주세요.')
    .optional()
    .transform(val => val?.trim() || ''),
  order_index: z
    .number()
    .int('순서는 정수여야 합니다.')
    .min(0, '순서는 0 이상이어야 합니다.'),
  is_required: z.boolean().default(true),
  difficulty_level: z.enum(['easy', 'medium', 'hard']).default('medium'),
  estimated_minutes: z
    .number()
    .int('예상 시간은 정수여야 합니다.')
    .min(1, '예상 시간은 1분 이상이어야 합니다.')
    .max(480, '예상 시간은 8시간(480분) 이하여야 합니다.')
    .optional(),
});

// Journal edit validation schema
export const journalEditSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요.')
    .max(200, '제목은 200자 이하로 입력해주세요.')
    .trim(),
  is_public: z.boolean(),
  // Additional fields based on journal type will be validated separately
});

// Validation result types
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: Record<string, string[]>;
  fieldErrors: Record<string, string>;
}

// Validation helper functions
export function validateStructuredJournal(
  data: unknown
): ValidationResult<z.infer<typeof structuredJournalSchema>> {
  try {
    const result = structuredJournalSchema.parse(data);
    return {
      success: true,
      data: result,
      errors: {},
      fieldErrors: {},
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      const fieldErrors: Record<string, string> = {};

      error.issues.forEach(err => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
        fieldErrors[path] = err.message; // Use first error for field-level display
      });

      return {
        success: false,
        errors,
        fieldErrors,
      };
    }

    return {
      success: false,
      errors: { general: ['검증 중 오류가 발생했습니다.'] },
      fieldErrors: { general: '검증 중 오류가 발생했습니다.' },
    };
  }
}

export function validatePhotoJournal(
  data: unknown
): ValidationResult<z.infer<typeof photoJournalSchema>> {
  try {
    const result = photoJournalSchema.parse(data);
    return {
      success: true,
      data: result,
      errors: {},
      fieldErrors: {},
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      const fieldErrors: Record<string, string> = {};

      error.issues.forEach(err => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
        fieldErrors[path] = err.message;
      });

      return {
        success: false,
        errors,
        fieldErrors,
      };
    }

    return {
      success: false,
      errors: { general: ['검증 중 오류가 발생했습니다.'] },
      fieldErrors: { general: '검증 중 오류가 발생했습니다.' },
    };
  }
}

export function validateTaskTemplate(
  data: unknown
): ValidationResult<z.infer<typeof taskTemplateSchema>> {
  try {
    const result = taskTemplateSchema.parse(data);
    return {
      success: true,
      data: result,
      errors: {},
      fieldErrors: {},
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      const fieldErrors: Record<string, string> = {};

      error.issues.forEach(err => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
        fieldErrors[path] = err.message;
      });

      return {
        success: false,
        errors,
        fieldErrors,
      };
    }

    return {
      success: false,
      errors: { general: ['검증 중 오류가 발생했습니다.'] },
      fieldErrors: { general: '검증 중 오류가 발생했습니다.' },
    };
  }
}

// Custom validation rules
export const customValidationRules = {
  // Check if required tasks are completed
  validateRequiredTasks: (
    taskCompletions: Array<{ task_template_id: string; is_completed: boolean }>,
    taskTemplates: Array<{ id: string; is_required: boolean }>
  ): { isValid: boolean; message?: string } => {
    const requiredTasks = taskTemplates.filter(task => task.is_required);
    const completedRequiredTasks = taskCompletions.filter(tc => {
      const task = taskTemplates.find(t => t.id === tc.task_template_id);
      return task?.is_required && tc.is_completed;
    });

    if (requiredTasks.length > completedRequiredTasks.length) {
      return {
        isValid: false,
        message: `필수 태스크를 모두 완료해주세요. (${completedRequiredTasks.length}/${requiredTasks.length})`,
      };
    }

    return { isValid: true };
  },

  // Validate file upload constraints
  validateFileUpload: (file: File): { isValid: boolean; message?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/heic',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        message: '지원되는 이미지 형식: JPG, PNG, HEIC, WebP',
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        message: '파일 크기는 10MB 이하여야 합니다.',
      };
    }

    return { isValid: true };
  },

  // Validate text content for inappropriate content
  validateContent: (
    content: string
  ): { isValid: boolean; message?: string } => {
    // Basic content validation - can be extended with more sophisticated checks
    if (content.trim().length === 0) {
      return { isValid: true }; // Empty content is allowed for optional fields
    }

    // Check for excessive repetition
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 10 && uniqueWords.size / words.length < 0.3) {
      return {
        isValid: false,
        message: '의미 있는 내용을 작성해주세요.',
      };
    }

    return { isValid: true };
  },
};

// Export types
export type StructuredJournalData = z.infer<typeof structuredJournalSchema>;
export type PhotoJournalData = z.infer<typeof photoJournalSchema>;
export type TaskTemplateData = z.infer<typeof taskTemplateSchema>;
export type JournalEditData = z.infer<typeof journalEditSchema>;
