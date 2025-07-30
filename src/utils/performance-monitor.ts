/**
 * Performance monitoring utilities
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceThresholds {
  loadTime: number;
  renderTime: number;
  apiResponseTime: number;
  imageLoadTime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThresholds = {
    loadTime: 3000, // 3 seconds
    renderTime: 100, // 100ms
    apiResponseTime: 1000, // 1 second
    imageLoadTime: 2000, // 2 seconds
  };

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Check thresholds and warn if exceeded
    this.checkThresholds(metric);
  }

  /**
   * Measure and record execution time of a function
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Measure and record execution time of a synchronous function
   */
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const startTime = performance.now();

    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Start a performance timer
   */
  startTimer(name: string): () => void {
    const startTime = performance.now();

    return (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, metadata);
    };
  }

  /**
   * Get performance statistics
   */
  getStats(metricName?: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
    recent: number[];
  } {
    const filteredMetrics = metricName
      ? this.metrics.filter(m => m.name === metricName)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        p95: 0,
        recent: [],
      };
    }

    const values = filteredMetrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const p95Index = Math.floor(values.length * 0.95);

    return {
      count: values.length,
      average: sum / values.length,
      min: values[0] || 0,
      max: values[values.length - 1] || 0,
      p95: values[p95Index] || 0,
      recent: filteredMetrics.slice(-10).map(m => m.value),
    };
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return [...new Set(this.metrics.map(m => m.name))];
  }

  /**
   * Check if metric exceeds thresholds
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.getThreshold(metric.name);

    if (threshold && metric.value > threshold) {
      console.warn(
        `Performance threshold exceeded: ${metric.name} took ${metric.value.toFixed(2)}ms (threshold: ${threshold}ms)`,
        metric.metadata
      );
    }
  }

  /**
   * Get threshold for a metric name
   */
  private getThreshold(metricName: string): number | null {
    if (metricName.includes('load')) return this.thresholds.loadTime;
    if (metricName.includes('render')) return this.thresholds.renderTime;
    if (metricName.includes('api')) return this.thresholds.apiResponseTime;
    if (metricName.includes('image')) return this.thresholds.imageLoadTime;
    return null;
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component render time
 */
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();

  return {
    recordRender: (metadata?: Record<string, any>) => {
      const renderTime = performance.now() - startTime;
      performanceMonitor.recordMetric(
        `${componentName}_render`,
        renderTime,
        metadata
      );
    },

    measureAsync: <T>(
      name: string,
      fn: () => Promise<T>,
      metadata?: Record<string, any>
    ) =>
      performanceMonitor.measureAsync(`${componentName}_${name}`, fn, metadata),

    measure: <T>(name: string, fn: () => T, metadata?: Record<string, any>) =>
      performanceMonitor.measure(`${componentName}_${name}`, fn, metadata),
  };
}

/**
 * Decorator for measuring API response times
 */
export function measureApiCall(endpoint: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;

    descriptor.value = async function (this: any, ...args: any[]) {
      return performanceMonitor.measureAsync(
        `api_${endpoint}`,
        () => method.apply(this, args),
        { endpoint, method: propertyName }
      );
    } as T;
  };
}

/**
 * Monitor Core Web Vitals
 */
export function monitorWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Monitor Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1]!;
        performanceMonitor.recordMetric('web_vital_lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Monitor First Input Delay (FID)
      const fidObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          performanceMonitor.recordMetric(
            'web_vital_fid',
            entry.processingStart - entry.startTime
          );
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Monitor Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        performanceMonitor.recordMetric('web_vital_cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('Failed to initialize web vitals monitoring:', error);
    }
  }

  // Monitor page load time
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    performanceMonitor.recordMetric('page_load_time', loadTime);
  });
}

/**
 * Report performance metrics (for debugging)
 */
export function reportPerformanceMetrics(): void {
  const metricNames = performanceMonitor.getMetricNames();

  console.group('Performance Metrics Report');

  metricNames.forEach(name => {
    const stats = performanceMonitor.getStats(name);
    console.log(`${name}:`, {
      count: stats.count,
      average: `${stats.average.toFixed(2)}ms`,
      min: `${stats.min.toFixed(2)}ms`,
      max: `${stats.max.toFixed(2)}ms`,
      p95: `${stats.p95.toFixed(2)}ms`,
    });
  });

  console.groupEnd();
}
