import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/diagnosis/sessions/[sessionId] - 특정 진단 세션 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = createClient();
    const { sessionId } = params;

    // 세션 정보 조회
    const { data: session, error: sessionError } = await supabase
      .from('diagnosis_sessions')
      .select(
        `
        *,
        template:diagnosis_templates(*)
      `
      )
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      return NextResponse.json(
        { success: false, error: '세션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 세션 응답 조회
    const { data: responses, error: responsesError } = await supabase
      .from('diagnosis_responses')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_order');

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
    }

    return NextResponse.json({
      success: true,
      data: {
        session,
        responses: responses || [],
      },
    });
  } catch (error) {
    console.error('Error fetching diagnosis session:', error);
    return NextResponse.json(
      { success: false, error: '세션 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT /api/diagnosis/sessions/[sessionId] - 진단 세션 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = createClient();
    const { sessionId } = params;
    const body = await request.json();

    const { status, responses, results } = body;

    // 세션 상태 업데이트
    const { error: sessionError } = await supabase
      .from('diagnosis_sessions')
      .update({
        status,
        results,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (sessionError) {
      return NextResponse.json(
        { success: false, error: '세션 업데이트에 실패했습니다.' },
        { status: 400 }
      );
    }

    // 응답 데이터 업데이트 (있는 경우)
    if (responses && responses.length > 0) {
      for (const response of responses) {
        const { error: responseError } = await supabase
          .from('diagnosis_responses')
          .upsert({
            session_id: sessionId,
            question_id: response.question_id,
            question_order: response.question_order,
            answer: response.answer,
            score: response.score,
          });

        if (responseError) {
          console.error('Error updating response:', responseError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '세션이 성공적으로 업데이트되었습니다.',
    });
  } catch (error) {
    console.error('Error updating diagnosis session:', error);
    return NextResponse.json(
      { success: false, error: '세션 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/diagnosis/sessions/[sessionId] - 진단 세션 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = createClient();
    const { sessionId } = params;

    // 관련 응답 먼저 삭제
    const { error: responsesError } = await supabase
      .from('diagnosis_responses')
      .delete()
      .eq('session_id', sessionId);

    if (responsesError) {
      console.error('Error deleting responses:', responsesError);
    }

    // 세션 삭제
    const { error: sessionError } = await supabase
      .from('diagnosis_sessions')
      .delete()
      .eq('id', sessionId);

    if (sessionError) {
      return NextResponse.json(
        { success: false, error: '세션 삭제에 실패했습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '세션이 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Error deleting diagnosis session:', error);
    return NextResponse.json(
      { success: false, error: '세션 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
