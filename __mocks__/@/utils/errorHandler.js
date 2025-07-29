// Mock for @/utils/errorHandler
export const logError = jest.fn();

export const getUserFriendlyMessage = jest.fn().mockImplementation(error => {
  return '오류가 발생했습니다. 다시 시도해주세요.';
});
