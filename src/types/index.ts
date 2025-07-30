// 모든 타입들을 중앙에서 export

export * from './database';

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 페이지네이션 타입
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: PaginationInfo;
}

// 확장된 Assignment 타입 (training 페이지에서 사용)
export interface AssignmentWithCategory {
  id: string;
  student_id: string;
  category_id: string;
  assigned_by: string;
  weekly_goal: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
    description: string | null;
    template: string | null;
  };
}

// 기타 유틸리티 타입들
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

// BulkAssignment 관련 타입들
export interface BulkAssignmentData {
  student_ids: string[];
  category_ids: string[];
  weekly_goal: number;
  start_date: string;
  end_date: string | undefined;
}

export interface CategoryResponse {
  id: string;
  name: string;
  description?: string | null;
  template?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BulkAssignmentProps {
  students: UserProfile[];
  categories: CategoryResponse[];
  onSubmit: (data: BulkAssignmentData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}
