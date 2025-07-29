import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CommentSection, CommentWithAuthor } from '../CommentSection';

// Mock the ReportButton and BlockUserButton components
jest.mock('../ReportButton', () => ({
  ReportButton: ({
    contentType,
    contentId,
    reportedUserId,
    className,
  }: any) => (
    <button
      className={className}
      data-testid={`report-${contentType}-${contentId}`}
    >
      신고
    </button>
  ),
}));

jest.mock('../BlockUserButton', () => ({
  BlockUserButton: ({ userId, userName, className }: any) => (
    <button className={className} data-testid={`block-${userId}`}>
      차단
    </button>
  ),
}));

const mockComments: CommentWithAuthor[] = [
  {
    id: 'comment1',
    journal_id: 'journal1',
    author_id: 'user1',
    content: '좋은 일지네요!',
    comment_type: 'comment',
    created_at: '2024-01-15T10:00:00Z',
    author: {
      id: 'user1',
      full_name: '김학습',
      role: 'student',
    },
  },
  {
    id: 'comment2',
    journal_id: 'journal1',
    author_id: 'teacher1',
    content: '훌륭한 접근입니다.',
    comment_type: 'advice',
    created_at: '2024-01-15T11:00:00Z',
    author: {
      id: 'teacher1',
      full_name: '박선생',
      role: 'teacher',
    },
  },
];

const defaultProps = {
  comments: mockComments,
  journalId: 'journal1',
  currentUserId: 'current-user',
  onAddComment: jest.fn(),
  onDeleteComment: jest.fn(),
};

