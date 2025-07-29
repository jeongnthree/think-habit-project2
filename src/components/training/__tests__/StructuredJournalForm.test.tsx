import { Category, TaskTemplate } from '@/types/database';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StructuredJournalForm } from '../StructuredJournalForm';

// Mock dependencies
jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: true,
    isSlowConnection: false,
    getRecommendedBehavior: () => ({
      allowAutoSave: true,
      allowUploads: true,
      reduceImageQuality: false,
    }),
  }),
}));

jest.mock('@/hooks/useOfflineStorage', () => ({
  useOfflineStorage: () => [null, jest.fn()],
}));

jest.mock('@/hooks/useFormValidation', () => ({
  useFormValidation: ({ initialValues }: any) => ({
    values: initialValues,
    isValid: true,
    isSubmitting: false,
    hasErrors: false,
    isDirty: false,
    setFieldValue: jest.fn(),
    setFieldError: jest.fn(),
    setFieldErrors: jest.fn(),
    getFieldProps: (field: string) => ({
      value: initialValues[field] || '',
      error: null,
    }),
    submitForm: jest.fn(),
    resetForm: jest.fn(),
  }),
}));

jest.mock('@/utils/journal-validation', () => ({
  validateStructuredJournal: () => ({
    success: true,
    data: {},
    fieldErrors: {},
  }),
}));

jest.mock('@/utils/error-recovery', () => ({
  getRecoveryStrategy: () => ({
    message: 'Test error message',
  }),
  submitFormWithRetry: jest.fn(),
}));

