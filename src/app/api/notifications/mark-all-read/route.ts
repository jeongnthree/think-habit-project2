import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/notifications/mark-all-read - 모든 알림 읽음 처리
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user_id)
      .eq('is_read', false)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: `${data?.length || 0}개의 알림을 읽음 처리했습니다.`,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알림 읽음 처리에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}