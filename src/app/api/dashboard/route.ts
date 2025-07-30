import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/dashboard - 대시보드 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }

    // 할당된 카테고리 수 조회
    const { data: assignments, error: assignmentError } = await supabase
      .from('assignments')
      .select('category_id')
      .eq('student_id', userId);

    if (assignmentError) {
      throw assignmentError;
    }

    const assignedCategories = assignments?.length || 0;

    // 완료한 일지 수 조회
    const { data: journals, error: journalError } = await supabase
      .from('journals')
      .select('id, created_at')
      .eq('student_id', userId);

    if (journalError) {
      throw journalError;
    }

    const completedJournals = journals?.length || 0;

    // 이번 주 일지 수 계산
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekJournals = journals?.filter(journal => 
      new Date(journal.created_at) >= startOfWeek
    ).length || 0;

    // 이번 주 목표 (할당된 카테고리 수와 동일하다고 가정)
    const weeklyGoal = assignedCategories;
    const currentWeekProgress = weeklyGoal > 0 ? Math.min(thisWeekJournals / weeklyGoal, 1) : 0;

    // 연속 기록 계산 (간단한 버전)
    let streakDays = 0;
    if (journals && journals.length > 0) {
      const sortedJournals = journals
        .map(j => new Date(j.created_at))
        .sort((a, b) => b.getTime() - a.getTime());

      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < sortedJournals.length; i++) {
        const journal = sortedJournals[i];
        if (!journal) break;
        
        const journalDate = new Date(journal.getTime());
        journalDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((currentDate.getTime() - journalDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === streakDays) {
          streakDays++;
        } else {
          break;
        }
      }
    }

    // 전체 완료율 (간단한 계산)
    const overallCompletionRate = assignedCategories > 0 ? 
      Math.min(completedJournals / (assignedCategories * 4), 1) : 0; // 카테고리당 4개 일지 목표

    // 최근 일지 조회
    const { data: recentJournals, error: recentError } = await supabase
      .from('journals')
      .select(`
        id,
        title,
        created_at,
        is_public,
        category:categories!category_id(name)
      `)
      .eq('student_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      throw recentError;
    }

    const stats = {
      assignedCategories,
      completedJournals,
      currentWeekProgress,
      overallCompletionRate,
      streakDays,
    };

    const formattedRecentJournals = recentJournals?.map(journal => ({
      id: journal.id,
      title: journal.title,
      categoryName: journal.category?.name || '미분류',
      createdAt: journal.created_at,
      isPublic: journal.is_public,
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentJournals: formattedRecentJournals,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '대시보드 데이터 조회에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}