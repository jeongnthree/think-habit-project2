import React, { useEffect } from 'react';
import { Notification } from '../types';

interface NotificationContainerProps {
  notifications: (Notification & { id: string })[];
  onRemove: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
}) => {
  // 자동 제거 타이머
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          onRemove(notification.id);
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, onRemove]);

  if (notifications.length === 0) return null;

  return (
    <div className='notification-container'>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification & { id: string };
  onRemove: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRemove,
}) => {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`notification-item type-${notification.type}`}>
      <div className='notification-icon'>{getIcon(notification.type)}</div>

      <div className='notification-content'>
        <div className='notification-title'>{notification.title}</div>
        <div className='notification-message'>{notification.message}</div>

        {notification.actions && notification.actions.length > 0 && (
          <div className='notification-actions'>
            {notification.actions.map((action, index) => (
              <button
                key={index}
                className={`notification-action ${action.style || 'secondary'}`}
                onClick={action.action}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        className='notification-close'
        onClick={onRemove}
        aria-label='알림 닫기'
      >
        ×
      </button>
    </div>
  );
};
