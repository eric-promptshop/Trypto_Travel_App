import Bottleneck from 'bottleneck';
import { ScraperLogger } from '../utils/ScraperLogger';

export interface RateLimiterOptions {
  maxConcurrent: number;
  minTime: number; // Minimum time between requests in ms
  maxRetries: number;
  retryDelay: number; // Base delay for retries in ms
  reservoir?: number; // Maximum number of requests per interval
  reservoirRefreshInterval?: number; // Interval to refill reservoir in ms
  reservoirRefreshAmount?: number; // Amount to refill
}

export class RateLimiter {
  private limiter: Bottleneck;
  private logger: ScraperLogger;
  private options: RateLimiterOptions;

  constructor(options: RateLimiterOptions, logger?: ScraperLogger) {
    this.options = options;
    this.logger = logger || new ScraperLogger('RateLimiter');

    this.limiter = new Bottleneck({
      maxConcurrent: options.maxConcurrent,
      minTime: options.minTime,
      reservoir: options.reservoir || 100,
      reservoirRefreshAmount: options.reservoirRefreshAmount || 100,
      reservoirRefreshInterval: options.reservoirRefreshInterval || 60 * 1000, // 1 minute
    });

    // Set up retry logic
    this.limiter.on('failed', async (error, jobInfo) => {
      const retryCount = jobInfo.retryCount || 0;
      
      if (retryCount < options.maxRetries) {
        this.logger.warn(`Request failed, retrying (${retryCount + 1}/${options.maxRetries})`, {
          error: error.message,
          retryCount,
          jobOptions: jobInfo.options
        });

        // Exponential backoff with jitter
        const baseDelay = options.retryDelay * Math.pow(2, retryCount);
        const jitter = Math.random() * 1000; // Add up to 1 second of random delay
        const delay = baseDelay + jitter;

        return delay;
      }

      this.logger.error(`Request failed after ${options.maxRetries} retries`, {
        error: error.message,
        jobOptions: jobInfo.options
      });
      return null;
    });

    // Log retry events
    this.limiter.on('retry', (error: any, jobInfo: any) => {
      this.logger.info('Retrying failed request', {
        retryCount: jobInfo.retryCount,
        error: error instanceof Error ? error.message : String(error)
      });
    });

    // Log when requests are dropped due to rate limiting
    this.limiter.on('dropped', (dropped) => {
      this.logger.warn('Request dropped due to rate limiting', {
        dropped: dropped.task
      });
    });

    // Log queue status periodically
    this.limiter.on('debug', (message, data) => {
      if (data && typeof data === 'object' && 'queued' in data) {
        this.logger.debug('Rate limiter status', {
          queued: data.queued,
          running: data.running,
          done: data.done
        });
      }
    });
  }

  /**
   * Schedule a function to be executed with rate limiting
   */
  async schedule<T>(fn: () => Promise<T>, priority?: number): Promise<T> {
    const options: Bottleneck.JobOptions = priority !== undefined 
      ? { priority } 
      : {};

    return this.limiter.schedule(options, fn);
  }

  /**
   * Schedule a function with specific options
   */
  async scheduleWithOptions<T>(
    fn: () => Promise<T>, 
    options: Bottleneck.JobOptions = {}
  ): Promise<T> {
    return this.limiter.schedule(options, fn);
  }

  /**
   * Check if the rate limiter is currently at capacity
   */
  isAtCapacity(): boolean {
    const counts = this.limiter.counts();
    return counts.RUNNING >= this.options.maxConcurrent;
  }

  /**
   * Get current queue statistics
   */
  getStats(): {
    queued: number;
    running: number;
    done: number;
    capacity: number;
    reservoir: number;
  } {
    const counts = this.limiter.counts();
    return {
      queued: counts.QUEUED || 0,
      running: counts.RUNNING || 0,
      done: counts.DONE || 0,
      capacity: this.options.maxConcurrent,
      reservoir: this.options.reservoir || 0
    };
  }

  /**
   * Update rate limiting parameters
   */
  updateOptions(newOptions: Partial<RateLimiterOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    // Update bottleneck settings
    if (newOptions.maxConcurrent !== undefined) {
      this.limiter.updateSettings({ maxConcurrent: newOptions.maxConcurrent });
    }
    
    if (newOptions.minTime !== undefined) {
      this.limiter.updateSettings({ minTime: newOptions.minTime });
    }

    if (newOptions.reservoir !== undefined) {
      this.limiter.updateSettings({ reservoir: newOptions.reservoir });
    }

    this.logger.info('Rate limiter options updated', newOptions);
  }

  /**
   * Wait for all current jobs to complete
   */
  async drain(): Promise<void> {
    await this.limiter.stop({ dropWaitingJobs: false });
  }

  /**
   * Stop the rate limiter and drop all waiting jobs
   */
  async stop(): Promise<void> {
    await this.limiter.stop({ dropWaitingJobs: true });
  }

  /**
   * Check if a specific HTTP status code should trigger a retry
   */
  shouldRetryForStatus(statusCode: number): boolean {
    // Retry on rate limiting, server errors, and gateway timeouts
    const retryableCodes = [429, 500, 502, 503, 504, 520, 521, 522, 524];
    return retryableCodes.includes(statusCode);
  }

  /**
   * Get recommended delay for a specific HTTP status code
   */
  getRetryDelayForStatus(statusCode: number, retryCount: number = 0): number {
    let baseDelay = this.options.retryDelay;

    switch (statusCode) {
      case 429: // Too Many Requests
        baseDelay = Math.max(baseDelay, 5000); // At least 5 seconds
        break;
      case 502:
      case 503:
      case 504: // Server errors
        baseDelay = Math.max(baseDelay, 3000); // At least 3 seconds
        break;
      default:
        break;
    }

    // Exponential backoff
    return baseDelay * Math.pow(2, retryCount);
  }

  /**
   * Create a specialized rate limiter for a specific site
   */
  static createForSite(siteName: string, requestsPerMinute: number, maxConcurrent: number = 2): RateLimiter {
    const minTime = Math.ceil(60000 / requestsPerMinute); // Convert requests per minute to min time between requests
    
    const options: RateLimiterOptions = {
      maxConcurrent,
      minTime,
      maxRetries: 3,
      retryDelay: 2000,
      reservoir: requestsPerMinute,
      reservoirRefreshInterval: 60 * 1000,
      reservoirRefreshAmount: requestsPerMinute
    };

    const logger = new ScraperLogger(`RateLimiter:${siteName}`);
    return new RateLimiter(options, logger);
  }
} 