'use client';

import { DeletedJournalsList } from '@/components/training/DeletedJournalsList';
import { Button, Card } from '@/components/ui';
import { JournalWithDetails } from '@/types/database';
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function TrashPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [journals, setJournals] = useState<JournalWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Check for success messages from URL params
  const restored = searchParams.get('restored');
  const permanentlyDeleted = searchParams.get('permanently_deleted');

  const loadDeletedJournals = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          deleted: 'true', // Only fetch deleted journals
        });

        const response = await fetch(
          `/api/training/journals?${params.toString()}`
        );
        const result = await response.json();

        if (result.success) {
          setJournals(result.data || []);
          setPagination(prev => ({
            ...prev,
            page: result.pagination?.page || page,
            total: result.pagination?.total || 0,
            totalPages: result.pagination?.totalPages || 0,
          }));
        } else {
          setError(result.error || '삭제된 일지를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('Error loading deleted journals:', error);
        setError('삭제된 일지를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit]
  );

  const handlePageChange = (page: number) => {
    loadDeletedJournals(page);
  };

  const handleJournalRestored = (journalId: string) => {
    // Remove the restored journal from the list
    setJournals(prev => prev.filter(journal => journal.id !== journalId));
    setPagination(prev => ({
      ...prev,
      total: prev.total - 1,
    }));
  };

  const handleJournalPermanentlyDeleted = (journalId: string) => {
    // Remove the permanently deleted journal from the list
    setJournals(prev => prev.filter(journal => journal.id !== journalId));
    setPagination(prev => ({
      ...prev,
      total: prev.total - 1,
    }));
  };

  const handleRefresh = () => {
    loadDeletedJournals(pagination.page);
  };

  useEffect(() => {
    loadDeletedJournals();
  }, [loadDeletedJournals]);

  // Clear URL params after showing success messages
  useEffect(() => {
    if (restored || permanentlyDeleted) {
      const timer = setTimeout(() => {
        router.replace('/training/journals/trash', { scroll: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [restored, permanentlyDeleted, router]);

  return (
    <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div className='flex items-center gap-4'>
          <Link href='/training/journals'>
            <Button variant='outline' size='sm'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              일지 목록
            </Button>
          </Link>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
              <Trash2 className='h-6 w-6' />
              휴지통
            </h1>
            <p className='text-sm text-gray-600 mt-1'>
              삭제된 일지를 복구하거나 영구 삭제할 수 있습니다
            </p>
          </div>
        </div>

        <Button variant='outline' onClick={handleRefresh} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          />
          새로고침
        </Button>
      </div>

      {/* Success Messages */}
      {restored && (
        <Card className='mb-6 p-4 bg-green-50 border-green-200'>
          <div className='flex items-center gap-2 text-green-800'>
            <div className='h-2 w-2 bg-green-600 rounded-full'></div>
            <span className='font-medium'>
              일지가 성공적으로 복구되었습니다.
            </span>
          </div>
        </Card>
      )}

      {permanentlyDeleted && (
        <Card className='mb-6 p-4 bg-red-50 border-red-200'>
          <div className='flex items-center gap-2 text-red-800'>
            <div className='h-2 w-2 bg-red-600 rounded-full'></div>
            <span className='font-medium'>
              일지가 영구적으로 삭제되었습니다.
            </span>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className='mb-6 p-6 bg-red-50 border-red-200'>
          <div className='flex items-center gap-3'>
            <div className='text-red-500 text-xl'>⚠️</div>
            <div>
              <h3 className='font-medium text-red-800 mb-1'>오류 발생</h3>
              <p className='text-sm text-red-700'>{error}</p>
            </div>
          </div>
          <div className='mt-4'>
            <Button variant='outline' size='sm' onClick={handleRefresh}>
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      {/* Deleted Journals List */}
      <DeletedJournalsList
        journals={journals}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onJournalRestored={handleJournalRestored}
        onJournalPermanentlyDeleted={handleJournalPermanentlyDeleted}
      />
    </div>
  );
}
