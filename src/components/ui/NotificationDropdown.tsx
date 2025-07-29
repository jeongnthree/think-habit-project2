import React, { useEffect, useRef, useState } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: string;
}

interface NotificationDropdownProps {
  userId: string;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 알림 목록 로드
  const loadNotifications = async () => {
    try {
      setLoading(true);
      // 실제로는 API 호출
      // const response = await fetch(`/api/notifications?userId=${userId}&limit=10`);
      // const data = await response.json();
      // if (data.success) {
      //   setNotifications(data.data);
      //   setUnreadCount(data.data.filter((n: Notification) => !n.is_read).length);
      // }
      
      // 임시 데이터
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'assignment',
          title: '새로운 카테고리 할당',
          message: '비판적 사고 카테고리가 할당되었습니다.',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
        },
        {
          id: '2',
          type: 'comment',
          title: '새로운 댓글',
          message: '김선생님이 회원님의 일지에 댓글을 남겼습니다.',
          is_read: false,
          created_at: new Date(Date.now() - 7200000).toISOString(), // 2시간 전
          related_id: 'journal1',
        },
        {
          id: '3',
          type: 'encouragement',
          title: '격려 받음',
          message: '이영희님이 회원님의 일지에 격려를 보냈습니다.',
          is_read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1일 전
          related_id: 'journal2',
        },
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      // 실제로는 API 호출
      // await fetch(`/api/notifications/${notificationId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ is_read: true }),
      // });
      
      // 임시 처리
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      // 실제로는 API 호출
      // await fetch('/api/notifications/mark-all-read', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ user_id: userId }),
      // });
      
      // 임시 처리
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // 알림 클릭 처리
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // 관련 페이지로 이동
    if (notification.related_id) {
      if (notification.type === 'comment' || notification.type === 'encouragement') {
        window.location.href = `/training/journal/${notification.related_id}`;
      }
    }
    
    setIsOpen(false);
  };

  // 알림 타입별 아이콘
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return '📋';
      case 'comment':
        return '💬';
      case 'encouragement':
        return '👏';
      default:
        return '🔔';
    }
  };

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else {
      return `${diffDays}일 전`;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 알림 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6.5A2.5 2.5 0 014 16.5v-9A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v3.5" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          {/* 헤더 */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900">알림</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  모두 읽음
                </button>
              )}
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm font-medium ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-1"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-sm">새로운 알림이 없습니다</p>
              </div>
            )}
          </div>

          {/* 푸터 */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // 알림 전체 목록 페이지로 이동
                  window.location.href = '/notifications';
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
              >
                모든 알림 보기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};