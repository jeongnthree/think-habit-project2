import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/notifications/[id] - 알림 읽음 처리
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { is_read } = body;

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: '알림이 업데이트되었습니다.',
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알림 업데이트에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - 알림 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '알림이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알림 삭제에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}