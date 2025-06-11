export interface EnvironmentConfig {
  name: string;
  displayName: string;
  domain?: string;
  subdomain?: string;
  isProduction: boolean;
  features: string[];
  environmentVariables: Record<string, string>;
  deploymentSettings: DeploymentSettings;
}

export interface DeploymentSettings {
  provider: 'vercel' | 'netlify' | 'aws' | 'custom';
  buildCommand?: string;
  outputDirectory?: string;
  nodeVersion?: string;
  framework?: string;
  installCommand?: string;
  devCommand?: string;
  regions?: string[];
  customHeaders?: Record<string, string>;
  redirects?: RedirectRule[];
  rewrites?: RewriteRule[];
}

export interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
}

export interface RewriteRule {
  source: string;
  destination: string;
}

export interface TenantEnvironmentConfig {
  tenantId: string;
  environments: Record<string, EnvironmentConfig>;
  defaultEnvironment: string;
}

// Default environment configurations
export const DEFAULT_ENVIRONMENTS: Record<string, Omit<EnvironmentConfig, 'domain' | 'subdomain'>> = {
  development: {
    name: 'development',
    displayName: 'Development',
    isProduction: false,
    features: [
      'debug-mode',
      'hot-reload',
      'dev-tools',
      'mock-data',
      'test-payments'
    ],
    environmentVariables: {
      NODE_ENV: 'development',
      NEXT_PUBLIC_ENVIRONMENT: 'development',
      NEXT_PUBLIC_DEBUG: 'true',
      NEXT_PUBLIC_API_URL: 'http://localhost:3000/api',
    },
    deploymentSettings: {
      provider: 'vercel',
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      nodeVersion: '18.x',
      framework: 'nextjs',
      installCommand: 'npm ci',
      devCommand: 'npm run dev',
      regions: ['iad1'], // US East
    }
  },
  staging: {
    name: 'staging',
    displayName: 'Staging',
    isProduction: false,
    features: [
      'analytics',
      'error-tracking',
      'performance-monitoring',
      'test-payments',
      'preview-mode'
    ],
    environmentVariables: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_ENVIRONMENT: 'staging',
      NEXT_PUBLIC_DEBUG: 'false',
      NEXT_PUBLIC_ANALYTICS_ENABLED: 'true',
    },
    deploymentSettings: {
      provider: 'vercel',
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      nodeVersion: '18.x',
      framework: 'nextjs',
      installCommand: 'npm ci',
      regions: ['iad1'],
      customHeaders: {
        'X-Robots-Tag': 'noindex, nofollow',
        'X-Frame-Options': 'DENY',
      }
    }
  },
  production: {
    name: 'production',
    displayName: 'Production',
    isProduction: true,
    features: [
      'analytics',
      'error-tracking',
      'performance-monitoring',
      'live-payments',
      'cdn',
      'ssl',
      'security-headers'
    ],
    environmentVariables: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_ENVIRONMENT: 'production',
      NEXT_PUBLIC_DEBUG: 'false',
      NEXT_PUBLIC_ANALYTICS_ENABLED: 'true',
      NEXT_PUBLIC_CDN_ENABLED: 'true',
    },
    deploymentSettings: {
      provider: 'vercel',
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      nodeVersion: '18.x',
      framework: 'nextjs',
      installCommand: 'npm ci',
      regions: ['iad1', 'sfo1', 'fra1'], // Multi-region
      customHeaders: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      },
      redirects: [
        {
          source: '/admin',
          destination: '/admin/dashboard',
          permanent: false
        }
      ]
    }
  }
};

/**
 * Create environment configuration for a tenant
 */
export function createTenantEnvironmentConfig(
  tenantId: string,
  tenantSlug: string,
  customDomain?: string
): TenantEnvironmentConfig {
  const environments: Record<string, EnvironmentConfig> = {};

  Object.entries(DEFAULT_ENVIRONMENTS).forEach(([envName, envConfig]) => {
    const domain = customDomain || `${tenantSlug}-${envName}.travel-platform.com`;
    const subdomain = envName === 'production' ? tenantSlug : `${tenantSlug}-${envName}`;

    environments[envName] = {
      ...envConfig,
      domain: envName === 'production' && customDomain ? customDomain : domain,
      subdomain,
      environmentVariables: {
        ...envConfig.environmentVariables,
        NEXT_PUBLIC_TENANT_ID: tenantId,
        NEXT_PUBLIC_TENANT_SLUG: tenantSlug,
        NEXT_PUBLIC_CUSTOM_DOMAIN: customDomain || '',
        NEXT_PUBLIC_API_URL: `https://${domain}/api`,
      }
    };
  });

  return {
    tenantId,
    environments,
    defaultEnvironment: 'production'
  };
}

