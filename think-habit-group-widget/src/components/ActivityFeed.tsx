import React from 'react';
import { Activity } from '../types';
import { formatTimeAgo, getActivityIcon, getStaggerDelay } from '../utils';

interface ActivityFeedProps {
  activities: Activity[];
  maxActivities?: number;
  theme: 'light' | 'dark';
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  maxActivities = 5,
  theme,
}) => {
  const displayActivities = activities.slice(0, maxActivities);

  const getActivityMessage = (activity: Activity): string => {
    switch (activity.type) {
      case 'journal_created':
        return `새로운 일지를 작성했습니다`;
      case 'achievement_earned':
        return `새로운 성취를 달성했습니다`;
      case 'streak_milestone':
        return `연속 작성 기록을 달성했습니다`;
      default:
        return activity.message;
    }
  };

  const getActivityColor = (type: Activity['type']): string => {
    switch (type) {
      case 'journal_created':
        return '#3b82f6';
      case 'achievement_earned':
        return '#f59e0b';
      case 'streak_milestone':
        return '#ef4444';
      default:
        return theme === 'dark' ? '#a0aec0' : '#718096';
    }
  };

  if (displayActivities.length === 0) {
    return (
      <div className='activity-feed-section'>
        <div className='section-header'>
          <h4>📋 최근 활동</h4>
        </div>
        <div className='empty-state'>
          <div className='empty-icon'>🌱</div>
          <p>아직 활동이 없습니다</p>
          <span>첫 번째 일지를 작성해보세요!</span>
        </div>

        <style>{`
          .activity-feed-section {
            margin-bottom: 20px;
          }

          .section-header h4 {
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            color: ${theme === 'dark' ? '#ffffff' : '#2d3748'};
          }

          .empty-state {
            text-align: center;
            padding: 32px 16px;
            color: ${theme === 'dark' ? '#a0aec0' : '#718096'};
          }

          .empty-icon {
            font-size: 32px;
            margin-bottom: 8px;
          }

          .empty-state p {
            margin: 0 0 4px 0;
            font-size: 14px;
            font-weight: 500;
          }

          .empty-state span {
            font-size: 12px;
            opacity: 0.8;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className='activity-feed-section'>
      <div className='section-header'>
        <h4>📋 최근 활동</h4>
        <span className='activity-count'>{activities.length}개 활동</span>
      </div>

      <div className='activity-feed'>
        {displayActivities.map((activity, index) => (
          <div
            key={activity.id}
            className='activity-item'
            style={{
              animationDelay: `${getStaggerDelay(index, 100)}ms`,
            }}
          >
            <div className='activity-timeline'>
              <div
                className='activity-dot'
                style={{ backgroundColor: getActivityColor(activity.type) }}
              >
                <span className='activity-icon'>
                  {getActivityIcon(activity.type)}
                </span>
              </div>
              {index < displayActivities.length - 1 && (
                <div className='timeline-line' />
              )}
            </div>

            <div className='activity-content'>
              <div className='activity-header'>
                <span className='user-name'>{activity.userName}</span>
                <span className='activity-time'>
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>

              <div className='activity-message'>
                {getActivityMessage(activity)}
              </div>

              {activity.data && (
                <div className='activity-data'>
                  {activity.type === 'streak_milestone' && (
                    <span className='streak-info'>
                      🔥 {activity.data.streak}일 연속
                    </span>
                  )}
                  {activity.type === 'achievement_earned' && (
                    <span className='achievement-info'>
                      🏆 {activity.data.achievementName}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {activities.length > maxActivities && (
        <div className='more-activities'>
          +{activities.length - maxActivities}개 더 보기
        </div>
      )}

      <style>{`
        .activity-feed-section {
          margin-bottom: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: ${theme === 'dark' ? '#ffffff' : '#2d3748'};
        }

        .activity-count {
          font-size: 12px;
          color: ${theme === 'dark' ? '#a0aec0' : '#718096'};
          background: ${theme === 'dark' ? '#2d3748' : '#f7fafc'};
          padding: 2px 8px;
          border-radius: 12px;
        }

        .activity-feed {
          position: relative;
        }

        .activity-item {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          animation: fadeInLeft 0.4s ease forwards;
          opacity: 0;
          transform: translateX(-10px);
        }

        .activity-timeline {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .activity-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .activity-icon {
          font-size: 14px;
        }

        .timeline-line {
          width: 2px;
          height: 24px;
          background: ${theme === 'dark' ? '#4a5568' : '#e2e8f0'};
          margin-top: 4px;
        }

        .activity-content {
          flex: 1;
          padding-top: 2px;
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .user-name {
          font-size: 13px;
          font-weight: 600;
          color: ${theme === 'dark' ? '#ffffff' : '#2d3748'};
        }

        .activity-time {
          font-size: 11px;
          color: ${theme === 'dark' ? '#a0aec0' : '#718096'};
        }

        .activity-message {
          font-size: 12px;
          color: ${theme === 'dark' ? '#e2e8f0' : '#4a5568'};
          line-height: 1.4;
          margin-bottom: 4px;
        }

        .activity-data {
          margin-top: 6px;
        }

        .streak-info,
        .achievement-info {
          display: inline-block;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 500;
        }

        .streak-info {
          background: linear-gradient(45deg, #ff6b6b, #ffa500);
          color: white;
        }

        .achievement-info {
          background: linear-gradient(45deg, #ffd700, #ffb347);
          color: #2d3748;
        }

        .more-activities {
          text-align: center;
          padding: 8px;
          font-size: 12px;
          color: ${theme === 'dark' ? '#a0aec0' : '#718096'};
          cursor: pointer;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .more-activities:hover {
          background: ${theme === 'dark' ? '#2d3748' : '#f7fafc'};
        }

        @keyframes fadeInLeft {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};
