import { z } from 'zod';

// Common validation patterns
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Base schemas
export const uuidSchema = z
  .string()
  .regex(UUID_REGEX, '유효하지 않은 UUID 형식입니다.');

export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, '페이지는 1 이상이어야 합니다.')
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100, '한 번에 최대 100개까지 조회할 수 있습니다.')
    .default(20),
});

export const sortSchema = z.object({
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Journal validation schemas
export const structuredJournalCreateSchema = z.object({
  category_id: uuidSchema,
  title: z
    .string()
    .min(1, '제목은 필수입니다.')
    .max(200, '제목은 200자 이하여야 합니다.')
    .trim(),
  task_completions: z
    .array(
      z.object({
        task_template_id: uuidSchema,
        is_completed: z.boolean(),
        completion_note: z
          .string()
          .max(500, '완료 메모는 500자 이하여야 합니다.')
          .optional()
          .nullable()
          .transform(val => val?.trim() || null),
      })
    )
    .min(1, '최소 하나의 태스크 완료 정보가 필요합니다.')
    .max(50, '한 번에 최대 50개의 태스크까지 처리할 수 있습니다.'),
  reflection: z
    .string()
    .max(1000, '성찰 내용은 1000자 이하여야 합니다.')
    .optional()
    .default('')
    .transform(val => val?.trim() || ''),
  is_public: z.boolean().default(false),
  journal_type: z.literal('structured'),
});

export const photoJournalCreateSchema = z.object({
  category_id: uuidSchema,
  title: z
    .string()
    .min(1, '제목은 필수입니다.')
    .max(200, '제목은 200자 이하여야 합니다.')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, '설명은 1000자 이하여야 합니다.')
    .optional()
    .default('')
    .transform(val => val?.trim() || ''),
  photo_descriptions: z
    .array(z.string().max(200, '사진 설명은 200자 이하여야 합니다.').optional())
    .max(10, '최대 10장의 사진까지 업로드할 수 있습니다.')
    .optional()
    .default([]),
  is_public: z.boolean().default(false),
  journal_type: z.literal('photo'),
});

export const journalUpdateSchema = z.object({
  title: z
    .string()
    .min(1, '제목은 필수입니다.')
    .max(200, '제목은 200자 이하여야 합니다.')
    .trim()
    .optional(),
  content: z
    .string()
    .max(2000, '내용은 2000자 이하여야 합니다.')
    .optional()
    .transform(val => val?.trim() || ''),
  is_public: z.boolean().optional(),
});

export const journalFilterSchema = z
  .object({
    student_id: uuidSchema.optional(),
    category_id: uuidSchema.optional(),
    journal_type: z.enum(['structured', 'photo', 'all']).default('all'),
    is_public: z.coerce.boolean().optional(),
    date_from: z.string().datetime().optional(),
    date_to: z.string().datetime().optional(),
    search: z.string().max(100, '검색어는 100자 이하여야 합니다.').optional(),
  })
  .merge(paginationSchema)
  .merge(sortSchema);

// Task template validation schemas
export const taskTemplateCreateSchema = z.object({
  category_id: uuidSchema,
  title: z
    .string()
    .min(1, '태스크 제목은 필수입니다.')
    .max(200, '태스크 제목은 200자 이하여야 합니다.')
    .trim(),
  description: z
    .string()
    .max(1000, '태스크 설명은 1000자 이하여야 합니다.')
    .optional()
    .transform(val => val?.trim() || ''),
  order_index: z
    .number()
    .int('순서는 정수여야 합니다.')
    .min(0, '순서는 0 이상이어야 합니다.')
    .max(1000, '순서는 1000 이하여야 합니다.'),
  is_required: z.boolean().default(true),
  difficulty_level: z.enum(['easy', 'medium', 'hard']).default('medium'),
  estimated_minutes: z
    .number()
    .int('예상 시간은 정수여야 합니다.')
    .min(1, '예상 시간은 1분 이상이어야 합니다.')
    .max(480, '예상 시간은 8시간(480분) 이하여야 합니다.')
    .optional(),
});

export const taskTemplateUpdateSchema = taskTemplateCreateSchema
  .omit({ category_id: true })
  .partial();

export const taskTemplateBulkUpdateSchema = z.object({
  tasks: z
    .array(
      z.object({
        id: uuidSchema.optional(), // Optional for new tasks
        title: z.string().min(1).max(200).trim(),
        description: z
          .string()
          .max(1000)
          .optional()
          .transform(val => val?.trim() || ''),
        order_index: z.number().int().min(0).max(1000),
        is_required: z.boolean().default(true),
        difficulty_level: z.enum(['easy', 'medium', 'hard']).default('medium'),
        estimated_minutes: z.number().int().min(1).max(480).optional(),
        _action: z.enum(['create', 'update', 'delete']).optional(), // For bulk operations
      })
    )
    .max(50, '한 번에 최대 50개의 태스크까지 처리할 수 있습니다.'),
});

// Category validation schemas
export const categoryCreateSchema = z.object({
  name: z
    .string()
    .min(1, '카테고리 이름은 필수입니다.')
    .max(100, '카테고리 이름은 100자 이하여야 합니다.')
    .trim(),
  description: z
    .string()
    .max(500, '카테고리 설명은 500자 이하여야 합니다.')
    .optional()
    .transform(val => val?.trim() || ''),
  template: z
    .string()
    .max(2000, '템플릿은 2000자 이하여야 합니다.')
    .optional()
    .transform(val => val?.trim() || ''),
  is_active: z.boolean().default(true),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, '유효하지 않은 색상 코드입니다.')
    .optional(),
  icon: z.string().max(50, '아이콘 이름은 50자 이하여야 합니다.').optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const categoryFilterSchema = z
  .object({
    is_active: z.coerce.boolean().optional(),
    search: z.string().max(100).optional(),
    created_by: uuidSchema.optional(),
  })
  .merge(paginationSchema)
  .merge(sortSchema);

// Assignment validation schemas
export const assignmentCreateSchema = z
  .object({
    student_ids: z
      .array(uuidSchema)
      .min(1, '최소 한 명의 학생을 선택해야 합니다.')
      .max(100, '한 번에 최대 100명까지 할당할 수 있습니다.'),
    category_ids: z
      .array(uuidSchema)
      .min(1, '최소 하나의 카테고리를 선택해야 합니다.')
      .max(20, '한 번에 최대 20개의 카테고리까지 할당할 수 있습니다.'),
    weekly_goal: z
      .number()
      .int('주간 목표는 정수여야 합니다.')
      .min(1, '주간 목표는 1 이상이어야 합니다.')
      .max(21, '주간 목표는 21 이하여야 합니다.'), // Max 3 per day
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    is_active: z.boolean().default(true),
  })
  .refine(
    data => {
      if (data.start_date && data.end_date) {
        return new Date(data.start_date) < new Date(data.end_date);
      }
      return true;
    },
    {
      message: '시작일은 종료일보다 이전이어야 합니다.',
      path: ['end_date'],
    }
  );

export const assignmentUpdateSchema = assignmentCreateSchema
  .omit({ student_ids: true, category_ids: true })
  .partial();

export const assignmentFilterSchema = z
  .object({
    student_id: uuidSchema.optional(),
    category_id: uuidSchema.optional(),
    is_active: z.coerce.boolean().optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  })
  .merge(paginationSchema)
  .merge(sortSchema);

// Comment validation schemas
export const commentCreateSchema = z.object({
  journal_id: uuidSchema,
  content: z
    .string()
    .min(1, '댓글 내용은 필수입니다.')
    .max(500, '댓글은 500자 이하여야 합니다.')
    .trim(),
  comment_type: z
    .enum(['advice', 'encouragement', 'question'])
    .default('encouragement'),
  parent_id: uuidSchema.optional(), // For nested comments
});

export const commentUpdateSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용은 필수입니다.')
    .max(500, '댓글은 500자 이하여야 합니다.')
    .trim(),
  comment_type: z.enum(['advice', 'encouragement', 'question']).optional(),
});

