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

const mockDeletedJournal: JournalWithDetails = {
  id: 'test-journal-id',
  title: 'Deleted Test Journal',
  content: 'Test content',
  student_id: 'student-1',
  category_id: 'category-1',
  journal_type: 'structured',
  is_public: false,
  deleted_at: '2024-01-15T10:00:00Z',
  deleted_by: 'student-1',
  attachments: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
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
  comments_count: 2,
};

describe('DeleteJournalButton - Restore Functionality', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (fetch as jest.Mock).mockClear();
    mockRouter.push.mockClear();
  });

  it('renders restore button for deleted journal when showRestore is true', () => {
    render(
      <DeleteJournalButton journal={mockDeletedJournal} showRestore={true} />
    );

    const restoreButton = screen.getByRole('button', { name: /복구/i });
    expect(restoreButton).toBeInTheDocument();
    expect(restoreButton).toHaveTextContent('복구');
  });

  it('shows restore confirmation modal when restore button is clicked', () => {
    render(
      <DeleteJournalButton journal={mockDeletedJournal} showRestore={true} />
    );

    const restoreButton = screen.getByRole('button', { name: /복구/i });
    fireEvent.click(restoreButton);

    expect(screen.getByText('일지 복구 확인')).toBeInTheDocument();
    expect(screen.getByText('일지 복구')).toBeInTheDocument();
    expect(screen.getByText(/삭제된 일지를 복구하여/)).toBeInTheDocument();
    expect(screen.getByText('"Deleted Test Journal"')).toBeInTheDocument();
  });

  it('calls restore API when restore is confirmed', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    });

    render(
      <DeleteJournalButton journal={mockDeletedJournal} showRestore={true} />
    );

    // Click restore button
    const restoreButton = screen.getByRole('button', { name: /복구/i });
    fireEvent.click(restoreButton);

    // Confirm restoration
    const confirmButtons = screen.getAllByRole('button', { name: '복구' });
    const confirmButton =
      confirmButtons.find(
        btn => btn.closest('[role="dialog"]') || btn.closest('.fixed')
      ) || confirmButtons[1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/training/journals/test-journal-id/restore',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });
  });

  it('redirects to journals page after successful restoration', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    });

    render(
      <DeleteJournalButton journal={mockDeletedJournal} showRestore={true} />
    );

    // Click restore button
    const restoreButton = screen.getByRole('button', { name: /복구/i });
    fireEvent.click(restoreButton);

    // Confirm restoration
    const confirmButtons = screen.getAllByRole('button', { name: '복구' });
    const confirmButton =
      confirmButtons.find(
        btn => btn.closest('[role="dialog"]') || btn.closest('.fixed')
      ) || confirmButtons[1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/training/journals?restored=true'
      );
    });
  });

  it('calls onRestored callback when provided', async () => {
    const onRestored = jest.fn();
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    });

    render(
      <DeleteJournalButton
        journal={mockDeletedJournal}
        onRestored={onRestored}
        showRestore={true}
      />
    );

    // Click restore button
    const restoreButton = screen.getByRole('button', { name: /복구/i });
    fireEvent.click(restoreButton);

    // Confirm restoration
    const confirmButtons = screen.getAllByRole('button', { name: '복구' });
    const confirmButton =
      confirmButtons.find(
        btn => btn.closest('[role="dialog"]') || btn.closest('.fixed')
      ) || confirmButtons[1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onRestored).toHaveBeenCalled();
    });
  });

  it('shows error message when restoration fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({ success: false, error: 'Restoration failed' }),
    });

    render(
      <DeleteJournalButton journal={mockDeletedJournal} showRestore={true} />
    );

    // Click restore button
    const restoreButton = screen.getByRole('button', { name: /복구/i });
    fireEvent.click(restoreButton);

    // Confirm restoration
    const confirmButtons = screen.getAllByRole('button', { name: '복구' });
    const confirmButton =
      confirmButtons.find(
        btn => btn.closest('[role="dialog"]') || btn.closest('.fixed')
      ) || confirmButtons[1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Restoration failed')).toBeInTheDocument();
    });
  });

  it('shows deletion date in restore confirmation', () => {
    render(
      <DeleteJournalButton journal={mockDeletedJournal} showRestore={true} />
    );

    const restoreButton = screen.getByRole('button', { name: /복구/i });
    fireEvent.click(restoreButton);

    expect(screen.getByText(/삭제일:/)).toBeInTheDocument();
    expect(screen.getByText(/2024. 1. 15./)).toBeInTheDocument();
  });

  it('shows related data information in restore confirmation', () => {
    render(
      <DeleteJournalButton journal={mockDeletedJournal} showRestore={true} />
    );

    const restoreButton = screen.getByRole('button', { name: /복구/i });
    fireEvent.click(restoreButton);

    // Should show journal type and title
    expect(screen.getByText('구조화된 일지')).toBeInTheDocument();
    expect(screen.getByText('"Deleted Test Journal"')).toBeInTheDocument();
  });

  it('closes restore modal when cancel is clicked', () => {
    render(
      <DeleteJournalButton journal={mockDeletedJournal} showRestore={true} />
    );

    // Click restore button
    const restoreButton = screen.getByRole('button', { name: /복구/i });
    fireEvent.click(restoreButton);

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: '취소' });
    fireEvent.click(cancelButton);

    expect(screen.queryByText('일지 복구 확인')).not.toBeInTheDocument();
  });

  it('handles network errors gracefully during restoration', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <DeleteJournalButton journal={mockDeletedJournal} showRestore={true} />
    );

    // Click restore button
    const restoreButton = screen.getByRole('button', { name: /복구/i });
    fireEvent.click(restoreButton);

    // Confirm restoration
    const confirmButtons = screen.getAllByRole('button', { name: '복구' });
    const confirmButton =
      confirmButtons.find(
        btn => btn.closest('[role="dialog"]') || btn.closest('.fixed')
      ) || confirmButtons[1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('일지 복구에 실패했습니다.')).toBeInTheDocument();
    });
  });

  it('renders restore icon variant correctly', () => {
    render(
      <DeleteJournalButton
        journal={mockDeletedJournal}
        showRestore={true}
        variant='icon'
      />
    );

    const restoreButton = screen.getByRole('button');
    expect(restoreButton).toBeInTheDocument();
    // Should only contain the icon, not text
    expect(restoreButton).not.toHaveTextContent('복구');
  });
});
