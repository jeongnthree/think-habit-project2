// Think-Habit Lite Component Types (간소화)

import {
  Assignment,
  Category,
  Comment,
  Journal,
  Notification,
  UserProfile,
} from './database';

import { JournalResponse } from './api';

// 기본 컴포넌트 Props 타입들
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 폼 관련 타입들
export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
}

// 카테고리 관련 컴포넌트 타입들
export interface CategoryCardProps {
  category: Category;
  onEdit?: (category: Category) => void;
  onDelete?: (categoryId: string) => void;
  showActions?: boolean;
}

export interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface CategoryListProps {
  categories: Category[];
  loading?: boolean;
  onEdit?: (category: Category) => void;
  onDelete?: (categoryId: string) => void;
  showActions?: boolean;
}

// 할당 관련 컴포넌트 타입들
export interface AssignmentCardProps {
  assignment: Assignment & { category: Category };
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignmentId: string) => void;
  showActions?: boolean;
}

export interface AssignmentFormProps {
  assignment?: Assignment;
  categories: Category[];
  students: UserProfile[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// 일지 관련 컴포넌트 타입들
export interface JournalCardProps {
  journal: Journal & { category: Category; student: UserProfile };
  onEdit?: (journal: Journal) => void;
  onDelete?: (journalId: string) => void;
  onView?: (journalId: string) => void;
  showActions?: boolean;
}

export interface JournalFormProps {
  journal?: Journal;
  category: Category;
  studentId: string;
  onSave: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface JournalTypeSelectProps {
  onSelect: (type: 'structured' | 'photo') => void;
  selectedType?: 'structured' | 'photo';
}

export interface StructuredJournalFormProps {
  category: Category;
  studentId: string;
  onSave: () => void;
  onCancel: () => void;
}

export interface PhotoJournalFormProps {
  category: Category;
  studentId: string;
  onSave: () => void;
  onCancel: () => void;
}

// 댓글 관련 컴포넌트 타입들
export interface CommentProps {
  comment: Comment & { author: UserProfile };
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: string) => void;
  showActions?: boolean;
}

export interface CommentFormProps {
  journalId: string;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export interface CommentListProps {
  comments: (Comment & { author: UserProfile })[];
  loading?: boolean;
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: string) => void;
  showActions?: boolean;
}

// 대시보드 관련 컴포넌트 타입들
export interface DashboardStatsProps {
  stats: {
    total_categories: number;
    active_categories: number;
    total_students: number;
    total_journals: number;
    journals_this_week: number;
    completion_rate: number;
  };
}

export interface RecentActivityProps {
  journals: JournalResponse[];
  loading?: boolean;
}

export interface ProgressChartProps {
  data: { week: string; count: number }[];
  loading?: boolean;
}

// 네비게이션 관련 타입들
export interface NavigationProps {
  userRole?: 'admin' | 'teacher' | 'coach' | 'student';
  currentPath?: string;
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'admin' | 'teacher' | 'coach' | 'student';
}

// 모달 관련 타입들
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

// 테이블 관련 타입들
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  onSort?: (key: keyof T, order: 'asc' | 'desc') => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

// 페이지네이션 관련 타입들
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
}

// 검색 관련 타입들
export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: (value: string) => void;
  loading?: boolean;
}

export interface FilterProps {
  filters: Record<string, any>;
  onChange: (filters: Record<string, any>) => void;
  onReset: () => void;
  options: {
    [key: string]: {
      label: string;
      type: 'select' | 'text' | 'date' | 'boolean';
      options?: { value: any; label: string }[];
    };
  };
}

// 알림 관련 타입들
export interface NotificationProps {
  notification: Notification;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  showActions?: boolean;
}

export interface NotificationListProps {
  notifications: Notification[];
  loading?: boolean;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
}

// 로딩 관련 타입들
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export interface LoadingStateProps {
  loading: boolean;
  error?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// 에러 관련 타입들
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

export interface ErrorMessageProps {
  error: string | Error;
  onRetry?: () => void;
  className?: string;
}

// 유틸리티 타입들
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';
export type ComponentVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger';
export type ComponentState = 'idle' | 'loading' | 'success' | 'error';

export interface WithClassName {
  className?: string;
}

export interface WithChildren {
  children?: React.ReactNode;
}

export interface WithLoading {
  loading?: boolean;
}

export interface WithError {
  error?: string;
}

export type ComponentProps = WithClassName &
  WithChildren &
  WithLoading &
  WithError;
