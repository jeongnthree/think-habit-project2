import { Button } from '@/components/ui';
import { Comment } from '@/types/database';
import React, { useState } from 'react';

interface User {
  id: string;
  name: string;
  role: string;
}

interface CommentWithAuthor extends Comment {
  author?: User;
}

interface CommentSectionProps {
  comments: CommentWithAuthor[];
  journalId: string;
  currentUserId: string;
  onAddComment: (content: string, type: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  journalId,
  currentUserId,
  onAddComment,
  onDeleteComment,
}) => {
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<string>('encouragement');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      await onAddComment(newComment.trim(), commentType);
      setNewComment('');
    } catch (err) {
      setError('댓글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!onDeleteComment) return;

    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) return;

    try {
      await onDeleteComment(commentId);
    } catch (err) {
      setError('댓글 삭제에 실패했습니다.');
    }
  };

  return (
    <div className='mt-8'>
      <h2 className='text-xl font-semibold text-gray-900 mb-4'>댓글</h2>

      {/* 댓글 목록 */}
      {comments.length > 0 ? (
        <div className='space-y-4 mb-6'>
          {comments.map(comment => (
            <div key={comment.id} className='bg-gray-50 rounded-lg p-4'>
              <div className='flex justify-between items-start mb-2'>
                <div className='flex items-center'>
                  <div className='font-medium text-gray-900'>
                    {comment.author?.name || '알 수 없는 사용자'}
                  </div>
                  <span className='mx-2 text-gray-300'>•</span>
                  <div className='text-sm text-gray-500'>
                    {new Date(comment.created_at).toLocaleDateString()}
                    {new Date(comment.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      comment.comment_type === 'encouragement'
                        ? 'bg-green-100 text-green-800'
                        : comment.comment_type === 'advice'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {comment.comment_type === 'encouragement'
                      ? '격려'
                      : comment.comment_type === 'advice'
                        ? '조언'
                        : '질문'}
                  </span>

                  {comment.author_id === currentUserId && onDeleteComment && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className='text-red-600 hover:text-red-800 text-sm'
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
              <div className='text-gray-700'>{comment.content}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-8 bg-gray-50 rounded-lg mb-6'>
          <p className='text-gray-500'>아직 댓글이 없습니다.</p>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className='mb-4 bg-red-50 border border-red-200 rounded-md p-3'>
          <div className='text-red-700 text-sm'>{error}</div>
        </div>
      )}

      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            댓글 작성
          </label>
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder='댓글을 작성해주세요...'
            rows={3}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            disabled={submitting}
          />
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <label className='flex items-center'>
              <input
                type='radio'
                name='commentType'
                value='encouragement'
                checked={commentType === 'encouragement'}
                onChange={() => setCommentType('encouragement')}
                className='mr-2'
              />
              <span className='text-sm'>격려</span>
            </label>
            <label className='flex items-center'>
              <input
                type='radio'
                name='commentType'
                value='advice'
                checked={commentType === 'advice'}
                onChange={() => setCommentType('advice')}
                className='mr-2'
              />
              <span className='text-sm'>조언</span>
            </label>
            <label className='flex items-center'>
              <input
                type='radio'
                name='commentType'
                value='question'
                checked={commentType === 'question'}
                onChange={() => setCommentType('question')}
                className='mr-2'
              />
              <span className='text-sm'>질문</span>
            </label>
          </div>

          <Button
            type='submit'
            disabled={!newComment.trim() || submitting}
            loading={submitting}
          >
            댓글 작성
          </Button>
        </div>
      </form>
    </div>
  );
};
