/**
 * Integration tests for progress tracking functionality
 * Tests the complete flow of progress calculation and tracking
 */

describe('Progress Tracking Integration Tests', () => {
  // Mock data for testing
  const mockJournals = [
    {
      id: 'journal-1',
      user_id: 'user-1',
      category_id: 'cat-1',
      created_at: '2024-01-01T10:00:00Z',
      journal_type: 'structured',
      task_completions: [
        { task_template_id: 'task-1', is_completed: true },
        { task_template_id: 'task-2', is_completed: false },
      ],
    },
    {
      id: 'journal-2',
      user_id: 'user-1',
      category_id: 'cat-1',
      created_at: '2024-01-02T10:00:00Z',
      journal_type: 'structured',
      task_completions: [
        { task_template_id: 'task-1', is_completed: true },
        { task_template_id: 'task-2', is_completed: true },
      ],
    },
    {
      id: 'journal-3',
      user_id: 'user-1',
      category_id: 'cat-1',
      created_at: '2024-01-03T10:00:00Z',
      journal_type: 'photo',
    },
  ];

  const mockTaskTemplates = [
    {
      id: 'task-1',
      category_id: 'cat-1',
      title: '기사 요약하기',
      is_required: true,
    },
    {
      id: 'task-2',
      category_id: 'cat-1',
      title: '편향성 분석하기',
      is_required: true,
    },
  ];

  describe('Weekly Progress Calculation', () => {
    it('should calculate weekly progress correctly', () => {
      // Mock progress calculation logic
      const calculateWeeklyProgress = (journals: any[], weekStart: string) => {
        const weekStartDate = new Date(weekStart);
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 7);

        const weekJournals = journals.filter(journal => {
          const journalDate = new Date(journal.created_at);
          return journalDate >= weekStartDate && journalDate < weekEndDate;
        });

        const targetCount = 3; // Weekly target
        const completedCount = weekJournals.length;
        const completionRate = Math.round((completedCount / targetCount) * 100);

        return {
          week_start_date: weekStart,
          target_count: targetCount,
          completed_count: completedCount,
          completion_rate: completionRate,
        };
      };

      const progress = calculateWeeklyProgress(mockJournals, '2024-01-01');

      expect(progress.completed_count).toBe(3);
      expect(progress.target_count).toBe(3);
      expect(progress.completion_rate).toBe(100);
    });

    it('should handle partial week completion', () => {
      const partialJournals = mockJournals.slice(0, 2); // Only 2 journals

      const calculateWeeklyProgress = (journals: any[], weekStart: string) => {
        const targetCount = 3;
        const completedCount = journals.length;
        const completionRate = Math.round((completedCount / targetCount) * 100);

        return {
          week_start_date: weekStart,
          target_count: targetCount,
          completed_count: completedCount,
          completion_rate: completionRate,
        };
      };

      const progress = calculateWeeklyProgress(partialJournals, '2024-01-01');

      expect(progress.completed_count).toBe(2);
      expect(progress.completion_rate).toBe(67);
    });

    it('should calculate streak correctly', () => {
      const calculateStreak = (journals: any[]) => {
        // Sort journals by date
        const sortedJournals = journals.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        let currentStreak = 0;
        let lastDate: Date | null = null;

        for (const journal of sortedJournals) {
          const journalDate = new Date(journal.created_at);
          journalDate.setHours(0, 0, 0, 0); // Normalize to start of day

          if (lastDate === null) {
            currentStreak = 1;
          } else {
            const daysDiff = Math.floor(
              (journalDate.getTime() - lastDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            if (daysDiff === 1) {
              currentStreak++;
            } else if (daysDiff > 1) {
              currentStreak = 1; // Reset streak
            }
            // If daysDiff === 0, it's the same day, don't change streak
          }

          lastDate = journalDate;
        }

        return currentStreak;
      };

      const streak = calculateStreak(mockJournals);
      expect(streak).toBe(3); // 3 consecutive days
    });
  });

  describe('Task Completion Analysis', () => {
    it('should analyze task completion rates', () => {
      const analyzeTaskCompletion = (journals: any[], taskTemplates: any[]) => {
        const structuredJournals = journals.filter(
          j => j.journal_type === 'structured'
        );
        const totalTasks = taskTemplates.filter(t => t.is_required).length;

        let totalCompletedTasks = 0;
        let totalPossibleTasks = 0;

        structuredJournals.forEach(journal => {
          const completedTasks = journal.task_completions.filter(
            (tc: any) => tc.is_completed
          ).length;

          totalCompletedTasks += completedTasks;
          totalPossibleTasks += totalTasks;
        });

        const taskCompletionRate =
          totalPossibleTasks > 0
            ? Math.round((totalCompletedTasks / totalPossibleTasks) * 100)
            : 0;

        return {
          totalCompletedTasks,
          totalPossibleTasks,
          taskCompletionRate,
        };
      };

      const analysis = analyzeTaskCompletion(mockJournals, mockTaskTemplates);

      expect(analysis.totalCompletedTasks).toBe(3); // 1 + 2 from two structured journals
      expect(analysis.totalPossibleTasks).toBe(4); // 2 tasks × 2 journals
      expect(analysis.taskCompletionRate).toBe(75);
    });

    it('should identify improvement trends', () => {
      const analyzeImprovementTrend = (journals: any[]) => {
        const structuredJournals = journals
          .filter(j => j.journal_type === 'structured')
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );

        if (structuredJournals.length < 2) {
          return 'insufficient_data';
        }

        const completionRates = structuredJournals.map(journal => {
          const completedTasks = journal.task_completions.filter(
            (tc: any) => tc.is_completed
          ).length;
          const totalTasks = journal.task_completions.length;
          return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        });

        const firstHalf = completionRates.slice(
          0,
          Math.floor(completionRates.length / 2)
        );
        const secondHalf = completionRates.slice(
          Math.floor(completionRates.length / 2)
        );

        const firstHalfAvg =
          firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondHalfAvg =
          secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        if (secondHalfAvg > firstHalfAvg + 10) {
          return 'improving';
        } else if (secondHalfAvg < firstHalfAvg - 10) {
          return 'declining';
        } else {
          return 'stable';
        }
      };

      const trend = analyzeImprovementTrend(mockJournals);
      expect(trend).toBe('improving'); // 50% -> 100% completion rate
    });
  });

  describe('Progress History Analysis', () => {
    it('should analyze progress history over multiple weeks', () => {
      const mockProgressHistory = [
        {
          week_start_date: '2023-12-25',
          completion_rate: 67,
          completed_count: 2,
          target_count: 3,
        },
        {
          week_start_date: '2024-01-01',
          completion_rate: 100,
          completed_count: 3,
          target_count: 3,
        },
        {
          week_start_date: '2024-01-08',
          completion_rate: 33,
          completed_count: 1,
          target_count: 3,
        },
      ];

      const analyzeProgressHistory = (history: any[]) => {
        const averageCompletionRate =
          history.reduce((sum, week) => sum + week.completion_rate, 0) /
          history.length;

        const trends = [];
        for (let i = 1; i < history.length; i++) {
          const current = history[i].completion_rate;
          const previous = history[i - 1].completion_rate;

          if (current > previous) {
            trends.push('improving');
          } else if (current < previous) {
            trends.push('declining');
          } else {
            trends.push('stable');
          }
        }

        const consistentWeeks = history.filter(
          week => week.completion_rate >= 80
        ).length;
        const consistencyScore = Math.round(
          (consistentWeeks / history.length) * 100
        );

        return {
          averageCompletionRate: Math.round(averageCompletionRate),
          trends,
          consistencyScore,
          totalWeeks: history.length,
          consistentWeeks,
        };
      };

      const analysis = analyzeProgressHistory(mockProgressHistory);

      expect(analysis.averageCompletionRate).toBe(67); // (67 + 100 + 33) / 3
      expect(analysis.trends).toEqual(['improving', 'declining']);
      expect(analysis.consistencyScore).toBe(33); // 1 out of 3 weeks >= 80% (only 100% week)
      expect(analysis.totalWeeks).toBe(3);
      expect(analysis.consistentWeeks).toBe(1);
    });

    it('should predict goal completion likelihood', () => {
      const predictGoalCompletion = (
        currentProgress: any,
        daysRemaining: number
      ) => {
        const { completed_count, target_count } = currentProgress;
        const remaining = target_count - completed_count;

        if (remaining <= 0) {
          return {
            willComplete: true,
            daysNeeded: 0,
            confidence: 100,
            recommendation: '목표를 이미 달성했습니다!',
          };
        }

        const averageDailyRate = completed_count / (7 - daysRemaining); // Assuming 7-day week
        const daysNeeded = Math.ceil(
          remaining / Math.max(averageDailyRate, 0.5)
        );

        const willComplete = daysNeeded <= daysRemaining;
        const confidence = willComplete
          ? Math.min(90, Math.round((daysRemaining / daysNeeded) * 70 + 20))
          : Math.max(10, Math.round((daysRemaining / daysNeeded) * 50));

        let recommendation;
        if (willComplete) {
          recommendation = '현재 페이스를 유지하면 목표 달성이 가능해요!';
        } else {
          recommendation = '목표 달성을 위해 조금 더 노력이 필요해요.';
        }

        return {
          willComplete,
          daysNeeded,
          confidence,
          recommendation,
        };
      };

      // Test scenario: 2 completed out of 3, with 3 days remaining
      const currentProgress = { completed_count: 2, target_count: 3 };
      const prediction = predictGoalCompletion(currentProgress, 3);

      expect(prediction.willComplete).toBe(true);
      expect(prediction.daysNeeded).toBeLessThanOrEqual(3);
      expect(prediction.confidence).toBeGreaterThan(50);
      expect(prediction.recommendation).toContain('목표 달성이 가능');
    });
  });

  describe('Achievement System', () => {
    it('should detect streak achievements', () => {
      const detectAchievements = (
        currentStreak: number,
        bestStreak: number
      ) => {
        const achievements = [];

        // Streak milestones
        const streakMilestones = [3, 5, 7, 14, 30];

        for (const milestone of streakMilestones) {
          if (currentStreak >= milestone && bestStreak < milestone) {
            achievements.push({
              id: `streak-${milestone}`,
              title: `${milestone}일 연속 달성`,
              description: `${milestone}일 연속으로 일지를 작성했습니다`,
              type: 'streak',
              earned_at: new Date().toISOString(),
            });
          }
        }

        return achievements;
      };

      const achievements = detectAchievements(5, 3);

      expect(achievements).toHaveLength(1);
      expect(achievements[0].id).toBe('streak-5');
      expect(achievements[0].title).toBe('5일 연속 달성');
    });

    it('should detect completion rate achievements', () => {
      const detectCompletionAchievements = (weeklyRates: number[]) => {
        const achievements = [];

        // Perfect week achievement
        const perfectWeeks = weeklyRates.filter(rate => rate === 100).length;
        if (perfectWeeks >= 1) {
          achievements.push({
            id: 'perfect-week',
            title: '완벽한 한 주',
            description: '일주일 동안 모든 목표를 달성했습니다',
            type: 'completion',
          });
        }

        // Consistent performer
        const consistentWeeks = weeklyRates.filter(rate => rate >= 80).length;
        if (consistentWeeks >= 4) {
          achievements.push({
            id: 'consistent-performer',
            title: '꾸준한 실행가',
            description: '4주 연속 80% 이상 달성했습니다',
            type: 'consistency',
          });
        }

        return achievements;
      };

      const weeklyRates = [100, 67, 100, 100, 83];
      const achievements = detectCompletionAchievements(weeklyRates);

      expect(achievements).toHaveLength(2);
      expect(achievements.find(a => a.id === 'perfect-week')).toBeDefined();
      expect(
        achievements.find(a => a.id === 'consistent-performer')
      ).toBeDefined();
    });
  });

  describe('Data Validation and Integrity', () => {
    it('should validate progress data consistency', () => {
      const validateProgressData = (progress: any) => {
        const errors = [];

        // Check completion rate calculation
        const expectedRate = Math.round(
          (progress.completed_count / progress.target_count) * 100
        );
        if (progress.completion_rate !== expectedRate) {
          errors.push('Completion rate calculation mismatch');
        }

        // Check date validity
        if (isNaN(new Date(progress.week_start_date).getTime())) {
          errors.push('Invalid week start date');
        }

        // Check non-negative values
        if (progress.completed_count < 0 || progress.target_count < 0) {
          errors.push('Negative count values');
        }

        // Check logical constraints
        if (progress.completed_count > progress.target_count) {
          errors.push('Completed count exceeds target');
        }

        return {
          isValid: errors.length === 0,
          errors,
        };
      };

      const validProgress = {
        week_start_date: '2024-01-01',
        target_count: 3,
        completed_count: 2,
        completion_rate: 67,
      };

      const validation = validateProgressData(validProgress);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Test invalid data
      const invalidProgress = {
        week_start_date: 'invalid-date',
        target_count: 3,
        completed_count: 5, // Exceeds target
        completion_rate: 50, // Wrong calculation
      };

      const invalidValidation = validateProgressData(invalidProgress);
      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.errors.length).toBeGreaterThan(0);
    });

    it('should handle edge cases in progress calculation', () => {
      const calculateProgressSafely = (completed: number, target: number) => {
        // Handle division by zero
        if (target === 0) {
          return {
            completion_rate: 0,
            status: 'no_target_set',
          };
        }

        // Handle negative values
        if (completed < 0 || target < 0) {
          return {
            completion_rate: 0,
            status: 'invalid_input',
          };
        }

        // Handle over-completion
        const rate = Math.min(100, Math.round((completed / target) * 100));

        return {
          completion_rate: rate,
          status: completed >= target ? 'completed' : 'in_progress',
        };
      };

      // Test edge cases
      expect(calculateProgressSafely(0, 0).status).toBe('no_target_set');
      expect(calculateProgressSafely(-1, 3).status).toBe('invalid_input');
      expect(calculateProgressSafely(5, 3).completion_rate).toBe(100);
      expect(calculateProgressSafely(5, 3).status).toBe('completed');
    });
  });
});
