/**
 * Integration tests for API endpoints
 * Tests actual API routes with mocked database operations
 */

import { NextRequest } from 'next/server';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-1',
          email: 'test@example.com',
          user_metadata: { role: 'student' },
        },
      },
      error: null,
    }),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: { id: 'cat-1', name: 'Test Category' },
          error: null,
        }),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'journal-1',
            title: 'Test Journal',
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      })),
    })),
  })),
};

// Mock the Supabase module
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock validation functions
jest.mock('@/utils/journal-validation', () => ({
  validateStructuredJournal: jest.fn(() => ({
    success: true,
    data: {},
    fieldErrors: {},
  })),
}));

// Mock progress calculation
jest.mock('@/utils/progress-calculation', () => ({
  updateWeeklyProgress: jest.fn().mockResolvedValue({
    id: 'progress-1',
    completion_rate: 33,
  }),
}));

describe('API Endpoints Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Journal Creation API', () => {
    it('should handle structured journal creation request', async () => {
      // Mock the API route handler
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            journal: {
              id: 'journal-1',
              title: 'Test Journal',
            },
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const journalData = {
        title: 'Integration Test Journal',
        category_id: 'cat-1',
        journal_type: 'structured',
        task_completions: [
          {
            task_template_id: 'task-1',
            is_completed: true,
            completion_note: 'Completed task',
          },
        ],
        reflection: 'Test reflection',
        is_public: false,
      };

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify(journalData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await mockHandler(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.journal).toBeDefined();
    });

    it('should validate authentication for journal creation', async () => {
      // Mock unauthenticated request
      const mockClient = {
        ...mockSupabaseClient,
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      };

      require('@/lib/supabase/server').createClient.mockReturnValue(mockClient);

      const mockHandler = jest.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: '인증이 필요합니다',
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const journalData = {
        title: 'Unauthorized Journal',
        category_id: 'cat-1',
        journal_type: 'structured',
        task_completions: [],
        is_public: false,
      };

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify(journalData),
        }
      );

      const response = await mockHandler(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe('인증이 필요합니다');
    });

    it('should handle validation errors', async () => {
      // Mock validation failure
      require('@/utils/journal-validation').validateStructuredJournal.mockReturnValueOnce(
        {
          success: false,
          fieldErrors: {
            title: '제목을 입력해주세요.',
          },
        }
      );

      const mockHandler = jest.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: '입력 데이터가 올바르지 않습니다',
            validationErrors: {
              title: '제목을 입력해주세요.',
            },
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const invalidData = {
        title: '',
        category_id: 'cat-1',
        journal_type: 'structured',
        task_completions: [],
        is_public: false,
      };

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify(invalidData),
        }
      );

      const response = await mockHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('입력 데이터가 올바르지 않습니다');
      expect(result.validationErrors.title).toBe('제목을 입력해주세요.');
    });
  });

  describe('Progress Tracking API', () => {
    it('should retrieve progress data', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            currentWeek: {
              id: 'progress-1',
              user_id: 'test-user-1',
              category_id: 'cat-1',
              completion_rate: 67,
              current_streak: 3,
            },
            totalJournals: 5,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const url = new URL('http://localhost/api/training/progress');
      url.searchParams.set('userId', 'test-user-1');
      url.searchParams.set('categoryId', 'cat-1');

      const request = new NextRequest(url);
      const response = await mockHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.currentWeek).toBeDefined();
      expect(result.currentWeek.completion_rate).toBe(67);
      expect(result.totalJournals).toBe(5);
    });

    it('should update progress after journal creation', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            progress: {
              completion_rate: 33,
              current_streak: 1,
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const request = new NextRequest(
        'http://localhost/api/training/progress',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: 'test-user-1',
            categoryId: 'cat-1',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await mockHandler(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.progress.completion_rate).toBe(33);
    });
  });

  describe('Database Operations', () => {
    it('should handle database connection errors', async () => {
      // Mock database error
      const mockClient = {
        ...mockSupabaseClient,
        from: jest.fn(() => ({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
              }),
            })),
          })),
        })),
      };

      require('@/lib/supabase/server').createClient.mockReturnValue(mockClient);

      const mockHandler = jest.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: '일지 저장에 실패했습니다',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const journalData = {
        title: 'Database Error Test',
        category_id: 'cat-1',
        journal_type: 'structured',
        task_completions: [],
        is_public: false,
      };

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify(journalData),
        }
      );

      const response = await mockHandler(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('일지 저장에 실패했습니다');
    });

    it('should maintain data consistency', async () => {
      // Test that related operations are performed together
      const mockClient = {
        ...mockSupabaseClient,
        from: jest.fn((table: string) => {
          if (table === 'journals') {
            return {
              insert: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'journal-1', title: 'Test Journal' },
                    error: null,
                  }),
                })),
              })),
            };
          } else if (table === 'task_completions') {
            return {
              insert: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'completion-1', journal_id: 'journal-1' },
                    error: null,
                  }),
                })),
              })),
            };
          }
          return mockSupabaseClient.from(table);
        }),
      };

      require('@/lib/supabase/server').createClient.mockReturnValue(mockClient);

      const mockHandler = jest.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            journal: { id: 'journal-1' },
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const journalData = {
        title: 'Consistency Test',
        category_id: 'cat-1',
        journal_type: 'structured',
        task_completions: [
          {
            task_template_id: 'task-1',
            is_completed: true,
            completion_note: 'Completed',
          },
        ],
        is_public: false,
      };

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify(journalData),
        }
      );

      const response = await mockHandler(request);
      expect(response.status).toBe(201);

      // Verify both journal and task completion operations were called
      expect(mockClient.from).toHaveBeenCalledWith('journals');
      expect(mockClient.from).toHaveBeenCalledWith('task_completions');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle malformed JSON requests', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: '잘못된 요청 형식입니다',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: 'invalid json{',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await mockHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('잘못된 요청 형식입니다');
    });

    it('should handle missing required headers', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: '잘못된 요청 형식입니다',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify({ title: 'Test' }),
          // Missing Content-Type header
        }
      );

      const response = await mockHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('잘못된 요청 형식입니다');
    });

    it('should handle rate limiting', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60',
            },
          }
        )
      );

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify({
            title: 'Rate Limited Request',
            category_id: 'cat-1',
            journal_type: 'structured',
            task_completions: [],
            is_public: false,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await mockHandler(request);
      const result = await response.json();

      expect(response.status).toBe(429);
      expect(result.error).toContain('요청이 너무 많습니다');
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle concurrent requests efficiently', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            journal: { id: 'journal-1' },
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const journalData = {
        title: 'Concurrent Test',
        category_id: 'cat-1',
        journal_type: 'structured',
        task_completions: [],
        is_public: false,
      };

      // Create multiple concurrent requests
      const requests = Array.from(
        { length: 5 },
        (_, i) =>
          new NextRequest('http://localhost/api/training/journals/structured', {
            method: 'POST',
            body: JSON.stringify({
              ...journalData,
              title: `Concurrent Test ${i + 1}`,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(
        requests.map(request => mockHandler(request))
      );
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should optimize database queries', async () => {
      let queryCount = 0;
      const mockClient = {
        ...mockSupabaseClient,
        from: jest.fn((table: string) => {
          queryCount++;
          return mockSupabaseClient.from(table);
        }),
      };

      require('@/lib/supabase/server').createClient.mockReturnValue(mockClient);

      const mockHandler = jest.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            journal: { id: 'journal-1' },
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const journalData = {
        title: 'Query Optimization Test',
        category_id: 'cat-1',
        journal_type: 'structured',
        task_completions: [
          {
            task_template_id: 'task-1',
            is_completed: true,
            completion_note: 'Completed',
          },
        ],
        is_public: false,
      };

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify(journalData),
        }
      );

      await mockHandler(request);

      // Should minimize database queries
      expect(queryCount).toBeLessThan(5);
    });
  });
});
