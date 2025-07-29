import { notificationService } from "./NotificationService";
import { SyncErrorType } from "./platforms/PlatformAdapter";

// 에러 카테고리 정의
export enum ErrorCategory {
  NETWORK = "network",
  AUTHENTICATION = "authentication",
  VALIDATION = "validation",
  PLATFORM_SPECIFIC = "platform_specific",
  QUOTA = "quota",
  CONTENT = "content",
  PERMISSION = "permission",
  SYSTEM = "system",
}

// 에러 심각도 레벨
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// 에러 복구 액션
export enum RecoveryAction {
  RETRY = "retry",
  REAUTH = "reauth",
  MODIFY_CONTENT = "modify_content",
  CHANGE_SETTINGS = "change_settings",
  CONTACT_SUPPORT = "contact_support",
  WAIT_AND_RETRY = "wait_and_retry",
  MANUAL_INTERVENTION = "manual_intervention",
}

// 플랫폼별 에러 정보
export interface PlatformError {
  id: string;
  platformId: string;
  platformName: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  type: SyncErrorType;
  message: string;
  originalError?: any;
  code?: string;
  timestamp: Date;
  journalId?: string;
  retryCount: number;
  maxRetries: number;
  isResolved: boolean;
  recoveryActions: RecoveryAction[];
  userFriendlyMessage: string;
  technicalDetails: string;
  suggestions: string[];
  metadata: Record<string, any>;
}

// 에러 해결 워크플로우
export interface ErrorResolutionWorkflow {
  errorId: string;
  steps: ResolutionStep[];
  currentStepIndex: number;
  isCompleted: boolean;
  userInteractionRequired: boolean;
  estimatedTimeToResolve: number; // minutes
}

export interface ResolutionStep {
  id: string;
  title: string;
  description: string;
  action: RecoveryAction;
  isCompleted: boolean;
  isSkippable: boolean;
  userInput?: UserInputRequirement;
  automatedAction?: () => Promise<boolean>;
}

export interface UserInputRequirement {
  type: "text" | "select" | "confirm" | "file";
  prompt: string;
  options?: string[];
  validation?: (value: any) => boolean;
}

// 건강 모니터링 메트릭
export interface HealthMetrics {
  platformId: string;
  platformName: string;
  status: "healthy" | "degraded" | "unhealthy" | "offline";
  lastSuccessfulSync: Date | null;
  errorRate: number; // 0-1
  averageResponseTime: number; // ms
  consecutiveFailures: number;
  uptime: number; // percentage
  lastHealthCheck: Date;
  issues: HealthIssue[];
}

export interface HealthIssue {
  type: string;
  severity: ErrorSeverity;
  message: string;
  detectedAt: Date;
  isResolved: boolean;
}

