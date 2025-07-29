// Think-Habit Lite API Types (간소화)

import {
  Assignment,
  Category,
  Comment,
  Journal,
  Notification,
  UserProfile,
} from './database';

// API 응답 기본 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 인증 관련 타입
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role?: 'admin' | 'student';
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// 카테고리 관련 타입
export interface CategoryCreateRequest {
  name: string;
  description?: string;
  template?: string;
  is_active?: boolean;
}

export interface CategoryUpdateRequest {
  name?: string;
  description?: string;
  template?: string;
  is_active?: boolean;
}

export interface CategoryFilterRequest {
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'name' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface CategoryListResponse {
  categories: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 할당 관련 타입
export interface AssignmentCreateRequest {
  student_ids: string[];
  category_ids: string[];
  weekly_goal: number;
  start_date?: string;
  end_date?: string;
}

export interface AssignmentUpdateRequest {
  weekly_goal?: number;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface AssignmentListRequest {
  student_id?: string;
  category_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface AssignmentResponse {
  assignment: Assignment;
  category: Category;
  student: UserProfile;
}

// 훈련 일지 관련 타입
export interface JournalCreateRequest {
  category_id: string;
  title: string;
  content: string;
  attachments?: string[];
  journal_type?: 'structured' | 'photo' | 'mixed';
  is_public?: boolean;
}

export interface JournalUpdateRequest {
  title?: string;
  content?: string;
  attachments?: string[];
  journal_type?: 'structured' | 'photo' | 'mixed';
  is_public?: boolean;
}

export interface JournalFilterRequest {
  student_id?: string;
  category_id?: string;
  is_public?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'title';
  sort_order?: 'asc' | 'desc';
}

export interface JournalResponse {
  journal: Journal;
  category: Category;
  student: UserProfile;
  comments_count: number;
}

export interface JournalListResponse {
  journals: JournalResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 댓글 관련 타입
export interface CommentCreateRequest {
  journal_id: string;
  content: string;
  comment_type?: 'advice' | 'encouragement' | 'question';
}

export interface CommentResponse {
  comment: Comment;
  author: UserProfile;
}

// 대시보드 관련 타입
export interface AdminDashboardResponse {
  overview: {
    total_students: number;
    total_categories: number;
    active_categories: number;
    total_journals: number;
    journals_this_week: number;
  };
  recent_activity: {
    recent_journals: JournalResponse[];
    recent_registrations: UserProfile[];
    popular_categories: Category[];
  };
  statistics: {
    completion_rates: number;
    weekly_journal_counts: { week: string; count: number }[];
  };
}

export interface StudentDashboardResponse {
  overview: {
    assigned_categories: number;
    completed_journals: number;
    current_week_progress: number;
    overall_completion_rate: number;
  };
  assignments: AssignmentResponse[];
  recent_journals: JournalResponse[];
}

// 사용자 관리 관련 타입
export interface UserCreateRequest {
  email: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'coach' | 'student';
  password?: string;
}

export interface UserUpdateRequest {
  full_name?: string;
  role?: 'admin' | 'teacher' | 'coach' | 'student';
  avatar_url?: string;
}

export interface UserFilterRequest {
  role?: 'admin' | 'teacher' | 'coach' | 'student';
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'full_name' | 'email';
  sort_order?: 'asc' | 'desc';
}

export interface UserStatsResponse {
  user: UserProfile;
  assignment_count: number;
  completed_journals: number;
  completion_rate: number;
  recent_activity: JournalResponse[];
}

// 알림 관련 타입
export interface NotificationCreateRequest {
  user_id: string;
  title: string;
  message: string;
  type: string;
}

export interface NotificationResponse {
  notification: Notification;
}

// 에러 관련 타입
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiErrorResponse {
  error: ApiError;
  validation_errors?: ValidationError[];
}

// 유틸리티 타입
export type SortOrder = 'asc' | 'desc';

export interface DateRange {
  start: string;
  end: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sort_by?: string;
  sort_order?: SortOrder;
}

export interface FilterParams extends PaginationParams, SortParams {
  search?: string;
  date_range?: DateRange;
}
