import { createClient } from '@/lib/supabase/server';
import {
    createErrorResponse,
    createSuccessResponse,
    withPerformanceMonitoring,
    validateRequest,
    logError,
    logInfo,
    ERROR_CODES,
    HTTP_STATUS,
    validateInput,
    withDatabaseTransaction
} from '@/utils/server-validation';
import { structuredJournalCreateSchema } from '@/utils/api-schemas';
import { NextRequest } from 'next/server';



// POST /api/training/journals/structured - 구조화된 일지 제출
export async function POST(request: NextRequest) {
  return withPerformanceMonitoring(async () => {
    // Request validation and rate limiting
    const requestValidation = await validateRequest(request, {
      requireAuth: true,
      rateLimitKey: `structured_journal_${request.ip}`,
      maxRequestSize: 1024 * 1024, // 1MB
    });

    if (!requestValidation.success) {
      return requestValidation.response;
    }

    const { requestId } = requestValidation;

    try {
      const supabase = createClient();

      // 사용자 인증 확인
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      
      if (authError || !user) {
        logError(new Error(`Authentication failed: ${authError?.message || 'No user found'}`), { 
          requestId, 
          endpoint: 'POST /api/training/journals/structured'
        });
        return createErrorResponse(
          '인증이 필요합니다', 
          ERROR_CODES.UNAUTHORIZED, 
          HTTP_STATUS.UNAUTHORIZED,
          undefined,
          undefined,
          requestId
        );
      }

      const body = await request.json();

      // 입력 데이터 검증
      const validation = validateInput(structuredJournalCreateSchema, body, requestId);
      if (!validation.success) {
        return validation.response;
      }

      const journalData = validation.data;

      // 카테고리 존재 및 접근 권한 확인
      const categoryResult = await withDatabaseTransaction(async () => {
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .select('id, name, is_active')
          .eq('id', journalData.category_id)
          .single();

        if (categoryError || !category) {
          throw new Error('카테고리를 찾을 수 없습니다');
        }

        if (!category.is_active) {
          throw new Error('비활성화된 카테고리입니다');
        }

        return category;
      }, requestId);

      if (!categoryResult.success) {
        return categoryResult.response;
      }

      const category = categoryResult.data;

      // 사용자가 해당 카테고리에 할당되어 있는지 확인
      const assignmentResult = await withDatabaseTransaction(async () => {
        const { data: assignment, error: assignmentError } = await supabase
          .from('assignments')
          .select('id, weekly_goal, is_active, start_date, end_date')
          .eq('student_id', user.id)
          .eq('category_id', journalData.category_id)
          .single();

        if (assignmentError || !assignment) {
          throw new Error('해당 카테고리에 접근할 권한이 없습니다');
        }

        if (!assignment.is_active) {
          throw new Error('비활성화된 할당입니다');
        }

        // Check assignment date range
        const now = new Date();
        if (assignment.start_date && new Date(assignment.start_date) > now) {
          throw new Error('할당 시작일이 아직 도래하지 않았습니다');
        }
        if (assignment.end_date && new Date(assignment.end_date) < now) {
          throw new Error('할당 기간이 만료되었습니다');
        }

        return assignment;
      }, requestId);

      if (!assignmentResult.success) {
        return assignmentResult.response;
      }

      const assignment = assignmentResult.data;

      // 태스크 템플릿 유효성 확인 및 필수 태스크 검증
      const taskValidationResult = await withDatabaseTransaction(async () => {
        const taskTemplateIds = journalData.task_completions.map(
          tc => tc.task_template_id
        );

        const { data: taskTemplates, error: taskError } = await supabase
          .from('task_templates')
          .select('id, title, is_required, category_id')
          .eq('category_id', journalData.category_id)
          .in('id', taskTemplateIds);

        if (taskError) {
          throw new Error('태스크 템플릿 조회 중 오류가 발생했습니다');
        }

        if (!taskTemplates || taskTemplates.length !== taskTemplateIds.length) {
          const missingIds = taskTemplateIds.filter(
            id => !taskTemplates?.some(t => t.id === id)
          );
          throw new Error(`유효하지 않은 태스크 템플릿이 포함되어 있습니다: ${missingIds.join(', ')}`);
        }

        // Verify all tasks belong to the correct category
        const invalidTasks = taskTemplates.filter(t => t.category_id !== journalData.category_id);
        if (invalidTasks.length > 0) {
          throw new Error('다른 카테고리의 태스크가 포함되어 있습니다');
        }

        // 필수 태스크 완료 확인
        const requiredTasks = taskTemplates.filter(t => t.is_required);
        const completedRequiredTasks = journalData.task_completions.filter(tc => {
          const task = taskTemplates.find(t => t.id === tc.task_template_id);
          return task?.is_required && tc.is_completed;
        });

        if (completedRequiredTasks.length < requiredTasks.length) {
          const missingTasks = requiredTasks
            .filter(task => 
              !completedRequiredTasks.some(ct => {
                const ctTask = taskTemplates.find(t => t.id === ct.task_template_id);
                return ctTask?.id === task.id;
              })
            )
            .map(task => ({ id: task.id, title: task.title }));

          const error = new Error(`필수 태스크를 모두 완료해주세요. (${completedRequiredTasks.length}/${requiredTasks.length})`) as any;
          error.code = ERROR_CODES.VALIDATION_FAILED;
          error.details = {
            required_tasks: requiredTasks.length,
            completed_required_tasks: completedRequiredTasks.length,
            missing_tasks: missingTasks,
          };
          throw error;
        }

        return { taskTemplates, requiredTasks, completedRequiredTasks };
      }, requestId);

      if (!taskValidationResult.success) {
        return taskValidationResult.response;
      }

      const { taskTemplates, requiredTasks, completedRequiredTasks } = taskValidationResult.data;

      // 트랜잭션으로 일지와 태스크 완료 기록 저장
      const journalCreationResult = await withDatabaseTransaction(async () => {
        // Check for duplicate journal (same category, same day)
        const today = new Date().toISOString().split('T')[0];
        const { data: existingJournal } = await supabase
          .from('journals')
          .select('id, title')
          .eq('student_id', user.id)
          .eq('category_id', journalData.category_id)
          .eq('journal_type', 'structured')
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${today}T23:59:59.999Z`)
          .single();

        if (existingJournal) {
          const error = new Error('오늘 이미 해당 카테고리의 구조화된 일지를 작성했습니다') as any;
          error.code = ERROR_CODES.DUPLICATE_RESOURCE;
          error.details = { existing_journal: existingJournal };
          throw error;
        }

        // Create journal
        const { data: journal, error: journalError } = await supabase
          .from('journals')
          .insert({
            student_id: user.id,
            category_id: journalData.category_id,
            title: journalData.title,
            content: journalData.reflection || '',
            journal_type: 'structured',
            is_public: journalData.is_public,
          })
          .select()
          .single();

        if (journalError || !journal) {
          logError(new Error('Journal creation failed'), {
            requestId,
            userId: user.id,
            categoryId: journalData.category_id,
            databaseError: journalError?.message,
          });
          throw new Error('일지 생성에 실패했습니다');
        }

        // Create task completion records
        const taskCompletionRecords = journalData.task_completions.map(tc => ({
          journal_id: journal.id,
          task_template_id: tc.task_template_id,
          is_completed: tc.is_completed,
          completion_note: tc.completion_note || null,
          completed_at: tc.is_completed ? new Date().toISOString() : null,
        }));

        const { error: completionError } = await supabase
          .from('task_completions')
          .insert(taskCompletionRecords);

        if (completionError) {
          logError(new Error('Task completion creation failed'), {
            requestId,
            journalId: journal.id,
            databaseError: completionError?.message,
          });

          // Rollback journal creation
          await supabase.from('journals').delete().eq('id', journal.id);
          throw new Error('태스크 완료 기록 저장에 실패했습니다');
        }

        return journal;
      }, requestId);

      if (!journalCreationResult.success) {
        return journalCreationResult.response;
      }

      const journal = journalCreationResult.data;

      // 진행률 계산
      const completedTasksCount = journalData.task_completions.filter(
        tc => tc.is_completed
      ).length;
      const totalTasksCount = journalData.task_completions.length;
      const completionPercentage = Math.round(
        (completedTasksCount / totalTasksCount) * 100
      );

      // 진행률 업데이트
      const progressResult = await updateProgressTracking(
        supabase,
        user.id,
        journalData.category_id,
        assignment.weekly_goal,
        requestId
      );

      // Log successful journal creation
      logInfo('Structured journal created successfully', {
        requestId,
        userId: user.id,
        journalId: journal.id,
        categoryId: journalData.category_id,
        completionPercentage,
      });

      // 성공 응답 (더 상세한 정보 포함)
      return createSuccessResponse(
        {
          journal: {
            id: journal.id,
            title: journal.title,
            category_id: journal.category_id,
            category_name: category.name,
            created_at: journal.created_at,
            is_public: journal.is_public,
          },
          task_completion: {
            completed_tasks: completedTasksCount,
            total_tasks: totalTasksCount,
            completion_percentage: completionPercentage,
            required_tasks_completed: completedRequiredTasks.length,
            required_tasks_total: requiredTasks.length,
          },
          progress: progressResult,
        },
        '구조화된 일지가 성공적으로 저장되었습니다',
        HTTP_STATUS.CREATED,
        requestId
      );

    } catch (error: any) {
      logError(error, {
        requestId,
        endpoint: 'POST /api/training/journals/structured',
        method: 'POST',
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return createErrorResponse(
        '서버 오류가 발생했습니다',
        ERROR_CODES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        undefined,
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined,
        requestId
      );
    }
  }, 'POST /api/training/journals/structured', requestId);
}

// 진행률 추적 업데이트 함수
async function updateProgressTracking(
  supabase: any,
  userId: string,
  categoryId: string,
  weeklyGoal: number,
  requestId?: string
) {
  try {
    // 현재 주의 시작일 계산 (월요일 기준)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 일요일은 -6, 나머지는 1-dayOfWeek
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartDate = weekStart.toISOString().split('T')[0];

    // 이번 주 완료된 일지 수 계산
    const { data: weeklyJournals } = await supabase
      .from('journals')
      .select('id, created_at')
      .eq('student_id', userId)
      .eq('category_id', categoryId)
      .gte('created_at', weekStart.toISOString())
      .lt(
        'created_at',
        new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    const completedCount = weeklyJournals?.length || 0;
    const completionRate = Math.min((completedCount / weeklyGoal) * 100, 100);

    // 연속 기록 계산 (개선된 버전)
    const { data: recentJournals } = await supabase
      .from('journals')
      .select('created_at')
      .eq('student_id', userId)
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })
      .limit(30);

    let currentStreak = 0;
    let bestStreakFromRecent = 0;

    if (recentJournals && recentJournals.length > 0) {
      // 날짜별로 그룹화
      const journalDates = recentJournals.map(j =>
        new Date(j.created_at).toDateString()
      );
      const uniqueDates = [...new Set(journalDates)].sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      );

      const today = new Date().toDateString();
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toDateString();

      // 현재 연속 기록 계산
      if (uniqueDates.length > 0) {
        const latestDate = uniqueDates[0];
        if (latestDate === today || latestDate === yesterday) {
          currentStreak = 1;

          for (let i = 1; i < uniqueDates.length; i++) {
            const currentDate = new Date(uniqueDates[i]);
            const prevDate = new Date(uniqueDates[i - 1]);
            const dayDiff = Math.floor(
              (prevDate.getTime() - currentDate.getTime()) /
                (24 * 60 * 60 * 1000)
            );

            if (dayDiff === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
      }

      // 최고 연속 기록 계산 (최근 30일 내)
      let tempStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i]);
        const prevDate = new Date(uniqueDates[i - 1]);
        const dayDiff = Math.floor(
          (prevDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000)
        );

        if (dayDiff === 1) {
          tempStreak++;
        } else {
          bestStreakFromRecent = Math.max(bestStreakFromRecent, tempStreak);
          tempStreak = 1;
        }
      }
      bestStreakFromRecent = Math.max(bestStreakFromRecent, tempStreak);
    }

    // 기존 진행률 기록 조회
    const { data: existingProgress } = await supabase
      .from('progress_tracking')
      .select('best_streak')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .eq('week_start_date', weekStartDate)
      .single();

    const bestStreak = Math.max(
      currentStreak,
      bestStreakFromRecent,
      existingProgress?.best_streak || 0
    );

    // 진행률 기록 업서트
    const { data: updatedProgress, error: progressError } = await supabase
      .from('progress_tracking')
      .upsert({
        user_id: userId,
        category_id: categoryId,
        week_start_date: weekStartDate,
        target_count: weeklyGoal,
        completed_count: completedCount,
        completion_rate: completionRate,
        current_streak: currentStreak,
        best_streak: bestStreak,
        last_entry_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (progressError) {
      console.error('Progress tracking upsert error:', progressError);
    }

    // 진행률 정보 반환
    return {
      weekly_progress: {
        completed: completedCount,
        target: weeklyGoal,
        completion_rate: Math.round(completionRate),
        remaining: Math.max(0, weeklyGoal - completedCount),
      },
      streak: {
        current: currentStreak,
        best: bestStreak,
        is_active: currentStreak > 0,
      },
      week_start_date: weekStartDate,
      last_entry_date: new Date().toISOString().split('T')[0],
    };
  } catch (error: any) {
    logError(error, {
      requestId,
      userId,
      categoryId,
      operation: 'updateProgressTracking',
    });
    
    // 진행률 업데이트 실패 시 기본값 반환
    return {
      weekly_progress: {
        completed: 0,
        target: weeklyGoal,
        completion_rate: 0,
        remaining: weeklyGoal,
      },
      streak: {
        current: 0,
        best: 0,
        is_active: false,
      },
      week_start_date: new Date().toISOString().split('T')[0],
      last_entry_date: new Date().toISOString().split('T')[0],
      error: 'Progress tracking update failed',
    };
  }
}
