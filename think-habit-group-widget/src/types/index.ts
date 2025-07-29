// 위젯 설정 타입
export interface WidgetConfig {
  groupId?: string;
  theme?: 'light' | 'dark' | 'auto';
  showProgress?: boolean;
  showLeaderboard?: boolean;
  showJournalForm?: boolean;
  showRecentActivity?: boolean;
  showStats?: boolean;
  showEncouragement?: boolean;
  height?: number;
  width?: number;
  apiEndpoint?: string;
  language?: 'ko' | 'en';
  maxParticipants?: number;
  refreshInterval?: number; // 자동 새로고침 간격 (초)
  enableNotifications?: boolean;
  enableRealtime?: boolean;
  customStyles?: Record<string, string>;
  onEvent?: WidgetEventHandler;
}

// 그룹 데이터 타입
export interface GroupData {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  overallProgress: number;
  totalJournals: number;
  activeMembers: number;
  topParticipants: Participant[];
  recentActivity: Activity[];
  stats: GroupStats;
}

// 참가자 타입
export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  journalCount: number;
  streak: number;
  lastActive: Date;
  rank: number;
}

// 활동 타입
export interface Activity {
  id: string;
  type: 'journal_created' | 'achievement_earned' | 'streak_milestone';
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: Date;
  data?: any;
}

// 그룹 통계 타입
export interface GroupStats {
  totalJournals: number;
  averageScore: number;
  completionRate: number;
  activeToday: number;
  weeklyGrowth: number;
  topCategory: string;
}

// 일지 타입
export interface Journal {
  id: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  category: string;
  mood: 'very-bad' | 'bad' | 'neutral' | 'good' | 'very-good';
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  likes: number;
  comments: Comment[];
}

// 댓글 타입
export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 위젯 상태 타입
export interface WidgetState {
  data: GroupData | null;
  loading: boolean;
  error: string | null;
  activeTab: 'overview' | 'leaderboard' | 'activity' | 'journal';
}

// 일지 작성 폼 타입
export interface JournalFormData {
  title: string;
  content: string;
  category: string;
  mood: Journal['mood'];
  tags: string[];
  isPublic: boolean;
}

// 격려 메시지 타입
export interface EncouragementMessage {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  message: string;
  type: 'encouragement' | 'congratulation' | 'support';
  createdAt: Date;
}

// 실시간 업데이트 타입
export interface RealtimeUpdate {
  type:
    | 'journal_created'
    | 'user_joined'
    | 'achievement_unlocked'
    | 'encouragement_sent';
  data: any;
  timestamp: Date;
  groupId: string;
}

// 알림 타입
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary';
}

// 위젯 이벤트 타입
export type WidgetEvent =
  | { type: 'journal_submitted'; data: Journal }
  | { type: 'encouragement_sent'; data: EncouragementMessage }
  | { type: 'data_refreshed'; data: GroupData }
  | { type: 'error_occurred'; data: { error: string } }
  | { type: 'user_joined'; data: { userId: string; userName: string } }
  | { type: 'realtime_update'; data: RealtimeUpdate }
  | { type: 'notification_shown'; data: Notification }
  | { type: 'widget_resized'; data: { width: number; height: number } };

// 위젯 이벤트 핸들러 타입
export type WidgetEventHandler = (event: WidgetEvent) => void;
