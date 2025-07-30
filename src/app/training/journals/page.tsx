'use client';

import { JournalFilters } from '@/components/training/JournalFilters';
import { JournalList } from '@/components/training/JournalList';
import { Button } from '@/components/ui';
import { AccessibilityProvider } from '@/components/ui/AccessibilityProvider';
import { BackButton } from '@/components/ui/BackButton';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Category, JournalWithDetails } from '@/types/database';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

// 페이지 컴포넌트에서 사용할 수 있는 검색 파라미터 타입
// 현재는 직접 useSearchParams를 사용하므로 인터페이스가 필요 없음

function JournalListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [journals, setJournals] = useState<JournalWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Get filter values from URL params
  const categoryId = searchParams?.get('categoryId') || '';
  const page = parseInt(searchParams?.get('page') || '1');
  const search = searchParams?.get('search') || '';
  const journalType = searchParams?.get('journalType') || '';
  const dateFrom = searchParams?.get('dateFrom') || '';
  const dateTo = searchParams?.get('dateTo') || '';
  const deleted = searchParams?.get('deleted') === 'true';

  // Load categories for filter dropdown
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        method: 'GET',
        credentials: 'include', // 중요: 인증 쿠키를 포함시킵니다
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // 개발 환경에서는 인증 오류를 무시합니다
      if (response.status === 401) {
        console.log('인증 오류가 발생했지만 개발 환경에서는 무시합니다.');
        // 실제 프로덕션에서는 아래 코드를 활성화해야 합니다
        // router.push('/login');
        // return;
      }

      const result = await response.json();

      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Load journals with filters
  const loadJournals = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId);
      if (search) params.append('search', search);
      if (journalType) params.append('journalType', journalType);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('page', page.toString());
      params.append('limit', '10');

      const response = await fetch(`/api/training/journals?${params}`, {
        method: 'GET',
        credentials: 'include', // 중요: 인증 쿠키를 포함시킵니다
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // 개발 환경에서는 인증 오류를 무시합니다
      if (response.status === 401) {
        console.log('인증 오류가 발생했지만 개발 환경에서는 무시합니다.');
        // 실제 프로덕션에서는 아래 코드를 활성화해야 합니다
        // router.push('/login');
        // return;
      }

      const result = await response.json();

      if (result.success) {
        setJournals(result.data.journals || []);
        setPagination(
          result.data.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          }
        );
      } else {
        setError(result.error || '일지를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error loading journals:', error);
      setError('일지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filters: {
    categoryId?: string;
    search?: string;
    journalType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const params = new URLSearchParams();

    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.search) params.append('search', filters.search);
    if (filters.journalType) params.append('journalType', filters.journalType);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);

    // Reset to page 1 when filters change
    params.append('page', '1');

    router.push(`/training/journals?${params.toString()}`);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', newPage.toString());
    router.push(`/training/journals?${params.toString()}`);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadJournals();
  }, [categoryId, page, search, journalType, dateFrom, dateTo]);

  // Show success message when redirected after deletion
  useEffect(() => {
    if (deleted) {
      setSuccessMessage('일지가 성공적으로 삭제되었습니다.');
      // Remove the deleted parameter from URL
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.delete('deleted');
      router.replace(`/training/journals?${params.toString()}`);

      // Clear success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [deleted, searchParams, router]);

  // Get current category name for breadcrumb
  const currentCategory = categories.find(cat => cat.id === categoryId);

  // Breadcrumb items
  const breadcrumbItems = [
    { label: '훈련', href: '/training' },
    {
      label: currentCategory ? `${currentCategory.name} 일지` : '내 일지',
      current: true,
    },
  ];

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* 브레드크럼 네비게이션 */}
      <Breadcrumb items={breadcrumbItems} className='mb-6' />

      {/* 뒤로 가기 버튼 */}
      <div className='mb-6'>
        <BackButton href='/training' label='훈련 페이지로 돌아가기' />
      </div>

      {/* Header */}
      <div className='mb-8'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              {currentCategory
                ? `${currentCategory.name} 일지`
                : '내 훈련 일지'}
            </h1>
            <p className='text-gray-600 mt-2'>
              작성한 훈련 일지를 확인하고 관리해보세요.
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <Link href='/training/journals/trash'>
              <Button variant='outline' size='sm'>
                🗑️ 휴지통
              </Button>
            </Link>
            <Link
              href={
                categoryId
                  ? `/training/journal/new?categoryId=${categoryId}`
                  : '/training/journal/new'
              }
            >
              <Button>새 일지 작성</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className='mb-6'>
        <JournalFilters
          categories={categories}
          currentFilters={{
            categoryId,
            search,
            journalType,
            dateFrom,
            dateTo,
          }}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className='mb-6 bg-green-50 border border-green-200 rounded-md p-4'>
          <div className='flex items-center gap-2 text-green-700'>
            <span className='text-green-500'>✓</span>
            {successMessage}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className='mb-6 bg-red-50 border border-red-200 rounded-md p-4'>
          <div className='text-red-700'>{error}</div>
        </div>
      )}

      {/* Journal List */}
      <JournalList
        journals={journals}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Back to Training */}
      <div className='mt-8 text-center'>
        <Link href='/training'>
          <Button variant='outline'>훈련 페이지로 돌아가기</Button>
        </Link>
      </div>
    </div>
  );
}

export default function JournalListPage() {
  return (
    <AccessibilityProvider>
      <Suspense
        fallback={
          <div className='flex justify-center items-center min-h-screen'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          </div>
        }
      >
        <JournalListContent />
      </Suspense>
    </AccessibilityProvider>
  );
}
