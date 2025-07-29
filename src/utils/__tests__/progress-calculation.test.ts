import { Journal, ProgressTracking } from '@/types/database';
import {
    analyzeProgressHistory,
    calculateConsistencyScore,
    calculateMonthlyStats,
    calculateStreak,
    calculateWeeklyProgress,
    compareWithPreviousWeek,
    detectAchievements,
    formatDateForDB,
    generateMotivationalMessage,
    getDaysBetween,
    getWeekEndDate,
    getWeekStartDate,
    predictWeeklyGoalCompletion,
    shouldResetWeeklyProgress
} from '../progress-calculation';

describe('Progress Calculation Utils', () => {
  describe('Date utilities', () => {
    it('calculates week start date correctly (Monday)', () => {
      const wednesday = new Date('2024-01-03'); // Wednesday
      const weekStart = getWeekStartDate(wednesday);
      
      expect(weekStart.getDay()).toBe(1); // Monday
      expect(formatDateForDB(weekStart)).toBe('2024-01-01');
    });

    it('calculates week end date correctly (Sunday)', () => {
      const wednesday = new Date('2024-01-03'); // Wednesday
      const weekEnd = getWeekEndDate(wednesday);
      
      expect(weekEnd.getDay()).toBe(0); // Sunday
      expect(formatDateForDB(weekEnd)).toBe('2024-01-07');
    });

    it('formats date for database correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDateForDB(date)).toBe('2024-01-15');
    });

    it('calculates days between dates correctly', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-05');
      
      expect(getDaysBetween(date1, date2)).toBe(4);
      expect(getDaysBetween(date2, date1)).toBe(4); // Should be absolute
    });
  });

  describe('Streak calculation', () => {
    it('calculates current streak correctly', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(today.getDate() - 2);
      
      const journalDates = [
        formatDateForDB(today),
        formatDateForDB(yesterday),
        formatDateForDB(twoDaysAgo),
      ];
      
      const streak = calculateStreak(journalDates);
      expect(streak.current).toBe(3);
    });

    it('returns zero streak for empty dates', () => {
      const streak = calculateStreak([]);
      expect(streak.current).toBe(0);
      expect(streak.best).toBe(0);
    });

    it('calculates best streak correctly', () => {
      const journalDates = [
        '2024-01-01',
        '2024-01-02',
        '2024-01-03', // 3-day streak
        '2024-01-05', // gap
        '2024-01-06',
        '2024-01-07',
        '2024-01-08',
        '2024-01-09', // 4-day streak (best)
      ];
      
      const streak = calculateStreak(journalDates);
      expect(streak.best).toBe(4);
    });

    it('handles non-consecutive dates', () => {
      const journalDates = [
        '2024-01-01',
        '2024-01-03', // gap
        '2024-01-05', // gap
      ];
      
      const streak = calculateStreak(journalDates);
      expect(streak.current).toBe(0); // No current streak due to gaps
      expect(streak.best).toBe(1); // Each entry is a 1-day streak
    });
  });

  describe('Weekly progress calculation', () => {
    const mockJournals: Journal[] = [
      {
        id: '1',
        user_id: 'user1',
        category_id: 'cat1',
        title: 'Journal 1',
        content: 'Content 1',
        journal_type: 'structured',
        is_public: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      },
      {
        id: '2',
        user_id: 'user1',
        category_id: 'cat1',
        title: 'Journal 2',
        content: 'Content 2',
        journal_type: 'photo',
        is_public: false,
        created_at: '2024-01-02T10:00:00Z',
        updated_at: '2024-01-02T10:00:00Z',
      },
    ];

    it('calculates weekly progress correctly', () => {
      const weekStart = new Date('2024-01-01'); // Monday
      const progress = calculateWeeklyProgress(mockJournals, weekStart, 3);
      
      expect(progress.completed).toBe(2);
      expect(progress.target).toBe(3);
      expect(progress.rate).toBe(67); // 2/3 * 100, rounded
      expect(progress.isComplete).toBe(false);
    });

    it('marks progress as complete when target is met', () => {
      const weekStart = new Date('2024-01-01');
      const progress = calculateWeeklyProgress(mockJournals, weekStart, 2);
      
      expect(progress.isComplete).toBe(true);
      expect(progress.rate).toBe(100);
    });

    it('handles zero target correctly', () => {
      const weekStart = new Date('2024-01-01');
      const progress = calculateWeeklyProgress(mockJournals, weekStart, 0);
      
      expect(progress.rate).toBe(0);
    });
  });

  describe('Achievement detection', () => {
    it('detects streak achievements', () => {
      const achievements = detectAchievements(7, 10, 50, 80, 4);
      
      const streakAchievements = achievements.filter(a => a.type === 'streak' && a.achieved);
      expect(streakAchievements.length).toBeGreaterThan(0);
      
      const weeklyAchievement = achievements.find(a => a.id === 'streak_7');
      expect(weeklyAchievement?.achieved).toBe(true);
    });

    it('detects total entry achievements', () => {
      const achievements = detectAchievements(5, 10, 25, 80, 4);
      
      const totalAchievement = achievements.find(a => a.id === 'total_25');
      expect(totalAchievement?.achieved).toBe(true);
    });

    it('detects weekly completion achievements', () => {
      const achievements = detectAchievements(5, 10, 25, 100, 4);
      
      const weeklyAchievement = achievements.find(a => a.id === 'weekly_100');
      expect(weeklyAchievement?.achieved).toBe(true);
    });

    it('assigns correct rarity levels', () => {
      const achievements = detectAchievements(100, 100, 500, 100, 12);
      
      const legendaryAchievement = achievements.find(a => a.id === 'streak_100');
      expect(legendaryAchievement?.rarity).toBe('legendary');
      expect(legendaryAchievement?.points).toBe(500);
    });
  });

  describe('Progress history analysis', () => {
    const mockProgressRecords: ProgressTracking[] = [
      {
        id: '1',
        user_id: 'user1',
        category_id: 'cat1',
        week_start_date: '2024-01-01',
        target_count: 3,
        completed_count: 3,
        completion_rate: 100,
        current_streak: 7,
        best_streak: 10,
        last_entry_date: '2024-01-07',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-07T00:00:00Z',
      },
      {
        id: '2',
        user_id: 'user1',
        category_id: 'cat1',
        week_start_date: '2024-01-08',
        target_count: 3,
        completed_count: 2,
        completion_rate: 67,
        current_streak: 5,
        best_streak: 10,
        last_entry_date: '2024-01-10',
        created_at: '2024-01-08T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z',
      },
    ];

    it('analyzes progress trends correctly', () => {
      const analysis = analyzeProgressHistory(mockProgressRecords, 4);
      
      expect(analysis.trends).toHaveLength(2);
      expect(analysis.averageCompletionRate).toBe(84); // (100 + 67) / 2, rounded
    });

    it('identifies improvement trends', () => {
      const decliningRecords = [
        { ...mockProgressRecords[0], completion_rate: 50 },
        { ...mockProgressRecords[1], completion_rate: 80 },
        { ...mockProgressRecords[0], completion_rate: 90, week_start_date: '2024-01-15' },
        { ...mockProgressRecords[1], completion_rate: 95, week_start_date: '2024-01-22' },
      ];
      
      const analysis = analyzeProgressHistory(decliningRecords, 8);
      expect(analysis.improvementTrend).toBe('improving');
    });

    it('finds best and worst weeks', () => {
      const analysis = analyzeProgressHistory(mockProgressRecords, 4);
      
      expect(analysis.bestWeek?.rate).toBe(100);
      expect(analysis.worstWeek?.rate).toBe(67);
    });

    it('calculates consistency score', () => {
      const analysis = analyzeProgressHistory(mockProgressRecords, 4);
      
      expect(analysis.consistencyScore).toBeGreaterThan(0);
      expect(analysis.consistencyScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Weekly reset functionality', () => {
    it('detects when weekly reset is needed', () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 8); // 8 days ago
      
      const shouldReset = shouldResetWeeklyProgress(lastWeek.toISOString());
      expect(shouldReset).toBe(true);
    });

    it('does not reset within same week', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const shouldReset = shouldResetWeeklyProgress(yesterday.toISOString());
      expect(shouldReset).toBe(false);
    });
  });

  describe('Monthly statistics', () => {
    const mockMonthlyRecords: ProgressTracking[] = [
      {
        id: '1',
        user_id: 'user1',
        category_id: 'cat1',
        week_start_date: '2024-01-01',
        target_count: 3,
        completed_count: 3,
        completion_rate: 100,
        current_streak: 7,
        best_streak: 10,
        last_entry_date: '2024-01-07',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-07T00:00:00Z',
      },
      {
        id: '2',
        user_id: 'user1',
        category_id: 'cat1',
        week_start_date: '2024-01-08',
        target_count: 3,
        completed_count: 2,
        completion_rate: 67,
        current_streak: 5,
        best_streak: 10,
        last_entry_date: '2024-01-10',
        created_at: '2024-01-08T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z',
      },
    ];

    it('calculates monthly statistics correctly', () => {
      const stats = calculateMonthlyStats(mockMonthlyRecords, '2024-01');
      
      expect(stats.month).toBe('2024-01');
      expect(stats.totalEntries).toBe(5); // 3 + 2
      expect(stats.averageWeeklyCompletion).toBe(84); // (100 + 67) / 2, rounded
      expect(stats.bestWeekCompletion).toBe(100);
      expect(stats.worstWeekCompletion).toBe(67);
      expect(stats.totalWeeks).toBe(2);
    });

    it('handles empty month data', () => {
      const stats = calculateMonthlyStats([], '2024-02');
      
      expect(stats.totalEntries).toBe(0);
      expect(stats.averageWeeklyCompletion).toBe(0);
      expect(stats.totalWeeks).toBe(0);
    });
  });

  describe('Motivational messages', () => {
    it('generates appropriate message for goal achievement', () => {
      const message = generateMotivationalMessage(100, 5, 2);
      expect(message).toContain('목표를 달성했습니다');
      expect(message).toContain('5일 연속');
    });

    it('generates encouragement for partial progress', () => {
      const message = generateMotivationalMessage(75, 3, 3);
      expect(message).toContain('거의 다 왔어요');
      expect(message).toContain('3일 남았습니다');
    });

    it('generates motivation for new users', () => {
      const message = generateMotivationalMessage(0, 0, 5);
      expect(message).toContain('새로운 시작');
    });
  });

  describe('Consistency scoring', () => {
    const mockRecords: ProgressTracking[] = [
      { completion_rate: 90 } as ProgressTracking,
      { completion_rate: 85 } as ProgressTracking,
      { completion_rate: 95 } as ProgressTracking,
      { completion_rate: 80 } as ProgressTracking,
    ];

    it('calculates consistency score correctly', () => {
      const result = calculateConsistencyScore(mockRecords, 4);
      
      expect(result.score).toBe(100); // All weeks >= 80%
      expect(result.level).toBe('excellent');
      expect(result.consistentWeeks).toBe(4);
    });

    it('handles poor consistency', () => {
      const poorRecords = [
        { completion_rate: 30 } as ProgressTracking,
        { completion_rate: 40 } as ProgressTracking,
      ];
      
      const result = calculateConsistencyScore(poorRecords, 2);
      
      expect(result.score).toBe(0);
      expect(result.level).toBe('needs_improvement');
    });
  });

  describe('Goal completion prediction', () => {
    const mockProgress: ProgressTracking = {
      id: '1',
      user_id: 'user1',
      category_id: 'cat1',
      week_start_date: formatDateForDB(getWeekStartDate()),
      target_count: 5,
      completed_count: 2,
      completion_rate: 40,
      current_streak: 3,
      best_streak: 5,
      last_entry_date: formatDateForDB(new Date()),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('predicts successful completion', () => {
      const prediction = predictWeeklyGoalCompletion(mockProgress, 1); // 1 entry per day
      
      expect(prediction.willComplete).toBe(true);
      expect(prediction.daysNeeded).toBe(3); // Need 3 more entries
      expect(prediction.confidence).toBeGreaterThan(0);
    });

    it('predicts failure to complete', () => {
      const prediction = predictWeeklyGoalCompletion(mockProgress, 0.2); // Very slow pace
      
      expect(prediction.willComplete).toBe(false);
      expect(prediction.confidence).toBeLessThan(50);
    });
  });

  describe('Week comparison', () => {
    const currentWeek: ProgressTracking = {
      id: '1',
      user_id: 'user1',
      category_id: 'cat1',
      week_start_date: '2024-01-08',
      target_count: 3,
      completed_count: 3,
      completion_rate: 100,
      current_streak: 7,
      best_streak: 10,
      last_entry_date: '2024-01-14',
      created_at: '2024-01-08T00:00:00Z',
      updated_at: '2024-01-14T00:00:00Z',
    };

    const previousWeek: ProgressTracking = {
      id: '2',
      user_id: 'user1',
      category_id: 'cat1',
      week_start_date: '2024-01-01',
      target_count: 3,
      completed_count: 2,
      completion_rate: 67,
      current_streak: 5,
      best_streak: 8,
      last_entry_date: '2024-01-07',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-07T00:00:00Z',
    };

    it('detects improvement', () => {
      const comparison = compareWithPreviousWeek(currentWeek, previousWeek);
      
      expect(comparison.improvement).toBe(true);
      expect(comparison.completionRateChange).toBe(33); // 100 - 67
      expect(comparison.streakChange).toBe(2); // 7 - 5
      expect(comparison.message).toContain('향상되었어요');
    });

    it('handles first week', () => {
      const comparison = compareWithPreviousWeek(currentWeek, null);
      
      expect(comparison.improvement).toBe(true);
      expect(comparison.message).toContain('첫 주 기록');
    });
  });
});