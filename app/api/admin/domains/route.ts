import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withTenantIsolation } from '@/lib/middleware/tenant';

// GET /api/admin/domains - List tenant domains
export const GET = withTenantIsolation(async (tenantContext, request: NextRequest) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantContext.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        isActive: true,
        settings: true,
      }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Extract domain configuration from tenant settings
    const domainConfig = {
      primary: tenant.domain,
      aliases: (tenant.settings as any)?.domains?.aliases || [],
      customDomain: (tenant.settings as any)?.domains?.customDomain,
      sslEnabled: (tenant.settings as any)?.domains?.sslEnabled || false,
      status: tenant.isActive ? 'active' : 'inactive',
      verificationStatus: (tenant.settings as any)?.domains?.verificationStatus || 'pending',
    };

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      domains: domainConfig,
    });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
});

// POST /api/admin/domains - Configure custom domain
export const POST = withTenantIsolation(async (tenantContext, request: NextRequest) => {
  try {
    const body = await request.json();
    const { customDomain, aliases = [] } = body;

    if (!customDomain) {
      return NextResponse.json(
        { error: 'Custom domain is required' },
        { status: 400 }
      );
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(customDomain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    // Check if domain is already in use
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { domain: customDomain },
          {
            settings: {
              path: ['domains', 'customDomain'],
              equals: customDomain
            }
          }
        ],
        NOT: { id: tenantContext.tenantId }
      }
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Domain is already in use' },
        { status: 409 }
      );
    }

    // Update tenant domain configuration
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: tenantContext.tenantId }
    });

    const currentSettings = (currentTenant?.settings as any) || {};
    const updatedSettings = {
      ...currentSettings,
      domains: {
        ...currentSettings.domains,
        customDomain,
        aliases: Array.isArray(aliases) ? aliases : [],
        verificationStatus: 'pending',
        configuredAt: new Date().toISOString(),
      }
    };

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantContext.tenantId },
      data: {
        settings: updatedSettings,
        domain: customDomain, // Update primary domain
      }
    });

    return NextResponse.json({
      message: 'Domain configuration updated',
      domains: {
        primary: updatedTenant.domain,
        customDomain,
        aliases,
        verificationStatus: 'pending',
      }
    });
  } catch (error) {
    console.error('Error configuring domain:', error);
    return NextResponse.json(
      { error: 'Failed to configure domain' },
      { status: 500 }
    );
  }
}); 