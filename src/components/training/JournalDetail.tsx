'use client';

import { Card } from '@/components/ui';
import { JournalWithDetails } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Calendar,
  Camera,
  CheckCircle,
  Circle,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  User,
} from 'lucide-react';
import Image from 'next/image';

interface JournalDetailProps {
  journal: JournalWithDetails;
}

export function JournalDetail({ journal }: JournalDetailProps) {
  const getJournalTypeIcon = (type: string) => {
    switch (type) {
      case 'structured':
        return <FileText className='h-5 w-5' />;
      case 'photo':
        return <Camera className='h-5 w-5' />;
      default:
        return <FileText className='h-5 w-5' />;
    }
  };

  const getJournalTypeLabel = (type: string) => {
    switch (type) {
      case 'structured':
        return '구조화된 일지';
      case 'photo':
        return '사진 일지';
      default:
        return '일지';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Main Journal Card */}
      <Card className='p-8'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center gap-2 mb-4'>
            <div className='flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600'>
              {getJournalTypeIcon(journal.journal_type)}
              {getJournalTypeLabel(journal.journal_type)}
            </div>
            {journal.is_public ? (
              <div className='flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm'>
                <Eye className='h-4 w-4' />
                공개
              </div>
            ) : (
              <div className='flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm'>
                <EyeOff className='h-4 w-4' />
                비공개
              </div>
            )}
          </div>

          <h1 className='text-3xl font-bold text-gray-900 mb-4'>
            {journal.title}
          </h1>

          <div className='flex items-center gap-6 text-sm text-gray-500'>
            <div className='flex items-center gap-2'>
              <User className='h-4 w-4' />
              <span>{journal.category?.name || '카테고리 없음'}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              <span>
                {formatDistanceToNow(new Date(journal.created_at), {
                  addSuffix: true,
                  locale: ko,
                })}
              </span>
            </div>
            {journal.comments_count > 0 && (
              <div className='flex items-center gap-2'>
                <MessageCircle className='h-4 w-4' />
                <span>{journal.comments_count}개 댓글</span>
              </div>
            )}
          </div>
        </div>

        {/* Content based on journal type */}
        {journal.journal_type === 'structured' ? (
          <StructuredJournalContent journal={journal} />
        ) : journal.journal_type === 'photo' ? (
          <PhotoJournalContent journal={journal} />
        ) : (
          <DefaultJournalContent journal={journal} />
        )}

        {/* Footer */}
        <div className='mt-8 pt-6 border-t border-gray-200'>
          <div className='flex items-center justify-between text-sm text-gray-500'>
            <div>
              작성일:{' '}
              {new Date(journal.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            {journal.updated_at !== journal.created_at && (
              <div>
                수정일:{' '}
                {new Date(journal.updated_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Comments Section */}
      {(journal as any).comments && (journal as any).comments.length > 0 && (
        <Card className='p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            댓글 ({(journal as any).comments.length})
          </h3>
          <div className='space-y-4'>
            {(journal as any).comments.map((comment: any) => (
              <div
                key={comment.id}
                className='border-b border-gray-200 pb-4 last:border-b-0'
              >
                <div className='flex items-center gap-2 mb-2'>
                  <span className='font-medium text-gray-900'>
                    {comment.author?.full_name || '익명'}
                  </span>
                  <span className='text-sm text-gray-500'>
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                  {comment.comment_type && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        comment.comment_type === 'advice'
                          ? 'bg-blue-100 text-blue-700'
                          : comment.comment_type === 'encouragement'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {comment.comment_type === 'advice'
                        ? '조언'
                        : comment.comment_type === 'encouragement'
                          ? '격려'
                          : '질문'}
                    </span>
                  )}
                </div>
                <p className='text-gray-700'>{comment.content}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StructuredJournalContent({
  journal,
}: {
  journal: JournalWithDetails;
}) {
  const taskCompletions = (journal as any).task_completions || [];
  const completedTasks = taskCompletions.filter(
    (tc: any) => tc.is_completed
  ).length;
  const totalTasks = taskCompletions.length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className='space-y-6'>
      {/* Progress Summary */}
      <div className='bg-blue-50 rounded-lg p-4'>
        <div className='flex items-center justify-between mb-2'>
          <h3 className='font-semibold text-blue-900'>훈련 진행률</h3>
          <span className='text-blue-700 font-medium'>{completionRate}%</span>
        </div>
        <div className='w-full bg-blue-200 rounded-full h-2 mb-2'>
          <div
            className='bg-blue-600 h-2 rounded-full transition-all duration-300'
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className='text-sm text-blue-700'>
          {completedTasks}개 완료 / 총 {totalTasks}개 과제
        </p>
      </div>

      {/* Task Completions */}
      {taskCompletions.length > 0 && (
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            완료한 과제
          </h3>
          <div className='space-y-3'>
            {taskCompletions.map((completion: any) => (
              <div
                key={completion.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  completion.is_completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {completion.is_completed ? (
                  <CheckCircle className='h-5 w-5 text-green-600 mt-0.5 flex-shrink-0' />
                ) : (
                  <Circle className='h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0' />
                )}
                <div className='flex-1'>
                  <h4
                    className={`font-medium ${
                      completion.is_completed
                        ? 'text-green-900'
                        : 'text-gray-700'
                    }`}
                  >
                    {completion.task_template?.title || '과제 제목 없음'}
                  </h4>
                  {completion.task_template?.description && (
                    <p
                      className={`text-sm mt-1 ${
                        completion.is_completed
                          ? 'text-green-700'
                          : 'text-gray-600'
                      }`}
                    >
                      {completion.task_template.description}
                    </p>
                  )}
                  {completion.completion_note && (
                    <div className='mt-2 p-2 bg-white rounded border'>
                      <p className='text-sm text-gray-700'>
                        {completion.completion_note}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reflection */}
      {journal.content && (
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            성찰 노트
          </h3>
          <div className='bg-gray-50 rounded-lg p-4'>
            <p className='text-gray-700 whitespace-pre-wrap'>
              {journal.content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoJournalContent({ journal }: { journal: JournalWithDetails }) {
  const photos = (journal as any).journal_photos || [];

  return (
    <div className='space-y-6'>
      {/* Description */}
      {journal.content && (
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>설명</h3>
          <div className='bg-gray-50 rounded-lg p-4'>
            <p className='text-gray-700 whitespace-pre-wrap'>
              {journal.content}
            </p>
          </div>
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            사진 ({photos.length}장)
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {photos.map((photo: any) => (
              <div key={photo.id} className='bg-gray-50 rounded-lg p-4'>
                <div className='relative aspect-video bg-gray-200 rounded-lg mb-3 overflow-hidden'>
                  {photo.photo_url ? (
                    <Image
                      src={photo.photo_url}
                      alt={photo.caption || '일지 사진'}
                      fill
                      className='object-cover'
                    />
                  ) : (
                    <div className='flex items-center justify-center h-full'>
                      <ImageIcon className='h-12 w-12 text-gray-400' />
                    </div>
                  )}
                </div>
                {photo.caption && (
                  <p className='text-sm text-gray-700'>{photo.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DefaultJournalContent({ journal }: { journal: JournalWithDetails }) {
  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>내용</h3>
        <div className='bg-gray-50 rounded-lg p-4'>
          <p className='text-gray-700 whitespace-pre-wrap'>{journal.content}</p>
        </div>
      </div>
    </div>
  );
}
