import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 진단 응답 제출
 * POST /api/diagnosis/sessions/[sessionId]/responses
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = await createClient();
    const { sessionId } = params;

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 사용자 프로필 조회
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 요청 데이터 파싱
    const body = await request.json();
    const { question_id, response_value } = body;

    if (!question_id || response_value === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Question ID and response value are required',
        },
        { status: 400 }
      );
    }

    // 진단 세션 조회 및 권한 확인
    const { data: session, error: sessionError } = await supabase
      .from('diagnostic_sessions')
      .select(
        `
        id,
        user_id,
        template_id,
        status,
        total_questions,
        answered_questions,
        diagnostic_templates!inner(
          id,
          name,
          questions,
          scoring_rules
        )
      `
      )
      .eq('id', sessionId)
      .eq('user_id', userProfile.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    if (session.status !== 'in_progress') {
      return NextResponse.json(
        { success: false, error: 'Session is not in progress' },
        { status: 400 }
      );
    }

    // 해당 질문이 템플릿에 존재하는지 확인
    const template = session.diagnostic_templates;
    let questionFound = false;
    let questionText = '';
    let sectionTitle = '';

    for (const section of (template as any)[0].questions.sections) {
      const question = section.questions.find((q: any) => q.id === question_id);
      if (question) {
        questionFound = true;
        questionText = question.text;
        sectionTitle = section.title;
        break;
      }
    }

    if (!questionFound) {
      return NextResponse.json(
        { success: false, error: 'Question not found in template' },
        { status: 400 }
      );
    }

    // 이미 응답한 질문인지 확인
    const { data: existingResponse } = await supabase
      .from('diagnostic_responses')
      .select('id')
      .eq('session_id', sessionId)
      .eq('question_id', question_id)
      .single();

    if (existingResponse) {
      // 기존 응답 업데이트
      const { error: updateError } = await supabase
        .from('diagnostic_responses')
        .update({
          response_value,
          response_score: calculateQuestionScore(response_value),
          answered_at: new Date().toISOString(),
        })
        .eq('id', existingResponse.id);

      if (updateError) {
        console.error('Error updating diagnostic response:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update response' },
          { status: 500 }
        );
      }
    } else {
      // 새 응답 생성
      const { error: insertError } = await supabase
        .from('diagnostic_responses')
        .insert({
          session_id: sessionId,
          question_id,
          question_text: questionText,
          response_value,
          response_score: calculateQuestionScore(response_value),
        });

      if (insertError) {
        console.error('Error creating diagnostic response:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to save response' },
          { status: 500 }
        );
      }

      // 세션의 answered_questions 카운트 업데이트
      const { error: sessionUpdateError } = await supabase
        .from('diagnostic_sessions')
        .update({
          answered_questions: session.answered_questions + 1,
        })
        .eq('id', sessionId);

      if (sessionUpdateError) {
        console.error('Error updating session progress:', sessionUpdateError);
      }
    }

    // 다음 질문 찾기
    const { nextQuestion, isCompleted } = findNextQuestion(
      (template as any)[0].questions.sections,
      sessionId,
      supabase
    );

    // 진단 완료 여부 확인
    const updatedAnsweredCount = existingResponse
      ? session.answered_questions
      : session.answered_questions + 1;

    const isSessionCompleted = updatedAnsweredCount >= session.total_questions;

    if (isSessionCompleted) {
      // 세션 완료 처리
      await completeSession(sessionId, supabase);
    }

    return NextResponse.json({
      success: true,
      data: {
        next_question: isSessionCompleted
          ? null
          : await getNextQuestionData(
              (template as any)[0].questions.sections,
              sessionId,
              supabase
            ),
        is_completed: isSessionCompleted,
        progress: {
          answered: updatedAnsweredCount,
          total: session.total_questions,
          percentage: Math.round(
            (updatedAnsweredCount / session.total_questions) * 100
          ),
        },
      },
    });
  } catch (error) {
    console.error('Error in submit diagnostic response API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 질문 점수 계산 (기본적인 리커트 스케일 기준)
 */
function calculateQuestionScore(responseValue: any): number {
  if (typeof responseValue === 'number') {
    return responseValue;
  }
  if (typeof responseValue === 'boolean') {
    return responseValue ? 1 : 0;
  }
  if (typeof responseValue === 'string') {
    // 텍스트 응답의 경우 기본값
    return 0;
  }
  return 0;
}

/**
 * 다음 질문 찾기
 */
function findNextQuestion(sections: any[], sessionId: string, supabase: any) {
  // 실제 구현에서는 이미 응답한 질문들을 제외하고 다음 질문을 찾아야 함
  // 여기서는 간단한 로직으로 구현
  return { nextQuestion: null, isCompleted: false };
}

/**
 * 다음 질문 데이터 가져오기
 */
async function getNextQuestionData(
  sections: any[],
  sessionId: string,
  supabase: any
) {
  try {
    // 이미 응답한 질문들 조회
    const { data: responses } = await supabase
      .from('diagnostic_responses')
      .select('question_id')
      .eq('session_id', sessionId);

    const answeredQuestionIds = new Set(
      responses?.map((r: any) => r.question_id) || []
    );

    // 다음 미응답 질문 찾기
    let questionNumber = 1;
    for (const section of sections) {
      for (const question of section.questions) {
        if (!answeredQuestionIds.has(question.id)) {
          return {
            ...question,
            section_title: section.title,
            question_number: questionNumber,
            total_questions: sections.reduce(
              (total, s) => total + s.questions.length,
              0
            ),
          };
        }
        questionNumber++;
      }
    }

    return null; // 모든 질문에 응답 완료
  } catch (error) {
    console.error('Error getting next question:', error);
    return null;
  }
}

/**
 * 세션 완료 처리
 */
async function completeSession(sessionId: string, supabase: any) {
  try {
    // 세션 상태를 완료로 변경
    await supabase
      .from('diagnostic_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    // 진단 결과 분석 및 저장은 별도 함수에서 처리
    // (복잡한 로직이므로 별도 API 엔드포인트로 분리 권장)
  } catch (error) {
    console.error('Error completing session:', error);
  }
}
