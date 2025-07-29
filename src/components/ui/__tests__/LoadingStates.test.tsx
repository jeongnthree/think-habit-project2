import { render, screen } from '@testing-library/react';
import {
  CardSkeleton,
  FormSkeleton,
  FullPageLoading,
  InlineLoading,
  JournalCardSkeleton,
  ListSkeleton,
  LoadingOverlay,
  LoadingSpinner,
  ProgressSkeleton,
  Skeleton,
  TextSkeleton,
} from '../LoadingStates';

describe('LoadingStates Components', () => {
  describe('LoadingSpinner', () => {
    it('renders with default props', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('presentation');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass(
        'animate-spin',
        'h-6',
        'w-6',
        'text-blue-600'
      );
    });

    it('applies size classes correctly', () => {
      const { rerender } = render(<LoadingSpinner size='xs' />);
      expect(screen.getByRole('presentation')).toHaveClass('h-3', 'w-3');

      rerender(<LoadingSpinner size='lg' />);
      expect(screen.getByRole('presentation')).toHaveClass('h-8', 'w-8');
    });

    it('applies color classes correctly', () => {
      const { rerender } = render(<LoadingSpinner color='secondary' />);
      expect(screen.getByRole('presentation')).toHaveClass('text-gray-600');

      rerender(<LoadingSpinner color='white' />);
      expect(screen.getByRole('presentation')).toHaveClass('text-white');
    });

    it('applies custom className', () => {
      render(<LoadingSpinner className='custom-class' />);
      expect(screen.getByRole('presentation')).toHaveClass('custom-class');
    });
  });

  describe('Skeleton', () => {
    it('renders with default props', () => {
      render(<Skeleton data-testid='skeleton' />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('bg-gray-200', 'rounded', 'animate-pulse');
    });

    it('applies custom className', () => {
      render(<Skeleton data-testid='skeleton' className='w-full h-10' />);
      expect(screen.getByTestId('skeleton')).toHaveClass('w-full', 'h-10');
    });

    it('disables animation when animate is false', () => {
      render(<Skeleton data-testid='skeleton' animate={false} />);
      expect(screen.getByTestId('skeleton')).not.toHaveClass('animate-pulse');
    });
  });

  describe('TextSkeleton', () => {
    it('renders single line by default', () => {
      render(<TextSkeleton data-testid='text-skeleton' />);
      const skeleton = screen.getByTestId('text-skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('h-4', 'w-full');
    });

    it('renders multiple lines when specified', () => {
      render(<TextSkeleton data-testid='text-skeleton' lines={3} />);
      const container = screen.getByTestId('text-skeleton');
      expect(container.childNodes.length).toBe(3);
      expect(container.lastChild).toHaveClass('w-3/4'); // Last line is shorter
    });

    it('applies different line heights', () => {
      const { rerender } = render(
        <TextSkeleton data-testid='text-skeleton' lineHeight='sm' />
      );
      expect(screen.getByTestId('text-skeleton')).toHaveClass('h-3');

      rerender(<TextSkeleton data-testid='text-skeleton' lineHeight='lg' />);
      expect(screen.getByTestId('text-skeleton')).toHaveClass('h-5');
    });
  });

  describe('CardSkeleton', () => {
    it('renders card structure', () => {
      render(<CardSkeleton data-testid='card-skeleton' />);
      const card = screen.getByTestId('card-skeleton');
      expect(card).toHaveClass(
        'border',
        'border-gray-200',
        'rounded-lg',
        'p-6'
      );

      // Check that it contains skeleton elements
      expect(card.querySelectorAll('.bg-gray-200').length).toBeGreaterThan(1);
    });
  });

  describe('JournalCardSkeleton', () => {
    it('renders journal card structure', () => {
      render(<JournalCardSkeleton data-testid='journal-card-skeleton' />);
      const card = screen.getByTestId('journal-card-skeleton');
      expect(card).toHaveClass(
        'border',
        'border-gray-200',
        'rounded-lg',
        'p-6'
      );

      // Check that it contains multiple skeleton elements
      expect(card.querySelectorAll('.bg-gray-200').length).toBeGreaterThan(5);
    });
  });

  describe('FormSkeleton', () => {
    it('renders form structure', () => {
      render(<FormSkeleton data-testid='form-skeleton' />);
      const form = screen.getByTestId('form-skeleton');

      // Check that it contains multiple skeleton elements
      expect(form.querySelectorAll('.bg-gray-200').length).toBeGreaterThan(5);
    });
  });

  describe('ProgressSkeleton', () => {
    it('renders progress structure', () => {
      render(<ProgressSkeleton data-testid='progress-skeleton' />);
      const progress = screen.getByTestId('progress-skeleton');

      // Check that it contains multiple skeleton elements
      expect(progress.querySelectorAll('.bg-gray-200').length).toBe(5);
    });
  });

  describe('ListSkeleton', () => {
    it('renders default number of items', () => {
      render(<ListSkeleton data-testid='list-skeleton' />);
      const list = screen.getByTestId('list-skeleton');
      expect(list.childNodes.length).toBe(5); // Default is 5 items
    });

    it('renders specified number of items', () => {
      render(<ListSkeleton data-testid='list-skeleton' items={3} />);
      const list = screen.getByTestId('list-skeleton');
      expect(list.childNodes.length).toBe(3);
    });

    it('applies item height class', () => {
      render(<ListSkeleton data-testid='list-skeleton' itemHeight='h-20' />);
      const list = screen.getByTestId('list-skeleton');
      Array.from(list.childNodes).forEach(item => {
        expect(item).toHaveClass('h-20');
      });
    });
  });

  describe('LoadingOverlay', () => {
    it('renders children when not loading', () => {
      render(
        <LoadingOverlay isLoading={false}>
          <div data-testid='content'>Content</div>
        </LoadingOverlay>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.queryByText('로딩 중...')).not.toBeInTheDocument();
    });

    it('renders overlay when loading', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div data-testid='content'>Content</div>
        </LoadingOverlay>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByText('로딩 중...')).toBeInTheDocument();
      expect(
        screen.getByText('로딩 중...').previousSibling
      ).toBeInTheDocument(); // Spinner
    });

    it('shows custom message', () => {
      render(
        <LoadingOverlay isLoading={true} message='데이터를 불러오는 중...'>
          <div>Content</div>
        </LoadingOverlay>
      );

      expect(screen.getByText('데이터를 불러오는 중...')).toBeInTheDocument();
    });
  });

  describe('FullPageLoading', () => {
    it('renders with default props', () => {
      render(<FullPageLoading />);

      expect(screen.getByText('페이지를 불러오는 중...')).toBeInTheDocument();
      expect(
        screen.getByText('페이지를 불러오는 중...').previousSibling
      ).toBeInTheDocument(); // Spinner
    });

    it('shows custom message', () => {
      render(<FullPageLoading message='잠시만 기다려주세요...' />);

      expect(screen.getByText('잠시만 기다려주세요...')).toBeInTheDocument();
    });

    it('can hide spinner', () => {
      render(<FullPageLoading showSpinner={false} />);

      const loadingElement = screen.getByText('페이지를 불러오는 중...');
      expect(loadingElement.previousSibling).toBeFalsy();
    });
  });

  describe('InlineLoading', () => {
    it('renders with default props', () => {
      render(<InlineLoading />);

      expect(screen.getByText('로딩 중...')).toBeInTheDocument();
      expect(
        screen.getByText('로딩 중...').previousSibling
      ).toBeInTheDocument(); // Spinner
    });

    it('shows custom message', () => {
      render(<InlineLoading message='처리 중...' />);

      expect(screen.getByText('처리 중...')).toBeInTheDocument();
    });

    it('applies size to spinner', () => {
      render(<InlineLoading size='lg' />);

      const spinner = screen.getByText('로딩 중...').previousSibling;
      expect(spinner).toHaveClass('h-8', 'w-8');
    });

    it('applies custom className', () => {
      render(<InlineLoading className='mt-4' />);

      const container = screen.getByText('로딩 중...').parentElement;
      expect(container).toHaveClass('mt-4');
    });
  });
});
