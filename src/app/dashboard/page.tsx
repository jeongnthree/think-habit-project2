// src/app/dashboard/page.tsx
'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// 임시 사용자 ID (실제로는 인증에서 가져와야 함)
const CURRENT_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

// 임시 데이터 (실제로는 API에서 가져와야 함)
const mockStats = {
  assignedCategories: 3,
  completedJournals: 12,
  currentWeekProgress: 0.6, // 60%
  overallCompletionRate: 0.75, // 75%
  streakDays: 5,
};

const mockRecentJournals = [
  {
    id: 'journal1',
    title: '비판적 사고 훈련 - 뉴스 분석',
    categoryName: '비판적 사고',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1일 전
    isPublic: true,
  },
  {
    id: 'journal2',
    title: '창의적 문제 해결',
    categoryName: '창의적 사고',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2일 전
    isPublic: false,
  },
  {
    id: 'journal3',
    title: '감정 조절 훈련',
    categoryName: '감정 조절',
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3일 전
    isPublic: true,
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState(mockStats);
  const [recentJournals, setRecentJournals] = useState(mockRecentJournals);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 대시보드 데이터 로드
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // 실제로는 API 호출
      // const response = await fetch(`/api/dashboard?userId=${CURRENT_USER_ID}`);
      // const data = await response.json();
      // if (data.success) {
      //   setStats(data.stats);
      //   setRecentJournals(data.recentJournals);
      // }

      // 임시 데이터 사용
      setStats(mockStats);
      setRecentJournals(mockRecentJournals);
    } catch (err) {
      setError('대시보드 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* 헤더 */}
        <div className='mb-8 animate-fade-in'>
          <h1 className='text-4xl font-light text-neutral-900 mb-2'>
            내 <span className='font-semibold text-primary-600'>대시보드</span>
          </h1>
          <p className='text-lg text-neutral-600'>
            훈련 진행 상황을 한눈에 확인하세요.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className='mb-6 bg-red-50 border border-red-200 rounded-md p-4'>
            <div className='text-red-700'>{error}</div>
          </div>
        )}

        {/* 통계 카드 */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up'>
          <Card variant='elevated' shadow='md' hover className='group'>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <div className='p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors'>
                  <svg
                    className='w-6 h-6 text-primary-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-neutral-600'>
                    할당된 카테고리
                  </p>
                  <p className='text-3xl font-bold text-neutral-900'>
                    {stats.assignedCategories}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant='elevated' shadow='md' hover className='group'>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <div className='p-3 bg-secondary-100 rounded-xl group-hover:bg-secondary-200 transition-colors'>
                  <svg
                    className='w-6 h-6 text-secondary-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
                    />
                  </svg>
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-neutral-600'>
                    완료한 일지
                  </p>
                  <p className='text-3xl font-bold text-neutral-900'>
                    {stats.completedJournals}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant='elevated' shadow='md' hover className='group'>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <div className='p-3 bg-yellow-100 rounded-xl group-hover:bg-yellow-200 transition-colors'>
                  <svg
                    className='w-6 h-6 text-yellow-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13 10V3L4 14h7v7l9-11h-7z'
                    />
                  </svg>
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-neutral-600'>
                    연속 기록
                  </p>
                  <p className='text-3xl font-bold text-neutral-900'>
                    {stats.streakDays}일
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant='elevated' shadow='md' hover className='group'>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <div className='p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors'>
                  <svg
                    className='w-6 h-6 text-purple-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                    />
                  </svg>
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-neutral-600'>
                    전체 완료율
                  </p>
                  <p className='text-3xl font-bold text-neutral-900'>
                    {Math.round(stats.overallCompletionRate * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* 이번 주 진행률 */}
          <Card className='p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              이번 주 진행률
            </h2>
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>목표 달성률</span>
                <span className='text-sm font-medium text-gray-900'>
                  {Math.round(stats.currentWeekProgress * 100)}%
                </span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-3'>
                <div
                  className='bg-blue-600 h-3 rounded-full transition-all duration-300'
                  style={{ width: `${stats.currentWeekProgress * 100}%` }}
                />
              </div>
              <p className='text-sm text-gray-500'>
                이번 주 목표까지{' '}
                {Math.round((1 - stats.currentWeekProgress) * 100)}% 남았습니다.
              </p>
            </div>
          </Card>

          {/* 최근 일지 */}
          <Card className='p-6'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg font-semibold text-gray-900'>최근 일지</h2>
              <Link href='/training/journals'>
                <Button variant='outline' size='sm'>
                  전체 보기
                </Button>
              </Link>
            </div>
            <div className='space-y-3'>
              {recentJournals.map(journal => (
                <div
                  key={journal.id}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                >
                  <div className='flex-1'>
                    <Link href={`/training/journal/${journal.id}`}>
                      <h3 className='font-medium text-gray-900 hover:text-blue-600 cursor-pointer'>
                        {journal.title}
                      </h3>
                    </Link>
                    <div className='flex items-center mt-1 text-sm text-gray-500'>
                      <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs'>
                        {journal.categoryName}
                      </span>
                      <span className='mx-2'>•</span>
                      <span>
                        {new Date(journal.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        journal.isPublic
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {journal.isPublic ? '공개' : '비공개'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 빠른 액션 */}
        <div className='mt-8'>
          <Card className='p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              빠른 액션
            </h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <Link href='/training'>
                <Button className='w-full justify-start' variant='outline'>
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                    />
                  </svg>
                  새 일지 작성
                </Button>
              </Link>
              <Link href='/training/journals'>
                <Button className='w-full justify-start' variant='outline'>
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                    />
                  </svg>
                  일지 목록 보기
                </Button>
              </Link>
              <Link href='/admin'>
                <Button className='w-full justify-start' variant='outline'>
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                  </svg>
                  관리자 페이지
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
