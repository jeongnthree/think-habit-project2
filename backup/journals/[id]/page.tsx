'use client';

import { DeleteJournalButton } from '@/components/training/DeleteJournalButton';
import { JournalDetail } from '@/components/training/JournalDetail';
import { Button, Card } from '@/components/ui';
import { JournalWithDetails } from '@/types/database';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function JournalDetailPage() {
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

  const handleEdit = () => {
    router.push(`/training/journals/${journalId}/edit`);
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
              <div className='h-8 bg-gray-200 rounded w-2/3'></div>
              <div className='h-4 bg-gray-200 rounded w-1/4'></div>
              <div className='space-y-2'>
                <div className='h-4 bg-gray-200 rounded w-full'></div>
                <div className='h-4 bg-gray-200 rounded w-full'></div>
                <div className='h-4 bg-gray-200 rounded w-3/4'></div>
              </div>
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
        <div className='flex items-center gap-4 mb-8'>
          <Link href='/training/journals'>
            <Button variant='outline' size='sm'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              목록으로
            </Button>
          </Link>
        </div>

        <Card className='p-8 text-center'>
          <div className='text-gray-400 text-6xl mb-4'>📝</div>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            일지를 찾을 수 없습니다
          </h2>
          <p className='text-gray-600 mb-6'>
            요청하신 일지가 존재하지 않거나 접근 권한이 없습니다.
          </p>
          <Link href='/training/journals'>
            <Button>목록으로 돌아가기</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div className='flex items-center gap-4'>
          <Link href='/training/journals'>
            <Button variant='outline' size='sm'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              목록으로
            </Button>
          </Link>
          <h1 className='text-2xl font-bold text-gray-900'>훈련 일지</h1>
        </div>

        {/* Action buttons - only show for journal owner */}
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={handleEdit}>
            <Edit className='h-4 w-4 mr-2' />
            수정
          </Button>
          <DeleteJournalButton
            journal={journal}
            onDeleted={() => router.push('/training/journals?deleted=true')}
          />
        </div>
      </div>

      {/* Journal Detail */}
      <JournalDetail journal={journal} />
    </div>
  );
}
