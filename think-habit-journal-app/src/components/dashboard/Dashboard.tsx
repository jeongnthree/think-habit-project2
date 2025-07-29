import React, { useMemo, useState } from "react";
import { statisticsService } from "../../services/StatisticsService";
import { Journal } from "../../types/journal";
import { AchievementsList } from "./AchievementsList";
import { ActivityChart } from "./ActivityChart";
import { CompletionChart } from "./CompletionChart";
import "./Dashboard.css";
import { MotivationalMessage } from "./MotivationalMessage";
import { QuickActions } from "./QuickActions";
import { StatsCards } from "./StatsCards";
import { StreakDisplay } from "./StreakDisplay";

interface DashboardProps {
  journals: Journal[];
  onCreateJournal: (type: "structured" | "photo") => void;
  onViewJournals: () => void;
  isLoading?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  journals,
  onCreateJournal,
  onViewJournals,
  isLoading = false,
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "week" | "month" | "year"
  >("week");
  const [showAchievements, setShowAchievements] = useState(false);

  // 통계 계산
  const stats = useMemo(() => {
    return statisticsService.calculateDashboardStats(journals);
  }, [journals]);

  // 연속 작성 정보
  const streakInfo = useMemo(() => {
    return statisticsService.calculateWritingStreak(
      journals.filter((j) => !j.isDeleted),
    );
  }, [journals]);

  // 업적 계산
  const achievements = useMemo(() => {
    return statisticsService.calculateAchievements(journals, stats);
  }, [journals, stats]);

  // 동기부여 메시지
  const motivationalMessage = useMemo(() => {
    return statisticsService.generateMotivationalMessage(stats, streakInfo);
  }, [stats, streakInfo]);

  // 최근 업적 (새로 달성한 것들)
  const recentAchievements = achievements.filter(
    (a) =>
      a.unlockedAt &&
      new Date().getTime() - a.unlockedAt.getTime() < 7 * 24 * 60 * 60 * 1000, // 7일 이내
  );

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>대시보드를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>대시보드</h1>
          <div className="header-actions">
            <div className="time-range-selector">
              <button
                className={selectedTimeRange === "week" ? "active" : ""}
                onClick={() => setSelectedTimeRange("week")}
              >
                주간
              </button>
              <button
                className={selectedTimeRange === "month" ? "active" : ""}
                onClick={() => setSelectedTimeRange("month")}
              >
                월간
              </button>
              <button
                className={selectedTimeRange === "year" ? "active" : ""}
                onClick={() => setSelectedTimeRange("year")}
              >
                연간
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* 동기부여 메시지 */}
        <MotivationalMessage
          message={motivationalMessage}
          streak={streakInfo}
          stats={stats}
        />

        {/* 빠른 액션 */}
        <QuickActions
          onCreateStructured={() => onCreateJournal("structured")}
          onCreatePhoto={() => onCreateJournal("photo")}
          onViewJournals={onViewJournals}
          todayJournalCount={stats.todayJournals}
        />

        {/* 통계 카드 */}
        <StatsCards stats={stats} timeRange={selectedTimeRange} />

        {/* 연속 작성 표시 */}
        <StreakDisplay
          streak={streakInfo}
          weeklyActivity={stats.weeklyActivity}
        />

        <div className="dashboard-charts">
          {/* 활동 차트 */}
          <div className="chart-section">
            <ActivityChart
              data={
                selectedTimeRange === "week"
                  ? stats.weeklyActivity
                  : stats.monthlyTrend
              }
              timeRange={selectedTimeRange}
            />
          </div>

          {/* 완료율 차트 */}
          {stats.structuredJournals > 0 && (
            <div className="chart-section">
              <CompletionChart
                data={stats.completionTrend}
                averageRate={stats.averageCompletionRate}
              />
            </div>
          )}
        </div>

        {/* 최근 업적 */}
        {recentAchievements.length > 0 && (
          <div className="recent-achievements">
            <div className="section-header">
              <h3>🎉 최근 달성한 업적</h3>
            </div>
            <div className="achievements-preview">
              {recentAchievements.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="achievement-item recent">
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-info">
                    <h4>{achievement.title}</h4>
                    <p>{achievement.description}</p>
                    <span className="achievement-date">
                      {achievement.unlockedAt?.toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 업적 섹션 */}
        <div className="achievements-section">
          <div className="section-header">
            <h3>업적</h3>
            <button
              onClick={() => setShowAchievements(!showAchievements)}
              className="toggle-achievements"
            >
              {showAchievements ? "접기" : "모두 보기"}
            </button>
          </div>

          {showAchievements ? (
            <AchievementsList achievements={achievements} />
          ) : (
            <div className="achievements-summary">
              <div className="achievement-stats">
                <div className="stat-item">
                  <span className="stat-number">
                    {
                      achievements.filter((a) => a.progress >= a.maxProgress)
                        .length
                    }
                  </span>
                  <span className="stat-label">달성</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {
                      achievements.filter(
                        (a) => a.progress > 0 && a.progress < a.maxProgress,
                      ).length
                    }
                  </span>
                  <span className="stat-label">진행 중</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{achievements.length}</span>
                  <span className="stat-label">전체</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 태그 클라우드 */}
        {stats.mostUsedTags.length > 0 && (
          <div className="tags-section">
            <div className="section-header">
              <h3>자주 사용하는 태그</h3>
            </div>
            <div className="tags-cloud">
              {stats.mostUsedTags.map(({ tag, count }) => (
                <span
                  key={tag}
                  className="tag-item"
                  style={{
                    fontSize: `${Math.min(1 + (count / stats.mostUsedTags[0].count) * 0.5, 1.5)}rem`,
                  }}
                >
                  {tag}
                  <span className="tag-count">({count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {stats.totalJournals === 0 && (
          <div className="empty-dashboard">
            <div className="empty-icon">📝</div>
            <h3>아직 작성된 일지가 없습니다</h3>
            <p>첫 번째 일지를 작성하여 여정을 시작해보세요!</p>
            <div className="empty-actions">
              <button
                onClick={() => onCreateJournal("structured")}
                className="create-button primary"
              >
                구조화된 일지 작성
              </button>
              <button
                onClick={() => onCreateJournal("photo")}
                className="create-button secondary"
              >
                사진 일지 작성
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
