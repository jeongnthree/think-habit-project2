'use client';

import { EditJournalForm } from '@/components/training/EditJournalForm';
import { Button, Card } from '@/components/ui';
import { JournalWithDetails } from '@/types/database';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function JournalEditPage() {
  const params = useParams();
  const router = useRouter();
  const [journal, setJournal] = useState<JournalWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const journalId = params?.id as string;

  const loadJournal = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/training/journals/${journalId}`);
      const result = await response.json();

      if (result.success) {
        setJournal(result.data);
      } else {
        setError(result.error || '일지를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error loading journal:', error);
      setError('일지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (updatedJournal: any) => {
    setJournal(updatedJournal);
    router.push(`/training/journals/${journalId}`);
  };

  const handleCancel = () => {
    router.push(`/training/journals/${journalId}`);
  };

  useEffect(() => {
    if (journalId) {
      loadJournal();
    }
  }, [journalId]);

  if (loading) {
    return (
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='animate-pulse'>
          <div className='flex items-center gap-4 mb-8'>
            <div className='h-10 w-20 bg-gray-200 rounded'></div>
            <div className='h-8 bg-gray-200 rounded w-1/3'></div>
          </div>
          <Card className='p-8'>
            <div className='space-y-4'>
              <div className='h-10 bg-gray-200 rounded'></div>
              <div className='h-32 bg-gray-200 rounded'></div>
              <div className='h-6 bg-gray-200 rounded w-1/4'></div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex items-center gap-4 mb-8'>
          <Link href='/training/journals'>
            <Button variant='outline' size='sm'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              목록으로
            </Button>
          </Link>
        </div>

        <Card className='p-8 text-center'>
          <div className='text-red-500 text-6xl mb-4'>⚠️</div>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            일지를 불러올 수 없습니다
          </h2>
          <p className='text-gray-600 mb-6'>{error}</p>
          <div className='flex justify-center gap-4'>
            <Button onClick={loadJournal}>다시 시도</Button>
            <Link href='/training/journals'>
              <Button variant='outline'>목록으로 돌아가기</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <Card className='p-8 text-center'>
          <div className='text-gray-400 text-6xl mb-4'>📝</div>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            일지를 찾을 수 없습니다
          </h2>
          <p className='text-gray-600 mb-6'>
            요청하신 일지가 존재하지 않거나 수정 권한이 없습니다.
          </p>
          <Link href='/training/journals'>
            <Button>목록으로 돌아가기</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <EditJournalForm
      journal={journal}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
