import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/diagnosis/sessions - 사용자의 진단 세션 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const templateId = searchParams.get('templateId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('diagnosis_sessions')
      .select(
        `
        *,
        template:diagnosis_templates(*)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 필터 적용
    if (status) {
      query = query.eq('status', status);
    }
    if (templateId) {
      query = query.eq('template_id', templateId);
    }

    const { data: sessions, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: '세션 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Error fetching diagnosis sessions:', error);
    return NextResponse.json(
      { success: false, error: '세션 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/diagnosis/sessions - 새 진단 세션 시작
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { templateId, userId } = body;

    if (!templateId || !userId) {
      return NextResponse.json(
        { success: false, error: '템플릿 ID와 사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 템플릿 존재 확인
    const { data: template, error: templateError } = await supabase
      .from('diagnosis_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 템플릿입니다.' },
        { status: 404 }
      );
    }

    // 새 세션 생성
    const { data: session, error: sessionError } = await supabase
      .from('diagnosis_sessions')
      .insert({
        template_id: templateId,
        user_id: userId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      return NextResponse.json(
        { success: false, error: '세션 생성에 실패했습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        session,
        template,
      },
      message: '진단 세션이 시작되었습니다.',
    });
  } catch (error) {
    console.error('Error creating diagnosis session:', error);
    return NextResponse.json(
      { success: false, error: '세션 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
