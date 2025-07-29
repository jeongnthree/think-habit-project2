import { JournalForm } from '@/components/training/JournalForm';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Journal Creation Flow', () => {
  const mockCategory = {
    id: 'category1',
    name: '비판적 사고',
    description: '정보를 분석하고 평가하는 능력을 기르는 훈련',
    template:
      '오늘 접한 정보나 상황에 대해 다음 질문들을 생각해보세요:\n1. 이 정보의 출처는 신뢰할 만한가?\n2. 다른 관점에서는 어떻게 볼 수 있을까?',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockFetch.mockClear();
    mockOnSave.mockClear();
    mockOnCancel.mockClear();
    mockPush.mockClear();
  });

  it('completes journal creation flow successfully', async () => {
    const user = userEvent.setup();

    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'new-journal-id',
          title: 'Test Journal',
          content: 'Test content',
        },
      }),
    });

    render(
      <JournalForm
        category={mockCategory}
        studentId='user1'
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Check if template is loaded
    expect(
      screen.getByDisplayValue(/오늘 접한 정보나 상황에 대해/)
    ).toBeInTheDocument();

    // Fill in the title
    const titleInput = screen.getByLabelText(/제목/);
    await user.clear(titleInput);
    await user.type(titleInput, 'My Test Journal');

    // Fill in the content
    const contentTextarea = screen.getByLabelText(/내용/);
    await user.clear(contentTextarea);
    await user.type(contentTextarea, 'This is my test journal content.');

    // Set to public
    const publicCheckbox = screen.getByLabelText(/커뮤니티에 공개하기/);
    await user.click(publicCheckbox);

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /저장/ });
    await user.click(submitButton);

    // Wait for API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: 'user1',
          categoryId: 'category1',
          title: 'My Test Journal',
          content: 'This is my test journal content.',
          attachments: [],
          isPublic: true,
        }),
      });
    });

    // Check if onSave callback is called
    expect(mockOnSave).toHaveBeenCalled();
  });

  it('handles validation errors correctly', async () => {
    const user = userEvent.setup();

    render(
      <JournalForm
        category={mockCategory}
        studentId='user1'
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Clear required fields
    const titleInput = screen.getByLabelText(/제목/);
    await user.clear(titleInput);

    const contentTextarea = screen.getByLabelText(/내용/);
    await user.clear(contentTextarea);

    // Submit button should be disabled when fields are empty
    const submitButton = screen.getByRole('button', { name: /저장/ });
    expect(submitButton).toBeDisabled();

    // Add some content to enable button, then try to submit with only title
    await user.type(titleInput, 'Test Title');
    expect(submitButton).toBeDisabled(); // Still disabled because content is empty

    // Add content to enable button
    await user.type(contentTextarea, 'Test Content');
    expect(submitButton).not.toBeDisabled();

    // Clear title to test validation - button should be disabled again
    await user.clear(titleInput);
    expect(submitButton).toBeDisabled();

    // Add title back and clear content to test content validation
    await user.type(titleInput, 'Test Title');
    await user.clear(contentTextarea);
    expect(submitButton).toBeDisabled();

    // API should not be called
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();

    // Mock API error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Server error occurred',
      }),
    });

    render(
      <JournalForm
        category={mockCategory}
        studentId='user1'
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Fill in required fields
    const titleInput = screen.getByLabelText(/제목/);
    await user.type(titleInput, 'Test Journal');

    const contentTextarea = screen.getByLabelText(/내용/);
    await user.type(contentTextarea, 'Test content');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /저장/ });
    await user.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Server error occurred/)).toBeInTheDocument();
    });

    // onSave should not be called on error
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('handles cancel action correctly', async () => {
    const user = userEvent.setup();

    render(
      <JournalForm
        category={mockCategory}
        studentId='user1'
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /취소/ });
    await user.click(cancelButton);

    // Check if onCancel callback is called
    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
