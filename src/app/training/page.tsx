'use client';

import { TrainingNavigation } from '@/components/layout/TrainingNavigation';
import { Button, Card } from '@/components/ui';
import { useTrainingAssignments } from '@/hooks/useTrainingAssignments';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// 임시 사용자 ID (실제로는 인증에서 가져와야 함)
const CURRENT_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

export default function TrainingPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { assignments, loading, error, refetch } = useTrainingAssignments(
    currentUserId || ''
  );

  // 현재 사용자 ID 가져오기
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setCurrentUserId(user.id);
        } else {
          // 인증되지 않은 경우 임시 사용자 ID 사용 (개발용)
          setCurrentUserId(CURRENT_USER_ID);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        // 오류 발생 시 임시 사용자 ID 사용
        setCurrentUserId(CURRENT_USER_ID);
      }
    };

    getCurrentUser();
  }, []);

  // 페이지 포커스 시 진행률 새로고침 (일지 작성 후 돌아왔을 때)
  useEffect(() => {
    const handleFocus = () => {
      if (currentUserId) {
        refetch();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentUserId, refetch]);

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div>
      {/* 네비게이션 */}
      <TrainingNavigation
        showBackButton={false}
        showBreadcrumb={false}
        title='훈련 일지'
        subtitle='할당받은 카테고리로 훈련 일지를 작성해보세요'
        actions={
          <Button
            variant='outline'
            onClick={refetch}
            disabled={loading}
            className='flex items-center gap-2'
            size='sm'
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
            새로고침
          </Button>
        }
      />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* 헤더 - 데스크톱에서만 표시 */}
        <div className='hidden md:block mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>훈련 일지</h1>
          <p className='text-gray-600 mt-2'>
            할당받은 카테고리로 훈련 일지를 작성해보세요.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className='mb-6 bg-red-50 border border-red-200 rounded-md p-4'>
            <div className='text-red-700'>{error}</div>
          </div>
        )}

        {/* 할당받은 카테고리 목록 */}
        {assignments.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {assignments.map(assignment => (
              <Card
                key={assignment.id}
                className='p-6 hover:shadow-lg transition-shadow'
              >
                <div className='flex justify-between items-start mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {assignment.category?.name || '카테고리 없음'}
                  </h3>
                  <span className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'>
                    주 {assignment.weekly_goal}회
                  </span>
                </div>

                {assignment.category?.description && (
                  <p className='text-gray-600 text-sm mb-4'>
                    {assignment.category.description}
                  </p>
                )}

                <div className='mb-4'>
                  <div className='flex justify-between text-sm text-gray-500 mb-1'>
                    <span>이번 주 진행률</span>
                    <span>
                      {assignment.weeklyProgress?.completed || 0} /{' '}
                      {assignment.weeklyProgress?.target ||
                        assignment.weekly_goal}
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                      style={{
                        width: `${assignment.weeklyProgress?.percentage || 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Link
                    href={`/training/journal/new?categoryId=${assignment.category_id}`}
                  >
                    <Button className='w-full'>새 일지 작성</Button>
                  </Link>
                  <Link
                    href={`/training/journals?categoryId=${assignment.category_id}`}
                  >
                    <Button variant='outline' className='w-full'>
                      내 일지 보기
                    </Button>
                  </Link>
                </div>

                {assignment.category?.template && (
                  <div className='mt-4 pt-4 border-t border-gray-200'>
                    <p className='text-xs text-gray-500 mb-2'>
                      템플릿 미리보기:
                    </p>
                    <p className='text-sm text-gray-700 bg-gray-50 p-2 rounded text-ellipsis overflow-hidden'>
                      {assignment.category.template.length > 80
                        ? assignment.category.template.substring(0, 80) + '...'
                        : assignment.category.template}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className='text-center py-12'>
            <div className='text-gray-400 text-6xl mb-4'>📝</div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              할당받은 카테고리가 없습니다
            </h3>
            <p className='text-gray-600 mb-4'>
              관리자에게 훈련 카테고리 할당을 요청해보세요.
            </p>
          </div>
        )}

        {/* 최근 활동 */}
        {assignments.length > 0 && (
          <div className='mt-12'>
            <h2 className='text-xl font-semibold text-gray-900 mb-6'>
              최근 활동
            </h2>
            <Card className='p-6'>
              <div className='space-y-4'>
                {assignments.some(
                  a => (a.weeklyProgress?.completed || 0) > 0
                ) ? (
                  assignments
                    .filter(a => (a.weeklyProgress?.completed || 0) > 0)
                    .map(assignment => (
                      <div
                        key={assignment.id}
                        className='flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0'
                      >
                        <div>
                          <p className='font-medium text-gray-900'>
                            {assignment.category?.name}
                          </p>
                          <p className='text-sm text-gray-500'>
                            이번 주 {assignment.weeklyProgress?.completed}개
                            일지 작성
                          </p>
                        </div>
                        <div className='text-right'>
                          <div className='text-sm font-medium text-blue-600'>
                            {assignment.weeklyProgress?.percentage}% 완료
                          </div>
                          <div className='text-xs text-gray-500'>
                            목표: {assignment.weeklyProgress?.target}개
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className='text-center py-8 text-gray-500'>
                    <div className='text-4xl mb-2'>📊</div>
                    <p>최근 작성한 일지가 없습니다.</p>
                    <p className='text-sm'>첫 번째 훈련 일지를 작성해보세요!</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* 도움말 */}
        <div className='mt-12 bg-blue-50 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-blue-900 mb-3'>
            훈련 일지 작성 가이드
          </h3>
          <div className='text-blue-800 text-sm space-y-2'>
            <p>• 할당받은 카테고리에서만 일지를 작성할 수 있습니다.</p>
            <p>• 각 카테고리마다 제공되는 템플릿을 활용해보세요.</p>
            <p>• 주간 목표를 달성하여 꾸준한 훈련 습관을 만들어보세요.</p>
            <p>
              • 일지를 공개로 설정하면 다른 사용자들과 경험을 공유할 수
              있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
