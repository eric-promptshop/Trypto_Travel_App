# Environment Variable Setup Guide

## Critical Production Variables

The application requires the following environment variables to function properly:

### 1. OpenAI API Key (Required for AI Features)
```
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_API_KEY_HERE
```
- Get your API key from: https://platform.openai.com/api-keys
- Without this key, the app will use a basic fallback itinerary generator

### 2. Supabase Configuration (Required)
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### 3. NextAuth Configuration (Required)
```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-here
```
- Generate secret with: `openssl rand -base64 32`

### 4. Optional Services
```
# Google Places API (for location enrichment)
GOOGLE_PLACES_API_KEY=your-google-places-key

# Unsplash (for better images)
UNSPLASH_ACCESS_KEY=your-unsplash-key

# Cloudinary (for image optimization)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Setting Variables in Vercel

1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add each variable with its production value
4. Ensure they're set for the "Production" environment

## Quick Test

After deployment, test the itinerary generation:
1. Go to your app homepage
2. Enter "7 days in Paris" in the search box
3. Click "Start Planning"
4. The app should generate an itinerary (AI-powered if OpenAI key is set, fallback otherwise)

## Troubleshooting

If itinerary generation fails:
1. Check Vercel Functions logs for errors
2. Verify OpenAI API key is valid
3. Ensure Supabase is properly configured
4. Check browser console for 500 errors

The app will work without OpenAI API key but will provide basic itineraries only.