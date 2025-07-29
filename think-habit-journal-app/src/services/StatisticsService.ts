import {
  Journal,
  PhotoJournalContent,
  StructuredJournalContent,
} from "../types/journal";

export interface DashboardStats {
  totalJournals: number;
  structuredJournals: number;
  photoJournals: number;
  todayJournals: number;
  weekJournals: number;
  monthJournals: number;
  currentStreak: number;
  longestStreak: number;
  averageCompletionRate: number;
  totalTodos: number;
  completedTodos: number;
  totalPhotos: number;
  totalWords: number;
  mostUsedTags: { tag: string; count: number }[];
  weeklyActivity: { date: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
  completionTrend: { date: string; rate: number }[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
  category: "writing" | "consistency" | "completion" | "photos" | "special";
}

export interface WritingStreak {
  currentStreak: number;
  longestStreak: number;
  streakStartDate?: Date;
  streakEndDate?: Date;
  isActive: boolean;
}

class StatisticsService {
  // 기본 통계 계산
  calculateDashboardStats(journals: Journal[]): DashboardStats {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 삭제되지 않은 일지만 필터링
    const activeJournals = journals.filter((j) => !j.isDeleted);

    // 기본 카운트
    const totalJournals = activeJournals.length;
    const structuredJournals = activeJournals.filter(
      (j) => j.type === "structured",
    ).length;
    const photoJournals = activeJournals.filter(
      (j) => j.type === "photo",
    ).length;

    // 날짜별 필터링
    const todayJournals = activeJournals.filter(
      (j) => new Date(j.content.date) >= today,
    ).length;

    const weekJournals = activeJournals.filter(
      (j) => new Date(j.content.date) >= weekAgo,
    ).length;

    const monthJournals = activeJournals.filter(
      (j) => new Date(j.content.date) >= monthAgo,
    ).length;

    // 연속 작성 일수 계산
    const streakInfo = this.calculateWritingStreak(activeJournals);

    // 완료율 계산
    const completionStats = this.calculateCompletionStats(activeJournals);

    // 사진 통계
    const totalPhotos = activeJournals
      .filter((j) => j.type === "photo")
      .reduce(
        (sum, j) =>
          sum + ((j.content as PhotoJournalContent).photos?.length || 0),
        0,
      );

    // 단어 수 계산
    const totalWords = this.calculateTotalWords(activeJournals);

    // 태그 통계
    const mostUsedTags = this.calculateTagStats(activeJournals);

    // 활동 트렌드
    const weeklyActivity = this.calculateWeeklyActivity(activeJournals);
    const monthlyTrend = this.calculateMonthlyTrend(activeJournals);
    const completionTrend = this.calculateCompletionTrend(activeJournals);

    return {
      totalJournals,
      structuredJournals,
      photoJournals,
      todayJournals,
      weekJournals,
      monthJournals,
      currentStreak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      averageCompletionRate: completionStats.averageRate,
      totalTodos: completionStats.totalTodos,
      completedTodos: completionStats.completedTodos,
      totalPhotos,
      totalWords,
      mostUsedTags,
      weeklyActivity,
      monthlyTrend,
      completionTrend,
    };
  }

  // 연속 작성 일수 계산
  calculateWritingStreak(journals: Journal[]): WritingStreak {
    if (journals.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        isActive: false,
      };
    }

    // 날짜별로 그룹화 (하루에 여러 일지 작성 가능)
    const dateGroups = new Map<string, Journal[]>();
    journals.forEach((journal) => {
      const dateKey = new Date(journal.content.date).toDateString();
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, []);
      }
      dateGroups.get(dateKey)!.push(journal);
    });

    // 날짜 정렬
    const sortedDates = Array.from(dateGroups.keys())
      .map((dateStr) => new Date(dateStr))
      .sort((a, b) => b.getTime() - a.getTime()); // 최신순

