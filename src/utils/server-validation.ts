import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Enhanced error response types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  error_code: string;
  validation_errors?: ValidationError[];
  details?: any;
  timestamp: string;
  request_id?: string;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  request_id?: string;
}

// HTTP status codes with descriptions
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error codes for different types of validation failures
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Business Logic
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // File Upload
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',

  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Generic
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Enhanced error response helper
export function createErrorResponse(
  message: string,
  errorCode: string = ERROR_CODES.INTERNAL_ERROR,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  validationErrors?: ValidationError[],
  details?: any,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: message,
    error_code: errorCode,
    timestamp: new Date().toISOString(),
    ...(requestId && { request_id: requestId }),
    ...(validationErrors && { validation_errors: validationErrors }),
    ...(details && { details }),
  };

  return NextResponse.json(response, { status });
}

// Enhanced success response helper
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = HTTP_STATUS.OK,
  requestId?: string
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(message && { message }),
    ...(requestId && { request_id: requestId }),
  };

  return NextResponse.json(response, { status });
}

// Zod error to validation errors converter
export function zodErrorToValidationErrors(
  error: z.ZodError
): ValidationError[] {
  return error.issues.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    value: err.path.length > 0 ? undefined : err.message, // Don't expose values for security
  }));
}

// Enhanced validation wrapper
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  requestId?: string
):
  | { success: true; data: T }
  | { success: false; response: NextResponse<ApiErrorResponse> } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = zodErrorToValidationErrors(error);
      return {
        success: false,
        response: createErrorResponse(
          '입력 데이터 검증에 실패했습니다.',
          ERROR_CODES.VALIDATION_FAILED,
          HTTP_STATUS.BAD_REQUEST,
          validationErrors,
          { schema_errors: error.issues },
          requestId
        ),
      };
    }

    return {
      success: false,
      response: createErrorResponse(
        '데이터 검증 중 오류가 발생했습니다.',
        ERROR_CODES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        undefined,
        undefined,
        requestId
      ),
    };
  }
}

// Database transaction wrapper with error handling
export async function withDatabaseTransaction<T>(
  operation: () => Promise<T>,
  requestId?: string
): Promise<
  | { success: true; data: T }
  | { success: false; response: NextResponse<ApiErrorResponse> }
> {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Database transaction error:', error);

    // Handle specific database errors
    if (error.code === '23505') {
      // Unique constraint violation
      return {
        success: false,
        response: createErrorResponse(
          '중복된 데이터가 존재합니다.',
          ERROR_CODES.DUPLICATE_RESOURCE,
          HTTP_STATUS.CONFLICT,
          undefined,
          { database_error: error.message },
          requestId
        ),
      };
    }

    if (error.code === '23503') {
      // Foreign key constraint violation
      return {
        success: false,
        response: createErrorResponse(
          '참조된 데이터가 존재하지 않습니다.',
          ERROR_CODES.RESOURCE_NOT_FOUND,
          HTTP_STATUS.BAD_REQUEST,
          undefined,
          { database_error: error.message },
          requestId
        ),
      };
    }

    return {
      success: false,
      response: createErrorResponse(
        '데이터베이스 작업 중 오류가 발생했습니다.',
        ERROR_CODES.DATABASE_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        undefined,
        { database_error: error.message },
        requestId
      ),
    };
  }
}

// File validation utilities
export const FILE_VALIDATION = {
  IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/webp',
  ],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 10,

  validateFile: (file: File): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!FILE_VALIDATION.IMAGE_TYPES.includes(file.type)) {
      errors.push({
        field: 'file.type',
        message: `지원되지 않는 파일 형식입니다. 지원 형식: ${FILE_VALIDATION.IMAGE_TYPES.join(
          ', '
        )}`,
        code: ERROR_CODES.INVALID_FILE_TYPE,
        value: file.type,
      });
    }

    if (file.size > FILE_VALIDATION.MAX_FILE_SIZE) {
      errors.push({
        field: 'file.size',
        message: `파일 크기가 너무 큽니다. 최대 크기: ${
          FILE_VALIDATION.MAX_FILE_SIZE / (1024 * 1024)
        }MB`,
        code: ERROR_CODES.FILE_TOO_LARGE,
        value: file.size,
      });
    }

    return errors;
  },

  validateFiles: (files: File[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (files.length > FILE_VALIDATION.MAX_FILES_PER_UPLOAD) {
      errors.push({
        field: 'files.length',
        message: `파일 개수가 너무 많습니다. 최대 개수: ${FILE_VALIDATION.MAX_FILES_PER_UPLOAD}개`,
        code: ERROR_CODES.QUOTA_EXCEEDED,
        value: files.length,
      });
    }

    files.forEach((file, index) => {
      const fileErrors = FILE_VALIDATION.validateFile(file);
      fileErrors.forEach(error => {
        errors.push({
          ...error,
          field: `files[${index}].${error.field}`,
        });
      });
    });

    return errors;
  },
};

