import { Journal } from "../../types/journal";
import { ErrorHandlingService, PlatformError } from "../ErrorHandlingService";
import { ErrorReportingService } from "../ErrorReportingService";

// Platform Adapter 인터페이스
export interface PlatformAdapter {
  readonly id: string;
  readonly name: string;
  readonly type: "think-habit" | "group";

  // 인증 관련
  authenticate(credentials: any): Promise<AuthResult>;
  refreshAuth(): Promise<boolean>;
  validateConnection(): Promise<boolean>;

  // 일지 동기화
  syncJournal(journal: Journal, config: SyncConfig): Promise<SyncResult>;
  deleteJournal(journalId: string): Promise<boolean>;

  // 템플릿 관리
  getTemplates(): Promise<Template[]>;

  // 플랫폼 정보
  getPlatformInfo(): Promise<PlatformInfo>;

  // 건강 상태 체크
  performHealthCheck(): Promise<HealthCheckResult>;

  // 오류 처리 서비스 설정
  setErrorHandlingService(service: ErrorHandlingService): void;
  setErrorReportingService(service: ErrorReportingService): void;
}

// 건강 상태 체크 결과
export interface HealthCheckResult {
  isHealthy: boolean;
  responseTime: number;
  lastSuccessfulSync?: Date;
  issues: HealthIssue[];
  metrics: {
    uptime: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

export interface HealthIssue {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  detectedAt: Date;
}

// 인증 결과
export interface AuthResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  user?: PlatformUser;
  error?: string;
}

// 동기화 설정
export interface SyncConfig {
  privacy: "public" | "private" | "group-only";
  autoSync: boolean;
  contentFilter: ContentFilter;
  customTitle?: string;
  tags: string[];
  priority: number;
}

// 콘텐츠 필터
export interface ContentFilter {
  excludePersonalNotes: boolean;
  excludePhotos: boolean;
  excludeTags: string[];
  customRules: FilterRule[];
}

export interface FilterRule {
  field: string;
  condition: "contains" | "equals" | "startsWith" | "endsWith";
  value: string;
  action: "exclude" | "replace" | "anonymize";
}

// 동기화 결과
export interface SyncResult {
  success: boolean;
  platformJournalId?: string;
  platformUrl?: string;
  error?: SyncError;
  metadata?: any;
}

export interface SyncError {
  type: SyncErrorType;
  message: string;
  code?: string;
  retryable: boolean;
  retryAfter?: number;
  suggestions?: string[];
}

export enum SyncErrorType {
  NETWORK_ERROR = "network_error",
  AUTH_ERROR = "auth_error",
  VALIDATION_ERROR = "validation_error",
  PLATFORM_ERROR = "platform_error",
  QUOTA_EXCEEDED = "quota_exceeded",
  CONTENT_REJECTED = "content_rejected",
  PERMISSION_DENIED = "permission_denied",
  RATE_LIMIT = "rate_limit",
  UNKNOWN_ERROR = "unknown_error",
}

// 템플릿
export interface Template {
  id: string;
  name: string;
  description: string;
  type: "structured" | "photo";
  content: any;
  version: string;
  platformId: string;
  platformName: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 플랫폼 정보
export interface PlatformInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  features: PlatformFeature[];
  limits: PlatformLimits;
  supportedContentTypes: string[];
}

export interface PlatformFeature {
  name: string;
  enabled: boolean;
  description: string;
  config?: any;
}

export interface PlatformLimits {
  maxFileSize: number;
  maxFilesPerJournal: number;
  maxJournalsPerDay: number;
  supportedImageFormats: string[];
}

// 플랫폼 사용자
export interface PlatformUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
  permissions: string[];
}

