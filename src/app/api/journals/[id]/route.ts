import { supabase } from '@/lib/supabase';
import { JournalUpdateRequest } from '@/types/database';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/journals/[id] - 일지 단일 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('journals')
      .select(`
        *,
        category:categories!category_id(id, name, description, template),
        student:user_profiles!student_id(id, full_name)
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
    console.error('Error fetching journal:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Journal not found',
      },
      { status: 404 }
    );
  }
}

// PUT /api/journals/[id] - 일지 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: JournalUpdateRequest = await request.json();

    const { data, error } = await supabase
      .from('journals')
      .update({
        title: body.title,
        content: body.content,
        attachments: body.attachments,
        is_public: body.is_public,
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
      message: '훈련 일지가 수정되었습니다.',
    });
  } catch (error) {
    console.error('Error updating journal:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '일지 수정에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/journals/[id] - 일지 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('journals')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '훈련 일지가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Error deleting journal:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '일지 삭제에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}