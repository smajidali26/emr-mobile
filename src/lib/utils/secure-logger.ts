/**
 * Secure Logger
 * Provides logging utilities that sanitize sensitive data in production
 */

import Constants from 'expo-constants';

const IS_DEV = __DEV__;
const IS_PRODUCTION = !IS_DEV;

// Patterns to detect sensitive data
const SENSITIVE_PATTERNS = [
  /bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi, // Bearer tokens
  /token["\s:=]+[a-zA-Z0-9\-._~+/]+=*/gi, // Token values
  /password["\s:=]+[^\s"]+/gi, // Passwords
  /api[_-]?key["\s:=]+[^\s"]+/gi, // API keys
  /secret["\s:=]+[^\s"]+/gi, // Secrets
  /authorization["\s:=]+[^\s"]+/gi, // Authorization headers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses (partial sanitization)
];

/**
 * Sanitizes sensitive data from log messages
 */
function sanitize(data: unknown): unknown {
  if (typeof data === 'string') {
    let sanitized = data;
    SENSITIVE_PATTERNS.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    return sanitized;
  }

  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map(sanitize);
    }

    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      // Redact sensitive keys
      if (
        lowerKey.includes('token') ||
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('key') ||
        lowerKey.includes('authorization') ||
        lowerKey.includes('credential')
      ) {
        sanitizedObj[key] = '[REDACTED]';
      } else {
        sanitizedObj[key] = sanitize(value);
      }
    }
    return sanitizedObj;
  }

  return data;
}

/**
 * Formats log message with context
 */
function formatMessage(level: string, message: string, ...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const env = IS_PRODUCTION ? 'PROD' : 'DEV';
  return `[${timestamp}] [${env}] [${level}] ${message}`;
}

class SecureLogger {
  /**
   * Log informational messages
   */
  info(message: string, ...args: unknown[]): void {
    if (IS_DEV) {
      console.log(formatMessage('INFO', message), ...args);
    }
    // In production, could send to external logging service
  }

  /**
   * Log warning messages
   */
  warn(message: string, ...args: unknown[]): void {
    const sanitizedArgs = IS_PRODUCTION ? args.map(sanitize) : args;
    console.warn(formatMessage('WARN', message), ...sanitizedArgs);
  }

  /**
   * Log error messages with sanitization
   */
  error(message: string, error?: unknown, ...args: unknown[]): void {
    const sanitizedError = IS_PRODUCTION ? sanitize(error) : error;
    const sanitizedArgs = IS_PRODUCTION ? args.map(sanitize) : args;

    console.error(
      formatMessage('ERROR', message),
      sanitizedError,
      ...sanitizedArgs
    );

    // In production, could send to external error tracking service (e.g., Sentry)
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, ...args: unknown[]): void {
    if (IS_DEV) {
      console.debug(formatMessage('DEBUG', message), ...args);
    }
  }

  /**
   * Log sensitive data (only in development, completely suppressed in production)
   */
  sensitive(message: string, data: unknown): void {
    if (IS_DEV) {
      console.log(formatMessage('SENSITIVE', message), data);
    }
    // Completely suppressed in production
  }
}

export const secureLogger = new SecureLogger();
