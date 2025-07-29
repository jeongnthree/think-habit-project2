// Categories API - Think-Habit Lite (간소화)

import { supabase } from '@/lib/supabase';
import {
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
} from '@/types/database';

// API Response 타입 정의
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 카테고리 목록 조회
export async function getCategories(): Promise<ApiResponse<Category[]>> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
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
    console.error('Error fetching categories:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
    };
  }
}

// 카테고리 단일 조회
export async function getCategoryById(
  id: string
): Promise<ApiResponse<Category>> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error fetching category:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Category not found',
    };
  }
}

// 카테고리 생성
export async function createCategory(
  categoryData: CategoryCreateRequest
): Promise<ApiResponse<Category>> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...categoryData,
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
      message: '카테고리가 생성되었습니다.',
    };
  } catch (error) {
    console.error('Error creating category:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '카테고리 생성에 실패했습니다.',
    };
  }
}

// 카테고리 수정
export async function updateCategory(
  id: string,
  updates: CategoryUpdateRequest
): Promise<ApiResponse<Category>> {
  try {
    const { data, error } = await supabase
      .from('categories')
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
      message: '카테고리가 수정되었습니다.',
    };
  } catch (error) {
    console.error('Error updating category:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '카테고리 수정에 실패했습니다.',
    };
  }
}

// 카테고리 삭제
export async function deleteCategory(id: string): Promise<ApiResponse<void>> {
  try {
    // 관련 할당이 있는지 확인
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id')
      .eq('category_id', id)
      .eq('is_active', true);

    if (assignments && assignments.length > 0) {
      return {
        success: false,
        error: '활성 할당이 있는 카테고리는 삭제할 수 없습니다.',
      };
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: '카테고리가 삭제되었습니다.',
    };
  } catch (error) {
    console.error('Error deleting category:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '카테고리 삭제에 실패했습니다.',
    };
  }
}
