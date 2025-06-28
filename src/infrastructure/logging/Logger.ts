import { injectable } from 'inversify';
import { Logger } from '@/src/core/domain/tour/TourServiceImpl';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  error?: any;
}

@injectable()
export class ConsoleLogger implements Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = 'info';

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  error(message: string, error?: any): void {
    this.log('error', message, undefined, error);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      this.log('debug', message, data);
    }
  }

  private log(level: LogLevel, message: string, data?: any, error?: any): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      error: error ? this.serializeError(error) : undefined
    };

    // Console output
    switch (level) {
      case 'error':
        console.error(`[${entry.timestamp}] ERROR:`, message, error || data || '');
        break;
      case 'warn':
        console.warn(`[${entry.timestamp}] WARN:`, message, data || '');
        break;
      case 'info':
        console.info(`[${entry.timestamp}] INFO:`, message, data || '');
        break;
      case 'debug':
        console.log(`[${entry.timestamp}] DEBUG:`, message, data || '');
        break;
    }

    // In production, send to logging service
    if (!this.isDevelopment) {
      this.sendToLoggingService(entry);
    }
  }

  private serializeError(error: any): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      };
    }
    return error;
  }

  private async sendToLoggingService(entry: LogEntry): Promise<void> {
    // Send to logging service (e.g., Sentry, LogRocket, etc.)
    try {
      // If Sentry is configured
      if (typeof window !== 'undefined' && window.Sentry) {
        if (entry.level === 'error') {
          window.Sentry.captureException(entry.error || new Error(entry.message), {
            level: 'error',
            extra: entry.data
          });
        } else if (entry.level === 'warn') {
          window.Sentry.captureMessage(entry.message, 'warning');
        }
      }

      // Send to custom logging endpoint
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      }).catch(() => {
        // Ignore logging errors to prevent infinite loops
      });
    } catch {
      // Ignore logging errors
    }
  }
}

// Structured logger for production use
@injectable()
export class StructuredLogger extends ConsoleLogger {
  private context: Record<string, any> = {};

  setContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
  }

  clearContext(): void {
    this.context = {};
  }

  protected log(level: LogLevel, message: string, data?: any, error?: any): void {
    const enrichedData = {
      ...this.context,
      ...data
    };
    super.log(level, message, enrichedData, error);
  }
}

// Declare Sentry global
declare global {
  interface Window {
    Sentry: any;
  }
}