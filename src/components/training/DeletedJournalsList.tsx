'use client';

import { Button, Card } from '@/components/ui';
import { JournalWithDetails } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  AlertTriangle,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { DeleteJournalButton } from './DeleteJournalButton';

interface DeletedJournalsListProps {
  journals: JournalWithDetails[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onJournalRestored: (journalId: string) => void;
  onJournalPermanentlyDeleted: (journalId: string) => void;
}

export function DeletedJournalsList({
  journals,
  loading,
  pagination,
  onPageChange,
  onJournalRestored,
  onJournalPermanentlyDeleted,
}: DeletedJournalsListProps) {
  if (loading) {
    return (
      <div className='space-y-4'>
        {[...Array(5)].map((_, i) => (
          <Card key={i} className='p-6'>
            <div className='animate-pulse'>
              <div className='flex items-center justify-between mb-4'>
                <div className='h-6 bg-gray-200 rounded w-1/3'></div>
                <div className='h-4 bg-gray-200 rounded w-20'></div>
              </div>
              <div className='space-y-2'>
                <div className='h-4 bg-gray-200 rounded w-full'></div>
                <div className='h-4 bg-gray-200 rounded w-2/3'></div>
              </div>
              <div className='flex items-center justify-between mt-4'>
                <div className='h-4 bg-gray-200 rounded w-24'></div>
                <div className='flex gap-2'>
                  <div className='h-8 bg-gray-200 rounded w-16'></div>
                  <div className='h-8 bg-gray-200 rounded w-16'></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (journals.length === 0) {
    return (
      <Card className='p-12 text-center'>
        <div className='text-gray-400 text-6xl mb-4'>🗑️</div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          휴지통이 비어있습니다
        </h3>
        <p className='text-gray-600 mb-6'>
          삭제된 일지가 없습니다. 삭제된 일지는 여기에서 복구하거나 영구 삭제할
          수 있습니다.
        </p>
        <Link href='/training/journals'>
          <Button>일지 목록으로 돌아가기</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Warning Banner */}
      <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
        <div className='flex items-start gap-3'>
          <AlertTriangle className='h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0' />
          <div>
            <h4 className='font-medium text-yellow-800 mb-1'>삭제된 일지</h4>
            <p className='text-sm text-yellow-700'>
              아래 일지들은 삭제되어 휴지통에 있습니다. 복구하거나 영구 삭제할
              수 있습니다. 영구 삭제된 일지는 복구할 수 없습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Journal Cards */}
      <div className='space-y-4'>
        {journals.map(journal => (
          <DeletedJournalCard
            key={journal.id}
            journal={journal}
            onRestored={() => onJournalRestored(journal.id)}
            onPermanentlyDeleted={() => onJournalPermanentlyDeleted(journal.id)}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className='flex items-center justify-between'>
          <div className='text-sm text-gray-700'>
            총 {pagination.total}개 중{' '}
            {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)}개
            표시
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className='h-4 w-4' />
              이전
            </Button>

            {/* Page Numbers */}
            <div className='flex items-center gap-1'>
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const pageNum = Math.max(1, pagination.page - 2) + i;
                  if (pageNum > pagination.totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        pageNum === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}
            </div>

            <Button
              variant='outline'
              size='sm'
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              다음
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DeletedJournalCard({
  journal,
  onRestored,
  onPermanentlyDeleted,
}: {
  journal: JournalWithDetails;
  onRestored: () => void;
  onPermanentlyDeleted: () => void;
}) {
  const getJournalTypeIcon = (type: string) => {
    switch (type) {
      case 'structured':
        return <FileText className='h-4 w-4' />;
      case 'photo':
        return <Camera className='h-4 w-4' />;
      default:
        return <FileText className='h-4 w-4' />;
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

  const getJournalPreview = (journal: JournalWithDetails) => {
    if (journal.journal_type === 'photo') {
      return '사진과 함께 작성된 일지입니다.';
    }

    // For structured journals, show a preview of the content
    const content = journal.content || '';
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  };

  return (
    <Card className='p-6 bg-red-50 border-red-200'>
      <div className='flex items-start justify-between mb-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-2'>
            <div className='flex items-center gap-1 px-2 py-1 bg-red-100 rounded-full text-xs text-red-700'>
              <Trash2 className='h-3 w-3' />
              삭제됨
            </div>
            <div className='flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600'>
              {getJournalTypeIcon(journal.journal_type)}
              {getJournalTypeLabel(journal.journal_type)}
            </div>
          </div>

          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            {journal.title}
          </h3>

          <p className='text-gray-600 text-sm mb-3'>
            {getJournalPreview(journal)}
          </p>
        </div>
      </div>

      <div className='flex items-center justify-between text-sm text-gray-500 mb-4'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-1'>
            <User className='h-4 w-4' />
            {journal.category?.name || '카테고리 없음'}
          </div>
          <div className='flex items-center gap-1'>
            <Calendar className='h-4 w-4' />
            삭제:{' '}
            {journal.deleted_at
              ? formatDistanceToNow(new Date(journal.deleted_at), {
                  addSuffix: true,
                  locale: ko,
                })
              : '알 수 없음'}
          </div>
        </div>
      </div>

      {/* Deletion Info */}
      <div className='mb-4 p-3 bg-red-100 rounded-md'>
        <div className='flex items-center gap-2 text-sm text-red-800'>
          <AlertTriangle className='h-4 w-4' />
          <span>
            {journal.deleted_at
              ? new Date(journal.deleted_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '알 수 없음'}
            에 삭제됨
          </span>
        </div>
      </div>

      <div className='flex items-center justify-between'>
        <div className='text-xs text-gray-400'>
          원본 작성일:{' '}
          {new Date(journal.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>

        <div className='flex items-center gap-2'>
          {/* Restore Button */}
          <DeleteJournalButton
            journal={journal}
            onRestored={onRestored}
            variant='button'
            size='sm'
            showRestore={true}
          />

          {/* Permanent Delete Button */}
          <DeleteJournalButton
            journal={journal}
            onDeleted={onPermanentlyDeleted}
            variant='button'
            size='sm'
            permanent={true}
          />
        </div>
      </div>
    </Card>
  );
}
