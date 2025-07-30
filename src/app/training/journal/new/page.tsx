'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { JournalTypeSelector } from '@/components/training/JournalTypeSelector';
import { BackButton } from '@/components/ui/BackButton';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useJournalNavigation } from '@/hooks/useJournalNavigation';
import { Category, TaskTemplate } from '@/types/database';

export default function NewJournalPage() {
  const [category, setCategory] = useState<Category | null>(null);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const navigation = useJournalNavigation();
  const categoryId = searchParams?.get('categoryId') || '';
  const refreshParam = searchParams?.get('refresh') || '';

  // URL 디버깅 정보
  console.log('URL Debug:', {
    searchParams: searchParams?.toString(),
    categoryId,
    refreshParam,
    allParams: Object.fromEntries(searchParams?.entries() || []),
    currentURL: typeof window !== 'undefined' ? window.location.href : 'server',
  });

  // 컴포넌트 키 생성 (URL 파라미터 변경 시 완전히 새로운 인스턴스 생성)
  const componentKey = `${categoryId}-${refreshParam}-${Date.now()}`;

  // 카테고리 정보 및 태스크 템플릿 로드
  const loadCategoryData = async () => {
    let finalCategoryId = categoryId;

    // categoryId가 없으면 기본값 사용
    if (!finalCategoryId) {
      finalCategoryId = '550e8400-e29b-41d4-a716-446655440001';
      console.log('기본 categoryId 사용:', finalCategoryId);
    }

    try {
      setLoading(true);

      // 개발 중이므로 샘플 데이터 사용
      const sampleCategories: Record<string, Category> = {
        '550e8400-e29b-41d4-a716-446655440001': {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: '비판적 사고',
          description: '정보를 분석하고 평가하는 능력을 기르는 훈련',
          template:
            '오늘 접한 정보나 상황에 대해 다음 질문들을 생각해보세요:\n1. 이 정보의 출처는 신뢰할 만한가?\n2. 다른 관점에서는 어떻게 볼 수 있을까?\n3. 숨겨진 가정이나 편견은 없을까?\n4. 결론을 내리기에 충분한 근거가 있는가?',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        '550e8400-e29b-41d4-a716-446655440002': {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: '창의적 사고',
          description:
            '새로운 아이디어를 생성하고 문제를 창의적으로 해결하는 능력',
          template:
            '오늘의 창의적 사고 훈련:\n1. 해결하고 싶은 문제나 개선하고 싶은 상황은?\n2. 기존의 접근 방식은 무엇인가?\n3. 전혀 다른 관점에서 접근한다면?\n4. 새로운 아이디어 3가지를 제시해보세요.',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        '550e8400-e29b-41d4-a716-446655440003': {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: '논리적 사고',
          description: '체계적이고 논리적으로 사고하는 능력을 기르는 훈련',
          template:
            '논리적 사고 연습:\n1. 오늘 내린 중요한 결정이나 판단은?\n2. 그 결정의 근거와 논리는 무엇인가?\n3. 논리적 오류나 빈틈은 없었는가?\n4. 더 나은 논리적 접근 방법은?',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      };

      const sampleCategory = sampleCategories[finalCategoryId];
      if (!sampleCategory) {
        throw new Error('카테고리를 찾을 수 없습니다');
      }

      setCategory(sampleCategory);

      // 샘플 태스크 템플릿 (구조화된 일지용)
      const sampleTaskTemplates: TaskTemplate[] = [
        {
          id: 'task-1',
          category_id: finalCategoryId,
          title: '상황 분석',
          description: '오늘 경험한 상황을 객관적으로 분석해보세요',
          order_index: 1,
          is_required: true,
          difficulty_level: 'easy',
          estimated_minutes: 5,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'task-2',
          category_id: finalCategoryId,
          title: '사고 과정 돌아보기',
          description: '그 상황에서 어떤 생각을 했는지 돌아보세요',
          order_index: 2,
          is_required: true,
          difficulty_level: 'medium',
          estimated_minutes: 10,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'task-3',
          category_id: finalCategoryId,
          title: '질문하기',
          description:
            '상황에 대해 궁금한 점이나 더 알고 싶은 것들을 질문해보세요',
          order_index: 3,
          is_required: false,
          difficulty_level: 'hard',
          estimated_minutes: 15,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      setTaskTemplates(sampleTaskTemplates);
    } catch (err) {
      console.error('Category data load error:', err);
      setError(
        err instanceof Error
          ? err.message
          : '카테고리 정보를 불러오는데 실패했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 페이지 마운트 시 상태 완전 리셋
    console.log('🔄 NewJournalPage useEffect 실행');
    console.log('categoryId:', categoryId);
    console.log(
      '현재 URL:',
      typeof window !== 'undefined' ? window.location.href : 'server'
    );

    setCategory(null);
    setTaskTemplates([]);
    setError(null);
    setLoading(true);

    // 약간의 지연을 두고 데이터 로드 (상태 리셋 보장)
    const timer = setTimeout(() => {
      console.log('⏰ loadCategoryData 호출 시작');
      loadCategoryData();
    }, 100);

    return () => clearTimeout(timer);
  }, [categoryId, searchParams]);

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-red-50 border border-red-200 rounded-md p-4 mb-4'>
          <div className='text-red-700'>
            {error || '카테고리를 찾을 수 없습니다.'}
          </div>
        </div>

        {/* 강제 디버깅 정보 */}
        <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4'>
          <h3 className='font-semibold text-yellow-900 mb-2'>🚨 디버깅 정보</h3>
          <div className='text-sm text-yellow-800 space-y-1'>
            <p>
              <strong>categoryId:</strong> "{categoryId}"
            </p>
            <p>
              <strong>categoryId 길이:</strong> {categoryId.length}
            </p>
            <p>
              <strong>loading:</strong> {loading.toString()}
            </p>
            <p>
              <strong>error:</strong> {error || 'null'}
            </p>
            <p>
              <strong>category:</strong> {category ? 'exists' : 'null'}
            </p>
            <p>
              <strong>현재 URL:</strong>{' '}
              {typeof window !== 'undefined' ? window.location.href : 'server'}
            </p>
          </div>
        </div>

        {/* 강제 테스트 버튼 */}
        <div className='bg-blue-50 border border-blue-200 rounded-md p-4 mb-4'>
          <h3 className='font-semibold text-blue-900 mb-2'>🧪 테스트 버튼</h3>
          <button
            onClick={() => {
              const testUrl =
                '/training/journal/new?categoryId=550e8400-e29b-41d4-a716-446655440001&test=true';
              console.log('테스트 버튼 클릭, 이동할 URL:', testUrl);
              window.location.href = testUrl;
            }}
            className='bg-blue-600 text-white px-4 py-2 rounded mr-2'
          >
            강제 테스트 (비판적 사고)
          </button>
          <button
            onClick={() => {
              console.log('현재 상태:', {
                categoryId,
                loading,
                error,
                category,
              });
              alert(
                `현재 상태: categoryId="${categoryId}", loading=${loading}, error="${error}"`
              );
            }}
            className='bg-green-600 text-white px-4 py-2 rounded'
          >
            상태 확인
          </button>
        </div>

        <div className='mt-4'>
          <button
            onClick={() => navigation.goToTraining()}
            className='text-blue-600 hover:text-blue-800'
          >
            ← 훈련 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 타입 선택 핸들러 - 해당 페이지로 리다이렉트
  const handleTypeSelect = (type: 'structured' | 'photo') => {
    // 구조화된 일지 선택 시 태스크 템플릿 존재 여부 확인
    if (type === 'structured' && taskTemplates.length === 0) {
      setError(
        '이 카테고리에는 구조화된 일지 템플릿이 설정되지 않았습니다. 사진 일지를 이용해주세요.'
      );
      return;
    }

    // 직접 URL로 이동 (navigation 훅 대신)
    const finalCategoryId =
      categoryId || '550e8400-e29b-41d4-a716-446655440001';

    if (type === 'structured') {
      const url = `/training/journal/new/structured?categoryId=${finalCategoryId}`;
      console.log('구조화된 일지로 이동:', url);
      window.location.href = url;
    } else {
      const url = `/training/journal/new/photo?categoryId=${finalCategoryId}`;
      console.log('사진 일지로 이동:', url);
      window.location.href = url;
    }
  };

  // 디버깅 정보 출력 (필요시)
  if (process.env.NODE_ENV === 'development') {
    console.log('NewJournalPage render:', {
      categoryId,
      category: category?.name,
      taskTemplatesCount: taskTemplates.length,
      loading,
      error,
    });
  }

  // 일지 타입 선택 페이지
  return (
    <div
      key={componentKey}
      className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'
    >
      {/* 브레드크럼 네비게이션 */}
      <Breadcrumb
        items={[
          { label: '훈련', href: '/training' },
          { label: category?.name || '카테고리', current: false },
          { label: '새 일지 작성', current: true },
        ]}
        className='mb-6'
      />

      {/* 뒤로 가기 버튼 */}
      <div className='mb-6'>
        <BackButton href='/training' label='훈련 페이지로 돌아가기' />
      </div>

      <JournalTypeSelector
        key={`selector-${componentKey}`}
        onSelect={handleTypeSelect}
        selectedType={undefined}
        categoryName={category?.name}
        categoryDescription={category?.description || undefined}
        hasTaskTemplates={taskTemplates.length > 0}
        taskTemplateCount={taskTemplates.length}
      />
    </div>
  );
}
