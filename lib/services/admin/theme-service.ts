import { prisma } from '@/lib/prisma'
import { ThemeConfiguration } from '@/types/theme'

export interface ThemePreviewOptions {
  tenantId: string
  themeId: string
  temporaryOverrides?: Partial<ThemeConfiguration>
}

export interface ThemeDeploymentOptions {
  tenantId: string
  themeId: string
  deployToProduction?: boolean
}

export class ThemeService {
  /**
   * Apply a theme to a tenant
   */
  static async applyThemeToTenant(tenantId: string, themeId: string) {
    // Get the theme
    const theme = await prisma.tenantContent.findFirst({
      where: {
        id: themeId,
        contentType: 'theme',
        OR: [
          { tenantId: tenantId },
          { tenantId: 'default' },
          { category: 'default' }
        ]
      }
    })

    if (!theme) {
      throw new Error('Theme not found or access denied')
    }

    // Update tenant settings with the new theme
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) {
      throw new Error('Tenant not found')
    }

    const currentSettings = (tenant.settings as any) || {}
    const themeContent = theme.content as any

    const updatedSettings = {
      ...currentSettings,
      theme: {
        id: theme.id,
        name: theme.title,
        ...themeContent
      }
    }

    // Update tenant with new theme
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: updatedSettings
      }
    })

    return {
      success: true,
      theme: {
        id: theme.id,
        name: theme.title,
        ...themeContent
      }
    }
  }

  /**
   * Preview a theme without applying it
   */
  static async previewTheme(options: ThemePreviewOptions) {
    const { tenantId, themeId, temporaryOverrides } = options

    // Get the theme
    const theme = await prisma.tenantContent.findFirst({
      where: {
        id: themeId,
        contentType: 'theme',
        OR: [
          { tenantId: tenantId },
          { tenantId: 'default' },
          { category: 'default' }
        ]
      }
    })

    if (!theme) {
      throw new Error('Theme not found or access denied')
    }

    const themeContent = theme.content as any

    // Merge with temporary overrides if provided
    const previewTheme = temporaryOverrides 
      ? this.mergeThemeConfigurations(themeContent, temporaryOverrides)
      : themeContent

    return {
      id: theme.id,
      name: theme.title,
      isPreview: true,
      ...previewTheme
    }
  }

  /**
   * Deploy a theme (mark as production-ready)
   */
  static async deployTheme(options: ThemeDeploymentOptions) {
    const { tenantId, themeId, deployToProduction = false } = options

    // Get the theme
    const theme = await prisma.tenantContent.findFirst({
      where: {
        id: themeId,
        contentType: 'theme',
        tenantId: tenantId
      }
    })

    if (!theme) {
      throw new Error('Theme not found or access denied')
    }

    // Update theme metadata
    const currentMetadata = (theme.metadata as any) || {}
    const updatedMetadata = {
      ...currentMetadata,
      lastDeployedAt: new Date().toISOString(),
      deployedToProduction: deployToProduction,
      version: this.incrementVersion(currentMetadata.version || '1.0.0')
    }

    // Update theme status and metadata
    await prisma.tenantContent.update({
      where: { id: themeId },
      data: {
        status: 'published',
        metadata: updatedMetadata
      }
    })

    // If deploying to production, apply to tenant
    if (deployToProduction) {
      await this.applyThemeToTenant(tenantId, themeId)
    }

    return {
      success: true,
      deploymentInfo: {
        themeId,
        version: updatedMetadata.version,
        deployedAt: updatedMetadata.lastDeployedAt,
        isProduction: deployToProduction
      }
    }
  }

  /**
   * Duplicate a theme
   */
  static async duplicateTheme(themeId: string, newName: string, targetTenantId: string, userId: string) {
    // Get the original theme
    const originalTheme = await prisma.tenantContent.findFirst({
      where: {
        id: themeId,
        contentType: 'theme'
      }
    })

    if (!originalTheme) {
      throw new Error('Theme not found')
    }

    // Create a copy
    const duplicatedTheme = await prisma.tenantContent.create({
      data: {
        contentType: 'theme',
        title: newName,
        content: originalTheme.content,
        status: 'draft',
        category: 'custom',
        tenantId: targetTenantId,
        authorId: userId,
        metadata: {
          version: '1.0.0',
          duplicatedFrom: themeId,
          duplicatedAt: new Date().toISOString()
        }
      }
    })

    return duplicatedTheme
  }

  /**
   * Get theme usage statistics
   */
  static async getThemeUsageStats(themeId: string) {
    // Count tenants using this theme
    const tenantsUsingTheme = await prisma.tenant.count({
      where: {
        settings: {
          path: ['theme', 'id'],
          equals: themeId
        }
      }
    })

    // Get theme details
    const theme = await prisma.tenantContent.findUnique({
      where: { id: themeId }
    })

    if (!theme) {
      throw new Error('Theme not found')
    }

    const metadata = (theme.metadata as any) || {}

    return {
      themeId,
      themeName: theme.title,
      usageCount: tenantsUsingTheme,
      createdAt: theme.createdAt,
      lastModified: theme.updatedAt,
      lastDeployed: metadata.lastDeployedAt || null,
      version: metadata.version || '1.0.0',
      status: theme.status
    }
  }

  /**
   * Validate theme configuration
   */
  static validateThemeConfiguration(themeConfig: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check required fields
    if (!themeConfig.colors) {
      errors.push('Theme colors are required')
    } else {
      const requiredColors = ['primary', 'secondary', 'accent', 'neutral']
      for (const colorName of requiredColors) {
        if (!themeConfig.colors[colorName]) {
          errors.push(`Missing required color palette: ${colorName}`)
        }
      }
    }

    if (!themeConfig.fonts) {
      errors.push('Theme fonts are required')
    } else {
      if (!themeConfig.fonts.heading) errors.push('Heading font is required')
      if (!themeConfig.fonts.body) errors.push('Body font is required')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Helper: Merge theme configurations
   */
  private static mergeThemeConfigurations(
    base: ThemeConfiguration, 
    overrides: Partial<ThemeConfiguration>
  ): ThemeConfiguration {
    return {
      ...base,
      ...overrides,
      colors: {
        ...base.colors,
        ...(overrides.colors || {})
      },
      fonts: {
        ...base.fonts,
        ...(overrides.fonts || {})
      },
      spacing: overrides.spacing || base.spacing,
      borderRadius: overrides.borderRadius || base.borderRadius,
      shadows: overrides.shadows || base.shadows,
    }
  }

  /**
   * Helper: Increment version number
   */
  private static incrementVersion(version: string): string {
    const parts = version.split('.')
    const patch = parseInt(parts[2] || '0') + 1
    return `${parts[0]}.${parts[1]}.${patch}`
  }
}