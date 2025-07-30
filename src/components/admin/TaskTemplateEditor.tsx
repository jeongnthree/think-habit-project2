'use client';

import { useEffect, useState } from 'react';

import { Button, Card } from '@/components/ui';
import { DifficultyLevel, TaskTemplate } from '@/types/database';

interface TaskTemplateEditorProps {
  categoryId: string;
  initialTasks: TaskTemplate[];
  onSave: (tasks: TaskTemplate[]) => Promise<void>;
  onCancel: () => void;
}

interface TaskFormData {
  id?: string;
  title: string;
  description: string;
  order_index: number;
  is_required: boolean;
  difficulty_level: DifficultyLevel;
  estimated_minutes: number | null;
}

export function TaskTemplateEditor({
  categoryId,
  initialTasks,
  onSave,
  onCancel,
}: TaskTemplateEditorProps) {
  const [tasks, setTasks] = useState<TaskFormData[]>([]);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 초기 데이터 설정
  useEffect(() => {
    const formTasks = initialTasks
      .sort((a, b) => a.order_index - b.order_index)
      .map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        order_index: task.order_index,
        is_required: task.is_required,
        difficulty_level: task.difficulty_level,
        estimated_minutes: task.estimated_minutes,
      }));
    setTasks(formTasks);
  }, [initialTasks]);

  // 새 태스크 추가
  const addTask = () => {
    const newTask: TaskFormData = {
      title: '',
      description: '',
      order_index: tasks.length,
      is_required: true,
      difficulty_level: 'medium',
      estimated_minutes: null,
    };
    setTasks([...tasks, newTask]);
  };

  // 태스크 삭제
  const removeTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    // 순서 재정렬
    const reorderedTasks = newTasks.map((task, i) => ({
      ...task,
      order_index: i,
    }));
    setTasks(reorderedTasks);
  };

  // 태스크 업데이트
  const updateTask = (index: number, field: keyof TaskFormData, value: any) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value } as TaskFormData;
    setTasks(newTasks);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newTasks = [...tasks];
    const draggedTask = newTasks[draggedIndex];

    if (!draggedTask) {
      setDraggedIndex(null);
      return;
    }

    // 드래그된 태스크 제거
    newTasks.splice(draggedIndex, 1);

    // 새 위치에 삽입
    newTasks.splice(dropIndex, 0, draggedTask);

    // 순서 재정렬
    const reorderedTasks = newTasks.map((task, i) => ({
      ...task,
      order_index: i,
    }));

    setTasks(reorderedTasks);
    setDraggedIndex(null);
  };

  // 저장 처리
  const handleSave = async () => {
    // 유효성 검사
    const invalidTasks = tasks.filter(task => !task.title.trim());
    if (invalidTasks.length > 0) {
      alert('모든 태스크에 제목을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);

      // TaskFormData를 TaskTemplate 형식으로 변환
      const taskTemplates: TaskTemplate[] = tasks.map(task => ({
        id: task.id || '',
        category_id: categoryId,
        title: task.title.trim(),
        description: task.description.trim() || null,
        order_index: task.order_index,
        is_required: task.is_required,
        difficulty_level: task.difficulty_level,
        estimated_minutes: task.estimated_minutes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await onSave(taskTemplates);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* 헤더 */}
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-gray-900'>
          태스크 템플릿 편집
        </h2>
        <div className='flex items-center gap-3'>
          <Button onClick={addTask} variant='outline'>
            + 태스크 추가
          </Button>
        </div>
      </div>

      {/* 태스크 목록 */}
      <div className='space-y-4'>
        {tasks.map((task, index) => (
          <Card
            key={index}
            className={`p-6 transition-all ${
              draggedIndex === index ? 'opacity-50 scale-95' : ''
            }`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, index)}
          >
            <div className='flex items-start gap-4'>
              {/* 드래그 핸들 */}
              <div className='flex flex-col items-center gap-2 pt-2'>
                <div className='cursor-move text-gray-400 hover:text-gray-600'>
                  ⋮⋮
                </div>
                <span className='text-sm font-medium text-gray-500'>
                  #{index + 1}
                </span>
              </div>

              {/* 태스크 폼 */}
              <div className='flex-1 space-y-4'>
                {/* 제목 */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    태스크 제목 *
                  </label>
                  <input
                    type='text'
                    value={task.title}
                    onChange={e => updateTask(index, 'title', e.target.value)}
                    placeholder='태스크 제목을 입력하세요'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    태스크 설명
                  </label>
                  <textarea
                    value={task.description}
                    onChange={e =>
                      updateTask(index, 'description', e.target.value)
                    }
                    placeholder='태스크에 대한 자세한 설명을 입력하세요'
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>

                {/* 옵션들 */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  {/* 필수 여부 */}
                  <div>
                    <label className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={task.is_required}
                        onChange={e =>
                          updateTask(index, 'is_required', e.target.checked)
                        }
                        className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                      />
                      <span className='text-sm font-medium text-gray-700'>
                        필수 태스크
                      </span>
                    </label>
                  </div>

                  {/* 난이도 */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      난이도
                    </label>
                    <select
                      value={task.difficulty_level}
                      onChange={e =>
                        updateTask(
                          index,
                          'difficulty_level',
                          e.target.value as DifficultyLevel
                        )
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    >
                      <option value='easy'>쉬움</option>
                      <option value='medium'>보통</option>
                      <option value='hard'>어려움</option>
                    </select>
                  </div>

                  {/* 예상 소요시간 */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      예상 시간 (분)
                    </label>
                    <input
                      type='number'
                      value={task.estimated_minutes || ''}
                      onChange={e =>
                        updateTask(
                          index,
                          'estimated_minutes',
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      placeholder='예: 10'
                      min='1'
                      max='300'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                </div>
              </div>

              {/* 삭제 버튼 */}
              <Button
                onClick={() => removeTask(index)}
                variant='outline'
                className='text-red-600 hover:text-red-700 hover:bg-red-50'
              >
                🗑️
              </Button>
            </div>
          </Card>
        ))}

        {/* 빈 상태 */}
        {tasks.length === 0 && (
          <Card className='p-12 text-center'>
            <div className='text-gray-400 text-6xl mb-4'>📝</div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              태스크가 없습니다
            </h3>
            <p className='text-gray-600 mb-6'>첫 번째 태스크를 추가해보세요.</p>
            <Button onClick={addTask}>+ 태스크 추가</Button>
          </Card>
        )}
      </div>

      {/* 액션 버튼들 */}
      <div className='flex justify-end gap-4 pt-6 border-t'>
        <Button onClick={onCancel} variant='outline' disabled={saving}>
          취소
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || tasks.length === 0}
          className='flex items-center gap-2'
        >
          {saving ? (
            <>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
              저장 중...
            </>
          ) : (
            '💾 저장'
          )}
        </Button>
      </div>

      {/* 도움말 */}
      <Card className='p-4 bg-blue-50 border-blue-200'>
        <div className='text-blue-800 text-sm'>
          <strong>💡 편집 팁:</strong>
          <ul className='mt-2 space-y-1 list-disc list-inside'>
            <li>태스크를 드래그하여 순서를 변경할 수 있습니다</li>
            <li>필수 태스크는 학생이 반드시 완료해야 합니다</li>
            <li>난이도와 예상 시간은 학생들에게 가이드를 제공합니다</li>
            <li>모든 태스크에는 제목이 필요합니다</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
