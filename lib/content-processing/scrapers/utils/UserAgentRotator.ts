import { ScraperLogger } from './ScraperLogger';

export interface UserAgentRotatorOptions {
  userAgents?: string[];
  mobileRatio?: number; // 0-1, percentage of mobile user agents
  strategy: 'round-robin' | 'random' | 'weighted';
  avoidRecentlyUsed?: boolean;
  recentUsageWindow?: number; // milliseconds
}

export interface UserAgentInfo {
  userAgent: string;
  isMobile: boolean;
  browser: string;
  os: string;
  lastUsed?: Date;
  usageCount?: number;
}

export class UserAgentRotator {
  private userAgents: UserAgentInfo[];
  private currentIndex: number = 0;
  private options: UserAgentRotatorOptions;
  private logger: ScraperLogger;
  private recentlyUsed: Set<string> = new Set();

  // Default user agents
  private static readonly DEFAULT_DESKTOP_AGENTS = [
    {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      browser: 'Chrome',
      os: 'Windows 10'
    },
    {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      browser: 'Chrome',
      os: 'macOS'
    },
    {
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      browser: 'Chrome',
      os: 'Linux'
    },
    {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      browser: 'Firefox',
      os: 'Windows 10'
    },
    {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
      browser: 'Firefox',
      os: 'macOS'
    },
    {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      browser: 'Safari',
      os: 'macOS'
    },
    {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      browser: 'Edge',
      os: 'Windows 10'
    }
  ];

  private static readonly DEFAULT_MOBILE_AGENTS = [
    {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      browser: 'Safari',
      os: 'iOS'
    },
    {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1',
      browser: 'Chrome',
      os: 'iOS'
    },
    {
      userAgent: 'Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0',
      browser: 'Firefox',
      os: 'Android'
    },
    {
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      browser: 'Chrome',
      os: 'Android'
    },
    {
      userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      browser: 'Chrome',
      os: 'Android'
    },
    {
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      browser: 'Safari',
      os: 'iPadOS'
    }
  ];

  constructor(options: UserAgentRotatorOptions, logger?: ScraperLogger) {
    this.options = {
      mobileRatio: 0.3, // 30% mobile by default
      avoidRecentlyUsed: true,
      recentUsageWindow: 60 * 1000, // 1 minute
      ...options
    };
    
    this.logger = logger || new ScraperLogger('UserAgentRotator');
    this.userAgents = this.initializeUserAgents();
  }

  /**
   * Initialize user agents from options or defaults
   */
  private initializeUserAgents(): UserAgentInfo[] {
    if (this.options.userAgents && this.options.userAgents.length > 0) {
      return this.options.userAgents.map(ua => ({
        userAgent: ua,
        isMobile: this.detectMobile(ua),
        browser: this.detectBrowser(ua),
        os: this.detectOS(ua),
        usageCount: 0
      }));
    }

    // Use default agents with mobile ratio
    const mobileCount = Math.floor(UserAgentRotator.DEFAULT_MOBILE_AGENTS.length * (this.options.mobileRatio || 0.3));
    const desktopCount = UserAgentRotator.DEFAULT_DESKTOP_AGENTS.length - mobileCount;

    const selectedMobile = UserAgentRotator.DEFAULT_MOBILE_AGENTS
      .slice(0, mobileCount)
      .map(agent => ({ ...agent, isMobile: true, usageCount: 0 }));

    const selectedDesktop = UserAgentRotator.DEFAULT_DESKTOP_AGENTS
      .slice(0, desktopCount)
      .map(agent => ({ ...agent, isMobile: false, usageCount: 0 }));

    return [...selectedDesktop, ...selectedMobile];
  }

