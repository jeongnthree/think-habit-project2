/**
 * 향상된 오류 로깅 유틸리티
 * 애플리케이션 전반에서 발생하는 오류를 일관되게 로깅하고 처리합니다.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  stack?: string;
  component?: string;
  action?: string;
}

export class ErrorLogger {
  static log(
    level: LogLevel,
    message: string,
    data?: any,
    component?: string,
    action?: string
  ) {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      data,
      component,
      action,
      stack: data instanceof Error ? data.stack : undefined,
    };

    // 콘솔에 출력
    const prefix = `[${timestamp}] [${level.toUpperCase()}]${component ? ` [${component}]` : ''}${action ? ` [${action}]` : ''}`;

    if (level === 'error') {
      console.error(`${prefix} ${message}`, data);
    } else if (level === 'warn') {
      console.warn(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`, data);
    }

    // 로컬 스토리지에 로그 저장 (디버깅용)
    if (typeof window !== 'undefined') {
      try {
        const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
        logs.push(logEntry);
        // 최대 50개 로그만 유지
        if (logs.length > 50) {
          logs.shift();
        }
        localStorage.setItem('error_logs', JSON.stringify(logs));
      } catch (e) {
        // 로컬 스토리지 오류는 무시
      }
    }
  }

  static info(
    message: string,
    data?: any,
    component?: string,
    action?: string
  ) {
    this.log('info', message, data, component, action);
  }

  static warn(
    message: string,
    data?: any,
    component?: string,
    action?: string
  ) {
    this.log('warn', message, data, component, action);
  }

  static error(
    message: string,
    data?: any,
    component?: string,
    action?: string
  ) {
    this.log('error', message, data, component, action);
  }

  static getLogs(): LogEntry[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      return JSON.parse(localStorage.getItem('error_logs') || '[]');
    } catch (e) {
      return [];
    }
  }

  static clearLogs() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('error_logs');
    }
  }

  static showLogsInConsole() {
    const logs = this.getLogs();
    console.group('Error Logs');
    logs.forEach(log => {
      const prefix = `[${log.timestamp}] [${log.level.toUpperCase()}]${log.component ? ` [${log.component}]` : ''}${log.action ? ` [${log.action}]` : ''}`;
      if (log.level === 'error') {
        console.error(`${prefix} ${log.message}`, log.data);
      } else if (log.level === 'warn') {
        console.warn(`${prefix} ${log.message}`, log.data);
      } else {
        console.log(`${prefix} ${log.message}`, log.data);
      }
    });
    console.groupEnd();
  }
}

// 전역 오류 핸들러 설정
export function setupGlobalErrorHandlers() {
  if (typeof window !== 'undefined') {
    // 처리되지 않은 오류 이벤트 리스너
    window.addEventListener('error', event => {
      ErrorLogger.error(
        'Uncaught error',
        {
          message: event.error?.message || event.message,
          stack: event.error?.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        'Global',
        'Uncaught'
      );
    });

    // 처리되지 않은 Promise 거부 이벤트 리스너
    window.addEventListener('unhandledrejection', event => {
      ErrorLogger.error(
        'Unhandled promise rejection',
        {
          reason: event.reason,
          message: event.reason?.message,
          stack: event.reason?.stack,
        },
        'Global',
        'UnhandledRejection'
      );
    });

    // 콘솔 메서드 오버라이드 (선택 사항)
    const originalConsoleError = console.error;
    console.error = function (...args) {
      ErrorLogger.error(args[0], args.slice(1), 'Console', 'Error');
      originalConsoleError.apply(console, args);
    };
  }
}