export const commentFilterSchema = z
  .object({
    journal_id: uuidSchema.optional(),
    author_id: uuidSchema.optional(),
    comment_type: z
      .enum(['advice', 'encouragement', 'question', 'all'])
      .default('all'),
    parent_id: uuidSchema.optional(),
  })
  .merge(paginationSchema)
  .merge(sortSchema);

// User validation schemas
export const userCreateSchema = z.object({
  email: z
    .string()
    .email('유효하지 않은 이메일 주소입니다.')
    .max(255, '이메일은 255자 이하여야 합니다.')
    .toLowerCase(),
  full_name: z
    .string()
    .min(1, '이름은 필수입니다.')
    .max(100, '이름은 100자 이하여야 합니다.')
    .trim(),
  role: z.enum(['admin', 'teacher', 'coach', 'student']).default('student'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .max(128, '비밀번호는 128자 이하여야 합니다.')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      '비밀번호는 영문과 숫자를 포함해야 합니다.'
    )
    .optional(),
});

export const userUpdateSchema = userCreateSchema
  .omit({ email: true, password: true })
  .partial()
  .extend({
    avatar_url: z.string().url('유효하지 않은 URL입니다.').optional(),
    bio: z.string().max(500, '자기소개는 500자 이하여야 합니다.').optional(),
  });

