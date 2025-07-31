import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// Validation schema
const TaskTemplateUpdateSchema = z.object({
  title: z
    .string()
    .min(1, '제목은 필수입니다')
    .max(200, '제목은 200자 이하여야 합니다')
    .optional(),
  description: z.string().optional(),
  order_index: z.number().int().min(0).optional(),
  is_required: z.boolean().optional(),
  difficulty_level: z.enum(['easy', 'medium', 'hard']).optional(),
  estimated_minutes: z.number().int().min(1).max(300).optional(),
});

// GET /api/admin/categories/[categoryId]/tasks/[taskId] - 특정 태스크 템플릿 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string; taskId: string } }
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

    const { categoryId, taskId } = params;

    // 태스크 템플릿 조회
    const { data: task, error: taskError } = await supabase
      .from('task_templates')
      .select('*')
      .eq('id', taskId)
      .eq('category_id', categoryId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { success: false, error: '태스크 템플릿을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error(
      'GET /api/admin/categories/[categoryId]/tasks/[taskId] error:',
      error
    );
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/categories/[categoryId]/tasks/[taskId] - 태스크 템플릿 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string; taskId: string } }
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

    const { categoryId, taskId } = params;
    const body = await request.json();

    // 입력 데이터 검증
    const validationResult = TaskTemplateUpdateSchema.safeParse(body);
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

    const updateData = validationResult.data;

    // 기존 태스크 템플릿 존재 확인
    const { data: existingTask, error: existingError } = await supabase
      .from('task_templates')
      .select('id')
      .eq('id', taskId)
      .eq('category_id', categoryId)
      .single();

    if (existingError || !existingTask) {
      return NextResponse.json(
        { success: false, error: '태스크 템플릿을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 태스크 템플릿 수정
    const { data: updatedTask, error: updateError } = await supabase
      .from('task_templates')
      .update(updateData)
      .eq('id', taskId)
      .eq('category_id', categoryId)
      .select()
      .single();

    if (updateError) {
      console.error('Task template update error:', updateError);
      return NextResponse.json(
        { success: false, error: '태스크 템플릿 수정에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: '태스크 템플릿이 성공적으로 수정되었습니다',
    });
  } catch (error) {
    console.error(
      'PUT /api/admin/categories/[categoryId]/tasks/[taskId] error:',
      error
    );
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[categoryId]/tasks/[taskId] - 태스크 템플릿 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { categoryId: string; taskId: string } }
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

    const { categoryId, taskId } = params;

    // 기존 태스크 템플릿 존재 확인
    const { data: existingTask, error: existingError } = await supabase
      .from('task_templates')
      .select('id, title')
      .eq('id', taskId)
      .eq('category_id', categoryId)
      .single();

    if (existingError || !existingTask) {
      return NextResponse.json(
        { success: false, error: '태스크 템플릿을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 사용 중인 태스크인지 확인 (완료 기록이 있는지)
    const { data: completions, error: completionsError } = await supabase
      .from('task_completions')
      .select('id')
      .eq('task_template_id', taskId)
      .limit(1);

    if (completionsError) {
      console.error('Task completions check error:', completionsError);
      return NextResponse.json(
        { success: false, error: '태스크 사용 여부 확인에 실패했습니다' },
        { status: 500 }
      );
    }

    // 사용 중인 태스크는 삭제 불가
    if (completions && completions.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            '이미 사용된 태스크 템플릿은 삭제할 수 없습니다. 비활성화를 고려해보세요.',
        },
        { status: 409 }
      );
    }

    // 태스크 템플릿 삭제
    const { error: deleteError } = await supabase
      .from('task_templates')
      .delete()
      .eq('id', taskId)
      .eq('category_id', categoryId);

    if (deleteError) {
      console.error('Task template deletion error:', deleteError);
      return NextResponse.json(
        { success: false, error: '태스크 템플릿 삭제에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `태스크 템플릿 "${existingTask.title}"이 성공적으로 삭제되었습니다`,
    });
  } catch (error) {
    console.error(
      'DELETE /api/admin/categories/[categoryId]/tasks/[taskId] error:',
      error
    );
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
