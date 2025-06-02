import { ScraperLogger } from './ScraperLogger';

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol?: 'http' | 'https' | 'socks4' | 'socks5';
  active?: boolean;
  lastUsed?: Date;
  errorCount?: number;
  responseTime?: number;
}

export interface ProxyRotatorOptions {
  proxies: ProxyConfig[];
  maxErrorsPerProxy: number;
  healthCheckInterval: number; // milliseconds
  healthCheckUrl?: string;
  rotationStrategy: 'round-robin' | 'random' | 'least-used' | 'fastest';
  retryFailedProxies: boolean;
}

export class ProxyRotator {
  private proxies: ProxyConfig[];
  private currentIndex: number = 0;
  private options: ProxyRotatorOptions;
  private logger: ScraperLogger;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(options: ProxyRotatorOptions, logger?: ScraperLogger) {
    this.options = options;
    this.proxies = options.proxies.map(proxy => ({
      ...proxy,
      active: proxy.active !== false, // default to true
      errorCount: proxy.errorCount || 0,
      responseTime: proxy.responseTime || 0
    }));
    this.logger = logger || new ScraperLogger('ProxyRotator');

    // Start health check if interval is set
    if (options.healthCheckInterval > 0) {
      this.startHealthCheck();
    }
  }

  /**
   * Get the next proxy according to the rotation strategy
   */
  getNext(): ProxyConfig | null {
    const activeProxies = this.getActiveProxies();
    
    if (activeProxies.length === 0) {
      this.logger.warn('No active proxies available');
      return null;
    }

    let selectedProxy: ProxyConfig;

    switch (this.options.rotationStrategy) {
      case 'round-robin':
        selectedProxy = this.getNextRoundRobin(activeProxies);
        break;
      case 'random':
        selectedProxy = this.getRandomProxy(activeProxies);
        break;
      case 'least-used':
        selectedProxy = this.getLeastUsedProxy(activeProxies);
        break;
      case 'fastest':
        selectedProxy = this.getFastestProxy(activeProxies);
        break;
      default:
        selectedProxy = this.getNextRoundRobin(activeProxies);
    }

    selectedProxy.lastUsed = new Date();
    
    this.logger.debug('Selected proxy', {
      host: selectedProxy.host,
      port: selectedProxy.port,
      strategy: this.options.rotationStrategy
    });

    return selectedProxy;
  }

  /**
   * Get active proxies (those with error count below threshold)
   */
  private getActiveProxies(): ProxyConfig[] {
    return this.proxies.filter(proxy => 
      proxy.active && proxy.errorCount! < this.options.maxErrorsPerProxy
    );
  }

  /**
   * Round-robin proxy selection
   */
  private getNextRoundRobin(activeProxies: ProxyConfig[]): ProxyConfig {
    const proxy = activeProxies[this.currentIndex % activeProxies.length];
    this.currentIndex = (this.currentIndex + 1) % activeProxies.length;
    return proxy;
  }

  /**
   * Random proxy selection
   */
  private getRandomProxy(activeProxies: ProxyConfig[]): ProxyConfig {
    const randomIndex = Math.floor(Math.random() * activeProxies.length);
    return activeProxies[randomIndex];
  }

  /**
   * Select proxy with least usage
   */
  private getLeastUsedProxy(activeProxies: ProxyConfig[]): ProxyConfig {
    return activeProxies.reduce((least, current) => {
      const leastTime = least.lastUsed?.getTime() || 0;
      const currentTime = current.lastUsed?.getTime() || 0;
      return currentTime < leastTime ? current : least;
    });
  }

  /**
   * Select proxy with fastest response time
   */
  private getFastestProxy(activeProxies: ProxyConfig[]): ProxyConfig {
    return activeProxies.reduce((fastest, current) => {
      const fastestTime = fastest.responseTime || Infinity;
      const currentTime = current.responseTime || Infinity;
      return currentTime < fastestTime ? current : fastest;
    });
  }

