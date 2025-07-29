import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// Validation schemas
const TaskTemplateCreateSchema = z.object({
  title: z
    .string()
    .min(1, '제목은 필수입니다')
    .max(200, '제목은 200자 이하여야 합니다'),
  description: z.string().optional(),
  order_index: z.number().int().min(0).optional().default(0),
  is_required: z.boolean().optional().default(true),
  difficulty_level: z
    .enum(['easy', 'medium', 'hard'])
    .optional()
    .default('medium'),
  estimated_minutes: z.number().int().min(1).max(300).optional(),
});

// GET /api/admin/categories/[categoryId]/tasks - 카테고리의 태스크 템플릿 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const supabase = createClient();

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 관리자/코치 권한 확인
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'coach', 'teacher'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    const { categoryId } = params;

    // 카테고리 존재 확인
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', categoryId)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { success: false, error: '카테고리를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 태스크 템플릿 조회
    const { data: tasks, error: tasksError } = await supabase
      .from('task_templates')
      .select('*')
      .eq('category_id', categoryId)
      .order('order_index', { ascending: true });

    if (tasksError) {
      console.error('Task templates fetch error:', tasksError);
      return NextResponse.json(
        { success: false, error: '태스크 템플릿을 불러오는데 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        category,
        tasks: tasks || [],
      },
    });
  } catch (error) {
    console.error('GET /api/admin/categories/[categoryId]/tasks error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories/[categoryId]/tasks - 새 태스크 템플릿 생성
export async function POST(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const supabase = createClient();

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 관리자/코치 권한 확인
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'coach', 'teacher'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    const { categoryId } = params;
    const body = await request.json();

    // 입력 데이터 검증
    const validationResult = TaskTemplateCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: '입력 데이터가 올바르지 않습니다',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const taskData = validationResult.data;

    // 카테고리 존재 확인
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { success: false, error: '카테고리를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 태스크 템플릿 생성
    const { data: newTask, error: createError } = await supabase
      .from('task_templates')
      .insert({
        category_id: categoryId,
        ...taskData,
      })
      .select()
      .single();

    if (createError) {
      console.error('Task template creation error:', createError);
      return NextResponse.json(
        { success: false, error: '태스크 템플릿 생성에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newTask,
        message: '태스크 템플릿이 성공적으로 생성되었습니다',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'POST /api/admin/categories/[categoryId]/tasks error:',
      error
    );
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
