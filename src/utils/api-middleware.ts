import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
    createErrorResponse,
    createSuccessResponse,
    ERROR_CODES,
    HTTP_STATUS,
    logError,
    logInfo,
    validateRequest,
    type ApiErrorResponse,
    type ApiSuccessResponse
} from './server-validation';

// Enhanced API handler wrapper
export interface ApiHandlerOptions {
  requireAuth?: boolean;
  allowedRoles?: string[];
  rateLimitKey?: (request: NextRequest) => string;
  maxRequestSize?: number;
  validateContentType?: string[];
}

export interface ApiContext {
  request: NextRequest;
  requestId: string;
  user?: any;
  supabase: any;
}

export type ApiHandler<T = any> = (
  context: ApiContext
) => Promise<NextResponse<ApiSuccessResponse<T>> | NextResponse<ApiErrorResponse>>;

// Main API wrapper function
export function withApiHandler<T = any>(
  handler: ApiHandler<T>,
  options: ApiHandlerOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const {
      requireAuth = true,
      allowedRoles = [],
      rateLimitKey,
      maxRequestSize = 10 * 1024 * 1024, // 10MB
      validateContentType = [],
    } = options;

    // Generate rate limit key
    const rateLimitKeyValue = rateLimitKey ? rateLimitKey(request) : undefined;

    // Validate request
    const requestValidation = await validateRequest(request, {
      requireAuth,
      rateLimitKey: rateLimitKeyValue,
      maxRequestSize,
    });

    if (!requestValidation.success) {
      return requestValidation.response;
    }

    const { requestId } = requestValidation;

    try {
      // Content type validation
      if (validateContentType.length > 0) {
        const contentType = request.headers.get('content-type') || '';
        const isValidContentType = validateContentType.some(type => 
          contentType.includes(type)
        );

        if (!isValidContentType) {
          return createErrorResponse(
            `지원되지 않는 Content-Type입니다. 지원 형식: ${validateContentType.join(', ')}`,
            ERROR_CODES.INVALID_FORMAT,
            HTTP_STATUS.BAD_REQUEST,
            undefined,
            { received_content_type: contentType },
            requestId
          );
        }
      }

      // Initialize Supabase client
      const supabase = createClient();
      let user = null;

      // Authentication
      if (requireAuth) {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          logError(new Error('Authentication failed'), {
            requestId,
            endpoint: request.url,
            method: request.method,
          });

          return createErrorResponse(
            '인증이 필요합니다',
            ERROR_CODES.UNAUTHORIZED,
            HTTP_STATUS.UNAUTHORIZED,
            undefined,
            undefined,
            requestId
          );
        }

        user = authUser;

        // Role-based authorization
        if (allowedRoles.length > 0) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (!profile || !allowedRoles.includes(profile.role)) {
            return createErrorResponse(
              '접근 권한이 없습니다',
              ERROR_CODES.FORBIDDEN,
              HTTP_STATUS.FORBIDDEN,
              undefined,
              { required_roles: allowedRoles, user_role: profile?.role },
              requestId
            );
          }
        }
      }

      // Create API context
      const context: ApiContext = {
        request,
        requestId,
        user,
        supabase,
      };

      // Execute handler
      const result = await handler(context);

      // Log successful request
      const duration = Date.now() - startTime;
      logInfo('API request completed', {
        requestId,
        endpoint: request.url,
        method: request.method,
        userId: user?.id,
        duration,
      });

      return result;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      logError(error, {
        requestId,
        endpoint: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return createErrorResponse(
        '서버 오류가 발생했습니다',
        ERROR_CODES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        undefined,
        process.env.NODE_ENV === 'development' ? { 
          stack: error.stack,
          message: error.message 
        } : undefined,
        requestId
      );
    }
  };
}

// Specialized handlers for common patterns
export function withAuthHandler<T = any>(
  handler: ApiHandler<T>,
  allowedRoles: string[] = []
) {
  return withApiHandler(handler, {
    requireAuth: true,
    allowedRoles,
  });
}

export function withPublicHandler<T = any>(
  handler: ApiHandler<T>,
  options: Omit<ApiHandlerOptions, 'requireAuth'> = {}
) {
  return withApiHandler(handler, {
    ...options,
    requireAuth: false,
  });
}

export function withAdminHandler<T = any>(
  handler: ApiHandler<T>
) {
  return withApiHandler(handler, {
    requireAuth: true,
    allowedRoles: ['admin'],
  });
}

