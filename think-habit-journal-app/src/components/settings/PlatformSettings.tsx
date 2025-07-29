import React, { useEffect, useState } from "react";
import { GroupManagementService } from "../../services/GroupManagementService";
import { MultiPlatformSyncService } from "../../services/MultiPlatformSyncService";
import "./PlatformSettings.css";

interface PlatformConfig {
  id: string;
  name: string;
  type: "think-habit" | "group";
  isEnabled: boolean;
  isConnected: boolean;
  lastSync?: Date;
  error?: string;
}

interface PlatformSettingsProps {
  syncService: MultiPlatformSyncService;
  groupService: GroupManagementService;
}

export const PlatformSettings: React.FC<PlatformSettingsProps> = ({
  syncService,
  groupService,
}) => {
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    Map<string, boolean>
  >(new Map());

  useEffect(() => {
    loadPlatforms();
    checkConnections();
  }, []);

  const loadPlatforms = async () => {
    try {
      setIsLoading(true);

      // 등록된 플랫폼 어댑터 조회
      const adapters = syncService.getRegisteredPlatforms();
      const joinedGroups = groupService.getJoinedGroups();

      const platformConfigs: PlatformConfig[] = adapters.map((adapter) => ({
        id: adapter.id,
        name: adapter.name,
        type: adapter.type,
        isEnabled: true, // TODO: 실제 설정에서 조회
        isConnected: false, // 연결 상태는 별도로 확인
        lastSync: undefined, // TODO: 마지막 동기화 시간 조회
      }));

      setPlatforms(platformConfigs);
    } catch (error) {
      console.error("Failed to load platforms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnections = async () => {
    try {
      const connections = await syncService.validatePlatformConnections();
      setConnectionStatus(connections);

      // 플랫폼 상태 업데이트
      setPlatforms((prev) =>
        prev.map((platform) => ({
          ...platform,
          isConnected: connections.get(platform.id) || false,
        })),
      );
    } catch (error) {
      console.error("Failed to check connections:", error);
    }
  };

  const handleTogglePlatform = async (platformId: string, enabled: boolean) => {
    try {
      // TODO: 플랫폼 활성화/비활성화 설정 저장
      setPlatforms((prev) =>
        prev.map((platform) =>
          platform.id === platformId
            ? { ...platform, isEnabled: enabled }
            : platform,
        ),
      );
    } catch (error) {
      console.error("Failed to toggle platform:", error);
    }
  };

  const handleRemovePlatform = async (platformId: string) => {
    if (!confirm("이 플랫폼 연동을 해제하시겠습니까?")) {
      return;
    }

    try {
      const platform = platforms.find((p) => p.id === platformId);
      if (platform?.type === "group") {
        // 그룹 탈퇴 처리
        await groupService.leaveGroup(platformId, {
          deleteData: false, // 사용자가 선택하도록 개선 필요
          exportData: false,
          reason: "User requested disconnection",
        });
      } else {
        // Think-Habit 플랫폼은 제거할 수 없음
        alert("Think-Habit 플랫폼은 제거할 수 없습니다.");
        return;
      }

      await loadPlatforms();
    } catch (error) {
      console.error("Failed to remove platform:", error);
      alert("플랫폼 제거에 실패했습니다.");
    }
  };

  const handleTestConnection = async (platformId: string) => {
    try {
      const adapter = syncService.getAdapter(platformId);
      if (adapter) {
        const isConnected = await adapter.validateConnection();

        setConnectionStatus(
          (prev) => new Map(prev.set(platformId, isConnected)),
        );
        setPlatforms((prev) =>
          prev.map((platform) =>
            platform.id === platformId
              ? { ...platform, isConnected }
              : platform,
          ),
        );

        if (isConnected) {
          alert("연결 테스트 성공!");
        } else {
          alert("연결 테스트 실패. 설정을 확인해주세요.");
        }
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      alert("연결 테스트 중 오류가 발생했습니다.");
    }
  };

  const handleGroupAdded = () => {
    setShowAddGroup(false);
    loadPlatforms();
  };

  if (isLoading) {
    return (
      <div className="platform-settings loading">
        <div className="loading-spinner"></div>
        <p>플랫폼 설정을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="platform-settings">
      <div className="settings-header">
        <h2>플랫폼 연동 설정</h2>
        <p>훈련 일지를 동기화할 플랫폼을 관리합니다.</p>
      </div>

      <div className="platforms-list">
        {platforms.map((platform) => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            onToggle={handleTogglePlatform}
            onRemove={handleRemovePlatform}
            onTestConnection={handleTestConnection}
          />
        ))}
      </div>

      <div className="add-platform-section">
        <button className="add-group-btn" onClick={() => setShowAddGroup(true)}>
          <span className="btn-icon">+</span>
          단체 연동 추가
        </button>
      </div>

      {showAddGroup && (
        <AddGroupModal
          groupService={groupService}
          onClose={() => setShowAddGroup(false)}
          onSuccess={handleGroupAdded}
        />
      )}
    </div>
  );
};

interface PlatformCardProps {
  platform: PlatformConfig;
  onToggle: (platformId: string, enabled: boolean) => void;
  onRemove: (platformId: string) => void;
  onTestConnection: (platformId: string) => void;
}

const PlatformCard: React.FC<PlatformCardProps> = ({
  platform,
  onToggle,
  onRemove,
  onTestConnection,
}) => {
  return (
    <div className={`platform-card ${platform.type}`}>
      <div className="platform-info">
        <div className="platform-header">
          <h3 className="platform-name">{platform.name}</h3>
          <div className="platform-badges">
            <span className={`platform-type ${platform.type}`}>
              {platform.type === "think-habit" ? "공식" : "단체"}
            </span>
            <span
              className={`connection-status ${platform.isConnected ? "connected" : "disconnected"}`}
            >
              {platform.isConnected ? "연결됨" : "연결 안됨"}
            </span>
          </div>
        </div>

        {platform.lastSync && (
          <p className="last-sync">
            마지막 동기화: {platform.lastSync.toLocaleString("ko-KR")}
          </p>
        )}

        {platform.error && <p className="platform-error">{platform.error}</p>}
      </div>

      <div className="platform-controls">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={platform.isEnabled}
            onChange={(e) => onToggle(platform.id, e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>

        <button
          className="test-connection-btn"
          onClick={() => onTestConnection(platform.id)}
          title="연결 테스트"
        >
          🔗
        </button>

        {platform.type === "group" && (
          <button
            className="remove-platform-btn"
            onClick={() => onRemove(platform.id)}
            title="연동 해제"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
};

interface AddGroupModalProps {
  groupService: GroupManagementService;
  onClose: () => void;
  onSuccess: () => void;
}

const AddGroupModal: React.FC<AddGroupModalProps> = ({
  groupService,
  onClose,
  onSuccess,
}) => {
  const [groupCode, setGroupCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupCode.trim()) {
      setError("그룹 코드를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await groupService.joinGroup(groupCode.trim());

      if (result.success) {
        alert(`${result.groupInfo?.name} 그룹에 성공적으로 가입했습니다!`);
        onSuccess();
      } else {
        setError(result.error || "그룹 가입에 실패했습니다.");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="add-group-modal">
        <div className="modal-header">
          <h3>단체 연동 추가</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-group">
            <label htmlFor="groupCode">그룹 코드</label>
            <input
              id="groupCode"
              type="text"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              placeholder="GROUP-ABC123"
              className="group-code-input"
              disabled={isLoading}
            />
            <p className="form-help">
              단체 관리자로부터 받은 그룹 코드를 입력하세요.
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              취소
            </button>
            <button type="submit" className="join-btn" disabled={isLoading}>
              {isLoading ? "가입 중..." : "가입하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
