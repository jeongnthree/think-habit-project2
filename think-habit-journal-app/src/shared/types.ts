// src/shared/types.ts

// 임시 Database 타입 (better-sqlite3 대신)
export type Database = any;

export interface User {
  id: string;
  email: string;
  name: string;
  token?: string;
  refreshToken?: string;
  avatarUrl?: string;
  preferences?: Record<string, any>;
  lastSync?: Date;
  createdAt: Date;
}

export interface Journal {
  id: string;
  userId: string;
  type: "structured" | "photo";
  title: string;
  content: StructuredContent | PhotoContent;
  syncStatus: "local" | "synced" | "pending" | "conflict";
  serverId?: string;
  serverVersion?: number;
  localVersion?: number;
  tags?: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}

export interface StructuredContent {
  tasks: TodoItem[];
  notes: string;
  completionRate?: number;
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
  createdAt?: Date;
}

export interface PhotoItem {
  id: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  serverUrl?: string;
  caption?: string;
  order: number;
  createdAt?: Date;
}

export interface FileMetadata {
  id: string;
  journalId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType?: string;
  serverUrl?: string;
  thumbnailPath?: string;
  uploadStatus?: "local" | "uploading" | "uploaded" | "failed";
  createdAt: Date;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  journalId?: string;
  conflictResolution?: "merged" | "local" | "remote";
  syncedAt?: Date;
  error?: string;
}

export interface DatabaseConfig {
  path: string;
  encrypted: boolean;
  backupPath?: string;
}

export interface ElectronAPI {
  app: {
    getVersion: () => Promise<string>;
    quit: () => void;
    minimize: () => void;
    maximize: () => void;
    unmaximize: () => void;
    isMaximized: () => Promise<boolean>;
  };
  store?: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    clear: () => Promise<void>;
  };
  showNotification?: (title: string, message: string) => Promise<void>;
  dialog?: {
    openFile: (options?: any) => Promise<string | null>;
    saveFile: (
      content: string,
      fileName?: string,
      mimeType?: string,
    ) => Promise<string | null>;
  };
  fs?: {
    readFile: (path: string) => Promise<string | null>;
    writeFile: (path: string, content: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
// Additional types for testing and extended functionality

export interface JournalFilter {
  type?: "structured" | "photo";
  syncStatus?: "local" | "synced" | "pending" | "conflict";
  dateFrom?: Date;
  dateTo?: Date;
  searchText?: string;
  tags?: string[];
  isFavorite?: boolean;
  completionRate?: {
    min: number;
    max: number;
  };
}

export interface JournalPreview {
  id: string;
  title: string;
  type: "structured" | "photo";
  createdAt: Date;
  syncStatus: "local" | "synced" | "pending" | "conflict";
  isFavorite: boolean;
  preview: string;
  taskProgress?: string;
  photoCount?: number;
}

export interface JournalStats {
  totalJournals: number;
  structuredJournals: number;
  photoJournals: number;
  completedTasks: number;
  totalTasks: number;
  averageCompletionRate: number;
  weeklyJournals: number;
  monthlyJournals: number;
  streak: number;
  lastJournalDate: Date;
  favoriteJournals: number;
  archivedJournals: number;
  unsyncedJournals: number;
}

export interface CreateJournalDto {
  type: "structured" | "photo";
  title: string;
  content: Omit<StructuredContent, "completionRate"> | PhotoContent;
  tags?: string[];
}

export interface UpdateJournalDto {
  title?: string;
  content?: StructuredContent | PhotoContent;
  tags?: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
}

export interface BatchSyncResult {
  success: boolean;
  totalJournals: number;
  syncedJournals: number;
  failedJournals: number;
  conflicts: number;
  errors: SyncError[];
  startedAt: Date;
  completedAt: Date;
}

export interface SyncError {
  code: string;
  message: string;
  retryable: boolean;
  syncType: "upload" | "download";
  timestamp: Date;
}

export interface JournalValidationError {
  code: string;
  message: string;
  field: string;
  timestamp: Date;
}

export interface FileError {
  code: string;
  message: string;
  fileType: string;
  maxSize: number;
  timestamp: Date;
}

export interface AppSettings {
  autoSync: boolean;
  syncInterval: number;
  autoBackup: boolean;
  backupInterval: number;
  maxBackups: number;
  theme: "light" | "dark" | "system";
  language: string;
  notifications: {
    syncComplete: boolean;
    reminderEnabled: boolean;
    reminderTime: string;
  };
}

// Type guard functions
export function isStructuredContent(
  content: any,
): content is StructuredContent {
  return (
    content && Array.isArray(content.tasks) && typeof content.notes === "string"
  );
}

export function isPhotoContent(content: any): content is PhotoContent {
  return (
    content &&
    Array.isArray(content.photos) &&
    typeof content.description === "string"
  );
}

export function isStructuredJournal(
  journal: Journal,
): journal is Journal & { content: StructuredContent } {
  return journal.type === "structured" && isStructuredContent(journal.content);
}

export function isPhotoJournal(
  journal: Journal,
): journal is Journal & { content: PhotoContent } {
  return journal.type === "photo" && isPhotoContent(journal.content);
}

// Utility functions
export function calculateCompletionRate(tasks: TodoItem[]): number {
  if (tasks.length === 0) return 0;
  const completedTasks = tasks.filter(task => task.completed).length;
  return Math.round((completedTasks / tasks.length) * 100) / 100;
}

// Additional interfaces for better typing
export interface JournalListOptions {
  filter?: Partial<JournalFilter>;
  sort?: {
    sortBy: 'createdAt' | 'updatedAt' | 'title' | 'completionRate' | 'syncedAt';
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}