// Rate limiting utilities
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60 * 1000 // 1 minute
  ) {}

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];

    // Filter out old requests
    const recentRequests = requests.filter(
      timestamp => timestamp > windowStart
    );

    // Update the requests array
    this.requests.set(identifier, recentRequests);

    // Check if rate limit is exceeded
    if (recentRequests.length >= this.maxRequests) {
      return true;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return false;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const requests = this.requests.get(identifier) || [];
    const recentRequests = requests.filter(
      timestamp => timestamp > windowStart
    );

    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter(100, 60 * 1000); // 100 requests per minute

// Request validation middleware
export async function validateRequest(
  request: NextRequest,
  options: {
    requireAuth?: boolean;
    rateLimitKey?: string;
    maxRequestSize?: number;
  } = {}
): Promise<
  | {
      success: true;
      requestId: string;
      user?: any;
    }
  | {
      success: false;
      response: NextResponse<ApiErrorResponse>;
    }
> {
  const requestId = generateRequestId();
  const {
    requireAuth = true,
    rateLimitKey,
    maxRequestSize = 10 * 1024 * 1024,
  } = options;

  try {
    // Rate limiting
    if (rateLimitKey) {
      if (globalRateLimiter.isRateLimited(rateLimitKey)) {
        return {
          success: false,
          response: createErrorResponse(
            '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
            ERROR_CODES.RATE_LIMIT_EXCEEDED,
            HTTP_STATUS.TOO_MANY_REQUESTS,
            undefined,
            {
              remaining_requests:
                globalRateLimiter.getRemainingRequests(rateLimitKey),
              reset_time: new Date(Date.now() + 60 * 1000).toISOString(),
            },
            requestId
          ),
        };
      }
    }

    // Request size validation
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxRequestSize) {
      return {
        success: false,
        response: createErrorResponse(
          '요청 크기가 너무 큽니다.',
          ERROR_CODES.FILE_TOO_LARGE,
          HTTP_STATUS.BAD_REQUEST,
          undefined,
          { max_size: maxRequestSize, actual_size: parseInt(contentLength) },
          requestId
        ),
      };
    }

    // Authentication (if required)
    let user = null;
    if (requireAuth) {
      // This would be implemented based on your auth system
      // For now, we'll assume it's handled elsewhere
    }

    return {
      success: true,
      requestId,
      user: user || undefined,
    };
  } catch (error) {
    console.error('Request validation error:', error);
    return {
      success: false,
      response: createErrorResponse(
        '요청 검증 중 오류가 발생했습니다.',
        ERROR_CODES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        undefined,
        undefined,
        requestId
      ),
    };
  }
}

// Logging utilities
export function logError(
  error: Error,
  context: {
    requestId?: string;
    userId?: string;
    endpoint?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
  } = {}
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: error.message,
    stack: error.stack,
    ...context,
  };

  // In production, you would send this to your logging service
  console.error('API Error:', logEntry);

  // You could also send to external services like Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'production') {
    // sendToLoggingService(logEntry);
  }
}

export function logInfo(
  message: string,
  context: {
    requestId?: string;
    userId?: string;
    endpoint?: string;
    method?: string;
    duration?: number;
  } = {}
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message,
    ...context,
  };

  console.log('API Info:', logEntry);
}

// Performance monitoring
export function withPerformanceMonitoring<T>(
  operation: () => Promise<T>,
  operationName: string,
  requestId?: string
): Promise<T> {
  const startTime = Date.now();

  return operation()
    .then(result => {
      const duration = Date.now() - startTime;
      logInfo(`${operationName} completed`, { requestId, duration });
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      logError(error, { requestId, endpoint: operationName, duration });
      throw error;
    });
}
