import React from "react";
import "./QuickActions.css";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
  badge?: string | number;
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
  layout?: "grid" | "list";
}

const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  title = "빠른 작업",
  layout = "grid",
}) => {
  return (
    <div className="quick-actions">
      <div className="actions-header">
        <h3 className="actions-title">{title}</h3>
        <span className="actions-count">{actions.length}개 작업</span>
      </div>

      <div className={`actions-container ${layout}`}>
        {actions.map((action) => (
          <button
            key={action.id}
            className={`action-button ${action.disabled ? "disabled" : ""}`}
            onClick={action.onClick}
            disabled={action.disabled}
            style={{ "--action-color": action.color } as React.CSSProperties}
          >
            <div className="action-icon-container">
              <div className="action-icon">{action.icon}</div>
              {action.badge && (
                <div className="action-badge">{action.badge}</div>
              )}
            </div>

            <div className="action-content">
              <h4 className="action-title">{action.title}</h4>
              <p className="action-description">{action.description}</p>
            </div>

            <div className="action-arrow">→</div>

            <div className="action-hover-effect"></div>
          </button>
        ))}
      </div>

      {actions.length === 0 && (
        <div className="no-actions">
          <div className="no-actions-icon">📝</div>
          <p className="no-actions-text">사용 가능한 빠른 작업이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

// 기본 액션들을 생성하는 헬퍼 함수
export const createDefaultActions = (callbacks: {
  onNewStructuredJournal?: () => void;
  onNewPhotoJournal?: () => void;
  onViewJournals?: () => void;
  onViewStats?: () => void;
  onSettings?: () => void;
}): QuickAction[] => {
  return [
    {
      id: "new-structured",
      title: "구조화 일지 작성",
      description: "템플릿을 사용해 체계적으로 일지를 작성하세요",
      icon: "📝",
      color: "#667eea",
      onClick: callbacks.onNewStructuredJournal || (() => {}),
    },
    {
      id: "new-photo",
      title: "사진 일지 작성",
      description: "사진과 함께 간단한 일지를 작성하세요",
      icon: "📷",
      color: "#764ba2",
      onClick: callbacks.onNewPhotoJournal || (() => {}),
    },
    {
      id: "view-journals",
      title: "일지 목록 보기",
      description: "작성한 모든 일지를 확인하고 관리하세요",
      icon: "📚",
      color: "#f093fb",
      onClick: callbacks.onViewJournals || (() => {}),
    },
    {
      id: "view-stats",
      title: "통계 보기",
      description: "작성 현황과 진행률을 자세히 확인하세요",
      icon: "📊",
      color: "#4facfe",
      onClick: callbacks.onViewStats || (() => {}),
    },
    {
      id: "settings",
      title: "설정",
      description: "앱 설정을 변경하고 개인화하세요",
      icon: "⚙️",
      color: "#43e97b",
      onClick: callbacks.onSettings || (() => {}),
    },
  ];
};

export default QuickActions;
