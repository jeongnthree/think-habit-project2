import React, { useEffect, useState } from "react";
import { notificationService } from "../../services/NotificationService";
import "./NotificationBell.css";

interface NotificationBellProps {
  onClick: () => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onClick,
  className = "",
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // 알림 서비스 구독
    const unsubscribe = notificationService.subscribe((notifications) => {
      const newUnreadCount = notifications.filter((n) => !n.read).length;

      // 새로운 알림이 있으면 애니메이션 트리거
      if (newUnreadCount > unreadCount) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);
      }

      setUnreadCount(newUnreadCount);
    });

    // 초기 읽지 않은 알림 개수 설정
    setUnreadCount(notificationService.getUnreadCount());

    return unsubscribe;
  }, [unreadCount]);

  return (
    <button
      className={`notification-bell ${className} ${isAnimating ? "animate" : ""}`}
      onClick={onClick}
      aria-label={`알림 ${unreadCount > 0 ? `(${unreadCount}개의 읽지 않은 알림)` : ""}`}
    >
      <div className="bell-icon">🔔</div>
      {unreadCount > 0 && (
        <div className="notification-badge">
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}
    </button>
  );
};
