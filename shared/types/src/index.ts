// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// 일지 관련 타입
export interface Journal {
  id: string;
  userId: string;
  type: 'structured' | 'photo';
  title: string;
  content: StructuredContent | PhotoContent;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'local' | 'synced' | 'pending';
  serverId?: string;
}

export interface StructuredContent {
  tasks: TodoItem[];
  notes: string;
  completionRate: number;
}

export interface PhotoContent {
  photos: PhotoItem[];
  description: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}

export interface PhotoItem {
  id: string;
  fileName: string;
  filePath: string;
  caption?: string;
  order: number;
  uploadedAt: Date;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 인증 관련 타입
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// 동기화 관련 타입
export interface SyncResult {
  success: boolean;
  journalId?: string;
  error?: string;
  conflictResolution?: 'local' | 'server' | 'merge';
}

// 위젯 관련 타입
export interface GroupStats {
  groupId: string;
  totalMembers: number;
  activeMembers: number;
  overallProgress: number;
  topParticipants: Participant[];
}

export interface Participant {
  id: string;
  name: string;
  score: number;
  progress: number;
  lastActivity: Date;
}
