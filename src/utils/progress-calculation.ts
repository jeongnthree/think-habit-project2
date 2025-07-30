/**
 * Progress Calculation Engine
 * 주간 진행률 계산, 연속 기록 추적, 성취 감지 등의 기능을 제공
 */

import { Journal, ProgressTracking } from '@/types/database';

// 주간 시작일 계산 (월요일 기준)
export function getWeekStartDate(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 일요일이면 -6, 아니면 1
  return new Date(d.setDate(diff));
}

// 주간 종료일 계산 (일요일 기준)
export function getWeekEndDate(date: Date = new Date()): Date {
  const weekStart = getWeekStartDate(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

// 날짜를 YYYY-MM-DD 형식으로 변환
export function formatDateForDB(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

// 두 날짜 사이의 일수 계산
export function getDaysBetween(date1: Date, date2: Date): number {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

// 연속 기록 계산
export function calculateStreak(journalDates: string[]): {
  current: number;
  best: number;
} {
  if (journalDates.length === 0) {
    return { current: 0, best: 0 };
  }

  // 날짜를 정렬 (최신순)
  const sortedDates = journalDates
    .map(date => new Date(date))
    .sort((a, b) => b.getTime() - a.getTime());

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 1;

  const today = new Date();

  // 현재 연속 기록 계산
  const latestDate = sortedDates[0];
  if (latestDate) {
    const daysSinceLatest = getDaysBetween(latestDate, today);

    if (daysSinceLatest <= 1) {
      // 오늘 또는 어제 기록이 있으면 연속 기록 시작
      currentStreak = 1;

      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = sortedDates[i - 1];
        const currDate = sortedDates[i];
        if (prevDate && currDate) {
          const daysDiff = getDaysBetween(currDate, prevDate);

          if (daysDiff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }
  }

  // 최고 연속 기록 계산
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i - 1];
    const currDate = sortedDates[i];
    if (prevDate && currDate) {
      const daysDiff = getDaysBetween(currDate, prevDate);

      if (daysDiff === 1) {
        tempStreak++;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }

  bestStreak = Math.max(bestStreak, tempStreak, currentStreak);

  return { current: currentStreak, best: bestStreak };
}

// 주간 진행률 계산
export function calculateWeeklyProgress(
  journals: Journal[],
  weekStartDate: Date,
  targetCount: number
): {
  completed: number;
  target: number;
  rate: number;
  isComplete: boolean;
} {
  const weekStart = formatDateForDB(weekStartDate);
  const weekEnd = formatDateForDB(getWeekEndDate(weekStartDate));

  const weeklyJournals = journals.filter(journal => {
    const journalDate = journal.created_at?.split('T')[0];
    return journalDate && journalDate >= weekStart && journalDate <= weekEnd;
  });

  const completed = weeklyJournals.length;
  const rate =
    targetCount > 0 ? Math.round((completed / targetCount) * 100) : 0;
  const isComplete = completed >= targetCount;

  return {
    completed,
    target: targetCount,
    rate,
    isComplete,
  };
}

// 성취 감지 (뱃지/업적 시스템)
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'streak' | 'weekly' | 'total' | 'consistency' | 'milestone' | 'special';
  threshold: number;
  achieved: boolean;
  achievedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number; // 성취 점수
}

export function detectAchievements(
  currentStreak: number,
  bestStreak: number,
  totalEntries: number,
  weeklyCompletionRate: number,
  consistentWeeks: number,
  monthlyStats?: MonthlyStats,
  yearlyStats?: YearlyStats
): Achievement[] {
  const achievements: Achievement[] = [
    // 연속 기록 관련 (일반)
    {
      id: 'streak_3',
      name: '첫 걸음',
      description: '3일 연속으로 일지를 작성했습니다',
      icon: '🔥',
      type: 'streak',
      threshold: 3,
      achieved: currentStreak >= 3,
      achievedAt: currentStreak >= 3 ? new Date().toISOString() : undefined,
      rarity: 'common',
      points: 10,
    },
    {
      id: 'streak_7',
      name: '일주일 챌린지',
      description: '7일 연속으로 일지를 작성했습니다',
      icon: '⭐',
      type: 'streak',
      threshold: 7,
      achieved: currentStreak >= 7,
      achievedAt: currentStreak >= 7 ? new Date().toISOString() : undefined,
      rarity: 'common',
      points: 25,
    },
    {
      id: 'streak_14',
      name: '2주 마스터',
      description: '14일 연속으로 일지를 작성했습니다',
      icon: '🌟',
      type: 'streak',
      threshold: 14,
      achieved: currentStreak >= 14,
      achievedAt: currentStreak >= 14 ? new Date().toISOString() : undefined,
      rarity: 'rare',
      points: 50,
    },
    {
      id: 'streak_30',
      name: '한 달 연속',
      description: '30일 연속으로 일지를 작성했습니다',
      icon: '🏆',
      type: 'streak',
      threshold: 30,
      achieved: currentStreak >= 30,
      achievedAt: currentStreak >= 30 ? new Date().toISOString() : undefined,
      rarity: 'epic',
      points: 100,
    },
    {
      id: 'streak_100',
      name: '백일장',
      description: '100일 연속으로 일지를 작성했습니다',
      icon: '👑',
      type: 'streak',
      threshold: 100,
      achieved: currentStreak >= 100,
      achievedAt: currentStreak >= 100 ? new Date().toISOString() : undefined,
      rarity: 'legendary',
      points: 500,
    },

    // 최고 연속 기록 관련
    {
      id: 'best_streak_50',
      name: '연속 기록 달인',
      description: '최고 연속 기록 50일을 달성했습니다',
      icon: '🎖️',
      type: 'streak',
      threshold: 50,
      achieved: bestStreak >= 50,
      achievedAt: bestStreak >= 50 ? new Date().toISOString() : undefined,
      rarity: 'epic',
      points: 200,
    },

    // 주간 목표 달성 관련
    {
      id: 'weekly_100',
      name: '주간 목표 달성',
      description: '이번 주 목표를 100% 달성했습니다',
      icon: '🎯',
      type: 'weekly',
      threshold: 100,
      achieved: weeklyCompletionRate >= 100,
      achievedAt:
        weeklyCompletionRate >= 100 ? new Date().toISOString() : undefined,
      rarity: 'common',
      points: 20,
    },
    {
      id: 'weekly_150',
      name: '목표 초과 달성',
      description: '이번 주 목표를 150% 초과 달성했습니다',
      icon: '🚀',
      type: 'weekly',
      threshold: 150,
      achieved: weeklyCompletionRate >= 150,
      achievedAt:
        weeklyCompletionRate >= 150 ? new Date().toISOString() : undefined,
      rarity: 'rare',
      points: 40,
    },

    // 총 기록 수 관련
    {
      id: 'total_1',
      name: '첫 일지',
      description: '첫 번째 일지를 작성했습니다',
      icon: '🌱',
      type: 'milestone',
      threshold: 1,
      achieved: totalEntries >= 1,
      achievedAt: totalEntries >= 1 ? new Date().toISOString() : undefined,
      rarity: 'common',
      points: 5,
    },
    {
      id: 'total_10',
      name: '열정적인 시작',
      description: '총 10개의 일지를 작성했습니다',
      icon: '📝',
      type: 'total',
      threshold: 10,
      achieved: totalEntries >= 10,
      achievedAt: totalEntries >= 10 ? new Date().toISOString() : undefined,
      rarity: 'common',
      points: 15,
    },
    {
      id: 'total_25',
      name: '꾸준한 기록자',
      description: '총 25개의 일지를 작성했습니다',
      icon: '📖',
      type: 'total',
      threshold: 25,
      achieved: totalEntries >= 25,
      achievedAt: totalEntries >= 25 ? new Date().toISOString() : undefined,
      rarity: 'common',
      points: 30,
    },
    {
      id: 'total_50',
      name: '반백 달성',
      description: '총 50개의 일지를 작성했습니다',
      icon: '📚',
      type: 'total',
      threshold: 50,
      achieved: totalEntries >= 50,
      achievedAt: totalEntries >= 50 ? new Date().toISOString() : undefined,
      rarity: 'rare',
      points: 75,
    },
    {
      id: 'total_100',
      name: '백 개 돌파',
      description: '총 100개의 일지를 작성했습니다',
      icon: '🎖️',
      type: 'total',
      threshold: 100,
      achieved: totalEntries >= 100,
      achievedAt: totalEntries >= 100 ? new Date().toISOString() : undefined,
      rarity: 'epic',
      points: 150,
    },
    {
      id: 'total_250',
      name: '다작 작가',
      description: '총 250개의 일지를 작성했습니다',
      icon: '✍️',
      type: 'total',
      threshold: 250,
      achieved: totalEntries >= 250,
      achievedAt: totalEntries >= 250 ? new Date().toISOString() : undefined,
      rarity: 'epic',
      points: 300,
    },
    {
      id: 'total_500',
      name: '일지 마스터',
      description: '총 500개의 일지를 작성했습니다',
      icon: '🏅',
      type: 'total',
      threshold: 500,
      achieved: totalEntries >= 500,
      achievedAt: totalEntries >= 500 ? new Date().toISOString() : undefined,
      rarity: 'legendary',
      points: 750,
    },

    // 일관성 관련
    {
      id: 'consistent_2',
      name: '꾸준함의 시작',
      description: '2주 연속으로 주간 목표를 달성했습니다',
      icon: '💪',
      type: 'consistency',
      threshold: 2,
      achieved: consistentWeeks >= 2,
      achievedAt: consistentWeeks >= 2 ? new Date().toISOString() : undefined,
      rarity: 'common',
      points: 25,
    },
    {
      id: 'consistent_4',
      name: '꾸준한 학습자',
      description: '4주 연속으로 주간 목표를 달성했습니다',
      icon: '🎯',
      type: 'consistency',
      threshold: 4,
      achieved: consistentWeeks >= 4,
      achievedAt: consistentWeeks >= 4 ? new Date().toISOString() : undefined,
      rarity: 'rare',
      points: 60,
    },
    {
      id: 'consistent_8',
      name: '일관성의 달인',
      description: '8주 연속으로 주간 목표를 달성했습니다',
      icon: '🌟',
      type: 'consistency',
      threshold: 8,
      achieved: consistentWeeks >= 8,
      achievedAt: consistentWeeks >= 8 ? new Date().toISOString() : undefined,
      rarity: 'epic',
      points: 120,
    },
    {
      id: 'consistent_12',
      name: '완벽한 일관성',
      description: '12주 연속으로 주간 목표를 달성했습니다',
      icon: '👑',
      type: 'consistency',
      threshold: 12,
      achieved: consistentWeeks >= 12,
      achievedAt: consistentWeeks >= 12 ? new Date().toISOString() : undefined,
      rarity: 'legendary',
      points: 250,
    },
  ];

  // 월간 통계 기반 성취
  if (monthlyStats) {
    achievements.push(
      {
        id: 'monthly_perfect',
        name: '완벽한 한 달',
        description: '한 달 동안 모든 주간 목표를 달성했습니다',
        icon: '🌙',
        type: 'special',
        threshold: 100,
        achieved:
          monthlyStats.totalWeeks > 0 &&
          monthlyStats.consistentWeeks === monthlyStats.totalWeeks &&
          monthlyStats.totalWeeks >= 4,
        achievedAt:
          monthlyStats.totalWeeks > 0 &&
          monthlyStats.consistentWeeks === monthlyStats.totalWeeks &&
          monthlyStats.totalWeeks >= 4
            ? new Date().toISOString()
            : undefined,
        rarity: 'epic',
        points: 200,
      },
      {
        id: 'monthly_overachiever',
        name: '월간 초과 달성자',
        description: '한 달 평균 주간 완료율이 120%를 넘었습니다',
        icon: '🚀',
        type: 'special',
        threshold: 120,
        achieved: monthlyStats.averageWeeklyCompletion >= 120,
        achievedAt:
          monthlyStats.averageWeeklyCompletion >= 120
            ? new Date().toISOString()
            : undefined,
        rarity: 'rare',
        points: 100,
      }
    );
  }

  // 연간 통계 기반 성취
  if (yearlyStats) {
    achievements.push(
      {
        id: 'yearly_consistent',
        name: '연간 일관성 왕',
        description: '1년 동안 80% 이상의 일관성을 유지했습니다',
        icon: '👑',
        type: 'special',
        threshold: 80,
        achieved: yearlyStats.consistencyRate >= 80,
        achievedAt:
          yearlyStats.consistencyRate >= 80
            ? new Date().toISOString()
            : undefined,
        rarity: 'legendary',
        points: 1000,
      },
      {
        id: 'yearly_prolific',
        name: '연간 다작 작가',
        description: '1년 동안 365개 이상의 일지를 작성했습니다',
        icon: '📚',
        type: 'special',
        threshold: 365,
        achieved: yearlyStats.totalEntries >= 365,
        achievedAt:
          yearlyStats.totalEntries >= 365
            ? new Date().toISOString()
            : undefined,
        rarity: 'legendary',
        points: 1500,
      }
    );
  }

  return achievements;
}

// 진행률 히스토리 분석
export interface ProgressTrend {
  period: string; // 'YYYY-MM-DD' 형식의 주간 시작일
  completed: number;
  target: number;
  rate: number;
  streak: number;
  weekNumber: number; // 해당 년도의 몇 번째 주인지
  monthName: string; // 월 이름 (예: '1월', '2월')
}

export interface ProgressAnalysis {
  trends: ProgressTrend[];
  averageCompletionRate: number;
  improvementTrend: 'improving' | 'declining' | 'stable';
  bestWeek: ProgressTrend | null;
  worstWeek: ProgressTrend | null;
  streakAnalysis: {
    currentStreakWeeks: number;
    longestStreakWeeks: number;
    averageStreak: number;
  };
  consistencyScore: number; // 0-100점
  volatility: 'low' | 'medium' | 'high'; // 완료율 변동성
  seasonalPattern: {
    bestMonth: string;
    worstMonth: string;
    monthlyAverages: { [month: string]: number };
  };
}

export function analyzeProgressHistory(
  progressRecords: ProgressTracking[],
  weeksToAnalyze: number = 12
): ProgressAnalysis {
  // 최근 N주간의 데이터만 분석
  const recentRecords = progressRecords
    .sort(
      (a, b) =>
        new Date(b.week_start_date).getTime() -
        new Date(a.week_start_date).getTime()
    )
    .slice(0, weeksToAnalyze);

  const trends: ProgressTrend[] = recentRecords.map(record => {
    const date = new Date(record.week_start_date);
    const weekNumber = getWeekNumber(date);
    const monthName = getMonthName(date.getMonth());

    return {
      period: record.week_start_date,
      completed: record.completed_count,
      target: record.target_count,
      rate: record.completion_rate,
      streak: record.current_streak,
      weekNumber,
      monthName,
    };
  });

  // 평균 완료율 계산
  const averageCompletionRate =
    trends.length > 0
      ? Math.round(
          trends.reduce((sum, trend) => sum + trend.rate, 0) / trends.length
        )
      : 0;

  // 개선 추세 분석 (최근 4주 vs 이전 4주)
  let improvementTrend: 'improving' | 'declining' | 'stable' = 'stable';
  if (trends.length >= 8) {
    const recentAvg =
      trends.slice(0, 4).reduce((sum, trend) => sum + trend.rate, 0) / 4;
    const previousAvg =
      trends.slice(4, 8).reduce((sum, trend) => sum + trend.rate, 0) / 4;
    const difference = recentAvg - previousAvg;

    if (difference > 10) {
      improvementTrend = 'improving';
    } else if (difference < -10) {
      improvementTrend = 'declining';
    }
  }

  // 최고/최저 주간 찾기
  const bestWeek =
    trends.length > 0
      ? trends.reduce((best, current) =>
          current.rate > best.rate ? current : best
        )
      : null;

  const worstWeek =
    trends.length > 0
      ? trends.reduce((worst, current) =>
          current.rate < worst.rate ? current : worst
        )
      : null;

  // 연속 기록 분석
  const streakAnalysis = analyzeStreakHistory(trends);

  // 일관성 점수 계산 (목표 달성 주의 비율 + 변동성 고려)
  const consistentWeeks = trends.filter(trend => trend.rate >= 80).length;
  const consistencyBase =
    trends.length > 0 ? (consistentWeeks / trends.length) * 100 : 0;

  // 변동성 계산 (표준편차 기반)
  const rates = trends.map(trend => trend.rate);
  const variance = rates.length > 1 ? calculateVariance(rates) : 0;
  const volatilityPenalty = Math.min(20, variance / 10); // 최대 20점 감점
  const consistencyScore = Math.max(
    0,
    Math.round(consistencyBase - volatilityPenalty)
  );

  // 변동성 레벨 결정
  let volatility: 'low' | 'medium' | 'high';
  if (variance < 200) volatility = 'low';
  else if (variance < 500) volatility = 'medium';
  else volatility = 'high';

  // 계절별 패턴 분석
  const seasonalPattern = analyzeSeasonalPattern(trends);

  return {
    trends,
    averageCompletionRate,
    improvementTrend,
    bestWeek,
    worstWeek,
    streakAnalysis,
    consistencyScore,
    volatility,
    seasonalPattern,
  };
}

// 주차 계산 함수
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// 월 이름 반환 함수
function getMonthName(monthIndex: number): string {
  const months = [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ];
  return months[monthIndex];
}

// 연속 기록 히스토리 분석
function analyzeStreakHistory(trends: ProgressTrend[]): {
  currentStreakWeeks: number;
  longestStreakWeeks: number;
  averageStreak: number;
} {
  if (trends.length === 0) {
    return { currentStreakWeeks: 0, longestStreakWeeks: 0, averageStreak: 0 };
  }

  // 현재 연속 주간 (80% 이상 달성한 주)
  let currentStreakWeeks = 0;
  for (const trend of trends) {
    if (trend.rate >= 80) {
      currentStreakWeeks++;
    } else {
      break;
    }
  }

  // 최장 연속 주간
  let longestStreakWeeks = 0;
  let tempStreak = 0;
  for (const trend of trends.reverse()) {
    if (trend.rate >= 80) {
      tempStreak++;
      longestStreakWeeks = Math.max(longestStreakWeeks, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // 평균 연속 기록 (일 단위)
  const averageStreak =
    trends.length > 0
      ? Math.round(
          trends.reduce((sum, trend) => sum + trend.streak, 0) / trends.length
        )
      : 0;

  return { currentStreakWeeks, longestStreakWeeks, averageStreak };
}

// 분산 계산 함수
function calculateVariance(numbers: number[]): number {
  if (numbers.length <= 1) return 0;

  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
}

// 계절별 패턴 분석
function analyzeSeasonalPattern(trends: ProgressTrend[]): {
  bestMonth: string;
  worstMonth: string;
  monthlyAverages: { [month: string]: number };
} {
  const monthlyData: { [month: string]: number[] } = {};

  trends.forEach(trend => {
    if (!monthlyData[trend.monthName]) {
      monthlyData[trend.monthName] = [];
    }
    monthlyData[trend.monthName].push(trend.rate);
  });

  const monthlyAverages: { [month: string]: number } = {};
  let bestMonth = '';
  let worstMonth = '';
  let bestAverage = -1;
  let worstAverage = 101;

  Object.entries(monthlyData).forEach(([month, rates]) => {
    const average = Math.round(
      rates.reduce((sum, rate) => sum + rate, 0) / rates.length
    );
    monthlyAverages[month] = average;

    if (average > bestAverage) {
      bestAverage = average;
      bestMonth = month;
    }
    if (average < worstAverage) {
      worstAverage = average;
      worstMonth = month;
    }
  });

  return { bestMonth, worstMonth, monthlyAverages };
}

// 주간 리셋 기능 (새로운 주가 시작될 때 호출)
export function shouldResetWeeklyProgress(lastUpdateDate: string): boolean {
  const lastUpdate = new Date(lastUpdateDate);
  const currentWeekStart = getWeekStartDate();
  const lastUpdateWeekStart = getWeekStartDate(lastUpdate);

  return currentWeekStart.getTime() !== lastUpdateWeekStart.getTime();
}

// 주간 진행률 자동 리셋 함수
export async function resetWeeklyProgressIfNeeded(
  userId: string,
  categoryId: string,
  lastProgressUpdate?: string
): Promise<boolean> {
  if (!lastProgressUpdate) return false;

  const shouldReset = shouldResetWeeklyProgress(lastProgressUpdate);
  if (!shouldReset) return false;

  // 새로운 주가 시작되었으므로 진행률 초기화
  console.log(`주간 진행률 리셋: 사용자 ${userId}, 카테고리 ${categoryId}`);
  return true;
}

// 월간 통계 계산
export interface MonthlyStats {
  month: string; // 'YYYY-MM' 형식
  totalEntries: number;
  averageWeeklyCompletion: number;
  bestWeekCompletion: number;
  worstWeekCompletion: number;
  consistentWeeks: number;
  totalWeeks: number;
}

export function calculateMonthlyStats(
  progressRecords: ProgressTracking[],
  targetMonth?: string // 'YYYY-MM' 형식, 없으면 현재 월
): MonthlyStats {
  const month = targetMonth || new Date().toISOString().slice(0, 7);

  // 해당 월의 진행률 기록들 필터링
  const monthlyRecords = progressRecords.filter(record =>
    record.week_start_date.startsWith(month)
  );

  if (monthlyRecords.length === 0) {
    return {
      month,
      totalEntries: 0,
      averageWeeklyCompletion: 0,
      bestWeekCompletion: 0,
      worstWeekCompletion: 0,
      consistentWeeks: 0,
      totalWeeks: 0,
    };
  }

  const totalEntries = monthlyRecords.reduce(
    (sum, record) => sum + record.completed_count,
    0
  );

  const completionRates = monthlyRecords.map(record => record.completion_rate);
  const averageWeeklyCompletion = Math.round(
    completionRates.reduce((sum, rate) => sum + rate, 0) /
      completionRates.length
  );

  const bestWeekCompletion = Math.max(...completionRates);
  const worstWeekCompletion = Math.min(...completionRates);

  const consistentWeeks = monthlyRecords.filter(
    record => record.completion_rate >= 80
  ).length;

  return {
    month,
    totalEntries,
    averageWeeklyCompletion,
    bestWeekCompletion,
    worstWeekCompletion,
    consistentWeeks,
    totalWeeks: monthlyRecords.length,
  };
}

// 연간 통계 계산
export interface YearlyStats {
  year: string; // 'YYYY' 형식
  totalEntries: number;
  averageMonthlyEntries: number;
  bestMonth: { month: string; entries: number };
  longestStreak: number;
  totalActiveWeeks: number;
  consistencyRate: number; // 목표 달성 주의 비율
}

export function calculateYearlyStats(
  progressRecords: ProgressTracking[],
  targetYear?: string // 'YYYY' 형식, 없으면 현재 년도
): YearlyStats {
  const year = targetYear || new Date().getFullYear().toString();

  // 해당 년도의 진행률 기록들 필터링
  const yearlyRecords = progressRecords.filter(record =>
    record.week_start_date.startsWith(year)
  );

  if (yearlyRecords.length === 0) {
    return {
      year,
      totalEntries: 0,
      averageMonthlyEntries: 0,
      bestMonth: { month: '', entries: 0 },
      longestStreak: 0,
      totalActiveWeeks: 0,
      consistencyRate: 0,
    };
  }

  const totalEntries = yearlyRecords.reduce(
    (sum, record) => sum + record.completed_count,
    0
  );

  // 월별 엔트리 수 계산
  const monthlyEntries = new Map<string, number>();
  yearlyRecords.forEach(record => {
    const month = record.week_start_date.slice(0, 7); // 'YYYY-MM'
    monthlyEntries.set(
      month,
      (monthlyEntries.get(month) || 0) + record.completed_count
    );
  });

  const averageMonthlyEntries = Math.round(
    totalEntries / Math.max(1, monthlyEntries.size)
  );

  // 최고 월 찾기
  let bestMonth = { month: '', entries: 0 };
  monthlyEntries.forEach((entries, month) => {
    if (entries > bestMonth.entries) {
      bestMonth = { month, entries };
    }
  });

  const longestStreak = Math.max(
    ...yearlyRecords.map(record => record.best_streak)
  );
  const totalActiveWeeks = yearlyRecords.length;
  const consistentWeeks = yearlyRecords.filter(
    record => record.completion_rate >= 80
  ).length;
  const consistencyRate = Math.round(
    (consistentWeeks / totalActiveWeeks) * 100
  );

  return {
    year,
    totalEntries,
    averageMonthlyEntries,
    bestMonth,
    longestStreak,
    totalActiveWeeks,
    consistencyRate,
  };
}

// 동기부여 메시지 생성
export function generateMotivationalMessage(
  completionRate: number,
  currentStreak: number,
  daysUntilWeekEnd: number
): string {
  if (completionRate >= 100) {
    return `🎉 이번 주 목표를 달성했습니다! ${currentStreak}일 연속 기록 중이에요.`;
  } else if (completionRate >= 80) {
    return `💪 거의 다 왔어요! ${daysUntilWeekEnd}일 남았습니다.`;
  } else if (completionRate >= 50) {
    return `📈 좋은 페이스로 진행 중이에요. 계속 화이팅!`;
  } else if (currentStreak > 0) {
    return `🔥 ${currentStreak}일 연속 기록 중! 이 기세를 유지해보세요.`;
  } else {
    return `🌟 새로운 시작! 오늘부터 꾸준히 기록해보세요.`;
  }
}

// 주간 진행률 업데이트 함수
export async function updateWeeklyProgress(
  userId: string,
  categoryId: string,
  journals: Journal[]
): Promise<ProgressTracking> {
  const currentWeekStart = getWeekStartDate();
  const weekStartStr = formatDateForDB(currentWeekStart);

  // 현재 주의 일지들 필터링
  const weeklyJournals = journals.filter(journal => {
    const journalDate = journal.created_at?.split('T')[0];
    const weekEnd = formatDateForDB(getWeekEndDate(currentWeekStart));
    return journalDate && journalDate >= weekStartStr && journalDate <= weekEnd;
  });

  // 전체 일지 날짜 추출 (연속 기록 계산용)
  const allJournalDates = journals
    .map(j => j.created_at?.split('T')[0])
    .filter((date): date is string => Boolean(date));

  const streakData = calculateStreak(allJournalDates);
  const completedCount = weeklyJournals.length;

  // 기본 목표는 주 3회로 설정 (실제로는 Assignment에서 가져와야 함)
  const targetCount = 3;
  const completionRate =
    targetCount > 0 ? Math.round((completedCount / targetCount) * 100) : 0;

  const lastEntryDate =
    allJournalDates.length > 0 ? allJournalDates.sort().reverse()[0]! : null;

  return {
    id: '', // 실제 구현에서는 DB에서 생성
    user_id: userId,
    category_id: categoryId,
    week_start_date: weekStartStr,
    target_count: targetCount,
    completed_count: completedCount,
    completion_rate: completionRate,
    current_streak: streakData.current,
    best_streak: streakData.best,
    last_entry_date: lastEntryDate,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// 일관성 점수 계산 (최근 N주간의 목표 달성률 기반)
export function calculateConsistencyScore(
  progressRecords: ProgressTracking[],
  weeksToAnalyze: number = 4
): {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  consistentWeeks: number;
} {
  const recentRecords = progressRecords
    .sort(
      (a, b) =>
        new Date(b.week_start_date).getTime() -
        new Date(a.week_start_date).getTime()
    )
    .slice(0, weeksToAnalyze);

  if (recentRecords.length === 0) {
    return { score: 0, level: 'needs_improvement', consistentWeeks: 0 };
  }

  const consistentWeeks = recentRecords.filter(
    record => record.completion_rate >= 80
  ).length;
  const score = Math.round((consistentWeeks / recentRecords.length) * 100);

  let level: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  if (score >= 90) level = 'excellent';
  else if (score >= 70) level = 'good';
  else if (score >= 50) level = 'fair';
  else level = 'needs_improvement';

  return { score, level, consistentWeeks };
}

// 목표 달성 예측 함수
export function predictWeeklyGoalCompletion(
  currentProgress: ProgressTracking,
  averageDailyEntries: number
): {
  willComplete: boolean;
  daysNeeded: number;
  confidence: number;
  recommendation: string;
} {
  const today = new Date();
  const weekStart = new Date(currentProgress.week_start_date);
  const weekEnd = getWeekEndDate(weekStart);
  const daysRemaining = Math.max(0, getDaysBetween(today, weekEnd));

  const entriesNeeded = Math.max(
    0,
    currentProgress.target_count - currentProgress.completed_count
  );
  const daysNeeded =
    averageDailyEntries > 0
      ? Math.ceil(entriesNeeded / averageDailyEntries)
      : Infinity;

  const willComplete = daysNeeded <= daysRemaining;
  const confidence = Math.min(
    100,
    Math.round((daysRemaining / Math.max(1, daysNeeded)) * 100)
  );

  let recommendation: string;
  if (willComplete && confidence >= 80) {
    recommendation = '현재 페이스를 유지하면 목표를 달성할 수 있어요!';
  } else if (willComplete && confidence >= 50) {
    recommendation = '조금 더 노력하면 목표 달성이 가능해요.';
  } else {
    recommendation = `목표 달성을 위해 하루 평균 ${Math.ceil(entriesNeeded / Math.max(1, daysRemaining))}개의 일지가 필요해요.`;
  }

  return { willComplete, daysNeeded, confidence, recommendation };
}

// 성과 비교 함수 (이전 주 대비)
export function compareWithPreviousWeek(
  currentWeek: ProgressTracking,
  previousWeek: ProgressTracking | null
): {
  completionRateChange: number;
  streakChange: number;
  improvement: boolean;
  message: string;
} {
  if (!previousWeek) {
    return {
      completionRateChange: 0,
      streakChange: 0,
      improvement: true,
      message: '첫 주 기록이에요! 꾸준히 시작해보세요.',
    };
  }

  const completionRateChange =
    currentWeek.completion_rate - previousWeek.completion_rate;
  const streakChange = currentWeek.current_streak - previousWeek.current_streak;
  const improvement = completionRateChange >= 0;

  let message: string;
  if (completionRateChange > 20) {
    message = `🚀 지난주보다 ${completionRateChange}% 향상되었어요! 대단해요!`;
  } else if (completionRateChange > 0) {
    message = `📈 지난주보다 ${completionRateChange}% 개선되었어요.`;
  } else if (completionRateChange === 0) {
    message = '지난주와 동일한 수준을 유지하고 있어요.';
  } else {
    message = `지난주보다 ${Math.abs(completionRateChange)}% 감소했어요. 다시 힘내봐요!`;
  }

  return { completionRateChange, streakChange, improvement, message };
}
