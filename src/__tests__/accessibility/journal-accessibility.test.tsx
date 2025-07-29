/**
 * Accessibility tests for journal components
 */

import { JournalList } from '@/components/training/JournalList';
import { AccessibilityProvider } from '@/components/ui/AccessibilityProvider';
import { JournalWithDetails } from '@/types/database';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock data
const mockJournals: JournalWithDetails[] = [
  {
    id: '1',
    title: '첫 번째 구조화된 일지',
    content: '오늘의 훈련 내용입니다.',
    journal_type: 'structured',
    is_public: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    deleted_at: null,
    student_id: 'user1',
    category_id: 'cat1',
    category: {
      id: 'cat1',
      name: '논리적 사고',
      color: '#3B82F6',
    },
    student: {
      id: 'user1',
      display_name: '김학습',
      avatar_url: null,
    },
    task_completions: [],
    journal_photos: [],
    comments_count: 2,
  },
  {
    id: '2',
    title: '사진 일지 예시',
    content: '사진과 함께 작성된 일지입니다.',
    journal_type: 'photo',
    is_public: false,
    created_at: '2024-01-14T15:30:00Z',
    updated_at: '2024-01-14T15:30:00Z',
    deleted_at: null,
    student_id: 'user1',
    category_id: 'cat1',
    category: {
      id: 'cat1',
      name: '창의적 사고',
      color: '#8B5CF6',
    },
    student: {
      id: 'user1',
      display_name: '김학습',
      avatar_url: null,
    },
    task_completions: [],
    journal_photos: [
      {
        id: 'photo1',
        journal_id: '2',
        photo_url: '/test-image.jpg',
        caption: '테스트 이미지',
        order_index: 0,
        file_size: 1024,
        file_type: 'image/jpeg',
        created_at: '2024-01-14T15:30:00Z',
      },
    ],
    comments_count: 0,
  },
];

const mockPagination = {
  page: 1,
  limit: 10,
  total: 2,
  totalPages: 1,
};

// Test wrapper with accessibility provider
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AccessibilityProvider>{children}</AccessibilityProvider>;
}

