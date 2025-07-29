import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 사용자 인증 확인
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

    const body = await request.json();
    const { blocked_user_id, reason, is_admin_action = false } = body;

    // 입력 검증
    if (!blocked_user_id) {
      return NextResponse.json(
        { error: '차단할 사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 자기 자신을 차단하는 것 방지
    if (user.id === blocked_user_id) {
      return NextResponse.json(
        { error: '자신을 차단할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 관리자 액션인 경우 권한 확인
    let blockedBy = null;
    if (is_admin_action) {
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
      blockedBy = user.id;
    }

    // 차단할 사용자가 존재하는지 확인
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name')
      .eq('user_id', blocked_user_id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: '차단하려는 사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 차단 생성
    const { data: blockedUser, error: blockError } = await supabase
      .from('blocked_users')
      .insert({
        user_id: is_admin_action ? blocked_user_id : user.id,
        blocked_user_id: is_admin_action ? user.id : blocked_user_id,
        blocked_by: blockedBy,
        reason: reason || null,
        is_active: true,
      })
      .select()
      .single();

    if (blockError) {
      // 중복 차단인 경우
      if (blockError.code === '23505') {
        return NextResponse.json(
          { error: '이미 차단된 사용자입니다.' },
          { status: 409 }
        );
      }

      console.error('Block creation error:', blockError);
      return NextResponse.json(
        { error: '사용자 차단 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 관리자 액션인 경우 조정 로그 기록
    if (is_admin_action) {
      await supabase.from('moderation_actions').insert({
        moderator_id: user.id,
        action_type: 'block_user',
        target_type: 'user',
        target_id: blocked_user_id,
        target_user_id: blocked_user_id,
        reason: reason,
        details: { blocked_user_name: targetUser.full_name },
      });
    }

    return NextResponse.json({
      message: is_admin_action
        ? '사용자가 차단되었습니다.'
        : '사용자를 차단했습니다.',
      blocked_user: blockedUser,
    });
  } catch (error) {
    console.error('Block user API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 사용자 인증 확인
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

    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('blocked_users')
      .select(
        `
        *,
        blocked_user:blocked_user_id(id, full_name),
        blocker:blocked_by(id, full_name)
      `
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (isAdmin) {
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

      // 관리자는 모든 차단 목록 조회
    } else {
      // 일반 사용자는 자신이 차단한 사용자만 조회
      query = query.eq('user_id', user.id);
    }

    const { data: blockedUsers, error: blockedError } = await query;

    if (blockedError) {
      console.error('Blocked users fetch error:', blockedError);
      return NextResponse.json(
        { error: '차단 목록을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 총 개수 조회
    let countQuery = supabase
      .from('blocked_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (!isAdmin) {
      countQuery = countQuery.eq('user_id', user.id);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Blocked users count error:', countError);
    }

    return NextResponse.json({
      blocked_users: blockedUsers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Blocked users GET API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
