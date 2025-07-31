'use client';

import { Unlock, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BlockedUser {
  id: string;
  user_id: string;
  blocked_user_id: string;
  reason?: string;
  is_active: boolean;
  created_at: string;
  blocked_user: { id: string; full_name: string };
  blocker?: { id: string; full_name: string };
}

export default function BlockedUsersPage() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/community/blocked-users?admin=true');
      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data.blocked_users);
      }
    } catch (error) {
      console.error('Failed to fetch blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockId: string) => {
    if (!confirm('정말로 차단을 해제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/community/blocked-users/${blockId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('차단이 해제되었습니다.');
        fetchBlockedUsers();
        setSelectedUser(null);
      } else {
        const data = await response.json();
        alert(data.error || '차단 해제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Unblock user error:', error);
      alert('네트워크 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            차단된 사용자 관리
          </h1>
          <p className='text-gray-600'>
            차단된 사용자 목록을 관리하고 차단을 해제할 수 있습니다.
          </p>
        </div>

        <div className='bg-white rounded-lg shadow-sm'>
          {loading ? (
            <div className='p-8 text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
              <p className='mt-2 text-gray-600'>로딩 중...</p>
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className='p-8 text-center text-gray-500'>
              차단된 사용자가 없습니다.
            </div>
          ) : (
            <div className='divide-y divide-gray-200'>
              {blockedUsers.map(blockedUser => (
                <div key={blockedUser.id} className='p-6 hover:bg-gray-50'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-2'>
                        <UserX className='w-4 h-4 text-red-500' />
                        <span className='font-medium text-gray-900'>
                          {blockedUser.blocked_user.full_name}
                        </span>
                        {blockedUser.blocker && (
                          <span className='px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full'>
                            관리자 차단
                          </span>
                        )}
                      </div>
                      <div className='text-sm text-gray-600 space-y-1'>
                        <p>차단 시간: {formatDate(blockedUser.created_at)}</p>
                        {blockedUser.blocker && (
                          <p>차단한 관리자: {blockedUser.blocker.full_name}</p>
                        )}
                        {blockedUser.reason && (
                          <p className='mt-2 p-2 bg-gray-100 rounded text-sm'>
                            차단 사유: {blockedUser.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => setSelectedUser(blockedUser)}
                        className='px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm'
                      >
                        상세보기
                      </button>
                      <button
                        onClick={() => handleUnblock(blockedUser.id)}
                        className='px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-sm flex items-center gap-1'
                      >
                        <Unlock className='w-3 h-3' />
                        차단 해제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 사용자 상세 모달 */}
        {selectedUser && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto'>
              <h3 className='text-lg font-semibold mb-4'>
                차단된 사용자 상세 정보
              </h3>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    사용자명
                  </label>
                  <p className='text-sm text-gray-900'>
                    {selectedUser.blocked_user.full_name}
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    차단 유형
                  </label>
                  <p className='text-sm text-gray-900'>
                    {selectedUser.blocker ? '관리자 차단' : '사용자 차단'}
                  </p>
                </div>

                {selectedUser.blocker && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      차단한 관리자
                    </label>
                    <p className='text-sm text-gray-900'>
                      {selectedUser.blocker.full_name}
                    </p>
                  </div>
                )}

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    차단 시간
                  </label>
                  <p className='text-sm text-gray-900'>
                    {formatDate(selectedUser.created_at)}
                  </p>
                </div>

                {selectedUser.reason && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      차단 사유
                    </label>
                    <p className='text-sm text-gray-900 p-3 bg-gray-50 rounded'>
                      {selectedUser.reason}
                    </p>
                  </div>
                )}

                <div className='flex gap-3 pt-4'>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className='flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md'
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => handleUnblock(selectedUser.id)}
                    className='px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md flex items-center gap-2'
                  >
                    <Unlock className='w-4 h-4' />
                    차단 해제
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
