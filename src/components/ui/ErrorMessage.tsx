import React from 'react';
import { Button } from './Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
  type?: 'error' | 'warning' | 'info';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = '오류가 발생했습니다',
  message,
  onRetry,
  showRetry = true,
  type = 'error',
}) => {
  const typeStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '❌',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
      titleText: 'text-red-800',
      messageText: 'text-red-700',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: '⚠️',
      iconBg: 'bg-yellow-100',
      iconText: 'text-yellow-600',
      titleText: 'text-yellow-800',
      messageText: 'text-yellow-700',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'ℹ️',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
      titleText: 'text-blue-800',
      messageText: 'text-blue-700',
    },
  };

  const styles = typeStyles[type];

  return (
    <div className={`rounded-md p-4 ${styles.bg} ${styles.border} border`}>
      <div className="flex">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center`}>
          <span className="text-sm">{styles.icon}</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${styles.titleText}`}>
            {title}
          </h3>
          <div className={`mt-2 text-sm ${styles.messageText}`}>
            <p>{message}</p>
          </div>
          {showRetry && onRetry && (
            <div className="mt-4">
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className={`${styles.iconText} border-current hover:bg-white`}
              >
                다시 시도
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 페이지 전체 에러 컴포넌트
export const PageError: React.FC<ErrorMessageProps & { 
  onGoBack?: () => void;
  showGoBack?: boolean;
}> = ({
  title = '페이지를 불러올 수 없습니다',
  message,
  onRetry,
  onGoBack,
  showRetry = true,
  showGoBack = true,
  type = 'error',
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="text-6xl mb-4">
            {type === 'error' ? '😵' : type === 'warning' ? '😐' : '🤔'}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-600 mb-8">
            {message}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {showRetry && onRetry && (
            <Button onClick={onRetry}>
              다시 시도
            </Button>
          )}
          {showGoBack && onGoBack && (
            <Button onClick={onGoBack} variant="outline">
              이전 페이지로
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};