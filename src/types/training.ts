// Think-Habit Lite Training Types (간소화)

import { Assignment, Category, Journal, UserProfile } from './database';

// 훈련 진행률 타입
export interface TrainingProgress {
  studentId: string;
  categoryId: string;
  category: Category;
  student: UserProfile;
  assignment: Assignment;
  weeklyProgress: {
    completed: number;
    target: number;
    percentage: number;
  };
  recentJournals: Journal[];
  totalJournals: number;
  streakDays: number;
}

// 커뮤니티 피드 타입
export interface CommunityFeed {
  id: string;
  journal: Journal;
  category: Category;
  student: UserProfile;
  sharedAt: Date;
  likesCount: number;
  commentsCount: number;
}

// 훈련 통계 타입
export interface TrainingStats {
  studentId: string;
  period: 'week' | 'month';
  dateFrom: string;
  dateTo: string;

  summary: {
    totalJournals: number;
    categoriesPracticed: number;
    completionRate: number;
    streakDays: number;
  };

  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    journalsCount: number;
    progressPercentage: number;
  }[];

  dailyActivity: {
    date: string;
    journalsCount: number;
  }[];
}

// API 요청/응답 타입들
export interface TrainingProgressRequest {
  studentId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CommunityFeedRequest {
  categoryId?: string;
  limit?: number;
  offset?: number;
}

export interface TrainingStatsRequest {
  studentId: string;
  period: 'week' | 'month';
  dateFrom?: string;
  dateTo?: string;
}

// 검색 및 필터 타입들
export interface TrainingSearchFilters {
  studentId?: string;
  categoryIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  isPublic?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// 사진 일지 관련 타입들
export interface PhotoJournalSubmission {
  categoryId: string;
  photos: File[];
  description: string;
  photoDescriptions: string[];
}

export interface JournalPhoto {
  id: string;
  journal_id: string;
  photo_url: string;
  caption?: string;
  order_index: number;
  file_size: number;
  file_type: string;
  created_at: string;
}

export interface PhotoJournal extends Journal {
  journal_type: 'photo';
  photos: JournalPhoto[];
  description: string;
}

// 구조화된 일지 관련 타입들
export interface TaskTemplate {
  id: string;
  category_id: string;
  title: string;
  description: string;
  order_index: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletion {
  task_template_id: string;
  is_completed: boolean;
  completion_note?: string;
}

export interface StructuredJournal extends Journal {
  journal_type: 'structured';
  task_completions: TaskCompletion[];
  reflection_text: string;
}

// 유틸리티 타입들
export type TrainingPeriod = 'week' | 'month';
export type SortOrder = 'asc' | 'desc';
export type SortField = 'created_at' | 'updated_at' | 'title';
export type JournalType = 'structured' | 'photo';
