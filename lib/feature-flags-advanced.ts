import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export type RolloutStrategy = 'percentage' | 'internal' | 'allowlist' | 'all' | 'none';

interface RolloutConfig {
  strategy: RolloutStrategy;
  percentage?: number;
  allowlist?: string[];
  internalDomains?: string[];
}

/**
 * Advanced feature flag system with gradual rollout support
 */
export class FeatureFlagService {
  private static instance: FeatureFlagService;
  
  private constructor() {}
  
  static getInstance(): FeatureFlagService {
    if (!this.instance) {
      this.instance = new FeatureFlagService();
    }
    return this.instance;
  }

  /**
   * Check if a feature is enabled for the current user
   */
  async isEnabled(
    featureName: string,
    userId?: string,
    userEmail?: string
  ): Promise<boolean> {
    // Get base flag value
    const baseFlag = process.env[`NEXT_PUBLIC_${featureName}`] === 'true';
    
    // If base flag is false, check rollout strategy
    if (!baseFlag) {
      const rolloutConfig = this.getRolloutConfig(featureName);
      return this.evaluateRollout(rolloutConfig, userId, userEmail);
    }
    
    return baseFlag;
  }

  /**
   * Get rollout configuration for a feature
   */
  private getRolloutConfig(featureName: string): RolloutConfig {
    const strategy = process.env.NEXT_PUBLIC_ROLLOUT_STRATEGY as RolloutStrategy || 'none';
    const percentage = parseInt(process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE || '0');
    const internalDomains = JSON.parse(process.env.NEXT_PUBLIC_INTERNAL_USERS || '["@tripnav.com"]');
    
    return {
      strategy,
      percentage,
      internalDomains,
      allowlist: this.getAllowlist(featureName)
    };
  }

  /**
   * Evaluate rollout strategy
   */
  private evaluateRollout(
    config: RolloutConfig,
    userId?: string,
    userEmail?: string
  ): boolean {
    switch (config.strategy) {
      case 'all':
        return true;
        
      case 'none':
        return false;
        
      case 'internal':
        return this.isInternalUser(userEmail, config.internalDomains);
        
      case 'percentage':
        return this.isInPercentage(userId, config.percentage || 0);
        
      case 'allowlist':
        return this.isInAllowlist(userEmail, config.allowlist);
        
      default:
        return false;
    }
  }

  /**
   * Check if user is internal
   */
  private isInternalUser(email?: string, domains?: string[]): boolean {
    if (!email || !domains) return false;
    return domains.some(domain => email.endsWith(domain));
  }

  /**
   * Check if user is in rollout percentage
   */
  private isInPercentage(userId?: string, percentage: number): boolean {
    if (!userId || percentage === 0) return false;
    if (percentage >= 100) return true;
    
    // Hash user ID to get consistent number between 0-99
    const hash = this.hashString(userId);
    const userBucket = hash % 100;
    
    return userBucket < percentage;
  }

  /**
   * Check if user is in allowlist
   */
  private isInAllowlist(email?: string, allowlist?: string[]): boolean {
    if (!email || !allowlist) return false;
    return allowlist.includes(email);
  }

  /**
   * Get allowlist for a feature
   */
  private getAllowlist(featureName: string): string[] {
    const allowlistEnv = process.env[`NEXT_PUBLIC_${featureName}_ALLOWLIST`];
    if (!allowlistEnv) return [];
    
    try {
      return JSON.parse(allowlistEnv);
    } catch {
      return [];
    }
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * React hook for advanced feature flags
 */
export function useAdvancedFeatureFlag(featureName: string) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkFlag() {
      try {
        const session = await getSession();
        const userId = session?.user?.id;
        const userEmail = session?.user?.email;
        
        const flagService = FeatureFlagService.getInstance();
        const enabled = await flagService.isEnabled(featureName, userId, userEmail);
        
        setIsEnabled(enabled);
      } catch (error) {
        console.error('Error checking feature flag:', error);
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    }

    checkFlag();
  }, [featureName]);

  return { isEnabled, loading };
}

/**
 * Server-side feature flag check
 */
export async function checkFeatureFlag(
  featureName: string,
  request?: Request
): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;
    
    const flagService = FeatureFlagService.getInstance();
    return await flagService.isEnabled(featureName, userId, userEmail);
  } catch (error) {
    console.error('Error checking feature flag:', error);
    return false;
  }
}

/**
 * Feature flag middleware for API routes
 */
export function withFeatureFlag(featureName: string) {
  return (handler: Function) => {
    return async (request: Request, ...args: any[]) => {
      const isEnabled = await checkFeatureFlag(featureName, request);
      
      if (!isEnabled) {
        return new Response(
          JSON.stringify({ error: 'Feature not enabled' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return handler(request, ...args);
    };
  };
}

// Export singleton instance
export const featureFlags = FeatureFlagService.getInstance();