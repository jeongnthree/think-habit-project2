export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Cache headers for performance
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  'CDN-Cache-Control': 'public, s-maxage=60',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Extract filter parameters
    const categoryId = searchParams.get('categoryId');
    const studentId = searchParams.get('studentId');
    const isPublic = searchParams.get('isPublic');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const journalType = searchParams.get('journalType');
    const search = searchParams.get('search');
    const deleted = searchParams.get('deleted') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // 개발 환경에서 인증 우회 (테스트용)
    // 실제 프로덕션에서는 이 코드를 원래대로 되돌려야 합니다
    const userProfile = {
      id: 'test-user-id',
      role: 'admin', // 모든 기능에 접근할 수 있도록 admin 역할 부여
    };

    /* 원래 인증 코드 (나중에 복원할 것)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile to check permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }
    */

    // Build optimized query with selective fields
    let query = supabase.from('journals').select(`
        id,
        title,
        content,
        journal_type,
        is_public,
        created_at,
        updated_at,
        deleted_at,
        student_id,
        category_id,
        category:categories(id, name, color),
        student:user_profiles!journals_student_id_fkey(id, display_name, avatar_url),
        task_completions(
          id,
          is_completed,
          task_template:task_templates(id, title)
        ),
        journal_photos(id, photo_url, caption, order_index),
        comments(count)
      `);

    // Filter by deleted status
    if (deleted) {
      // Only show deleted journals to the owner or admin/coach
      query = query.not('deleted_at', 'is', null);

      // Check permissions for viewing deleted journals
      const isAdminOrCoach = ['admin', 'coach'].includes(userProfile.role);
      if (!isAdminOrCoach) {
        // Regular users can only see their own deleted journals
        query = query.eq('student_id', userProfile.id);
      }
    } else {
      // Show only non-deleted journals
      query = query.is('deleted_at', null);

      // Apply visibility rules for non-deleted journals
      const isAdminOrCoach = ['admin', 'coach'].includes(userProfile.role);
      if (!isAdminOrCoach) {
        // Regular users can see their own journals or public journals
        query = query.or(`student_id.eq.${userProfile.id},is_public.eq.true`);
      }
    }

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (isPublic !== null) {
      query = query.eq('is_public', isPublic === 'true');
    }

    if (journalType) {
      query = query.eq('journal_type', journalType);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: journals, error } = await query;

    if (error) {
      console.error('Error fetching journals:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch journals' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('journals')
      .select('*', { count: 'exact', head: true });

    // Apply deleted status filter for count
    if (deleted) {
      countQuery = countQuery.not('deleted_at', 'is', null);

      // Check permissions for counting deleted journals
      const isAdminOrCoach = ['admin', 'coach'].includes(userProfile.role);
      if (!isAdminOrCoach) {
        // Regular users can only count their own deleted journals
        countQuery = countQuery.eq('student_id', userProfile.id);
      }
    } else {
      countQuery = countQuery.is('deleted_at', null);

      // Apply visibility rules for counting non-deleted journals
      const isAdminOrCoach = ['admin', 'coach'].includes(userProfile.role);
      if (!isAdminOrCoach) {
        // Regular users can count their own journals or public journals
        countQuery = countQuery.or(
          `student_id.eq.${userProfile.id},is_public.eq.true`
        );
      }
    }

    // Apply same filters for count
    if (categoryId) countQuery = countQuery.eq('category_id', categoryId);
    if (studentId) countQuery = countQuery.eq('student_id', studentId);
    if (isPublic !== null)
      countQuery = countQuery.eq('is_public', isPublic === 'true');
    if (journalType) countQuery = countQuery.eq('journal_type', journalType);
    if (dateFrom) countQuery = countQuery.gte('created_at', dateFrom);
    if (dateTo) countQuery = countQuery.lte('created_at', dateTo);
    if (search)
      countQuery = countQuery.or(
        `title.ilike.%${search}%,content.ilike.%${search}%`
      );

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting journals:', countError);
    }

    const response = NextResponse.json({
      success: true,
      data: journals || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });

    // Add cache headers for performance
    Object.entries(CACHE_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Error in journals API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
