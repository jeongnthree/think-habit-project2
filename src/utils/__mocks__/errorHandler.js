// errorHandler 모듈 모킹
export const logError = jest.fn();
export const getUserFriendlyMessage = jest
  .fn()
  .mockReturnValue('테스트 에러 메시지');
export const handleApiError = jest.fn();
export const handleComponentError = jest.fn();
export const setupGlobalErrorHandlers = jest.fn();

export class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}
