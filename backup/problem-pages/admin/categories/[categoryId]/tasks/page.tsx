'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { TaskTemplateEditor } from '@/components/admin/TaskTemplateEditor';
import { Button, Card } from '@/components/ui';
import { Category, TaskTemplate } from '@/types/database';

interface TaskTemplatePageData {
  category: Category;
  tasks: TaskTemplate[];
}

export default function TaskTemplatesPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params?.categoryId as string;

  const [data, setData] = useState<TaskTemplatePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 태스크 템플릿 데이터 로드
  const loadTaskTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/categories/${categoryId}/tasks`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.error || '태스크 템플릿을 불러오는데 실패했습니다'
        );
      }

      setData(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다'
      );
    } finally {
      setLoading(false);
    }
  };

  // 태스크 템플릿 저장
  const handleSaveTasks = async (tasks: TaskTemplate[]) => {
    try {
      // 기존 태스크들과 비교하여 생성/수정/삭제 처리
      const existingTasks = data?.tasks || [];
      const existingTaskIds = new Set(existingTasks.map(t => t.id));
      const newTaskIds = new Set(tasks.map(t => t.id));

      // 새로 생성된 태스크들 (id가 없거나 기존에 없던 것들)
      const tasksToCreate = tasks.filter(
        t => !t.id || !existingTaskIds.has(t.id)
      );

      // 수정된 태스크들
      const tasksToUpdate = tasks.filter(
        t => t.id && existingTaskIds.has(t.id)
      );

      // 삭제된 태스크들
      const tasksToDelete = existingTasks.filter(t => !newTaskIds.has(t.id));

      // 생성 요청들
      for (const task of tasksToCreate) {
        const response = await fetch(
          `/api/admin/categories/${categoryId}/tasks`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: task.title,
              description: task.description,
              order_index: task.order_index,
              is_required: task.is_required,
              difficulty_level: task.difficulty_level,
              estimated_minutes: task.estimated_minutes,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '태스크 생성에 실패했습니다');
        }
      }

      // 수정 요청들
      for (const task of tasksToUpdate) {
        const response = await fetch(
          `/api/admin/categories/${categoryId}/tasks/${task.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: task.title,
              description: task.description,
              order_index: task.order_index,
              is_required: task.is_required,
              difficulty_level: task.difficulty_level,
              estimated_minutes: task.estimated_minutes,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '태스크 수정에 실패했습니다');
        }
      }

      // 삭제 요청들
      for (const task of tasksToDelete) {
        const response = await fetch(
          `/api/admin/categories/${categoryId}/tasks/${task.id}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '태스크 삭제에 실패했습니다');
        }
      }

      // 순서 변경이 있는 경우 reorder API 호출
      if (tasks.length > 0) {
        const reorderData = tasks
          .filter(t => t.id) // ID가 있는 태스크들만
          .map(t => ({ id: t.id, order_index: t.order_index }));

        if (reorderData.length > 0) {
          const response = await fetch(
            `/api/admin/categories/${categoryId}/tasks/reorder`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tasks: reorderData }),
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '태스크 순서 변경에 실패했습니다');
          }
        }
      }

      // 데이터 다시 로드
      await loadTaskTemplates();
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '저장 중 오류가 발생했습니다'
      );
    }
  };

  useEffect(() => {
    if (categoryId) {
      loadTaskTemplates();
    }
  }, [categoryId]);

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-8'>
        <Card className='p-6 bg-red-50 border-red-200'>
          <div className='text-red-700 mb-4'>{error}</div>
          <Button onClick={loadTaskTemplates} variant='outline'>
            다시 시도
          </Button>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-8'>
        <Card className='p-6'>
          <div className='text-gray-500'>데이터를 불러올 수 없습니다.</div>
        </Card>
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto px-4 py-8'>
      {/* 헤더 */}
      <div className='mb-8'>
        <div className='flex items-center gap-4 mb-4'>
          <Button
            onClick={() => router.back()}
            variant='outline'
            className='flex items-center gap-2'
          >
            ← 뒤로가기
          </Button>
        </div>

        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          태스크 템플릿 관리
        </h1>
        <p className='text-gray-600'>
          <span className='font-medium'>{data.category.name}</span> 카테고리의
          구조화된 일지용 태스크 템플릿을 관리합니다.
        </p>
      </div>

      {/* 카테고리 정보 */}
      <Card className='p-6 mb-8 bg-blue-50 border-blue-200'>
        <h2 className='text-lg font-semibold text-blue-900 mb-2'>
          📋 {data.category.name}
        </h2>
        {data.category.description && (
          <p className='text-blue-800 text-sm mb-4'>
            {data.category.description}
          </p>
        )}
        <div className='flex items-center gap-4 text-sm text-blue-700'>
          <span>총 {data.tasks.length}개 태스크</span>
          <span>•</span>
          <span>
            필수 태스크: {data.tasks.filter(t => t.is_required).length}개
          </span>
        </div>
      </Card>

      {/* 태스크 템플릿 에디터 */}
      {isEditing ? (
        <TaskTemplateEditor
          categoryId={categoryId}
          initialTasks={data.tasks}
          onSave={handleSaveTasks}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div>
          {/* 태스크 목록 */}
          {data.tasks.length > 0 ? (
            <div className='space-y-4 mb-8'>
              {data.tasks
                .sort((a, b) => a.order_index - b.order_index)
                .map((task, index) => (
                  <Card key={task.id} className='p-6'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-3 mb-2'>
                          <span className='text-sm font-medium text-gray-500'>
                            #{index + 1}
                          </span>
                          <h3 className='text-lg font-semibold text-gray-900'>
                            {task.title}
                          </h3>
                          <div className='flex items-center gap-2'>
                            {task.is_required && (
                              <span className='px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full'>
                                필수
                              </span>
                            )}
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                task.difficulty_level === 'easy'
                                  ? 'bg-green-100 text-green-800'
                                  : task.difficulty_level === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {task.difficulty_level === 'easy'
                                ? '쉬움'
                                : task.difficulty_level === 'medium'
                                  ? '보통'
                                  : '어려움'}
                            </span>
                            {task.estimated_minutes && (
                              <span className='px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full'>
                                ~{task.estimated_minutes}분
                              </span>
                            )}
                          </div>
                        </div>
                        {task.description && (
                          <p className='text-gray-600 text-sm'>
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          ) : (
            <Card className='p-12 text-center mb-8'>
              <div className='text-gray-400 text-6xl mb-4'>📝</div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                태스크 템플릿이 없습니다
              </h3>
              <p className='text-gray-600 mb-6'>
                학생들이 구조화된 일지를 작성할 때 사용할 태스크 템플릿을
                추가해보세요.
              </p>
            </Card>
          )}

          {/* 액션 버튼들 */}
          <div className='flex justify-center gap-4'>
            <Button
              onClick={() => setIsEditing(true)}
              className='flex items-center gap-2'
            >
              ✏️ 태스크 템플릿 편집
            </Button>
          </div>
        </div>
      )}

      {/* 도움말 */}
      <Card className='mt-12 p-6 bg-gray-50'>
        <h3 className='text-lg font-semibold text-gray-900 mb-3'>
          💡 태스크 템플릿 관리 가이드
        </h3>
        <div className='text-gray-700 text-sm space-y-2'>
          <p>
            • <strong>태스크 순서</strong>: 드래그 앤 드롭으로 태스크 순서를
            변경할 수 있습니다.
          </p>
          <p>
            • <strong>필수 태스크</strong>: 학생이 반드시 완료해야 하는 태스크로
            설정할 수 있습니다.
          </p>
          <p>
            • <strong>난이도 설정</strong>: 태스크의 난이도를 설정하여
            학생들에게 가이드를 제공합니다.
          </p>
          <p>
            • <strong>예상 소요시간</strong>: 태스크 완료에 필요한 예상 시간을
            설정할 수 있습니다.
          </p>
          <p>
            • <strong>삭제 제한</strong>: 이미 사용된 태스크는 삭제할 수 없으며,
            비활성화를 고려해보세요.
          </p>
        </div>
      </Card>
    </div>
  );
}
