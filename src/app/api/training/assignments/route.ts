export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/training/assignments - 학생의 할당된 카테고리와 진행률 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 현재 사용자 확인
    // 임시로 인증 우회 (개발용)
    const user = { id: userId };

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

    // 할당된 카테고리 조회
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(
        `
        *,
        category:categories!category_id(
          id,
          name,
          description,
          template,
          is_active
        )
      `
      )
      .eq('student_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.error('Assignments query error:', assignmentsError);
      return NextResponse.json(
        { error: '할당 목록 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: '할당된 카테고리가 없습니다.',
      });
    }

    // 각 카테고리별 진행률 조회
    const assignmentsWithProgress = await Promise.all(
      assignments.map(async assignment => {
        try {
          // 현재 주의 일지 개수 조회
          const weekStart = getWeekStartDate();
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);

          const { data: weeklyJournals, error: journalsError } = await supabase
            .from('journals')
            .select('id, created_at')
            .eq('student_id', userId)
            .eq('category_id', assignment.category_id)
            .is('deleted_at', null)
            .gte('created_at', weekStart.toISOString())
            .lt('created_at', weekEnd.toISOString());

          if (journalsError) {
            console.error('Weekly journals query error:', journalsError);
            return {
              ...assignment,
              weeklyProgress: {
                completed: 0,
                target: assignment.weekly_goal || 3,
                percentage: 0,
              },
            };
          }

          const completed = weeklyJournals?.length || 0;
          const target = assignment.weekly_goal || 3;
          const percentage = Math.round((completed / target) * 100);

          return {
            ...assignment,
            weeklyProgress: {
              completed,
              target,
              percentage: Math.min(percentage, 100),
            },
          };
        } catch (error) {
          console.error(
            'Error calculating progress for assignment:',
            assignment.id,
            error
          );
          return {
            ...assignment,
            weeklyProgress: {
              completed: 0,
              target: assignment.weekly_goal || 3,
              percentage: 0,
            },
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: assignmentsWithProgress,
    });
  } catch (error) {
    console.error('Training assignments API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
        data: [],
      },
      { status: 500 }
    );
  }
}

// Helper function to get week start date (Monday)
function getWeekStartDate(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday is 1, Sunday is 0
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}
