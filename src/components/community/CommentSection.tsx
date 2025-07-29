'use client';

import { Button } from '@/components/ui';
import { useState } from 'react';

export interface CommentWithAuthor {
  id: string;
  journal_id: string;
  author_id: string;
  content: string;
  comment_type: 'comment' | 'encouragement' | 'advice' | 'question';
  created_at: string;
  updated_at?: string;
  author?: {
    id: string;
    full_name: string;
    role: string;
  };
}

interface CommentSectionProps {
  comments: CommentWithAuthor[];
  journalId: string;
  currentUserId: string;
  onAddComment: (content: string, type: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  initialDisplayCount?: number;
}

export function CommentSection({
  comments,
  journalId,
  currentUserId,
  onAddComment,
  onDeleteComment,
  initialDisplayCount = 5,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<
    'comment' | 'encouragement' | 'advice' | 'question'
  >('comment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(initialDisplayCount);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      setError('댓글 내용을 입력해주세요.');
      return;
    }

    if (newComment.length > 500) {
      setError('댓글은 500자 이하로 작성해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAddComment(newComment.trim(), commentType);
      setNewComment('');
      setCommentType('comment');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '댓글 작성에 실패했습니다.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await onDeleteComment(commentId);
    } catch (err) {
      alert(err instanceof Error ? err.message : '댓글 삭제에 실패했습니다.');
    }
  };

  const getCommentTypeLabel = (type: string) => {
    switch (type) {
      case 'comment':
        return '댓글';
      case 'encouragement':
        return '격려';
      case 'advice':
        return '조언';
      case 'question':
        return '질문';
      default:
        return '댓글';
    }
  };

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'comment':
        return 'bg-gray-100 text-gray-800';
      case 'encouragement':
        return 'bg-green-100 text-green-800';
      case 'advice':
        return 'bg-blue-100 text-blue-800';
      case 'question':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'teacher':
        return '선생님';
      case 'admin':
        return '관리자';
      case 'coach':
        return '코치';
      default:
        return '학습자';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher':
        return 'text-blue-600 font-medium';
      case 'admin':
        return 'text-purple-600 font-medium';
      case 'coach':
        return 'text-green-600 font-medium';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <section
      className='bg-white rounded-lg border p-4 sm:p-6'
      aria-labelledby='comments-heading'
    >
      <h3
        id='comments-heading'
        className='text-base sm:text-lg font-semibold text-gray-900 mb-4'
      >
        댓글 ({comments.length})
      </h3>

      {/* 댓글 목록 */}
      <div className='space-y-4 mb-6' role='list' aria-label='댓글 목록'>
        {comments.length > 0 ? (
          <>
            {comments.slice(0, displayCount).map(comment => (
              <article
                key={comment.id}
                className='border-b border-gray-100 pb-4 last:border-b-0'
                role='listitem'
              >
                <header className='flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2 sm:gap-0'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span
                      className={`text-sm font-medium ${getRoleColor(comment.author?.role || 'student')}`}
                    >
                      {comment.author?.full_name || '알 수 없는 사용자'}
                    </span>
                    <span className='text-xs text-gray-400'>
                      ({getRoleLabel(comment.author?.role || 'student')})
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getCommentTypeColor(comment.comment_type)}`}
                      aria-label={`댓글 유형: ${getCommentTypeLabel(comment.comment_type)}`}
                    >
                      {getCommentTypeLabel(comment.comment_type)}
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <time
                      dateTime={comment.created_at}
                      className='text-xs text-gray-500'
                    >
                      {new Date(comment.created_at).toLocaleDateString()}{' '}
                      <span className='hidden sm:inline'>
                        {new Date(comment.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </time>
                    {comment.author_id === currentUserId ? (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className='text-xs text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded px-1 py-0.5 transition-colors duration-200'
                        aria-label='댓글 삭제'
                      >
                        삭제
                      </button>
                    ) : (
                      <div className='flex items-center space-x-1'>
                        <button
                          className='text-xs text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded px-1 py-0.5 transition-colors duration-200'
                          aria-label='댓글 신고'
                        >
                          신고
                        </button>
                        <button
                          className='text-xs text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded px-1 py-0.5 transition-colors duration-200'
                          aria-label='사용자 차단'
                        >
                          차단
                        </button>
                      </div>
                    )}
                  </div>
                </header>
                <p className='text-gray-700 whitespace-pre-wrap leading-relaxed text-sm sm:text-base'>
                  {comment.content}
                </p>
                {comment.updated_at &&
                  comment.updated_at !== comment.created_at && (
                    <p className='text-xs text-gray-400 mt-1'>(수정됨)</p>
                  )}
              </article>
            ))}

            {/* 더 많은 댓글 보기 버튼 */}
            {comments.length > displayCount && (
              <div className='text-center pt-4'>
                <Button
                  variant='outline'
                  onClick={() => setDisplayCount(prev => prev + 5)}
                  className='text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto'
                  aria-label={`댓글 더 보기. ${comments.length - displayCount}개 남음`}
                >
                  댓글 더 보기 ({comments.length - displayCount}개 남음)
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className='text-center py-6 sm:py-8 text-gray-500'>
            <svg
              className='w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-300'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1}
                d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
              />
            </svg>
            <p className='text-sm sm:text-base font-medium mb-1'>
              아직 댓글이 없습니다
            </p>
            <p className='text-xs sm:text-sm'>첫 번째 댓글을 작성해보세요!</p>
          </div>
        )}
      </div>

      {/* 댓글 작성 폼 */}
      <form
        onSubmit={handleSubmitComment}
        className='space-y-4'
        aria-labelledby='comment-form-heading'
      >
        <h4 id='comment-form-heading' className='sr-only'>
          댓글 작성 폼
        </h4>

        <div>
          <label
            htmlFor='comment-type'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            댓글 유형
          </label>
          <select
            id='comment-type'
            value={commentType}
            onChange={e => setCommentType(e.target.value as any)}
            className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200'
            disabled={isSubmitting}
            aria-describedby='comment-type-help'
          >
            <option value='comment'>댓글</option>
            <option value='encouragement'>격려</option>
            <option value='advice'>조언</option>
            <option value='question'>질문</option>
          </select>
          <p id='comment-type-help' className='sr-only'>
            댓글의 유형을 선택해주세요. 일반 댓글, 격려, 조언, 질문 중에서
            선택할 수 있습니다.
          </p>
        </div>

        <div>
          <label
            htmlFor='comment-content'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            댓글 내용
          </label>
          <textarea
            id='comment-content'
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder='댓글을 작성해주세요...'
            rows={3}
            className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none transition-all duration-200'
            disabled={isSubmitting}
            aria-describedby='comment-content-help comment-length-counter'
            aria-invalid={newComment.length > 500}
          />
          <div className='flex justify-between items-center mt-1'>
            <p id='comment-content-help' className='sr-only'>
              댓글 내용을 입력해주세요. 최대 500자까지 작성할 수 있습니다.
            </p>
            <span
              id='comment-length-counter'
              className={`text-xs ${newComment.length > 500 ? 'text-red-500' : 'text-gray-500'}`}
              aria-live='polite'
            >
              {newComment.length}/500자
            </span>
          </div>
        </div>

        {error && (
          <div
            className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3'
            role='alert'
            aria-live='polite'
          >
            {error}
          </div>
        )}

        <div className='flex justify-end'>
          <Button
            type='submit'
            disabled={
              isSubmitting || !newComment.trim() || newComment.length > 500
            }
            className='px-6 py-2 min-w-[100px] w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            aria-describedby={isSubmitting ? 'submit-status' : undefined}
          >
            {isSubmitting ? (
              <div className='flex items-center justify-center space-x-2'>
                <div
                  className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'
                  aria-hidden='true'
                ></div>
                <span id='submit-status'>작성 중...</span>
              </div>
            ) : (
              '댓글 작성'
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
