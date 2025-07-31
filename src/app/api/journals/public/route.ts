export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/journals/public - 공개 일지 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('journals')
      .select(`
        id,
        student_id,
        category_id,
        title,
        content,
        attachments,
        is_public,
        created_at,
        updated_at,
        category:categories!category_id(id, name),
        student:user_profiles!student_id(id, full_name),
        comments:comments(count)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 카테고리 필터링
    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // 댓글 수 계산 (실제로는 집계 쿼리 사용)
    const journalsWithCommentCount = await Promise.all(
      (data || []).map(async (journal) => {
        const { count: commentCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('journal_id', journal.id);

        return {
          ...journal,
          comments_count: commentCount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: journalsWithCommentCount,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching public journals:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '공개 일지 조회에 실패했습니다.',
        data: [],
      },
      { status: 500 }
    );
  }
}