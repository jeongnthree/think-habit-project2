import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/journals/structured - 구조화된 일지 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      category_id,
      title,
      responses,
      reflection,
      is_public = false,
      student_id,
    } = body;

    if (!category_id || !title || !student_id || !reflection) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다.',
        },
        { status: 400 }
      );
    }

    if (!responses || responses.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '최소 1개의 질문에 답변해주세요.',
        },
        { status: 400 }
      );
    }

    // 1. 일지 생성
    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .insert({
        student_id,
        category_id,
        title,
        content: reflection, // 성찰 내용을 메인 콘텐츠로
        is_public,
        journal_type: 'structured',
      })
      .select()
      .single();

    if (journalError) {
      throw journalError;
    }

    // 2. 구조화된 응답들 저장
    const responseData = responses.map((response: any, index: number) => ({
      journal_id: journal.id,
      question_id: response.question_id,
      question: response.question,
      answer: response.answer,
      order_index: index,
    }));

    const { data: savedResponses, error: responsesError } = await supabase
      .from('journal_responses')
      .insert(responseData)
      .select();

    if (responsesError) {
      // 일지는 생성되었지만 응답 저장 실패 시 일지 삭제
      await supabase.from('journals').delete().eq('id', journal.id);
      throw responsesError;
    }

    return NextResponse.json({
      success: true,
      data: {
        journal,
        responses: savedResponses,
      },
      message: '구조화된 일지가 성공적으로 저장되었습니다.',
    });
  } catch (error) {
    console.error('Error creating structured journal:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '구조화된 일지 생성에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
