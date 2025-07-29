import {
  ApiResponse,
  EncouragementMessage,
  GroupData,
  Journal,
  JournalFormData,
} from '../types';

export class WidgetApiService {
  private baseUrl: string;
  private groupId: string;

  constructor(baseUrl: string, groupId: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.groupId = groupId;
  }

  // 그룹 데이터 조회
  async getGroupData(): Promise<ApiResponse<GroupData>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/groups/${this.groupId}/stats`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // 일지 제출
  async submitJournal(
    journalData: JournalFormData
  ): Promise<ApiResponse<Journal>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/groups/${this.groupId}/journals`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(journalData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to submit journal',
      };
    }
  }

  // 격려 메시지 전송
  async sendEncouragement(
    toUserId: string,
    message: string,
    type: EncouragementMessage['type'] = 'encouragement'
  ): Promise<ApiResponse<EncouragementMessage>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/groups/${this.groupId}/encouragements`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            toUserId,
            message,
            type,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send encouragement',
      };
    }
  }

  // 일지에 좋아요 추가
  async likeJournal(
    journalId: string
  ): Promise<ApiResponse<{ likes: number }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/journals/${journalId}/like`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to like journal',
      };
    }
  }

  // 최근 일지 목록 조회
  async getRecentJournals(limit: number = 10): Promise<ApiResponse<Journal[]>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/groups/${this.groupId}/journals/recent?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch recent journals',
      };
    }
  }
}

// Mock API 서비스 (개발/테스트용)
export class MockApiService extends WidgetApiService {
  private mockData: GroupData = {
    id: 'mock-group',
    name: '테스트 그룹',
    description: '개발용 테스트 그룹입니다',
    memberCount: 25,
    overallProgress: 78,
    totalJournals: 156,
    activeMembers: 18,
    topParticipants: [
      {
        id: '1',
        name: '김철수',
        score: 95,
        journalCount: 23,
        streak: 7,
        lastActive: new Date(),
        rank: 1,
      },
      {
        id: '2',
        name: '이영희',
        score: 89,
        journalCount: 19,
        streak: 5,
        lastActive: new Date(),
        rank: 2,
      },
      {
        id: '3',
        name: '박민수',
        score: 84,
        journalCount: 17,
        streak: 3,
        lastActive: new Date(),
        rank: 3,
      },
    ],
    recentActivity: [
      {
        id: '1',
        type: 'journal_created',
        userId: '1',
        userName: '김철수',
        message: '새로운 일지를 작성했습니다',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
      },
      {
        id: '2',
        type: 'achievement_earned',
        userId: '2',
        userName: '이영희',
        message: '7일 연속 작성 달성!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
      },
      {
        id: '3',
        type: 'streak_milestone',
        userId: '3',
        userName: '박민수',
        message: '5일 연속 작성 달성!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4시간 전
      },
    ],
    stats: {
      totalJournals: 156,
      averageScore: 82,
      completionRate: 78,
      activeToday: 12,
      weeklyGrowth: 15,
      topCategory: '감정 관리',
    },
  };

  async getGroupData(): Promise<ApiResponse<GroupData>> {
    // 실제 API 호출을 시뮬레이션하기 위한 지연
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      data: this.mockData,
    };
  }

  async submitJournal(
    journalData: JournalFormData
  ): Promise<ApiResponse<Journal>> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const newJournal: Journal = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: '현재 사용자',
      title: journalData.title,
      content: journalData.content,
      category: journalData.category,
      mood: journalData.mood,
      tags: journalData.tags,
      isPublic: journalData.isPublic,
      createdAt: new Date(),
      likes: 0,
      comments: [],
    };

    return {
      success: true,
      data: newJournal,
    };
  }

  async sendEncouragement(
    toUserId: string,
    message: string,
    type: EncouragementMessage['type'] = 'encouragement'
  ): Promise<ApiResponse<EncouragementMessage>> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const encouragement: EncouragementMessage = {
      id: Date.now().toString(),
      fromUserId: 'current-user',
      fromUserName: '현재 사용자',
      toUserId,
      message,
      type,
      createdAt: new Date(),
    };

    return {
      success: true,
      data: encouragement,
    };
  }

  async likeJournal(
    journalId: string
  ): Promise<ApiResponse<{ likes: number }>> {
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      data: { likes: Math.floor(Math.random() * 10) + 1 },
    };
  }

  async getRecentJournals(limit: number = 10): Promise<ApiResponse<Journal[]>> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const mockJournals: Journal[] = [
      {
        id: '1',
        userId: '1',
        userName: '김철수',
        title: '오늘의 감정 정리',
        content: '오늘은 새로운 도전을 시작했다. 처음엔 두려웠지만...',
        category: '감정 관리',
        mood: 'good',
        tags: ['도전', '성장'],
        isPublic: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        likes: 5,
        comments: [],
      },
      {
        id: '2',
        userId: '2',
        userName: '이영희',
        title: '감사한 하루',
        content: '작은 것들에 감사하는 마음을 가지려고 노력했다...',
        category: '감사 일기',
        mood: 'very-good',
        tags: ['감사', '행복'],
        isPublic: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        likes: 8,
        comments: [],
      },
    ];

    return {
      success: true,
      data: mockJournals.slice(0, limit),
    };
  }
}
