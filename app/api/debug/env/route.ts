import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Only allow in development or with a secret key
  const secretKey = request.nextUrl.searchParams.get('key')
  if (process.env.NODE_ENV === 'production' && secretKey !== 'debug-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const envStatus = {
    environment: process.env.NODE_ENV,
    hasMapboxToken: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    mapboxTokenLength: process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.length || 0,
    mapboxTokenPrefix: process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.substring(0, 10) || 'not-set',
    hasUnsplashKey: !!process.env.UNSPLASH_ACCESS_KEY,
    hasCloudinaryName: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  }

  return NextResponse.json(envStatus)
}