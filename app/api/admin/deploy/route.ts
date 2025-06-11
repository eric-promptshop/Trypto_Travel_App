import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withTenantIsolation, createAuditLog } from '@/lib/middleware/tenant';
import { hasPermission, RESOURCES, ACTIONS } from '@/lib/auth/rbac';
import { 
  createTenantEnvironmentConfig, 
  getEnvironmentConfig, 
  validateEnvironmentConfig,
  generateDeploymentConfig,
  mergeEnvironmentVariables
} from '@/lib/config/environment';

// POST /api/admin/deploy - Deploy white-label instance
export const POST = withTenantIsolation(async (tenantContext, request: NextRequest) => {
  try {
    // Check permissions
    if (tenantContext.userContext && !hasPermission(
      tenantContext.userContext, 
      RESOURCES.DEPLOYMENT, 
      ACTIONS.CREATE
    )) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      environment = 'production', 
      customDomain,
      customEnvironmentVariables = {},
      features = [],
      deploymentProvider = 'vercel'
    } = body;

    // Validate environment
    const validEnvironments = ['development', 'staging', 'production'];
    if (!validEnvironments.includes(environment)) {
      return NextResponse.json(
        { error: 'Invalid environment. Must be one of: development, staging, production' },
        { status: 400 }
      );
    }

    // Get tenant configuration
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantContext.tenantId },
    });

    if (!tenant || !tenant.isActive) {
      return NextResponse.json(
        { error: 'Tenant not found or inactive' },
        { status: 404 }
      );
    }

    // Create environment configuration for tenant
    const tenantEnvConfig = createTenantEnvironmentConfig(
      tenant.id,
      tenant.slug,
      customDomain
    );

    // Get specific environment config
    const envConfig = getEnvironmentConfig(tenantEnvConfig, environment);
    if (!envConfig) {
      return NextResponse.json(
        { error: `Environment configuration not found: ${environment}` },
        { status: 400 }
      );
    }

    // Merge custom environment variables
    envConfig.environmentVariables = mergeEnvironmentVariables(
      envConfig.environmentVariables,
      customEnvironmentVariables
    );

    // Override features if provided
    if (features.length > 0) {
      envConfig.features = features;
    }

    // Validate environment configuration
    const validation = validateEnvironmentConfig(envConfig);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid environment configuration', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Get published content for deployment
    const publishedContent = await prisma.tenantContent.findMany({
      where: { 
        tenantId: tenantContext.tenantId,
        status: 'published' 
      },
      select: {
        id: true,
        title: true,
        contentType: true,
        content: true,
        metadata: true,
        createdAt: true,
      }
    });

    // Generate deployment configuration for the specified provider
    const deploymentConfig = generateDeploymentConfig(envConfig, deploymentProvider);

    // Build comprehensive deployment package
    const deploymentPackage = {
      tenantId: tenant.id,
      environment,
      domain: envConfig.domain,
      subdomain: envConfig.subdomain,
      provider: deploymentProvider,
      config: deploymentConfig,
      environmentVariables: envConfig.environmentVariables,
      features: envConfig.features,
      content: publishedContent,
      settings: {
        ...(tenant.settings as any),
        deployment: {
          environment,
          deployedAt: new Date().toISOString(),
          deployedBy: tenantContext.userId,
          provider: deploymentProvider,
          version: `v${Date.now()}`,
        }
      },
    };

    // Create deployment record
    const deployment = await prisma.tenantContent.create({
      data: {
        title: `Deployment - ${environment} - ${new Date().toISOString()}`,
        content: deploymentPackage,
        contentType: 'deployment',
        status: 'pending',
        tenantId: tenant.id,
        authorId: tenantContext.userId || null,
        metadata: {
          deploymentId: `deploy-${Date.now()}`,
          environment,
          domain: envConfig.domain,
          provider: deploymentProvider,
          timestamp: new Date().toISOString(),
          contentCount: publishedContent.length,
          features: envConfig.features,
        }
      }
    });

    // TODO: Integrate with actual deployment service
    // This would call the appropriate deployment API (Vercel, Netlify, etc.)
    const deploymentUrl = `https://${envConfig.domain}`;
    
    // Update tenant with deployment info
    const currentSettings = (tenant.settings as any) || {};
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        settings: {
          ...currentSettings,
          environments: {
            ...currentSettings.environments,
            [environment]: {
              ...envConfig,
              lastDeployment: {
                id: deployment.id,
                url: deploymentUrl,
                deployedAt: new Date().toISOString(),
                deployedBy: tenantContext.userId,
                status: 'pending',
                provider: deploymentProvider,
              }
            }
          }
        }
      }
    });

    // Create audit log
    await createAuditLog(
      tenantContext,
      'DEPLOY',
      'deployment',
      deployment.id,
      {
        environment,
        domain: envConfig.domain,
        provider: deploymentProvider,
        contentCount: publishedContent.length,
      }
    );

    return NextResponse.json({
      message: 'Deployment initiated successfully',
      deployment: {
        id: deployment.id,
        environment,
        url: deploymentUrl,
        status: 'pending',
        estimatedTime: '5-10 minutes',
        provider: deploymentProvider,
        config: {
          domain: envConfig.domain,
          subdomain: envConfig.subdomain,
          features: envConfig.features,
          contentItems: publishedContent.length,
          environmentVariables: Object.keys(envConfig.environmentVariables).length,
        }
      }
    });

  } catch (error) {
    console.error('Error initiating deployment:', error);
    return NextResponse.json(
      { error: 'Failed to initiate deployment' },
      { status: 500 }
    );
  }
});