const mockCategory: Category & { task_templates: TaskTemplate[] } = {
  id: 'cat-1',
  name: '테스트 카테고리',
  description: '테스트용 카테고리입니다',
  template: '테스트 템플릿',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  task_templates: [
    {
      id: 'task-1',
      category_id: 'cat-1',
      title: '첫 번째 태스크',
      description: '첫 번째 태스크 설명',
      order_index: 0,
      is_required: true,
      difficulty_level: 'easy',
      estimated_minutes: 10,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'task-2',
      category_id: 'cat-1',
      title: '두 번째 태스크',
      description: '두 번째 태스크 설명',
      order_index: 1,
      is_required: false,
      difficulty_level: 'medium',
      estimated_minutes: 20,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
};

const defaultProps = {
  category: mockCategory,
  studentId: 'student-1',
  onSave: jest.fn(),
  onCancel: jest.fn(),
};

describe('StructuredJournalForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with category information', () => {
    render(<StructuredJournalForm {...defaultProps} />);
    
    expect(screen.getByText('📋 구조화된 일지 작성')).toBeInTheDocument();
    expect(screen.getByText(/테스트 카테고리 - 체크리스트를 완료하며/)).toBeInTheDocument();
  });

  it('displays task templates as checkboxes', () => {
    render(<StructuredJournalForm {...defaultProps} />);
    
    expect(screen.getByText('1. 첫 번째 태스크')).toBeInTheDocument();
    expect(screen.getByText('2. 두 번째 태스크')).toBeInTheDocument();
    expect(screen.getByText('필수')).toBeInTheDocument();
    expect(screen.getByText('쉬움')).toBeInTheDocument();
    expect(screen.getByText('보통')).toBeInTheDocument();
  });

  it('shows progress indicator', () => {
    render(<StructuredJournalForm {...defaultProps} />);
    
    expect(screen.getByText('훈련 진행률')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('완료: 0/2 태스크')).toBeInTheDocument();
  });

  it('allows task completion', async () => {
    const user = userEvent.setup();
    render(<StructuredJournalForm {...defaultProps} />);
    
    const firstTaskCheckbox = screen.getByLabelText('1. 첫 번째 태스크');
    await user.click(firstTaskCheckbox);
    
    // Should show confirmation modal for task completion
    expect(screen.getByText('태스크 완료 확인')).toBeInTheDocument();
  });

  it('allows adding completion notes', async () => {
    const user = userEvent.setup();
    render(<StructuredJournalForm {...defaultProps} />);
    
    const noteTextarea = screen.getAllByPlaceholderText(/이 태스크를 어떻게 완료했는지/)[0];
    await user.type(noteTextarea, '테스트 완료 메모');
    
    expect(noteTextarea).toHaveValue('테스트 완료 메모');
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<StructuredJournalForm {...defaultProps} />);
    
    const titleInput = screen.getByPlaceholderText('일지 제목을 입력하세요');
    await user.clear(titleInput);
    
    const submitButton = screen.getByText('💾 일지 저장');
    await user.click(submitButton);
    
    // Should show validation error
    expect(screen.getByText('제목을 입력해주세요.')).toBeInTheDocument();
  });

  it('shows reflection textarea', () => {
    render(<StructuredJournalForm {...defaultProps} />);
    
    const reflectionTextarea = screen.getByPlaceholderText(/오늘의 훈련을 통해 느낀 점/);
    expect(reflectionTextarea).toBeInTheDocument();
  });

  it('has privacy settings', () => {
    render(<StructuredJournalForm {...defaultProps} />);
    
    expect(screen.getByText('🔒 나만 보기')).toBeInTheDocument();
    expect(screen.getByText('🌍 커뮤니티에 공개')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    render(<StructuredJournalForm {...defaultProps} onCancel={onCancel} />);
    
    const cancelButton = screen.getByText('취소');
    await user.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows auto-save status', () => {
    render(<StructuredJournalForm {...defaultProps} />);
    
    // Should show auto-save related text
    expect(screen.getByText(/자동 저장/)).toBeInTheDocument();
  });

  it('displays category template guide', () => {
    render(<StructuredJournalForm {...defaultProps} />);
    
    expect(screen.getByText('📝 테스트 카테고리 훈련 가이드')).toBeInTheDocument();
    expect(screen.getByText('테스트 템플릿')).toBeInTheDocument();
  });

  it('shows motivational messages based on progress', () => {
    render(<StructuredJournalForm {...defaultProps} />);
    
    // Should show initial motivational message
    expect(screen.getByText('🎯 좋은 시작입니다!')).toBeInTheDocument();
  });

  it('handles offline mode', () => {
    // Mock offline state
    jest.mocked(require('@/hooks/useNetworkStatus').useNetworkStatus).mockReturnValue({
      isOnline: false,
      isSlowConnection: false,
      getRecommendedBehavior: () => ({
        allowAutoSave: false,
        allowUploads: false,
        reduceImageQuality: true,
      }),
    });

    render(<StructuredJournalForm {...defaultProps} />);
    
    expect(screen.getByText('오프라인 모드')).toBeInTheDocument();
    expect(screen.getByText('📱 오프라인 저장')).toBeInTheDocument();
  });

  it('shows task difficulty and time estimates', () => {
    render(<StructuredJournalForm {...defaultProps} />);
    
    expect(screen.getByText('~10분')).toBeInTheDocument();
    expect(screen.getByText('~20분')).toBeInTheDocument();
  });

  it('updates progress in real-time', async () => {
    const user = userEvent.setup();
    
    // Mock form validation to simulate task completion
    const mockSetFieldValue = jest.fn();
    jest.mocked(require('@/hooks/useFormValidation').useFormValidation).mockReturnValue({
      values: {
        title: '테스트 제목',
        task_completions: [
          { task_template_id: 'task-1', is_completed: true, completion_note: '' },
          { task_template_id: 'task-2', is_completed: false, completion_note: '' },
        ],
        reflection: '',
        is_public: false,
        category_id: 'cat-1',
        journal_type: 'structured',
      },
      isValid: true,
      isSubmitting: false,
      hasErrors: false,
      isDirty: true,
      setFieldValue: mockSetFieldValue,
      setFieldError: jest.fn(),
      setFieldErrors: jest.fn(),
      getFieldProps: (field: string) => ({ value: '', error: null }),
      submitForm: jest.fn(),
      resetForm: jest.fn(),
    });

    render(<StructuredJournalForm {...defaultProps} />);
    
    // Should show updated progress
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('완료: 1/2 태스크')).toBeInTheDocument();
  });
});