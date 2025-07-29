// Journal 관련 타입 정의
export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  priority?: "low" | "medium" | "high";
  category?: string;
}

export interface TodoTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  items: Omit<TodoItem, "id" | "createdAt" | "completedAt">[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StructuredJournalContent {
  title: string;
  date: Date;
  todos: TodoItem[];
  notes: string;
  mood?: "very-bad" | "bad" | "neutral" | "good" | "very-good";
  tags: string[];
  templateId?: string;
}

export interface PhotoJournalContent {
  title: string;
  date: Date;
  photos: JournalPhoto[];
  description: string;
  tags: string[];
}

export interface JournalPhoto {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  caption?: string;
  uploadedAt: Date;
}

export interface Journal {
  id: string;
  type: "structured" | "photo";
  content: StructuredJournalContent | PhotoJournalContent;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: "local" | "syncing" | "synced" | "error";
  isDeleted: boolean;
}

export interface JournalDraft {
  id: string;
  type: "structured" | "photo";
  content: Partial<StructuredJournalContent | PhotoJournalContent>;
  lastSaved: Date;
}

// 진행률 계산을 위한 인터페이스
export interface JournalProgress {
  totalTodos: number;
  completedTodos: number;
  completionPercentage: number;
  estimatedTimeRemaining?: number;
}

// 템플릿 카테고리
export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

// 기본 템플릿들
export const DEFAULT_TEMPLATES: TodoTemplate[] = [
  {
    id: "daily-reflection",
    name: "일일 성찰",
    description: "하루를 돌아보고 개선점을 찾는 템플릿",
    category: "reflection",
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        text: "오늘 가장 잘한 일 3가지 적기",
        completed: false,
        priority: "high",
      },
      {
        text: "개선이 필요한 부분 1가지 찾기",
        completed: false,
        priority: "medium",
      },
      { text: "내일 집중할 목표 설정하기", completed: false, priority: "high" },
      { text: "감사한 일 3가지 적기", completed: false, priority: "medium" },
      {
        text: "오늘의 기분과 이유 기록하기",
        completed: false,
        priority: "low",
      },
    ],
  },
  {
    id: "habit-tracking",
    name: "습관 추적",
    description: "좋은 습관 형성과 나쁜 습관 개선을 위한 템플릿",
    category: "habits",
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      { text: "물 8잔 마시기", completed: false, priority: "medium" },
      { text: "30분 이상 운동하기", completed: false, priority: "high" },
      { text: "독서 30분 하기", completed: false, priority: "medium" },
      {
        text: "스마트폰 사용 시간 체크하기",
        completed: false,
        priority: "low",
      },
      {
        text: "일찍 잠자리에 들기 (11시 전)",
        completed: false,
        priority: "high",
      },
    ],
  },
  {
    id: "productivity",
    name: "생산성 향상",
    description: "업무 효율성과 생산성을 높이기 위한 템플릿",
    category: "productivity",
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        text: "오늘의 최우선 과제 3개 선정하기",
        completed: false,
        priority: "high",
      },
      { text: "집중 시간 블록 설정하기", completed: false, priority: "high" },
      {
        text: "불필요한 회의나 활동 제거하기",
        completed: false,
        priority: "medium",
      },
      {
        text: "내일 할 일 미리 정리하기",
        completed: false,
        priority: "medium",
      },
      { text: "오늘 배운 것 정리하기", completed: false, priority: "low" },
    ],
  },
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: "reflection",
    name: "성찰",
    description: "자기 돌아보기와 성찰을 위한 템플릿",
    color: "#8B5CF6",
    icon: "🤔",
  },
  {
    id: "habits",
    name: "습관",
    description: "좋은 습관 형성을 위한 템플릿",
    color: "#10B981",
    icon: "🔄",
  },
  {
    id: "productivity",
    name: "생산성",
    description: "업무 효율성 향상을 위한 템플릿",
    color: "#F59E0B",
    icon: "⚡",
  },
  {
    id: "wellness",
    name: "웰빙",
    description: "건강과 웰빙을 위한 템플릿",
    color: "#EF4444",
    icon: "💪",
  },
  {
    id: "learning",
    name: "학습",
    description: "학습과 성장을 위한 템플릿",
    color: "#3B82F6",
    icon: "📚",
  },
];
