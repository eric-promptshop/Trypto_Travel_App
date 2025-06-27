import { ScraperConfig } from '../base/ScraperConfig';

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  component: string;
}

export interface ScrapingEvent {
  type: 'start' | 'complete' | 'error' | 'blocked' | 'retry';
  url: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class ScraperLogger {
  private component: string;
  private logs: LogEntry[] = [];
  private events: ScrapingEvent[] = [];
  private maxLogs: number = 1000;

  constructor(component: string, maxLogs: number = 1000) {
    this.component = component;
    this.maxLogs = maxLogs;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  /**
   * Core logging method
   */
  private log(level: LogEntry['level'], message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      component: this.component
    };

    this.logs.push(entry);

    // Keep logs array size manageable
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Output to console based on level
    this.outputToConsole(entry);
  }

  /**
   * Output log entry to console with formatting
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.component}] [${entry.level.toUpperCase()}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        if (process.env.DEBUG === 'true') {
        }
        break;
      case 'info':
        break;
      case 'warn':
        break;
      case 'error':
        console.error(message, entry.context || '');
        break;
    }
  }

  /**
   * Log scraping start event
   */
  logScrapingStart(url: string, config: ScraperConfig): void {
    const event: ScrapingEvent = {
      type: 'start',
      url,
      timestamp: new Date(),
      metadata: {
        scraperName: config.name,
        requestsPerMinute: config.throttling.requestsPerMinute,
        timeout: config.throttling.timeout
      }
    };

    this.events.push(event);
    this.info('Starting to scrape URL', {
      url,
      scraperName: config.name,
      throttling: config.throttling
    });
  }

  /**
   * Log scraping completion event
   */
  logScrapingComplete(url: string, itemsFound: number, processingTime: number): void {
    const event: ScrapingEvent = {
      type: 'complete',
      url,
      timestamp: new Date(),
      metadata: {
        itemsFound,
        processingTime
      }
    };

    this.events.push(event);
    this.info('Scraping completed successfully', {
      url,
      itemsFound,
      processingTimeMs: processingTime
    });
  }

  /**
   * Log scraping error event
   */
  logScrapingError(url: string, error: Error): void {
    const event: ScrapingEvent = {
      type: 'error',
      url,
      timestamp: new Date(),
      metadata: {
        error: error.message,
        stack: error.stack
      }
    };

    this.events.push(event);
    this.error('Scraping failed', {
      url,
      error: error.message,
      stack: error.stack
    });
  }

  /**
   * Log blocking detection event
   */
  logBlocked(url: string, reason: string): void {
    const event: ScrapingEvent = {
      type: 'blocked',
      url,
      timestamp: new Date(),
      metadata: {
        reason
      }
    };

    this.events.push(event);
    this.warn('Scraping blocked', {
      url,
      reason
    });
  }

  /**
   * Log retry attempt event
   */
  logRetry(url: string, attempt: number, maxAttempts: number): void {
    const event: ScrapingEvent = {
      type: 'retry',
      url,
      timestamp: new Date(),
      metadata: {
        attempt,
        maxAttempts
      }
    };

    this.events.push(event);
    this.warn(`Retry attempt ${attempt}/${maxAttempts}`, {
      url,
      attempt,
      maxAttempts
    });
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 50, level?: LogEntry['level']): LogEntry[] {
    let logs = this.logs;
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    return logs.slice(-count);
  }

  /**
   * Get recent events
   */
  getRecentEvents(count: number = 50, type?: ScrapingEvent['type']): ScrapingEvent[] {
    let events = this.events;
    
    if (type) {
      events = events.filter(event => event.type === type);
    }

    return events.slice(-count);
  }

  /**
   * Get logging statistics
   */
  getStats(): {
    totalLogs: number;
    logsByLevel: Record<LogEntry['level'], number>;
    totalEvents: number;
    eventsByType: Record<ScrapingEvent['type'], number>;
    timeRange: { start?: Date; end?: Date };
  } {
    const logsByLevel: Record<LogEntry['level'], number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0
    };

    const eventsByType: Record<ScrapingEvent['type'], number> = {
      start: 0,
      complete: 0,
      error: 0,
      blocked: 0,
      retry: 0
    };

    this.logs.forEach(log => {
      logsByLevel[log.level]++;
    });

    this.events.forEach(event => {
      eventsByType[event.type]++;
    });

    const allTimestamps = [
      ...this.logs.map(l => l.timestamp),
      ...this.events.map(e => e.timestamp)
    ];

    const timeRange = {
      start: allTimestamps.length > 0 ? new Date(Math.min(...allTimestamps.map(t => t.getTime()))) : undefined,
      end: allTimestamps.length > 0 ? new Date(Math.max(...allTimestamps.map(t => t.getTime()))) : undefined
    };

    return {
      totalLogs: this.logs.length,
      logsByLevel,
      totalEvents: this.events.length,
      eventsByType,
      timeRange
    };
  }

  /**
   * Export logs to JSON format
   */
  exportLogs(): {
    logs: LogEntry[];
    events: ScrapingEvent[];
    stats: ReturnType<ScraperLogger['getStats']>;
    exportedAt: Date;
  } {
    return {
      logs: [...this.logs],
      events: [...this.events],
      stats: this.getStats(),
      exportedAt: new Date()
    };
  }

  /**
   * Clear all logs and events
   */
  clear(): void {
    this.logs = [];
    this.events = [];
    this.info('Logger cleared');
  }

  /**
   * Create a child logger with a sub-component name
   */
  createChild(subComponent: string): ScraperLogger {
    return new ScraperLogger(`${this.component}:${subComponent}`, this.maxLogs);
  }
} 