import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Deployment configuration schema
const DeploymentSchema = z.object({
  tenantId: z.string(),
  deploymentType: z.enum(['subdomain', 'custom-domain', 'path-based']),
  domain: z.string().optional(),
  subdomain: z.string().optional(),
  environment: z.enum(['staging', 'production']).default('staging'),
  features: z.array(z.string()).default([]),
  theme: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    logo: z.string().optional(),
    brandName: z.string().optional(),
  }).optional(),
  settings: z.record(z.any()).optional()
})

/**
 * Deploy a white-label instance for a tenant
 * POST /api/admin/deploy
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const deploymentConfig = DeploymentSchema.parse(body)
    
    console.log(`🚀 Starting deployment for tenant: ${deploymentConfig.tenantId}`)
    
    // Get tenant information
    const tenant = await prisma.tenant.findUnique({
      where: { id: deploymentConfig.tenantId },
      include: {
        users: true,
        leads: true
      }
    })
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    // Prepare deployment settings
    const deploymentSettings = {
      deployment: {
        type: deploymentConfig.deploymentType,
        domain: deploymentConfig.domain,
        subdomain: deploymentConfig.subdomain,
        environment: deploymentConfig.environment,
        features: deploymentConfig.features,
        deployedAt: new Date().toISOString(),
        status: 'deploying'
      },
      theme: deploymentConfig.theme || getDefaultThemeForTenant(tenant.slug),
      ...deploymentConfig.settings
    }
    
    // Update tenant with deployment configuration
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        domain: deploymentConfig.domain || tenant.domain,
        settings: {
          ...tenant.settings as any,
          ...deploymentSettings
        }
      }
    })
    
    // Create deployment record
    const deploymentRecord = await createDeploymentRecord(updatedTenant, deploymentConfig)
    
    // Execute deployment based on type
    let deploymentResult
    switch (deploymentConfig.deploymentType) {
      case 'subdomain':
        deploymentResult = await deploySubdomain(updatedTenant, deploymentConfig)
        break
      case 'custom-domain':
        deploymentResult = await deployCustomDomain(updatedTenant, deploymentConfig)
        break
      case 'path-based':
        deploymentResult = await deployPathBased(updatedTenant, deploymentConfig)
        break
      default:
        throw new Error(`Unsupported deployment type: ${deploymentConfig.deploymentType}`)
    }
    
    // Update deployment status
    await updateDeploymentStatus(deploymentRecord.id, 'deployed', deploymentResult)
    
    console.log(`✅ Deployment completed for tenant: ${tenant.name}`)
    
    return NextResponse.json({
      success: true,
      deployment: {
        id: deploymentRecord.id,
        tenant: updatedTenant.name,
        type: deploymentConfig.deploymentType,
        url: deploymentResult.url,
        status: 'deployed',
        features: deploymentConfig.features,
        environment: deploymentConfig.environment
      }
    })
    
  } catch (error) {
    console.error('❌ Deployment error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid deployment configuration', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Deployment failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Get deployment status for a tenant
 * GET /api/admin/deploy?tenantId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    // Get tenant with deployment info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        content: {
          where: { contentType: 'deployment' },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    const deploymentSettings = tenant.settings as any
    const deploymentInfo = deploymentSettings?.deployment || null
    
    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        isActive: tenant.isActive
      },
      deployment: deploymentInfo,
      deployments: tenant.content.map((d: any) => ({
        id: d.id,
        status: d.status,
        createdAt: d.createdAt,
        metadata: d.metadata
      }))
    })
    
  } catch (error) {
    console.error('❌ Error fetching deployment status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deployment status' },
      { status: 500 }
    )
  }
}

// Helper Functions

function getDefaultThemeForTenant(slug: string) {
  const themes: Record<string, any> = {
    'adventure-tours': {
      primaryColor: '#059669',
      secondaryColor: '#10b981',
      accentColor: '#f59e0b',
      backgroundColor: '#ecfdf5',
      brandName: 'Adventure Tours Co'
    },
    'luxury-escapes': {
      primaryColor: '#7c3aed',
      secondaryColor: '#a855f7',
      accentColor: '#fbbf24',
      backgroundColor: '#faf5ff',
      brandName: 'Luxury Escapes'
    },
    'budget-backpackers': {
      primaryColor: '#dc2626',
      secondaryColor: '#ef4444',
      accentColor: '#f97316',
      backgroundColor: '#fef2f2',
      brandName: 'Budget Backpackers'
    }
  }
  
  return themes[slug] || {
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff'
  }
}

async function createDeploymentRecord(tenant: any, config: any) {
  return await prisma.tenantContent.create({
    data: {
      contentType: 'deployment',
      title: `Deployment - ${config.deploymentType}`,
      content: {
        type: config.deploymentType,
        domain: config.domain,
        subdomain: config.subdomain,
        environment: config.environment,
        features: config.features,
        startedAt: new Date().toISOString()
      },
      status: 'deploying',
      tenantId: tenant.id,
      metadata: {
        deploymentId: `deploy_${Date.now()}`,
        tenantSlug: tenant.slug
      }
    }
  })
}

async function updateDeploymentStatus(deploymentId: string, status: string, result: any) {
  await prisma.tenantContent.update({
    where: { id: deploymentId },
    data: {
      status,
      content: {
        ...result,
        completedAt: new Date().toISOString()
      }
    }
  })
}

async function deploySubdomain(tenant: any, config: any) {
  console.log(`🌐 Deploying subdomain: ${config.subdomain}`)
  
  // In a real deployment, this would:
  // 1. Configure DNS records
  // 2. Set up SSL certificates
  // 3. Configure load balancer/CDN
  // 4. Deploy application code
  
  // For demo purposes, we'll simulate this
  const subdomainUrl = `https://${config.subdomain}.yourdomain.com`
  
  return {
    type: 'subdomain',
    url: subdomainUrl,
    subdomain: config.subdomain,
    ssl: true,
    cdn: true,
    status: 'active'
  }
}

async function deployCustomDomain(tenant: any, config: any) {
  console.log(`🌐 Deploying custom domain: ${config.domain}`)
  
  // In a real deployment, this would:
  // 1. Verify domain ownership
  // 2. Configure DNS
  // 3. Set up SSL certificates
  // 4. Configure reverse proxy
  
  return {
    type: 'custom-domain',
    url: `https://${config.domain}`,
    domain: config.domain,
    ssl: true,
    verified: true,
    status: 'active'
  }
}

async function deployPathBased(tenant: any, config: any) {
  console.log(`🌐 Deploying path-based: /client/${tenant.slug}`)
  
  // Path-based deployment is immediate since it's handled by middleware
  const pathUrl = `https://yourdomain.com/client/${tenant.slug}`
  
  return {
    type: 'path-based',
    url: pathUrl,
    path: `/client/${tenant.slug}`,
    status: 'active'
  }
} 