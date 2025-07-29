import { Journal } from "../../types/journal";
import {
  AuthResult,
  BasePlatformAdapter,
  PlatformInfo,
  SyncConfig,
  SyncErrorType,
  SyncResult,
  Template,
} from "./PlatformAdapter";

interface ThinkHabitCredentials {
  email: string;
  password: string;
}

interface ThinkHabitRefreshCredentials {
  refreshToken: string;
}

export class ThinkHabitAdapter extends BasePlatformAdapter {
  readonly id = "think-habit";
  readonly name = "Think-Habit";
  readonly type = "think-habit" as const;

  private readonly apiBaseUrl: string;

  constructor(
    apiBaseUrl: string = process.env.THINK_HABIT_API_URL ||
      "https://api.think-habit.com",
  ) {
    super();
    this.apiBaseUrl = apiBaseUrl;
  }

  async authenticate(
    credentials: ThinkHabitCredentials | ThinkHabitRefreshCredentials,
  ): Promise<AuthResult> {
    try {
      const isRefresh = "refreshToken" in credentials;
      const endpoint = isRefresh ? "/auth/refresh" : "/auth/login";

      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || "Authentication failed",
        };
      }

      const data = await response.json();

      // 토큰 저장
      this.authToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      this.tokenExpiresAt = new Date(data.expiresAt);

      return {
        success: true,
        token: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: new Date(data.expiresAt),
        user: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          avatar: data.user.avatar,
          permissions: data.user.permissions || [],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async syncJournal(journal: Journal, config: SyncConfig): Promise<SyncResult> {
    try {
      if (!this.authToken) {
        throw new Error("Not authenticated");
      }

      // 콘텐츠 필터링 적용
      const filteredJournal = this.applyContentFilter(
        journal,
        config.contentFilter,
      );

      // Think-Habit API 형식으로 변환
      const payload = this.convertToThinkHabitFormat(filteredJournal, config);

      const response = await fetch(`${this.apiBaseUrl}/journals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw this.createSyncError(
          this.mapHttpStatusToErrorType(response.status),
          error.message || "Sync failed",
          { code: error.code },
        );
      }

      const result = await response.json();

      return {
        success: true,
        platformJournalId: result.id,
        platformUrl: `${this.apiBaseUrl.replace("api.", "www.")}/journals/${result.id}`,
        metadata: {
          boardId: result.boardId,
          views: result.views || 0,
          likes: result.likes || 0,
        },
      };
    } catch (error) {
      if (error.type) {
        // 이미 SyncError인 경우
        return { success: false, error };
      }

      return {
        success: false,
        error: this.createSyncError(
          SyncErrorType.PLATFORM_ERROR,
          error instanceof Error ? error.message : "Unknown error",
        ),
      };
    }
  }

  async deleteJournal(journalId: string): Promise<boolean> {
    try {
      if (!this.authToken) {
        return false;
      }

      const response = await fetch(`${this.apiBaseUrl}/journals/${journalId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to delete journal from Think-Habit:", error);
      return false;
    }
  }

  async getTemplates(): Promise<Template[]> {
    try {
      if (!this.authToken) {
        return [];
      }

      const response = await fetch(`${this.apiBaseUrl}/templates`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const templates = await response.json();

      return templates.map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        type: template.type,
        content: template.content,
        version: template.version,
        platformId: this.id,
        platformName: this.name,
        isDefault: template.isDefault || false,
        createdAt: new Date(template.createdAt),
        updatedAt: new Date(template.updatedAt),
      }));
    } catch (error) {
      console.error("Failed to fetch Think-Habit templates:", error);
      return [];
    }
  }

  async getPlatformInfo(): Promise<PlatformInfo> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/platform/info`, {
        headers: this.authToken
          ? {
              Authorization: `Bearer ${this.authToken}`,
            }
          : {},
      });

      if (!response.ok) {
        throw new Error("Failed to fetch platform info");
      }

      const info = await response.json();

      return {
        id: this.id,
        name: this.name,
        description: info.description || "Think-Habit 공식 플랫폼",
        version: info.version || "1.0.0",
        features: info.features || [
          {
            name: "structured-journals",
            enabled: true,
            description: "구조화된 일지",
          },
          { name: "photo-journals", enabled: true, description: "사진 일지" },
          {
            name: "community-board",
            enabled: true,
            description: "커뮤니티 게시판",
          },
          { name: "achievements", enabled: true, description: "업적 시스템" },
        ],
        limits: {
          maxFileSize: info.limits?.maxFileSize || 10 * 1024 * 1024, // 10MB
          maxFilesPerJournal: info.limits?.maxFilesPerJournal || 10,
          maxJournalsPerDay: info.limits?.maxJournalsPerDay || 50,
          supportedImageFormats: info.limits?.supportedImageFormats || [
            "jpg",
            "jpeg",
            "png",
            "gif",
            "webp",
          ],
        },
        supportedContentTypes: info.supportedContentTypes || [
          "structured",
          "photo",
        ],
      };
    } catch (error) {
      // 기본 정보 반환
      return {
        id: this.id,
        name: this.name,
        description: "Think-Habit 공식 플랫폼",
        version: "1.0.0",
        features: [
          {
            name: "structured-journals",
            enabled: true,
            description: "구조화된 일지",
          },
          { name: "photo-journals", enabled: true, description: "사진 일지" },
          {
            name: "community-board",
            enabled: true,
            description: "커뮤니티 게시판",
          },
        ],
        limits: {
          maxFileSize: 10 * 1024 * 1024,
          maxFilesPerJournal: 10,
          maxJournalsPerDay: 50,
          supportedImageFormats: ["jpg", "jpeg", "png", "gif", "webp"],
        },
        supportedContentTypes: ["structured", "photo"],
      };
    }
  }

  private convertToThinkHabitFormat(journal: Journal, config: SyncConfig): any {
    return {
      title: config.customTitle || journal.title,
      type: journal.type,
      content: journal.content,
      tags: config.tags.length > 0 ? config.tags : journal.tags,
      privacy: config.privacy,
      createdAt: journal.createdAt,
      metadata: {
        appVersion: process.env.APP_VERSION || "1.0.0",
        syncedAt: new Date().toISOString(),
      },
    };
  }

  private mapHttpStatusToErrorType(status: number): SyncErrorType {
    switch (status) {
      case 401:
      case 403:
        return SyncErrorType.AUTH_ERROR;
      case 400:
        return SyncErrorType.VALIDATION_ERROR;
      case 413:
        return SyncErrorType.QUOTA_EXCEEDED;
      case 422:
        return SyncErrorType.CONTENT_REJECTED;
      case 429:
        return SyncErrorType.QUOTA_EXCEEDED;
      default:
        return SyncErrorType.PLATFORM_ERROR;
    }
  }
}
