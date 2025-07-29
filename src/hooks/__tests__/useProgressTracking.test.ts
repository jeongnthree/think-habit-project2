import { renderHook, waitFor } from '@testing-library/react';
import { useProgressTracking, useSimpleProgress } from '../useProgressTracking';

// Mock fetch
global.fetch = jest.fn();

const mockProgressData = {
  currentWeek: {
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
  },
  history: [],
  analysis: {
    trends: [],
    averageCompletionRate: 67,
    improvementTrend: 'stable' as const,
    bestWeek: null,
    worstWeek: null,
    streakAnalysis: {
      currentStreakWeeks: 1,
      longestStreakWeeks: 2,
      averageStreak: 5,
    },
    consistencyScore: 75,
    volatility: 'low' as const,
    seasonalPattern: {
      bestMonth: '1월',
      worstMonth: '1월',
      monthlyAverages: { '1월': 67 },
    },
  },
  consistency: {
    score: 75,
    level: 'good' as const,
    consistentWeeks: 3,
  },
  prediction: {
    willComplete: true,
    daysNeeded: 2,
    confidence: 80,
    recommendation: '현재 페이스를 유지하면 목표를 달성할 수 있어요!',
  },
  comparison: {
    completionRateChange: 10,
    streakChange: 2,
    improvement: true,
    message: '지난주보다 10% 향상되었어요.',
  },
  totalJournals: 15,
};

const mockAchievementData = {
  achievements: [
    {
      id: 'streak_7',
      name: '일주일 챌린지',
      description: '7일 연속으로 일지를 작성했습니다',
      icon: '⭐',
      type: 'streak' as const,
      threshold: 7,
      achieved: true,
      achievedAt: '2024-01-07T00:00:00Z',
      rarity: 'common' as const,
      points: 25,
    },
  ],
  newAchievements: [],
  stats: {
    currentStreak: 5,
    bestStreak: 10,
    totalEntries: 15,
    weeklyCompletionRate: 67,
    consistencyScore: 75,
    consistencyLevel: 'good',
    consistentWeeks: 3,
  },
};

describe('useProgressTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('fetches progress data on mount', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgressData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAchievementData,
      });

    const { result } = renderHook(() => useProgressTracking('user1', 'cat1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.progressData).toEqual(mockProgressData);
    expect(result.current.achievementData).toEqual(mockAchievementData);
    expect(result.current.error).toBeNull();
  });

  it('handles progress fetch error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '진행률 조회 실패' }),
    });

    const { result } = renderHook(() => useProgressTracking('user1', 'cat1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('진행률 조회 실패');
    expect(result.current.progressData).toBeNull();
  });

  it('handles achievement fetch error gracefully', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgressData,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: '성취 조회 실패' }),
      });

    const { result } = renderHook(() => useProgressTracking('user1', 'cat1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.progressData).toEqual(mockProgressData);
    expect(result.current.achievementData).toBeNull();
    expect(result.current.error).toBeNull(); // Achievement error doesn't block main loading
  });

  it('does not fetch when userId or categoryId is missing', () => {
    renderHook(() => useProgressTracking('', 'cat1'));

    expect(fetch).not.toHaveBeenCalled();
  });

  it('updates progress correctly', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgressData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAchievementData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgressData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAchievementData,
      });

    const { result } = renderHook(() => useProgressTracking('user1', 'cat1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.updateProgress();

    expect(fetch).toHaveBeenCalledWith('/api/training/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: 'user1', categoryId: 'cat1' }),
    });
  });

  it('handles update progress error', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgressData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAchievementData,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: '업데이트 실패' }),
      });

    const { result } = renderHook(() => useProgressTracking('user1', 'cat1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.updateProgress();

    // 에러 메시지가 설정되는지 확인
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('records achievement correctly', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgressData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAchievementData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    const { result } = renderHook(() => useProgressTracking('user1', 'cat1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const achievementResult =
      await result.current.recordAchievement('streak_7');

    expect(fetch).toHaveBeenCalledWith('/api/training/achievements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user1',
        categoryId: 'cat1',
        achievementId: 'streak_7',
      }),
    });

    expect(achievementResult).toEqual({ success: true });
  });

  it('handles record achievement error', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgressData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAchievementData,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: '성취 기록 실패' }),
      });

    const { result } = renderHook(() => useProgressTracking('user1', 'cat1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.recordAchievement('streak_7')).rejects.toThrow(
      '성취 기록 실패'
    );
  });

  it('refetches data when refetch is called', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgressData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAchievementData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgressData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAchievementData,
      });

    const { result } = renderHook(() => useProgressTracking('user1', 'cat1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    result.current.refetch();

    expect(fetch).toHaveBeenCalledTimes(4); // Initial 2 + refetch 2
  });

  it('makes correct API calls with parameters', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgressData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAchievementData,
      });

    renderHook(() => useProgressTracking('user1', 'cat1'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/training/progress?userId=user1&categoryId=cat1&weeks=12'
      );
      expect(fetch).toHaveBeenCalledWith(
        '/api/training/achievements?userId=user1&categoryId=cat1'
      );
    });
  });
});

describe('useSimpleProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('fetches simple progress data', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ currentWeek: mockProgressData.currentWeek }),
    });

    const { result } = renderHook(() => useSimpleProgress('user1', 'cat1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.progress).toEqual(mockProgressData.currentWeek);
  });

  it('handles fetch error gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSimpleProgress('user1', 'cat1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.progress).toBeNull();
  });

  it('does not fetch when parameters are missing', () => {
    renderHook(() => useSimpleProgress('', 'cat1'));

    expect(fetch).not.toHaveBeenCalled();
  });

  it('makes correct API call for simple progress', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ currentWeek: mockProgressData.currentWeek }),
    });

    renderHook(() => useSimpleProgress('user1', 'cat1'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/training/progress?userId=user1&categoryId=cat1&weeks=1'
      );
    });
  });

  it('handles non-ok response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => useSimpleProgress('user1', 'cat1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.progress).toBeNull();
  });

  it('updates when parameters change', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentWeek: mockProgressData.currentWeek }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ currentWeek: mockProgressData.currentWeek }),
      });

    const { result, rerender } = renderHook(
      ({ userId, categoryId }) => useSimpleProgress(userId, categoryId),
      {
        initialProps: { userId: 'user1', categoryId: 'cat1' },
      }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    rerender({ userId: 'user2', categoryId: 'cat1' });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    expect(fetch).toHaveBeenLastCalledWith(
      '/api/training/progress?userId=user2&categoryId=cat1&weeks=1'
    );
  });
});
