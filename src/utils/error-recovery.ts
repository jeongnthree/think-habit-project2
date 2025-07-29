/**
 * Error recovery and retry mechanisms for client-side operations
 */

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
}

export interface NetworkErrorInfo {
  isNetworkError: boolean;
  isRetryable: boolean;
  statusCode?: number;
  message: string;
  userMessage: string;
}

// Default retry options
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: error => isRetryableError(error),
};

// Check if an error is retryable
export function isRetryableError(error: Error): boolean {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }

  // HTTP errors that are retryable
  if ('status' in error) {
    const status = (error as any).status;
    return status >= 500 || status === 408 || status === 429;
  }

  // Timeout errors
  if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
    return true;
  }

  return false;
}

// Analyze network error and provide user-friendly information
export function analyzeNetworkError(error: any): NetworkErrorInfo {
  // Network connection error
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      isNetworkError: true,
      isRetryable: true,
      message: 'Network connection failed',
      userMessage: '인터넷 연결을 확인하고 다시 시도해주세요.',
    };
  }

  // HTTP errors
  if (error.status) {
    const status = error.status;
    const statusMessages: Record<
      number,
      { message: string; userMessage: string; retryable: boolean }
    > = {
      400: {
        message: 'Bad Request',
        userMessage: '잘못된 요청입니다. 입력 내용을 확인해주세요.',
        retryable: false,
      },
      401: {
        message: 'Unauthorized',
        userMessage: '로그인이 필요합니다. 다시 로그인해주세요.',
        retryable: false,
      },
      403: {
        message: 'Forbidden',
        userMessage: '접근 권한이 없습니다.',
        retryable: false,
      },
      404: {
        message: 'Not Found',
        userMessage: '요청한 리소스를 찾을 수 없습니다.',
        retryable: false,
      },
      408: {
        message: 'Request Timeout',
        userMessage: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
        retryable: true,
      },
      429: {
        message: 'Too Many Requests',
        userMessage:
          '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
        retryable: true,
      },
      500: {
        message: 'Internal Server Error',
        userMessage: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        retryable: true,
      },
      502: {
        message: 'Bad Gateway',
        userMessage:
          '서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
        retryable: true,
      },
      503: {
        message: 'Service Unavailable',
        userMessage:
          '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
        retryable: true,
      },
    };

    const errorInfo = statusMessages[status] || {
      message: `HTTP ${status}`,
      userMessage: '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.',
      retryable: status >= 500,
    };

    return {
      isNetworkError: true,
      isRetryable: errorInfo.retryable,
      statusCode: status,
      message: errorInfo.message,
      userMessage: errorInfo.userMessage,
    };
  }

  // Generic error
  return {
    isNetworkError: false,
    isRetryable: false,
    message: error.message || 'Unknown error',
    userMessage: '오류가 발생했습니다. 다시 시도해주세요.',
  };
}

// Retry function with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if it's the last attempt or error is not retryable
      if (
        attempt === config.maxAttempts ||
        !config.retryCondition!(lastError)
      ) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;

      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }

  throw lastError!;
}

// Enhanced fetch with retry
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: Partial<RetryOptions> = {}
): Promise<Response> {
  return retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(
          `HTTP ${response.status}: ${response.statusText}`
        ) as any;
        error.status = response.status;
        error.response = response;
        throw error;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }, retryOptions);
}

// Form submission with retry and validation
export async function submitFormWithRetry<T>(
  url: string,
  data: T,
  options: {
    method?: string;
    headers?: Record<string, string>;
    retryOptions?: Partial<RetryOptions>;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<any> {
  const { method = 'POST', headers = {}, retryOptions = {}, onRetry } = options;

  return retryWithBackoff(
    async () => {
      try {
        const response = await fetchWithRetry(
          url,
          {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
            body: JSON.stringify(data),
          },
          retryOptions
        );

        const result = await response.json();

        if (!result.success) {
          const error = new Error(result.error || 'Submission failed') as any;
          error.validationErrors = result.validation_errors;
          error.isValidationError = !!result.validation_errors;
          throw error;
        }

        return result;
      } catch (error) {
        if (onRetry) {
          onRetry(1, error as Error); // This will be called for each retry
        }
        throw error;
      }
    },
    {
      ...retryOptions,
      retryCondition: error => {
        // Don't retry validation errors
        if ((error as any).isValidationError) {
          return false;
        }
        return isRetryableError(error);
      },
    }
  );
}

// File upload with retry and progress
export async function uploadFileWithRetry(
  url: string,
  file: File,
  options: {
    onProgress?: (progress: number) => void;
    onRetry?: (attempt: number, error: Error) => void;
    retryOptions?: Partial<RetryOptions>;
    additionalData?: Record<string, string>;
  } = {}
): Promise<any> {
  const {
    onProgress,
    onRetry,
    retryOptions = {},
    additionalData = {},
  } = options;

  return retryWithBackoff(
    async () => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        formData.append('file', file);
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });

        xhr.upload.addEventListener('progress', event => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            const error = new Error(
              `HTTP ${xhr.status}: ${xhr.statusText}`
            ) as any;
            error.status = xhr.status;
            reject(error);
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during file upload'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('File upload timeout'));
        });

        xhr.timeout = 60000; // 60 second timeout for file uploads
        xhr.open('POST', url);
        xhr.send(formData);
      });
    },
    {
      ...retryOptions,
      retryCondition: error => {
        // Don't retry client errors (4xx) except 408 and 429
        if ((error as any).status >= 400 && (error as any).status < 500) {
          return (error as any).status === 408 || (error as any).status === 429;
        }
        return isRetryableError(error);
      },
    }
  );
}

// Recovery strategies for different error types
export const recoveryStrategies = {
  // Network connectivity issues
  networkError: {
    title: '연결 문제',
    message: '인터넷 연결을 확인하고 다시 시도해주세요.',
    actions: [
      { label: '다시 시도', action: 'retry' },
      { label: '오프라인 저장', action: 'saveOffline' },
    ],
  },

  // Server errors
  serverError: {
    title: '서버 오류',
    message: '일시적인 서버 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    actions: [
      { label: '다시 시도', action: 'retry' },
      { label: '나중에 다시 시도', action: 'saveDraft' },
    ],
  },

  // Validation errors
  validationError: {
    title: '입력 오류',
    message: '입력 내용을 확인하고 수정해주세요.',
    actions: [{ label: '수정하기', action: 'edit' }],
  },

  // Authentication errors
  authError: {
    title: '인증 오류',
    message: '로그인이 필요합니다.',
    actions: [
      { label: '로그인', action: 'login' },
      { label: '임시 저장', action: 'saveLocal' },
    ],
  },

  // Permission errors
  permissionError: {
    title: '권한 오류',
    message: '이 작업을 수행할 권한이 없습니다.',
    actions: [{ label: '이전 페이지로', action: 'goBack' }],
  },
};

// Get appropriate recovery strategy for error
export function getRecoveryStrategy(error: any) {
  const errorInfo = analyzeNetworkError(error);

  if (errorInfo.statusCode === 401) {
    return recoveryStrategies.authError;
  }

  if (errorInfo.statusCode === 403) {
    return recoveryStrategies.permissionError;
  }

  if ((error as any).isValidationError) {
    return recoveryStrategies.validationError;
  }

  if (errorInfo.isNetworkError) {
    if (errorInfo.statusCode && errorInfo.statusCode >= 500) {
      return recoveryStrategies.serverError;
    }
    return recoveryStrategies.networkError;
  }

  return recoveryStrategies.serverError; // Default fallback
}
