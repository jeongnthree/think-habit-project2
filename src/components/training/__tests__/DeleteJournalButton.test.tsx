import { JournalWithDetails } from '@/types/database';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { DeleteJournalButton } from '../DeleteJournalButton';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockRouter = {
  push: jest.fn(),
};

const mockJournal: JournalWithDetails = {
  id: 'test-journal-id',
  title: 'Test Journal',
  content: 'Test content',
  student_id: 'student-1',
  category_id: 'category-1',
  journal_type: 'structured',
  is_public: false,
  deleted_at: null,
  deleted_by: null,
  attachments: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  category: {
    id: 'category-1',
    name: 'Test Category',
    description: 'Test description',
    template: null,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  student: {
    id: 'student-1',
    user_id: 'user-1',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'student',
    avatar_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  comments_count: 0,
};

describe('DeleteJournalButton', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (fetch as jest.Mock).mockClear();
    mockRouter.push.mockClear();
  });

  it('renders delete button correctly', () => {
    render(<DeleteJournalButton journal={mockJournal} />);

    const deleteButton = screen.getByRole('button', { name: /삭제/i });
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveTextContent('삭제');
  });

  it('renders permanent delete button when permanent prop is true', () => {
    render(<DeleteJournalButton journal={mockJournal} permanent={true} />);

    const deleteButton = screen.getByRole('button', { name: /영구 삭제/i });
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveTextContent('영구 삭제');
  });

  it('shows confirmation modal when delete button is clicked', () => {
    render(<DeleteJournalButton journal={mockJournal} />);

    const deleteButton = screen.getByRole('button', { name: /삭제/i });
    fireEvent.click(deleteButton);

    expect(screen.getByText('일지 삭제 확인')).toBeInTheDocument();
    expect(screen.getByText('"Test Journal"')).toBeInTheDocument();
    expect(screen.getByText(/휴지통으로 이동되며/)).toBeInTheDocument();
  });

  it('shows permanent delete confirmation when permanent is true', () => {
    render(<DeleteJournalButton journal={mockJournal} permanent={true} />);

    const deleteButton = screen.getByRole('button', { name: /영구 삭제/i });
    fireEvent.click(deleteButton);

    expect(screen.getByText('영구 삭제 확인')).toBeInTheDocument();
    expect(screen.getByText('영구 삭제 경고')).toBeInTheDocument();
    expect(screen.getByText(/되돌릴 수 없습니다/)).toBeInTheDocument();
  });

  it('calls delete API when confirmed', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    });

    render(<DeleteJournalButton journal={mockJournal} />);

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /삭제/i });
    fireEvent.click(deleteButton);

    // Confirm deletion - get all buttons and find the confirm one
    const confirmButtons = screen.getAllByRole('button', { name: '삭제' });
    const confirmButton =
      confirmButtons.find(
        btn => btn.closest('[role="dialog"]') || btn.closest('.fixed')
      ) || confirmButtons[1]; // fallback to second button
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/training/journals/test-journal-id',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ permanent: false }),
        }
      );
    });
  });

  it('calls permanent delete API when permanent is true', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    });

    render(<DeleteJournalButton journal={mockJournal} permanent={true} />);

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /영구 삭제/i });
    fireEvent.click(deleteButton);

    // Confirm deletion - get all buttons and find the confirm one
    const confirmButtons = screen.getAllByRole('button', { name: '영구 삭제' });
    const confirmButton =
      confirmButtons.find(
        btn => btn.closest('[role="dialog"]') || btn.closest('.fixed')
      ) || confirmButtons[1]; // fallback to second button
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/training/journals/test-journal-id',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ permanent: true }),
        }
      );
    });
  });

  it('redirects to journals page after successful deletion', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    });

    render(<DeleteJournalButton journal={mockJournal} />);

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /삭제/i });
    fireEvent.click(deleteButton);

    // Confirm deletion - get all buttons and find the confirm one
    const confirmButtons = screen.getAllByRole('button', { name: '삭제' });
    const confirmButton =
      confirmButtons.find(
        btn => btn.closest('[role="dialog"]') || btn.closest('.fixed')
      ) || confirmButtons[1]; // fallback to second button
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/training/journals?deleted=true&type=soft'
      );
    });
  });

  it('calls onDeleted callback when provided', async () => {
    const onDeleted = jest.fn();
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    });

    render(<DeleteJournalButton journal={mockJournal} onDeleted={onDeleted} />);

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /삭제/i });
    fireEvent.click(deleteButton);

    // Confirm deletion - get all buttons and find the confirm one
    const confirmButtons = screen.getAllByRole('button', { name: '삭제' });
    const confirmButton =
      confirmButtons.find(
        btn => btn.closest('[role="dialog"]') || btn.closest('.fixed')
      ) || confirmButtons[1]; // fallback to second button
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalled();
    });
  });

  it('shows error message when deletion fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: false, error: 'Deletion failed' }),
    });

    render(<DeleteJournalButton journal={mockJournal} />);

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /삭제/i });
    fireEvent.click(deleteButton);

    // Confirm deletion - get all buttons and find the confirm one
    const confirmButtons = screen.getAllByRole('button', { name: '삭제' });
    const confirmButton =
      confirmButtons.find(
        btn => btn.closest('[role="dialog"]') || btn.closest('.fixed')
      ) || confirmButtons[1]; // fallback to second button
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Deletion failed')).toBeInTheDocument();
    });
  });

  it('closes modal when cancel is clicked', () => {
    render(<DeleteJournalButton journal={mockJournal} />);

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /삭제/i });
    fireEvent.click(deleteButton);

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: '취소' });
    fireEvent.click(cancelButton);

    expect(screen.queryByText('일지 삭제 확인')).not.toBeInTheDocument();
  });

  it('renders as icon variant when specified', () => {
    render(<DeleteJournalButton journal={mockJournal} variant='icon' />);

    const deleteButton = screen.getByRole('button');
    expect(deleteButton).toBeInTheDocument();
    // Should only contain the icon, not text
    expect(deleteButton).not.toHaveTextContent('삭제');
  });
});
