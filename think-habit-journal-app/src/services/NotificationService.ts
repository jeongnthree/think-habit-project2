// Electron 의존성 제거
// import { ipcRenderer } from "electron";

// 웹 환경용 모의 객체
const ipcRenderer = {
  on: (channel: string, listener: (...args: any[]) => void) => {},
  send: (channel: string, ...args: any[]) => {},
};

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  silent?: boolean;
  urgency?: "low" | "normal" | "critical";
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface InAppNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  actionUrl?: string;
  actionText?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private inAppNotifications: InAppNotification[] = [];
  private listeners: ((notifications: InAppNotification[]) => void)[] = [];
  private permission: NotificationPermission = "default";

  private constructor() {
    this.initializePermissions();
    this.setupEventListeners();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 권한 초기화
  private async initializePermissions(): Promise<void> {
    if ("Notification" in window) {
      this.permission = Notification.permission;

      if (this.permission === "default") {
        this.permission = await Notification.requestPermission();
      }
    }
  }

  // 이벤트 리스너 설정
  private setupEventListeners(): void {
    // 웹 환경에서는 window 이벤트 사용
    if (typeof window !== "undefined") {
      window.addEventListener("notification-clicked", (event: any) => {
        this.handleNotificationClick(event.detail?.notificationId || "");
      });

      window.addEventListener("sync-status-changed", (event: any) => {
        this.handleSyncStatusChange(event.detail?.status);
      });
    }
  }

  // 시스템 알림 표시
  async showSystemNotification(options: NotificationOptions): Promise<void> {
    if (this.permission !== "granted") {
      console.warn("Notification permission not granted");
      return;
    }

    try {
      // 웹 환경에서는 직접 알림 표시
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || "/icons/app-icon.png",
        tag: options.tag,
        silent: options.silent,
      });

      // 알림 클릭 처리
      notification.onclick = () => {
        this.handleNotificationClick(options.tag || "");
      };

      // 자동 닫기 (5초 후)
      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error("Failed to show system notification:", error);
    }
  }

  // 인앱 알림 추가
  addInAppNotification(
    notification: Omit<InAppNotification, "id" | "timestamp" | "read">,
  ): void {
    const newNotification: InAppNotification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      read: false,
    };

    this.inAppNotifications.unshift(newNotification);

    // 최대 100개까지만 보관
    if (this.inAppNotifications.length > 100) {
      this.inAppNotifications = this.inAppNotifications.slice(0, 100);
    }

    this.notifyListeners();
    this.saveToStorage();
  }

  // 알림 읽음 처리
  markAsRead(notificationId: string): void {
    const notification = this.inAppNotifications.find(
      (n) => n.id === notificationId,
    );
    if (notification) {
      notification.read = true;
      this.notifyListeners();
      this.saveToStorage();
    }
  }

  // 모든 알림 읽음 처리
  markAllAsRead(): void {
    this.inAppNotifications.forEach((n) => (n.read = true));
    this.notifyListeners();
    this.saveToStorage();
  }

  // 알림 삭제
  removeNotification(notificationId: string): void {
    this.inAppNotifications = this.inAppNotifications.filter(
      (n) => n.id !== notificationId,
    );
    this.notifyListeners();
    this.saveToStorage();
  }

  // 모든 알림 삭제
  clearAllNotifications(): void {
    this.inAppNotifications = [];
    this.notifyListeners();
    this.saveToStorage();
  }

  // 읽지 않은 알림 개수
  getUnreadCount(): number {
    return this.inAppNotifications.filter((n) => !n.read).length;
  }

  // 알림 목록 가져오기
  getNotifications(): InAppNotification[] {
    return [...this.inAppNotifications];
  }

  // 알림 변경 리스너 등록
  subscribe(
    listener: (notifications: InAppNotification[]) => void,
  ): () => void {
    this.listeners.push(listener);

    // 구독 해제 함수 반환
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // 동기화 상태 알림
  notifySyncStatus(
    status: "syncing" | "success" | "error",
    message?: string,
  ): void {
    const notifications = {
      syncing: {
        type: "info" as const,
        title: "동기화 중",
        message: message || "데이터를 동기화하고 있습니다...",
      },
      success: {
        type: "success" as const,
        title: "동기화 완료",
        message: message || "모든 데이터가 성공적으로 동기화되었습니다.",
      },
      error: {
        type: "error" as const,
        title: "동기화 실패",
        message: message || "동기화 중 오류가 발생했습니다. 다시 시도해주세요.",
        persistent: true,
      },
    };

    const notification = notifications[status];
    this.addInAppNotification(notification);

    // 성공/실패 시 시스템 알림도 표시
    if (status !== "syncing") {
      this.showSystemNotification({
        title: notification.title,
        body: notification.message,
        tag: `sync-${status}`,
      });
    }
  }

  // 일지 작성 리마인더
  scheduleWritingReminder(time: string): void {
    const now = new Date();
    const [hours, minutes] = time.split(":").map(Number);
    const reminderTime = new Date(now);
    reminderTime.setHours(hours, minutes, 0, 0);

    // 오늘 시간이 지났으면 내일로 설정
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    setTimeout(() => {
      this.showSystemNotification({
        title: "일지 작성 시간",
        body: "오늘의 생각을 기록해보세요!",
        tag: "writing-reminder",
        actions: [
          { action: "write", title: "작성하기" },
          { action: "snooze", title: "나중에" },
        ],
      });

      this.addInAppNotification({
        type: "info",
        title: "일지 작성 리마인더",
        message: "오늘의 생각을 기록할 시간입니다.",
        actionUrl: "/journal/new",
        actionText: "작성하기",
      });

      // 다음 날 리마인더 예약
      this.scheduleWritingReminder(time);
    }, timeUntilReminder);
  }

  // 업적 달성 알림
  notifyAchievement(title: string, description: string, icon: string): void {
    this.showSystemNotification({
      title: `🏆 업적 달성: ${title}`,
      body: description,
      tag: "achievement",
    });

    this.addInAppNotification({
      type: "success",
      title: "새로운 업적 달성!",
      message: `${icon} ${title}: ${description}`,
      actionUrl: "/dashboard",
      actionText: "확인하기",
    });
  }

  // 연속 작성 기록 알림
  notifyStreak(days: number, isRecord: boolean): void {
    const title = isRecord ? "새로운 기록!" : "연속 작성 중";
    const message = `${days}일 연속으로 일지를 작성하고 있습니다!`;

    this.showSystemNotification({
      title: `🔥 ${title}`,
      body: message,
      tag: "streak",
    });

    this.addInAppNotification({
      type: isRecord ? "success" : "info",
      title: title,
      message: message,
      actionUrl: "/dashboard",
      actionText: "대시보드 보기",
    });
  }

  // 프라이빗 메서드들
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.inAppNotifications]);
      } catch (error) {
        console.error("Error in notification listener:", error);
      }
    });
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        "inAppNotifications",
        JSON.stringify(
          this.inAppNotifications.map((n) => ({
            ...n,
            timestamp: n.timestamp.toISOString(),
          })),
        ),
      );
    } catch (error) {
      console.error("Failed to save notifications to storage:", error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem("inAppNotifications");
      if (stored) {
        const notifications = JSON.parse(stored);
        this.inAppNotifications = notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      }
    } catch (error) {
      console.error("Failed to load notifications from storage:", error);
      this.inAppNotifications = [];
    }
  }

  private handleNotificationClick(notificationId: string): void {
    // 웹 환경에서는 직접 페이지 이동

    // 알림 ID에 따른 액션 처리
    switch (notificationId) {
      case "writing-reminder":
        if (typeof window !== "undefined") {
          window.location.hash = "/journal/new";
        }
        break;
      case "achievement":
      case "streak":
        if (typeof window !== "undefined") {
          window.location.hash = "/dashboard";
        }
        break;
      default:
        // 특정 알림 찾아서 액션 URL로 이동
        const notification = this.inAppNotifications.find(
          (n) => n.id === notificationId,
        );
        if (notification?.actionUrl && typeof window !== "undefined") {
          window.location.hash = notification.actionUrl;
        }
    }
  }

  private handleSyncStatusChange(status: any): void {
    this.notifySyncStatus(status.type, status.message);
  }

  // 초기화 시 저장된 알림 로드
  initialize(): void {
    this.loadFromStorage();
  }
}

// 싱글톤 인스턴스 내보내기
export const notificationService = NotificationService.getInstance();
