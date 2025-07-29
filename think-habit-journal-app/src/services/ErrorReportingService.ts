import {
  ErrorCategory,
  ErrorSeverity,
  PlatformError,
} from "./ErrorHandlingService";

// 오류 보고서 타입
export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: PlatformError;
  userContext: UserContext;
  systemInfo: SystemInfo;
  stackTrace?: string;
  breadcrumbs: Breadcrumb[];
  tags: Record<string, string>;
  fingerprint: string;
}

export interface UserContext {
  userId?: string;
  userAgent: string;
  platform: string;
  version: string;
  locale: string;
  timezone: string;
}

export interface SystemInfo {
  os: string;
  osVersion: string;
  appVersion: string;
  electronVersion: string;
  nodeVersion: string;
  memoryUsage: {
    used: number;
    total: number;
  };
  diskSpace: {
    free: number;
    total: number;
  };
}

export interface Breadcrumb {
  timestamp: Date;
  category: string;
  message: string;
  level: "info" | "warning" | "error";
  data?: Record<string, any>;
}

// 오류 집계 데이터
export interface ErrorAggregation {
  fingerprint: string;
  firstSeen: Date;
  lastSeen: Date;
  count: number;
  affectedUsers: number;
  platforms: string[];
  versions: string[];
  severity: ErrorSeverity;
  category: ErrorCategory;
  title: string;
  culprit?: string;
  tags: Record<string, string[]>;
  samples: ErrorReport[];
}

// 성능 메트릭
export interface PerformanceMetrics {
  timestamp: Date;
  platformId: string;
  metrics: {
    syncDuration: number;
    apiResponseTime: number;
    databaseQueryTime: number;
    memoryUsage: number;
    cpuUsage: number;
    networkLatency: number;
  };
}

export class ErrorReportingService {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 100;
  private reports: Map<string, ErrorReport> = new Map();
  private aggregations: Map<string, ErrorAggregation> = new Map();
  private performanceMetrics: PerformanceMetrics[] = [];
  private isEnabled = true;

  constructor() {
    this.initializeBreadcrumbTracking();
  }

  // 오류 보고서 생성 및 전송
  async reportError(
    error: PlatformError,
    context?: Partial<UserContext>,
  ): Promise<string> {
    if (!this.isEnabled) return "";

    const report = await this.createErrorReport(error, context);
    this.reports.set(report.id, report);

    // 오류 집계 업데이트
    this.updateAggregation(report);

    // 외부 서비스로 전송 (실제 구현에서는 Sentry, Bugsnag 등 사용)
    await this.sendToExternalService(report);

    // 로컬 저장
    await this.saveReportLocally(report);

    return report.id;
  }

  private async createErrorReport(
    error: PlatformError,
    context?: Partial<UserContext>,
  ): Promise<ErrorReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const userContext: UserContext = {
      userAgent: navigator.userAgent,
      platform: process.platform,
      version: process.env.APP_VERSION || "1.0.0",
      locale: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...context,
    };

    const systemInfo = await this.getSystemInfo();
    const fingerprint = this.generateFingerprint(error);

