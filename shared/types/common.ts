/**
 * 전체 프로젝트에서 공통으로 사용하는 타입 정의
 */

// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  role: 'admin' | 'coach' | 'student';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 카테고리 관련 타입
export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 일지 관련 타입
export interface Journal {
  id: string;
  title: string;
  content?: string;
  journal_type: 'structured' | 'photo';
  is_public: boolean;
  category_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// 진행률 관련 타입
export interface ProgressData {
  weeklyProgress: number;
  monthlyProgress: number;
  totalJournals: number;
  completedTasks: number;
  categoryId: string;
}

// 페이지네이션 타입
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 플랫폼별 설정
export interface PlatformConfig {
  platform: 'web' | 'electron' | 'widget';
  version: string;
  features: string[];
}

// 공통 상태 타입
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// 공통 에러 타입
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// 날짜 관련 유틸리티 타입
export interface DateRange {
  start: string;
  end: string;
}

// 검색 관련 타입
export interface SearchParams {
  query?: string;
  category?: string;
  dateRange?: DateRange;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 알림 관련 타입
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// 파일 업로드 관련 타입
export interface FileUpload {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  created_at: string;
}

// 태그 관련 타입
export interface Tag {
  id: string;
  name: string;
  color?: string;
  usage_count: number;
}

// 설정 관련 타입
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  auto_save: boolean;
}

// 통계 관련 타입
export interface Statistics {
  total_journals: number;
  total_users: number;
  active_users: number;
  completion_rate: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

// 권한 관련 타입
export type Permission =
  | 'read_journals'
  | 'write_journals'
  | 'delete_journals'
  | 'manage_users'
  | 'manage_categories'
  | 'view_analytics';

export interface UserPermissions {
  user_id: string;
  permissions: Permission[];
}

// 활동 로그 타입
export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: any;
  created_at: string;
}

// 내보내기/가져오기 관련 타입
export interface ExportData {
  format: 'json' | 'csv' | 'pdf';
  data: any;
  created_at: string;
}

export interface ImportResult {
  success: boolean;
  imported_count: number;
  failed_count: number;
  errors?: string[];
}