  /**
   * Get the next user agent according to the strategy
   */
  getNext(preferMobile?: boolean): string {
    let availableAgents = this.userAgents;

    // Filter by mobile preference if specified
    if (preferMobile !== undefined) {
      availableAgents = this.userAgents.filter(ua => ua.isMobile === preferMobile);
    }

    // Filter out recently used agents if enabled
    if (this.options.avoidRecentlyUsed) {
      const now = Date.now();
      const windowMs = this.options.recentUsageWindow || 60000;
      
      availableAgents = availableAgents.filter(ua => {
        if (!ua.lastUsed) return true;
        return (now - ua.lastUsed.getTime()) > windowMs;
      });

      // If all agents are recently used, use all available
      if (availableAgents.length === 0) {
        availableAgents = preferMobile !== undefined 
          ? this.userAgents.filter(ua => ua.isMobile === preferMobile)
          : this.userAgents;
      }
    }

    let selectedAgent: UserAgentInfo;

    switch (this.options.strategy) {
      case 'round-robin':
        selectedAgent = this.getNextRoundRobin(availableAgents);
        break;
      case 'weighted':
        selectedAgent = this.getWeightedAgent(availableAgents);
        break;
      case 'random':
      default:
        selectedAgent = this.getRandomAgent(availableAgents);
        break;
    }

    // Update usage tracking
    selectedAgent.lastUsed = new Date();
    selectedAgent.usageCount = (selectedAgent.usageCount || 0) + 1;
    this.recentlyUsed.add(selectedAgent.userAgent);

    this.logger.debug('Selected user agent', {
      browser: selectedAgent.browser,
      os: selectedAgent.os,
      isMobile: selectedAgent.isMobile,
      strategy: this.options.strategy
    });

    // Clean up recently used set periodically
    setTimeout(() => {
      this.recentlyUsed.delete(selectedAgent.userAgent);
    }, this.options.recentUsageWindow || 60000);

    return selectedAgent.userAgent;
  }

  /**
   * Round-robin selection
   */
  private getNextRoundRobin(availableAgents: UserAgentInfo[]): UserAgentInfo {
    const agent = availableAgents[this.currentIndex % availableAgents.length];
    this.currentIndex = (this.currentIndex + 1) % availableAgents.length;
    return agent;
  }

  /**
   * Random selection
   */
  private getRandomAgent(availableAgents: UserAgentInfo[]): UserAgentInfo {
    const randomIndex = Math.floor(Math.random() * availableAgents.length);
    return availableAgents[randomIndex];
  }

  /**
   * Weighted selection (less used agents have higher probability)
   */
  private getWeightedAgent(availableAgents: UserAgentInfo[]): UserAgentInfo {
    const maxUsage = Math.max(...availableAgents.map(ua => ua.usageCount || 0));
    const weights = availableAgents.map(ua => maxUsage - (ua.usageCount || 0) + 1);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < availableAgents.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return availableAgents[i];
      }
    }
    
    return availableAgents[availableAgents.length - 1];
  }

  /**
   * Detect if user agent is mobile
   */
  private detectMobile(userAgent: string): boolean {
    const mobileKeywords = ['Mobile', 'Android', 'iPhone', 'iPad', 'iPod', 'Windows Phone'];
    return mobileKeywords.some(keyword => userAgent.includes(keyword));
  }

  /**
   * Detect browser from user agent
   */
  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Detect OS from user agent
   */
  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows NT')) return 'Windows';
    if (userAgent.includes('Mac OS X')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Get statistics about user agent usage
   */
  getStats(): {
    total: number;
    mobile: number;
    desktop: number;
    byBrowser: Record<string, number>;
    byOS: Record<string, number>;
    totalUsage: number;
  } {
    const mobile = this.userAgents.filter(ua => ua.isMobile).length;
    const desktop = this.userAgents.length - mobile;
    
    const byBrowser: Record<string, number> = {};
    const byOS: Record<string, number> = {};
    let totalUsage = 0;

    this.userAgents.forEach(ua => {
      byBrowser[ua.browser] = (byBrowser[ua.browser] || 0) + 1;
      byOS[ua.os] = (byOS[ua.os] || 0) + 1;
      totalUsage += ua.usageCount || 0;
    });

    return {
      total: this.userAgents.length,
      mobile,
      desktop,
      byBrowser,
      byOS,
      totalUsage
    };
  }

  /**
   * Add a custom user agent
   */
  addUserAgent(userAgent: string): void {
    const userAgentInfo: UserAgentInfo = {
      userAgent,
      isMobile: this.detectMobile(userAgent),
      browser: this.detectBrowser(userAgent),
      os: this.detectOS(userAgent),
      usageCount: 0
    };

    this.userAgents.push(userAgentInfo);
    this.logger.info('Added custom user agent', {
      browser: userAgentInfo.browser,
      os: userAgentInfo.os,
      isMobile: userAgentInfo.isMobile
    });
  }

  /**
   * Remove a user agent
   */
  removeUserAgent(userAgent: string): boolean {
    const index = this.userAgents.findIndex(ua => ua.userAgent === userAgent);
    if (index !== -1) {
      this.userAgents.splice(index, 1);
      this.logger.info('Removed user agent', { userAgent });
      return true;
    }
    return false;
  }

  /**
   * Reset usage statistics
   */
  resetStats(): void {
    this.userAgents.forEach(ua => {
      ua.usageCount = 0;
      ua.lastUsed = undefined;
    });
    this.recentlyUsed.clear();
    this.logger.info('Reset user agent statistics');
  }
} 