    return {
      id: reportId,
      timestamp: new Date(),
      error,
      userContext,
      systemInfo,
      stackTrace: error.originalError?.stack,
      breadcrumbs: [...this.breadcrumbs],
      tags: {
        platform: error.platformName,
        category: error.category,
        severity: error.severity,
        ...error.metadata,
      },
      fingerprint,
    };
  }

  private async getSystemInfo(): Promise<SystemInfo> {
    // Electron 환경에서 시스템 정보 수집
    const memoryUsage = process.memoryUsage();

    return {
      os: process.platform,
      osVersion: process.getSystemVersion?.() || "unknown",
      appVersion: process.env.APP_VERSION || "1.0.0",
      electronVersion: process.versions.electron || "unknown",
      nodeVersion: process.versions.node,
      memoryUsage: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
      },
      diskSpace: {
        free: 0, // 실제로는 fs.statSync로 구현
        total: 0,
      },
    };
  }

  private generateFingerprint(error: PlatformError): string {
    // 오류의 고유 식별자 생성 (유사한 오류들을 그룹화하기 위함)
    const components = [
      error.type,
      error.category,
      error.platformId,
      error.code || "",
      this.normalizeMessage(error.message),
    ];

    return this.hashString(components.join("|"));
  }

  private normalizeMessage(message: string): string {
    // 동적 값들을 제거하여 메시지 정규화
    return message
      .replace(/\d+/g, "N") // 숫자를 N으로 치환
      .replace(
        /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
        "UUID",
      ) // UUID 치환
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, "DATE") // 날짜 치환
      .toLowerCase();
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32bit integer로 변환
    }
    return Math.abs(hash).toString(36);
  }

  private updateAggregation(report: ErrorReport): void {
    const existing = this.aggregations.get(report.fingerprint);

    if (existing) {
      existing.count++;
      existing.lastSeen = report.timestamp;
      existing.samples.push(report);

      // 최대 샘플 수 제한
      if (existing.samples.length > 10) {
        existing.samples = existing.samples.slice(-10);
      }

      // 플랫폼 및 버전 정보 업데이트
      if (!existing.platforms.includes(report.userContext.platform)) {
        existing.platforms.push(report.userContext.platform);
      }
      if (!existing.versions.includes(report.userContext.version)) {
        existing.versions.push(report.userContext.version);
      }
    } else {
      this.aggregations.set(report.fingerprint, {
        fingerprint: report.fingerprint,
        firstSeen: report.timestamp,
        lastSeen: report.timestamp,
        count: 1,
        affectedUsers: 1,
        platforms: [report.userContext.platform],
        versions: [report.userContext.version],
        severity: report.error.severity,
        category: report.error.category,
        title: this.generateTitle(report.error),
        culprit: this.extractCulprit(report),
        tags: this.aggregateTags([report]),
        samples: [report],
      });
    }
  }

  private generateTitle(error: PlatformError): string {
    return `${error.category}: ${error.userFriendlyMessage}`;
  }

  private extractCulprit(report: ErrorReport): string | undefined {
    // 스택 트레이스에서 원인 함수/파일 추출
    if (report.stackTrace) {
      const lines = report.stackTrace.split("\n");
      for (const line of lines) {
        if (line.includes("at ") && !line.includes("node_modules")) {
          return line.trim();
        }
      }
    }
    return undefined;
  }

  private aggregateTags(reports: ErrorReport[]): Record<string, string[]> {
    const tags: Record<string, string[]> = {};

    reports.forEach((report) => {
      Object.entries(report.tags).forEach(([key, value]) => {
        if (!tags[key]) tags[key] = [];
        if (!tags[key].includes(value)) {
          tags[key].push(value);
        }
      });
    });

    return tags;
  }

  // 브레드크럼 추적
  private initializeBreadcrumbTracking(): void {
    // 네트워크 요청 추적
    this.interceptNetworkRequests();

    // 사용자 액션 추적
    this.trackUserActions();

    // 콘솔 로그 추적
    this.interceptConsoleLog();
  }

  private interceptNetworkRequests(): void {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = args[0] instanceof Request ? args[0].url : args[0];

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        this.addBreadcrumb({
          category: "http",
          message: `${response.status} ${url}`,
          level: response.ok ? "info" : "error",
          data: {
            url,
            status: response.status,
            duration,
          },
        });

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;

        this.addBreadcrumb({
          category: "http",
          message: `Failed ${url}`,
          level: "error",
          data: {
            url,
            error: error.message,
            duration,
          },
        });

        throw error;
      }
    };
  }

  private trackUserActions(): void {
    // 클릭 이벤트 추적
    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const className = target.className;
      const id = target.id;

      this.addBreadcrumb({
        category: "ui",
        message: `Clicked ${tagName}${id ? `#${id}` : ""}${className ? `.${className}` : ""}`,
        level: "info",
        data: {
          tagName,
          className,
          id,
          text: target.textContent?.slice(0, 100),
        },
      });
    });

    // 폼 제출 추적
    document.addEventListener("submit", (event) => {
      const form = event.target as HTMLFormElement;

      this.addBreadcrumb({
        category: "ui",
        message: `Form submitted: ${form.id || form.className || "unknown"}`,
        level: "info",
        data: {
          formId: form.id,
          formClass: form.className,
          action: form.action,
        },
      });
    });
  }

  private interceptConsoleLog(): void {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    };

    console.log = (...args) => {
      this.addBreadcrumb({
        category: "console",
        message: args.join(" "),
        level: "info",
      });
      originalConsole.log(...args);
    };

    console.warn = (...args) => {
      this.addBreadcrumb({
        category: "console",
        message: args.join(" "),
        level: "warning",
      });
      originalConsole.warn(...args);
    };

    console.error = (...args) => {
      this.addBreadcrumb({
        category: "console",
        message: args.join(" "),
        level: "error",
      });
      originalConsole.error(...args);
    };
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, "timestamp">): void {
    this.breadcrumbs.push({
      timestamp: new Date(),
      ...breadcrumb,
    });

    // 최대 개수 제한
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  // 성능 메트릭 수집
  recordPerformanceMetrics(
    platformId: string,
    metrics: PerformanceMetrics["metrics"],
  ): void {
    this.performanceMetrics.push({
      timestamp: new Date(),
      platformId,
      metrics,
    });

    // 최대 1000개 메트릭 유지
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  // 외부 서비스로 전송
  private async sendToExternalService(report: ErrorReport): Promise<void> {
    try {
      // 실제 구현에서는 Sentry, Bugsnag 등의 API 사용
      console.log("Sending error report to external service:", {
        id: report.id,
        fingerprint: report.fingerprint,
        error: report.error.userFriendlyMessage,
        platform: report.error.platformName,
      });

      // 예시: Sentry로 전송
      // await fetch('https://sentry.io/api/projects/your-project/store/', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'X-Sentry-Auth': 'your-auth-header'
      //   },
      //   body: JSON.stringify(this.formatForSentry(report))
      // });
    } catch (error) {
      console.error("Failed to send error report:", error);
    }
  }

  // 로컬 저장
  private async saveReportLocally(report: ErrorReport): Promise<void> {
    try {
      // IndexedDB나 파일 시스템에 저장
      const serialized = JSON.stringify(report, null, 2);
      localStorage.setItem(`error_report_${report.id}`, serialized);
    } catch (error) {
      console.error("Failed to save error report locally:", error);
    }
  }

  // 분석 데이터 조회
  getAggregations(): ErrorAggregation[] {
    return Array.from(this.aggregations.values()).sort(
      (a, b) => b.count - a.count,
    );
  }

  getRecentReports(limit = 50): ErrorReport[] {
    return Array.from(this.reports.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getPerformanceMetrics(
    platformId?: string,
    timeRange?: { start: Date; end: Date },
  ): PerformanceMetrics[] {
    let metrics = this.performanceMetrics;

    if (platformId) {
      metrics = metrics.filter((m) => m.platformId === platformId);
    }

    if (timeRange) {
      metrics = metrics.filter(
        (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end,
      );
    }

    return metrics.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  // 통계 생성
  generateStatistics(timeRange?: { start: Date; end: Date }) {
    const reports = timeRange
      ? Array.from(this.reports.values()).filter(
          (r) => r.timestamp >= timeRange.start && r.timestamp <= timeRange.end,
        )
      : Array.from(this.reports.values());

    const totalErrors = reports.length;
    const uniqueErrors = new Set(reports.map((r) => r.fingerprint)).size;
    const affectedUsers = new Set(
      reports.map((r) => r.userContext.userId).filter(Boolean),
    ).size;

    const errorsByCategory = reports.reduce(
      (acc, report) => {
        acc[report.error.category] = (acc[report.error.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const errorsBySeverity = reports.reduce(
      (acc, report) => {
        acc[report.error.severity] = (acc[report.error.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const errorsByPlatform = reports.reduce(
      (acc, report) => {
        acc[report.error.platformName] =
          (acc[report.error.platformName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalErrors,
      uniqueErrors,
      affectedUsers,
      errorsByCategory,
      errorsBySeverity,
      errorsByPlatform,
      topErrors: this.getAggregations().slice(0, 10),
    };
  }

  // 설정
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  clearOldReports(olderThan: Date): void {
    for (const [id, report] of this.reports) {
      if (report.timestamp < olderThan) {
        this.reports.delete(id);
        localStorage.removeItem(`error_report_${id}`);
      }
    }

    // 집계 데이터도 정리
    for (const [fingerprint, aggregation] of this.aggregations) {
      if (aggregation.lastSeen < olderThan) {
        this.aggregations.delete(fingerprint);
      }
    }
  }

  // 정리
  destroy(): void {
    this.reports.clear();
    this.aggregations.clear();
    this.breadcrumbs = [];
    this.performanceMetrics = [];
  }
}

export const errorReportingService = new ErrorReportingService();
