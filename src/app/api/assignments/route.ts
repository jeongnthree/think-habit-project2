import { supabase } from '@/lib/supabase';
import { AssignmentCreateRequest } from '@/types/database';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/assignments - 할당 목록 조회
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        student:user_profiles!student_id(id, full_name, role),
        category:categories!category_id(id, name, description)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
      },
      { status: 500 }
    );
  }
}

// POST /api/assignments - 할당 생성
export async function POST(request: NextRequest) {
  try {
    const body: AssignmentCreateRequest = await request.json();

    if (!body.student_ids?.length || !body.category_ids?.length) {
      return NextResponse.json(
        {
          success: false,
          error: '학습자와 카테고리를 선택해주세요.',
        },
        { status: 400 }
      );
    }

    // 현재 사용자 확인 (실제로는 인증 미들웨어에서 처리)
    // 임시로 admin 사용자 ID 사용
    const assignedBy = 'admin-user-id';

    // 중복 할당 확인
    const studentId = body.student_ids?.[0];
    const categoryId = body.category_ids?.[0];
    
    if (!studentId || !categoryId) {
      return NextResponse.json(
        {
          success: false,
          error: '유효한 학생 ID와 카테고리 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }
    
    const { data: existing } = await supabase
      .from('assignments')
      .select('id')
      .eq('student_id', studentId)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: '이미 할당된 카테고리입니다.',
        },
        { status: 400 }
      );
    }

    // 단일 할당 생성 (lite 버전에서는 대량 할당 대신 단순화)
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        student_id: studentId,
        category_id: categoryId,
        assigned_by: assignedBy,
        weekly_goal: body.weekly_goal,
        start_date: body.start_date,
        end_date: body.end_date,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: '할당이 생성되었습니다.',
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '할당 생성에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}