/**
 * Get environment configuration for deployment
 */
export function getEnvironmentConfig(
  tenantConfig: TenantEnvironmentConfig,
  environmentName: string
): EnvironmentConfig | null {
  return tenantConfig.environments[environmentName] || null;
}

/**
 * Validate environment configuration
 */
export function validateEnvironmentConfig(config: EnvironmentConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.name) {
    errors.push('Environment name is required');
  }

  if (!config.displayName) {
    errors.push('Environment display name is required');
  }

  if (!config.deploymentSettings.provider) {
    errors.push('Deployment provider is required');
  }

  if (config.isProduction && !config.domain) {
    errors.push('Production environment requires a domain');
  }

  // Validate environment variables
  const requiredEnvVars = ['NODE_ENV', 'NEXT_PUBLIC_ENVIRONMENT'];
  requiredEnvVars.forEach(envVar => {
    if (!config.environmentVariables[envVar]) {
      errors.push(`Required environment variable missing: ${envVar}`);
    }
  });

  // Validate deployment settings
  if (config.deploymentSettings.provider === 'vercel') {
    if (!config.deploymentSettings.buildCommand) {
      errors.push('Build command is required for Vercel deployments');
    }
    if (!config.deploymentSettings.outputDirectory) {
      errors.push('Output directory is required for Vercel deployments');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Merge custom environment variables with defaults
 */
export function mergeEnvironmentVariables(
  defaultVars: Record<string, string>,
  customVars: Record<string, string>
): Record<string, string> {
  return {
    ...defaultVars,
    ...customVars
  };
}

/**
 * Generate deployment configuration for a specific provider
 */
export function generateDeploymentConfig(
  config: EnvironmentConfig,
  provider: 'vercel' | 'netlify' | 'aws'
): any {
  switch (provider) {
    case 'vercel':
      return {
        name: `${config.subdomain}-${config.name}`,
        builds: [
          {
            src: 'package.json',
            use: '@vercel/next'
          }
        ],
        env: config.environmentVariables,
        headers: config.deploymentSettings.customHeaders ? [
          {
            source: '/(.*)',
            headers: Object.entries(config.deploymentSettings.customHeaders).map(([key, value]) => ({
              key,
              value
            }))
          }
        ] : undefined,
        redirects: config.deploymentSettings.redirects,
        rewrites: config.deploymentSettings.rewrites,
        regions: config.deploymentSettings.regions,
      };

    case 'netlify':
      return {
        build: {
          command: config.deploymentSettings.buildCommand,
          publish: config.deploymentSettings.outputDirectory,
          environment: config.environmentVariables
        },
        headers: config.deploymentSettings.customHeaders ? [
          {
            for: '/*',
            values: config.deploymentSettings.customHeaders
          }
        ] : undefined,
        redirects: config.deploymentSettings.redirects?.map(redirect => ({
          from: redirect.source,
          to: redirect.destination,
          status: redirect.permanent ? 301 : 302
        }))
      };

    case 'aws':
      return {
        // AWS CloudFormation or CDK configuration
        Resources: {
          S3Bucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketName: `${config.subdomain}-${config.name}`,
              WebsiteConfiguration: {
                IndexDocument: 'index.html',
                ErrorDocument: 'error.html'
              }
            }
          },
          CloudFrontDistribution: {
            Type: 'AWS::CloudFront::Distribution',
            Properties: {
              DistributionConfig: {
                Origins: [{
                  DomainName: `${config.subdomain}-${config.name}.s3.amazonaws.com`,
                  Id: 'S3Origin',
                  S3OriginConfig: {}
                }],
                DefaultCacheBehavior: {
                  TargetOriginId: 'S3Origin',
                  ViewerProtocolPolicy: 'redirect-to-https'
                },
                Enabled: true,
                Aliases: config.domain ? [config.domain] : undefined
              }
            }
          }
        }
      };

    default:
      throw new Error(`Unsupported deployment provider: ${provider}`);
  }
}

/**
 * Get environment-specific feature flags
 */
export function getFeatureFlags(config: EnvironmentConfig): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  
  config.features.forEach(feature => {
    flags[feature] = true;
  });

  return flags;
}

/**
 * Check if a feature is enabled in the environment
 */
export function isFeatureEnabled(config: EnvironmentConfig, feature: string): boolean {
  return config.features.includes(feature);
} 