import React from 'react';
import { GroupStats } from '../types';

interface StatsOverviewProps {
  stats: GroupStats;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const statItems = [
    {
      label: '총 일지 수',
      value: stats.totalJournals.toLocaleString(),
      icon: '📝',
      color: 'blue',
    },
    {
      label: '평균 점수',
      value: `${stats.averageScore.toFixed(1)}점`,
      icon: '⭐',
      color: 'yellow',
    },
    {
      label: '완료율',
      value: `${Math.round(stats.completionRate)}%`,
      icon: '✅',
      color: 'green',
    },
    {
      label: '오늘 활동',
      value: `${stats.activeToday}명`,
      icon: '👥',
      color: 'purple',
    },
    {
      label: '주간 성장',
      value: `${stats.weeklyGrowth > 0 ? '+' : ''}${stats.weeklyGrowth.toFixed(1)}%`,
      icon: stats.weeklyGrowth > 0 ? '📈' : '📉',
      color: stats.weeklyGrowth > 0 ? 'green' : 'red',
    },
    {
      label: '인기 카테고리',
      value: stats.topCategory,
      icon: '🏆',
      color: 'orange',
    },
  ];

  return (
    <div className='stats-overview'>
      <h3>그룹 통계</h3>
      <div className='stats-grid'>
        {statItems.map((item, index) => (
          <div key={index} className={`stat-item color-${item.color}`}>
            <div className='stat-icon'>{item.icon}</div>
            <div className='stat-content'>
              <div className='stat-value'>{item.value}</div>
              <div className='stat-label'>{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
