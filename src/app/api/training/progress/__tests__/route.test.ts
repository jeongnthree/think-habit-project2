import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(),
              })),
            })),
          })),
        })),
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
}));

// Mock progress calculation
jest.mock('@/utils/progress-calculation', () => ({
  updateWeeklyProgress: jest.fn(),
  analyzeProgressHistory: jest.fn(),
  calculateConsistencyScore: jest.fn(),
  predictWeeklyGoalCompletion: jest.fn(),
  compareWithPreviousWeek: jest.fn(),
}));

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(),
            })),
          })),
        })),
      })),
    })),
    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
  })),
};

const mockProgressData = {
  id: '1',
  user_id: 'user1',
  category_id: 'cat1',
  week_start_date: '2024-01-01',
  target_count: 3,
  completed_count: 2,
  completion_rate: 67,
  current_streak: 5,
  best_streak: 10,
  last_entry_date: '2024-01-03',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-03T00:00:00Z',
};

const mockJournals = [
  {
    id: '1',
    user_id: 'user1',
    category_id: 'cat1',
    title: 'Journal 1',
    created_at: '2024-01-01T10:00:00Z',
  },
  {
    id: '2',
    user_id: 'user1',
    category_id: 'cat1',
    title: 'Journal 2',
    created_at: '2024-01-02T10:00:00Z',
  },
];

