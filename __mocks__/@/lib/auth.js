// Mock for @/lib/auth
export const getCurrentUser = jest.fn().mockResolvedValue({
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'student',
  full_name: 'Test User',
});

export const hasPermission = jest.fn().mockReturnValue(true);

export const isAdmin = jest.fn().mockReturnValue(false);

export const isTeacherOrAdmin = jest.fn().mockReturnValue(false);

export const isCoachOrAbove = jest.fn().mockReturnValue(false);

export const getAuthUserFromRequest = jest.fn().mockResolvedValue({
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'student',
  full_name: 'Test User',
});

export const createAuthErrorResponse = jest
  .fn()
  .mockReturnValue(
    Response.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
  );

export const createPermissionErrorResponse = jest
  .fn()
  .mockReturnValue(
    Response.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  );
