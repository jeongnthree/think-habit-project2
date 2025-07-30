import {
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  Database,
} from '@/types/database';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Supabase 클라이언트 초기화
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 관리자 권한 검증 함수
async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return false;

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) return false;

    // 사용자 프로필에서 관리자 권한 확인
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return profile?.role === 'admin';
  } catch (error) {
    console.error('Admin auth verification error:', error);
    return false;
  }
}

// GET: 카테고리 목록 조회
export async function GET(request: NextRequest) {
  try {
    if (!(await verifyAdminAuth(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('is_active');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    // 필터 적용
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data: categories, error, count } = await query;

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      categories,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('GET categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: 새 카테고리 생성
export async function POST(request: NextRequest) {
  try {
    if (!(await verifyAdminAuth(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CategoryCreateRequest = await request.json();

    // 입력 데이터 검증
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const categoryData = {
      name: body.name,
      description: body.description,
      template: body.template,
      is_active: body.is_active ?? true,
    };

    const { data: category, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('POST category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: 카테고리 수정
export async function PUT(request: NextRequest) {
  try {
    if (!(await verifyAdminAuth(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const body: CategoryUpdateRequest = await request.json();

    const updateData: Partial<Category> = {};

    // 허용된 필드만 업데이트
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.template !== undefined) updateData.template = body.template;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data: category, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('PUT category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: 카테고리 삭제
export async function DELETE(request: NextRequest) {
  try {
    if (!(await verifyAdminAuth(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // 연관된 데이터 확인 (할당된 사용자가 있는지 체크)
    const { data: assignments, error: assignmentError } = await supabase
      .from('user_category_assignments')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1);

    if (assignmentError) {
      console.error('Error checking assignments:', assignmentError);
      return NextResponse.json(
        { error: 'Failed to check category assignments' },
        { status: 500 }
      );
    }

    if (assignments && assignments.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete category that has user assignments. Please remove assignments first.',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('thinking_habit_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting category:', error);
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('DELETE category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