export function withTeacherHandler<T = any>(
  handler: ApiHandler<T>
) {
  return withApiHandler(handler, {
    requireAuth: true,
    allowedRoles: ['admin', 'teacher', 'coach'],
  });
}

export function withStudentHandler<T = any>(
  handler: ApiHandler<T>
) {
  return withApiHandler(handler, {
    requireAuth: true,
    allowedRoles: ['admin', 'teacher', 'coach', 'student'],
  });
}

// File upload handler
export function withFileUploadHandler<T = any>(
  handler: ApiHandler<T>,
  options: {
    maxFileSize?: number;
    allowedMimeTypes?: string[];
    maxFiles?: number;
  } = {}
) {
  const {
    maxFileSize = 10 * 1024 * 1024, // 10MB
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles = 10,
  } = options;

  return withApiHandler(async (context) => {
    const { request, requestId } = context;

    // Validate multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return createErrorResponse(
        'multipart/form-data 형식이 필요합니다',
        ERROR_CODES.INVALID_FORMAT,
        HTTP_STATUS.BAD_REQUEST,
        undefined,
        undefined,
        requestId
      );
    }

    try {
      const formData = await request.formData();
      const files: File[] = [];

      // Extract files from form data
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          files.push(value);
        }
      }

      // Validate file count
      if (files.length > maxFiles) {
        return createErrorResponse(
          `파일 개수가 너무 많습니다. 최대 ${maxFiles}개까지 업로드할 수 있습니다`,
          ERROR_CODES.QUOTA_EXCEEDED,
          HTTP_STATUS.BAD_REQUEST,
          undefined,
          { max_files: maxFiles, received_files: files.length },
          requestId
        );
      }

      // Validate each file
      for (const file of files) {
        // File size validation
        if (file.size > maxFileSize) {
          return createErrorResponse(
            `파일 크기가 너무 큽니다. 최대 크기: ${Math.round(maxFileSize / (1024 * 1024))}MB`,
            ERROR_CODES.FILE_TOO_LARGE,
            HTTP_STATUS.BAD_REQUEST,
            undefined,
            { 
              max_size: maxFileSize, 
              file_size: file.size, 
              file_name: file.name 
            },
            requestId
          );
        }

        // MIME type validation
        if (!allowedMimeTypes.includes(file.type)) {
          return createErrorResponse(
            `지원되지 않는 파일 형식입니다. 지원 형식: ${allowedMimeTypes.join(', ')}`,
            ERROR_CODES.INVALID_FILE_TYPE,
            HTTP_STATUS.BAD_REQUEST,
            undefined,
            { 
              allowed_types: allowedMimeTypes, 
              file_type: file.type, 
              file_name: file.name 
            },
            requestId
          );
        }
      }

      // Add files to context
      const enhancedContext = {
        ...context,
        files,
        formData,
      };

      return await handler(enhancedContext as any);

    } catch (error: any) {
      logError(error, {
        requestId,
      });

      return createErrorResponse(
        '파일 처리 중 오류가 발생했습니다',
        ERROR_CODES.UPLOAD_FAILED,
        HTTP_STATUS.BAD_REQUEST,
        undefined,
        undefined,
        requestId
      );
    }
  }, {
    requireAuth: true,
    maxRequestSize: maxFileSize * maxFiles,
  });
}

// Database transaction wrapper for API handlers
export async function withTransaction<T>(
  supabase: any,
  operation: (client: any) => Promise<T>,
  requestId?: string
): Promise<T> {
  try {
    // Note: Supabase doesn't have explicit transaction support in the client
    // This is a placeholder for when/if they add it, or for custom transaction logic
    return await operation(supabase);
  } catch (error: any) {
    logError(error, {
      requestId,
    });
    throw error;
  }
}

// Response helpers with consistent formatting
export function apiSuccess<T>(
  data: T,
  message?: string,
  status: number = HTTP_STATUS.OK,
  requestId?: string
) {
  return createSuccessResponse(data, message, status, requestId);
}

export function apiError(
  message: string,
  errorCode: string = ERROR_CODES.INTERNAL_ERROR,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  validationErrors?: any[],
  details?: any,
  requestId?: string
) {
  return createErrorResponse(message, errorCode, status, validationErrors, details, requestId);
}

// Pagination helper
export function paginate<T>(
  items: T[],
  page: number,
  limit: number,
  total?: number
) {
  const totalItems = total ?? items.length;
  const totalPages = Math.ceil(totalItems / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    items,
    pagination: {
      page,
      limit,
      total: totalItems,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
}