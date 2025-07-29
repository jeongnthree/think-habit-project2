import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // 차단 정보 조회
    const { data: blockedUser, error: fetchError } = await supabase
      .from('blocked_users')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !blockedUser) {
      return NextResponse.json(
        { error: '차단 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 - 본인이 차단한 경우이거나 관리자인 경우
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = profile && ['admin', 'teacher'].includes(profile.role);
    const isOwner = blockedUser.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: '차단 해제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 차단 해제 (is_active를 false로 설정)
    const { error: updateError } = await supabase
      .from('blocked_users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Unblock user error:', updateError);
      return NextResponse.json(
        { error: '차단 해제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 관리자가 해제한 경우 조정 로그 기록
    if (isAdmin) {
      await supabase.from('moderation_actions').insert({
        moderator_id: user.id,
        action_type: 'unblock_user',
        target_type: 'user',
        target_id: blockedUser.blocked_user_id,
        target_user_id: blockedUser.blocked_user_id,
        reason: '관리자에 의한 차단 해제',
        details: { original_block_id: params.id },
      });
    }

    return NextResponse.json({
      message: '차단이 해제되었습니다.',
    });
  } catch (error) {
    console.error('Unblock user API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
