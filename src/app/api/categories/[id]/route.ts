import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/categories/[id] - 특정 카테고리 조회
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

    const { id } = params;

    // 카테고리 조회
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
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
      .eq('category_id', id)
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

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('GET /api/categories/[id] error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
