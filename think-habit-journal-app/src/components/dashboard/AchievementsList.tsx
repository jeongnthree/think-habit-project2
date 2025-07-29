import React from "react";
import "./AchievementsList.css";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  category: "streak" | "quantity" | "quality" | "milestone";
}

interface AchievementsListProps {
  achievements: Achievement[];
  showOnlyUnlocked?: boolean;
  maxDisplay?: number;
}

const AchievementsList: React.FC<AchievementsListProps> = ({
  achievements,
  showOnlyUnlocked = false,
  maxDisplay = 6,
}) => {
  const filteredAchievements = showOnlyUnlocked
    ? achievements.filter((a) => a.unlockedAt)
    : achievements;

  const displayAchievements = filteredAchievements.slice(0, maxDisplay);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "#6b7280";
      case "rare":
        return "#3b82f6";
      case "epic":
        return "#8b5cf6";
      case "legendary":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "일반";
      case "rare":
        return "희귀";
      case "epic":
        return "영웅";
      case "legendary":
        return "전설";
      default:
        return "일반";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "streak":
        return "🔥";
      case "quantity":
        return "📊";
      case "quality":
        return "⭐";
      case "milestone":
        return "🏆";
      default:
        return "🎯";
    }
  };

  const getProgressPercentage = (achievement: Achievement) => {
    if (!achievement.progress || !achievement.maxProgress) return 100;
    return (achievement.progress / achievement.maxProgress) * 100;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="achievements-list">
      <div className="achievements-header">
        <h3 className="achievements-title">
          {showOnlyUnlocked ? "획득한 업적" : "업적 목록"}
        </h3>
        <div className="achievements-count">
          {achievements.filter((a) => a.unlockedAt).length} /{" "}
          {achievements.length}
        </div>
      </div>

      <div className="achievements-grid">
        {displayAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`achievement-card ${achievement.unlockedAt ? "unlocked" : "locked"} ${achievement.rarity}`}
          >
            <div className="achievement-icon-container">
              <div className="achievement-icon">
                {achievement.icon || getCategoryIcon(achievement.category)}
              </div>
              {achievement.unlockedAt && <div className="unlock-badge">✓</div>}
            </div>

            <div className="achievement-content">
              <div className="achievement-header">
                <h4 className="achievement-name">{achievement.title}</h4>
                <span
                  className="achievement-rarity"
                  style={{ color: getRarityColor(achievement.rarity) }}
                >
                  {getRarityLabel(achievement.rarity)}
                </span>
              </div>

              <p className="achievement-description">
                {achievement.description}
              </p>

              {achievement.progress !== undefined &&
                achievement.maxProgress &&
                !achievement.unlockedAt && (
                  <div className="achievement-progress">
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${getProgressPercentage(achievement)}%`,
                          backgroundColor: getRarityColor(achievement.rarity),
                        }}
                      />
                    </div>
                    <div className="progress-text">
                      {achievement.progress} / {achievement.maxProgress}
                    </div>
                  </div>
                )}

              {achievement.unlockedAt && (
                <div className="unlock-date">
                  {formatDate(achievement.unlockedAt)} 획득
                </div>
              )}
            </div>

            <div
              className="achievement-glow"
              style={{
                background: `radial-gradient(circle, ${getRarityColor(achievement.rarity)}20 0%, transparent 70%)`,
              }}
            />
          </div>
        ))}
      </div>

      {filteredAchievements.length > maxDisplay && (
        <div className="achievements-footer">
          <button className="view-all-btn">
            모든 업적 보기 (+{filteredAchievements.length - maxDisplay})
          </button>
        </div>
      )}

      <div className="achievements-stats">
        <div className="stat-item">
          <span className="stat-label">획득률</span>
          <span className="stat-value">
            {(
              (achievements.filter((a) => a.unlockedAt).length /
                achievements.length) *
              100
            ).toFixed(1)}
            %
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">최근 획득</span>
          <span className="stat-value">
            {achievements
              .filter((a) => a.unlockedAt)
              .sort(
                (a, b) =>
                  (b.unlockedAt?.getTime() || 0) -
                  (a.unlockedAt?.getTime() || 0),
              )[0]?.title || "없음"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AchievementsList;
