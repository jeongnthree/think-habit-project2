import React from "react";
import { WritingStreak } from "../../services/StatisticsService";
import "./StreakDisplay.css";

interface StreakDisplayProps {
  streak: WritingStreak;
  weeklyActivity: { date: string; count: number }[];
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  streak,
  weeklyActivity,
}) => {
  const getStreakMessage = () => {
    if (streak.currentStreak === 0) {
      return {
        title: "새로운 시작",
        message: "오늘부터 연속 기록을 시작해보세요!",
        icon: "🌱",
        color: "neutral",
      };
    }

    if (streak.currentStreak === 1) {
      return {
        title: "좋은 시작!",
        message: "첫 번째 일지를 작성했습니다",
        icon: "✨",
        color: "positive",
      };
    }

    if (streak.currentStreak < 7) {
      return {
        title: `${streak.currentStreak}일 연속!`,
        message: "꾸준히 이어가고 있어요",
        icon: "🔥",
        color: "positive",
      };
    }

    if (streak.currentStreak < 30) {
      return {
        title: `${streak.currentStreak}일 연속!`,
        message: "정말 대단해요! 이 기세를 유지해보세요",
        icon: "🚀",
        color: "excellent",
      };
    }

    return {
      title: `${streak.currentStreak}일 연속!`,
      message: "놀라운 성취입니다! 당신은 진정한 일지 마스터예요",
      icon: "👑",
      color: "legendary",
    };
  };

  const streakInfo = getStreakMessage();

  const getActivityLevel = (
    count: number,
  ): "none" | "low" | "medium" | "high" => {
    if (count === 0) return "none";
    if (count === 1) return "low";
    if (count <= 2) return "medium";
    return "high";
  };

  const getDayName = (dateString: string): string => {
    const date = new Date(dateString);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return days[date.getDay()];
  };

  const isToday = (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="streak-display">
      <div className="streak-header">
        <div className="streak-info">
          <div className={`streak-icon ${streakInfo.color}`}>
            {streakInfo.icon}
          </div>
          <div className="streak-content">
            <h3 className="streak-title">{streakInfo.title}</h3>
            <p className="streak-message">{streakInfo.message}</p>
            {streak.longestStreak > streak.currentStreak && (
              <p className="streak-record">
                최장 기록: {streak.longestStreak}일
              </p>
            )}
          </div>
        </div>

        {streak.currentStreak > 0 && (
          <div className="streak-stats">
            <div className="stat-item">
              <span className="stat-label">현재</span>
              <span className="stat-value">{streak.currentStreak}일</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">최장</span>
              <span className="stat-value">{streak.longestStreak}일</span>
            </div>
          </div>
        )}
      </div>

      {/* 주간 활동 히트맵 */}
      <div className="activity-heatmap">
        <div className="heatmap-header">
          <h4>최근 7일 활동</h4>
          <div className="heatmap-legend">
            <span className="legend-label">적음</span>
            <div className="legend-squares">
              <div className="legend-square none"></div>
              <div className="legend-square low"></div>
              <div className="legend-square medium"></div>
              <div className="legend-square high"></div>
            </div>
            <span className="legend-label">많음</span>
          </div>
        </div>

        <div className="heatmap-grid">
          {weeklyActivity.map((day, index) => (
            <div key={day.date} className="heatmap-day">
              <div
                className={`activity-square ${getActivityLevel(day.count)} ${
                  isToday(day.date) ? "today" : ""
                }`}
                title={`${day.date}: ${day.count}개 일지`}
              >
                {day.count > 0 && (
                  <span className="activity-count">{day.count}</span>
                )}
              </div>
              <span className="day-label">{getDayName(day.date)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 연속 기록 팁 */}
      <div className="streak-tips">
        <div className="tips-header">
          <span className="tips-icon">💡</span>
          <h5>연속 기록 유지 팁</h5>
        </div>
        <div className="tips-content">
          {streak.currentStreak === 0 ? (
            <ul>
              <li>매일 같은 시간에 일지 작성하기</li>
              <li>작은 것부터 시작하여 습관 만들기</li>
              <li>알림 설정으로 잊지 않기</li>
            </ul>
          ) : streak.currentStreak < 7 ? (
            <ul>
              <li>지금까지 잘하고 있어요! 계속 이어가세요</li>
              <li>바쁜 날에는 간단한 메모라도 작성해보세요</li>
              <li>일지 작성을 일상의 루틴으로 만들어보세요</li>
            </ul>
          ) : (
            <ul>
              <li>훌륭한 습관을 만들어가고 있어요!</li>
              <li>가끔 쉬어가는 것도 괜찮습니다</li>
              <li>질보다 양보다 꾸준함이 중요해요</li>
            </ul>
          )}
        </div>
      </div>

      {/* 다음 목표 */}
      {streak.currentStreak > 0 && (
        <div className="next-milestone">
          <div className="milestone-header">
            <span className="milestone-icon">🎯</span>
            <h5>다음 목표</h5>
          </div>
          <div className="milestone-content">
            {streak.currentStreak < 7 ? (
              <div className="milestone-item">
                <span className="milestone-target">7일 연속 달성</span>
                <div className="milestone-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(streak.currentStreak / 7) * 100}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {7 - streak.currentStreak}일 남음
                  </span>
                </div>
              </div>
            ) : streak.currentStreak < 30 ? (
              <div className="milestone-item">
                <span className="milestone-target">30일 연속 달성</span>
                <div className="milestone-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(streak.currentStreak / 30) * 100}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {30 - streak.currentStreak}일 남음
                  </span>
                </div>
              </div>
            ) : (
              <div className="milestone-item">
                <span className="milestone-target">100일 연속 도전!</span>
                <div className="milestone-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min((streak.currentStreak / 100) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="progress-text">
                    {streak.currentStreak >= 100
                      ? "목표 달성!"
                      : `${100 - streak.currentStreak}일 남음`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
