'use client';

import { Button, Card } from '@/components/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// 임시 사용자 ID (실제로는 인증에서 가져와야 함)
const CURRENT_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: string;
}

// 임시 알림 데이터
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'assignment',
    title: '새로운 카테고리 할당',
    message:
      '비판적 사고 카테고리가 할당되었습니다. 이제 해당 카테고리의 일지를 작성할 수 있습니다.',
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
  },
  {
    id: '2',
    type: 'comment',
    title: '새로운 댓글',
    message:
      '김선생님이 회원님의 "비판적 사고 훈련 - 뉴스 분석" 일지에 댓글을 남겼습니다.',
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
  {
    id: '4',
    type: 'assignment',
    title: '주간 목표 달성',
    message:
      '축하합니다! 이번 주 목표를 달성하셨습니다. 계속해서 좋은 습관을 유지해보세요.',
    is_read: true,
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2일 전
  },
  {
    id: '5',
    type: 'comment',
    title: '새로운 댓글',
    message: '박코치님이 회원님의 "창의적 문제 해결" 일지에 조언을 남겼습니다.',
    is_read: true,
    created_at: new Date(Date.now() - 259200000).toISOString(), // 3일 전
    related_id: 'journal3',
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 알림 목록 로드
  const loadNotifications = async () => {
    try {
      setLoading(true);
      // 실제로는 API 호출
      // const response = await fetch(`/api/notifications?userId=${CURRENT_USER_ID}`);
      // const data = await response.json();
      // if (data.success) {
      //   setNotifications(data.data);
      // }

      // 임시 데이터 사용
      setNotifications(mockNotifications);
    } catch (err) {
      setError('알림을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // 필터링된 알림 목록
  const filteredNotifications =
    filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

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
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
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
      //   body: JSON.stringify({ user_id: CURRENT_USER_ID }),
      // });

      // 임시 처리
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
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
      if (
        notification.type === 'comment' ||
        notification.type === 'encouragement'
      ) {
        window.location.href = `/training/journal/${notification.related_id}`;
      }
    }
  };

  // 알림 타입별 아이콘 및 색상
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'assignment':
        return {
          icon: '📋',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
        };
      case 'comment':
        return {
          icon: '💬',
          bgColor: 'bg-green-100',
          textColor: 'text-green-600',
        };
      case 'encouragement':
        return {
          icon: '👏',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-600',
        };
      default:
        return {
          icon: '🔔',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
        };
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
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* 헤더 */}
      <div className='mb-8'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>알림</h1>
            <p className='text-gray-600 mt-2'>
              {unreadCount > 0
                ? `${unreadCount}개의 읽지 않은 알림이 있습니다.`
                : '모든 알림을 확인했습니다.'}
            </p>
          </div>
          <Link href='/dashboard'>
            <Button variant='outline'>대시보드로</Button>
          </Link>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className='mb-6 bg-red-50 border border-red-200 rounded-md p-4'>
          <div className='text-red-700'>{error}</div>
        </div>
      )}

      {/* 필터 및 액션 */}
      <div className='mb-6 flex justify-between items-center'>
        <div className='flex space-x-2'>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체 ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            읽지 않음 ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant='outline' size='sm'>
            모두 읽음 처리
          </Button>
        )}
      </div>

      {/* 알림 목록 */}
      {filteredNotifications.length > 0 ? (
        <div className='space-y-4'>
          {filteredNotifications.map(notification => {
            const style = getNotificationStyle(notification.type);
            return (
              <Card
                key={notification.id}
                className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  !notification.is_read
                    ? 'border-l-4 border-l-blue-500 bg-blue-50'
                    : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className='flex items-start space-x-4'>
                  <div className={`p-2 rounded-full ${style.bgColor}`}>
                    <span className='text-lg'>{style.icon}</span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex justify-between items-start'>
                      <h3
                        className={`text-sm font-medium ${
                          !notification.is_read
                            ? 'text-gray-900'
                            : 'text-gray-700'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <div className='flex items-center space-x-2'>
                        <span className='text-xs text-gray-500'>
                          {formatTime(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <div className='w-2 h-2 bg-blue-600 rounded-full'></div>
                        )}
                      </div>
                    </div>
                    <p className='text-sm text-gray-600 mt-1'>
                      {notification.message}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className='text-center py-12'>
          <div className='text-gray-400 mb-4'>
            <svg
              className='w-16 h-16 mx-auto'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1}
                d='M15 17h5l-5 5v-5zM11 19H6.5A2.5 2.5 0 014 16.5v-9A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v3.5'
              />
            </svg>
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            {filter === 'unread'
              ? '읽지 않은 알림이 없습니다'
              : '알림이 없습니다'}
          </h3>
          <p className='text-gray-500'>
            {filter === 'unread'
              ? '모든 알림을 확인했습니다.'
              : '새로운 알림이 오면 여기에 표시됩니다.'}
          </p>
        </div>
      )}
    </div>
  );
}
