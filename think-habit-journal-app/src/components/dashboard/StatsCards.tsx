import React from "react";
import { DashboardStats } from "../../services/StatisticsService";
import "./StatsCards.css";

interface StatsCardsProps {
  stats: DashboardStats;
  timeRange: "week" | "month" | "year";
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, timeRange }) => {
  const getTimeRangeData = () => {
    switch (timeRange) {
      case "week":
        return {
          period: "이번 주",
          journalCount: stats.weekJournals,
          icon: "📅",
        };
      case "month":
        return {
          period: "이번 달",
          journalCount: stats.monthJournals,
          icon: "🗓️",
        };
      case "year":
        return {
          period: "올해",
          journalCount: stats.totalJournals,
          icon: "📆",
        };
    }
  };

  const timeRangeData = getTimeRangeData();

  const cards = [
    {
      id: "total-journals",
      title: "총 일지 수",
      value: stats.totalJournals,
      icon: "📝",
      color: "blue",
      subtitle: `구조화된 ${stats.structuredJournals}개, 사진 ${stats.photoJournals}개`,
    },
    {
      id: "period-journals",
      title: `${timeRangeData.period} 작성`,
      value: timeRangeData.journalCount,
      icon: timeRangeData.icon,
      color: "green",
      subtitle:
        timeRangeData.journalCount > 0
          ? "꾸준히 작성 중!"
          : "일지를 작성해보세요",
    },
    {
      id: "current-streak",
      title: "현재 연속 일수",
      value: stats.currentStreak,
      icon: "🔥",
      color: "orange",
      subtitle: `최장 ${stats.longestStreak}일`,
      suffix: "일",
    },
    {
      id: "completion-rate",
      title: "평균 완료율",
      value: stats.averageCompletionRate,
      icon: "✅",
      color: "purple",
      subtitle: `${stats.completedTodos}/${stats.totalTodos} 완료`,
      suffix: "%",
      hidden: stats.structuredJournals === 0,
    },
    {
      id: "total-photos",
      title: "업로드한 사진",
      value: stats.totalPhotos,
      icon: "📸",
      color: "pink",
      subtitle: `${stats.photoJournals}개 사진 일지`,
      suffix: "장",
      hidden: stats.photoJournals === 0,
    },
    {
      id: "total-words",
      title: "작성한 단어",
      value: stats.totalWords,
      icon: "✍️",
      color: "indigo",
      subtitle: "모든 일지 합계",
      suffix: "개",
    },
  ];

  const visibleCards = cards.filter((card) => !card.hidden);

  return (
    <div className="stats-cards">
      <div className="cards-grid">
        {visibleCards.map((card) => (
          <div key={card.id} className={`stats-card ${card.color}`}>
            <div className="card-header">
              <div className="card-icon">{card.icon}</div>
              <h3 className="card-title">{card.title}</h3>
            </div>

            <div className="card-content">
              <div className="card-value">
                {card.value.toLocaleString()}
                {card.suffix && (
                  <span className="value-suffix">{card.suffix}</span>
                )}
              </div>

              {card.subtitle && (
                <div className="card-subtitle">{card.subtitle}</div>
              )}
            </div>

            <div className="card-trend">
              {card.id === "period-journals" &&
                timeRangeData.journalCount > 0 && (
                  <div className="trend-indicator positive">
                    <span className="trend-icon">📈</span>
                    <span className="trend-text">활발한 활동</span>
                  </div>
                )}

              {card.id === "current-streak" && stats.currentStreak > 0 && (
                <div className="trend-indicator positive">
                  <span className="trend-icon">🚀</span>
                  <span className="trend-text">연속 기록 중</span>
                </div>
              )}

              {card.id === "completion-rate" &&
                stats.averageCompletionRate >= 80 && (
                  <div className="trend-indicator positive">
                    <span className="trend-icon">⭐</span>
                    <span className="trend-text">우수한 완료율</span>
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>

      {/* 오늘의 요약 */}
      <div className="today-summary">
        <div className="summary-header">
          <h4>오늘의 활동</h4>
          <span className="today-date">
            {new Date().toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </span>
        </div>

        <div className="summary-content">
          {stats.todayJournals > 0 ? (
            <div className="summary-item positive">
              <span className="summary-icon">✨</span>
              <span className="summary-text">
                오늘 {stats.todayJournals}개의 일지를 작성했습니다!
              </span>
            </div>
          ) : (
            <div className="summary-item neutral">
              <span className="summary-icon">💭</span>
              <span className="summary-text">오늘의 일지를 작성해보세요</span>
            </div>
          )}

          {stats.currentStreak > 0 && (
            <div className="summary-item info">
              <span className="summary-icon">🔥</span>
              <span className="summary-text">
                {stats.currentStreak}일 연속 작성 중
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
