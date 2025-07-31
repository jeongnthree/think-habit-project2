export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 사용자 인증 및 권한 확인
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

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 조정 액션 목록 조회
    const { data: actions, error: actionsError } = await supabase
      .from('moderation_actions')
      .select(
        `
        *,
        moderator:moderator_id(id, full_name),
        target_user:target_user_id(id, full_name)
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (actionsError) {
      console.error('Moderation actions fetch error:', actionsError);
      return NextResponse.json(
        { error: '조정 액션을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 총 개수 조회
    const { count, error: countError } = await supabase
      .from('moderation_actions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Moderation actions count error:', countError);
    }

    return NextResponse.json({
      actions: actions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Moderation actions GET API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
