import React, { useEffect, useState } from "react";
import {
  ErrorHandlingService,
  PlatformError,
} from "../../services/ErrorHandlingService";
import { ErrorReportingService } from "../../services/ErrorReportingService";
import "./ErrorManagementPanel.css";
import { ErrorResolutionDialog } from "./ErrorResolutionDialog";
import { HealthMonitoringDashboard } from "./HealthMonitoringDashboard";

interface ErrorManagementPanelProps {
  errorHandlingService: ErrorHandlingService;
  errorReportingService: ErrorReportingService;
}

export const ErrorManagementPanel: React.FC<ErrorManagementPanelProps> = ({
  errorHandlingService,
  errorReportingService,
}) => {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "errors" | "analytics"
  >("dashboard");
  const [selectedError, setSelectedError] = useState<PlatformError | null>(
    null,
  );
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [unresolvedErrors, setUnresolvedErrors] = useState<PlatformError[]>([]);

  useEffect(() => {
    loadUnresolvedErrors();

    // 주기적으로 오류 목록 업데이트
    const interval = setInterval(loadUnresolvedErrors, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnresolvedErrors = () => {
    const errors = errorHandlingService.getUnresolvedErrors();
    setUnresolvedErrors(errors);
  };

  const handleErrorSelect = (error: PlatformError) => {
    setSelectedError(error);
    setShowResolutionDialog(true);
  };

  const handleErrorResolved = () => {
    setShowResolutionDialog(false);
    setSelectedError(null);
    loadUnresolvedErrors();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "#dc2626";
      case "high":
        return "#ea580c";
      case "medium":
        return "#d97706";
      case "low":
        return "#059669";
      default:
        return "#6b7280";
    }
  };

  const formatTimeAgo = (date: Date) => {
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
    <div className="error-management-panel">
      <div className="panel-header">
        <h2>오류 관리 시스템</h2>
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            대시보드
          </button>
          <button
            className={`tab-button ${activeTab === "errors" ? "active" : ""}`}
            onClick={() => setActiveTab("errors")}
          >
            오류 목록 ({unresolvedErrors.length})
          </button>
          <button
            className={`tab-button ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            분석
          </button>
        </div>
      </div>

      <div className="panel-content">
        {activeTab === "dashboard" && (
          <HealthMonitoringDashboard
            errorHandlingService={errorHandlingService}
          />
        )}

        {activeTab === "errors" && (
          <div className="errors-tab">
            <div className="errors-header">
              <h3>미해결 오류</h3>
              <button className="refresh-button" onClick={loadUnresolvedErrors}>
                새로고침
              </button>
            </div>

            {unresolvedErrors.length === 0 ? (
              <div className="no-errors">
                <div className="no-errors-icon">✅</div>
                <h4>모든 오류가 해결되었습니다!</h4>
                <p>현재 처리해야 할 오류가 없습니다.</p>
              </div>
            ) : (
              <div className="errors-list">
                {unresolvedErrors.map((error) => (
                  <div key={error.id} className="error-card">
                    <div className="error-card-header">
                      <div className="error-platform">{error.platformName}</div>
                      <div
                        className="error-severity"
                        style={{ color: getSeverityColor(error.severity) }}
                      >
                        {error.severity.toUpperCase()}
                      </div>
                      <div className="error-time">
                        {formatTimeAgo(error.timestamp)}
                      </div>
                    </div>

                    <div className="error-card-body">
                      <h4>{error.userFriendlyMessage}</h4>
                      <p className="error-category">
                        카테고리: {error.category}
                      </p>

                      {error.suggestions.length > 0 && (
                        <div className="error-suggestions">
                          <strong>권장 해결 방법:</strong>
                          <ul>
                            {error.suggestions
                              .slice(0, 2)
                              .map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="error-card-actions">
                      <button
                        className="resolve-button"
                        onClick={() => handleErrorSelect(error)}
                      >
                        해결하기
                      </button>
                      <button
                        className="dismiss-button"
                        onClick={() => {
                          errorHandlingService.resolveError(error.id);
                          loadUnresolvedErrors();
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
        )}

        {activeTab === "analytics" && (
          <div className="analytics-tab">
            <div className="analytics-summary">
              <div className="summary-card">
                <h4>총 오류 수</h4>
                <div className="summary-value">{unresolvedErrors.length}</div>
              </div>
              <div className="summary-card">
                <h4>심각한 오류</h4>
                <div className="summary-value critical">
                  {
                    unresolvedErrors.filter((e) => e.severity === "critical")
                      .length
                  }
                </div>
              </div>
              <div className="summary-card">
                <h4>높은 우선순위</h4>
                <div className="summary-value high">
                  {unresolvedErrors.filter((e) => e.severity === "high").length}
                </div>
              </div>
              <div className="summary-card">
                <h4>자동 해결 가능</h4>
                <div className="summary-value auto">
                  {
                    unresolvedErrors.filter(
                      (e) =>
                        e.recoveryActions.includes("retry") ||
                        e.recoveryActions.includes("wait_and_retry"),
                    ).length
                  }
                </div>
              </div>
            </div>

            <div className="analytics-charts">
              <div className="chart-section">
                <h4>카테고리별 오류 분포</h4>
                <div className="category-chart">
                  {Object.entries(
                    unresolvedErrors.reduce(
                      (acc, error) => {
                        acc[error.category] = (acc[error.category] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>,
                    ),
                  ).map(([category, count]) => (
                    <div key={category} className="category-bar">
                      <span className="category-label">{category}</span>
                      <div className="category-bar-container">
                        <div
                          className="category-bar-fill"
                          style={{
                            width: `${(count / unresolvedErrors.length) * 100}%`,
                          }}
                        />
                        <span className="category-count">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-section">
                <h4>플랫폼별 오류 현황</h4>
                <div className="platform-chart">
                  {Object.entries(
                    unresolvedErrors.reduce(
                      (acc, error) => {
                        acc[error.platformName] =
                          (acc[error.platformName] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>,
                    ),
                  ).map(([platform, count]) => (
                    <div key={platform} className="platform-item">
                      <span className="platform-name">{platform}</span>
                      <span className="platform-count">{count}개 오류</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showResolutionDialog && selectedError && (
        <ErrorResolutionDialog
          error={selectedError}
          isOpen={showResolutionDialog}
          onClose={() => setShowResolutionDialog(false)}
          onResolved={handleErrorResolved}
          errorHandlingService={errorHandlingService}
        />
      )}
    </div>
  );
};