describe('/api/training/progress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    require('@/lib/supabase/server').createClient.mockReturnValue(mockSupabase);
    
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user1' } },
      error: null,
    });

    // Mock progress calculation functions
    require('@/utils/progress-calculation').analyzeProgressHistory.mockReturnValue({
      trends: [],
      averageCompletionRate: 67,
      improvementTrend: 'stable',
      bestWeek: null,
      worstWeek: null,
      streakAnalysis: {
        currentStreakWeeks: 1,
        longestStreakWeeks: 2,
        averageStreak: 5,
      },
      consistencyScore: 75,
      volatility: 'low',
      seasonalPattern: {
        bestMonth: '1월',
        worstMonth: '1월',
        monthlyAverages: { '1월': 67 },
      },
    });

    require('@/utils/progress-calculation').calculateConsistencyScore.mockReturnValue({
      score: 75,
      level: 'good',
      consistentWeeks: 3,
    });

    require('@/utils/progress-calculation').predictWeeklyGoalCompletion.mockReturnValue({
      willComplete: true,
      daysNeeded: 2,
      confidence: 80,
      recommendation: '현재 페이스를 유지하면 목표를 달성할 수 있어요!',
    });

    require('@/utils/progress-calculation').compareWithPreviousWeek.mockReturnValue({
      completionRateChange: 10,
      streakChange: 2,
      improvement: true,
      message: '지난주보다 10% 향상되었어요.',
    });
  });

  describe('GET', () => {
    it('returns progress data successfully', async () => {
      // Mock database queries
      mockSupabase.from().select().eq().gte().lte().order().limit
        .mockResolvedValueOnce({
          data: [mockProgressData],
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockJournals,
          error: null,
        });

      const url = new URL('http://localhost/api/training/progress');
      url.searchParams.set('userId', 'user1');
      url.searchParams.set('categoryId', 'cat1');
      url.searchParams.set('weeks', '4');

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.currentWeek).toEqual(mockProgressData);
      expect(data.history).toEqual([mockProgressData]);
      expect(data.totalJournals).toBe(2);
      expect(data.analysis).toBeDefined();
      expect(data.consistency).toBeDefined();
      expect(data.prediction).toBeDefined();
      expect(data.comparison).toBeDefined();
    });

    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const url = new URL('http://localhost/api/training/progress');
      url.searchParams.set('userId', 'user1');
      url.searchParams.set('categoryId', 'cat1');

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('인증이 필요합니다');
    });

    it('returns 400 when required parameters are missing', async () => {
      const url = new URL('http://localhost/api/training/progress');
      // Missing userId and categoryId

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('userId와 categoryId가 필요합니다');
    });

    it('uses default weeks parameter', async () => {
      mockSupabase.from().select().eq().gte().lte().order().limit
        .mockResolvedValueOnce({
          data: [mockProgressData],
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockJournals,
          error: null,
        });

      const url = new URL('http://localhost/api/training/progress');
      url.searchParams.set('userId', 'user1');
      url.searchParams.set('categoryId', 'cat1');
      // No weeks parameter

      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Should use default of 12 weeks
    });

    it('handles database query errors', async () => {
      mockSupabase.from().select().eq().gte().lte().order().limit
        .mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        });

      const url = new URL('http://localhost/api/training/progress');
      url.searchParams.set('userId', 'user1');
      url.searchParams.set('categoryId', 'cat1');

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('진행률 조회에 실패했습니다');
    });

    it('handles empty progress data', async () => {
      mockSupabase.from().select().eq().gte().lte().order().limit
        .mockResolvedValueOnce({
          data: [],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [],
          error: null,
        });

      const url = new URL('http://localhost/api/training/progress');
      url.searchParams.set('userId', 'user1');
      url.searchParams.set('categoryId', 'cat1');

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.currentWeek).toBeNull();
      expect(data.history).toEqual([]);
      expect(data.totalJournals).toBe(0);
    });
  });

  describe('POST', () => {
    it('updates progress successfully', async () => {
      const updatedProgress = {
        ...mockProgressData,
        completed_count: 3,
        completion_rate: 100,
      };

      require('@/utils/progress-calculation').updateWeeklyProgress.mockResolvedValue(updatedProgress);

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: updatedProgress,
        error: null,
      });

      mockSupabase.from().select().eq().gte().lte().order().limit.mockResolvedValue({
        data: mockJournals,
        error: null,
      });

      const request = new NextRequest('http://localhost/api/training/progress', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user1',
          categoryId: 'cat1',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.progress).toEqual(updatedProgress);
    });

    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/training/progress', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user1',
          categoryId: 'cat1',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('인증이 필요합니다');
    });

    it('returns 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/training/progress', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('잘못된 요청 형식입니다');
    });

    it('returns 400 when required parameters are missing', async () => {
      const request = new NextRequest('http://localhost/api/training/progress', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user1',
          // Missing categoryId
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('userId와 categoryId가 필요합니다');
    });

    it('handles progress calculation error', async () => {
      require('@/utils/progress-calculation').updateWeeklyProgress
        .mockRejectedValue(new Error('Progress calculation failed'));

      const request = new NextRequest('http://localhost/api/training/progress', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user1',
          categoryId: 'cat1',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('진행률 업데이트에 실패했습니다');
    });

    it('handles database upsert error', async () => {
      const updatedProgress = {
        ...mockProgressData,
        completed_count: 3,
        completion_rate: 100,
      };

      require('@/utils/progress-calculation').updateWeeklyProgress.mockResolvedValue(updatedProgress);

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Upsert failed' },
      });

      const request = new NextRequest('http://localhost/api/training/progress', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user1',
          categoryId: 'cat1',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('진행률 저장에 실패했습니다');
    });

    it('handles journal fetch error during update', async () => {
      const updatedProgress = {
        ...mockProgressData,
        completed_count: 3,
        completion_rate: 100,
      };

      require('@/utils/progress-calculation').updateWeeklyProgress.mockResolvedValue(updatedProgress);

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: updatedProgress,
        error: null,
      });

      mockSupabase.from().select().eq().gte().lte().order().limit.mockResolvedValue({
        data: null,
        error: { message: 'Journal fetch failed' },
      });

      const request = new NextRequest('http://localhost/api/training/progress', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user1',
          categoryId: 'cat1',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('일지 조회에 실패했습니다');
    });

    it('handles unexpected errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost/api/training/progress', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user1',
          categoryId: 'cat1',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('서버 오류가 발생했습니다');
    });
  });
});