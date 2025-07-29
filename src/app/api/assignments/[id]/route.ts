import { supabase } from '@/lib/supabase';
import { AssignmentUpdateRequest } from '@/types/database';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/assignments/[id] - 할당 단일 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        student:user_profiles!student_id(id, full_name, role),
        category:categories!category_id(id, name, description)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Assignment not found',
      },
      { status: 404 }
    );
  }
}

// PUT /api/assignments/[id] - 할당 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: AssignmentUpdateRequest = await request.json();

    const { data, error } = await supabase
      .from('assignments')
      .update({
        weekly_goal: body.weekly_goal,
        start_date: body.start_date,
        end_date: body.end_date,
        is_active: body.is_active,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: '할당이 수정되었습니다.',
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '할당 수정에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/assignments/[id] - 할당 삭제 (비활성화)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('assignments')
      .update({ is_active: false })
      .eq('id', params.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '할당이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '할당 삭제에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}