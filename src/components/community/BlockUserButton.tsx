'use client';

import { Shield, UserX } from 'lucide-react';
import { useState } from 'react';

interface BlockUserButtonProps {
  userId: string;
  userName: string;
  isAdmin?: boolean;
  className?: string;
  onBlockSuccess?: () => void;
}

export default function BlockUserButton({
  userId,
  userName,
  isAdmin = false,
  className = '',
  onBlockSuccess,
}: BlockUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAdmin && !reason.trim()) {
      alert('관리자 차단 시 사유를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/community/blocked-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blocked_user_id: userId,
          reason: reason.trim() || null,
          is_admin_action: isAdmin,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsBlocked(true);
        setIsOpen(false);
        alert(data.message);
        onBlockSuccess?.();
      } else {
        alert(data.error || '사용자 차단 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Block user error:', error);
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBlocked) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 ${className}`}
      >
        <UserX className='w-3 h-3' />
        차단됨
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors ${className}`}
        title={isAdmin ? '사용자 차단 (관리자)' : '사용자 차단'}
      >
        {isAdmin ? (
          <Shield className='w-3 h-3' />
        ) : (
          <UserX className='w-3 h-3' />
        )}
        차단
      </button>

      {isOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
            <div className='flex items-center gap-2 mb-4'>
              <UserX className='w-5 h-5 text-red-500' />
              <h3 className='text-lg font-semibold'>
                {isAdmin ? '사용자 차단 (관리자)' : '사용자 차단'}
              </h3>
            </div>

            <div className='mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
              <p className='text-sm text-yellow-800'>
                <strong>{userName}</strong>님을 차단하시겠습니까?
              </p>
              <p className='text-xs text-yellow-700 mt-1'>
                {isAdmin
                  ? '관리자 차단 시 해당 사용자의 모든 활동이 제한됩니다.'
                  : '차단된 사용자의 댓글과 게시물이 보이지 않습니다.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  차단 사유 {isAdmin && '*'}
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={
                    isAdmin
                      ? '관리자 차단 사유를 입력해주세요...'
                      : '차단 사유를 입력해주세요 (선택사항)...'
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  rows={3}
                  maxLength={500}
                  required={isAdmin}
                />
                <div className='text-xs text-gray-500 mt-1'>
                  {reason.length}/500자
                </div>
              </div>

              <div className='flex gap-3 pt-4'>
                <button
                  type='button'
                  onClick={() => setIsOpen(false)}
                  className='flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  type='submit'
                  disabled={isSubmitting || (isAdmin && !reason.trim())}
                  className='flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors'
                >
                  {isSubmitting ? '차단 중...' : '차단하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