    if (sortedDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        isActive: false,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 현재 연속 일수 계산
    let currentStreak = 0;
    let streakStartDate: Date | undefined;
    let streakEndDate: Date | undefined;

    // 오늘 또는 어제부터 시작하는 연속 일수만 유효
    const latestDate = sortedDates[0];
    const isActive =
      latestDate.getTime() === today.getTime() ||
      latestDate.getTime() === yesterday.getTime();

    if (isActive) {
      let checkDate = new Date(latestDate);
      streakEndDate = new Date(latestDate);

      for (let i = 0; i < sortedDates.length; i++) {
        const currentDate = sortedDates[i];
        if (currentDate.getTime() === checkDate.getTime()) {
          currentStreak++;
          streakStartDate = new Date(currentDate);
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // 최장 연속 일수 계산
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currentDate = sortedDates[i];

      const dayDiff = Math.floor(
        (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      streakStartDate,
      streakEndDate,
      isActive,
    };
  }

  // 완료율 통계 계산
  private calculateCompletionStats(journals: Journal[]): {
    averageRate: number;
    totalTodos: number;
    completedTodos: number;
  } {
    const structuredJournals = journals.filter((j) => j.type === "structured");

    if (structuredJournals.length === 0) {
      return { averageRate: 0, totalTodos: 0, completedTodos: 0 };
    }

    let totalTodos = 0;
    let completedTodos = 0;
    let totalRate = 0;

    structuredJournals.forEach((journal) => {
      const content = journal.content as StructuredJournalContent;
      const todos = content.todos || [];
      const completed = todos.filter((todo) => todo.completed).length;

      totalTodos += todos.length;
      completedTodos += completed;

      if (todos.length > 0) {
        totalRate += (completed / todos.length) * 100;
      }
    });

    const averageRate =
      structuredJournals.length > 0
        ? Math.round(totalRate / structuredJournals.length)
        : 0;

    return { averageRate, totalTodos, completedTodos };
  }

  // 총 단어 수 계산
  private calculateTotalWords(journals: Journal[]): number {
    return journals.reduce((total, journal) => {
      let words = 0;

      if (journal.type === "structured") {
        const content = journal.content as StructuredJournalContent;
        words += this.countWords(content.notes || "");
        words += (content.todos || []).reduce(
          (sum, todo) => sum + this.countWords(todo.text),
          0,
        );
      } else {
        const content = journal.content as PhotoJournalContent;
        words += this.countWords(content.description || "");
        words += (content.photos || []).reduce(
          (sum, photo) => sum + this.countWords(photo.caption || ""),
          0,
        );
      }

      return total + words;
    }, 0);
  }

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  // 태그 통계 계산
  private calculateTagStats(
    journals: Journal[],
  ): { tag: string; count: number }[] {
    const tagCounts = new Map<string, number>();

    journals.forEach((journal) => {
      (journal.content.tags || []).forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // 상위 10개
  }

  // 주간 활동 계산
  private calculateWeeklyActivity(
    journals: Journal[],
  ): { date: string; count: number }[] {
    const now = new Date();
    const weeklyData: { date: string; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = journals.filter((journal) => {
        const journalDate = new Date(journal.content.date);
        return journalDate >= date && journalDate < nextDate;
      }).length;

      weeklyData.push({
        date: date.toISOString().split("T")[0],
        count,
      });
    }

    return weeklyData;
  }

  // 월간 트렌드 계산
  private calculateMonthlyTrend(
    journals: Journal[],
  ): { month: string; count: number }[] {
    const now = new Date();
    const monthlyData: { month: string; count: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const count = journals.filter((journal) => {
        const journalDate = new Date(journal.content.date);
        return journalDate >= date && journalDate < nextMonth;
      }).length;

      monthlyData.push({
        month: date.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "short",
        }),
        count,
      });
    }

    return monthlyData;
  }

  // 완료율 트렌드 계산
  private calculateCompletionTrend(
    journals: Journal[],
  ): { date: string; rate: number }[] {
    const structuredJournals = journals.filter((j) => j.type === "structured");
    const now = new Date();
    const trendData: { date: string; rate: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayJournals = structuredJournals.filter((journal) => {
        const journalDate = new Date(journal.content.date);
        return journalDate >= date && journalDate < nextDate;
      });

      let totalRate = 0;
      let validJournals = 0;

      dayJournals.forEach((journal) => {
        const content = journal.content as StructuredJournalContent;
        const todos = content.todos || [];
        if (todos.length > 0) {
          const completed = todos.filter((todo) => todo.completed).length;
          totalRate += (completed / todos.length) * 100;
          validJournals++;
        }
      });

      const averageRate =
        validJournals > 0 ? Math.round(totalRate / validJournals) : 0;

      trendData.push({
        date: date.toISOString().split("T")[0],
        rate: averageRate,
      });
    }

    return trendData;
  }

  // 업적 계산
  calculateAchievements(
    journals: Journal[],
    stats: DashboardStats,
  ): Achievement[] {
    const achievements: Achievement[] = [
      // 작성 관련 업적
      {
        id: "first-journal",
        title: "첫 걸음",
        description: "첫 번째 일지를 작성했습니다",
        icon: "🌱",
        category: "writing",
        progress: Math.min(stats.totalJournals, 1),
        maxProgress: 1,
        unlockedAt:
          stats.totalJournals >= 1 ? journals[0]?.createdAt : undefined,
      },
      {
        id: "journal-10",
        title: "꾸준한 기록자",
        description: "10개의 일지를 작성했습니다",
        icon: "📝",
        category: "writing",
        progress: Math.min(stats.totalJournals, 10),
        maxProgress: 10,
        unlockedAt:
          stats.totalJournals >= 10
            ? this.findNthJournalDate(journals, 10)
            : undefined,
      },
      {
        id: "journal-50",
        title: "일지 마스터",
        description: "50개의 일지를 작성했습니다",
        icon: "🏆",
        category: "writing",
        progress: Math.min(stats.totalJournals, 50),
        maxProgress: 50,
        unlockedAt:
          stats.totalJournals >= 50
            ? this.findNthJournalDate(journals, 50)
            : undefined,
      },

      // 연속성 관련 업적
      {
        id: "streak-7",
        title: "일주일 챌린지",
        description: "7일 연속으로 일지를 작성했습니다",
        icon: "🔥",
        category: "consistency",
        progress: Math.min(stats.longestStreak, 7),
        maxProgress: 7,
        unlockedAt: stats.longestStreak >= 7 ? new Date() : undefined,
      },
      {
        id: "streak-30",
        title: "한 달 마라톤",
        description: "30일 연속으로 일지를 작성했습니다",
        icon: "🏃‍♂️",
        category: "consistency",
        progress: Math.min(stats.longestStreak, 30),
        maxProgress: 30,
        unlockedAt: stats.longestStreak >= 30 ? new Date() : undefined,
      },

      // 완료율 관련 업적
      {
        id: "completion-80",
        title: "완벽주의자",
        description: "평균 완료율 80% 달성",
        icon: "✨",
        category: "completion",
        progress: Math.min(stats.averageCompletionRate, 80),
        maxProgress: 80,
        unlockedAt: stats.averageCompletionRate >= 80 ? new Date() : undefined,
      },

      // 사진 관련 업적
      {
        id: "photos-100",
        title: "사진 수집가",
        description: "100장의 사진을 업로드했습니다",
        icon: "📸",
        category: "photos",
        progress: Math.min(stats.totalPhotos, 100),
        maxProgress: 100,
        unlockedAt: stats.totalPhotos >= 100 ? new Date() : undefined,
      },
    ];

    return achievements;
  }

  private findNthJournalDate(journals: Journal[], n: number): Date | undefined {
    const sortedJournals = journals
      .filter((j) => !j.isDeleted)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    return sortedJournals[n - 1]?.createdAt;
  }

  // 동기부여 메시지 생성
  generateMotivationalMessage(
    stats: DashboardStats,
    streak: WritingStreak,
  ): string {
    const messages = {
      newUser: [
        "첫 번째 일지를 작성해보세요! 🌟",
        "새로운 여정의 시작입니다. 화이팅! 💪",
        "오늘의 생각을 기록해보세요 ✍️",
      ],
      activeStreak: [
        `${streak.currentStreak}일 연속 작성 중! 대단해요! 🔥`,
        `꾸준함이 힘입니다. ${streak.currentStreak}일째 진행 중! 👏`,
        `연속 ${streak.currentStreak}일! 이 기세를 유지해보세요! ⚡`,
      ],
      brokenStreak: [
        "다시 시작하는 것도 용기입니다! 💪",
        "오늘부터 새로운 연속 기록을 만들어보세요! 🌱",
        "완벽하지 않아도 괜찮아요. 계속 도전해보세요! 🌟",
      ],
      highCompletion: [
        `완료율 ${stats.averageCompletionRate}%! 정말 훌륭해요! ✨`,
        "목표를 잘 달성하고 계시네요! 👍",
        "이런 성취감이 성장의 원동력이에요! 🚀",
      ],
      encouragement: [
        "작은 기록이 큰 변화를 만듭니다 📈",
        "오늘도 한 걸음 더 나아가세요! 🚶‍♂️",
        "당신의 노력이 빛나고 있어요! ✨",
      ],
    };

    if (stats.totalJournals === 0) {
      return messages.newUser[
        Math.floor(Math.random() * messages.newUser.length)
      ];
    }

    if (streak.isActive && streak.currentStreak >= 3) {
      return messages.activeStreak[
        Math.floor(Math.random() * messages.activeStreak.length)
      ];
    }

    if (!streak.isActive && streak.longestStreak > 0) {
      return messages.brokenStreak[
        Math.floor(Math.random() * messages.brokenStreak.length)
      ];
    }

    if (stats.averageCompletionRate >= 70) {
      return messages.highCompletion[
        Math.floor(Math.random() * messages.highCompletion.length)
      ];
    }

    return messages.encouragement[
      Math.floor(Math.random() * messages.encouragement.length)
    ];
  }
}

// 싱글톤 인스턴스
export const statisticsService = new StatisticsService();
export default StatisticsService;
