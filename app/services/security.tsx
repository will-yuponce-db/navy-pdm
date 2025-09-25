import { SecurityEvent, AuditLog } from '../types';

// Security validation rules
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  message?: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

// Security event types
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PERMISSION_DENIED = 'permission_denied',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
}

// Input sanitization utilities
export class InputSanitizer {
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;]/g, '') // Remove semicolons
      .substring(0, 1000); // Limit length
  }

  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim().replace(/[^a-zA-Z0-9@._-]/g, '');
  }

  static sanitizeNumber(input: string | number): number | null {
    const num = typeof input === 'string' ? parseFloat(input) : input;
    return isNaN(num) ? null : num;
  }

  static sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(key);
      sanitized[sanitizedKey] = this.sanitizeObject(value);
    }
    return sanitized;
  }
}

// Input validation utilities
export class InputValidator {
  static validate(schema: ValidationSchema, data: any): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const error = this.validateField(value, rules, field);
      
      if (error) {
        errors[field] = error;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  private static validateField(value: any, rules: ValidationRule, fieldName: string): string | null {
    // Required validation
    if (rules.required && (value === undefined || value === null || value === '')) {
      return rules.message || `${fieldName} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!rules.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // Type-specific validations
    if (typeof value === 'string') {
      // Length validations
      if (rules.minLength && value.length < rules.minLength) {
        return rules.message || `${fieldName} must be at least ${rules.minLength} characters`;
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        return rules.message || `${fieldName} must be no more than ${rules.maxLength} characters`;
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        return rules.message || `${fieldName} format is invalid`;
      }
    }

    // Custom validation
    if (rules.custom) {
      const result = rules.custom(value);
      if (result !== true) {
        return typeof result === 'string' ? result : `${fieldName} is invalid`;
      }
    }

    return null;
  }

  // Common validation schemas
  static getEmailSchema(): ValidationSchema {
    return {
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address',
      },
    };
  }

  static getPasswordSchema(): ValidationSchema {
    return {
      password: {
        required: true,
        minLength: 8,
        maxLength: 128,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        message: 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character',
      },
    };
  }

  static getWorkOrderSchema(): ValidationSchema {
    return {
      ship: {
        required: true,
        minLength: 1,
        maxLength: 100,
        pattern: /^[A-Za-z0-9\s-()]+$/,
        message: 'Ship name contains invalid characters',
      },
      homeport: {
        required: true,
        minLength: 1,
        maxLength: 50,
        pattern: /^[A-Za-z0-9\s-]+$/,
        message: 'Homeport contains invalid characters',
      },
      priority: {
        required: true,
        custom: (value) => ['Routine', 'Urgent', 'CASREP'].includes(value),
        message: 'Priority must be Routine, Urgent, or CASREP',
      },
      eta: {
        required: true,
        custom: (value) => {
          const num = parseFloat(value);
          return !isNaN(num) && num >= 0 && num <= 365;
        },
        message: 'ETA must be a number between 0 and 365 days',
      },
    };
  }
}

// Security event logger
export class SecurityLogger {
  private events: SecurityEvent[] = [];
  private maxEvents = 10000;

  logEvent(event: Partial<SecurityEvent>): void {
    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      type: event.type || SecurityEventType.SUSPICIOUS_ACTIVITY,
      userId: event.userId || 'anonymous',
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      details: event.details,
    };

    this.events.unshift(securityEvent);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    // Send to security monitoring service
    this.sendToSecurityService(securityEvent);

    // Log suspicious activities
    if (this.isSuspiciousActivity(securityEvent)) {
      console.warn('Suspicious activity detected:', securityEvent);
    }
  }

  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIP(): string {
    // In a real application, this would come from the server
    return 'client_ip_placeholder';
  }

  private isSuspiciousActivity(event: SecurityEvent): boolean {
    // Check for multiple failed login attempts
    if (event.type === SecurityEventType.LOGIN_FAILURE) {
      const recentFailures = this.events.filter(
        e => e.userId === event.userId && 
        e.type === SecurityEventType.LOGIN_FAILURE &&
        Date.now() - e.timestamp.getTime() < 300000 // 5 minutes
      );
      
      return recentFailures.length >= 5;
    }

    // Check for permission denied patterns
    if (event.type === SecurityEventType.PERMISSION_DENIED) {
      const recentDenials = this.events.filter(
        e => e.userId === event.userId &&
        e.type === SecurityEventType.PERMISSION_DENIED &&
        Date.now() - e.timestamp.getTime() < 600000 // 10 minutes
      );
      
      return recentDenials.length >= 10;
    }

    return false;
  }

  private async sendToSecurityService(event: SecurityEvent): Promise<void> {
    if (import.meta.env.VITE_SECURITY_MONITORING_ENABLED === 'true') {
      try {
        await fetch('/api/security-events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });
      } catch (error) {
        console.warn('Failed to send security event:', error);
      }
    }
  }

  getEvents(): SecurityEvent[] {
    return [...this.events];
  }

  getEventStats(): {
    total: number;
    byType: Record<SecurityEventType, number>;
    suspiciousCount: number;
  } {
    const stats = {
      total: this.events.length,
      byType: {} as Record<SecurityEventType, number>,
      suspiciousCount: 0,
    };

    // Initialize counters
    Object.values(SecurityEventType).forEach(type => {
      stats.byType[type] = 0;
    });

    // Count events
    this.events.forEach(event => {
      stats.byType[event.type]++;
      if (this.isSuspiciousActivity(event)) {
        stats.suspiciousCount++;
      }
    });

    return stats;
  }
}

// Audit logger
export class AuditLogger {
  private logs: AuditLog[] = [];
  private maxLogs = 50000;

  logAction(action: string, resource: string, resourceId: string, changes?: Record<string, { old: any; new: any }>): void {
    const auditLog: AuditLog = {
      id: this.generateLogId(),
      userId: this.getCurrentUserId(),
      action,
      resource,
      resourceId,
      changes,
      timestamp: new Date(),
      ipAddress: this.getClientIP(),
    };

    this.logs.unshift(auditLog);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Send to audit service
    this.sendToAuditService(auditLog);
  }

  private generateLogId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string {
    // In a real application, this would come from the auth context
    return 'current_user_id';
  }

  private getClientIP(): string {
    return 'client_ip_placeholder';
  }

  private async sendToAuditService(log: AuditLog): Promise<void> {
    if (import.meta.env.VITE_AUDIT_LOGGING_ENABLED === 'true') {
      try {
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(log),
        });
      } catch (error) {
        console.warn('Failed to send audit log:', error);
      }
    }
  }

  getLogs(): AuditLog[] {
    return [...this.logs];
  }

  getLogsByUser(userId: string): AuditLog[] {
    return this.logs.filter(log => log.userId === userId);
  }

  getLogsByResource(resource: string, resourceId?: string): AuditLog[] {
    return this.logs.filter(log => 
      log.resource === resource && 
      (!resourceId || log.resourceId === resourceId)
    );
  }
}

// Rate limiting
export class RateLimiter {
  private requests = new Map<string, number[]>();
  private limits = new Map<string, { maxRequests: number; windowMs: number }>();

  setLimit(key: string, maxRequests: number, windowMs: number): void {
    this.limits.set(key, { maxRequests, windowMs });
  }

  isAllowed(key: string): boolean {
    const limit = this.limits.get(key);
    if (!limit) return true;

    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < limit.windowMs);
    
    if (validRequests.length >= limit.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  getRemainingRequests(key: string): number {
    const limit = this.limits.get(key);
    if (!limit) return Infinity;

    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => now - time < limit.windowMs);
    
    return Math.max(0, limit.maxRequests - validRequests.length);
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

// Content Security Policy helper
export class CSPHelper {
  static generateCSP(): string {
    const policies = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' ws: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    return policies.join('; ');
  }

  static getSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': this.generateCSP(),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };
  }
}

// XSS protection
export class XSSProtection {
  static sanitizeHTML(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  static escapeHTML(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  static validateHTML(input: string): boolean {
    // Simple check for potentially dangerous HTML
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    return !dangerousPatterns.some(pattern => pattern.test(input));
  }
}

// Create singleton instances
export const securityLogger = new SecurityLogger();
export const auditLogger = new AuditLogger();
export const rateLimiter = new RateLimiter();

// Security middleware for API calls
export const securityMiddleware = {
  beforeRequest: (url: string, options: RequestInit) => {
    // Log API access
    securityLogger.logEvent({
      type: SecurityEventType.LOGIN_SUCCESS, // This would be more specific
      details: { url, method: options.method },
    });

    // Add security headers
    const headers = new Headers(options.headers);
    Object.entries(CSPHelper.getSecurityHeaders()).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return { ...options, headers };
  },

  afterResponse: (response: Response) => {
    // Log failed requests
    if (!response.ok) {
      securityLogger.logEvent({
        type: SecurityEventType.UNAUTHORIZED_ACCESS,
        details: { status: response.status, statusText: response.statusText },
      });
    }
  },
};
