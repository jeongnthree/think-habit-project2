// Assignments API - Think-Habit Lite (간소화)

import { supabase } from '@/lib/supabase';
import {
  ApiResponse,
  Assignment,
  AssignmentCreateRequest,
  AssignmentUpdateRequest,
} from '@/types/database';

// 할당 목록 조회
export async function getAssignments(): Promise<ApiResponse<Assignment[]>> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(
        `
        *,
        student:user_profiles!student_id(id, full_name, role),
        category:categories!category_id(id, name, description)
      `
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
    };
  }
}

// 학습자별 할당 조회
export async function getStudentAssignments(
  studentId: string
): Promise<ApiResponse<Assignment[]>> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(
        `
        *,
        category:categories!category_id(id, name, description, template)
      `
      )
      .eq('student_id', studentId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
    };
  }
}

// 할당 생성
export async function createAssignment(
  assignmentData: AssignmentCreateRequest
): Promise<ApiResponse<Assignment>> {
  try {
    // 현재 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    // 중복 할당 확인
    const { data: existing } = await supabase
      .from('assignments')
      .select('id')
      .eq('student_id', assignmentData.student_ids[0])
      .eq('category_id', assignmentData.category_ids[0])
      .eq('is_active', true)
      .single();

    if (existing) {
      return {
        success: false,
        error: '이미 할당된 카테고리입니다.',
      };
    }

    // 단일 할당 생성 (lite 버전에서는 대량 할당 대신 단순화)
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        student_id: assignmentData.student_ids[0],
        category_id: assignmentData.category_ids[0],
        assigned_by: user.id,
        weekly_goal: assignmentData.weekly_goal,
        start_date: assignmentData.start_date,
        end_date: assignmentData.end_date,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data,
      message: '할당이 생성되었습니다.',
    };
  } catch (error) {
    console.error('Error creating assignment:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '할당 생성에 실패했습니다.',
    };
  }
}

// 할당 수정
export async function updateAssignment(
  id: string,
  updates: AssignmentUpdateRequest
): Promise<ApiResponse<Assignment>> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data,
      message: '할당이 수정되었습니다.',
    };
  } catch (error) {
    console.error('Error updating assignment:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '할당 수정에 실패했습니다.',
    };
  }
}

// 할당 삭제 (비활성화)
export async function deleteAssignment(id: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('assignments')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: '할당이 삭제되었습니다.',
    };
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '할당 삭제에 실패했습니다.',
    };
  }
}
