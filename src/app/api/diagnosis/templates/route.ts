import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/diagnosis/templates - 진단 템플릿 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const isActive = searchParams.get('active');

    let query = supabase
      .from('diagnosis_templates')
      .select('*')
      .order('created_at', { ascending: false });

    // 필터 적용
    if (category) {
      query = query.eq('category', category);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: templates, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: '템플릿 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching diagnosis templates:', error);
    return NextResponse.json(
      { success: false, error: '템플릿 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/diagnosis/templates - 새 진단 템플릿 생성 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      title,
      description,
      category,
      estimatedTime,
      questionCount,
      difficulty,
      tags,
      questions,
    } = body;

    // 템플릿 생성
    const { data: template, error: templateError } = await supabase
      .from('diagnosis_templates')
      .insert({
        title,
        description,
        category,
        estimated_time: estimatedTime,
        question_count: questionCount,
        difficulty,
        tags,
        is_active: true,
      })
      .select()
      .single();

    if (templateError) {
      return NextResponse.json(
        { success: false, error: '템플릿 생성에 실패했습니다.' },
        { status: 400 }
      );
    }

    // 질문들 생성 (있는 경우)
    if (questions && questions.length > 0) {
      const questionsData = questions.map((q: any, index: number) => ({
        template_id: template.id,
        text: q.text,
        category: q.category,
        type: q.type,
        options: q.options,
        required: q.required,
        order: index + 1,
      }));

      const { error: questionsError } = await supabase
        .from('diagnosis_questions')
        .insert(questionsData);

      if (questionsError) {
        console.error('Error creating questions:', questionsError);
      }
    }

    return NextResponse.json({
      success: true,
      data: template,
      message: '템플릿이 성공적으로 생성되었습니다.',
    });
  } catch (error) {
    console.error('Error creating diagnosis template:', error);
    return NextResponse.json(
      { success: false, error: '템플릿 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