// 에러 분석 리포트
export interface ErrorAnalyticsReport {
  timeRange: { start: Date; end: Date };
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByPlatform: Record<string, number>;
  topErrors: Array<{ message: string; count: number; lastOccurred: Date }>;
  resolutionStats: {
    averageResolutionTime: number;
    successfulResolutions: number;
    manualInterventions: number;
  };
  trends: {
    errorRateChange: number; // percentage change
    mostProblematicPlatform: string;
    improvingCategories: ErrorCategory[];
    worseningCategories: ErrorCategory[];
  };
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errors: Map<string, PlatformError> = new Map();
  private workflows: Map<string, ErrorResolutionWorkflow> = new Map();
  private healthMetrics: Map<string, HealthMetrics> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startHealthMonitoring();
  }

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  // 플랫폼별 에러 분류 및 처리
  async categorizeAndHandleError(
    platformId: string,
    platformName: string,
    error: any,
    context?: { journalId?: string; operation?: string },
  ): Promise<PlatformError> {
    const categorizedError = this.categorizeError(
      error,
      platformId,
      platformName,
      context,
    );

    // 에러 저장
    this.errors.set(categorizedError.id, categorizedError);

    // 자동 복구 시도
    await this.attemptAutomaticRecovery(categorizedError);

    // 사용자 알림 (심각도에 따라)
    if (
      categorizedError.severity === ErrorSeverity.HIGH ||
      categorizedError.severity === ErrorSeverity.CRITICAL
    ) {
      await this.notifyUser(categorizedError);
    }

    // 분석을 위한 로깅
    this.logErrorForAnalytics(categorizedError);

    return categorizedError;
  }

  private categorizeError(
    error: any,
    platformId: string,
    platformName: string,
    context?: { journalId?: string; operation?: string },
  ): PlatformError {
    const errorId = `${platformId}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    let category = ErrorCategory.SYSTEM;
    let severity = ErrorSeverity.MEDIUM;
    let recoveryActions: RecoveryAction[] = [RecoveryAction.RETRY];
    let userFriendlyMessage = "알 수 없는 오류가 발생했습니다.";
    let suggestions: string[] = [];

    // 에러 타입별 분류
    if (error.code === "NETWORK_ERROR" || error.message?.includes("network")) {
      category = ErrorCategory.NETWORK;
      severity = ErrorSeverity.MEDIUM;
      recoveryActions = [RecoveryAction.WAIT_AND_RETRY, RecoveryAction.RETRY];
      userFriendlyMessage = "네트워크 연결에 문제가 있습니다.";
      suggestions = [
        "인터넷 연결을 확인해주세요",
        "잠시 후 다시 시도해주세요",
        "방화벽 설정을 확인해주세요",
      ];
    } else if (error.code === "AUTH_ERROR" || error.status === 401) {
      category = ErrorCategory.AUTHENTICATION;
      severity = ErrorSeverity.HIGH;
      recoveryActions = [RecoveryAction.REAUTH];
      userFriendlyMessage = "인증에 실패했습니다.";
      suggestions = [
        "다시 로그인해주세요",
        "계정 정보를 확인해주세요",
        "비밀번호를 재설정해주세요",
      ];
    } else if (error.code === "VALIDATION_ERROR" || error.status === 400) {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.LOW;
      recoveryActions = [RecoveryAction.MODIFY_CONTENT];
      userFriendlyMessage = "입력 데이터에 문제가 있습니다.";
      suggestions = [
        "입력 내용을 다시 확인해주세요",
        "필수 항목을 모두 입력했는지 확인해주세요",
      ];
    } else if (error.status === 429) {
      category = ErrorCategory.QUOTA;
      severity = ErrorSeverity.MEDIUM;
      recoveryActions = [RecoveryAction.WAIT_AND_RETRY];
      userFriendlyMessage = "요청 한도를 초과했습니다.";
      suggestions = ["잠시 후 다시 시도해주세요", "동시 요청 수를 줄여주세요"];
    } else if (error.status === 403) {
      category = ErrorCategory.PERMISSION;
      severity = ErrorSeverity.HIGH;
      recoveryActions = [
        RecoveryAction.CHANGE_SETTINGS,
        RecoveryAction.CONTACT_SUPPORT,
      ];
      userFriendlyMessage = "권한이 부족합니다.";
      suggestions = [
        "관리자에게 권한을 요청해주세요",
        "계정 설정을 확인해주세요",
      ];
    }

    return {
      id: errorId,
      platformId,
      platformName,
      category,
      severity,
      type: this.mapToSyncErrorType(error),
      message: error.message || "Unknown error",
      originalError: error,
      code: error.code,
      timestamp: new Date(),
      journalId: context?.journalId,
      retryCount: 0,
      maxRetries: this.getMaxRetries(category),
      isResolved: false,
      recoveryActions,
      userFriendlyMessage,
      technicalDetails: this.formatTechnicalDetails(error),
      suggestions,
      metadata: {
        operation: context?.operation,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      },
    };
  }

  private mapToSyncErrorType(error: any): SyncErrorType {
    if (error.code === "NETWORK_ERROR") return SyncErrorType.NETWORK_ERROR;
    if (error.status === 401) return SyncErrorType.AUTH_ERROR;
    if (error.status === 400) return SyncErrorType.VALIDATION_ERROR;
    if (error.status === 429) return SyncErrorType.RATE_LIMIT;
    if (error.status === 403) return SyncErrorType.PERMISSION_DENIED;
    return SyncErrorType.UNKNOWN_ERROR;
  }

  private getMaxRetries(category: ErrorCategory): number {
    switch (category) {
      case ErrorCategory.NETWORK:
        return 5;
      case ErrorCategory.AUTHENTICATION:
        return 1;
      case ErrorCategory.VALIDATION:
        return 0;
      case ErrorCategory.QUOTA:
        return 3;
      default:
        return 3;
    }
  }

  private formatTechnicalDetails(error: any): string {
    return JSON.stringify(
      {
        message: error.message,
        stack: error.stack,
        code: error.code,
        status: error.status,
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    );
  }

  // 자동 복구 시도
  private async attemptAutomaticRecovery(
    error: PlatformError,
  ): Promise<boolean> {
    if (error.retryCount >= error.maxRetries) {
      return false;
    }

    for (const action of error.recoveryActions) {
      try {
        const success = await this.executeRecoveryAction(action, error);
        if (success) {
          error.isResolved = true;
          error.retryCount++;
          return true;
        }
      } catch (recoveryError) {
        console.error(`Recovery action ${action} failed:`, recoveryError);
      }
    }

    return false;
  }

  private async executeRecoveryAction(
    action: RecoveryAction,
    error: PlatformError,
  ): Promise<boolean> {
    switch (action) {
      case RecoveryAction.RETRY:
        // 간단한 재시도 로직
        await this.delay(1000 * Math.pow(2, error.retryCount)); // Exponential backoff
        return true; // 실제로는 원래 작업을 재시도해야 함

      case RecoveryAction.WAIT_AND_RETRY:
        await this.delay(5000);
        return true;

      default:
        return false; // 사용자 개입 필요
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 사용자 친화적 에러 해결 워크플로우 생성
  createResolutionWorkflow(errorId: string): ErrorResolutionWorkflow {
    const error = this.errors.get(errorId);
    if (!error) {
      throw new Error(`Error ${errorId} not found`);
    }

    const steps = this.generateResolutionSteps(error);
    const workflow: ErrorResolutionWorkflow = {
      errorId,
      steps,
      currentStepIndex: 0,
      isCompleted: false,
      userInteractionRequired: steps.some(
        (step) => step.userInput !== undefined,
      ),
      estimatedTimeToResolve: this.estimateResolutionTime(error),
    };

    this.workflows.set(errorId, workflow);
    return workflow;
  }

  private generateResolutionSteps(error: PlatformError): ResolutionStep[] {
    const steps: ResolutionStep[] = [];

    switch (error.category) {
      case ErrorCategory.NETWORK:
        steps.push({
          id: "check_connection",
          title: "네트워크 연결 확인",
          description: "인터넷 연결 상태를 확인합니다.",
          action: RecoveryAction.RETRY,
          isCompleted: false,
          isSkippable: false,
          automatedAction: async () => {
            return navigator.onLine;
          },
        });
        break;

      case ErrorCategory.AUTHENTICATION:
        steps.push({
          id: "reauth",
          title: "다시 로그인",
          description: "인증 정보를 갱신합니다.",
          action: RecoveryAction.REAUTH,
          isCompleted: false,
          isSkippable: false,
          userInput: {
            type: "confirm",
            prompt: "로그인 페이지로 이동하시겠습니까?",
          },
        });
        break;

      case ErrorCategory.VALIDATION:
        steps.push({
          id: "modify_content",
          title: "내용 수정",
          description: "입력 내용을 수정합니다.",
          action: RecoveryAction.MODIFY_CONTENT,
          isCompleted: false,
          isSkippable: false,
          userInput: {
            type: "text",
            prompt: "수정할 내용을 입력해주세요.",
            validation: (value: string) => value.length > 0,
          },
        });
        break;
    }

    return steps;
  }

  private estimateResolutionTime(error: PlatformError): number {
    switch (error.category) {
      case ErrorCategory.NETWORK:
        return 2;
      case ErrorCategory.AUTHENTICATION:
        return 5;
      case ErrorCategory.VALIDATION:
        return 3;
      case ErrorCategory.QUOTA:
        return 10;
      default:
        return 5;
    }
  }

  // 건강 모니터링 시작
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // 1분마다 체크
  }

  private async performHealthCheck(): Promise<void> {
    // 각 플랫폼의 건강 상태 체크
    for (const [platformId, metrics] of this.healthMetrics) {
      await this.checkPlatformHealth(platformId, metrics);
    }
  }

  private async checkPlatformHealth(
    platformId: string,
    metrics: HealthMetrics,
  ): Promise<void> {
    const now = new Date();
    const timeSinceLastSuccess = metrics.lastSuccessfulSync
      ? now.getTime() - metrics.lastSuccessfulSync.getTime()
      : Infinity;

    // 건강 상태 결정
    let status: HealthMetrics["status"] = "healthy";
    const issues: HealthIssue[] = [];

    if (timeSinceLastSuccess > 24 * 60 * 60 * 1000) {
      // 24시간
      status = "unhealthy";
      issues.push({
        type: "sync_timeout",
        severity: ErrorSeverity.HIGH,
        message: "24시간 이상 동기화되지 않았습니다.",
        detectedAt: now,
        isResolved: false,
      });
    } else if (metrics.errorRate > 0.5) {
      status = "degraded";
      issues.push({
        type: "high_error_rate",
        severity: ErrorSeverity.MEDIUM,
        message: "오류율이 높습니다.",
        detectedAt: now,
        isResolved: false,
      });
    }

    // 메트릭 업데이트
    metrics.status = status;
    metrics.lastHealthCheck = now;
    metrics.issues = issues;

    // 알림 발송 (필요시)
    if (status === "unhealthy") {
      notificationService.addInAppNotification({
        type: "warning",
        title: "플랫폼 상태 경고",
        message: `${metrics.platformName}에 문제가 발생했습니다.`,
        persistent: true,
      });
    }
  }

  // 에러 분석 및 리포트 생성
  generateAnalyticsReport(timeRange: {
    start: Date;
    end: Date;
  }): ErrorAnalyticsReport {
    const errorsInRange = Array.from(this.errors.values()).filter(
      (error) =>
        error.timestamp >= timeRange.start && error.timestamp <= timeRange.end,
    );

    const errorsByCategory = this.groupBy(errorsInRange, "category");
    const errorsBySeverity = this.groupBy(errorsInRange, "severity");
    const errorsByPlatform = this.groupBy(errorsInRange, "platformId");

    const topErrors = this.getTopErrors(errorsInRange);
    const resolutionStats = this.calculateResolutionStats(errorsInRange);
    const trends = this.analyzeTrends(errorsInRange);

    return {
      timeRange,
      totalErrors: errorsInRange.length,
      errorsByCategory: this.countByKey(errorsByCategory),
      errorsBySeverity: this.countByKey(errorsBySeverity),
      errorsByPlatform: this.countByKey(errorsByPlatform),
      topErrors,
      resolutionStats,
      trends,
    };
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce(
      (groups, item) => {
        const group = String(item[key]);
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
      },
      {} as Record<string, T[]>,
    );
  }

  private countByKey(groups: Record<string, any[]>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, items] of Object.entries(groups)) {
      result[key] = items.length;
    }
    return result;
  }

  private getTopErrors(
    errors: PlatformError[],
  ): Array<{ message: string; count: number; lastOccurred: Date }> {
    const errorCounts = new Map<
      string,
      { count: number; lastOccurred: Date }
    >();

    errors.forEach((error) => {
      const existing = errorCounts.get(error.message);
      if (existing) {
        existing.count++;
        if (error.timestamp > existing.lastOccurred) {
          existing.lastOccurred = error.timestamp;
        }
      } else {
        errorCounts.set(error.message, {
          count: 1,
          lastOccurred: error.timestamp,
        });
      }
    });

    return Array.from(errorCounts.entries())
      .map(([message, data]) => ({ message, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateResolutionStats(errors: PlatformError[]) {
    const resolvedErrors = errors.filter((e) => e.isResolved);
    const manualInterventions = errors.filter((e) =>
      e.recoveryActions.includes(RecoveryAction.MANUAL_INTERVENTION),
    );

    return {
      averageResolutionTime: 0, // 실제로는 해결 시간을 추적해야 함
      successfulResolutions: resolvedErrors.length,
      manualInterventions: manualInterventions.length,
    };
  }

  private analyzeTrends(errors: PlatformError[]) {
    // 간단한 트렌드 분석 (실제로는 더 복잡한 로직 필요)
    return {
      errorRateChange: 0,
      mostProblematicPlatform: "",
      improvingCategories: [] as ErrorCategory[],
      worseningCategories: [] as ErrorCategory[],
    };
  }

  private async notifyUser(error: PlatformError): Promise<void> {
    notificationService.addInAppNotification({
      type: error.severity === ErrorSeverity.CRITICAL ? "error" : "warning",
      title: `${error.platformName} 오류`,
      message: error.userFriendlyMessage,
      persistent: error.severity === ErrorSeverity.CRITICAL,
    });
  }

  private logErrorForAnalytics(error: PlatformError): void {
    // 분석을 위한 로깅 (실제로는 외부 서비스로 전송)
    console.log("Error logged for analytics:", {
      id: error.id,
      category: error.category,
      severity: error.severity,
      platform: error.platformName,
      timestamp: error.timestamp,
    });
  }

  // Public API methods
  getError(errorId: string): PlatformError | undefined {
    return this.errors.get(errorId);
  }

  getErrorsByPlatform(platformId: string): PlatformError[] {
    return Array.from(this.errors.values()).filter(
      (e) => e.platformId === platformId,
    );
  }

  getUnresolvedErrors(): PlatformError[] {
    return Array.from(this.errors.values()).filter((e) => !e.isResolved);
  }

  getHealthMetrics(platformId: string): HealthMetrics | undefined {
    return this.healthMetrics.get(platformId);
  }

  getAllHealthMetrics(): HealthMetrics[] {
    return Array.from(this.healthMetrics.values());
  }

  updateHealthMetrics(
    platformId: string,
    metrics: Partial<HealthMetrics>,
  ): void {
    const existing = this.healthMetrics.get(platformId);
    if (existing) {
      Object.assign(existing, metrics);
    } else {
      this.healthMetrics.set(platformId, {
        platformId,
        platformName: metrics.platformName || platformId,
        status: "healthy",
        lastSuccessfulSync: null,
        errorRate: 0,
        averageResponseTime: 0,
        consecutiveFailures: 0,
        uptime: 100,
        lastHealthCheck: new Date(),
        issues: [],
        ...metrics,
      } as HealthMetrics);
    }
  }

  resolveError(errorId: string): void {
    const error = this.errors.get(errorId);
    if (error) {
      error.isResolved = true;
    }
  }

  clearResolvedErrors(): void {
    for (const [id, error] of this.errors) {
      if (error.isResolved) {
        this.errors.delete(id);
      }
    }
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

export const errorHandlingService = ErrorHandlingService.getInstance();
