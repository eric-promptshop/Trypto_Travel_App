# White-Label Implementation Guide

## Overview

This document provides comprehensive guidance for implementing and managing white-label deployments of the Travel Itinerary Builder platform. The white-label system allows travel companies to deploy customized instances with their own branding, domain, and feature sets.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Getting Started](#getting-started)
3. [Theme Customization](#theme-customization)
4. [Content Management](#content-management)
5. [Domain Configuration](#domain-configuration)
6. [Deployment Pipeline](#deployment-pipeline)
7. [Role-Based Access Control](#role-based-access-control)
8. [Environment Management](#environment-management)
9. [Monitoring and Analytics](#monitoring-and-analytics)
10. [Troubleshooting](#troubleshooting)

## Architecture Overview

The white-label system is built on a multi-tenant architecture with the following key components:

### Core Components

- **Tenant Isolation**: Database-level and application-level isolation
- **Theme System**: Dynamic CSS generation and component theming
- **Content Management**: Tenant-specific content repositories
- **Domain Routing**: Custom domain and subdomain support
- **Deployment Pipeline**: Automated deployment to various platforms
- **Asset Management**: Tenant-specific asset storage and delivery

### Data Flow

```
Custom Domain → Middleware → Tenant Resolution → Theme Application → Content Delivery
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Supabase project (or compatible PostgreSQL setup)
- Deployment platform account (Vercel, Netlify, etc.)

### Initial Setup

1. **Create a New Tenant**

```bash
# Using the provided script
npx ts-node scripts/initialize-tenant.ts "Company Name" "company.com"
```

2. **Access Admin Dashboard**

Navigate to `/admin/white-label` to access the white-label management interface.

3. **Configure Basic Settings**

- Set company name and slug
- Upload logo and branding assets
- Configure initial theme colors

## Theme Customization

### Theme Configuration

The theme system supports comprehensive customization through a structured configuration object:

```typescript
interface ThemeConfiguration {
  colors: {
    primary: ColorPalette;
    secondary: ColorPalette;
    accent: ColorPalette;
  };
  typography: {
    fontFamilies: {
      heading: string;
      body: string;
      mono: string;
    };
    fontSizes: Record<string, string>;
    fontWeights: Record<string, string>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  animations: Record<string, string>;
}
```

### Available Preset Themes

1. **Trypto Default**: Original blue/orange branding
2. **Modern Minimalist**: Clean design with sky blue/green
3. **Classic Professional**: Traditional styling with serif fonts
4. **Ultra Minimal**: Monochromatic with maximum whitespace
5. **Vibrant Creative**: Bold purple/pink for creative industries
6. **Professional Corporate**: Conservative blue tones for business

### Custom Theme Creation

1. **Using the Theme Editor**
   - Access `/admin/white-label` dashboard
   - Use the visual theme editor to customize colors, fonts, and spacing
   - Preview changes in real-time

2. **Programmatic Theme Creation**

```typescript
import { createThemeOverride } from '@/lib/themes/theme-utils';

const customTheme = createThemeOverride(baseTheme, {
  colors: {
    primary: {
      50: '#f0f9ff',
      500: '#3b82f6',
      900: '#1e3a8a'
    }
  }
});
```

### CSS Custom Properties

Themes are implemented using CSS custom properties for runtime switching:

```css
:root {
  --color-primary-500: #3b82f6;
  --color-secondary-500: #10b981;
  --font-family-heading: 'Inter', sans-serif;
}
```

## Content Management

### Content Types

The system supports several content types:

- **Page**: Full page content with layouts
- **Component**: Reusable UI components
- **Media**: Images, videos, and other assets
- **Template**: Page templates for itineraries
- **Config**: Configuration data

### Content Workflow

1. **Create Content**
   ```typescript
   const content = await fetch('/api/v1/content', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'x-tenant-slug': tenantId,
     },
     body: JSON.stringify({
       title: 'Welcome Page',
       contentType: 'page',
       content: { /* page data */ },
       status: 'draft'
     })
   });
   ```

2. **Edit and Preview**
   - Use the content editor interface
   - Preview changes before publishing
   - Manage content versions

3. **Publish Content**
   - Change status from 'draft' to 'published'
   - Content becomes available for deployment

### Content API Endpoints

- `GET /api/v1/content` - List tenant content
- `POST /api/v1/content` - Create new content
- `PUT /api/v1/content/:id` - Update content
- `DELETE /api/v1/content/:id` - Delete content

## Domain Configuration

### Custom Domain Setup

1. **Configure Domain in Dashboard**
   ```typescript
   await fetch('/api/v1/domains', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'x-tenant-slug': tenantId,
     },
     body: JSON.stringify({
       customDomain: 'travel.yourcompany.com',
       aliases: ['www.travel.yourcompany.com']
     })
   });
   ```

2. **DNS Configuration**
   - Add CNAME record pointing to deployment platform
   - Configure SSL certificate
   - Verify domain ownership

3. **Domain Verification**
   - The system will validate domain ownership
   - Status updates are tracked in tenant settings

### Subdomain Access

Tenants can also be accessed via subdomains:
- Format: `https://tenant-slug.yourdomain.com`
- Automatic tenant resolution
- No additional DNS configuration required

## Deployment Pipeline

### Deployment Process

1. **Prepare Deployment**
   ```typescript
   const deployment = await fetch('/api/v1/deploy', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'x-tenant-slug': tenantId,
     },
     body: JSON.stringify({
       environment: 'production',
       customDomain: 'travel.company.com',
       features: ['advanced-analytics', 'custom-branding'],
       deploymentProvider: 'vercel'
     })
   });
   ```

2. **Deployment Stages**
   - Content compilation
   - Theme application
   - Asset optimization
   - Environment configuration
   - Platform deployment

3. **Deployment Status**
   - Track deployment progress
   - Monitor for errors
   - Receive completion notifications

### Supported Platforms

- **Vercel**: Recommended for Next.js deployments
- **Netlify**: Alternative static site hosting
- **AWS S3/CloudFront**: Enterprise deployments
- **Custom**: API for custom deployment targets

### Environment Management

#### Development Environment
- Subdomain access: `tenant-slug.dev.domain.com`
- Debug features enabled
- Hot reloading for theme changes

#### Staging Environment
- Production-like environment for testing
- Client preview and approval
- Performance testing

#### Production Environment
- Custom domain access
- Optimized assets and caching
- Monitoring and analytics

## Role-Based Access Control

### Available Roles

1. **Tenant Admin**
   - Full access within tenant scope
   - User management
   - Theme and content management
   - Deployment control

2. **Content Manager**
   - Content creation and editing
   - Basic deployment access
   - Analytics viewing

3. **Content Editor**
   - Content creation and editing
   - Limited to own content

4. **Viewer**
   - Read-only access to content
   - Analytics viewing

### Managing User Roles

1. **Assign Roles**
   ```typescript
   await fetch('/api/v1/roles/assign', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'x-tenant-slug': tenantId,
     },
     body: JSON.stringify({
       userId: 'user-id',
       roleId: 'content_manager'
     })
   });
   ```

2. **Role Permissions**
   - Permissions are checked at API level
   - UI components adapt based on user roles
   - Audit logging for all role changes

## Monitoring and Analytics

### Deployment Monitoring

- Real-time deployment status
- Error tracking and alerts
- Performance metrics
- Uptime monitoring

### Usage Analytics

- Content engagement metrics
- User behavior tracking
- Feature usage statistics
- Performance insights

### Audit Logging

All administrative actions are logged:
- User role changes
- Content modifications
- Theme updates
- Deployment activities

## Troubleshooting

### Common Issues

#### 1. Domain Not Resolving
**Symptoms**: Custom domain returns 404 or connection errors
**Solutions**:
- Verify DNS CNAME record configuration
- Check domain verification status
- Ensure SSL certificate is valid
- Review deployment platform settings

#### 2. Theme Not Applying
**Symptoms**: Custom theme colors/fonts not showing
**Solutions**:
- Clear browser cache
- Verify theme configuration is valid
- Check CSS custom property generation
- Ensure theme is published and deployed

#### 3. Content Not Displaying
**Symptoms**: Published content not visible on deployed site
**Solutions**:
- Verify content status is 'published'
- Check deployment includes latest content
- Review content permissions
- Validate content structure

#### 4. Deployment Failures
**Symptoms**: Deployment process fails or hangs
**Solutions**:
- Check deployment logs
- Verify environment configuration
- Ensure all required assets are available
- Review platform-specific limits

### Debug Mode

Enable debug mode for additional logging:
```typescript
// Set in environment variables
DEBUG_WHITE_LABEL=true
DEBUG_TENANT_ROUTING=true
```

### Support Contacts

For technical issues:
- Email: support@yourcompany.com
- Documentation: /docs/white-label
- Status Page: status.yourcompany.com

## API Reference

### Authentication

All API requests require tenant identification:
```typescript
headers: {
  'x-tenant-slug': 'tenant-slug-here',
  'Authorization': 'Bearer your-auth-token'
}
```

### Rate Limits

- Content API: 100 requests/minute
- Deployment API: 10 requests/hour
- Domain API: 20 requests/hour

### Error Handling

Standard HTTP status codes are used:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

### Webhooks

Configure webhooks for deployment status updates:
```typescript
{
  "event": "deployment.completed",
  "data": {
    "deploymentId": "deploy-123",
    "status": "success",
    "url": "https://tenant.domain.com"
  }
}
```

## Best Practices

### Performance Optimization

1. **Asset Optimization**
   - Use optimized image formats (WebP, AVIF)
   - Implement lazy loading
   - Configure CDN caching

2. **Theme Performance**
   - Minimize CSS custom property usage
   - Use CSS-in-JS for dynamic theming
   - Implement theme caching

3. **Content Delivery**
   - Use edge caching for static content
   - Implement service worker for offline access
   - Optimize for Core Web Vitals

### Security Considerations

1. **Tenant Isolation**
   - Never expose tenant data across boundaries
   - Validate all tenant context
   - Use row-level security in database

2. **Content Security**
   - Sanitize user-generated content
   - Implement CSP headers
   - Validate file uploads

3. **Access Control**
   - Regularly audit user permissions
   - Implement session timeouts
   - Log all administrative actions

### Maintenance

1. **Regular Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Test deployments regularly

2. **Backup Strategy**
   - Daily database backups
   - Asset backup to multiple locations
   - Configuration backup

3. **Monitoring**
   - Set up uptime monitoring
   - Configure error alerting
   - Track performance metrics

## Conclusion

The white-label system provides a comprehensive solution for deploying customized travel platforms. By following this guide, you can successfully implement and manage white-label instances that meet your clients' specific needs while maintaining security, performance, and scalability.

For additional support or custom requirements, please contact our technical team.