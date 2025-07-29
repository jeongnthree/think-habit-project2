/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen } from '@testing-library/react';
import PhotoJournalForm from '../PhotoJournalForm';

// Mock the hooks and utilities
jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn().mockReturnValue({
    isOnline: true,
    isSlowConnection: false,
    getRecommendedBehavior: jest.fn().mockReturnValue({
      reduceImageQuality: false,
      allowUploads: true,
      useOfflineMode: false,
      maxRetries: 3,
    }),
  }),
  useOfflineStorage: jest.fn().mockReturnValue([null, jest.fn()]),
}));

jest.mock('@/hooks/useFormValidation', () => ({
  useFormValidation: jest.fn().mockReturnValue({
    values: {
      photos: [],
      photo_descriptions: [],
      description: '',
      category_id: 'category-123',
      journal_type: 'photo',
    },
    isValid: true,
    isSubmitting: false,
    hasErrors: false,
    isDirty: false,
    setFieldValue: jest.fn(),
    setFieldError: jest.fn(),
    setFieldErrors: jest.fn(),
    getFieldProps: jest.fn().mockImplementation(fieldName => ({
      value: '',
      error: null,
      onChange: jest.fn(),
      onBlur: jest.fn(),
    })),
    submitForm: jest.fn(),
    resetForm: jest.fn(),
  }),
}));

jest.mock('@/utils', () => ({
  customValidationRules: {
    validateFileUpload: jest.fn().mockReturnValue({ isValid: true }),
  },
  getRecoveryStrategy: jest.fn().mockReturnValue({
    message: '다시 시도해주세요',
    shouldRetry: true,
  }),
  validatePhotoJournal: jest.fn().mockReturnValue({
    success: true,
    data: {},
    errors: {},
    fieldErrors: {},
  }),
}));

jest.mock('@/utils/imageUtils', () => ({
  compressImage: jest.fn().mockImplementation(file => Promise.resolve(file)),
  getOptimalImageFormat: jest.fn().mockReturnValue('image/jpeg'),
}));

// Mock ErrorMessage component
jest.mock('@/components/ui/ErrorMessage', () => ({
  ErrorMessage: ({ title, message, type, onRetry, showRetry }) => (
    <div data-testid={`error-message-${type}`}>
      <h3>{title}</h3>
      <p>{message}</p>
      {showRetry && onRetry && <button onClick={onRetry}>다시 시도</button>}
    </div>
  ),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));

// Mock next/image used in LazyImage
jest.mock('next/image', () => ({
  __esModule: true,
  default: props => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

// Mock LazyImage component
jest.mock('@/components/ui/LazyImage', () => ({
  __esModule: true,
  default: props => <img {...props} alt={props.alt} />,
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('PhotoJournalForm', () => {
  const mockProps = {
    categoryId: 'category-123',
    onSubmit: jest.fn().mockResolvedValue(undefined),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form correctly', () => {
    render(<PhotoJournalForm {...mockProps} />);

    expect(screen.getByText('사진 일지 작성')).toBeInTheDocument();
    expect(
      screen.getByText('사진을 드래그하여 놓거나 클릭하여 선택하세요')
    ).toBeInTheDocument();
    expect(screen.getByText('파일 선택')).toBeInTheDocument();
    expect(
      screen.getByText('전체 설명 및 성찰 (선택사항)')
    ).toBeInTheDocument();
    expect(screen.getByText('일지 제출')).toBeInTheDocument();
    expect(screen.getByText('취소')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<PhotoJournalForm {...mockProps} />);

    fireEvent.click(screen.getByText('취소'));

    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });
});
