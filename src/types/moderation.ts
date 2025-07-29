/**
 * 모듈레이션 시스템 타입 정의
 */

export interface Report {
  id: string;
  reporter_id: string;
  reported_content_type: 'comment' | 'journal';
  reported_content_id: string;
  reported_user_id: string;
  reason: 'spam' | 'inappropriate' | 'harassment' | 'offensive' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by?: string;
  reviewed_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportWithDetails extends Report {
  reporter: {
    id: string;
    full_name: string;
  };
  reported_user: {
    id: string;
    full_name: string;
  };
  reviewer?: {
    id: string;
    full_name: string;
  };
}

export interface BlockedUser {
  id: string;
  user_id: string;
  blocked_user_id: string;
  blocked_by?: string;
  reason?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlockedUserWithDetails extends BlockedUser {
  blocked_user: {
    id: string;
    full_name: string;
  };
  blocker?: {
    id: string;
    full_name: string;
  };
}

export interface ModerationAction {
  id: string;
  moderator_id: string;
  action_type:
    | 'delete_comment'
    | 'delete_journal'
    | 'block_user'
    | 'unblock_user'
    | 'resolve_report'
    | 'dismiss_report';
  target_type: 'comment' | 'journal' | 'user' | 'report';
  target_id: string;
  target_user_id?: string;
  reason?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface ModerationActionWithDetails extends ModerationAction {
  moderator: {
    id: string;
    full_name: string;
  };
  target_user?: {
    id: string;
    full_name: string;
  };
}

export interface ModerationStats {
  recent_30_days: Record<string, number>;
  total_actions: number;
}

export interface ReportFormData {
  reported_content_type: 'comment' | 'journal';
  reported_content_id: string;
  reported_user_id: string;
  reason: string;
  description?: string;
}

export interface BlockUserFormData {
  blocked_user_id: string;
  reason?: string;
  is_admin_action?: boolean;
}

export interface ReportActionData {
  status: 'reviewed' | 'resolved' | 'dismissed';
  resolution_notes?: string;
  action?: 'hide_content';
}

export const REPORT_REASONS = {
  spam: '스팸/광고',
  inappropriate: '부적절한 내용',
  harassment: '괴롭힘/욕설',
  offensive: '혐오 발언',
  other: '기타',
} as const;

export const ACTION_TYPES = {
  delete_comment: '댓글 삭제',
  delete_journal: '일지 삭제',
  block_user: '사용자 차단',
  unblock_user: '차단 해제',
  resolve_report: '신고 해결',
  dismiss_report: '신고 기각',
} as const;

export const REPORT_STATUSES = {
  pending: '대기 중',
  reviewed: '검토됨',
  resolved: '해결됨',
  dismissed: '기각됨',
} as const;
