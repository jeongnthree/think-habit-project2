import React, { useEffect, useState } from "react";
import {
  InAppNotification,
  notificationService,
} from "../../services/NotificationService";
import "./NotificationCenter.css";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    // 알림 서비스 구독
    const unsubscribe = notificationService.subscribe(setNotifications);

    // 초기 알림 로드
    setNotifications(notificationService.getNotifications());

    return unsubscribe;
  }, []);

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") {
      return !notification.read;
    }
    return true;
  });

  const handleNotificationClick = (notification: InAppNotification) => {
    if (!notification.read) {
      notificationService.markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.location.hash = notification.actionUrl;
      onClose();
    }
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clearAllNotifications();
  };

  const getNotificationIcon = (type: InAppNotification["type"]) => {
    switch (type) {
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

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;

    return timestamp.toLocaleDateString("ko-KR");
  };

  if (!isOpen) return null;

  return (
    <div className="notification-center-overlay" onClick={onClose}>
      <div className="notification-center" onClick={(e) => e.stopPropagation()}>
        <div className="notification-header">
          <h3>알림</h3>
          <div className="notification-actions">
            <div className="filter-buttons">
              <button
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                전체
              </button>
              <button
                className={filter === "unread" ? "active" : ""}
                onClick={() => setFilter("unread")}
              >
                읽지 않음
              </button>
            </div>
            <div className="action-buttons">
              <button onClick={handleMarkAllRead} className="mark-read-btn">
                모두 읽음
              </button>
              <button onClick={handleClearAll} className="clear-btn">
                모두 삭제
              </button>
              <button onClick={onClose} className="close-btn">
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="notification-list">
          {filteredNotifications.length === 0 ? (
            <div className="empty-notifications">
              <div className="empty-icon">🔔</div>
              <p>
                {filter === "unread"
                  ? "읽지 않은 알림이 없습니다"
                  : "알림이 없습니다"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${notification.type} ${
                  notification.read ? "read" : "unread"
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-title">
                    {notification.title}
                    {!notification.read && <span className="unread-dot"></span>}
                  </div>
                  <div className="notification-message">
                    {notification.message}
                  </div>
                  <div className="notification-time">
                    {formatTime(notification.timestamp)}
                  </div>
                  {notification.actionText && (
                    <div className="notification-action">
                      <span className="action-text">
                        {notification.actionText}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    notificationService.removeNotification(notification.id);
                  }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {filteredNotifications.length > 0 && (
          <div className="notification-footer">
            <span className="notification-count">
              {filteredNotifications.length}개의 알림
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
