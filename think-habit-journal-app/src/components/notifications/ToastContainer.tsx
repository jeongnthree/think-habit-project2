import React, { useEffect, useState } from "react";
import {
  InAppNotification,
  notificationService,
} from "../../services/NotificationService";
import "./ToastContainer.css";
import { ToastNotification } from "./ToastNotification";

interface ToastContainerProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  maxToasts?: number;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = "top-right",
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<InAppNotification[]>([]);

  useEffect(() => {
    // 알림 서비스 구독
    const unsubscribe = notificationService.subscribe((notifications) => {
      // 최근 알림 중에서 토스트로 표시할 것들만 필터링
      const recentNotifications = notifications
        .filter((n) => {
          const now = new Date();
          const notificationTime = n.timestamp;
          const timeDiff = now.getTime() - notificationTime.getTime();

          // 5초 이내의 새로운 알림만 토스트로 표시
          return timeDiff < 5000 && !n.read;
        })
        .slice(0, maxToasts);

      setToasts(recentNotifications);
    });

    return unsubscribe;
  }, [maxToasts]);

  const handleToastClose = (notificationId: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== notificationId));
    // 알림을 읽음으로 표시
    notificationService.markAsRead(notificationId);
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={`toast-container ${position}`}>
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          notification={toast}
          onClose={() => handleToastClose(toast.id)}
          duration={toast.persistent ? 0 : 5000}
        />
      ))}
    </div>
  );
};
