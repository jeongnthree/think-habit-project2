/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen } from '@testing-library/react';
import {
  ErrorBoundary,
  useErrorHandler,
  withErrorBoundary,
} from '../ErrorBoundary';

// 에러를 발생시키는 테스트 컴포넌트
const ErrorThrowingComponent = ({
  shouldThrow = true,
  message = 'Test error',
}) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div data-testid='normal-render'>Normal component rendering</div>;
};

describe('ErrorBoundary Component', () => {
  // 예상된 에러에 대한 console.error 억제
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div data-testid='child'>Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders error UI when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('컴포넌트 오류')).toBeInTheDocument();
  });

  it('calls onError prop when an error occurs', () => {
    const handleError = jest.fn();

    render(
      <ErrorBoundary onError={handleError}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(handleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('renders custom fallback when provided', () => {
    const fallback = <div data-testid='custom-fallback'>Custom fallback</div>;

    render(
      <ErrorBoundary fallback={fallback}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  it('shows technical details when showDetails is true', () => {
    render(
      <ErrorBoundary showDetails={true}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('기술적 세부사항')).toBeInTheDocument();
  });

  it('renders page-level error UI when level is page', () => {
    render(
      <ErrorBoundary level='page'>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('페이지를 불러올 수 없습니다')).toBeInTheDocument();
  });

  it('allows retry when error occurs', () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText('다시 시도');
    fireEvent.click(retryButton);

    // After retry, it will throw again and show error UI
    expect(screen.getByText('컴포넌트 오류')).toBeInTheDocument();
  });

  it('disables retry after max retries', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    // Click retry 3 times (max retries)
    const retryButton = screen.getByText('다시 시도');
    fireEvent.click(retryButton);
    rerender(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('다시 시도'));
    rerender(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('다시 시도'));
    rerender(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    // After max retries, retry button should not be available
    expect(screen.queryByText('다시 시도')).not.toBeInTheDocument();
  });

  it('handles reload button click', () => {
    // Mock window.location.reload
    const originalReload = window.location.reload;
    window.location.reload = jest.fn();

    render(
      <ErrorBoundary level='page'>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('페이지 새로고침');
    fireEvent.click(reloadButton);

    expect(window.location.reload).toHaveBeenCalled();

    // Restore original function
    window.location.reload = originalReload;
  });

  it('handles go back button click', () => {
    // Mock window.history.back
    const originalBack = window.history.back;
    window.history.back = jest.fn();

    // Mock window.history.length
    Object.defineProperty(window.history, 'length', {
      configurable: true,
      value: 2,
    });

    render(
      <ErrorBoundary level='page'>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    const backButton = screen.getByText('이전 페이지로');
    fireEvent.click(backButton);

    expect(window.history.back).toHaveBeenCalled();

    // Restore original function
    window.history.back = originalBack;
  });
});

describe('withErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    const TestComponent = () => <div data-testid='test'>Test</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByTestId('test')).toBeInTheDocument();
  });

  it('handles errors in wrapped component', () => {
    const WrappedErrorComponent = withErrorBoundary(ErrorThrowingComponent);

    render(<WrappedErrorComponent />);

    expect(screen.getByText('컴포넌트 오류')).toBeInTheDocument();
  });

  it('passes error boundary props to ErrorBoundary', () => {
    const WrappedErrorComponent = withErrorBoundary(ErrorThrowingComponent, {
      level: 'page',
      showDetails: true,
    });

    render(<WrappedErrorComponent />);

    expect(screen.getByText('페이지를 불러올 수 없습니다')).toBeInTheDocument();
    expect(screen.getByText('기술적 세부사항')).toBeInTheDocument();
  });

  it('preserves component displayName', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'CustomTestComponent';

    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe(
      'withErrorBoundary(CustomTestComponent)'
    );
  });

  it('uses function name when displayName is not available', () => {
    const TestComponent = () => <div>Test</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe(
      'withErrorBoundary(TestComponent)'
    );
  });
});

describe('useErrorHandler hook', () => {
  it('provides captureError function', () => {
    const TestComponent = () => {
      const { captureError } = useErrorHandler();

      const handleClick = () => {
        captureError(new Error('Test error'), { context: 'test' });
      };

      return <button onClick={handleClick}>Trigger Error</button>;
    };

    render(<TestComponent />);

    // Just test that the button renders and doesn't throw when clicked
    const button = screen.getByText('Trigger Error');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
  });
});