export const userFilterSchema = z
  .object({
    role: z
      .enum(['admin', 'teacher', 'coach', 'student', 'all'])
      .default('all'),
    search: z.string().max(100).optional(),
    is_active: z.coerce.boolean().optional(),
  })
  .merge(paginationSchema)
  .merge(sortSchema);

// Progress tracking schemas
export const progressFilterSchema = z
  .object({
    user_id: uuidSchema.optional(),
    category_id: uuidSchema.optional(),
    week_start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다.')
      .optional(),
    date_from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    date_to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .merge(paginationSchema)
  .merge(sortSchema);

// File upload schemas
export const fileUploadSchema = z.object({
  files: z
    .array(z.instanceof(File))
    .min(1, '최소 하나의 파일이 필요합니다.')
    .max(10, '최대 10개의 파일까지 업로드할 수 있습니다.'),
  category_id: uuidSchema.optional(),
  description: z.string().max(500).optional(),
});

// Notification schemas
export const notificationCreateSchema = z.object({
  user_id: uuidSchema,
  title: z
    .string()
    .min(1, '알림 제목은 필수입니다.')
    .max(100, '알림 제목은 100자 이하여야 합니다.')
    .trim(),
  message: z
    .string()
    .min(1, '알림 내용은 필수입니다.')
    .max(500, '알림 내용은 500자 이하여야 합니다.')
    .trim(),
  type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  action_url: z.string().url().optional(),
  expires_at: z.string().datetime().optional(),
});

export const notificationFilterSchema = z
  .object({
    user_id: uuidSchema.optional(),
    type: z.enum(['info', 'success', 'warning', 'error', 'all']).default('all'),
    is_read: z.coerce.boolean().optional(),
    date_from: z.string().datetime().optional(),
    date_to: z.string().datetime().optional(),
  })
  .merge(paginationSchema)
  .merge(sortSchema);

// Export all schema types for TypeScript
export type StructuredJournalCreateData = z.infer<
  typeof structuredJournalCreateSchema
>;
export type PhotoJournalCreateData = z.infer<typeof photoJournalCreateSchema>;
export type JournalUpdateData = z.infer<typeof journalUpdateSchema>;
export type JournalFilterData = z.infer<typeof journalFilterSchema>;

export type TaskTemplateCreateData = z.infer<typeof taskTemplateCreateSchema>;
export type TaskTemplateUpdateData = z.infer<typeof taskTemplateUpdateSchema>;
export type TaskTemplateBulkUpdateData = z.infer<
  typeof taskTemplateBulkUpdateSchema
>;

export type CategoryCreateData = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateData = z.infer<typeof categoryUpdateSchema>;
export type CategoryFilterData = z.infer<typeof categoryFilterSchema>;

export type AssignmentCreateData = z.infer<typeof assignmentCreateSchema>;
export type AssignmentUpdateData = z.infer<typeof assignmentUpdateSchema>;
export type AssignmentFilterData = z.infer<typeof assignmentFilterSchema>;

export type CommentCreateData = z.infer<typeof commentCreateSchema>;
export type CommentUpdateData = z.infer<typeof commentUpdateSchema>;
export type CommentFilterData = z.infer<typeof commentFilterSchema>;

export type UserCreateData = z.infer<typeof userCreateSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;
export type UserFilterData = z.infer<typeof userFilterSchema>;

export type ProgressFilterData = z.infer<typeof progressFilterSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;
export type NotificationCreateData = z.infer<typeof notificationCreateSchema>;
export type NotificationFilterData = z.infer<typeof notificationFilterSchema>;
