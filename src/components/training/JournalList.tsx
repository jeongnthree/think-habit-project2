'use client';

import { Button, Card } from '@/components/ui';
import { useAccessibility } from '@/components/ui/AccessibilityProvider';
import { HelpContent, HelpTooltip } from '@/components/ui/HelpTooltip';
import { LazyImage } from '@/components/ui/LazyImage';
import { JournalWithDetails } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Calendar,
  Camera,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Image,
  MessageCircle,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { memo, useMemo } from 'react';

interface JournalListProps {
  journals: JournalWithDetails[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export const JournalList = memo(function JournalList({
  journals,
  loading,
  pagination,
  onPageChange,
}: JournalListProps) {
  const { announceToScreenReader } = useAccessibility();
  if (loading) {
    return (
      <div className='space-y-4' role='status' aria-label='일지 목록 로딩 중'>
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
                <div className='h-8 bg-gray-200 rounded w-16'></div>
              </div>
            </div>
          </Card>
        ))}
        <span className='sr-only'>일지 목록을 불러오는 중입니다...</span>
      </div>
    );
  }

  if (journals.length === 0) {
    return (
      <Card
        className='p-12 text-center'
        role='region'
        aria-label='빈 일지 목록'
      >
        <div className='text-gray-400 text-6xl mb-4' aria-hidden='true'>
          📝
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          일지가 없습니다
        </h3>
        <p className='text-gray-600 mb-6'>
          아직 작성한 훈련 일지가 없습니다. 첫 번째 일지를 작성해보세요!
        </p>
        <Link href='/training/journal/new'>
          <Button aria-describedby='new-journal-help'>새 일지 작성</Button>
        </Link>
        <HelpTooltip
          content={HelpContent.journalTypes}
          title='일지 유형 안내'
          trigger='click'
          className='ml-2'
        />
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Journal Cards */}
      <div
        className='space-y-4'
        role='list'
        aria-label={`총 ${journals.length}개의 일지`}
      >
        {journals.map(journal => (
          <JournalCard
            key={journal.id}
            journal={journal}
            onAnnounce={announceToScreenReader}
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
});

const JournalCard = memo(function JournalCard({
  journal,
  onAnnounce,
}: {
  journal: JournalWithDetails;
  onAnnounce: (message: string) => void;
}) {
  const journalTypeIcon = useMemo(() => {
    switch (journal.journal_type) {
      case 'structured':
        return <FileText className='h-4 w-4' />;
      case 'photo':
        return <Camera className='h-4 w-4' />;
      default:
        return <FileText className='h-4 w-4' />;
    }
  }, [journal.journal_type]);

  const journalTypeLabel = useMemo(() => {
    switch (journal.journal_type) {
      case 'structured':
        return '구조화된 일지';
      case 'photo':
        return '사진 일지';
      default:
        return '일지';
    }
  }, [journal.journal_type]);

  const journalPreview = useMemo(() => {
    if (journal.journal_type === 'photo') {
      return '사진과 함께 작성된 일지입니다.';
    }

    // For structured journals, show a preview of the content
    const content = journal.content || '';
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  }, [journal.journal_type, journal.content]);

  const formattedDate = useMemo(
    () =>
      formatDistanceToNow(new Date(journal.created_at), {
        addSuffix: true,
        locale: ko,
      }),
    [journal.created_at]
  );

  const formattedUpdateDate = useMemo(
    () =>
      new Date(journal.updated_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [journal.updated_at]
  );

  return (
    <Card
      className='p-6 hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-blue-500'
      role='listitem'
      aria-label={`${journalTypeLabel}: ${journal.title}`}
    >
      <div className='flex items-start justify-between mb-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-2'>
            <div
              className='flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600'
              role='badge'
              aria-label={`일지 유형: ${journalTypeLabel}`}
            >
              {journalTypeIcon}
              {journalTypeLabel}
            </div>
            {journal.is_public ? (
              <div
                className='flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs'
                role='badge'
                aria-label='공개 일지'
              >
                <Eye className='h-3 w-3' aria-hidden='true' />
                공개
              </div>
            ) : (
              <div
                className='flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs'
                role='badge'
                aria-label='비공개 일지'
              >
                <EyeOff className='h-3 w-3' aria-hidden='true' />
                비공개
              </div>
            )}
          </div>

          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            <Link
              href={`/training/journals/${journal.id}`}
              className='hover:text-blue-600 focus:outline-none focus:text-blue-600'
              aria-describedby={`journal-${journal.id}-summary`}
            >
              {journal.title}
            </Link>
          </h3>

          <p
            className='text-gray-600 text-sm mb-3'
            id={`journal-${journal.id}-summary`}
          >
            {journalPreview}
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
            {formattedDate}
          </div>
          {journal.comments_count > 0 && (
            <div className='flex items-center gap-1'>
              <MessageCircle className='h-4 w-4' />
              {journal.comments_count}
            </div>
          )}
        </div>
      </div>

      {/* Journal Type Specific Info */}
      {journal.journal_type === 'structured' && (
        <div className='mb-4 p-3 bg-blue-50 rounded-md'>
          <div className='flex items-center gap-2 text-sm text-blue-700'>
            <CheckCircle className='h-4 w-4' />
            구조화된 훈련 완료
          </div>
        </div>
      )}

      {journal.journal_type === 'photo' && (
        <div className='mb-4 p-3 bg-purple-50 rounded-md'>
          <div className='flex items-center gap-2 text-sm text-purple-700 mb-2'>
            <Image className='h-4 w-4' />
            사진 기반 훈련 기록
          </div>
          {journal.journal_photos && journal.journal_photos.length > 0 && (
            <div className='flex gap-2 overflow-x-auto'>
              {journal.journal_photos.slice(0, 3).map((photo, index) => (
                <LazyImage
                  key={photo.id}
                  src={photo.photo_url}
                  alt={`Journal photo ${index + 1}`}
                  width={60}
                  height={60}
                  className='w-15 h-15 rounded-md flex-shrink-0'
                  quality={50}
                />
              ))}
              {journal.journal_photos.length > 3 && (
                <div className='w-15 h-15 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 flex-shrink-0'>
                  +{journal.journal_photos.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className='flex items-center justify-between'>
        <div className='text-xs text-gray-400'>{formattedUpdateDate}</div>

        <div className='flex items-center gap-2'>
          <Link href={`/training/journals/${journal.id}`}>
            <Button variant='outline' size='sm'>
              자세히 보기
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
});
