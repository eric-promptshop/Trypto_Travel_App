import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'

export async function POST(request: NextRequest) {
  try {
    const metric = await request.json()
    
    // Validate metric structure
    if (!metric.name || typeof metric.value !== 'number' || !metric.unit) {
      return NextResponse.json(
        { error: 'Invalid metric format' },
        { status: 400 }
      )
    }

    // Store metric (in production, you'd send to monitoring service)
    if (process.env.NODE_ENV === 'development') {
    }

    // Send to external monitoring services
    await Promise.allSettled([
      sendToDatadog(metric),
      sendToNewRelic(metric),
      sendToCustomMonitoring(metric)
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Metrics ingestion error:', error)
    return NextResponse.json(
      { error: 'Failed to record metric' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admin users to view metrics
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const summary = performanceMonitor.getPerformanceSummary()
    
    return NextResponse.json({
      performance: summary,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Metrics retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    )
  }
}

async function sendToDatadog(metric: any) {
  if (!process.env.DATADOG_API_KEY) return

  try {
    const datadogData = {
      series: [{
        metric: `travelapp.${metric.name}`,
        points: [[Math.floor(Date.now() / 1000), metric.value]],
        tags: metric.tags ? Object.entries(metric.tags).map(([k, v]) => `${k}:${v}`) : [],
        type: 'gauge'
      }]
    }

    await fetch('https://api.datadoghq.com/api/v1/series', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': process.env.DATADOG_API_KEY
      },
      body: JSON.stringify(datadogData)
    })
  } catch (error) {
    console.error('Datadog metrics error:', error)
  }
}

async function sendToNewRelic(metric: any) {
  if (!process.env.NEW_RELIC_LICENSE_KEY) return

  try {
    const newRelicData = [{
      metrics: [{
        name: `Custom/${metric.name}`,
        value: metric.value,
        timestamp: Date.now(),
        attributes: metric.tags || {}
      }]
    }]

    await fetch('https://metric-api.newrelic.com/metric/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': process.env.NEW_RELIC_LICENSE_KEY
      },
      body: JSON.stringify(newRelicData)
    })
  } catch (error) {
    console.error('New Relic metrics error:', error)
  }
}

async function sendToCustomMonitoring(metric: any) {
  if (!process.env.CUSTOM_METRICS_ENDPOINT) return

  try {
    await fetch(process.env.CUSTOM_METRICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CUSTOM_METRICS_TOKEN}`
      },
      body: JSON.stringify(metric)
    })
  } catch (error) {
    console.error('Custom metrics error:', error)
  }
}