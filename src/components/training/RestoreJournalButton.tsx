'use client';

import { Button, ConfirmModal } from '@/components/ui';
import { JournalWithDetails } from '@/types/database';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface RestoreJournalButtonProps {
  journal: JournalWithDetails;
  onRestored?: () => void;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

export function RestoreJournalButton({
  journal,
  onRestored,
  variant = 'button',
  size = 'md',
}: RestoreJournalButtonProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      setError(null);

      const response = await fetch(
        `/api/training/journals/${journal.id}/restore`,
        {
          method: 'POST',
        }
      );

      const result = await response.json();

      if (result.success) {
        if (onRestored) {
          onRestored();
        }
      } else {
        setError(result.error || '일지 복구에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error restoring journal:', error);
      setError('일지 복구에 실패했습니다.');
    } finally {
      setIsRestoring(false);
      setShowConfirm(false);
    }
  };

  const getButtonContent = () => {
    if (variant === 'icon') {
      return <RefreshCw className='h-4 w-4' />;
    }

    return (
      <>
        <RefreshCw className='h-4 w-4 mr-2' />
        {isRestoring ? '복구 중...' : '복구'}
      </>
    );
  };

  return (
    <>
      <Button
        variant='outline'
        size={size}
        onClick={() => setShowConfirm(true)}
        disabled={isRestoring}
        className={`text-green-600 hover:text-green-700 hover:bg-green-50 ${
          variant === 'icon' ? 'px-2' : ''
        }`}
      >
        {getButtonContent()}
      </Button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleRestore}
        title='일지 복구'
        message={`"${journal.title}" 일지를 복구하시겠습니까?\n\n복구된 일지는 다시 일지 목록에 표시됩니다.`}
        confirmLabel='복구'
        cancelLabel='취소'
        type='info'
      />

      {/* Error Display */}
      {error && <div className='mt-2 text-sm text-red-600'>{error}</div>}
    </>
  );
}