  /**
   * Report a proxy error
   */
  reportError(proxy: ProxyConfig, error: Error): void {
    const proxyIndex = this.proxies.findIndex(p => 
      p.host === proxy.host && p.port === proxy.port
    );

    if (proxyIndex !== -1) {
      this.proxies[proxyIndex].errorCount = (this.proxies[proxyIndex].errorCount || 0) + 1;
      
      this.logger.warn('Proxy error reported', {
        host: proxy.host,
        port: proxy.port,
        errorCount: this.proxies[proxyIndex].errorCount,
        error: error.message
      });

      // Deactivate proxy if error threshold reached
      if (this.proxies[proxyIndex].errorCount! >= this.options.maxErrorsPerProxy) {
        this.proxies[proxyIndex].active = false;
        this.logger.error('Proxy deactivated due to errors', {
          host: proxy.host,
          port: proxy.port,
          errorCount: this.proxies[proxyIndex].errorCount
        });
      }
    }
  }

  /**
   * Report successful proxy usage with response time
   */
  reportSuccess(proxy: ProxyConfig, responseTime: number): void {
    const proxyIndex = this.proxies.findIndex(p => 
      p.host === proxy.host && p.port === proxy.port
    );

    if (proxyIndex !== -1) {
      // Update response time (moving average)
      const currentTime = this.proxies[proxyIndex].responseTime || responseTime;
      this.proxies[proxyIndex].responseTime = (currentTime + responseTime) / 2;
      
      this.logger.debug('Proxy success reported', {
        host: proxy.host,
        port: proxy.port,
        responseTime,
        averageResponseTime: this.proxies[proxyIndex].responseTime
      });
    }
  }

  /**
   * Test a single proxy
   */
  async testProxy(proxy: ProxyConfig): Promise<boolean> {
    const testUrl = this.options.healthCheckUrl || 'https://httpbin.org/ip';
    const startTime = Date.now();

    try {
      // This is a placeholder - in a real implementation, you'd use axios or fetch with the proxy
      // const response = await fetch(testUrl, { proxy: formatProxyUrl(proxy), timeout: 10000 });
      // const success = response.ok;
      
      // Simulated test for now
      const success = Math.random() > 0.1; // 90% success rate for simulation
      const responseTime = Date.now() - startTime;

      if (success) {
        this.reportSuccess(proxy, responseTime);
      } else {
        this.reportError(proxy, new Error('Health check failed'));
      }

      return success;
    } catch (error) {
      this.reportError(proxy, error as Error);
      return false;
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      this.logger.info('Starting proxy health check');
      
      const testPromises = this.proxies.map(proxy => this.testProxy(proxy));
      await Promise.allSettled(testPromises);
      
      const activeCount = this.getActiveProxies().length;
      this.logger.info('Proxy health check completed', {
        totalProxies: this.proxies.length,
        activeProxies: activeCount
      });
    }, this.options.healthCheckInterval);
  }

  /**
   * Stop health checks
   */
  stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  /**
   * Reset error counts for all proxies
   */
  resetErrorCounts(): void {
    this.proxies.forEach(proxy => {
      proxy.errorCount = 0;
      proxy.active = true;
    });
    this.logger.info('Reset error counts for all proxies');
  }

  /**
   * Get proxy statistics
   */
  getStats(): {
    total: number;
    active: number;
    inactive: number;
    averageResponseTime: number;
    totalErrors: number;
  } {
    const active = this.getActiveProxies();
    const inactive = this.proxies.filter(p => !p.active || p.errorCount! >= this.options.maxErrorsPerProxy);
    
    const totalResponseTime = this.proxies.reduce((sum, proxy) => sum + (proxy.responseTime || 0), 0);
    const averageResponseTime = this.proxies.length > 0 ? totalResponseTime / this.proxies.length : 0;
    
    const totalErrors = this.proxies.reduce((sum, proxy) => sum + (proxy.errorCount || 0), 0);

    return {
      total: this.proxies.length,
      active: active.length,
      inactive: inactive.length,
      averageResponseTime,
      totalErrors
    };
  }

  /**
   * Format proxy for use with HTTP libraries
   */
  static formatProxyUrl(proxy: ProxyConfig): string {
    const protocol = proxy.protocol || 'http';
    const auth = proxy.username && proxy.password ? `${proxy.username}:${proxy.password}@` : '';
    return `${protocol}://${auth}${proxy.host}:${proxy.port}`;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stopHealthCheck();
    this.logger.info('ProxyRotator disposed');
  }
} 