import { RateLimiter, RateLimiterOptions } from '../../../../lib/content-processing/scrapers/base/RateLimiter';
import { ScraperLogger } from '../../../../lib/content-processing/scrapers/utils/ScraperLogger';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  let logger: ScraperLogger;

  const defaultOptions: RateLimiterOptions = {
    maxConcurrent: 2,
    minTime: 1000, // 1 second between requests
    maxRetries: 2,
    retryDelay: 500,
    reservoir: 10,
    reservoirRefreshInterval: 60000,
    reservoirRefreshAmount: 10
  };

  beforeEach(() => {
    logger = new ScraperLogger('TestRateLimiter');
    rateLimiter = new RateLimiter(defaultOptions, logger);
  });

  describe('initialization', () => {
    it('should initialize with correct options', () => {
      expect(rateLimiter).toBeDefined();
    });

    it('should work without logger', () => {
      const limiter = new RateLimiter(defaultOptions);
      expect(limiter).toBeDefined();
    });
  });

  describe('request scheduling', () => {
    it('should schedule simple tasks', async () => {
      const mockTask = jest.fn().mockResolvedValue('success');
      
      const result = await rateLimiter.schedule(mockTask);
      
      expect(result).toBe('success');
      expect(mockTask).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent requests within limit', async () => {
      const mockTask = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'success';
      });

      const promise1 = rateLimiter.schedule(mockTask);
      const promise2 = rateLimiter.schedule(mockTask);

      const results = await Promise.all([promise1, promise2]);
      
      expect(results).toEqual(['success', 'success']);
      expect(mockTask).toHaveBeenCalledTimes(2);
    });

    it('should rate limit requests', async () => {
      const startTime = Date.now();
      const mockTask = jest.fn().mockResolvedValue('success');

      await rateLimiter.schedule(mockTask);
      await rateLimiter.schedule(mockTask);

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should take at least minTime (1000ms) between requests
      expect(elapsed).toBeGreaterThanOrEqual(900); // Allow some margin for timing
      expect(mockTask).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling and retries', () => {
    it('should retry failed requests', async () => {
      let attempts = 0;
      const mockTask = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts <= 2) {
          throw new Error('Temporary failure');
        }
        return 'success after retries';
      });

      const result = await rateLimiter.schedule(mockTask);
      
      expect(result).toBe('success after retries');
      expect(mockTask).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should fail after max retries exceeded', async () => {
      const mockTask = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(rateLimiter.schedule(mockTask)).rejects.toThrow('Persistent failure');
      expect(mockTask).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle tasks that throw errors immediately', async () => {
      const mockTask = jest.fn().mockImplementation(() => {
        throw new Error('Immediate error');
      });

      await expect(rateLimiter.schedule(mockTask)).rejects.toThrow('Immediate error');
    });
  });

  describe('capacity management', () => {
    it('should check if at capacity', () => {
      const isAtCapacity = rateLimiter.isAtCapacity();
      expect(typeof isAtCapacity).toBe('boolean');
    });
  });

  describe('status monitoring', () => {
    it('should provide statistics', () => {
      const stats = rateLimiter.getStats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('running');
      expect(stats).toHaveProperty('queued');
      expect(stats).toHaveProperty('done');
      expect(stats).toHaveProperty('capacity');
      expect(stats).toHaveProperty('reservoir');
    });
  });

  describe('retry delay calculation', () => {
    it('should calculate retry delay for different status codes', () => {
      const delay429 = rateLimiter.getRetryDelayForStatus(429, 0);
      const delay500 = rateLimiter.getRetryDelayForStatus(500, 0);
      const delay503 = rateLimiter.getRetryDelayForStatus(503, 0);
      
      expect(delay429).toBeGreaterThanOrEqual(5000); // At least 5 seconds for 429
      expect(delay503).toBeGreaterThanOrEqual(3000); // At least 3 seconds for 503
      expect(typeof delay500).toBe('number');
    });

    it('should apply exponential backoff', () => {
      const delay0 = rateLimiter.getRetryDelayForStatus(429, 0);
      const delay1 = rateLimiter.getRetryDelayForStatus(429, 1);
      const delay2 = rateLimiter.getRetryDelayForStatus(429, 2);
      
      expect(delay1).toBeGreaterThan(delay0);
      expect(delay2).toBeGreaterThan(delay1);
    });
  });

  describe('static factory methods', () => {
    it('should create rate limiter for specific site', () => {
      const siteLimiter = RateLimiter.createForSite('test-site', 30, 1);
      expect(siteLimiter).toBeDefined();
      expect(siteLimiter).toBeInstanceOf(RateLimiter);
    });
  });
}); 