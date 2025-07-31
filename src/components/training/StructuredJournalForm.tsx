import { Button, Card, ConfirmModal } from '@/components/ui';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingOverlay } from '@/components/ui/LoadingStates';
import { Category, TaskTemplate } from '@/types/database';
import React, { useCallback, useEffect, useState } from 'react';

interface CategoryWithTasks extends Category {
  task_templates: TaskTemplate[];
}

interface StructuredJournalFormProps {
  category: CategoryWithTasks;
  studentId: string;
  onSave: () => void;
  onCancel: () => void;
}

interface TaskCompletion {
  task_template_id: string;
  is_completed: boolean;
  completion_note: string;
}

interface AutoSaveStatus {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export const StructuredJournalForm: React.FC<StructuredJournalFormProps> = ({
  category,
  studentId,
  onSave,
  onCancel,
}) => {
  // Network status and offline storage
  const { isOnline, isSlowConnection, getRecommendedBehavior } =
    useNetworkStatus();
  const [offlineDraft, setOfflineDraft] = useOfflineStorage(
    `journal_draft_${category.id}`,
    null
  );

  // Form validation
  const {
    values,
    isValid,
    isSubmitting,
    hasErrors,
    isDirty,
    setFieldValue,
    setFieldError,
    setFieldErrors,
    getFieldProps,
    submitForm,
    resetForm,
  } = useFormValidation({
    initialValues: {
      title: `${category.name} 훈련 일지 - ${new Date().toLocaleDateString()}`,
      task_completions: [] as TaskCompletion[],
      reflection: '',
      is_public: true, // 기본값을 공개로 설정
      category_id: category.id,
      journal_type: 'structured' as const,
    },
    validationRules: [
      {
        field: 'title',
        validator: value => {
          if (!value || value.trim().length === 0) {
            return '제목을 입력해주세요.';
          }
          if (value.trim().length > 200) {
            return '제목은 200자 이하로 입력해주세요.';
          }
          return null;
        },
      },
      {
        field: 'task_completions',
        validator: (value, formData) => {
          if (!value || value.length === 0) {
            return '최소 하나의 태스크가 필요합니다.';
          }

          // Check if at least one task is completed
          const hasCompletedTask = value.some(
            (tc: TaskCompletion) => tc.is_completed
          );
          if (!hasCompletedTask) {
            return '최소 하나의 태스크를 완료해주세요.';
          }

          // Check required tasks
          const requiredTasksValidation =
            customValidationRules.validateRequiredTasks(
              value,
              category.task_templates
            );
          if (!requiredTasksValidation.isValid) {
            return requiredTasksValidation.message || null;
          }

          return null;
        },
      },
      {
        field: 'reflection',
        validator: value => {
          if (value && value.length > 1000) {
            return '성찰 내용은 1000자 이하로 입력해주세요.';
          }
          return null;
        },
      },
    ],
    validateOnChange: true,
    validateOnBlur: true,
  });

  // Error state
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Auto-save functionality
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    lastSaved: null,
    isSaving: false,
    hasUnsavedChanges: false,
  });

  // Task completion confirmation
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    taskId: string;
    taskTitle: string;
    isCompleting: boolean;
  }>({
    isOpen: false,
    taskId: '',
    taskTitle: '',
    isCompleting: false,
  });

  // Network behavior recommendations
  const networkBehavior = getRecommendedBehavior();

  // Initialize task completions
  useEffect(() => {
    if (category.task_templates && values.task_completions.length === 0) {
      const sortedTasks = [...category.task_templates].sort(
        (a, b) => a.order_index - b.order_index
      );
      const initialCompletions = sortedTasks.map(task => ({
        task_template_id: task.id,
        is_completed: false,
        completion_note: '',
      }));
      setFieldValue('task_completions', initialCompletions);
    }
  }, [category.task_templates, values.task_completions.length, setFieldValue]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!isDirty || autoSaveStatus.isSaving || !networkBehavior.allowAutoSave) {
      return;
    }

    try {
      setAutoSaveStatus(prev => ({ ...prev, isSaving: true }));

      const draftData = {
        ...values,
        is_draft: true,
        timestamp: new Date().toISOString(),
      };

      // Save to offline storage
      setOfflineDraft(draftData);

      setAutoSaveStatus(prev => ({
        ...prev,
        lastSaved: new Date(),
        isSaving: false,
        hasUnsavedChanges: false,
      }));
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus(prev => ({ ...prev, isSaving: false }));
    }
  }, [
    values,
    isDirty,
    autoSaveStatus.isSaving,
    networkBehavior.allowAutoSave,
    setOfflineDraft,
  ]);

  // Auto-save timer
  useEffect(() => {
    const timer = setTimeout(() => {
      autoSave();
    }, 3000); // Auto-save every 3 seconds

    return () => clearTimeout(timer);
  }, [autoSave]);

  // Load draft from offline storage on mount
  useEffect(() => {
    if (offlineDraft && offlineDraft.timestamp) {
      const draftAge = Date.now() - new Date(offlineDraft.timestamp).getTime();

      // Only load draft if it's less than 24 hours old
      if (draftAge < 24 * 60 * 60 * 1000) {
        setFieldValue('title', offlineDraft.title || values.title);
        setFieldValue(
          'task_completions',
          offlineDraft.task_completions || values.task_completions
        );
        setFieldValue('reflection', offlineDraft.reflection || '');
        setFieldValue('is_public', offlineDraft.is_public || false);
        setAutoSaveStatus(prev => ({
          ...prev,
          lastSaved: new Date(offlineDraft.timestamp),
        }));
      } else {
        // Remove old draft
        setOfflineDraft(null);
      }
    }
  }, [offlineDraft, setFieldValue, setOfflineDraft]);

  // Mark as having unsaved changes when form data changes
  useEffect(() => {
    if (isDirty) {
      setAutoSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true }));
    }
  }, [isDirty]);

  // 태스크 완료 상태 업데이트 with confirmation
  const updateTaskCompletion = (
    taskId: string,
    field: keyof TaskCompletion,
    value: boolean | string
  ) => {
    if (field === 'is_completed' && typeof value === 'boolean') {
      const task = category.task_templates.find(t => t.id === taskId);
      if (task && value === true) {
        // Show confirmation dialog for task completion
        setConfirmationModal({
          isOpen: true,
          taskId,
          taskTitle: task.title,
          isCompleting: true,
        });
        return;
      }
    }

    const updatedCompletions = values.task_completions.map(tc =>
      tc.task_template_id === taskId ? { ...tc, [field]: value } : tc
    );
    setFieldValue('task_completions', updatedCompletions);
  };

  // Handle task completion confirmation
  const handleTaskCompletionConfirm = () => {
    const { taskId } = confirmationModal;
    const updatedCompletions = values.task_completions.map(tc =>
      tc.task_template_id === taskId ? { ...tc, is_completed: true } : tc
    );
    setFieldValue('task_completions', updatedCompletions);
    setConfirmationModal({
      isOpen: false,
      taskId: '',
      taskTitle: '',
      isCompleting: false,
    });
  };

  // 진행률 계산 (real-time)
  const getProgress = useCallback(() => {
    if (values.task_completions.length === 0)
      return { completed: 0, total: 0, percentage: 0 };

    const completed = values.task_completions.filter(
      tc => tc.is_completed
    ).length;
    const total = values.task_completions.length;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  }, [values.task_completions]);

  const progress = getProgress();

  // 필수 태스크 완료 여부 확인
  const getRequiredTasksStatus = useCallback(() => {
    const requiredTasks = category.task_templates.filter(
      task => task.is_required
    );
    const completedRequiredTasks = values.task_completions.filter(tc => {
      const task = category.task_templates.find(
        t => t.id === tc.task_template_id
      );
      return task?.is_required && tc.is_completed;
    });

    return {
      required: requiredTasks.length,
      completed: completedRequiredTasks.length,
      allCompleted: requiredTasks.length === completedRequiredTasks.length,
    };
  }, [category.task_templates, values.task_completions]);

  const requiredStatus = getRequiredTasksStatus();

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    await submitForm(
      async formValues => {
        try {
          // Validate with Zod schema
          const validation = validateStructuredJournal(formValues);
          if (!validation.success) {
            setFieldErrors(validation.fieldErrors);
            throw new Error('입력 내용을 확인해주세요.');
          }

          const journalData = {
            ...validation.data,
            task_completions: validation.data.task_completions.map(tc => ({
              task_template_id: tc.task_template_id,
              is_completed: tc.is_completed,
              completion_note: tc.completion_note?.trim() || null,
            })),
          };

          // Submit with retry mechanism
          const result = await submitFormWithRetry(
            '/api/training/journals/structured',
            journalData,
            {
              retryOptions: {
                maxAttempts: isOnline ? 3 : 1,
                baseDelay: 1000,
              },
              onRetry: (attempt, error) => {
                setRetryCount(attempt);
                console.log(`Retry attempt ${attempt}:`, error.message);
              },
            }
          );

          // Clear draft after successful submission
          setOfflineDraft(null);
          onSave();
        } catch (error: any) {
          const recoveryStrategy = getRecoveryStrategy(error);
          setSubmitError(recoveryStrategy.message);

          // Handle specific error types
          if (error.isValidationError && error.validationErrors) {
            const fieldErrors: Record<string, string> = {};
            error.validationErrors.forEach((ve: any) => {
              fieldErrors[ve.field] = ve.message;
            });
            setFieldErrors(fieldErrors);
          }

          throw error; // Re-throw to be handled by submitForm
        }
      },
      {
        validateBeforeSubmit: true,
        onValidationError: errors => {
          const firstError = Object.values(errors).find(
            error => error !== null
          );
          if (firstError) {
            setSubmitError(firstError);
          }
        },
      }
    );
  };

  const sortedTasks = [...category.task_templates].sort(
    (a, b) => a.order_index - b.order_index
  );

  return (
    <LoadingOverlay
      isLoading={isSubmitting}
      message={
        retryCount > 0
          ? `재시도 중... (${retryCount}회)`
          : '일지를 저장하는 중...'
      }
    >
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* 헤더 */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>
            📋 구조화된 일지 작성
          </h1>
          <p className='text-gray-600 mt-2'>
            {category.name} - 체크리스트를 완료하며 체계적으로 훈련하세요
          </p>

          {/* Auto-save status */}
          <div className='mt-2 text-xs text-gray-500'>
            {autoSaveStatus.isSaving && (
              <span className='flex items-center gap-1'>
                <div className='animate-spin rounded-full h-3 w-3 border-b border-gray-400'></div>
                자동 저장 중...
              </span>
            )}
            {autoSaveStatus.lastSaved && !autoSaveStatus.isSaving && (
              <span>
                마지막 저장: {autoSaveStatus.lastSaved.toLocaleTimeString()}
              </span>
            )}
            {autoSaveStatus.hasUnsavedChanges && !autoSaveStatus.isSaving && (
              <span className='text-orange-600'>
                저장되지 않은 변경사항이 있습니다
              </span>
            )}
          </div>
        </div>

        {/* 실시간 진행률 표시 */}
        <Card className='p-6 mb-6 bg-gradient-to-r from-blue-50 to-purple-50'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>훈련 진행률</h3>
            <span className='text-2xl font-bold text-blue-600'>
              {progress.percentage}%
            </span>
          </div>

          <div className='w-full bg-gray-200 rounded-full h-3 mb-4'>
            <div
              className='bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out'
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          <div className='flex justify-between text-sm text-gray-600'>
            <span>
              완료: {progress.completed}/{progress.total} 태스크
            </span>
            <span>
              필수: {requiredStatus.completed}/{requiredStatus.required}
            </span>
          </div>

          {/* Progress milestones */}
          {progress.percentage >= 25 && progress.percentage < 50 && (
            <div className='mt-2 text-sm text-blue-600'>
              🎯 좋은 시작입니다!
            </div>
          )}
          {progress.percentage >= 50 && progress.percentage < 75 && (
            <div className='mt-2 text-sm text-blue-600'>
              💪 절반을 넘었습니다!
            </div>
          )}
          {progress.percentage >= 75 && progress.percentage < 100 && (
            <div className='mt-2 text-sm text-blue-600'>
              🔥 거의 다 왔습니다!
            </div>
          )}
          {progress.percentage === 100 && (
            <div className='mt-2 text-sm text-green-600'>
              🎉 모든 태스크를 완료했습니다!
            </div>
          )}
        </Card>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* 제목 입력 */}
          <Card className='p-6'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              일지 제목 *
            </label>
            <input
              type='text'
              {...getFieldProps('title')}
              onChange={e => setFieldValue('title', e.target.value)}
              placeholder='일지 제목을 입력하세요'
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldProps('title').error
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {getFieldProps('title').error && (
              <p className='mt-1 text-sm text-red-600'>
                {getFieldProps('title').error}
              </p>
            )}
          </Card>

          {/* 카테고리 가이드 */}
          {category.template && (
            <Card className='p-6 bg-blue-50 border-blue-200'>
              <h3 className='text-sm font-medium text-blue-900 mb-2'>
                📝 {category.name} 훈련 가이드
              </h3>
              <div className='text-sm text-blue-800 whitespace-pre-line'>
                {category.template}
              </div>
            </Card>
          )}

          {/* 태스크 체크리스트 */}
          <Card className='p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              ✅ 훈련 태스크 체크리스트
            </h3>

            <div className='space-y-4'>
              {sortedTasks.map((task, index) => {
                const completion = values.task_completions.find(
                  tc => tc.task_template_id === task.id
                );

                return (
                  <div
                    key={task.id}
                    className={`border rounded-lg p-4 transition-all duration-300 ${
                      completion?.is_completed
                        ? 'bg-green-50 border-green-200 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className='flex items-start gap-4'>
                      {/* 체크박스 */}
                      <div className='flex items-center pt-1'>
                        <input
                          type='checkbox'
                          id={`task-${task.id}`}
                          checked={completion?.is_completed || false}
                          onChange={e =>
                            updateTaskCompletion(
                              task.id,
                              'is_completed',
                              e.target.checked
                            )
                          }
                          className='h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors'
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* 태스크 내용 */}
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-2'>
                          <label
                            htmlFor={`task-${task.id}`}
                            className={`text-base font-medium cursor-pointer transition-all ${
                              completion?.is_completed
                                ? 'text-green-800 line-through'
                                : 'text-gray-900'
                            }`}
                          >
                            {index + 1}. {task.title}
                          </label>

                          {/* 완료 체크 아이콘 */}
                          {completion?.is_completed && (
                            <span className='text-green-600 animate-pulse'>
                              ✓
                            </span>
                          )}

                          {/* 태그들 */}
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

                        {/* 태스크 설명 */}
                        {task.description && (
                          <p
                            className={`text-sm mb-3 ${
                              completion?.is_completed
                                ? 'text-green-700'
                                : 'text-gray-600'
                            }`}
                          >
                            {task.description}
                          </p>
                        )}

                        {/* 완료 메모 */}
                        <div>
                          <label className='block text-xs font-medium text-gray-500 mb-1'>
                            완료 메모 (선택사항)
                          </label>
                          <textarea
                            value={completion?.completion_note || ''}
                            onChange={e =>
                              updateTaskCompletion(
                                task.id,
                                'completion_note',
                                e.target.value
                              )
                            }
                            placeholder='이 태스크를 어떻게 완료했는지 간단히 메모해보세요...'
                            rows={2}
                            className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors'
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 전체 성찰 */}
          <Card className='p-6'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              💭 오늘의 전체 성찰
            </label>
            <textarea
              {...getFieldProps('reflection')}
              onChange={e => setFieldValue('reflection', e.target.value)}
              placeholder='오늘의 훈련을 통해 느낀 점이나 깨달은 점을 자유롭게 작성해주세요...'
              rows={6}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                getFieldProps('reflection').error
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            <div className='mt-1 flex justify-between text-xs text-gray-500'>
              <span>{values.reflection.length}/1000자</span>
              {getFieldProps('reflection').error && (
                <span className='text-red-600'>
                  {getFieldProps('reflection').error}
                </span>
              )}
            </div>
          </Card>

          {/* 공개 설정 */}
          <Card className='p-6'>
            <label className='block text-sm font-medium text-gray-700 mb-4'>
              공개 설정
            </label>
            <div className='space-y-2'>
              <label className='flex items-center'>
                <input
                  type='radio'
                  name='visibility'
                  checked={!values.is_public}
                  onChange={() => setFieldValue('is_public', false)}
                  className='mr-3'
                  disabled={isSubmitting}
                />
                <span className='text-sm'>🔒 나만 보기</span>
              </label>
              <label className='flex items-center'>
                <input
                  type='radio'
                  name='visibility'
                  checked={values.is_public}
                  onChange={() => setFieldValue('is_public', true)}
                  className='mr-3'
                  disabled={isSubmitting}
                />
                <span className='text-sm'>🌍 커뮤니티에 공개</span>
              </label>
            </div>
          </Card>

          {/* Network status warning */}
          {!isOnline && (
            <ErrorMessage
              type='warning'
              title='오프라인 모드'
              message='현재 인터넷에 연결되어 있지 않습니다. 작성한 내용은 자동으로 저장되며, 연결이 복구되면 제출할 수 있습니다.'
              showRetry={false}
            />
          )}

          {isSlowConnection && (
            <ErrorMessage
              type='info'
              title='느린 연결'
              message='현재 인터넷 연결이 느립니다. 자동 저장이 비활성화되었습니다.'
              showRetry={false}
            />
          )}

          {/* 에러 메시지 */}
          {submitError && (
            <ErrorMessage
              type='error'
              title='제출 오류'
              message={submitError}
              onRetry={
                retryCount < 3
                  ? () => handleSubmit({ preventDefault: () => {} } as any)
                  : undefined
              }
              showRetry={retryCount < 3}
            />
          )}

          {/* Validation errors */}
          {hasErrors && (
            <ErrorMessage
              type='warning'
              title='입력 확인 필요'
              message='아래 항목들을 확인해주세요.'
              showRetry={false}
            />
          )}

          {/* 버튼 */}
          <div className='flex justify-end space-x-4'>
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type='submit'
              disabled={
                !isValid ||
                isSubmitting ||
                (!isOnline && !networkBehavior.allowUploads)
              }
              loading={isSubmitting}
              className='flex items-center gap-2'
            >
              {!isOnline ? '📱 오프라인 저장' : '💾 일지 저장'}
            </Button>
            {retryCount > 0 && (
              <span className='text-sm text-gray-500'>
                재시도 {retryCount}회
              </span>
            )}
          </div>
        </form>

        {/* Task Completion Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmationModal.isOpen}
          onClose={() =>
            setConfirmationModal({
              isOpen: false,
              taskId: '',
              taskTitle: '',
              isCompleting: false,
            })
          }
          onConfirm={handleTaskCompletionConfirm}
          title='태스크 완료 확인'
          message={`"${confirmationModal.taskTitle}" 태스크를 완료하시겠습니까?`}
          confirmLabel='완료'
          cancelLabel='취소'
          type='info'
        />
      </div>
    </LoadingOverlay>
  );
};
