// src/pages/training/journal/create.tsx
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { JournalForm } from '../../../components/training/JournalForm';

// 임시 타입 정의
interface Category {
  id: string;
  name: string;
  description?: string;
  area:
    | 'cognitive'
    | 'problem_solving'
    | 'decision_making'
    | 'social_emotional'
    | 'strategic';
  template_structure?: string;
  template_instructions?: string;
  is_active: boolean;
  created_at: string;
}

// 임시 API 클래스
class TempJournalAPI {
  static async checkCategoryAccess(
    userId: string,
    categoryId: string
  ): Promise<boolean> {
    // 임시로 항상 true 반환 (실제로는 할당 여부 확인)
    return true;
  }

  static async getAssignedCategories(userId: string) {
    return {
      assignments: [
        {
          category_id: 'cat1',
          category: {
            id: 'cat1',
            name: '비판적 사고',
            description: '정보를 객관적으로 분석하고 평가하는 능력',
            area: 'cognitive' as const,
            is_active: true,
            created_at: new Date().toISOString(),
          },
        },
      ],
    };
  }
}

const CreateJournalPage: React.FC = () => {
  const router = useRouter();
  const { categoryId } = router.query;

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 임시로 현재 사용자 ID (실제로는 인증 시스템에서 가져와야 함)
  const userId = 'current-user-id';

  useEffect(() => {
    if (categoryId && typeof categoryId === 'string') {
      loadCategoryAndCheckAccess(categoryId);
    }
  }, [categoryId]);

  const loadCategoryAndCheckAccess = async (catId: string) => {
    try {
      setLoading(true);

      // 카테고리 접근 권한 확인
      const hasAccess = await TempJournalAPI.checkCategoryAccess(userId, catId);
      if (!hasAccess) {
        throw new Error('이 카테고리에 대한 훈련 권한이 없습니다.');
      }

      // 할당된 카테고리 목록에서 해당 카테고리 찾기
      const assignedData = await TempJournalAPI.getAssignedCategories(userId);
      const targetAssignment = assignedData.assignments.find(
        (assignment: any) => assignment.category_id === catId
      );

      if (!targetAssignment) {
        throw new Error('할당된 카테고리를 찾을 수 없습니다.');
      }

      setCategory(targetAssignment.category);
    } catch (err) {
      setError(err instanceof Error ? err.message : '카테고리 로딩 실패');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>카테고리 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-6 max-w-md'>
            <h2 className='text-lg font-semibold text-red-800 mb-2'>
              접근 오류
            </h2>
            <p className='text-red-700 mb-4'>{error}</p>
            <div className='space-x-3'>
              <button
                onClick={() => router.push('/training')}
                className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
              >
                훈련 메인으로
              </button>
              <button
                onClick={() => router.back()}
                className='px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50'
              >
                이전 페이지
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-gray-600'>카테고리를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>새 훈련 일지 작성 - {category.name} | Think Habit 3</title>
        <meta
          name='description'
          content={`${category.name} 카테고리의 새 훈련 일지 작성`}
        />
      </Head>

      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <JournalForm
            category={category}
            studentId={userId}
            onCancel={() => router.push('/training')}
          />
        </div>
      </div>
    </>
  );
};

export default CreateJournalPage;
