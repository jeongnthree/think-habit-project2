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

export interface GroupConfig {
  id: string;
  name: string;
  description: string;
  apiEndpoint: string;
  authType: "oauth" | "api-key" | "custom";
  authConfig: any;
  features: string[];
  customHeaders?: Record<string, string>;
}

interface GroupCredentials {
  type: "oauth" | "api-key" | "custom";
  data: any;
}

export class GroupPlatformAdapter extends BasePlatformAdapter {
  readonly id: string;
  readonly name: string;
  readonly type = "group" as const;

  private readonly config: GroupConfig;
  private readonly apiEndpoint: string;

  constructor(config: GroupConfig) {
    super();
    this.config = config;
    this.id = config.id;
    this.name = config.name;
    this.apiEndpoint = config.apiEndpoint.replace(/\/$/, ""); // 끝의 슬래시 제거
  }

  async authenticate(credentials: GroupCredentials): Promise<AuthResult> {
    try {
      switch (credentials.type) {
        case "oauth":
          return await this.authenticateOAuth(credentials.data);
        case "api-key":
          return await this.authenticateApiKey(credentials.data);
        case "custom":
          return await this.authenticateCustom(credentials.data);
        default:
          return {
            success: false,
            error: "Unsupported authentication type",
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      };
    }
  }

  private async authenticateOAuth(data: any): Promise<AuthResult> {
    const response = await fetch(`${this.apiEndpoint}/auth/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.config.customHeaders,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: data.code,
        client_id: data.clientId,
        client_secret: data.clientSecret,
        redirect_uri: data.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || "OAuth authentication failed");
    }

    const result = await response.json();

    this.authToken = result.access_token;
    this.refreshToken = result.refresh_token;
    this.tokenExpiresAt = new Date(Date.now() + result.expires_in * 1000);

    return {
      success: true,
      token: result.access_token,
      refreshToken: result.refresh_token,
      expiresAt: this.tokenExpiresAt,
      user: result.user,
    };
  }

  private async authenticateApiKey(data: any): Promise<AuthResult> {
    // API 키 검증
    const response = await fetch(`${this.apiEndpoint}/auth/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": data.apiKey,
        ...this.config.customHeaders,
      },
      body: JSON.stringify({
        key: data.apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error("Invalid API key");
    }

    const result = await response.json();

    this.authToken = data.apiKey;

    return {
      success: true,
      token: data.apiKey,
      user: result.user,
    };
  }

  private async authenticateCustom(data: any): Promise<AuthResult> {
    // 커스텀 인증 로직 (그룹별로 다를 수 있음)
    const response = await fetch(`${this.apiEndpoint}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.config.customHeaders,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Custom authentication failed");
    }

    const result = await response.json();

    this.authToken = result.token;
    this.refreshToken = result.refreshToken;
    if (result.expiresIn) {
      this.tokenExpiresAt = new Date(Date.now() + result.expiresIn * 1000);
    }

    return {
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
      expiresAt: this.tokenExpiresAt,
      user: result.user,
    };
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

      // 그룹 플랫폼 형식으로 변환
      const payload = this.convertToGroupFormat(filteredJournal, config);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...this.config.customHeaders,
      };

      // 인증 헤더 추가
      if (this.config.authType === "api-key") {
        headers["X-API-Key"] = this.authToken;
      } else {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.apiEndpoint}/journals`, {
        method: "POST",
        headers,
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
        platformUrl: result.url || `${this.apiEndpoint}/journals/${result.id}`,
        metadata: {
          groupId: this.config.id,
          groupName: this.config.name,
          ...result.metadata,
        },
      };
    } catch (error) {
      if (error.type) {
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

      const headers: Record<string, string> = {
        ...this.config.customHeaders,
      };

      if (this.config.authType === "api-key") {
        headers["X-API-Key"] = this.authToken;
      } else {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(
        `${this.apiEndpoint}/journals/${journalId}`,
        {
          method: "DELETE",
          headers,
        },
      );

      return response.ok;
    } catch (error) {
      console.error(`Failed to delete journal from ${this.name}:`, error);
      return false;
    }
  }

  async getTemplates(): Promise<Template[]> {
    try {
      if (!this.authToken) {
        return [];
      }

      const headers: Record<string, string> = {
        ...this.config.customHeaders,
      };

      if (this.config.authType === "api-key") {
        headers["X-API-Key"] = this.authToken;
      } else {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.apiEndpoint}/templates`, {
        headers,
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
      console.error(`Failed to fetch templates from ${this.name}:`, error);
      return [];
    }
  }

  async getPlatformInfo(): Promise<PlatformInfo> {
    try {
      const headers: Record<string, string> = {
        ...this.config.customHeaders,
      };

      if (this.authToken) {
        if (this.config.authType === "api-key") {
          headers["X-API-Key"] = this.authToken;
        } else {
          headers["Authorization"] = `Bearer ${this.authToken}`;
        }
      }

      const response = await fetch(`${this.apiEndpoint}/info`, {
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch platform info");
      }

      const info = await response.json();

      return {
        id: this.id,
        name: this.name,
        description: info.description || this.config.description,
        version: info.version || "1.0.0",
        features:
          info.features ||
          this.config.features.map((name) => ({
            name,
            enabled: true,
            description: name,
          })),
        limits: {
          maxFileSize: info.limits?.maxFileSize || 5 * 1024 * 1024, // 5MB
          maxFilesPerJournal: info.limits?.maxFilesPerJournal || 5,
          maxJournalsPerDay: info.limits?.maxJournalsPerDay || 20,
          supportedImageFormats: info.limits?.supportedImageFormats || [
            "jpg",
            "jpeg",
            "png",
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
        description: this.config.description,
        version: "1.0.0",
        features: this.config.features.map((name) => ({
          name,
          enabled: true,
          description: name,
        })),
        limits: {
          maxFileSize: 5 * 1024 * 1024,
          maxFilesPerJournal: 5,
          maxJournalsPerDay: 20,
          supportedImageFormats: ["jpg", "jpeg", "png"],
        },
        supportedContentTypes: ["structured", "photo"],
      };
    }
  }

  private convertToGroupFormat(journal: Journal, config: SyncConfig): any {
    return {
      title: config.customTitle || journal.title,
      type: journal.type,
      content: journal.content,
      tags: config.tags.length > 0 ? config.tags : journal.tags,
      privacy: config.privacy,
      createdAt: journal.createdAt,
      metadata: {
        sourceApp: "think-habit-journal-app",
        appVersion: process.env.APP_VERSION || "1.0.0",
        syncedAt: new Date().toISOString(),
        groupId: this.config.id,
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

  // 그룹 연결 테스트를 위한 정적 메서드
  static async testConnection(config: GroupConfig): Promise<boolean> {
    try {
      const response = await fetch(`${config.apiEndpoint}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...config.customHeaders,
        },
      });

      return response.ok;
    } catch (error) {
      console.error(`Connection test failed for ${config.name}:`, error);
      return false;
    }
  }
}
