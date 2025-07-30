'use client';

import { BackButton } from '@/components/ui/BackButton';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Category, TaskTemplate } from '@/types/database';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function StructuredJournalPage() {
  const [category, setCategory] = useState<Category | null>(null);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPublic, setIsPublic] = useState(true); // 기본값을 공개로 설정

  const searchParams = useSearchParams();
  const categoryId = searchParams?.get('categoryId') || '';

  useEffect(() => {
    const loadData = async () => {
      if (!categoryId) {
        setError('카테고리를 선택해주세요.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 샘플 데이터 사용
        const sampleCategories: Record<string, Category> = {
          '550e8400-e29b-41d4-a716-446655440001': {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: '비판적 사고',
            description: '정보를 분석하고 평가하는 능력을 기르는 훈련',
            template: '오늘 접한 정보나 상황에 대해 다음 질문들을 생각해보세요',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        };

        const sampleCategory = sampleCategories[categoryId];
        if (!sampleCategory) {
          throw new Error('카테고리를 찾을 수 없습니다');
        }

        setCategory(sampleCategory);

        const sampleTaskTemplates: TaskTemplate[] = [
          {
            id: 'task-1',
            category_id: categoryId,
            title: '상황 분석',
            description: '오늘 경험한 상황을 객관적으로 분석해보세요',
            prompt: '어떤 상황이었나요? 구체적으로 설명해주세요.',
            order_index: 1,
            is_required: true,
            difficulty_level: 'easy',
            estimated_minutes: 5,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'task-2',
            category_id: categoryId,
            title: '사고 과정 돌아보기',
            description: '그 상황에서 어떤 생각을 했는지 돌아보세요',
            prompt: '그때 어떤 생각들이 들었나요? 감정은 어땠나요?',
            order_index: 2,
            is_required: true,
            difficulty_level: 'medium',
            estimated_minutes: 10,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'task-3',
            category_id: categoryId,
            title: '질문하기',
            description:
              '상황에 대해 궁금한 점이나 더 알고 싶은 것들을 질문해보세요',
            prompt: '이 상황에 대해 어떤 질문을 해볼 수 있을까요?',
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
        setError(err instanceof Error ? err.message : '데이터 로드 실패');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryId]);

  const handleResponseChange = (taskId: string, value: string) => {
    setResponses(prev => ({ ...prev, [taskId]: value }));
  };

  const handleNext = () => {
    if (currentTaskIndex < taskTemplates.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // 필수 항목 체크
      const requiredTasks = taskTemplates.filter(task => task.is_required);
      const missingRequired = requiredTasks.filter(
        task => !responses[task.id]?.trim()
      );

      if (missingRequired.length > 0) {
        alert(
          `필수 항목을 모두 작성해주세요: ${missingRequired.map(t => t.title).join(', ')}`
        );
        return;
      }

      // 실제 API에 저장
      console.log('Submitting journal:', { categoryId, responses });

      const journalData = {
        studentId: '550e8400-e29b-41d4-a716-446655440000', // 임시 사용자 ID
        category_id: categoryId,
        type: 'structured',
        title: `${category?.name} 훈련 일지`,
        content: JSON.stringify(responses),
        responses: Object.entries(responses).map(([taskId, answer]) => {
          const task = taskTemplates.find(t => t.id === taskId);
          return {
            task_id: taskId,
            task_title: task?.title || '',
            answer: answer,
          };
        }),
        is_public: isPublic, // 사용자가 선택한 공개 설정
        created_at: new Date().toISOString(),
      };

      try {
        const response = await fetch('/api/journals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(journalData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ API 오류 응답:', errorData);
          throw new Error(
            errorData.error || `HTTP ${response.status}: 저장에 실패했습니다`
          );
        }

        const result = await response.json();
        console.log('✅ 저장 성공:', result);

        setIsSubmitted(true);
      } catch (error) {
        console.error('저장 오류:', error);
        // 저장 실패 시에도 성공 화면 표시 (개발 중)
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className='bg-red-50 border border-red-200 rounded-md p-4'>
          <div className='text-red-700'>
            {error || '카테고리를 찾을 수 없습니다.'}
          </div>
        </div>
        <div className='mt-4'>
          <BackButton href='/training' label='훈련 페이지로 돌아가기' />
        </div>
      </div>
    );
  }

  // 저장 완료 화면
  if (isSubmitted) {
    return (
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='text-center py-12'>
          <div className='text-6xl mb-6'>🎉</div>
          <h1 className='text-3xl font-bold text-gray-900 mb-4'>
            일지 저장 완료!
          </h1>
          <p className='text-lg text-gray-600 mb-8'>
            <strong>{category.name}</strong> 카테고리의 구조화된 일지가
            성공적으로 저장되었습니다.
          </p>

          <div className='bg-green-50 border border-green-200 rounded-lg p-6 mb-8'>
            <h3 className='text-lg font-semibold text-green-900 mb-3'>
              작성 완료된 내용
            </h3>
            <div className='space-y-3 text-left'>
              {taskTemplates.map(task => (
                <div key={task.id} className='flex items-start'>
                  <div className='w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5'>
                    ✓
                  </div>
                  <div className='flex-1'>
                    <h4 className='font-medium text-green-900'>{task.title}</h4>
                    <p className='text-sm text-green-700 mt-1'>
                      {responses[task.id]
                        ? responses[task.id]!.length > 100
                          ? responses[task.id]!.substring(0, 100) + '...'
                          : responses[task.id]
                        : '(작성하지 않음)'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='space-x-4'>
            <button
              onClick={() => (window.location.href = '/training')}
              className='bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors'
            >
              훈련 페이지로 돌아가기
            </button>
            <button
              onClick={() => {
                alert('버튼 클릭됨!');
                const targetUrl =
                  '/training/journal/new?categoryId=550e8400-e29b-41d4-a716-446655440001&t=' +
                  Date.now();
                console.log('이동할 URL:', targetUrl);
                alert('이동할 URL: ' + targetUrl);
                window.location.href = targetUrl;
              }}
              className='bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors'
            >
              새 일지 작성하기 (테스트)
            </button>

            {/* 백업 링크 */}
            <a
              href='/training/journal/new?categoryId=550e8400-e29b-41d4-a716-446655440001'
              className='inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-center ml-4'
            >
              새 일지 작성 (링크)
            </a>
          </div>
        </div>
      </div>
    );
  }

  const currentTask = taskTemplates[currentTaskIndex];
  const isLastTask = currentTaskIndex === taskTemplates.length - 1;
  const progress = ((currentTaskIndex + 1) / taskTemplates.length) * 100;

  return (
    <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* 브레드크럼 */}
      <Breadcrumb
        items={[
          { label: '훈련', href: '/training' },
          { label: category.name, current: false },
          { label: '구조화된 일지', current: true },
        ]}
        className='mb-6'
      />

      {/* 뒤로 가기 */}
      <div className='mb-6'>
        <BackButton
          href={`/training/journal/new?categoryId=${categoryId}`}
          label='일지 타입 선택으로 돌아가기'
        />
      </div>

      {/* 카테고리 정보 */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8'>
        <h1 className='text-2xl font-bold text-blue-900 mb-2'>
          📚 {category.name} - 구조화된 일지
        </h1>
        <p className='text-blue-800'>{category.description}</p>
      </div>

      {/* 진행률 */}
      <div className='mb-8'>
        <div className='flex justify-between items-center mb-2'>
          <span className='text-sm font-medium text-gray-700'>
            진행률: {currentTaskIndex + 1} / {taskTemplates.length}
          </span>
          <span className='text-sm text-gray-500'>{Math.round(progress)}%</span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-blue-600 h-2 rounded-full transition-all duration-300'
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 현재 태스크 */}
      {currentTask && (
        <div className='bg-white border border-gray-200 rounded-lg p-8 mb-8'>
          <div className='mb-6'>
            <h2 className='text-xl font-bold text-gray-900 mb-2'>
              {currentTask.title}
            </h2>
            <p className='text-gray-600 mb-4'>{currentTask.description}</p>
            <div className='bg-gray-50 border-l-4 border-blue-500 p-4'>
              <p className='text-gray-800 font-medium'>{currentTask.prompt}</p>
            </div>
          </div>

          <div className='mb-6'>
            <textarea
              value={responses[currentTask.id] || ''}
              onChange={e =>
                handleResponseChange(currentTask.id, e.target.value)
              }
              placeholder='여기에 답변을 작성해주세요...'
              className='w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
            />
          </div>

          {/* 네비게이션 버튼 */}
          <div className='flex justify-between'>
            <button
              onClick={handlePrevious}
              disabled={currentTaskIndex === 0}
              className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              이전
            </button>

            {isLastTask ? (
              <div className='flex flex-col items-end space-y-4'>
                {/* 공개/비공개 설정 */}
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <label className='block text-sm font-medium text-gray-700 mb-3'>
                    공개 설정
                  </label>
                  <div className='space-y-2'>
                    <label className='flex items-center'>
                      <input
                        type='radio'
                        name='visibility'
                        checked={isPublic}
                        onChange={() => setIsPublic(true)}
                        className='mr-3'
                        disabled={isSubmitting}
                      />
                      <span className='text-sm text-gray-700'>
                        공개 (커뮤니티에서 공유)
                      </span>
                    </label>
                    <label className='flex items-center'>
                      <input
                        type='radio'
                        name='visibility'
                        checked={!isPublic}
                        onChange={() => setIsPublic(false)}
                        className='mr-3'
                        disabled={isSubmitting}
                      />
                      <span className='text-sm text-gray-700'>
                        비공개 (나만 볼 수 있음)
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isSubmitting
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isSubmitting ? (
                    <div className='flex items-center'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      저장 중...
                    </div>
                  ) : (
                    '일지 저장하기'
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleNext}
                className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
              >
                다음
              </button>
            )}
          </div>
        </div>
      )}

      {/* 모든 태스크 미리보기 */}
      <div className='bg-gray-50 rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>전체 단계</h3>
        <div className='space-y-3'>
          {taskTemplates.map((task, index) => (
            <div
              key={task.id}
              className={`flex items-center p-3 rounded-lg ${
                index === currentTaskIndex
                  ? 'bg-blue-100 border border-blue-300'
                  : index < currentTaskIndex
                    ? 'bg-green-100 border border-green-300'
                    : 'bg-white border border-gray-200'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                  index === currentTaskIndex
                    ? 'bg-blue-600 text-white'
                    : index < currentTaskIndex
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                }`}
              >
                {index < currentTaskIndex ? '✓' : index + 1}
              </div>
              <div className='flex-1'>
                <h4 className='font-medium text-gray-900'>{task.title}</h4>
                <p className='text-sm text-gray-600'>{task.description}</p>
              </div>
              {task.is_required && (
                <span className='text-xs bg-red-100 text-red-800 px-2 py-1 rounded'>
                  필수
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
