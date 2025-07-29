import React, { useEffect, useState } from "react";
import {
  SyncResponse,
  WebsiteSyncService,
} from "../services/WebsiteSyncService";

interface SyncStatus {
  needsSync: boolean;
  pendingCount: number;
  lastSyncTime: string;
  isAutoSyncEnabled: boolean;
}

export const WebsiteSync: React.FC = () => {
  const [syncService] = useState(() => {
    try {
      return WebsiteSyncService.getInstance();
    } catch (error) {
      console.error("WebsiteSyncService 초기화 오류:", error);
      return null;
    }
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    needsSync: false,
    pendingCount: 0,
    lastSyncTime: "Never",
    isAutoSyncEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResponse | null>(
    null,
  );
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);

  // 컴포넌트 마운트 시 동기화 상태 확인
  useEffect(() => {
    checkSyncStatus();
  }, []);

  /**
   * 동기화 상태 확인
   */
  const checkSyncStatus = async () => {
    if (!syncService) {
      console.warn("SyncService가 초기화되지 않았습니다.");
      return;
    }

    try {
      const status = await syncService.checkSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error("Failed to check sync status:", error);
    }
  };

  /**
   * 수동 동기화 실행
   */
  const handleManualSync = async () => {
    console.log("🔄 수동 동기화 버튼 클릭됨");

    if (!syncService) {
      console.log("❌ SyncService가 초기화되지 않음");
      setLastSyncResult({
        success: false,
        error: "동기화 서비스가 초기화되지 않았습니다.",
      });
      return;
    }

    console.log("📤 동기화 시작...");
    setIsLoading(true);
    setLastSyncResult(null);

    try {
      console.log("📡 syncService.syncJournalsToWebsite() 호출");
      const result = await syncService.syncJournalsToWebsite();
      console.log("📥 동기화 서비스 응답:", result);

      setLastSyncResult(result);

      if (result.success) {
        console.log("✅ 동기화 성공, 상태 업데이트 중...");
        // 동기화 성공 후 상태 업데이트
        await checkSyncStatus();
      } else {
        console.log("❌ 동기화 실패:", result.error);
      }
    } catch (error) {
      console.log("💥 동기화 중 예외 발생:", error);
      console.error("Manual sync failed:", error);
      setLastSyncResult({
        success: false,
        error:
          "Sync failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      });
    } finally {
      console.log("🏁 동기화 프로세스 완료");
      setIsLoading(false);
    }
  };

  /**
   * 자동 동기화 토글
   */
  const handleAutoSyncToggle = async () => {
    try {
      if (autoSyncEnabled) {
        syncService.disableAutoSync();
        setAutoSyncEnabled(false);
      } else {
        await syncService.enableAutoSync(30); // 30분마다
        setAutoSyncEnabled(true);
      }
    } catch (error) {
      console.error("Failed to toggle auto sync:", error);
    }
  };

  /**
   * 동기화 결과 메시지 렌더링
   */
  const renderSyncResult = () => {
    if (!lastSyncResult) return null;

    const { success, message, summary, error } = lastSyncResult;

    if (success) {
      return (
        <div className="sync-result success">
          <div className="result-icon">✅</div>
          <div className="result-content">
            <div className="result-title">동기화 완료</div>
            <div className="result-message">{message}</div>
            {summary && (
              <div className="result-summary">
                총 {summary.total}개 중 {summary.success}개 성공,{" "}
                {summary.failed}개 실패
              </div>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className="sync-result error">
          <div className="result-icon">❌</div>
          <div className="result-content">
            <div className="result-title">동기화 실패</div>
            <div className="result-message">
              {error || "알 수 없는 오류가 발생했습니다."}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="website-sync">
      <div className="sync-header">
        <h3>웹사이트 동기화</h3>
        <p>공개 일지를 웹사이트 커뮤니티에 자동으로 공유합니다</p>
      </div>

      {/* 동기화 상태 */}
      <div className="sync-status">
        <div className="status-item">
          <span className="status-label">동기화 필요:</span>
          <span
            className={`status-value ${syncStatus.needsSync ? "needs-sync" : "up-to-date"}`}
          >
            {syncStatus.needsSync
              ? `${syncStatus.pendingCount}개 일지`
              : "최신 상태"}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">마지막 동기화:</span>
          <span className="status-value">{syncStatus.lastSyncTime}</span>
        </div>
      </div>

      {/* 동기화 컨트롤 */}
      <div className="sync-controls">
        <button
          className="sync-button manual"
          onClick={handleManualSync}
          disabled={isLoading || !syncStatus.needsSync}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner">⏳</span>
              동기화 중...
            </>
          ) : (
            <>
              <span className="sync-icon">🔄</span>
              지금 동기화
            </>
          )}
        </button>

        <button
          className={`sync-button auto ${autoSyncEnabled ? "enabled" : "disabled"}`}
          onClick={handleAutoSyncToggle}
        >
          <span className="auto-icon">{autoSyncEnabled ? "🔴" : "⚪"}</span>
          자동 동기화 {autoSyncEnabled ? "OFF" : "ON"}
        </button>

        <button
          className="sync-button refresh"
          onClick={checkSyncStatus}
          disabled={isLoading}
        >
          <span className="refresh-icon">🔄</span>
          상태 새로고침
        </button>
      </div>

      {/* 동기화 결과 */}
      {renderSyncResult()}

      {/* 도움말 */}
      <div className="sync-help">
        <details>
          <summary>동기화 도움말</summary>
          <div className="help-content">
            <ul>
              <li>
                <strong>수동 동기화:</strong> 공개로 설정된 일지만 웹사이트에
                업로드됩니다
              </li>
              <li>
                <strong>자동 동기화:</strong> 30분마다 자동으로 새로운 공개
                일지를 동기화합니다
              </li>
              <li>
                <strong>개인정보:</strong> 비공개 일지는 절대 웹사이트에
                업로드되지 않습니다
              </li>
              <li>
                <strong>수정사항:</strong> 일지를 수정하면 웹사이트에도 자동으로
                반영됩니다
              </li>
            </ul>
          </div>
        </details>
      </div>

      <style jsx>{`
        .website-sync {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          margin: 20px 0;
        }

        .sync-header {
          margin-bottom: 20px;
        }

        .sync-header h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 18px;
        }

        .sync-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .sync-status {
          background: white;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 15px;
          border: 1px solid #e1e5e9;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .status-item:last-child {
          margin-bottom: 0;
        }

        .status-label {
          font-weight: 500;
          color: #555;
        }

        .status-value {
          font-weight: 600;
        }

        .status-value.needs-sync {
          color: #e74c3c;
        }

        .status-value.up-to-date {
          color: #27ae60;
        }

        .sync-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .sync-button {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .sync-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .sync-button.manual {
          background: #3498db;
          color: white;
        }

        .sync-button.manual:hover:not(:disabled) {
          background: #2980b9;
        }

        .sync-button.auto.enabled {
          background: #e74c3c;
          color: white;
        }

        .sync-button.auto.disabled {
          background: #95a5a6;
          color: white;
        }

        .sync-button.auto:hover:not(:disabled) {
          opacity: 0.9;
        }

        .sync-button.refresh {
          background: #f8f9fa;
          color: #333;
          border: 1px solid #dee2e6;
        }

        .sync-button.refresh:hover:not(:disabled) {
          background: #e9ecef;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .sync-result {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 15px;
        }

        .sync-result.success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
        }

        .sync-result.error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
        }

        .result-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .result-content {
          flex: 1;
        }

        .result-title {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .result-message {
          color: #666;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .result-summary {
          color: #555;
          font-size: 13px;
        }

        .sync-help {
          margin-top: 20px;
        }

        .sync-help details {
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          padding: 15px;
        }

        .sync-help summary {
          cursor: pointer;
          font-weight: 500;
          color: #555;
        }

        .help-content {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e1e5e9;
        }

        .help-content ul {
          margin: 0;
          padding-left: 20px;
        }

        .help-content li {
          margin-bottom: 8px;
          color: #666;
          font-size: 14px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};
