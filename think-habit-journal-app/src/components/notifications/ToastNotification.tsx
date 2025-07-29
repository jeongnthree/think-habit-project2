import React, { useEffect, useState } from "react";
import { InAppNotification } from "../../services/NotificationService";
import "./ToastNotification.css";

interface ToastNotificationProps {
  notification: InAppNotification;
  onClose: () => void;
  duration?: number;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onClose,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // 컴포넌트 마운트 시 애니메이션 시작
    const showTimer = setTimeout(() => setIsVisible(true), 100);

    // 자동 닫기 타이머 (persistent가 아닌 경우에만)
    let autoCloseTimer: NodeJS.Timeout;
    if (!notification.persistent && duration > 0) {
      autoCloseTimer = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      clearTimeout(showTimer);
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [duration, notification.persistent]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // 애니메이션 시간과 맞춤
  };

  const handleClick = () => {
    if (notification.actionUrl) {
      window.location.hash = notification.actionUrl;
      handleClose();
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  return (
    <div
      className={`toast-notification ${notification.type} ${
        isVisible ? "visible" : ""
      } ${isClosing ? "closing" : ""} ${
        notification.actionUrl ? "clickable" : ""
      }`}
      onClick={notification.actionUrl ? handleClick : undefined}
    >
      <div className="toast-icon">{getIcon()}</div>

      <div className="toast-content">
        <div className="toast-title">{notification.title}</div>
        <div className="toast-message">{notification.message}</div>
        {notification.actionText && (
          <div className="toast-action">
            <span className="action-text">{notification.actionText}</span>
          </div>
        )}
      </div>

      <button
        className="toast-close"
        onClick={handleClose}
        aria-label="알림 닫기"
      >
        ✕
      </button>

      {!notification.persistent && duration > 0 && (
        <div
          className="toast-progress"
          style={{
            animationDuration: `${duration}ms`,
          }}
        />
      )}
    </div>
  );
};
