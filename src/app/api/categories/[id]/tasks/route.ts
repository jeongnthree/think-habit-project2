import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

// GET /api/categories/[id]/tasks - 카테고리의 태스크 템플릿 목록 조회 (학생용)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const { id: categoryId } = params;

    // 카테고리 존재 및 활성 상태 확인
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id, name, description')
      .eq('id', categoryId)
      .eq('is_active', true)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { success: false, error: '카테고리를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 사용자가 해당 카테고리에 할당되어 있는지 확인
    const { data: assignment } = await supabase
      .from('assignments')
      .select('id')
      .eq('student_id', user.id)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .single();

    // 관리자가 아닌 경우 할당 확인
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    if (!isAdmin && !assignment) {
      return NextResponse.json(
        { success: false, error: '해당 카테고리에 접근할 권한이 없습니다' },
        { status: 403 }
      );
    }

    // 태스크 템플릿 조회
    const { data: tasks, error: tasksError } = await supabase
      .from('task_templates')
      .select('*')
      .eq('category_id', categoryId)
      .order('order_index', { ascending: true });

    if (tasksError) {
      console.error('Task templates fetch error:', tasksError);
      return NextResponse.json(
        { success: false, error: '태스크 템플릿을 불러오는데 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        category,
        tasks: tasks || [],
      },
    });
  } catch (error) {
    console.error('GET /api/categories/[id]/tasks error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
