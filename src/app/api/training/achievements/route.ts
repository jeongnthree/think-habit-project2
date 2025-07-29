import { createClient } from '@/lib/supabase/server';
import {
  calculateConsistencyScore,
  calculateMonthlyStats,
  calculateYearlyStats,
  detectAchievements,
} from '@/utils/progress-calculation';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/training/achievements - 성취 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const userId = searchParams.get('userId');

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

    // 최신 진행률 기록 조회
    const { data: latestProgress, error: progressError } = await supabase
      .from('progress_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .order('week_start_date', { ascending: false })
      .limit(1)
      .single();

    if (progressError && progressError.code !== 'PGRST116') {
      console.error('Progress tracking query error:', progressError);
      return NextResponse.json(
        { error: '진행률 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 전체 일지 수 조회
    const { data: journalCount, error: countError } = await supabase
      .from('journals')
      .select('id', { count: 'exact' })
      .eq('student_id', userId)
      .eq('category_id', categoryId)
      .is('deleted_at', null);

    if (countError) {
      console.error('Journal count query error:', countError);
      return NextResponse.json(
        { error: '일지 수 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 일관성 점수 계산을 위한 최근 진행률 기록들 조회
    const { data: progressRecords, error: recordsError } = await supabase
      .from('progress_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .order('week_start_date', { ascending: false })
      .limit(8);

    if (recordsError) {
      console.error('Progress records query error:', recordsError);
      return NextResponse.json(
        { error: '진행률 기록 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 성취 감지
    const currentStreak = latestProgress?.current_streak || 0;
    const bestStreak = latestProgress?.best_streak || 0;
    const totalEntries = journalCount?.length || 0;
    const weeklyCompletionRate = latestProgress?.completion_rate || 0;

    const consistencyData = calculateConsistencyScore(progressRecords || []);
    const consistentWeeks = consistencyData.consistentWeeks;

    // 월간/연간 통계 계산
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentYear = new Date().getFullYear().toString();

    const monthlyStats = calculateMonthlyStats(
      progressRecords || [],
      currentMonth
    );
    const yearlyStats = calculateYearlyStats(
      progressRecords || [],
      currentYear
    );

    const achievements = detectAchievements(
      currentStreak,
      bestStreak,
      totalEntries,
      weeklyCompletionRate,
      consistentWeeks,
      monthlyStats,
      yearlyStats
    );

    // 새로 달성한 성취들 필터링 (실제로는 DB에 저장된 성취 기록과 비교해야 함)
    const newAchievements = achievements.filter(
      achievement => achievement.achieved
    );

    return NextResponse.json({
      achievements,
      newAchievements,
      stats: {
        currentStreak,
        bestStreak,
        totalEntries,
        weeklyCompletionRate,
        consistencyScore: consistencyData.score,
        consistencyLevel: consistencyData.level,
        consistentWeeks,
      },
    });
  } catch (error) {
    console.error('Achievements API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/training/achievements - 성취 기록 저장
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { userId, categoryId, achievementId } = await request.json();

    if (!userId || !categoryId || !achievementId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
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
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // 성취 기록 저장 (실제 구현에서는 user_achievements 테이블 필요)
    // 현재는 로그만 남김
    console.log(
      `Achievement unlocked: ${achievementId} for user ${userId} in category ${categoryId}`
    );

    return NextResponse.json({
      success: true,
      message: '성취가 기록되었습니다.',
      achievementId,
    });
  } catch (error) {
    console.error('Achievement save API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
