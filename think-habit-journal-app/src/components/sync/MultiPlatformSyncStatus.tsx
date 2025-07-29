import React, { useState } from "react";
import {
  MultiPlatformJournal,
  PlatformSyncStatus,
} from "../../services/MultiPlatformSyncService";
import "./MultiPlatformSyncStatus.css";

interface MultiPlatformSyncStatusProps {
  journal: MultiPlatformJournal;
  onRetrySync?: (platformIds: string[]) => void;
  onViewPlatform?: (platformId: string, url: string) => void;
  compact?: boolean;
}

export const MultiPlatformSyncStatus: React.FC<
  MultiPlatformSyncStatusProps
> = ({ journal, onRetrySync, onViewPlatform, compact = false }) => {
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(
    new Set(),
  );

  const platformStatuses = Array.from(journal.platformStatus.entries());
  const totalPlatforms = platformStatuses.length;
  const syncedCount = platformStatuses.filter(
    ([_, status]) => status.status === "synced",
  ).length;
  const failedCount = platformStatuses.filter(
    ([_, status]) => status.status === "failed",
  ).length;
  const pendingCount = platformStatuses.filter(
    ([_, status]) => status.status === "pending",
  ).length;
  const syncingCount = platformStatuses.filter(
    ([_, status]) => status.status === "syncing",
  ).length;

  const overallStatus = getOverallStatus(
    syncedCount,
    failedCount,
    pendingCount,
    syncingCount,
    totalPlatforms,
  );

  const handleRetryFailed = () => {
    const failedPlatforms = platformStatuses
      .filter(([_, status]) => status.status === "failed")
      .map(([platformId, _]) => platformId);

    if (failedPlatforms.length > 0 && onRetrySync) {
      onRetrySync(failedPlatforms);
    }
  };

  const handleRetryPlatform = (platformId: string) => {
    if (onRetrySync) {
      onRetrySync([platformId]);
    }
  };

  const togglePlatformDetails = (platformId: string) => {
    const newExpanded = new Set(expandedPlatforms);
    if (newExpanded.has(platformId)) {
      newExpanded.delete(platformId);
    } else {
      newExpanded.add(platformId);
    }
    setExpandedPlatforms(newExpanded);
  };

  if (compact) {
    return (
      <div className="sync-status-compact">
        <div className={`overall-status ${overallStatus.type}`}>
          <span className="status-icon">{overallStatus.icon}</span>
          <span className="status-text">{overallStatus.text}</span>
          <span className="status-count">
            {syncedCount}/{totalPlatforms}
          </span>
        </div>
        {failedCount > 0 && (
          <button
            className="retry-btn-compact"
            onClick={handleRetryFailed}
            title="실패한 동기화 재시도"
          >
            🔄
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="multi-platform-sync-status">
      <div className="sync-header">
        <div className="sync-summary">
          <h4>동기화 상태</h4>
          <div className={`overall-badge ${overallStatus.type}`}>
            <span className="badge-icon">{overallStatus.icon}</span>
            <span className="badge-text">{overallStatus.text}</span>
          </div>
        </div>

        <div className="sync-stats">
          <div className="stat-item">
            <span className="stat-number">{syncedCount}</span>
            <span className="stat-label">완료</span>
          </div>
          {failedCount > 0 && (
            <div className="stat-item failed">
              <span className="stat-number">{failedCount}</span>
              <span className="stat-label">실패</span>
            </div>
          )}
          {pendingCount > 0 && (
            <div className="stat-item pending">
              <span className="stat-number">{pendingCount}</span>
              <span className="stat-label">대기</span>
            </div>
          )}
          {syncingCount > 0 && (
            <div className="stat-item syncing">
              <span className="stat-number">{syncingCount}</span>
              <span className="stat-label">진행중</span>
            </div>
          )}
        </div>

        {failedCount > 0 && (
          <button className="retry-all-btn" onClick={handleRetryFailed}>
            실패한 동기화 재시도
          </button>
        )}
      </div>

      <div className="platforms-list">
        {platformStatuses.map(([platformId, status]) => (
          <PlatformStatusCard
            key={platformId}
            platformId={platformId}
            status={status}
            isExpanded={expandedPlatforms.has(platformId)}
            onToggleExpand={() => togglePlatformDetails(platformId)}
            onRetry={() => handleRetryPlatform(platformId)}
            onViewPlatform={onViewPlatform}
          />
        ))}
      </div>
    </div>
  );
};

interface PlatformStatusCardProps {
  platformId: string;
  status: PlatformSyncStatus;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRetry: () => void;
  onViewPlatform?: (platformId: string, url: string) => void;
}

const PlatformStatusCard: React.FC<PlatformStatusCardProps> = ({
  platformId,
  status,
  isExpanded,
  onToggleExpand,
  onRetry,
  onViewPlatform,
}) => {
  const statusInfo = getStatusInfo(status.status);
  const platformName = getPlatformName(platformId);

  return (
    <div className={`platform-status-card ${status.status}`}>
      <div className="platform-header" onClick={onToggleExpand}>
        <div className="platform-info">
          <div className="platform-name">{platformName}</div>
          <div className={`status-badge ${status.status}`}>
            <span className="status-icon">{statusInfo.icon}</span>
            <span className="status-text">{statusInfo.text}</span>
          </div>
        </div>

        <div className="platform-actions">
          {status.status === "synced" && status.platformUrl && (
            <button
              className="view-btn"
              onClick={(e) => {
                e.stopPropagation();
                onViewPlatform?.(platformId, status.platformUrl!);
              }}
              title="플랫폼에서 보기"
            >
              🔗
            </button>
          )}

          {status.status === "failed" && (
            <button
              className="retry-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              title="재시도"
            >
              🔄
            </button>
          )}

          <button
            className={`expand-btn ${isExpanded ? "expanded" : ""}`}
            title={isExpanded ? "접기" : "자세히"}
          >
            ▼
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="platform-details">
          <div className="detail-grid">
            {status.lastAttempt && (
              <div className="detail-item">
                <span className="detail-label">마지막 시도:</span>
                <span className="detail-value">
                  {status.lastAttempt.toLocaleString("ko-KR")}
                </span>
              </div>
            )}

            {status.lastSuccess && (
              <div className="detail-item">
                <span className="detail-label">마지막 성공:</span>
                <span className="detail-value">
                  {status.lastSuccess.toLocaleString("ko-KR")}
                </span>
              </div>
            )}

            {status.retryCount > 0 && (
              <div className="detail-item">
                <span className="detail-label">재시도 횟수:</span>
                <span className="detail-value">{status.retryCount}회</span>
              </div>
            )}

            {status.platformJournalId && (
              <div className="detail-item">
                <span className="detail-label">플랫폼 ID:</span>
                <span className="detail-value">{status.platformJournalId}</span>
              </div>
            )}
          </div>

          {status.error && (
            <div className="error-details">
              <div className="error-header">
                <span className="error-icon">⚠️</span>
                <span className="error-title">오류 정보</span>
              </div>
              <div className="error-message">{status.error.message}</div>
              {status.error.suggestions &&
                status.error.suggestions.length > 0 && (
                  <div className="error-suggestions">
                    <div className="suggestions-title">해결 방법:</div>
                    <ul>
                      {status.error.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper functions
function getOverallStatus(
  synced: number,
  failed: number,
  pending: number,
  syncing: number,
  total: number,
) {
  if (syncing > 0) {
    return { type: "syncing", icon: "🔄", text: "동기화 중" };
  }
  if (failed > 0) {
    return { type: "failed", icon: "❌", text: "일부 실패" };
  }
  if (pending > 0) {
    return { type: "pending", icon: "⏳", text: "대기 중" };
  }
  if (synced === total) {
    return { type: "synced", icon: "✅", text: "모두 완료" };
  }
  return { type: "unknown", icon: "❓", text: "알 수 없음" };
}

function getStatusInfo(status: string) {
  switch (status) {
    case "synced":
      return { icon: "✅", text: "완료" };
    case "syncing":
      return { icon: "🔄", text: "진행중" };
    case "failed":
      return { icon: "❌", text: "실패" };
    case "pending":
      return { icon: "⏳", text: "대기" };
    default:
      return { icon: "❓", text: "알 수 없음" };
  }
}

function getPlatformName(platformId: string): string {
  // 실제 구현에서는 플랫폼 설정에서 이름을 조회
  switch (platformId) {
    case "think-habit":
      return "Think-Habit";
    default:
      return platformId;
  }
}
