import React from "react";
import "./CompletionChart.css";

interface CompletionData {
  category: string;
  completed: number;
  total: number;
  color: string;
}

interface CompletionChartProps {
  data: CompletionData[];
  title?: string;
  showPercentage?: boolean;
}

const CompletionChart: React.FC<CompletionChartProps> = ({
  data,
  title = "완료율 현황",
  showPercentage = true,
}) => {
  const getCompletionRate = (completed: number, total: number) => {
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getProgressBarWidth = (completed: number, total: number) => {
    return getCompletionRate(completed, total);
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 80) return "#10b981"; // green
    if (rate >= 60) return "#f59e0b"; // yellow
    if (rate >= 40) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  const getStatusText = (rate: number) => {
    if (rate >= 80) return "우수";
    if (rate >= 60) return "양호";
    if (rate >= 40) return "보통";
    return "개선필요";
  };

  const totalCompleted = data.reduce((sum, item) => sum + item.completed, 0);
  const totalItems = data.reduce((sum, item) => sum + item.total, 0);
  const overallRate = getCompletionRate(totalCompleted, totalItems);

  return (
    <div className="completion-chart">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <div className="overall-rate">
          <span className="rate-value">{overallRate.toFixed(1)}%</span>
          <span
            className="rate-status"
            style={{ color: getStatusColor(overallRate) }}
          >
            {getStatusText(overallRate)}
          </span>
        </div>
      </div>

      <div className="completion-list">
        {data.map((item, index) => {
          const rate = getCompletionRate(item.completed, item.total);

          return (
            <div key={index} className="completion-item">
              <div className="item-header">
                <div className="item-info">
                  <span className="item-category">{item.category}</span>
                  <span className="item-count">
                    {item.completed}/{item.total}
                  </span>
                </div>
                {showPercentage && (
                  <span
                    className="item-percentage"
                    style={{ color: getStatusColor(rate) }}
                  >
                    {rate.toFixed(1)}%
                  </span>
                )}
              </div>

              <div className="progress-container">
                <div
                  className="progress-track"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <div
                    className="progress-bar"
                    style={{
                      width: `${getProgressBarWidth(item.completed, item.total)}%`,
                      backgroundColor: item.color,
                    }}
                  >
                    <div className="progress-glow"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="chart-summary">
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">총 완료</span>
            <span className="summary-value">{totalCompleted}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">전체 목표</span>
            <span className="summary-value">{totalItems}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">평균 완료율</span>
            <span className="summary-value">{overallRate.toFixed(1)}%</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">활성 카테고리</span>
            <span className="summary-value">{data.length}</span>
          </div>
        </div>
      </div>

      {/* 도넛 차트 스타일의 전체 진행률 */}
      <div className="donut-chart">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={getStatusColor(overallRate)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(overallRate / 100) * 283} 283`}
            strokeDashoffset="70.75"
            transform="rotate(-90 60 60)"
            className="progress-circle"
          />
          <text x="60" y="55" textAnchor="middle" className="donut-percentage">
            {overallRate.toFixed(0)}%
          </text>
          <text x="60" y="70" textAnchor="middle" className="donut-label">
            완료율
          </text>
        </svg>
      </div>
    </div>
  );
};

export default CompletionChart;
