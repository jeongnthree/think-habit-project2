// Mock for @/utils/journal-validation
export const validateStructuredJournal = jest.fn().mockReturnValue({
  success: true,
  data: {
    title: '테스트 일지',
    category_id: '123e4567-e89b-12d3-a456-426614174000',
    journal_type: 'structured',
    task_completions: [
      {
        task_template_id: '123e4567-e89b-12d3-a456-426614174001',
        is_completed: true,
        completion_note: '완료했습니다',
      },
    ],
    reflection: '오늘의 성찰',
    is_public: false,
  },
  errors: {},
  fieldErrors: {},
});

export const validatePhotoJournal = jest.fn().mockReturnValue({
  success: true,
  data: {
    title: '사진 일지',
    category_id: '123e4567-e89b-12d3-a456-426614174000',
    journal_type: 'photo',
    photos: [],
    photo_descriptions: ['사진 설명'],
    description: '전체 설명',
    is_public: false,
  },
  errors: {},
  fieldErrors: {},
});

export const validateTaskTemplate = jest.fn().mockReturnValue({
  success: true,
  data: {
    title: '태스크 제목',
    description: '태스크 설명',
    order_index: 0,
    is_required: true,
    difficulty_level: 'medium',
    estimated_minutes: 30,
  },
  errors: {},
  fieldErrors: {},
});

export const customValidationRules = {
  validateRequiredTasks: jest.fn().mockReturnValue({ isValid: true }),
  validateFileUpload: jest.fn().mockReturnValue({ isValid: true }),
  validateContent: jest.fn().mockReturnValue({ isValid: true }),
};
