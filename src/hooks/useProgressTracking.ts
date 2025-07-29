import { ProgressTracking } from '@/types/database';
import { Achievement } from '@/utils/progress-calculation';
import { useCallback, useEffect, useState } from 'react';

interface ProgressData {
  currentWeek: ProgressTracking;
  history: ProgressTracking[];
  analysis: {
    trends: any[];
    averageCompletionRate: number;
    improvementTrend: 'improving' | 'declining' | 'stable';
    bestWeek: any;
    worstWeek: any;
    streakAnalysis: {
      currentStreakWeeks: number;
      longestStreakWeeks: number;
      averageStreak: number;
    };
    consistencyScore: number;
    volatility: 'low' | 'medium' | 'high';
    seasonalPattern: {
      bestMonth: string;
      worstMonth: string;
      monthlyAverages: { [month: string]: number };
    };
  };
  consistency: {
    score: number;
    level: 'excellent' | 'good' | 'fair' | 'needs_improvement';
    consistentWeeks: number;
  };
  prediction: {
    willComplete: boolean;
    daysNeeded: number;
    confidence: number;
    recommendation: string;
  };
  comparison: {
    completionRateChange: number;
    streakChange: number;
    improvement: boolean;
    message: string;
  };
  totalJournals: number;
}

interface AchievementData {
  achievements: Achievement[];
  newAchievements: Achievement[];
  stats: {
    currentStreak: number;
    bestStreak: number;
    totalEntries: number;
    weeklyCompletionRate: number;
    consistencyScore: number;
    consistencyLevel: string;
    consistentWeeks: number;
  };
}

export function useProgressTracking(userId: string, categoryId: string) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [achievementData, setAchievementData] =
    useState<AchievementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgressData = useCallback(async () => {
    if (!userId || !categoryId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/training/progress?userId=${userId}&categoryId=${categoryId}&weeks=12`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '진행률 조회에 실패했습니다.');
      }

      const data = await response.json();
      setProgressData(data);
    } catch (err) {
      console.error('Progress fetch error:', err);
      setError(
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  }, [userId, categoryId]);

  const fetchAchievements = useCallback(async () => {
    if (!userId || !categoryId) return;

    try {
      const response = await fetch(
        `/api/training/achievements?userId=${userId}&categoryId=${categoryId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '성취 조회에 실패했습니다.');
      }

      const data = await response.json();
      setAchievementData(data);
    } catch (err) {
      console.error('Achievements fetch error:', err);
      // 성취 조회 실패는 전체 로딩을 막지 않음
    }
  }, [userId, categoryId]);

  const updateProgress = useCallback(async () => {
    if (!userId || !categoryId) return;

    try {
      const response = await fetch('/api/training/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, categoryId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '진행률 업데이트에 실패했습니다.');
      }

      // 업데이트 후 데이터 다시 조회
      await fetchProgressData();
      await fetchAchievements();
    } catch (err) {
      console.error('Progress update error:', err);
      setError(
        err instanceof Error
          ? err.message
          : '진행률 업데이트 중 오류가 발생했습니다.'
      );
    }
  }, [userId, categoryId, fetchProgressData, fetchAchievements]);

  const recordAchievement = useCallback(
    async (achievementId: string) => {
      if (!userId || !categoryId) return;

      try {
        const response = await fetch('/api/training/achievements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, categoryId, achievementId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '성취 기록에 실패했습니다.');
        }

        return await response.json();
      } catch (err) {
        console.error('Achievement record error:', err);
        throw err;
      }
    },
    [userId, categoryId]
  );

  useEffect(() => {
    if (userId && categoryId) {
      fetchProgressData();
      fetchAchievements();
    }
  }, [userId, categoryId, fetchProgressData, fetchAchievements]);

  return {
    progressData,
    achievementData,
    loading,
    error,
    updateProgress,
    recordAchievement,
    refetch: () => {
      fetchProgressData();
      fetchAchievements();
    },
  };
}

// 간단한 진행률 조회 훅 (대시보드용)
export function useSimpleProgress(userId: string, categoryId: string) {
  const [progress, setProgress] = useState<ProgressTracking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !categoryId) return;

    const fetchProgress = async () => {
      try {
        const response = await fetch(
          `/api/training/progress?userId=${userId}&categoryId=${categoryId}&weeks=1`
        );

        if (response.ok) {
          const data = await response.json();
          setProgress(data.currentWeek);
        }
      } catch (err) {
        console.error('Simple progress fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [userId, categoryId]);

  return { progress, loading };
}
