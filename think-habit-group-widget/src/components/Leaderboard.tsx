import React from 'react';
import { Participant } from '../types';
import { formatNumber, getScoreColor, getStaggerDelay } from '../utils';

interface LeaderboardProps {
  participants: Participant[];
  maxParticipants?: number;
  theme: 'light' | 'dark';
  onEncourage?: (userId: string, userName: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  participants,
  maxParticipants = 5,
  theme,
  onEncourage,
}) => {
  const displayParticipants = participants.slice(0, maxParticipants);

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankClass = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'rank-gold';
      case 2:
        return 'rank-silver';
      case 3:
        return 'rank-bronze';
      default:
        return 'rank-default';
    }
  };

  return (
    <div className='leaderboard-section'>
      <div className='section-header'>
        <h4>🏆 상위 참가자</h4>
        <span className='participant-count'>
          {participants.length}명 참여 중
        </span>
      </div>

      <div className='leaderboard'>
        {displayParticipants.map((participant, index) => (
          <div
            key={participant.id}
            className={`participant-item ${getRankClass(participant.rank)}`}
            style={{
              animationDelay: `${getStaggerDelay(index, 50)}ms`,
            }}
          >
            <div className='participant-info'>
              <div className='rank-badge'>{getRankIcon(participant.rank)}</div>

              <div className='participant-details'>
                <div className='participant-name'>
                  {participant.name}
                  {participant.streak > 0 && (
                    <span className='streak-badge'>
                      🔥 {participant.streak}
                    </span>
                  )}
                </div>
                <div className='participant-stats'>
                  <span className='journal-count'>
                    📝 {participant.journalCount}개
                  </span>
                  <span className='last-active'>
                    {participant.lastActive.toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>

            <div className='participant-actions'>
              <div
                className='score'
                style={{ color: getScoreColor(participant.score) }}
              >
                {formatNumber(participant.score)}점
              </div>

              {onEncourage && (
                <button
                  className='encourage-btn'
                  onClick={() => onEncourage(participant.id, participant.name)}
                  title={`${participant.name}님에게 격려 메시지 보내기`}
                >
                  💪
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {participants.length > maxParticipants && (
        <div className='more-participants'>
          +{participants.length - maxParticipants}명 더 보기
        </div>
      )}

      <style>{`
        .leaderboard-section {
          margin-bottom: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .section-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: ${theme === 'dark' ? '#ffffff' : '#2d3748'};
        }

        .participant-count {
          font-size: 12px;
          color: ${theme === 'dark' ? '#a0aec0' : '#718096'};
          background: ${theme === 'dark' ? '#2d3748' : '#f7fafc'};
          padding: 2px 8px;
          border-radius: 12px;
        }

        .leaderboard {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .participant-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: ${theme === 'dark' ? '#2d3748' : '#ffffff'};
          border: 1px solid ${theme === 'dark' ? '#4a5568' : '#e2e8f0'};
          border-radius: 8px;
          transition: all 0.2s ease;
          animation: slideInUp 0.3s ease forwards;
          opacity: 0;
          transform: translateY(10px);
        }

        .participant-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px
            ${theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'};
        }

        .participant-item.rank-gold {
          border-color: #ffd700;
          background: ${
            theme === 'dark'
              ? 'rgba(255, 215, 0, 0.1)'
              : 'rgba(255, 215, 0, 0.05)'
          };
        }

        .participant-item.rank-silver {
          border-color: #c0c0c0;
          background: ${
            theme === 'dark'
              ? 'rgba(192, 192, 192, 0.1)'
              : 'rgba(192, 192, 192, 0.05)'
          };
        }

        .participant-item.rank-bronze {
          border-color: #cd7f32;
          background: ${
            theme === 'dark'
              ? 'rgba(205, 127, 50, 0.1)'
              : 'rgba(205, 127, 50, 0.05)'
          };
        }

        .participant-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .rank-badge {
          font-size: 16px;
          font-weight: 600;
          min-width: 32px;
          text-align: center;
        }

        .participant-details {
          flex: 1;
        }

        .participant-name {
          font-size: 14px;
          font-weight: 500;
          color: ${theme === 'dark' ? '#ffffff' : '#2d3748'};
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .streak-badge {
          font-size: 11px;
          background: linear-gradient(45deg, #ff6b6b, #ffa500);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
        }

        .participant-stats {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: ${theme === 'dark' ? '#a0aec0' : '#718096'};
        }

        .participant-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .score {
          font-size: 14px;
          font-weight: 600;
        }

        .encourage-btn {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
          opacity: 0.7;
        }

        .encourage-btn:hover {
          opacity: 1;
          transform: scale(1.1);
          background: ${theme === 'dark' ? '#4a5568' : '#f7fafc'};
        }

        .more-participants {
          text-align: center;
          padding: 8px;
          font-size: 12px;
          color: ${theme === 'dark' ? '#a0aec0' : '#718096'};
          cursor: pointer;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .more-participants:hover {
          background: ${theme === 'dark' ? '#2d3748' : '#f7fafc'};
        }

        @keyframes slideInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
