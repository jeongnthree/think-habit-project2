import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 진단 세션 시작 (개발용 간단 버전)
 * POST /api/diagnosis/sessions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // 요청 데이터 파싱
    const body = await request.json();
    const { template_id } = body;

    if (!template_id) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // 진단지 템플릿 조회
    const { data: template, error: templateError } = await supabase
      .from('diagnostic_templates')
      .select('*')
      .eq('id', template_id)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { success: false, error: 'Template not found or inactive' },
        { status: 404 }
      );
    }

    // 질문 수 계산
    const totalQuestions =
      template.questions?.sections?.reduce(
        (total: number, section: any) =>
          total + (section.questions?.length || 0),
        0
      ) || 0;

    // 임시 사용자 ID 사용
    const tempUserId = '550e8400-e29b-41d4-a716-446655440000';

    // 진단 세션 생성
    const { data: session, error: sessionError } = await supabase
      .from('diagnostic_sessions')
      .insert({
        user_id: tempUserId,
        template_id: template_id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        total_questions: totalQuestions,
        answered_questions: 0,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating diagnostic session:', sessionError);
      return NextResponse.json(
        { success: false, error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // 첫 번째 질문 가져오기
    const firstSection = template.questions?.sections?.[0];
    const firstQuestion = firstSection?.questions?.[0];

    if (!firstQuestion) {
      return NextResponse.json(
        { success: false, error: 'No questions found in template' },
        { status: 400 }
      );
    }

    const firstQuestionWithMeta = {
      ...firstQuestion,
      section_title: firstSection.title,
      question_number: 1,
      total_questions: totalQuestions,
    };

    return NextResponse.json({
      success: true,
      data: {
        session,
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          type: template.type,
          total_questions: totalQuestions,
        },
        first_question: firstQuestionWithMeta,
      },
    });
  } catch (error) {
    console.error('Error in create diagnostic session API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