// GET /api/admin/deploy - Get deployment status and history
export const GET = withTenantIsolation(async (tenantContext, request: NextRequest) => {
  try {
    // Check permissions
    if (tenantContext.userContext && !hasPermission(
      tenantContext.userContext, 
      RESOURCES.DEPLOYMENT, 
      ACTIONS.READ
    )) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('deploymentId');
    const environment = searchParams.get('environment');

    if (deploymentId) {
      // Get specific deployment
      const deployment = await prisma.tenantContent.findFirst({
        where: {
          id: deploymentId,
          tenantId: tenantContext.tenantId,
          contentType: 'deployment',
        },
        include: {
          author: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!deployment) {
        return NextResponse.json(
          { error: 'Deployment not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        deployment: {
          id: deployment.id,
          status: deployment.status,
          config: deployment.content,
          metadata: deployment.metadata,
          author: deployment.author,
          createdAt: deployment.createdAt,
          updatedAt: deployment.updatedAt,
        }
      });
    } else {
      // Get deployments for tenant (optionally filtered by environment)
      const where = {
        tenantId: tenantContext.tenantId,
        contentType: 'deployment',
        ...(environment && {
          metadata: {
            path: ['environment'],
            equals: environment
          }
        })
      };

      const [deployments, total] = await Promise.all([
        prisma.tenantContent.findMany({
          where,
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
            author: {
              select: { id: true, name: true, email: true }
            }
          }
        }),
        prisma.tenantContent.count({ where })
      ]);

      // Get current environment configurations from tenant settings
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantContext.tenantId },
        select: { settings: true }
      });

      const environmentConfigs = (tenant?.settings as any)?.environments || {};

      return NextResponse.json({
        deployments: deployments.map((d: any) => ({
          id: d.id,
          environment: d.metadata?.environment,
          domain: d.metadata?.domain,
          provider: d.metadata?.provider,
          status: d.status,
          deployedAt: d.createdAt,
          updatedAt: d.updatedAt,
          author: d.author,
          contentCount: d.metadata?.contentCount || 0,
          features: d.metadata?.features || [],
        })),
        total,
        environments: environmentConfigs,
      });
    }
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deployments' },
      { status: 500 }
    );
  }
});

// PUT /api/admin/deploy/:id - Update deployment status
export const PUT = withTenantIsolation(async (tenantContext, request: NextRequest) => {
  try {
    // Check permissions
    if (tenantContext.userContext && !hasPermission(
      tenantContext.userContext, 
      RESOURCES.DEPLOYMENT, 
      ACTIONS.UPDATE
    )) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { deploymentId, status, url, error } = body;

    if (!deploymentId || !status) {
      return NextResponse.json(
        { error: 'Deployment ID and status are required' },
        { status: 400 }
      );
    }

    // Update deployment record
    const deployment = await prisma.tenantContent.update({
      where: {
        id: deploymentId,
        tenantId: tenantContext.tenantId,
        contentType: 'deployment',
      },
      data: {
        status,
        metadata: {
          ...(await prisma.tenantContent.findUnique({
            where: { id: deploymentId },
            select: { metadata: true }
          }))?.metadata as any,
          ...(url && { deploymentUrl: url }),
          ...(error && { error }),
          updatedAt: new Date().toISOString(),
        }
      }
    });

    // Create audit log
    await createAuditLog(
      tenantContext,
      'UPDATE',
      'deployment',
      deploymentId,
      { status, url, error }
    );

    return NextResponse.json({
      message: 'Deployment status updated',
      deployment: {
        id: deployment.id,
        status: deployment.status,
        metadata: deployment.metadata,
      }
    });

  } catch (error) {
    console.error('Error updating deployment:', error);
    return NextResponse.json(
      { error: 'Failed to update deployment' },
      { status: 500 }
    );
  }
}); 