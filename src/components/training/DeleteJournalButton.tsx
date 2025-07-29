'use client';

import { Button, ConfirmModal } from '@/components/ui';
import { JournalWithDetails } from '@/types/database';
import {
  AlertTriangle,
  Archive,
  Camera,
  FileText,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DeleteJournalButtonProps {
  journal: JournalWithDetails;
  onDeleted?: () => void;
  onRestored?: () => void;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  permanent?: boolean;
  showRestore?: boolean;
}

export function DeleteJournalButton({
  journal,
  onDeleted,
  onRestored,
  variant = 'button',
  size = 'md',
  permanent = false,
  showRestore = false,
}: DeleteJournalButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAlreadyDeleted = !!journal.deleted_at;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(`/api/training/journals/${journal.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permanent }),
      });

      const result = await response.json();

      if (result.success) {
        if (onDeleted) {
          onDeleted();
        } else {
          // Default behavior: redirect to journal list with success message
          const params = new URLSearchParams();
          params.set('deleted', 'true');
          params.set('type', permanent ? 'permanent' : 'soft');
          router.push(`/training/journals?${params.toString()}`);
        }
      } else {
        setError(result.error || '일지 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting journal:', error);
      setError('일지 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      setError(null);

      const response = await fetch(
        `/api/training/journals/${journal.id}/restore`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        if (onRestored) {
          onRestored();
        } else {
          // Default behavior: redirect to journal list with success message
          router.push('/training/journals?restored=true');
        }
      } else {
        setError(result.error || '일지 복구에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error restoring journal:', error);
      setError('일지 복구에 실패했습니다.');
    } finally {
      setIsRestoring(false);
      setShowRestoreConfirm(false);
    }
  };

  const getJournalTypeIcon = () => {
    switch (journal.journal_type) {
      case 'photo':
        return <Camera className='h-4 w-4' />;
      case 'structured':
        return <FileText className='h-4 w-4' />;
      default:
        return <FileText className='h-4 w-4' />;
    }
  };

  const getJournalTypeLabel = () => {
    switch (journal.journal_type) {
      case 'photo':
        return '사진 일지';
      case 'structured':
        return '구조화된 일지';
      default:
        return '일지';
    }
  };

  const getRelatedDataWarning = () => {
    const warnings = [];

    // Check for comments
    if (journal.comments_count > 0) {
      warnings.push(`댓글 ${journal.comments_count}개`);
    }

    // Check for photos (for photo journals)
    if (journal.journal_type === 'photo') {
      warnings.push('업로드된 사진들');
    }

    // Check for task completions (for structured journals)
    if (journal.journal_type === 'structured') {
      warnings.push('완료된 훈련 과제들');
    }

    return warnings;
  };

  const getConfirmationMessage = () => {
    const relatedData = getRelatedDataWarning();
    const relatedDataText =
      relatedData.length > 0
        ? `\n\n관련 데이터: ${relatedData.join(', ')}`
        : '';

    if (permanent) {
      return (
        <div className='space-y-4'>
          <div className='flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200'>
            <AlertTriangle className='h-5 w-5 text-red-600 mt-0.5 flex-shrink-0' />
            <div>
              <h4 className='font-medium text-red-800 mb-1'>영구 삭제 경고</h4>
              <p className='text-sm text-red-700'>
                이 작업은 되돌릴 수 없습니다. 모든 데이터가 완전히 삭제됩니다.
              </p>
            </div>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              {getJournalTypeIcon()}
              <span>{getJournalTypeLabel()}</span>
            </div>
            <p className='text-sm font-medium text-gray-900'>
              "{journal.title}"
            </p>
            {relatedData.length > 0 && (
              <p className='text-sm text-gray-600'>
                관련 데이터: {relatedData.join(', ')}도 함께 삭제됩니다.
              </p>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className='space-y-4'>
          <div className='flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
            <Archive className='h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0' />
            <div>
              <h4 className='font-medium text-yellow-800 mb-1'>
                휴지통으로 이동
              </h4>
              <p className='text-sm text-yellow-700'>
                삭제된 일지는 휴지통으로 이동되며, 나중에 복구할 수 있습니다.
              </p>
            </div>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              {getJournalTypeIcon()}
              <span>{getJournalTypeLabel()}</span>
            </div>
            <p className='text-sm font-medium text-gray-900'>
              "{journal.title}"
            </p>
            {relatedData.length > 0 && (
              <p className='text-sm text-gray-600'>
                관련 데이터: {relatedData.join(', ')}
              </p>
            )}
          </div>
        </div>
      );
    }
  };

  const getRestoreConfirmationMessage = () => {
    return (
      <div className='space-y-4'>
        <div className='flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200'>
          <Undo2 className='h-5 w-5 text-green-600 mt-0.5 flex-shrink-0' />
          <div>
            <h4 className='font-medium text-green-800 mb-1'>일지 복구</h4>
            <p className='text-sm text-green-700'>
              삭제된 일지를 복구하여 다시 활성화합니다.
            </p>
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            {getJournalTypeIcon()}
            <span>{getJournalTypeLabel()}</span>
          </div>
          <p className='text-sm font-medium text-gray-900'>"{journal.title}"</p>
          <p className='text-sm text-gray-500'>
            삭제일:{' '}
            {journal.deleted_at
              ? new Date(journal.deleted_at).toLocaleDateString('ko-KR')
              : ''}
          </p>
        </div>
      </div>
    );
  };

  const getButtonContent = () => {
    if (showRestore && isAlreadyDeleted) {
      if (variant === 'icon') {
        return <Undo2 className='h-4 w-4' />;
      }
      return (
        <>
          <Undo2 className='h-4 w-4 mr-2' />
          {isRestoring ? '복구 중...' : '복구'}
        </>
      );
    }

    if (variant === 'icon') {
      return <Trash2 className='h-4 w-4' />;
    }

    return (
      <>
        <Trash2 className='h-4 w-4 mr-2' />
        {isDeleting ? '삭제 중...' : permanent ? '영구 삭제' : '삭제'}
      </>
    );
  };

  const getButtonClassName = () => {
    if (showRestore && isAlreadyDeleted) {
      return `text-green-600 hover:text-green-700 hover:bg-green-50 ${
        variant === 'icon' ? 'px-2' : ''
      }`;
    }

    const baseClass = variant === 'icon' ? 'px-2' : '';

    if (permanent) {
      return `text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ${baseClass}`;
    }

    return `text-red-600 hover:text-red-700 hover:bg-red-50 ${baseClass}`;
  };

  const handleButtonClick = () => {
    if (showRestore && isAlreadyDeleted) {
      setShowRestoreConfirm(true);
    } else {
      setShowConfirm(true);
    }
  };

  return (
    <>
      <Button
        variant='outline'
        size={size}
        onClick={handleButtonClick}
        disabled={isDeleting || isRestoring}
        className={getButtonClassName()}
      >
        {getButtonContent()}
      </Button>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title={permanent ? '영구 삭제 확인' : '일지 삭제 확인'}
        message={getConfirmationMessage()}
        confirmLabel={permanent ? '영구 삭제' : '삭제'}
        cancelLabel='취소'
        type={permanent ? 'danger' : 'warning'}
      />

      {/* Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={showRestoreConfirm}
        onClose={() => setShowRestoreConfirm(false)}
        onConfirm={handleRestore}
        title='일지 복구 확인'
        message={getRestoreConfirmationMessage()}
        confirmLabel='복구'
        cancelLabel='취소'
        type='info'
      />

      {/* Error Display */}
      {error && (
        <div className='mt-2 p-3 bg-red-50 border border-red-200 rounded-md'>
          <div className='flex items-center gap-2'>
            <AlertTriangle className='h-4 w-4 text-red-600' />
            <span className='text-sm text-red-700'>{error}</span>
          </div>
        </div>
      )}
    </>
  );
}
