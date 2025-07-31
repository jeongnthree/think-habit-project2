'use client';

import { JournalForm } from '@/components/training/JournalForm';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

function JournalCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams?.get('categoryId') || '';

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* 헤더 */}
      <div className='bg-white shadow'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-6'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                ✏️ 훈련 일지 작성
              </h1>
              <p className='mt-1 text-sm text-gray-600'>
                생각습관 훈련을 기록하고 공유해보세요
              </p>
            </div>

            <div className='flex space-x-3'>
              <button
                onClick={() => router.push('/training')}
                className='bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors'
              >
                ⬅️ 훈련 센터로
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-white rounded-lg shadow-lg'>
          <div className='p-6'>
            {/* 카테고리 정보 표시 */}
            {categoryId && (
              <div className='mb-6 p-4 bg-blue-50 rounded-lg'>
                <h3 className='text-lg font-semibold text-blue-900 mb-2'>
                  선택된 훈련 카테고리
                </h3>
                <p className='text-blue-700'>카테고리 ID: {categoryId}</p>
                <p className='text-sm text-blue-600 mt-1'>
                  해당 카테고리의 템플릿에 따라 훈련 일지를 작성하세요.
                </p>
              </div>
            )}

            {/* 훈련 일지 폼 */}
            <JournalForm
              category={{
                id: categoryId || 'default',
                name: '기본 훈련 카테고리',
                description: '생각습관 훈련을 위한 기본 카테고리입니다.',
                template: '훈련 내용을 자유롭게 작성해주세요.',
              }}
              studentId='current-user-id'
              onSave={journal => {
                console.log('훈련 일지 저장:', journal);
                // 저장 후 훈련 센터로 이동
                router.push('/training');
              }}
              onCancel={() => {
                router.push('/training');
              }}
            />
          </div>
        </div>

        {/* 도움말 섹션 */}
        <div className='mt-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            💡 훈련 일지 작성 가이드
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h4 className='font-medium text-gray-800 mb-2'>📝 작성 요령</h4>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• 구체적이고 상세한 내용을 기록하세요</li>
                <li>• 감정과 생각의 변화를 포함하세요</li>
                <li>• 배운 점과 개선점을 명시하세요</li>
                <li>• 다음 훈련 계획을 세워보세요</li>
              </ul>
            </div>
            <div>
              <h4 className='font-medium text-gray-800 mb-2'>🌐 공유 기능</h4>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>
                  • <strong>비공개</strong>: 본인만 확인 가능
                </li>
                <li>
                  • <strong>부분 공개</strong>: 감독/관리자만 확인
                </li>
                <li>
                  • <strong>전체 공개</strong>: 커뮤니티 전체 공유
                </li>
                <li>• 자동 공유 설정으로 편리하게 관리</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JournalCreatePage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>페이지를 불러오는 중...</p>
          </div>
        </div>
      }
    >
      <JournalCreateContent />
    </Suspense>
  );
}
