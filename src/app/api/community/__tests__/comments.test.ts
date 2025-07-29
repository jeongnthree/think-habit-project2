import { NextRequest } from 'next/server';
import { GET, POST } from '../comments/route';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
  createAuthErrorResponse: jest.fn(
    () =>
      new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
      })
  ),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/contentFilter', () => ({
  validateComment: jest.fn(),
}));

const mockSupabase = {
  from: jest.fn(),
  select: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
  insert: jest.fn(),
  order: jest.fn(),
};

const mockQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
};

describe('/api/community/comments', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { createClient } = require('@/lib/supabase/server');
    createClient.mockReturnValue(mockSupabase);

    mockSupabase.from.mockReturnValue(mockQuery);
  });

  describe('GET /api/community/comments', () => {
    it('should return comments for a public journal', async () => {
      // Mock journal check (public)
      mockQuery.select.mockResolvedValueOnce({
        data: { is_public: true },
        error: null,
      });

      // Mock comments query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'comment1',
                    journal_id: 'journal1',
                    author_id: 'user1',
                    content: '좋은 일지네요!',
                    comment_type: 'comment',
                    created_at: '2024-01-15T10:00:00Z',
                    updated_at: '2024-01-15T10:00:00Z',
                    is_hidden: false,
                    user_profiles: {
                      user_id: 'user1',
                      full_name: '김학습',
                      role: 'student',
                    },
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/community/comments?journalId=journal1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toMatchObject({
        id: 'comment1',
        content: '좋은 일지네요!',
        author: {
          id: 'user1',
          full_name: '김학습',
          role: 'student',
        },
      });
    });

    it('should return 400 when journalId is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/community/comments'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Journal ID is required');
    });

    it('should return 404 when journal is not found', async () => {
      mockQuery.select.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/community/comments?journalId=nonexistent'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Journal not found');
    });

    it('should return 403 when journal is not public', async () => {
      mockQuery.select.mockResolvedValueOnce({
        data: { is_public: false },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/community/comments?journalId=private-journal'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('This journal is not public');
    });

    it('should handle database errors when fetching comments', async () => {
      mockQuery.select.mockResolvedValueOnce({
        data: { is_public: true },
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/community/comments?journalId=journal1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch comments');
    });
  });

  describe('POST /api/community/comments', () => {
    it('should create a comment successfully', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      const { validateComment } = require('@/lib/contentFilter');

      getCurrentUser.mockResolvedValue({ id: 'user1' });

      // Mock user profile query
      mockQuery.select.mockResolvedValueOnce({
        data: {
          role: 'student',
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      // Mock content validation
      validateComment.mockReturnValue({
        isValid: true,
        filteredContent: '좋은 일지네요!',
        errors: [],
        warnings: [],
      });

      // Mock journal check (public)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { is_public: true },
              error: null,
            }),
          }),
        }),
      });

      // Mock comment insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'new-comment',
                journal_id: 'journal1',
                author_id: 'user1',
                content: '좋은 일지네요!',
                comment_type: 'comment',
                created_at: '2024-01-15T10:00:00Z',
                updated_at: '2024-01-15T10:00:00Z',
                user_profiles: {
                  user_id: 'user1',
                  full_name: '김학습',
                  role: 'student',
                },
              },
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/community/comments',
        {
          method: 'POST',
          body: JSON.stringify({
            journal_id: 'journal1',
            content: '좋은 일지네요!',
            comment_type: 'comment',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: 'new-comment',
        content: '좋은 일지네요!',
        author: {
          id: 'user1',
          full_name: '김학습',
          role: 'student',
        },
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      getCurrentUser.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/community/comments',
        {
          method: 'POST',
          body: JSON.stringify({
            journal_id: 'journal1',
            content: '댓글 내용',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when required fields are missing', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      getCurrentUser.mockResolvedValue({ id: 'user1' });

      const request = new NextRequest(
        'http://localhost:3000/api/community/comments',
        {
          method: 'POST',
          body: JSON.stringify({
            journal_id: 'journal1',
            // content is missing
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Journal ID and content are required');
    });

    it('should return 400 when content validation fails', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      const { validateComment } = require('@/lib/contentFilter');

      getCurrentUser.mockResolvedValue({ id: 'user1' });

      mockQuery.select.mockResolvedValueOnce({
        data: {
          role: 'student',
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      validateComment.mockReturnValue({
        isValid: false,
        errors: ['부적절한 내용이 포함되어 있습니다.'],
        warnings: [],
      });

      const request = new NextRequest(
        'http://localhost:3000/api/community/comments',
        {
          method: 'POST',
          body: JSON.stringify({
            journal_id: 'journal1',
            content: '부적절한 내용',
            comment_type: 'comment',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('부적절한 내용이 포함되어 있습니다.');
    });

    it('should return 400 for invalid comment type', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      getCurrentUser.mockResolvedValue({ id: 'user1' });

      mockQuery.select.mockResolvedValueOnce({
        data: {
          role: 'student',
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/community/comments',
        {
          method: 'POST',
          body: JSON.stringify({
            journal_id: 'journal1',
            content: '댓글 내용',
            comment_type: 'invalid_type',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid comment type');
    });

    it('should return 404 when journal is not found', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      const { validateComment } = require('@/lib/contentFilter');

      getCurrentUser.mockResolvedValue({ id: 'user1' });

      mockQuery.select.mockResolvedValueOnce({
        data: {
          role: 'student',
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      validateComment.mockReturnValue({
        isValid: true,
        filteredContent: '댓글 내용',
        errors: [],
        warnings: [],
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/community/comments',
        {
          method: 'POST',
          body: JSON.stringify({
            journal_id: 'nonexistent',
            content: '댓글 내용',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Journal not found');
    });

    it('should return 403 when trying to comment on private journal', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      const { validateComment } = require('@/lib/contentFilter');

      getCurrentUser.mockResolvedValue({ id: 'user1' });

      mockQuery.select.mockResolvedValueOnce({
        data: {
          role: 'student',
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      validateComment.mockReturnValue({
        isValid: true,
        filteredContent: '댓글 내용',
        errors: [],
        warnings: [],
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { is_public: false },
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/community/comments',
        {
          method: 'POST',
          body: JSON.stringify({
            journal_id: 'private-journal',
            content: '댓글 내용',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Cannot comment on private journals');
    });

    it('should handle database insertion errors', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      const { validateComment } = require('@/lib/contentFilter');

      getCurrentUser.mockResolvedValue({ id: 'user1' });

      mockQuery.select.mockResolvedValueOnce({
        data: {
          role: 'student',
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      validateComment.mockReturnValue({
        isValid: true,
        filteredContent: '댓글 내용',
        errors: [],
        warnings: [],
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { is_public: true },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Insert failed' },
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/community/comments',
        {
          method: 'POST',
          body: JSON.stringify({
            journal_id: 'journal1',
            content: '댓글 내용',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create comment');
    });
  });
});