// 기본 Platform Adapter 클래스
export abstract class BasePlatformAdapter implements PlatformAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly type: "think-habit" | "group";

  protected authToken?: string;
  protected refreshToken?: string;
  protected tokenExpiresAt?: Date;
  protected errorHandlingService?: ErrorHandlingService;
  protected errorReportingService?: ErrorReportingService;
  protected healthMetrics = {
    lastSuccessfulSync: null as Date | null,
    consecutiveFailures: 0,
    totalRequests: 0,
    successfulRequests: 0,
    responseTimes: [] as number[],
  };

  abstract authenticate(credentials: any): Promise<AuthResult>;
  abstract syncJournal(
    journal: Journal,
    config: SyncConfig,
  ): Promise<SyncResult>;
  abstract getTemplates(): Promise<Template[]>;
  abstract getPlatformInfo(): Promise<PlatformInfo>;

  setErrorHandlingService(service: ErrorHandlingService): void {
    this.errorHandlingService = service;
  }

  setErrorReportingService(service: ErrorReportingService): void {
    this.errorReportingService = service;
  }

  async refreshAuth(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const result = await this.authenticate({
        refreshToken: this.refreshToken,
      });
      if (result.success && result.token) {
        this.authToken = result.token;
        this.refreshToken = result.refreshToken;
        this.tokenExpiresAt = result.expiresAt;
        return true;
      }
    } catch (error) {
      console.error(`Failed to refresh auth for ${this.name}:`, error);
    }

    return false;
  }

  async validateConnection(): Promise<boolean> {
    const startTime = Date.now();

    try {
      // 토큰이 만료되었다면 갱신 시도
      if (this.isTokenExpired()) {
        const refreshed = await this.refreshAuth();
        if (!refreshed) {
          await this.handleError(
            new Error("Token refresh failed"),
            "validateConnection",
          );
          return false;
        }
      }

      // 플랫폼 정보 조회로 연결 테스트
      await this.getPlatformInfo();

      // 성공 메트릭 업데이트
      this.updateSuccessMetrics(Date.now() - startTime);
      return true;
    } catch (error) {
      await this.handleError(error, "validateConnection");
      return false;
    }
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const issues: HealthIssue[] = [];

    try {
      // 연결 상태 확인
      const isConnected = await this.validateConnection();
      const responseTime = Date.now() - startTime;

      // 메트릭 계산
      const errorRate =
        this.healthMetrics.totalRequests > 0
          ? 1 -
            this.healthMetrics.successfulRequests /
              this.healthMetrics.totalRequests
          : 0;

      const averageResponseTime =
        this.healthMetrics.responseTimes.length > 0
          ? this.healthMetrics.responseTimes.reduce((a, b) => a + b, 0) /
            this.healthMetrics.responseTimes.length
          : 0;

      const uptime =
        this.healthMetrics.totalRequests > 0
          ? (this.healthMetrics.successfulRequests /
              this.healthMetrics.totalRequests) *
            100
          : 100;

      // 문제 감지
      if (!isConnected) {
        issues.push({
          type: "connection_failed",
          severity: "high",
          message: "플랫폼에 연결할 수 없습니다.",
          detectedAt: new Date(),
        });
      }

      if (this.healthMetrics.consecutiveFailures > 3) {
        issues.push({
          type: "consecutive_failures",
          severity: "medium",
          message: `연속 ${this.healthMetrics.consecutiveFailures}회 실패`,
          detectedAt: new Date(),
        });
      }

      if (errorRate > 0.5) {
        issues.push({
          type: "high_error_rate",
          severity: "medium",
          message: `오류율이 높습니다 (${(errorRate * 100).toFixed(1)}%)`,
          detectedAt: new Date(),
        });
      }

      return {
        isHealthy: isConnected && issues.length === 0,
        responseTime,
        lastSuccessfulSync: this.healthMetrics.lastSuccessfulSync,
        issues,
        metrics: {
          uptime,
          errorRate,
          averageResponseTime,
        },
      };
    } catch (error) {
      await this.handleError(error, "performHealthCheck");

      return {
        isHealthy: false,
        responseTime: Date.now() - startTime,
        lastSuccessfulSync: this.healthMetrics.lastSuccessfulSync,
        issues: [
          {
            type: "health_check_failed",
            severity: "critical",
            message: "건강 상태 확인 실패",
            detectedAt: new Date(),
          },
        ],
        metrics: {
          uptime: 0,
          errorRate: 1,
          averageResponseTime: 0,
        },
      };
    }
  }

  async deleteJournal(journalId: string): Promise<boolean> {
    try {
      // 기본 구현: 대부분의 플랫폼에서 삭제는 지원하지 않을 수 있음
      console.warn(`Delete not implemented for platform ${this.name}`);
      return false;
    } catch (error) {
      await this.handleError(error, "deleteJournal", { journalId });
      return false;
    }
  }

  // 오류 처리 헬퍼 메서드
  protected async handleError(
    error: any,
    operation: string,
    context?: { journalId?: string; [key: string]: any },
  ): Promise<PlatformError | null> {
    this.updateFailureMetrics();

    if (this.errorHandlingService) {
      const platformError =
        await this.errorHandlingService.categorizeAndHandleError(
          this.id,
          this.name,
          error,
          { ...context, operation },
        );

      // 오류 보고
      if (this.errorReportingService) {
        await this.errorReportingService.reportError(platformError);
      }

      return platformError;
    }

    // 기본 오류 로깅
    console.error(`Error in ${this.name} ${operation}:`, error);
    return null;
  }

  // 성공 메트릭 업데이트
  protected updateSuccessMetrics(responseTime: number): void {
    this.healthMetrics.totalRequests++;
    this.healthMetrics.successfulRequests++;
    this.healthMetrics.consecutiveFailures = 0;
    this.healthMetrics.lastSuccessfulSync = new Date();

    // 응답 시간 기록 (최대 100개)
    this.healthMetrics.responseTimes.push(responseTime);
    if (this.healthMetrics.responseTimes.length > 100) {
      this.healthMetrics.responseTimes =
        this.healthMetrics.responseTimes.slice(-100);
    }

    // 건강 메트릭 업데이트
    if (this.errorHandlingService) {
      this.errorHandlingService.updateHealthMetrics(this.id, {
        platformName: this.name,
        status: "healthy",
        lastSuccessfulSync: this.healthMetrics.lastSuccessfulSync,
        errorRate:
          1 -
          this.healthMetrics.successfulRequests /
            this.healthMetrics.totalRequests,
        averageResponseTime:
          this.healthMetrics.responseTimes.reduce((a, b) => a + b, 0) /
          this.healthMetrics.responseTimes.length,
        consecutiveFailures: 0,
        uptime:
          (this.healthMetrics.successfulRequests /
            this.healthMetrics.totalRequests) *
          100,
      });
    }

    // 성능 메트릭 기록
    if (this.errorReportingService) {
      this.errorReportingService.recordPerformanceMetrics(this.id, {
        syncDuration: responseTime,
        apiResponseTime: responseTime,
        databaseQueryTime: 0,
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0,
        networkLatency: responseTime,
      });
    }
  }

  // 실패 메트릭 업데이트
  protected updateFailureMetrics(): void {
    this.healthMetrics.totalRequests++;
    this.healthMetrics.consecutiveFailures++;

    // 건강 메트릭 업데이트
    if (this.errorHandlingService) {
      const errorRate =
        1 -
        this.healthMetrics.successfulRequests /
          this.healthMetrics.totalRequests;
      const status =
        errorRate > 0.5
          ? "unhealthy"
          : errorRate > 0.2
            ? "degraded"
            : "healthy";

      this.errorHandlingService.updateHealthMetrics(this.id, {
        platformName: this.name,
        status,
        errorRate,
        consecutiveFailures: this.healthMetrics.consecutiveFailures,
        uptime:
          (this.healthMetrics.successfulRequests /
            this.healthMetrics.totalRequests) *
          100,
      });
    }
  }

  protected isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) {
      return false;
    }

    // 5분 여유를 두고 만료 체크
    const bufferTime = 5 * 60 * 1000;
    return Date.now() + bufferTime >= this.tokenExpiresAt.getTime();
  }

  protected applyContentFilter(
    journal: Journal,
    filter: ContentFilter,
  ): Journal {
    let filteredJournal = { ...journal };

    // 개인 노트 제외
    if (filter.excludePersonalNotes && journal.type === "structured") {
      const content = { ...journal.content } as any;
      if (content.notes) {
        content.notes = "";
      }
      filteredJournal.content = content;
    }

    // 사진 제외
    if (filter.excludePhotos && journal.type === "photo") {
      const content = { ...journal.content } as any;
      if (content.photos) {
        content.photos = [];
      }
      filteredJournal.content = content;
    }

    // 커스텀 규칙 적용
    filter.customRules.forEach((rule) => {
      filteredJournal = this.applyFilterRule(filteredJournal, rule);
    });

    return filteredJournal;
  }

  private applyFilterRule(journal: Journal, rule: FilterRule): Journal {
    // 커스텀 필터 규칙 적용 로직
    // 실제 구현에서는 더 복잡한 규칙 처리가 필요
    return journal;
  }

  protected createSyncError(
    type: SyncErrorType,
    message: string,
    options: Partial<SyncError> = {},
  ): SyncError {
    return {
      type,
      message,
      retryable: options.retryable ?? this.isRetryableError(type),
      ...options,
    };
  }

  private isRetryableError(type: SyncErrorType): boolean {
    switch (type) {
      case SyncErrorType.NETWORK_ERROR:
      case SyncErrorType.QUOTA_EXCEEDED:
        return true;
      case SyncErrorType.AUTH_ERROR:
      case SyncErrorType.VALIDATION_ERROR:
      case SyncErrorType.CONTENT_REJECTED:
      case SyncErrorType.PERMISSION_DENIED:
        return false;
      default:
        return false;
    }
  }
}
