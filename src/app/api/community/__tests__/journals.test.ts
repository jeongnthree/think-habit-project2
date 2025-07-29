import { NextRequest } from 'next/server';
import { GET } from '../journals/route';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockSupabase = {
  from: jest.fn(),
  select: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  range: jest.fn(),
  in: jest.fn(),
};

const mockQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
};

describe('/api/community/journals', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockReturnValue(mockSupabase);

    mockSupabase.from.mockReturnValue(mockQuery);
  });

  describe('GET /api/community/journals', () => {
    it('should return public journals successfully', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      getCurrentUser.mockResolvedValue({ id: 'user1' });

      // Mock journals query
      mockQuery.select.mockResolvedValueOnce({
        data: [
          {
            id: 'journal1',
            student_id: 'user1',
            category_id: 'cat1',
            title: '테스트 일지',
            content: '테스트 내용',
            attachments: [],
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
            user_profiles: {
              user_id: 'user1',
              full_name: '김학습',
            },
            categories: {
              id: 'cat1',
              name: '비판적 사고',
            },
          },
        ],
        error: null,
      });

      // Mock comment counts query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          data: [{ journal_id: 'journal1' }],
          error: null,
        }),
      });

      // Mock encouragement counts query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          data: [
            { journal_id: 'journal1', user_id: 'user2' },
            { journal_id: 'journal1', user_id: 'user3' },
          ],
          error: null,
        }),
      });

      // Mock total count query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          count: 1,
          error: null,
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/community/journals'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toMatchObject({
        id: 'journal1',
        title: '테스트 일지',
        comment_count: 1,
        encouragement_count: 2,
        user_has_encouraged: false,
      });
      expect(data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter by category when categoryId is provided', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      getCurrentUser.mockResolvedValue({ id: 'user1' });

      mockQuery.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/community/journals?categoryId=cat1'
      );
      await GET(request);

      // Verify that eq was called with category filter
      expect(mockQuery.eq).toHaveBeenCalledWith('category_id', 'cat1');
    });

    it('should handle pagination parameters', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      getCurrentUser.mockResolvedValue({ id: 'user1' });

      mockQuery.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/community/journals?page=2&limit=5'
      );
      await GET(request);

      // Verify pagination range (page 2, limit 5 = range 5-9)
      expect(mockQuery.range).toHaveBeenCalledWith(5, 9);
    });

    it('should handle database errors', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      getCurrentUser.mockResolvedValue({ id: 'user1' });

      mockQuery.select.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/community/journals'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch journals');
    });

    it('should return empty data when no journals found', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      getCurrentUser.mockResolvedValue({ id: 'user1' });

      mockQuery.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/community/journals'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    });

    it('should handle user encouragement status correctly', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      getCurrentUser.mockResolvedValue({ id: 'current-user' });

      mockQuery.select.mockResolvedValueOnce({
        data: [
          {
            id: 'journal1',
            student_id: 'user1',
            category_id: 'cat1',
            title: '테스트 일지',
            content: '테스트 내용',
            attachments: [],
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
            user_profiles: {
              user_id: 'user1',
              full_name: '김학습',
            },
            categories: {
              id: 'cat1',
              name: '비판적 사고',
            },
          },
        ],
        error: null,
      });

      // Mock comment counts
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      // Mock encouragement counts with current user
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          data: [
            { journal_id: 'journal1', user_id: 'current-user' },
            { journal_id: 'journal1', user_id: 'user2' },
          ],
          error: null,
        }),
      });

      // Mock total count
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          count: 1,
          error: null,
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/community/journals'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.data[0].user_has_encouraged).toBe(true);
      expect(data.data[0].encouragement_count).toBe(2);
    });

    it('should handle unexpected errors', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      getCurrentUser.mockRejectedValue(new Error('Unexpected error'));

      const request = new NextRequest(
        'http://localhost:3000/api/community/journals'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });
});
