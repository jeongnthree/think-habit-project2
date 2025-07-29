import { createClient } from '@/lib/supabase/server';
import { validateContent } from '@/utils/content-moderation';
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
    const {
      reported_content_type,
      reported_content_id,
      reported_user_id,
      reason,
      description,
    } = body;

    // 입력 검증
    if (
      !reported_content_type ||
      !reported_content_id ||
      !reported_user_id ||
      !reason
    ) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 콘텐츠 타입 검증
    if (!['comment', 'journal'].includes(reported_content_type)) {
      return NextResponse.json(
        { error: '유효하지 않은 콘텐츠 타입입니다.' },
        { status: 400 }
      );
    }

    // 신고 사유 검증
    const validReasons = [
      'spam',
      'inappropriate',
      'harassment',
      'offensive',
      'other',
    ];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: '유효하지 않은 신고 사유입니다.' },
        { status: 400 }
      );
    }

    // 설명 내용 검증 (있는 경우)
    if (description) {
      const contentValidation = validateContent(description);
      if (!contentValidation.isValid) {
        return NextResponse.json(
          { error: `신고 설명: ${contentValidation.errors.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // 자기 자신을 신고하는 것 방지
    if (user.id === reported_user_id) {
      return NextResponse.json(
        { error: '자신의 콘텐츠는 신고할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 신고된 콘텐츠가 실제로 존재하는지 확인
    let contentExists = false;
    if (reported_content_type === 'comment') {
      const { data: comment } = await supabase
        .from('comments')
        .select('id, author_id')
        .eq('id', reported_content_id)
        .single();

      if (comment && comment.author_id === reported_user_id) {
        contentExists = true;
      }
    } else if (reported_content_type === 'journal') {
      const { data: journal } = await supabase
        .from('journals')
        .select('id, user_id')
        .eq('id', reported_content_id)
        .single();

      if (journal && journal.user_id === reported_user_id) {
        contentExists = true;
      }
    }

    if (!contentExists) {
      return NextResponse.json(
        { error: '신고하려는 콘텐츠를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 신고 생성
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_content_type,
        reported_content_id,
        reported_user_id,
        reason,
        description: description || null,
      })
      .select()
      .single();

    if (reportError) {
      // 중복 신고인 경우
      if (reportError.code === '23505') {
        return NextResponse.json(
          { error: '이미 신고한 콘텐츠입니다.' },
          { status: 409 }
        );
      }

      console.error('Report creation error:', reportError);
      return NextResponse.json(
        { error: '신고 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '신고가 접수되었습니다. 검토 후 조치하겠습니다.',
      report_id: report.id,
    });
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

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
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 신고 목록 조회
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select(
        `
        *,
        reporter:reporter_id(id, full_name),
        reported_user:reported_user_id(id, full_name),
        reviewer:reviewed_by(id, full_name)
      `
      )
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (reportsError) {
      console.error('Reports fetch error:', reportsError);
      return NextResponse.json(
        { error: '신고 목록을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 총 개수 조회
    const { count, error: countError } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (countError) {
      console.error('Reports count error:', countError);
    }

    return NextResponse.json({
      reports: reports || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Reports GET API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
