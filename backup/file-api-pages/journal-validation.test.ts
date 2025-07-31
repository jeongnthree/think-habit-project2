import {
    customValidationRules,
    validatePhotoJournal,
    validateStructuredJournal,
    validateTaskTemplate
} from '../journal-validation';

describe('Journal Validation', () => {
  describe('Structured Journal Validation', () => {
    const validStructuredJournal = {
      title: '테스트 일지',
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      journal_type: 'structured' as const,
      task_completions: [
        {
          task_template_id: '123e4567-e89b-12d3-a456-426614174001',
          is_completed: true,
          completion_note: '완료했습니다',
        },
      ],
      reflection: '오늘의 성찰',
      is_public: false,
    };

    it('validates correct structured journal', () => {
      const result = validateStructuredJournal(validStructuredJournal);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toEqual({});
    });

    it('requires title', () => {
      const invalid = { ...validStructuredJournal, title: '' };
      const result = validateStructuredJournal(invalid);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors.title).toContain('제목을 입력해주세요');
    });

    it('limits title length', () => {
      const invalid = { ...validStructuredJournal, title: 'a'.repeat(201) };
      const result = validateStructuredJournal(invalid);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors.title).toContain('200자 이하');
    });

    it('requires valid category UUID', () => {
      const invalid = { ...validStructuredJournal, category_id: 'invalid-uuid' };
      const result = validateStructuredJournal(invalid);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors.category_id).toContain('유효하지 않은 카테고리 ID');
    });

    it('requires at least one task completion', () => {
      const invalid = { ...validStructuredJournal, task_completions: [] };
      const result = validateStructuredJournal(invalid);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors.task_completions).toContain('최소 하나의 태스크');
    });

    it('requires at least one completed task', () => {
      const invalid = {
        ...validStructuredJournal,
        task_completions: [
          {
            task_template_id: '123e4567-e89b-12d3-a456-426614174001',
            is_completed: false,
            completion_note: '',
          },
        ],
      };
      const result = validateStructuredJournal(invalid);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors.task_completions).toContain('최소 하나의 태스크를 완료');
    });

    it('validates task completion note length', () => {
      const invalid = {
        ...validStructuredJournal,
        task_completions: [
          {
            task_template_id: '123e4567-e89b-12d3-a456-426614174001',
            is_completed: true,
            completion_note: 'a'.repeat(501),
          },
        ],
      };
      const result = validateStructuredJournal(invalid);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors['task_completions.0.completion_note']).toContain('500자 이하');
    });

    it('validates reflection length', () => {
      const invalid = { ...validStructuredJournal, reflection: 'a'.repeat(1001) };
      const result = validateStructuredJournal(invalid);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors.reflection).toContain('1000자 이하');
    });

    it('trims whitespace from strings', () => {
      const withWhitespace = {
        ...validStructuredJournal,
        title: '  테스트 일지  ',
        reflection: '  성찰 내용  ',
      };
      const result = validateStructuredJournal(withWhitespace);
      
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('테스트 일지');
      expect(result.data?.reflection).toBe('성찰 내용');
    });
  });

  describe('Photo Journal Validation', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }); // 1MB

    const validPhotoJournal = {
      title: '사진 일지',
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      journal_type: 'photo' as const,
      photos: [mockFile],
      photo_descriptions: ['사진 설명'],
      description: '전체 설명',
      is_public: false,
    };

    it('validates correct photo journal', () => {
      const result = validatePhotoJournal(validPhotoJournal);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('requires at least one photo', () => {
      const invalid = { ...validPhotoJournal, photos: [] };
      const result = validatePhotoJournal(invalid);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors.photos).toContain('최소 1장의 사진');
    });

    it('limits maximum photos', () => {
      const manyPhotos = Array(11).fill(mockFile);
      const invalid = { ...validPhotoJournal, photos: manyPhotos };
      const result = validatePhotoJournal(invalid);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors.photos).toContain('최대 10장');
    });

    it('validates file types', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const invalid = { ...validPhotoJournal, photos: [invalidFile] };
      const result = validatePhotoJournal(invalid);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors.photos).toContain('JPG, PNG, HEIC, WebP');
    });

    it('validates file sizes', () => {
      const largeFile = new File(['test'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 }); // 15MB
      
      const invalid = { ...validPhotoJournal, photos: [largeFile] };
      const result = validatePhotoJournal(invalid);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors.photos).toContain('10MB 이하');
    });

    it('validates photo description length', () => {
      const invalid = {
        ...validPhotoJournal,
        photo_descriptions: ['a'.repeat(201)],
      };
      const result = validatePhotoJournal(invalid);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors['photo_descriptions.0']).toContain('200자 이하');
    });

    it('validates overall description length', () => {
      const invalid = { ...validPhotoJournal, description: 'a'.repeat(1001) };
      const result = validatePhotoJournal(invalid);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors.description).toContain('1000자 이하');
    });
  });

  describe('Task Template Validation', () => {
    const validTaskTemplate = {
      title: '태스크 제목',
      description: '태스크 설명',
      order_index: 0,
      is_required: true,
      difficulty_level: 'medium' as const,
      estimated_minutes: 30,
    };

    it('validates correct task template', () => {
      const result = validateTaskTemplate(validTaskTemplate);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('requires title', () => {
      const invalid = { ...validTaskTemplate, title: '' };
      const result = validateTaskTemplate(invalid);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors.title).toContain('태스크 제목을 입력');
    });

    it('limits title length', () => {
      const invalid = { ...validTaskTemplate, title: 'a'.repeat(201) };
      const result = validateTaskTemplate(invalid);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors.title).toContain('200자 이하');
    });

    it('validates order index', () => {
      const invalid = { ...validTaskTemplate, order_index: -1 };
      const result = validateTaskTemplate(invalid);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors.order_index).toContain('0 이상');
    });

    it('validates difficulty level', () => {
      const invalid = { ...validTaskTemplate, difficulty_level: 'invalid' as any };
      const result = validateTaskTemplate(invalid);
      
      expect(result.success).toBe(false);
      expect(result.errors.difficulty_level).toBeDefined();
    });

    it('validates estimated minutes range', () => {
      const tooLong = { ...validTaskTemplate, estimated_minutes: 500 };
      const result = validateTaskTemplate(tooLong);
      
      expect(result.success).toBe(false);
      expect(result.fieldErrors.estimated_minutes).toContain('480분');
    });

    it('sets default values', () => {
      const minimal = {
        title: '최소 태스크',
        order_index: 0,
      };
      const result = validateTaskTemplate(minimal);
      
      expect(result.success).toBe(true);
      expect(result.data?.is_required).toBe(true);
      expect(result.data?.difficulty_level).toBe('medium');
    });
  });

  describe('Custom Validation Rules', () => {
    describe('validateRequiredTasks', () => {
      const taskTemplates = [
        { id: 'task1', is_required: true },
        { id: 'task2', is_required: false },
        { id: 'task3', is_required: true },
      ];

      it('passes when all required tasks are completed', () => {
        const taskCompletions = [
          { task_template_id: 'task1', is_completed: true },
          { task_template_id: 'task2', is_completed: false },
          { task_template_id: 'task3', is_completed: true },
        ];
        
        const result = customValidationRules.validateRequiredTasks(
          taskCompletions,
          taskTemplates
        );
        
        expect(result.isValid).toBe(true);
      });

      it('fails when required tasks are missing', () => {
        const taskCompletions = [
          { task_template_id: 'task1', is_completed: true },
          { task_template_id: 'task2', is_completed: false },
          { task_template_id: 'task3', is_completed: false },
        ];
        
        const result = customValidationRules.validateRequiredTasks(
          taskCompletions,
          taskTemplates
        );
        
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('필수 태스크');
        expect(result.message).toContain('1/2');
      });
    });

    describe('validateFileUpload', () => {
      it('validates correct image file', () => {
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
        
        const result = customValidationRules.validateFileUpload(file);
        
        expect(result.isValid).toBe(true);
      });

      it('rejects invalid file type', () => {
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        
        const result = customValidationRules.validateFileUpload(file);
        
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('JPG, PNG, HEIC, WebP');
      });

      it('rejects oversized file', () => {
        const file = new File(['test'], 'large.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 }); // 15MB
        
        const result = customValidationRules.validateFileUpload(file);
        
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('10MB 이하');
      });
    });

    describe('validateContent', () => {
      it('allows meaningful content', () => {
        const content = '오늘은 좋은 하루였습니다. 많은 것을 배웠어요.';
        
        const result = customValidationRules.validateContent(content);
        
        expect(result.isValid).toBe(true);
      });

      it('allows empty content', () => {
        const result = customValidationRules.validateContent('');
        
        expect(result.isValid).toBe(true);
      });

      it('rejects repetitive content', () => {
        const content = '테스트 테스트 테스트 테스트 테스트 테스트 테스트 테스트 테스트 테스트 테스트';
        
        const result = customValidationRules.validateContent(content);
        
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('의미 있는 내용');
      });
    });
  });

  describe('Schema edge cases', () => {
    it('handles undefined values gracefully', () => {
      const result = validateStructuredJournal(undefined);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('handles null values gracefully', () => {
      const result = validatePhotoJournal(null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('handles non-object values', () => {
      const result = validateTaskTemplate('not an object');
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('transforms optional fields correctly', () => {
      const journal = {
        title: '  제목  ',
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        journal_type: 'structured' as const,
        task_completions: [
          {
            task_template_id: '123e4567-e89b-12d3-a456-426614174001',
            is_completed: true,
            completion_note: '  메모  ',
          },
        ],
        reflection: '  성찰  ',
        is_public: false,
      };
      
      const result = validateStructuredJournal(journal);
      
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('제목');
      expect(result.data?.reflection).toBe('성찰');
      expect(result.data?.task_completions?.[0]?.completion_note).toBe('메모');
    });
  });
});