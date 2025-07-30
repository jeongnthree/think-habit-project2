// Think-Habit Lite Database Types (간소화)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// 기본 Enum 타입들
export type UserRole = 'admin' | 'teacher' | 'coach' | 'student';
export type CommentType = 'advice' | 'encouragement' | 'question';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type JournalType = 'structured' | 'photo' | 'mixed';

// 사용자 프로필 타입
export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileInsert {
  id?: string;
  user_id: string;
  email: string;
  full_name?: string | null;
  role?: UserRole;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfileUpdate {
  id?: string;
  user_id?: string;
  email?: string;
  full_name?: string | null;
  role?: UserRole;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 카테고리 타입
export interface Category {
  id: string;
  name: string;
  description: string | null;
  template: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryInsert {
  id?: string;
  name: string;
  description?: string | null;
  template?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryUpdate {
  id?: string;
  name?: string;
  description?: string | null;
  template?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// 태스크 템플릿 타입
export interface TaskTemplate {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  prompt: string;
  order_index: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskTemplateInsert {
  id?: string;
  category_id: string;
  title: string;
  description?: string | null;
  prompt: string;
  order_index: number;
  is_required?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TaskTemplateUpdate {
  id?: string;
  category_id?: string;
  title?: string;
  description?: string | null;
  prompt?: string;
  order_index?: number;
  is_required?: boolean;
  created_at?: string;
  updated_at?: string;
}

// 카테고리 할당 타입
export interface Assignment {
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
}

// 태스크 템플릿 타입
export interface TaskTemplate {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  prompt: string;
  order_index: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskTemplateInsert {
  id?: string;
  category_id: string;
  title: string;
  description?: string | null;
  prompt: string;
  order_index: number;
  is_required?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TaskTemplateUpdate {
  id?: string;
  category_id?: string;
  title?: string;
  description?: string | null;
  prompt?: string;
  order_index?: number;
  is_required?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AssignmentInsert {
  id?: string;
  student_id: string;
  category_id: string;
  assigned_by: string;
  weekly_goal?: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AssignmentUpdate {
  id?: string;
  student_id?: string;
  category_id?: string;
  assigned_by?: string;
  weekly_goal?: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// 훈련 일지 타입
export interface Journal {
  id: string;
  student_id: string;
  category_id: string;
  title: string;
  content: string;
  attachments: string[] | null;
  is_public: boolean;
  journal_type: 'structured' | 'photo' | 'mixed';
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalInsert {
  id?: string;
  student_id: string;
  category_id: string;
  title: string;
  content: string;
  attachments?: string[] | null;
  journal_type?: 'structured' | 'photo' | 'mixed';
  is_public?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface JournalUpdate {
  id?: string;
  student_id?: string;
  category_id?: string;
  title?: string;
  content?: string;
  attachments?: string[] | null;
  journal_type?: 'structured' | 'photo' | 'mixed';
  is_public?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 댓글 타입
export interface Comment {
  id: string;
  journal_id: string;
  author_id: string;
  content: string;
  comment_type: CommentType;
  created_at: string;
}

export interface CommentInsert {
  id?: string;
  journal_id: string;
  author_id: string;
  content: string;
  comment_type?: CommentType;
  created_at?: string;
}

export interface CommentUpdate {
  id?: string;
  journal_id?: string;
  author_id?: string;
  content?: string;
  comment_type?: CommentType;
  created_at?: string;
}

// 알림 타입
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationInsert {
  id?: string;
  user_id: string;
  type: string;
  title: string;
  message?: string | null;
  is_read?: boolean;
  created_at?: string;
}

export interface NotificationUpdate {
  id?: string;
  user_id?: string;
  type?: string;
  title?: string;
  message?: string | null;
  is_read?: boolean;
  created_at?: string;
}

// 태스크 템플릿 타입 (코치/관리자가 생성하는 to-do list 항목들)
export interface TaskTemplate {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_required: boolean;
  difficulty_level: DifficultyLevel;
  estimated_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaskTemplateInsert {
  id?: string;
  category_id: string;
  title: string;
  description?: string | null;
  order_index?: number;
  is_required?: boolean;
  difficulty_level?: DifficultyLevel;
  estimated_minutes?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface TaskTemplateUpdate {
  id?: string;
  category_id?: string;
  title?: string;
  description?: string | null;
  order_index?: number;
  is_required?: boolean;
  difficulty_level?: DifficultyLevel;
  estimated_minutes?: number | null;
  created_at?: string;
  updated_at?: string;
}

// 태스크 완료 기록 타입 (구조화된 일지에서 체크된 항목들)
export interface TaskCompletion {
  id: string;
  journal_id: string;
  task_template_id: string;
  is_completed: boolean;
  completion_note: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface TaskCompletionInsert {
  id?: string;
  journal_id: string;
  task_template_id: string;
  is_completed?: boolean;
  completion_note?: string | null;
  completed_at?: string | null;
  created_at?: string;
}

export interface TaskCompletionUpdate {
  id?: string;
  journal_id?: string;
  task_template_id?: string;
  is_completed?: boolean;
  completion_note?: string | null;
  completed_at?: string | null;
  created_at?: string;
}

// 일지 사진 타입 (사진 일지용) - 기존 JournalPhoto 업데이트
export interface JournalPhoto {
  id: string;
  journal_id: string;
  photo_url: string;
  caption: string | null;
  order_index: number;
  file_size: number | null;
  file_type: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface JournalPhotoInsert {
  id?: string;
  journal_id: string;
  photo_url: string;
  caption?: string | null;
  order_index?: number;
  file_size?: number | null;
  file_type?: string | null;
  width?: number | null;
  height?: number | null;
  created_at?: string;
}

export interface JournalPhotoUpdate {
  id?: string;
  journal_id?: string;
  photo_url?: string;
  caption?: string | null;
  order_index?: number;
  file_size?: number | null;
  file_type?: string | null;
  width?: number | null;
  height?: number | null;
  created_at?: string;
}

// 진행률 추적 타입 (주간 목표 달성률 등) - 기존 ProgressTracking 업데이트
export interface ProgressTracking {
  id: string;
  user_id: string;
  category_id: string;
  week_start_date: string;
  target_count: number;
  completed_count: number;
  completion_rate: number;
  current_streak: number;
  best_streak: number;
  last_entry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgressTrackingInsert {
  id?: string;
  user_id: string;
  category_id: string;
  week_start_date: string;
  target_count?: number;
  completed_count?: number;
  completion_rate?: number;
  current_streak?: number;
  best_streak?: number;
  last_entry_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProgressTrackingUpdate {
  id?: string;
  user_id?: string;
  category_id?: string;
  week_start_date?: string;
  target_count?: number;
  completed_count?: number;
  completion_rate?: number;
  current_streak?: number;
  best_streak?: number;
  last_entry_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Database schema interface
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: UserProfileInsert;
        Update: UserProfileUpdate;
      };
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
      };
      assignments: {
        Row: Assignment;
        Insert: AssignmentInsert;
        Update: AssignmentUpdate;
      };
      journals: {
        Row: Journal;
        Insert: JournalInsert;
        Update: JournalUpdate;
      };
      comments: {
        Row: Comment;
        Insert: CommentInsert;
        Update: CommentUpdate;
      };
      notifications: {
        Row: Notification;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
      };
      task_templates: {
        Row: TaskTemplate;
        Insert: TaskTemplateInsert;
        Update: TaskTemplateUpdate;
      };
      task_completions: {
        Row: TaskCompletion;
        Insert: TaskCompletionInsert;
        Update: TaskCompletionUpdate;
      };
      journal_photos: {
        Row: JournalPhoto;
        Insert: JournalPhotoInsert;
        Update: JournalPhotoUpdate;
      };
      progress_tracking: {
        Row: ProgressTracking;
        Insert: ProgressTrackingInsert;
        Update: ProgressTrackingUpdate;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: AuditLogInsert;
        Update: AuditLogUpdate;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      comment_type: CommentType;
      difficulty_level: DifficultyLevel;
      journal_type: JournalType;
    };
  };
}

// API 요청/응답 타입들
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

export interface JournalCreateRequest {
  studentId: string;
  category_id: string;
  title: string;
  content: string;
  attachments?: string[];
  is_public?: boolean;
}

export interface JournalUpdateRequest {
  title?: string;
  content?: string;
  attachments?: string[];
  is_public?: boolean;
}

export interface CommentCreateRequest {
  journal_id: string;
  content: string;
  comment_type?: CommentType;
}

// 새로운 훈련 일지 시스템 API 타입들
export interface TaskTemplateCreateRequest {
  category_id: string;
  title: string;
  description?: string;
  order_index?: number;
  is_required?: boolean;
  difficulty_level?: DifficultyLevel;
  estimated_minutes?: number;
}

export interface TaskTemplateUpdateRequest {
  title?: string;
  description?: string;
  order_index?: number;
  is_required?: boolean;
  difficulty_level?: DifficultyLevel;
  estimated_minutes?: number;
}

export interface StructuredJournalCreateRequest {
  category_id: string;
  title: string;
  task_completions: {
    task_template_id: string;
    is_completed: boolean;
    completion_note?: string;
  }[];
  reflection?: string;
  is_public?: boolean;
}

export interface PhotoJournalCreateRequest {
  category_id: string;
  title: string;
  content: string;
  photos: {
    photo_url: string;
    caption?: string;
    order_index?: number;
  }[];
  is_public?: boolean;
}

// 확장 타입들
export interface CategoryWithStats extends Category {
  assigned_students_count: number;
  completed_journals_count: number;
  avg_completion_rate: number;
}

export interface CategoryWithTasks extends Category {
  task_templates: TaskTemplate[];
  task_count: number;
}

export interface StudentWithAssignments extends UserProfile {
  assignments: Assignment[];
  total_journals: number;
  completion_rate: number;
}

export interface JournalWithDetails extends Journal {
  category: Category;
  student: UserProfile;
  comments_count: number;
}

export interface StructuredJournalWithTasks extends Journal {
  journal_type: 'structured';
  task_completions: (TaskCompletion & { task_template: TaskTemplate })[];
  completion_percentage: number;
  completed_tasks: number;
  total_tasks: number;
}

export interface PhotoJournalWithMedia extends Journal {
  journal_type: 'photo';
  photos: JournalPhoto[];
  photo_count: number;
}

// 필터 옵션 타입들
export interface CategoryFilterOptions {
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface JournalFilterOptions {
  category_id?: string;
  student_id?: string;
  is_public?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface UserFilterOptions {
  role?: UserRole;
  search?: string;
  page?: number;
  limit?: number;
}

// 대시보드 통계 타입들
export interface DashboardStats {
  total_categories: number;
  active_categories: number;
  total_students: number;
  total_journals: number;
  journals_this_week: number;
  completion_rate: number;
}

export interface StudentDashboardStats {
  assigned_categories: number;
  completed_journals: number;
  current_week_progress: number;
  overall_completion_rate: number;
  recent_journals: JournalWithDetails[];
}

// 사진 일지 타입들
export interface JournalPhoto {
  id: string;
  journal_id: string;
  photo_url: string;
  caption: string | null;
  ocr_text: string | null;
  auto_tags: string[] | null;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
}

export interface JournalResponse {
  id: string;
  journal_id: string;
  question_id: string;
  question: string;
  answer: string;
  order_index: number;
  created_at: string;
}

export interface JournalVoiceMemo {
  id: string;
  journal_id: string;
  voice_url: string;
  transcription: string | null;
  duration_seconds: number | null;
  created_at: string;
}

// 확장된 일지 타입 (사진 포함)
export interface JournalWithMedia extends Journal {
  photos: JournalPhoto[];
  responses: JournalResponse[];
  voice_memos: JournalVoiceMemo[];
}

// 사진 업로드 요청 타입
export interface PhotoUploadRequest {
  file: File;
  caption?: string;
}

export interface PhotoJournalCreateRequest {
  category_id: string;
  title: string;
  content: string;
  photos: PhotoUploadRequest[];
  voice_memo?: File;
  is_public?: boolean;
  journal_type: 'photo' | 'mixed';
}

export interface StructuredJournalCreateRequest {
  category_id: string;
  title: string;
  responses: {
    question_id: string;
    question: string;
    answer: string;
  }[];
  reflection: string;
  is_public?: boolean;
  journal_type: 'structured';
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 누락된 타입들 추가 (기존 복잡한 시스템에서 사용되던 것들)
export type GoalType = 'daily' | 'weekly' | 'monthly';
export type JournalStatus = 'draft' | 'published' | 'archived';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type ThinkingArea =
  | 'critical'
  | 'creative'
  | 'logical'
  | 'emotional'
  | 'communication';
export type TrainingType = 'structured' | 'photo' | 'mixed';
export type Visibility = 'public' | 'private' | 'friends';

// 기존 시스템 호환성을 위한 별칭 타입들
export type ThinkCategory = Category;
export type CategoryAssignment = Assignment;
export type TrainingJournal = Journal;
export type ThinkingHabitCategory = Category;
export type UserCategoryAssignment = Assignment;

// 커뮤니티 관련 타입 (간소화된 버전)
export interface CommunityPost {
  id: string;
  journal_id: string;
  author_id: string;
  title: string;
  content: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

// 진행률 추적 타입
export interface ProgressTracking {
  id: string;
  user_id: string;
  category_id: string;
  current_streak: number;
  best_streak: number;
  total_entries: number;
  last_entry_date: string | null;
  created_at: string;
  updated_at: string;
}

// 감사 로그 타입
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any> | null;
  created_at: string;
}

export interface AuditLogInsert {
  id?: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, any> | null;
  created_at?: string;
}

export interface AuditLogUpdate {
  id?: string;
  user_id?: string;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any> | null;
  created_at?: string;
}

// 유틸리티 타입들
export type CreateInput<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'created_at'>> & {
  updated_at?: string;
};
export type WithId<T> = T & { id: string };
export type WithTimestamps<T> = T & { created_at: string; updated_at: string };
