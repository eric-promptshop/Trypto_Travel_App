# Vercel Environment Variables Setup

<!-- Last updated: 2024-12-17 - DATABASE_URL configured -->

## Required Environment Variables

### Database Connection (Supabase)
```
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?pgbouncer=true&connection_limit=1
```

For Supabase, the format is typically:
```
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true
```

**Important**: Make sure to use the **Pooling** connection string from Supabase (not the direct connection) for serverless environments like Vercel.

### Steps to Fix Database Connection:

1. Go to your Supabase project dashboard
2. Navigate to Settings → Database
3. Copy the "Connection string" from the **Connection Pooling** section
4. Make sure "Pool Mode" is set to "Transaction"
5. Add this to Vercel:
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Add `DATABASE_URL` with the connection string
   - Deploy again

### Other Required Variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Your Mapbox token for maps
- `NEXTAUTH_SECRET` - Random secret for NextAuth
- `NEXTAUTH_URL` - Your production URL (e.g., https://your-app.vercel.app)

### Optional Variables:
- `UNSPLASH_ACCESS_KEY` - For better image quality
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - For image optimization