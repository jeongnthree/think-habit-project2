/**
 * 에러 처리 및 로깅 시스템
 */

export interface ErrorInfo {
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  timestamp: string;
  url?: string;
  userId?: string;
  userAgent?: string;
}

// 에러 타입 정의
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 에러 로깅 함수
export function logError(error: Error | AppError, context?: Record<string, any>) {
  const errorInfo: ErrorInfo = {
    message: error.message,
    stack: error.stack,
    code: error instanceof AppError ? error.code : 'UNKNOWN_ERROR',
    statusCode: error instanceof AppError ? error.statusCode : 500,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    ...context,
  };

  // 개발 환경에서는 콘솔에 출력
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorInfo);
  }

  // 프로덕션 환경에서는 외부 서비스로 전송 (예: Sentry)
  if (process.env.NODE_ENV === 'production') {
    sendErrorToService(errorInfo);
  }
}

// 외부 에러 추적 서비스로 전송
async function sendErrorToService(errorInfo: ErrorInfo) {
  try {
    // Sentry, LogRocket, 또는 다른 서비스 사용
    if (process.env.SENTRY_DSN) {
      // Sentry 전송 로직
      console.log('Sending error to Sentry:', errorInfo);
    }
    
    // 자체 로깅 API로 전송
    await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorInfo),
    });
  } catch (loggingError) {
    console.error('Failed to send error to logging service:', loggingError);
  }
}

// API 에러 처리 함수
export function handleApiError(error: any): AppError {
  if (error instanceof AppError) {
    return error;
  }

  // 네트워크 에러
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return new AppError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  // HTTP 에러
  if (error.status) {
    const statusMessages: Record<number, string> = {
      400: '잘못된 요청입니다.',
      401: '인증이 필요합니다.',
      403: '접근 권한이 없습니다.',
      404: '요청한 리소스를 찾을 수 없습니다.',
      429: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
      500: '서버 오류가 발생했습니다.',
      502: '서버가 일시적으로 사용할 수 없습니다.',
      503: '서비스를 사용할 수 없습니다.',
    };

    return new AppError(
      statusMessages[error.status] || '알 수 없는 오류가 발생했습니다.',
      error.status,
      `HTTP_${error.status}`
    );
  }

  // 기본 에러
  return new AppError(
    error.message || '알 수 없는 오류가 발생했습니다.',
    500,
    'UNKNOWN_ERROR'
  );
}

// React Error Boundary용 에러 처리
export function handleComponentError(error: Error, errorInfo: React.ErrorInfo) {
  logError(error, {
    componentStack: errorInfo.componentStack,
    errorBoundary: true,
  });
}

// 전역 에러 핸들러 설정
export function setupGlobalErrorHandlers() {
  if (typeof window !== 'undefined') {
    // 처리되지 않은 Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      logError(new Error(event.reason), {
        type: 'unhandledrejection',
        reason: event.reason,
      });
    });

    // 일반적인 JavaScript 에러
    window.addEventListener('error', (event) => {
      logError(new Error(event.message), {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
  }
}

// 사용자 친화적 에러 메시지 변환
export function getUserFriendlyMessage(error: Error | AppError): string {
  if (error instanceof AppError) {
    return error.message;
  }

  // 일반적인 에러들을 사용자 친화적 메시지로 변환
  const friendlyMessages: Record<string, string> = {
    'Network request failed': '인터넷 연결을 확인해주세요.',
    'Failed to fetch': '서버에 연결할 수 없습니다.',
    'Unauthorized': '로그인이 필요합니다.',
    'Forbidden': '접근 권한이 없습니다.',
  };

  return friendlyMessages[error.message] || '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}