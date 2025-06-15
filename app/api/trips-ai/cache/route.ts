import { NextRequest, NextResponse } from 'next/server'
import { getCacheStats, clearCache } from '@/lib/ai/enhanced-itinerary-generator-optimized'

export async function GET(request: NextRequest) {
  try {
    const stats = getCacheStats()
    return NextResponse.json({
      success: true,
      cache: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get cache stats'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    clearCache()
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to clear cache'
    }, { status: 500 })
  }
}