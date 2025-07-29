import React from "react";
import "./ActivityChart.css";

interface ActivityData {
  date: string;
  count: number;
  type: "structured" | "photo" | "mixed";
}

interface ActivityChartProps {
  data: ActivityData[];
  period: "week" | "month" | "year";
  onPeriodChange?: (period: "week" | "month" | "year") => void;
}

const ActivityChart: React.FC<ActivityChartProps> = ({
  data,
  period,
  onPeriodChange,
}) => {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getBarHeight = (count: number) => {
    return (count / maxCount) * 100;
  };

  const getBarColor = (type: string, count: number) => {
    const opacity = count === 0 ? 0.1 : 0.7 + (count / maxCount) * 0.3;

    switch (type) {
      case "structured":
        return `rgba(102, 126, 234, ${opacity})`;
      case "photo":
        return `rgba(118, 75, 162, ${opacity})`;
      case "mixed":
        return `rgba(253, 203, 110, ${opacity})`;
      default:
        return `rgba(156, 163, 175, ${opacity})`;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (period) {
      case "week":
        return date.toLocaleDateString("ko-KR", { weekday: "short" });
      case "month":
        return date.getDate().toString();
      case "year":
        return date.toLocaleDateString("ko-KR", { month: "short" });
      default:
        return dateStr;
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "week":
        return "주간 활동";
      case "month":
        return "월간 활동";
      case "year":
        return "연간 활동";
      default:
        return "활동 현황";
    }
  };

  return (
    <div className="activity-chart">
      <div className="chart-header">
        <h3 className="chart-title">{getPeriodLabel()}</h3>
        {onPeriodChange && (
          <div className="period-selector">
            <button
              className={`period-btn ${period === "week" ? "active" : ""}`}
              onClick={() => onPeriodChange("week")}
            >
              주간
            </button>
            <button
              className={`period-btn ${period === "month" ? "active" : ""}`}
              onClick={() => onPeriodChange("month")}
            >
              월간
            </button>
            <button
              className={`period-btn ${period === "year" ? "active" : ""}`}
              onClick={() => onPeriodChange("year")}
            >
              연간
            </button>
          </div>
        )}
      </div>

      <div className="chart-container">
        <div className="chart-grid">
          {data.map((item, index) => (
            <div key={index} className="chart-bar-container">
              <div
                className="chart-bar"
                style={{
                  height: `${getBarHeight(item.count)}%`,
                  backgroundColor: getBarColor(item.type, item.count),
                }}
                title={`${item.date}: ${item.count}개 작성`}
              >
                {item.count > 0 && (
                  <span className="bar-value">{item.count}</span>
                )}
              </div>
              <div className="chart-label">{formatDate(item.date)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color structured"></div>
          <span>구조화 일지</span>
        </div>
        <div className="legend-item">
          <div className="legend-color photo"></div>
          <span>사진 일지</span>
        </div>
        <div className="legend-item">
          <div className="legend-color mixed"></div>
          <span>혼합</span>
        </div>
      </div>

      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">총 작성</span>
          <span className="summary-value">
            {data.reduce((sum, item) => sum + item.count, 0)}개
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">평균</span>
          <span className="summary-value">
            {(
              data.reduce((sum, item) => sum + item.count, 0) / data.length
            ).toFixed(1)}
            개
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">최고</span>
          <span className="summary-value">{maxCount}개</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityChart;
