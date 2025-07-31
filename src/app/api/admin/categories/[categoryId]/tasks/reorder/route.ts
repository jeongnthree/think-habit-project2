import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// Validation schema for reordering tasks
const TaskReorderSchema = z.object({
  tasks: z
    .array(
      z.object({
        id: z.string().uuid(),
        order_index: z.number().int().min(0),
      })
    )
    .min(1, '최소 하나의 태스크가 필요합니다'),
});

// PUT /api/admin/categories/[categoryId]/tasks/reorder - 태스크 템플릿 순서 변경
export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const supabase = await createClient();

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
    const validationResult = TaskReorderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: '입력 데이터가 올바르지 않습니다',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { tasks } = validationResult.data;

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

    // 해당 카테고리의 모든 태스크 ID 확인
    const { data: existingTasks, error: existingError } = await supabase
      .from('task_templates')
      .select('id')
      .eq('category_id', categoryId);

    if (existingError) {
      console.error('Existing tasks fetch error:', existingError);
      return NextResponse.json(
        { success: false, error: '기존 태스크 확인에 실패했습니다' },
        { status: 500 }
      );
    }

    const existingTaskIds = new Set(existingTasks?.map(t => t.id) || []);
    const requestTaskIds = new Set(tasks.map(t => t.id));

    // 요청된 태스크 ID들이 모두 해당 카테고리에 속하는지 확인
    for (const taskId of requestTaskIds) {
      if (!existingTaskIds.has(taskId)) {
        return NextResponse.json(
          {
            success: false,
            error: `태스크 ID ${taskId}가 해당 카테고리에 존재하지 않습니다`,
          },
          { status: 400 }
        );
      }
    }

    // 트랜잭션으로 순서 업데이트
    const updatePromises = tasks.map(task =>
      supabase
        .from('task_templates')
        .update({ order_index: task.order_index })
        .eq('id', task.id)
        .eq('category_id', categoryId)
    );

    const results = await Promise.all(updatePromises);

    // 모든 업데이트가 성공했는지 확인
    for (const result of results) {
      if (result.error) {
        console.error('Task reorder error:', result.error);
        return NextResponse.json(
          { success: false, error: '태스크 순서 변경에 실패했습니다' },
          { status: 500 }
        );
      }
    }

    // 업데이트된 태스크 목록 반환
    const { data: updatedTasks, error: fetchError } = await supabase
      .from('task_templates')
      .select('*')
      .eq('category_id', categoryId)
      .order('order_index', { ascending: true });

    if (fetchError) {
      console.error('Updated tasks fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: '업데이트된 태스크 목록을 불러오는데 실패했습니다',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTasks,
      message: '태스크 순서가 성공적으로 변경되었습니다',
    });
  } catch (error) {
    console.error(
      'PUT /api/admin/categories/[categoryId]/tasks/reorder error:',
      error
    );
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
