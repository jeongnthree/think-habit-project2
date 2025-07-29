import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/journals/public/[id] - 공개 일지 단일 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('journals')
      .select(`
        *,
        category:categories!category_id(id, name, description),
        student:user_profiles!student_id(id, full_name),
        comments:comments(
          *,
          author:user_profiles!author_id(id, full_name, role)
        )
      `)
      .eq('id', params.id)
      .eq('is_public', true)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: '공개된 일지를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    // 댓글을 생성일 순으로 정렬
    if (data.comments) {
      data.comments.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching public journal:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '일지를 찾을 수 없습니다.',
      },
      { status: 404 }
    );
  }
}