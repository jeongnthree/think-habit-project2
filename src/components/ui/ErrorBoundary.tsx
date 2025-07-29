'use client';

import { getUserFriendlyMessage, logError } from '@/utils/errorHandler';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'section';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      level: this.props.level || 'component',
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;
      const userMessage = getUserFriendlyMessage(error);
      const canRetry = this.state.retryCount < this.maxRetries;
      const level = this.props.level || 'component';

      // Page-level error boundary
      if (level === 'page') {
        return (
          <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
            <div className='max-w-md w-full space-y-8 text-center'>
              <div>
                <div className='text-6xl mb-4'>😵</div>
                <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                  페이지를 불러올 수 없습니다
                </h2>
                <p className='text-gray-600 mb-8'>{userMessage}</p>

                {this.props.showDetails && (
                  <details className='text-left bg-gray-100 p-4 rounded-md mb-6'>
                    <summary className='cursor-pointer text-sm font-medium text-gray-700 mb-2'>
                      기술적 세부사항
                    </summary>
                    <div className='text-xs text-gray-600 space-y-2'>
                      <div>
                        <strong>오류:</strong> {error.message}
                      </div>
                      {error.stack && (
                        <div>
                          <strong>스택 트레이스:</strong>
                          <pre className='mt-1 whitespace-pre-wrap text-xs'>
                            {error.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo && (
                        <div>
                          <strong>컴포넌트 스택:</strong>
                          <pre className='mt-1 whitespace-pre-wrap text-xs'>
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>

              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                {canRetry && (
                  <Button onClick={this.handleRetry}>
                    다시 시도 ({this.maxRetries - this.state.retryCount}회 남음)
                  </Button>
                )}
                <Button onClick={this.handleReload} variant='outline'>
                  페이지 새로고침
                </Button>
                <Button onClick={this.handleGoBack} variant='outline'>
                  이전 페이지로
                </Button>
              </div>
            </div>
          </div>
        );
      }

      // Component-level error boundary
      return (
        <div className='p-4'>
          <ErrorMessage
            title='컴포넌트 오류'
            message={userMessage}
            type='error'
            onRetry={canRetry ? this.handleRetry : undefined}
            showRetry={canRetry}
          />

          {this.props.showDetails && (
            <details className='mt-4 text-left bg-gray-100 p-4 rounded-md'>
              <summary className='cursor-pointer text-sm font-medium text-gray-700 mb-2'>
                기술적 세부사항
              </summary>
              <div className='text-xs text-gray-600 space-y-2'>
                <div>
                  <strong>오류:</strong> {error.message}
                </div>
                {error.stack && (
                  <div>
                    <strong>스택 트레이스:</strong>
                    <pre className='mt-1 whitespace-pre-wrap text-xs'>
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for error boundary context
export function useErrorHandler() {
  return {
    captureError: (error: Error, context?: Record<string, any>) => {
      logError(error, context);
      // In a real implementation, you might want to trigger error boundary
      // or show a toast notification
    },
  };
}
