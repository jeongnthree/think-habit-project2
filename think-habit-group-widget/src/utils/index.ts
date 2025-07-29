// 날짜 포맷팅 유틸리티
export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;

  return date.toLocaleDateString('ko-KR');
};

// 점수를 색상으로 변환
export const getScoreColor = (score: number): string => {
  if (score >= 90) return '#10b981'; // green-500
  if (score >= 80) return '#3b82f6'; // blue-500
  if (score >= 70) return '#f59e0b'; // amber-500
  if (score >= 60) return '#ef4444'; // red-500
  return '#6b7280'; // gray-500
};

// 기분을 이모지로 변환
export const getMoodEmoji = (mood: string): string => {
  const moodMap: Record<string, string> = {
    'very-bad': '😢',
    bad: '😞',
    neutral: '😐',
    good: '😊',
    'very-good': '😄',
  };
  return moodMap[mood] || '😐';
};

// 기분을 색상으로 변환
export const getMoodColor = (mood: string): string => {
  const colorMap: Record<string, string> = {
    'very-bad': '#ef4444',
    bad: '#f97316',
    neutral: '#6b7280',
    good: '#22c55e',
    'very-good': '#10b981',
  };
  return colorMap[mood] || '#6b7280';
};

// 활동 타입을 아이콘으로 변환
export const getActivityIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    journal_created: '📝',
    achievement_earned: '🏆',
    streak_milestone: '🔥',
  };
  return iconMap[type] || '📋';
};

// 텍스트 자르기
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 숫자 포맷팅 (1000 -> 1K)
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// 진행률 계산
export const calculateProgress = (current: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
};

// 랜덤 격려 메시지 생성
export const getRandomEncouragementMessage = (): string => {
  const messages = [
    '오늘도 좋은 하루 보내세요! 💪',
    '꾸준한 노력이 빛을 발하고 있어요! ✨',
    '당신의 성장을 응원합니다! 🌱',
    '작은 변화가 큰 차이를 만들어요! 🎯',
    '오늘도 한 걸음 더 나아가세요! 👏',
    '당신은 충분히 잘하고 있어요! 🌟',
    '포기하지 마세요, 거의 다 왔어요! 🚀',
    '매일매일이 새로운 기회예요! 🌅',
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

// 로컬 스토리지 유틸리티
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },
};

// 디바운스 함수
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 클래스명 조합 유틸리티
export const classNames = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(' ');
};

// 색상 유틸리티
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// 애니메이션 지연 계산
export const getStaggerDelay = (
  index: number,
  baseDelay: number = 100
): number => {
  return index * baseDelay;
};

// 위젯 크기 계산
export const calculateOptimalHeight = (
  showProgress: boolean,
  showLeaderboard: boolean,
  showJournalForm: boolean,
  showRecentActivity: boolean,
  participantCount: number = 5
): number => {
  let height = 100; // 기본 헤더 높이

  if (showProgress) height += 80;
  if (showLeaderboard) height += Math.min(participantCount * 40 + 60, 300);
  if (showJournalForm) height += 200;
  if (showRecentActivity) height += 200;

  return Math.max(height, 300); // 최소 높이 300px
};
