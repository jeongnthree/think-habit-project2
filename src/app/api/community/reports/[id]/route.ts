import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    const { status, resolution_notes, action } = body;

    // 입력 검증
    if (!status || !['reviewed', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      );
    }

    // 신고 존재 확인
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', params.id)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: '신고를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 처리된 신고인지 확인
    if (report.status !== 'pending') {
      return NextResponse.json(
        { error: '이미 처리된 신고입니다.' },
        { status: 400 }
      );
    }

    // 트랜잭션 시작
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        resolution_notes: resolution_notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Report update error:', updateError);
      return NextResponse.json(
        { error: '신고 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 조치 사항이 있는 경우 처리
    if (action && status === 'resolved') {
      await handleModerationAction(
        supabase,
        user.id,
        report,
        action,
        resolution_notes
      );
    }

    // 조정 액션 로그 기록
    const actionType =
      status === 'resolved' ? 'resolve_report' : 'dismiss_report';
    await supabase.from('moderation_actions').insert({
      moderator_id: user.id,
      action_type: actionType,
      target_type: 'report',
      target_id: params.id,
      target_user_id: report.reported_user_id,
      reason: resolution_notes,
      details: {
        original_reason: report.reason,
        content_type: report.reported_content_type,
        content_id: report.reported_content_id,
      },
    });

    return NextResponse.json({
      message: '신고가 처리되었습니다.',
      report: updatedReport,
    });
  } catch (error) {
    console.error('Report PATCH API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

async function handleModerationAction(
  supabase: any,
  moderatorId: string,
  report: any,
  action: string,
  reason?: string
) {
  try {
    if (action === 'hide_content') {
      // 콘텐츠 숨기기
      if (report.reported_content_type === 'comment') {
        await supabase
          .from('comments')
          .update({
            is_hidden: true,
            hidden_by: moderatorId,
            hidden_at: new Date().toISOString(),
            hidden_reason: reason,
          })
          .eq('id', report.reported_content_id);

        // 조정 액션 로그
        await supabase.from('moderation_actions').insert({
          moderator_id: moderatorId,
          action_type: 'delete_comment',
          target_type: 'comment',
          target_id: report.reported_content_id,
          target_user_id: report.reported_user_id,
          reason: reason,
          details: { report_id: report.id },
        });
      } else if (report.reported_content_type === 'journal') {
        await supabase
          .from('journals')
          .update({
            is_hidden: true,
            hidden_by: moderatorId,
            hidden_at: new Date().toISOString(),
            hidden_reason: reason,
          })
          .eq('id', report.reported_content_id);

        // 조정 액션 로그
        await supabase.from('moderation_actions').insert({
          moderator_id: moderatorId,
          action_type: 'delete_journal',
          target_type: 'journal',
          target_id: report.reported_content_id,
          target_user_id: report.reported_user_id,
          reason: reason,
          details: { report_id: report.id },
        });
      }
    }
  } catch (error) {
    console.error('Moderation action error:', error);
    throw error;
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // 신고 상세 정보 조회
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(
        `
        *,
        reporter:reporter_id(id, full_name),
        reported_user:reported_user_id(id, full_name),
        reviewer:reviewed_by(id, full_name)
      `
      )
      .eq('id', params.id)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: '신고를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 신고된 콘텐츠 정보도 함께 조회
    let contentData = null;
    if (report.reported_content_type === 'comment') {
      const { data: comment } = await supabase
        .from('comments')
        .select('content, created_at, is_hidden')
        .eq('id', report.reported_content_id)
        .single();
      contentData = comment;
    } else if (report.reported_content_type === 'journal') {
      const { data: journal } = await supabase
        .from('journals')
        .select('title, content, created_at, is_hidden')
        .eq('id', report.reported_content_id)
        .single();
      contentData = journal;
    }

    return NextResponse.json({
      report,
      content: contentData,
    });
  } catch (error) {
    console.error('Report GET API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
