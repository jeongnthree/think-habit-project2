import React, { useEffect, useState } from "react";
import {
  ErrorAnalyticsReport,
  ErrorHandlingService,
  ErrorSeverity,
  HealthMetrics,
  PlatformError,
} from "../../services/ErrorHandlingService";
import "./HealthMonitoringDashboard.css";

interface HealthMonitoringDashboardProps {
  errorHandlingService: ErrorHandlingService;
}

export const HealthMonitoringDashboard: React.FC<
  HealthMonitoringDashboardProps
> = ({ errorHandlingService }) => {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics[]>([]);
  const [analyticsReport, setAnalyticsReport] =
    useState<ErrorAnalyticsReport | null>(null);
  const [unresolvedErrors, setUnresolvedErrors] = useState<PlatformError[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "1h" | "24h" | "7d" | "30d"
  >("24h");
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

  useEffect(() => {
    loadDashboardData();

    // 자동 새로고침 설정
    const interval = setInterval(loadDashboardData, 30000); // 30초마다
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedTimeRange]);

  const loadDashboardData = () => {
    // 건강 메트릭 로드
    const metrics = errorHandlingService.getAllHealthMetrics();
    setHealthMetrics(metrics);

    // 미해결 오류 로드
    const errors = errorHandlingService.getUnresolvedErrors();
    setUnresolvedErrors(errors);

    // 분석 리포트 생성
    const timeRange = getTimeRange(selectedTimeRange);
    const report = errorHandlingService.generateAnalyticsReport(timeRange);
    setAnalyticsReport(report);
  };

  const getTimeRange = (range: string) => {
    const now = new Date();
    const start = new Date();

    switch (range) {
      case "1h":
        start.setHours(now.getHours() - 1);
        break;
      case "24h":
        start.setDate(now.getDate() - 1);
        break;
      case "7d":
        start.setDate(now.getDate() - 7);
        break;
      case "30d":
        start.setDate(now.getDate() - 30);
        break;
    }

    return { start, end: now };
  };

  const getStatusColor = (status: HealthMetrics["status"]) => {
    switch (status) {
      case "healthy":
        return "#10b981";
      case "degraded":
        return "#f59e0b";
      case "unhealthy":
        return "#ef4444";
      case "offline":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status: HealthMetrics["status"]) => {
    switch (status) {
      case "healthy":
        return "✅";
      case "degraded":
        return "⚠️";
      case "unhealthy":
        return "❌";
      case "offline":
        return "⚫";
      default:
        return "❓";
    }
  };

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return "#10b981";
      case ErrorSeverity.MEDIUM:
        return "#f59e0b";
      case ErrorSeverity.HIGH:
        return "#f97316";
      case ErrorSeverity.CRITICAL:
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(1)}%`;
  };

  const formatResponseTime = (time: number) => {
    return `${time.toFixed(0)}ms`;
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return "없음";

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return "방금 전";
  };

  return (
    <div className="health-monitoring-dashboard">
      <div className="dashboard-header">
        <h2>시스템 건강 모니터링</h2>
        <div className="dashboard-controls">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="time-range-selector"
          >
            <option value="1h">최근 1시간</option>
            <option value="24h">최근 24시간</option>
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
          </select>
          <button onClick={loadDashboardData} className="refresh-button">
            새로고침
          </button>
        </div>
      </div>

      {/* 전체 상태 요약 */}
      <div className="status-summary">
        <div className="summary-card">
          <h3>전체 플랫폼</h3>
          <div className="summary-value">{healthMetrics.length}</div>
        </div>
        <div className="summary-card">
          <h3>정상 상태</h3>
          <div className="summary-value healthy">
            {healthMetrics.filter((m) => m.status === "healthy").length}
          </div>
        </div>
        <div className="summary-card">
          <h3>문제 발생</h3>
          <div className="summary-value warning">
            {healthMetrics.filter((m) => m.status !== "healthy").length}
          </div>
        </div>
        <div className="summary-card">
          <h3>미해결 오류</h3>
          <div className="summary-value error">{unresolvedErrors.length}</div>
        </div>
      </div>

      {/* 플랫폼별 건강 상태 */}
      <div className="platform-health-section">
        <h3>플랫폼별 상태</h3>
        <div className="platform-health-grid">
          {healthMetrics.map((metrics) => (
            <div key={metrics.platformId} className="platform-health-card">
              <div className="platform-header">
                <h4>{metrics.platformName}</h4>
                <div
                  className="status-indicator"
                  style={{ color: getStatusColor(metrics.status) }}
                >
                  {getStatusIcon(metrics.status)} {metrics.status}
                </div>
              </div>

              <div className="platform-metrics">
                <div className="metric">
                  <span className="metric-label">가동률</span>
                  <span className="metric-value">
                    {formatUptime(metrics.uptime)}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">응답 시간</span>
                  <span className="metric-value">
                    {formatResponseTime(metrics.averageResponseTime)}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">오류율</span>
                  <span className="metric-value">
                    {(metrics.errorRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">마지막 동기화</span>
                  <span className="metric-value">
                    {formatTimeAgo(metrics.lastSuccessfulSync)}
                  </span>
                </div>
              </div>

              {metrics.issues.length > 0 && (
                <div className="platform-issues">
                  <h5>현재 문제:</h5>
                  {metrics.issues.map((issue, index) => (
                    <div key={index} className="issue-item">
                      <span
                        className="issue-severity"
                        style={{ color: getSeverityColor(issue.severity) }}
                      >
                        {issue.severity}
                      </span>
                      <span className="issue-message">{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 오류 분석 차트 */}
      {analyticsReport && (
        <div className="analytics-section">
          <h3>오류 분석 ({selectedTimeRange})</h3>

          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>카테고리별 오류</h4>
              <div className="chart-container">
                {Object.entries(analyticsReport.errorsByCategory).map(
                  ([category, count]) => (
                    <div key={category} className="chart-bar">
                      <span className="bar-label">{category}</span>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${(count / analyticsReport.totalErrors) * 100}%`,
                          }}
                        />
                        <span className="bar-value">{count}</span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="analytics-card">
              <h4>심각도별 오류</h4>
              <div className="chart-container">
                {Object.entries(analyticsReport.errorsBySeverity).map(
                  ([severity, count]) => (
                    <div key={severity} className="chart-bar">
                      <span className="bar-label">{severity}</span>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${(count / analyticsReport.totalErrors) * 100}%`,
                            backgroundColor: getSeverityColor(
                              severity as ErrorSeverity,
                            ),
                          }}
                        />
                        <span className="bar-value">{count}</span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="analytics-card">
              <h4>플랫폼별 오류</h4>
              <div className="chart-container">
                {Object.entries(analyticsReport.errorsByPlatform).map(
                  ([platform, count]) => (
                    <div key={platform} className="chart-bar">
                      <span className="bar-label">{platform}</span>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${(count / analyticsReport.totalErrors) * 100}%`,
                          }}
                        />
                        <span className="bar-value">{count}</span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="analytics-card">
              <h4>해결 통계</h4>
              <div className="resolution-stats">
                <div className="stat-item">
                  <span className="stat-label">성공적 해결</span>
                  <span className="stat-value">
                    {analyticsReport.resolutionStats.successfulResolutions}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">수동 개입</span>
                  <span className="stat-value">
                    {analyticsReport.resolutionStats.manualInterventions}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">평균 해결 시간</span>
                  <span className="stat-value">
                    {analyticsReport.resolutionStats.averageResolutionTime}분
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 최근 오류 목록 */}
      <div className="recent-errors-section">
        <h3>미해결 오류 ({unresolvedErrors.length})</h3>
        {unresolvedErrors.length === 0 ? (
          <div className="no-errors">
            <p>✅ 현재 미해결 오류가 없습니다.</p>
          </div>
        ) : (
          <div className="errors-list">
            {unresolvedErrors.slice(0, 10).map((error) => (
              <div key={error.id} className="error-item">
                <div className="error-header">
                  <span className="error-platform">{error.platformName}</span>
                  <span
                    className="error-severity"
                    style={{ color: getSeverityColor(error.severity) }}
                  >
                    {error.severity}
                  </span>
                  <span className="error-time">
                    {formatTimeAgo(error.timestamp)}
                  </span>
                </div>
                <div className="error-message">{error.userFriendlyMessage}</div>
                <div className="error-actions">
                  <button
                    className="resolve-button"
                    onClick={() => {
                      // 오류 해결 다이얼로그 열기 로직
                      console.log("Open resolution dialog for:", error.id);
                    }}
                  >
                    해결하기
                  </button>
                  <button
                    className="dismiss-button"
                    onClick={() => {
                      errorHandlingService.resolveError(error.id);
                      loadDashboardData();
                    }}
                  >
                    무시
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 상위 오류 목록 */}
      {analyticsReport && analyticsReport.topErrors.length > 0 && (
        <div className="top-errors-section">
          <h3>빈발 오류 Top 5</h3>
          <div className="top-errors-list">
            {analyticsReport.topErrors.slice(0, 5).map((error, index) => (
              <div key={index} className="top-error-item">
                <div className="error-rank">#{index + 1}</div>
                <div className="error-details">
                  <div className="error-message">{error.message}</div>
                  <div className="error-stats">
                    <span className="error-count">{error.count}회 발생</span>
                    <span className="error-last">
                      마지막: {formatTimeAgo(error.lastOccurred)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