describe('CommentSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders comment section with comments', () => {
    render(<CommentSection {...defaultProps} />);

    expect(screen.getByText('댓글 (2)')).toBeInTheDocument();
    expect(screen.getByText('좋은 일지네요!')).toBeInTheDocument();
    expect(screen.getByText('훌륭한 접근입니다.')).toBeInTheDocument();
    expect(screen.getByText('김학습')).toBeInTheDocument();
    expect(screen.getByText('박선생')).toBeInTheDocument();
  });

  it('displays comment types and author roles correctly', () => {
    render(<CommentSection {...defaultProps} />);

    expect(screen.getAllByText('댓글')).toHaveLength(2); // One in badge, one in dropdown
    expect(screen.getAllByText('조언')).toHaveLength(2); // One in badge, one in dropdown
    expect(screen.getByText('(학습자)')).toBeInTheDocument();
    expect(screen.getByText('(선생님)')).toBeInTheDocument();
  });

  it("shows delete button only for user's own comments", () => {
    const propsWithUserComment = {
      ...defaultProps,
      comments: [
        ...mockComments,
        {
          id: 'comment3',
          journal_id: 'journal1',
          author_id: 'current-user',
          content: '내 댓글입니다.',
          comment_type: 'comment' as const,
          created_at: '2024-01-15T12:00:00Z',
          author: {
            id: 'current-user',
            full_name: '현재사용자',
            role: 'student',
          },
        },
      ],
    };

    render(<CommentSection {...propsWithUserComment} />);

    // Should show delete button for user's own comment
    const deleteButtons = screen.getAllByText('삭제');
    expect(deleteButtons).toHaveLength(1);

    // Should show report/block buttons for other users' comments
    expect(screen.getAllByLabelText('댓글 신고')).toHaveLength(2); // Two other users' comments
    expect(screen.getAllByLabelText('사용자 차단')).toHaveLength(2);
  });

  it('handles comment submission', async () => {
    const mockOnAddComment = jest.fn().mockResolvedValue(undefined);
    render(
      <CommentSection {...defaultProps} onAddComment={mockOnAddComment} />
    );

    const textarea = screen.getByLabelText('댓글 내용');
    const submitButton = screen.getByRole('button', { name: '댓글 작성' });

    fireEvent.change(textarea, { target: { value: '새로운 댓글입니다.' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnAddComment).toHaveBeenCalledWith(
        '새로운 댓글입니다.',
        'comment'
      );
    });

    // Form should be reset after successful submission
    expect(textarea).toHaveValue('');
  });

  it('validates comment content', async () => {
    render(<CommentSection {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: '댓글 작성' });

    // Submit button should be disabled when no content
    expect(submitButton).toBeDisabled();

    // Add some content to enable button, then clear it
    const textarea = screen.getByLabelText('댓글 내용');
    fireEvent.change(textarea, { target: { value: 'test content' } });

    // Button should be enabled now
    expect(submitButton).not.toBeDisabled();

    // Clear the content
    fireEvent.change(textarea, { target: { value: '' } });

    // Button should be disabled again
    expect(submitButton).toBeDisabled();

    expect(defaultProps.onAddComment).not.toHaveBeenCalled();
  });

  it('validates comment length', async () => {
    render(<CommentSection {...defaultProps} />);

    const textarea = screen.getByLabelText('댓글 내용');
    const longComment = 'a'.repeat(501); // Exceeds 500 character limit

    fireEvent.change(textarea, { target: { value: longComment } });

    // Check that the character counter shows red when over limit
    await waitFor(() => {
      const counter = screen.getByText('501/500자');
      expect(counter).toHaveClass('text-red-500');
    });

    // Check that submit button is disabled
    const submitButton = screen.getByRole('button', { name: '댓글 작성' });
    expect(submitButton).toBeDisabled();

    expect(defaultProps.onAddComment).not.toHaveBeenCalled();
  });

  it('shows character count', () => {
    render(<CommentSection {...defaultProps} />);

    const textarea = screen.getByLabelText('댓글 내용');
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    expect(screen.getByText('5/500자')).toBeInTheDocument();
  });

  it('handles comment deletion with confirmation', async () => {
    const mockOnDeleteComment = jest.fn().mockResolvedValue(undefined);

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn().mockReturnValue(true);

    const propsWithUserComment = {
      ...defaultProps,
      onDeleteComment: mockOnDeleteComment,
      comments: [
        {
          id: 'comment3',
          journal_id: 'journal1',
          author_id: 'current-user',
          content: '내 댓글입니다.',
          comment_type: 'comment' as const,
          created_at: '2024-01-15T12:00:00Z',
          author: {
            id: 'current-user',
            full_name: '현재사용자',
            role: 'student',
          },
        },
      ],
    };

    render(<CommentSection {...propsWithUserComment} />);

    const deleteButton = screen.getByText('삭제');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith('댓글을 삭제하시겠습니까?');

    await waitFor(() => {
      expect(mockOnDeleteComment).toHaveBeenCalledWith('comment3');
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('cancels deletion when user declines confirmation', async () => {
    const mockOnDeleteComment = jest.fn();

    // Mock window.confirm to return false
    const originalConfirm = window.confirm;
    window.confirm = jest.fn().mockReturnValue(false);

    const propsWithUserComment = {
      ...defaultProps,
      onDeleteComment: mockOnDeleteComment,
      comments: [
        {
          id: 'comment3',
          journal_id: 'journal1',
          author_id: 'current-user',
          content: '내 댓글입니다.',
          comment_type: 'comment' as const,
          created_at: '2024-01-15T12:00:00Z',
          author: {
            id: 'current-user',
            full_name: '현재사용자',
            role: 'student',
          },
        },
      ],
    };

    render(<CommentSection {...propsWithUserComment} />);

    const deleteButton = screen.getByText('삭제');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnDeleteComment).not.toHaveBeenCalled();

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('shows empty state when no comments exist', () => {
    render(<CommentSection {...defaultProps} comments={[]} />);

    expect(screen.getByText('댓글 (0)')).toBeInTheDocument();
    expect(screen.getByText('아직 댓글이 없습니다')).toBeInTheDocument();
    expect(
      screen.getByText('첫 번째 댓글을 작성해보세요!')
    ).toBeInTheDocument();
  });

  it('handles comment type selection', () => {
    render(<CommentSection {...defaultProps} />);

    const select = screen.getByLabelText('댓글 유형');

    fireEvent.change(select, { target: { value: 'encouragement' } });
    expect(select).toHaveValue('encouragement');

    fireEvent.change(select, { target: { value: 'advice' } });
    expect(select).toHaveValue('advice');

    fireEvent.change(select, { target: { value: 'question' } });
    expect(select).toHaveValue('question');
  });

  it('shows loading state during comment submission', async () => {
    const mockOnAddComment = jest
      .fn()
      .mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

    render(
      <CommentSection {...defaultProps} onAddComment={mockOnAddComment} />
    );

    const textarea = screen.getByLabelText('댓글 내용');
    const submitButton = screen.getByRole('button', { name: '댓글 작성' });

    fireEvent.change(textarea, { target: { value: '새로운 댓글' } });
    fireEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByText('작성 중...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('작성 중...')).not.toBeInTheDocument();
    });
  });

  it('handles comment submission error', async () => {
    const mockOnAddComment = jest
      .fn()
      .mockRejectedValue(new Error('네트워크 오류'));

    render(
      <CommentSection {...defaultProps} onAddComment={mockOnAddComment} />
    );

    const textarea = screen.getByLabelText('댓글 내용');
    const submitButton = screen.getByRole('button', { name: '댓글 작성' });

    fireEvent.change(textarea, { target: { value: '새로운 댓글' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('네트워크 오류')).toBeInTheDocument();
    });

    // Form should not be reset on error
    expect(textarea).toHaveValue('새로운 댓글');
  });

  it('implements pagination for large number of comments', () => {
    const manyComments = Array.from({ length: 10 }, (_, i) => ({
      id: `comment${i}`,
      journal_id: 'journal1',
      author_id: `user${i}`,
      content: `댓글 ${i}`,
      comment_type: 'comment' as const,
      created_at: '2024-01-15T10:00:00Z',
      author: {
        id: `user${i}`,
        full_name: `사용자${i}`,
        role: 'student',
      },
    }));

    render(
      <CommentSection
        {...defaultProps}
        comments={manyComments}
        initialDisplayCount={5}
      />
    );

    // Should show first 5 comments
    expect(screen.getByText('댓글 0')).toBeInTheDocument();
    expect(screen.getByText('댓글 4')).toBeInTheDocument();
    expect(screen.queryByText('댓글 5')).not.toBeInTheDocument();

    // Should show "더 보기" button
    expect(screen.getByText('댓글 더 보기 (5개 남음)')).toBeInTheDocument();

    // Click "더 보기" button
    fireEvent.click(screen.getByText('댓글 더 보기 (5개 남음)'));

    // Should show more comments
    expect(screen.getByText('댓글 5')).toBeInTheDocument();
    expect(screen.getByText('댓글 9')).toBeInTheDocument();
  });
});
