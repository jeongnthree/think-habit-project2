import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/notifications - 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알림 조회에 실패했습니다.',
        data: [],
      },
      { status: 500 }
    );
  }
}

// POST /api/notifications - 알림 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, type, title, message, related_id } = body;

    if (!user_id || !type || !title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다.',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        message,
        related_id,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: '알림이 생성되었습니다.',
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알림 생성에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}