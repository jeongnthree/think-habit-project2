import { createClient } from '@/lib/supabase/server';
import {
  calculateConsistencyScore,
  compareWithPreviousWeek,
  formatDateForDB,
  getWeekStartDate,
  predictWeeklyGoalCompletion,
  updateWeeklyProgress,
} from '@/utils/progress-calculation';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/training/progress - 진행률 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const userId = searchParams.get('userId');
    const weeks = parseInt(searchParams.get('weeks') || '12');

    if (!categoryId || !userId) {
      return NextResponse.json(
        { error: '카테고리 ID와 사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 현재 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 권한 확인 (본인 또는 관리자/코치만 조회 가능)
    if (user.id !== userId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!profile || !['admin', 'teacher', 'coach'].includes(profile.role)) {
        return NextResponse.json(
          { error: '권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    // 진행률 기록 조회
    const { data: progressRecords, error: progressError } = await supabase
      .from('progress_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .order('week_start_date', { ascending: false })
      .limit(weeks);

    if (progressError) {
      console.error('Progress tracking query error:', progressError);
      return NextResponse.json(
        { error: '진행률 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 일지 데이터 조회 (연속 기록 계산용)
    const { data: journals, error: journalsError } = await supabase
      .from('journals')
      .select('id, created_at')
      .eq('student_id', userId)
      .eq('category_id', categoryId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (journalsError) {
      console.error('Journals query error:', journalsError);
      return NextResponse.json(
        { error: '일지 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 주간 리셋 확인 (현재 구현되지 않음)
    // const lastProgressUpdate = progressRecords?.[0]?.updated_at;
    // if (lastProgressUpdate) {
    //   await resetWeeklyProgressIfNeeded(userId, categoryId, lastProgressUpdate);
    // }

    // 현재 주 진행률 계산
    const currentWeekProgress = await updateWeeklyProgress(
      userId,
      categoryId,
      (journals || []) as any
    );

    // 일관성 점수 계산
    const consistencyData = calculateConsistencyScore(progressRecords || []);

    // 진행률 히스토리 분석
    const historyAnalysis = analyzeProgressHistory(
      progressRecords || [],
      weeks
    );

    // 목표 달성 예측
    const averageDailyEntries =
      journals && journals.length > 0
        ? journals.length /
          Math.max(
            1,
            Math.ceil(
              (Date.now() -
                new Date(journals[journals.length - 1].created_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 0;

    const prediction = predictWeeklyGoalCompletion(
      currentWeekProgress,
      averageDailyEntries
    );

    // 이전 주와 비교
    const previousWeek =
      progressRecords && progressRecords.length > 1 ? progressRecords[1] : null;
    const comparison = compareWithPreviousWeek(
      currentWeekProgress,
      previousWeek
    );

    return NextResponse.json({
      currentWeek: currentWeekProgress,
      history: progressRecords || [],
      analysis: historyAnalysis,
      consistency: consistencyData,
      prediction,
      comparison,
      totalJournals: journals?.length || 0,
    });
  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/training/progress - 진행률 업데이트
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { userId, categoryId } = await request.json();

    if (!userId || !categoryId) {
      return NextResponse.json(
        { error: '사용자 ID와 카테고리 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 현재 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 권한 확인
    if (user.id !== userId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!profile || !['admin', 'teacher', 'coach'].includes(profile.role)) {
        return NextResponse.json(
          { error: '권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    // 일지 데이터 조회
    const { data: journals, error: journalsError } = await supabase
      .from('journals')
      .select('*')
      .eq('student_id', userId)
      .eq('category_id', categoryId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (journalsError) {
      console.error('Journals query error:', journalsError);
      return NextResponse.json(
        { error: '일지 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 할당 정보 조회 (목표 설정용)
    const { data: assignment } = await supabase
      .from('assignments')
      .select('weekly_goal')
      .eq('student_id', userId)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .single();

    // 진행률 계산
    const progressData = await updateWeeklyProgress(
      userId,
      categoryId,
      (journals || []) as any
    );

    // 할당에서 목표 가져오기
    if (assignment?.weekly_goal) {
      progressData.target_count = assignment.weekly_goal;
      progressData.completion_rate = Math.round(
        (progressData.completed_count / assignment.weekly_goal) * 100
      );
    }

    const currentWeekStart = formatDateForDB(getWeekStartDate());

    // 기존 기록 확인
    const { data: existingProgress } = await supabase
      .from('progress_tracking')
      .select('id')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .eq('week_start_date', currentWeekStart)
      .single();

    let result;
    if (existingProgress) {
      // 업데이트
      const { data, error } = await supabase
        .from('progress_tracking')
        .update({
          target_count: progressData.target_count,
          completed_count: progressData.completed_count,
          completion_rate: progressData.completion_rate,
          current_streak: progressData.current_streak,
          best_streak: progressData.best_streak,
          last_entry_date: progressData.last_entry_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProgress.id)
        .select()
        .single();

      if (error) {
        console.error('Progress update error:', error);
        return NextResponse.json(
          { error: '진행률 업데이트 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // 새로 생성
      const { data, error } = await supabase
        .from('progress_tracking')
        .insert({
          user_id: userId,
          category_id: categoryId,
          week_start_date: currentWeekStart,
          target_count: progressData.target_count,
          completed_count: progressData.completed_count,
          completion_rate: progressData.completion_rate,
          current_streak: progressData.current_streak,
          best_streak: progressData.best_streak,
          last_entry_date: progressData.last_entry_date,
        })
        .select()
        .single();

      if (error) {
        console.error('Progress insert error:', error);
        return NextResponse.json(
          { error: '진행률 생성 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Progress update API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
