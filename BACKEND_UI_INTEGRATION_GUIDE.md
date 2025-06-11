# Backend UI Integration Guide

This guide ensures your backend infrastructure fully supports the updated Vercel UI designs.

## ✅ Backend Infrastructure Status

### 1. **Database Schema** - Ready ✅
- **User Model**: Enhanced with `isActive` field
- **Tenant Model**: Supports multi-tenancy with settings JSON
- **AuditLog Model**: Added for tracking changes
- **Relations**: Properly configured for all models

### 2. **API Endpoints** - Ready ✅

#### Admin Client Management APIs
- `GET /api/admin/clients` - List clients with pagination
- `POST /api/admin/clients` - Create new client
- `GET /api/admin/clients/[id]` - Get single client
- `PUT /api/admin/clients/[id]` - Update client
- `DELETE /api/admin/clients/[id]` - Delete client

#### Additional Admin APIs
- `/api/v1/roles/*` - Role management
- `/api/v1/content/*` - Content management
- `/api/v1/domains` - Domain management
- `/api/admin/deploy` - Deployment operations

### 3. **Authentication & Authorization** - Ready ✅
- NextAuth configured with session management
- Role-based access control (RBAC) implemented
- Admin role checking enabled in all admin endpoints
- Support for: SUPER_ADMIN, ADMIN, USER, TRAVELER, AGENT roles

### 4. **Multi-Tenant Architecture** - Ready ✅
- Tenant isolation at database level
- Tenant-aware middleware configured
- Dynamic theme and branding per tenant
- Tenant-specific data isolation

## 🚀 Quick Start Guide

### Step 1: Apply Database Migrations

```bash
# Generate Prisma client with new schema
npm run db:generate

# Push schema changes to database
npm run db:push

# Or create a migration (for production)
npm run db:migrate
```

### Step 2: Seed Admin Data

```bash
# Run the admin data seeding script
npm run db:seed-admin

# This creates:
# - Default tenant
# - Super Admin user (admin@example.com / admin123456)
# - 3 sample tenants with different plans
# - Admin users for each tenant
# - Sample users, content, and leads
# - Audit log entries
```

### Step 3: Test the Admin Panel

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Access the admin panel:
   ```
   http://localhost:3000/admin
   ```

3. Login with admin credentials:
   - Email: `admin@example.com`
   - Password: `admin123456`

## 📊 Data Structure Overview

### Client/Tenant Data Structure
```typescript
{
  id: string
  name: string
  domain: string
  isActive: boolean
  contactEmail: string
  companyLogo?: string
  theme: {
    id: string
    name: string
    colors: {
      primary: string
      secondary: string
      accent: string
      background: string
      foreground: string
    }
    fonts: {
      heading: string
      body: string
    }
  }
  features: {
    enabledFeatures: string[]
    customFeatures: Record<string, boolean>
  }
  billing: {
    plan: 'starter' | 'professional' | 'enterprise'
    status: 'active' | 'suspended' | 'trial'
  }
  stats: {
    userCount: number
    contentCount: number
    leadCount?: number
    itineraryCount?: number
  }
}
```

## 🔒 Security Features

1. **Authentication Required**: All admin endpoints require authentication
2. **Role-Based Access**: Only ADMIN and SUPER_ADMIN can access admin APIs
3. **Tenant Isolation**: Data is automatically filtered by tenant
4. **Audit Logging**: All admin actions are logged
5. **Input Validation**: Zod schemas validate all inputs

## 🧪 Testing the Integration

### 1. Test Client Management
```bash
# Get list of clients
curl -X GET http://localhost:3000/api/admin/clients \
  -H "Cookie: [your-session-cookie]"

# Create a new client
curl -X POST http://localhost:3000/api/admin/clients \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-session-cookie]" \
  -d '{
    "name": "Test Agency",
    "domain": "test.example.com",
    "contactEmail": "test@example.com",
    "isActive": true,
    "theme": {...},
    "features": {...},
    "billing": {...}
  }'
```

### 2. Test Authentication
- Try accessing admin APIs without authentication (should fail)
- Try accessing with non-admin user (should fail)
- Try accessing with admin user (should succeed)

### 3. Test Multi-Tenancy
- Create content for one tenant
- Verify it's not visible to other tenants
- Test tenant-specific themes

## 🛠️ Troubleshooting

### Common Issues

1. **"Forbidden - Admin access required"**
   - Ensure user has ADMIN or SUPER_ADMIN role
   - Check session is valid

2. **Database errors**
   - Run `npm run db:push` to sync schema
   - Check DATABASE_URL is correct

3. **Missing data**
   - Run `npm run db:seed-admin` to create sample data
   - Check Prisma Studio: `npm run db:studio`

### Debug Commands

```bash
# View database content
npm run db:studio

# Check current schema
npx prisma db pull

# Reset database (WARNING: deletes all data)
npm run db:reset
```

## 📝 Environment Variables

Ensure these are set in `.env.local`:

```env
# Database
DATABASE_URL=postgresql://...

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Admin credentials (for seeding)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456
```

## 🚦 Health Check

Run this command to verify everything is working:

```bash
# Check API health
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "...",
  "services": {
    "database": "connected",
    "auth": "configured",
    "features": {
      "multiTenant": true,
      "adminPanel": true
    }
  }
}
```

## 📚 Next Steps

1. **Customize Themes**: Edit theme presets in the admin panel
2. **Add Features**: Enable/disable features per tenant
3. **Monitor Activity**: Check audit logs for all admin actions
4. **Scale Up**: Add more tenants and users as needed

## 🔗 Related Documentation

- [API Reference](./docs/API_REFERENCE.md)
- [White Label Implementation](./docs/WHITE_LABEL_IMPLEMENTATION.md)
- [Technical Documentation](./docs/TECHNICAL_DOCUMENTATION.md)
- [Production Checklist](./docs/PRODUCTION_READINESS_CHECKLIST.md)