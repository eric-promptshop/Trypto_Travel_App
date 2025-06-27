import { NextResponse } from 'next/server'

/**
 * Health check endpoint to verify the app is running
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    host: process.env.VERCEL_URL || 'localhost',
    version: '1.0.0'
  })
}