export interface FeedbackData {
  id: string;
  type: "bug" | "feature" | "improvement" | "other";
  title: string;
  description: string;
  rating?: number; // 1-5 별점
  email?: string;
  screenshot?: string;
  systemInfo: SystemInfo;
  timestamp: Date;
  status: "pending" | "sent" | "failed";
}

export interface SystemInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  appVersion: string;
  electronVersion?: string;
}

export interface FeedbackStats {
  totalFeedbacks: number;
  averageRating: number;
  typeDistribution: Record<string, number>;
  recentFeedbacks: FeedbackData[];
}

export class FeedbackService {
  private static instance: FeedbackService;
  private feedbacks: FeedbackData[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService();
    }
    return FeedbackService.instance;
  }

  // 피드백 제출
  async submitFeedback(
    feedbackData: Omit<
      FeedbackData,
      "id" | "timestamp" | "status" | "systemInfo"
    >,
  ): Promise<string> {
    const feedback: FeedbackData = {
      ...feedbackData,
      id: this.generateId(),
      timestamp: new Date(),
      status: "pending",
      systemInfo: this.getSystemInfo(),
    };

    this.feedbacks.unshift(feedback);
    this.saveToStorage();

    try {
      // 실제 서버로 피드백 전송 (현재는 시뮬레이션)
      await this.sendToServer(feedback);
      feedback.status = "sent";
    } catch (error) {
      console.error("Failed to send feedback:", error);
      feedback.status = "failed";
    }

    this.saveToStorage();
    return feedback.id;
  }

  // 스크린샷 캡처
  async captureScreenshot(): Promise<string | null> {
    try {
      // Electron 환경에서는 desktopCapturer 사용
      if (typeof window !== "undefined" && (window as any).electronAPI) {
        return await (window as any).electronAPI.captureScreenshot();
      }

      // 웹 환경에서는 html2canvas 등을 사용할 수 있음
      // 현재는 간단한 구현으로 대체
      return null;
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
      return null;
    }
  }

  // 피드백 목록 가져오기
  getFeedbacks(): FeedbackData[] {
    return [...this.feedbacks];
  }

  // 피드백 통계
  getFeedbackStats(): FeedbackStats {
    const totalFeedbacks = this.feedbacks.length;
    const ratingsWithValues = this.feedbacks.filter(
      (f) => f.rating !== undefined,
    );
    const averageRating =
      ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, f) => sum + (f.rating || 0), 0) /
          ratingsWithValues.length
        : 0;

    const typeDistribution = this.feedbacks.reduce(
      (acc, feedback) => {
        acc[feedback.type] = (acc[feedback.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const recentFeedbacks = this.feedbacks.slice(0, 10);

    return {
      totalFeedbacks,
      averageRating,
      typeDistribution,
      recentFeedbacks,
    };
  }

  // 피드백 삭제
  deleteFeedback(feedbackId: string): void {
    this.feedbacks = this.feedbacks.filter((f) => f.id !== feedbackId);
    this.saveToStorage();
  }

  // 피드백 재전송
  async retryFeedback(feedbackId: string): Promise<boolean> {
    const feedback = this.feedbacks.find((f) => f.id === feedbackId);
    if (!feedback) return false;

    feedback.status = "pending";
    this.saveToStorage();

    try {
      await this.sendToServer(feedback);
      feedback.status = "sent";
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error("Failed to retry feedback:", error);
      feedback.status = "failed";
      this.saveToStorage();
      return false;
    }
  }

  // 시스템 정보 수집
  private getSystemInfo(): SystemInfo {
    const systemInfo: SystemInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      appVersion: "1.0.0", // 실제 앱 버전으로 교체
    };

    // Electron 환경에서 추가 정보
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      systemInfo.electronVersion = (window as any).electronAPI.getVersion();
    }

    return systemInfo;
  }

  // 서버로 피드백 전송 (시뮬레이션)
  private async sendToServer(feedback: FeedbackData): Promise<void> {
    // 실제 구현에서는 API 엔드포인트로 전송
    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          // 90% 확률로 성공
          if (Math.random() > 0.1) {
            resolve();
          } else {
            reject(new Error("Network error"));
          }
        },
        1000 + Math.random() * 2000,
      ); // 1-3초 지연
    });
  }

  // 로컬 스토리지에 저장
  private saveToStorage(): void {
    try {
      const feedbacksToSave = this.feedbacks.map((f) => ({
        ...f,
        timestamp: f.timestamp.toISOString(),
      }));
      localStorage.setItem("feedbacks", JSON.stringify(feedbacksToSave));
    } catch (error) {
      console.error("Failed to save feedbacks to storage:", error);
    }
  }

  // 로컬 스토리지에서 로드
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem("feedbacks");
      if (stored) {
        const feedbacks = JSON.parse(stored);
        this.feedbacks = feedbacks.map((f: any) => ({
          ...f,
          timestamp: new Date(f.timestamp),
        }));
      }
    } catch (error) {
      console.error("Failed to load feedbacks from storage:", error);
      this.feedbacks = [];
    }
  }

  // ID 생성
  private generateId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 피드백 템플릿 생성
  createBugReportTemplate(): Partial<FeedbackData> {
    return {
      type: "bug",
      title: "",
      description: `
**문제 설명:**


**재현 단계:**
1. 
2. 
3. 

**예상 결과:**


**실제 결과:**


**추가 정보:**

      `.trim(),
    };
  }

  createFeatureRequestTemplate(): Partial<FeedbackData> {
    return {
      type: "feature",
      title: "",
      description: `
**기능 설명:**


**사용 사례:**


**예상 이점:**


**추가 세부사항:**

      `.trim(),
    };
  }

  // 자동 피드백 수집 (사용 패턴 기반)
  async collectUsageFeedback(): Promise<void> {
    // 사용 패턴을 분석하여 자동으로 피드백 요청
    const stats = this.getFeedbackStats();

    // 일정 기간 사용 후 피드백 요청
    if (stats.totalFeedbacks === 0) {
      // 첫 번째 피드백 요청 로직
      this.requestFeedback("첫 사용 경험은 어떠셨나요?");
    }
  }

  // 피드백 요청 알림
  private requestFeedback(message: string): void {
    // NotificationService를 통해 피드백 요청 알림 표시
    if (typeof window !== "undefined" && (window as any).notificationService) {
      (window as any).notificationService.addInAppNotification({
        type: "info",
        title: "피드백 요청",
        message: message,
        actionUrl: "/feedback",
        actionText: "피드백 남기기",
      });
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const feedbackService = FeedbackService.getInstance();