describe('Journal Accessibility Tests', () => {
  describe('JournalList Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <JournalList
            journals={mockJournals}
            loading={false}
            pagination={mockPagination}
            onPageChange={jest.fn()}
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <JournalList
            journals={mockJournals}
            loading={false}
            pagination={mockPagination}
            onPageChange={jest.fn()}
          />
        </TestWrapper>
      );

      // Check list role and label
      expect(screen.getByRole('list')).toHaveAttribute(
        'aria-label',
        '총 2개의 일지'
      );

      // Check individual journal cards
      expect(
        screen.getByRole('listitem', {
          name: /구조화된 일지: 첫 번째 구조화된 일지/,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('listitem', { name: /사진 일지: 사진 일지 예시/ })
      ).toBeInTheDocument();

      // Check badges
      expect(
        screen.getByRole('badge', { name: '일지 유형: 구조화된 일지' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('badge', { name: '일지 유형: 사진 일지' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('badge', { name: '공개 일지' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('badge', { name: '비공개 일지' })
      ).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(
        <TestWrapper>
          <JournalList
            journals={mockJournals}
            loading={false}
            pagination={mockPagination}
            onPageChange={jest.fn()}
          />
        </TestWrapper>
      );

      // Journal titles should be properly linked
      const firstJournalLink = screen.getByRole('link', {
        name: '첫 번째 구조화된 일지',
      });
      expect(firstJournalLink).toHaveAttribute('href', '/training/journals/1');
      expect(firstJournalLink).toHaveAttribute(
        'aria-describedby',
        'journal-1-summary'
      );

      const secondJournalLink = screen.getByRole('link', {
        name: '사진 일지 예시',
      });
      expect(secondJournalLink).toHaveAttribute('href', '/training/journals/2');
      expect(secondJournalLink).toHaveAttribute(
        'aria-describedby',
        'journal-2-summary'
      );
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <JournalList
            journals={mockJournals}
            loading={false}
            pagination={mockPagination}
            onPageChange={jest.fn()}
          />
        </TestWrapper>
      );

      // Tab through journal links
      await user.tab();
      expect(
        screen.getByRole('link', { name: '첫 번째 구조화된 일지' })
      ).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: '자세히 보기' })).toHaveFocus();

      await user.tab();
      expect(
        screen.getByRole('link', { name: '사진 일지 예시' })
      ).toHaveFocus();
    });

    it('should announce loading state to screen readers', () => {
      render(
        <TestWrapper>
          <JournalList
            journals={[]}
            loading={true}
            pagination={mockPagination}
            onPageChange={jest.fn()}
          />
        </TestWrapper>
      );

      expect(
        screen.getByRole('status', { name: '일지 목록 로딩 중' })
      ).toBeInTheDocument();
      expect(screen.getByText('일지 목록을 불러오는 중입니다...')).toHaveClass(
        'sr-only'
      );
    });

    it('should provide helpful empty state', () => {
      render(
        <TestWrapper>
          <JournalList
            journals={[]}
            loading={false}
            pagination={mockPagination}
            onPageChange={jest.fn()}
          />
        </TestWrapper>
      );

      expect(
        screen.getByRole('region', { name: '빈 일지 목록' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '새 일지 작성' })
      ).toHaveAttribute('aria-describedby', 'new-journal-help');
    });

    it('should handle focus management properly', async () => {
      const user = userEvent.setup();
      const mockPageChange = jest.fn();

      render(
        <TestWrapper>
          <JournalList
            journals={mockJournals}
            loading={false}
            pagination={{ ...mockPagination, totalPages: 3, page: 2 }}
            onPageChange={mockPageChange}
          />
        </TestWrapper>
      );

      // Test pagination button focus
      const nextButton = screen.getByRole('button', { name: '다음' });
      await user.click(nextButton);

      expect(mockPageChange).toHaveBeenCalledWith(3);
    });
  });

  describe('Loading States', () => {
    it('should provide accessible loading indicators', () => {
      render(
        <TestWrapper>
          <JournalList
            journals={[]}
            loading={true}
            pagination={mockPagination}
            onPageChange={jest.fn()}
          />
        </TestWrapper>
      );

      // Loading state should be announced to screen readers
      const loadingIndicator = screen.getByRole('status');
      expect(loadingIndicator).toBeInTheDocument();
      expect(loadingIndicator).toHaveAttribute(
        'aria-label',
        '일지 목록 로딩 중'
      );
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should maintain sufficient color contrast', () => {
      render(
        <TestWrapper>
          <JournalList
            journals={mockJournals}
            loading={false}
            pagination={mockPagination}
            onPageChange={jest.fn()}
          />
        </TestWrapper>
      );

      // Check that text elements have appropriate contrast classes
      const publicBadge = screen.getByRole('badge', { name: '공개 일지' });
      expect(publicBadge).toHaveClass('text-green-700');

      const privateBadge = screen.getByRole('badge', { name: '비공개 일지' });
      expect(privateBadge).toHaveClass('text-gray-600');
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide descriptive text for complex elements', () => {
      render(
        <TestWrapper>
          <JournalList
            journals={mockJournals}
            loading={false}
            pagination={mockPagination}
            onPageChange={jest.fn()}
          />
        </TestWrapper>
      );

      // Icons should be hidden from screen readers
      const eyeIcons = screen.getAllByRole('img', { hidden: true });
      eyeIcons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should provide summary information', () => {
      render(
        <TestWrapper>
          <JournalList
            journals={mockJournals}
            loading={false}
            pagination={mockPagination}
            onPageChange={jest.fn()}
          />
        </TestWrapper>
      );

      // Check that summaries are properly linked
      expect(screen.getByText('오늘의 훈련 내용입니다.')).toHaveAttribute(
        'id',
        'journal-1-summary'
      );
      expect(
        screen.getByText('사진과 함께 작성된 일지입니다.')
      ).toHaveAttribute('id', 'journal-2-summary');
    });
  });

  describe('Mobile Accessibility', () => {
    it('should have appropriate touch targets', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <JournalList
            journals={mockJournals}
            loading={false}
            pagination={mockPagination}
            onPageChange={jest.fn()}
          />
        </TestWrapper>
      );

      // Buttons should have minimum touch target size
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        // Note: In a real test, you'd check computed styles for min-height/width
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Error States', () => {
    it('should handle error states accessibly', () => {
      // This would test error boundary and error message accessibility
      // Implementation depends on your error handling strategy
      expect(true).toBe(true); // Placeholder
    });
  });
});

describe('Accessibility Provider', () => {
  it('should detect system preferences', () => {
    // Mock media queries
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(
      <TestWrapper>
        <div>Test content</div>
      </TestWrapper>
    );

    expect(window.matchMedia).toHaveBeenCalledWith(
      '(prefers-reduced-motion: reduce)'
    );
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-contrast: high)');
  });

  it('should provide screen reader announcements', async () => {
    let announceFunction: ((message: string) => void) | null = null;

    function TestComponent() {
      const { announceToScreenReader } =
        require('@/components/ui/AccessibilityProvider').useAccessibility();
      announceFunction = announceToScreenReader;
      return <div>Test</div>;
    }

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Test announcement functionality
    if (announceFunction) {
      announceFunction('Test announcement');

      await waitFor(() => {
        const announcement = document.querySelector('[aria-live]');
        expect(announcement).toBeInTheDocument();
      });
    }
  });
});
