import { ErrorInfo } from 'react';
import { ApiError } from '../types';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories
export enum ErrorCategory {
  API = 'api',
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  COMPONENT = 'component',
  SYSTEM = 'system',
  USER_ACTION = 'user_action',
}

// Error context interface
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: Date;
  component?: string;
  action?: string;
  additionalData?: Record<string, any>;
}

// Error log entry
export interface ErrorLogEntry {
  id: string;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  timestamp: Date;
  resolved: boolean;
  tags?: string[];
}

// Performance metrics
export interface PerformanceEntry {
  id: string;
  name: string;
  duration: number;
  timestamp: Date;
  type: 'navigation' | 'measure' | 'mark';
  additionalData?: Record<string, any>;
}

class ErrorMonitoringService {
  private errors: ErrorLogEntry[] = [];
  private performanceEntries: PerformanceEntry[] = [];
  private maxErrors = 1000;
  private maxPerformanceEntries = 500;
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
    this.setupPerformanceMonitoring();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.SYSTEM,
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date(),
        },
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.SYSTEM,
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date(),
        },
      });
    });
  }

  private setupPerformanceMonitoring(): void {
    // Monitor page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      this.logPerformance({
        name: 'page_load',
        duration: navigation.loadEventEnd - navigation.fetchStart,
        type: 'navigation',
        additionalData: {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstPaint: this.getFirstPaint(),
          firstContentfulPaint: this.getFirstContentfulPaint(),
        },
      });
    });

    // Monitor API response times
    this.interceptFetch();
  }

  private getFirstPaint(): number | undefined {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint?.startTime;
  }

  private getFirstContentfulPaint(): number | undefined {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint?.startTime;
  }

  private interceptFetch(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] as string;
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.logPerformance({
          name: `api_${url}`,
          duration: endTime - startTime,
          type: 'measure',
          additionalData: {
            url,
            status: response.status,
            method: args[1]?.method || 'GET',
          },
        });

        return response;
      } catch (error) {
        const endTime = performance.now();
        
        this.logError({
          message: `API Error: ${error}`,
          severity: ErrorSeverity.MEDIUM,
          category: ErrorCategory.API,
          context: {
            url,
            timestamp: new Date(),
            additionalData: { duration: endTime - startTime },
          },
        });

        throw error;
      }
    };
  }

  // Public methods
  setUserId(userId: string): void {
    this.userId = userId;
  }

  logError(error: Partial<ErrorLogEntry>): void {
    const errorEntry: ErrorLogEntry = {
      id: this.generateErrorId(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      severity: error.severity || ErrorSeverity.MEDIUM,
      category: error.category || ErrorCategory.SYSTEM,
      context: {
        userId: this.userId,
        sessionId: this.sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date(),
        ...error.context,
      },
      timestamp: new Date(),
      resolved: false,
      tags: error.tags,
    };

    this.errors.unshift(errorEntry);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Send to external monitoring service (if configured)
    this.sendToExternalService(errorEntry);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorEntry);
    }
  }

  logPerformance(entry: Partial<PerformanceEntry>): void {
    const performanceEntry: PerformanceEntry = {
      id: this.generatePerformanceId(),
      name: entry.name || 'unknown',
      duration: entry.duration || 0,
      timestamp: new Date(),
      type: entry.type || 'measure',
      additionalData: entry.additionalData,
    };

    this.performanceEntries.unshift(performanceEntry);
    
    // Keep only the most recent entries
    if (this.performanceEntries.length > this.maxPerformanceEntries) {
      this.performanceEntries = this.performanceEntries.slice(0, this.maxPerformanceEntries);
    }
  }

  logApiError(error: ApiError, context?: Partial<ErrorContext>): void {
    this.logError({
      message: error.message,
      severity: this.getSeverityFromStatus(error.status),
      category: ErrorCategory.API,
      context: {
        ...context,
        additionalData: {
          status: error.status,
          code: error.code,
        },
      },
    });
  }

  logUserAction(action: string, context?: Partial<ErrorContext>): void {
    this.logPerformance({
      name: `user_action_${action}`,
      duration: 0,
      type: 'mark',
      additionalData: { action, ...context?.additionalData },
    });
  }

  getErrors(): ErrorLogEntry[] {
    return [...this.errors];
  }

  getPerformanceEntries(): PerformanceEntry[] {
    return [...this.performanceEntries];
  }

  getErrorStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    unresolved: number;
  } {
    const stats = {
      total: this.errors.length,
      bySeverity: {} as Record<ErrorSeverity, number>,
      byCategory: {} as Record<ErrorCategory, number>,
      unresolved: 0,
    };

    // Initialize counters
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0;
    });
    Object.values(ErrorCategory).forEach(category => {
      stats.byCategory[category] = 0;
    });

    // Count errors
    this.errors.forEach(error => {
      stats.bySeverity[error.severity]++;
      stats.byCategory[error.category]++;
      if (!error.resolved) stats.unresolved++;
    });

    return stats;
  }

  getPerformanceStats(): {
    averagePageLoad: number;
    averageApiResponse: number;
    slowestOperations: PerformanceEntry[];
  } {
    const pageLoads = this.performanceEntries.filter(entry => entry.name === 'page_load');
    const apiCalls = this.performanceEntries.filter(entry => entry.name.startsWith('api_'));

    const averagePageLoad = pageLoads.length > 0 
      ? pageLoads.reduce((sum, entry) => sum + entry.duration, 0) / pageLoads.length 
      : 0;

    const averageApiResponse = apiCalls.length > 0 
      ? apiCalls.reduce((sum, entry) => sum + entry.duration, 0) / apiCalls.length 
      : 0;

    const slowestOperations = [...this.performanceEntries]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      averagePageLoad,
      averageApiResponse,
      slowestOperations,
    };
  }

  clearErrors(): void {
    this.errors = [];
  }

  clearPerformanceEntries(): void {
    this.performanceEntries = [];
  }

  markErrorResolved(errorId: string): void {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePerformanceId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSeverityFromStatus(status: number): ErrorSeverity {
    if (status >= 500) return ErrorSeverity.CRITICAL;
    if (status >= 400) return ErrorSeverity.HIGH;
    if (status >= 300) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  private async sendToExternalService(errorEntry: ErrorLogEntry): Promise<void> {
    // In a real application, you would send this to services like:
    // - Sentry
    // - LogRocket
    // - Bugsnag
    // - Custom logging endpoint
    
    if (process.env.REACT_APP_ERROR_REPORTING_ENABLED === 'true') {
      try {
        await fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorEntry),
        });
      } catch (error) {
        console.warn('Failed to send error to external service:', error);
      }
    }
  }
}

// React Error Boundary Component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorMonitoringService.logError({
      message: error.message,
      stack: error.stack,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.COMPONENT,
      context: {
        component: errorInfo.componentStack,
        additionalData: {
          errorBoundary: true,
        },
      },
    });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>Something went wrong</h2>
    <p>We're sorry, but something unexpected happened.</p>
    {process.env.NODE_ENV === 'development' && (
      <details style={{ marginTop: '20px' }}>
        <summary>Error Details</summary>
        <pre style={{ textAlign: 'left', marginTop: '10px' }}>
          {error.message}
          {error.stack}
        </pre>
      </details>
    )}
    <button onClick={() => window.location.reload()}>
      Reload Page
    </button>
  </div>
);

// Create singleton instance
export const errorMonitoringService = new ErrorMonitoringService();

// Export React import for ErrorBoundary
import React from 'react';
