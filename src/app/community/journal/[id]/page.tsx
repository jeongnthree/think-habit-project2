'use client';

import {
  CommentSection,
  CommentWithAuthor,
} from '@/components/community/CommentSection';
import { EncouragementButton } from '@/components/community/EncouragementButton';
import { Button, Card } from '@/components/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface JournalDetail {
  id: string;
  student_id: string;
  category_id: string;
  title: string;
  content: string;
  attachments: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
    description?: string;
  };
  author: {
    id: string;
    full_name: string;
  };
  comments: CommentWithAuthor[];
  comment_count: number;
  encouragement_count: number;
  user_has_encouraged: boolean;
}

export default function CommunityJournalDetailPage() {
  const [journal, setJournal] = useState<JournalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const params = useParams();
  const router = useRouter();
  const journalId = params?.id as string;

  // 일지 정보 로드
  const loadJournal = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/community/journals/${journalId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch journal');
      }

      if (data.success) {
        setJournal(data.data);
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Error loading journal:', err);
      setError(
        err instanceof Error ? err.message : '일지를 불러오는데 실패했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 현재 사용자 ID 가져오기
  const getCurrentUserId = async () => {
    try {
      // 실제 인증 API 호출로 현재 사용자 정보 가져오기
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.user?.id || null);
      }
    } catch (err) {
      console.error('Error getting current user:', err);
      setCurrentUserId(null);
    }
  };

  useEffect(() => {
    getCurrentUserId();
    loadJournal();
  }, [journalId]);

  // 댓글 작성 처리
  const handleAddComment = async (content: string, type: string) => {
    try {
      const response = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journal_id: journalId,
          content,
          comment_type: type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create comment');
      }

      if (data.success) {
        // 댓글 목록에 새 댓글 추가
        setJournal(prev =>
          prev
            ? {
                ...prev,
                comments: [...prev.comments, data.data],
                comment_count: prev.comment_count + 1,
              }
            : null
        );
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      throw new Error(
        err instanceof Error ? err.message : '댓글 작성에 실패했습니다.'
      );
    }
  };

  // 댓글 삭제 처리 (본인 댓글만)
  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete comment');
      }

      if (data.success) {
        // 댓글 목록에서 삭제된 댓글 제거
        setJournal(prev =>
          prev
            ? {
                ...prev,
                comments: prev.comments.filter(c => c.id !== commentId),
                comment_count: prev.comment_count - 1,
              }
            : null
        );
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      throw new Error(
        err instanceof Error ? err.message : '댓글 삭제에 실패했습니다.'
      );
    }
  };

  // 격려 처리
  const handleEncourage = async () => {
    try {
      const response = await fetch('/api/community/encouragements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journal_id: journalId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle encouragement');
      }

      if (data.success) {
        // 격려 상태 업데이트
        setJournal(prev =>
          prev
            ? {
                ...prev,
                encouragement_count: data.data.encouragement_count,
                user_has_encouraged: data.data.is_encouraged,
              }
            : null
        );
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Error encouraging journal:', err);
      throw new Error(
        err instanceof Error ? err.message : '격려 처리에 실패했습니다.'
      );
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error || !journal) {
    return (
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-red-50 border border-red-200 rounded-md p-4'>
          <div className='text-red-700'>
            {error || '일지를 찾을 수 없습니다.'}
          </div>
        </div>
        <div className='mt-4'>
          <button
            onClick={() => router.push('/community')}
            className='text-blue-600 hover:text-blue-800'
          >
            ← 커뮤니티로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 공개 일지가 아닌 경우 접근 제한
  if (!journal.is_public) {
    return (
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4'>
          <div className='text-yellow-700'>
            이 일지는 비공개로 설정되어 있습니다.
          </div>
        </div>
        <div className='mt-4'>
          <button
            onClick={() => router.push('/community')}
            className='text-blue-600 hover:text-blue-800'
          >
            ← 커뮤니티로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8'>
      {/* 헤더 */}
      <div className='mb-4 sm:mb-6'>
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0'>
          <Link
            href='/community'
            className='text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors duration-200'
            aria-label='커뮤니티 페이지로 돌아가기'
          >
            ← 커뮤니티로
          </Link>
          <div className='flex items-center space-x-2'>
            <span
              className='px-2 py-1 text-xs rounded-full bg-green-100 text-green-800'
              aria-label='공개 일지'
            >
              공개
            </span>
            {currentUserId && currentUserId !== journal.student_id && (
              <div className='flex items-center space-x-1'>
                <button
                  className='text-xs text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded px-1 py-0.5 transition-colors duration-200'
                  aria-label='일지 신고하기'
                >
                  신고
                </button>
                <button
                  className='text-xs text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded px-1 py-0.5 transition-colors duration-200'
                  aria-label='사용자 차단하기'
                >
                  차단
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 일지 내용 */}
      <Card className='mb-6 sm:mb-8 p-4 sm:p-6'>
        <article className='mb-6'>
          <header className='mb-4 sm:mb-6'>
            <h1 className='text-xl sm:text-2xl font-bold text-gray-900 mb-3'>
              {journal.title}
            </h1>
            <div className='flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500'>
              <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium'>
                {journal.category.name}
              </span>
              <span className='hidden sm:inline' aria-hidden='true'>
                •
              </span>
              <span className='font-medium text-gray-700'>
                {journal.author.full_name || '알 수 없는 사용자'}
              </span>
              <span className='hidden sm:inline' aria-hidden='true'>
                •
              </span>
              <time
                dateTime={journal.created_at}
                className='text-xs sm:text-sm'
              >
                {new Date(journal.created_at).toLocaleDateString()}{' '}
                <span className='hidden sm:inline'>
                  {new Date(journal.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </time>
              {journal.updated_at !== journal.created_at && (
                <span className='text-xs text-gray-400'>(수정됨)</span>
              )}
            </div>
          </header>

          <div className='prose prose-sm sm:prose max-w-none'>
            <div className='whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-gray-700'>
              {journal.content}
            </div>
          </div>

          {journal.attachments && journal.attachments.length > 0 && (
            <div className='mt-6 border-t pt-4'>
              <h3 className='text-sm font-medium text-gray-900 mb-2'>
                첨부파일 ({journal.attachments.length}개)
              </h3>
              <div className='space-y-2'>
                {journal.attachments.map((filename, index) => (
                  <div
                    key={index}
                    className='flex items-center p-2 border rounded hover:bg-gray-50 transition-colors duration-200'
                  >
                    <svg
                      className='w-4 h-4 mr-2 text-gray-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      aria-hidden='true'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
                      />
                    </svg>
                    <span className='text-sm'>{filename}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </Card>

      {/* 격려 버튼 */}
      <div className='mb-6 sm:mb-8 text-center'>
        <div className='flex flex-col sm:flex-row justify-center gap-3 sm:gap-4'>
          <EncouragementButton
            journalId={journalId}
            currentUserId={currentUserId || ''}
            encouragementCount={journal.encouragement_count}
            hasUserEncouraged={journal.user_has_encouraged}
            onEncourage={handleEncourage}
            disabled={!currentUserId}
            size='md'
          />
          <Button
            variant='outline'
            className='flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200'
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('링크가 복사되었습니다!');
            }}
            aria-label='일지 링크 공유하기'
          >
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z'
              />
            </svg>
            <span>공유하기</span>
          </Button>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <CommentSection
        comments={journal.comments}
        journalId={journalId}
        currentUserId={currentUserId || ''}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
      />
    </div>
  );
}
