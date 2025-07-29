import React from "react";
import "./MotivationalMessage.css";

interface StreakInfo {
  current: number;
  best: number;
  lastEntry?: Date;
}

interface Stats {
  totalJournals: number;
  todayJournals: number;
  weeklyGoal: number;
  completedWeeklyGoal: boolean;
  averageCompletionRate: number;
}

interface MotivationalMessageProps {
  message: string;
  streak: StreakInfo;
  stats: Stats;
}

export const MotivationalMessage: React.FC<MotivationalMessageProps> = ({
  message,
  streak,
  stats,
}) => {
  const getMessageType = () => {
    if (streak.current >= 7) return "celebration";
    if (stats.completedWeeklyGoal) return "achievement";
    if (stats.todayJournals > 0) return "encouragement";
    return "motivation";
  };

  const getIcon = () => {
    const type = getMessageType();
    switch (type) {
      case "celebration":
        return "🎉";
      case "achievement":
        return "🏆";
      case "encouragement":
        return "💪";
      default:
        return "✨";
    }
  };

  const messageType = getMessageType();

  return (
    <div className={`motivational-message ${messageType}`}>
      <div className="message-icon">{getIcon()}</div>
      <div className="message-content">
        <p className="message-text">{message}</p>
        {streak.current > 0 && (
          <div className="message-details">
            <span className="streak-info">{streak.current}일 연속 작성 중</span>
            {stats.completedWeeklyGoal && (
              <span className="goal-info">이번 주 목표 달성!</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
