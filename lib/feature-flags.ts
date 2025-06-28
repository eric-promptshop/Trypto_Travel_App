/**
 * Feature flags for gradual rollout of new services
 */
export const FEATURE_FLAGS = {
  // Service migration flags
  USE_NEW_TOUR_SERVICE: process.env.NEXT_PUBLIC_USE_NEW_TOUR_SERVICE === 'true',
  USE_NEW_ITINERARY_SERVICE: process.env.NEXT_PUBLIC_USE_NEW_ITINERARY_SERVICE === 'true',
  USE_NEW_LEAD_SERVICE: process.env.NEXT_PUBLIC_USE_NEW_LEAD_SERVICE === 'true',
  USE_NEW_USER_SERVICE: process.env.NEXT_PUBLIC_USE_NEW_USER_SERVICE === 'true',
  
  // Feature flags
  ENABLE_TOUR_TEMPLATES: process.env.NEXT_PUBLIC_ENABLE_TOUR_TEMPLATES === 'true',
  ENABLE_AI_RECOMMENDATIONS: process.env.NEXT_PUBLIC_ENABLE_AI_RECOMMENDATIONS === 'true',
  ENABLE_ADVANCED_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS === 'true',
  ENABLE_MULTI_LANGUAGE: process.env.NEXT_PUBLIC_ENABLE_MULTI_LANGUAGE === 'true',
  
  // Performance flags
  ENABLE_CACHING: process.env.NEXT_PUBLIC_ENABLE_CACHING !== 'false', // Default true
  ENABLE_LAZY_LOADING: process.env.NEXT_PUBLIC_ENABLE_LAZY_LOADING !== 'false', // Default true
  
  // Debug flags
  ENABLE_DEBUG_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_PERFORMANCE_MONITORING: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true'
};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature] || false;
}

/**
 * React hook for feature flags
 */
export function useFeatureFlag(feature: keyof typeof FEATURE_FLAGS): boolean {
  return isFeatureEnabled(feature);
}

/**
 * HOC to conditionally render based on feature flag
 */
export function withFeatureFlag<P extends object>(
  feature: keyof typeof FEATURE_FLAGS,
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>
): React.ComponentType<P> {
  return (props: P) => {
    if (isFeatureEnabled(feature)) {
      return <Component {...props} />;
    }
    return FallbackComponent ? <FallbackComponent {...props} /> : null;
  };
}

/**
 * Get all enabled features (useful for debugging)
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
}

/**
 * Override feature flags for testing
 * WARNING: Only use in test environments
 */
export function overrideFeatureFlags(overrides: Partial<typeof FEATURE_FLAGS>): void {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Feature flag overrides are not allowed in production');
    return;
  }
  
  Object.assign(FEATURE_FLAGS, overrides);
}