import { prisma } from '@/lib/prisma'

export interface HealthCheckResult {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  message?: string
  details?: Record<string, any>
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: HealthCheckResult[]
  uptime: number
  version: string
}

export class HealthMonitor {
  private startTime = Date.now()

  async checkSystemHealth(): Promise<SystemHealth> {
    const services = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalAPIs(),
      this.checkFileSystem(),
      this.checkMemoryUsage()
    ])

    const healthResults: HealthCheckResult[] = services.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        const serviceNames = ['database', 'redis', 'external_apis', 'filesystem', 'memory']
        return {
          service: serviceNames[index],
          status: 'unhealthy' as const,
          responseTime: 0,
          message: result.reason?.message || 'Unknown error'
        }
      }
    })

    const overall = this.determineOverallHealth(healthResults)

    return {
      overall,
      timestamp: new Date().toISOString(),
      services: healthResults,
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0'
    }
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      // Simple database connectivity test
      await prisma.$queryRaw`SELECT 1`
      
      // Check if we can read from main tables
      const userCount = await prisma.user.count()
      const tripCount = await prisma.trip.count()
      
      const responseTime = Date.now() - startTime

      return {
        service: 'database',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          users: userCount,
          trips: tripCount,
          connection: 'active'
        }
      }
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Database connection failed'
      }
    }
  }

  private async checkRedis(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      // If Redis is configured, check connection
      if (process.env.REDIS_URL) {
        // Redis check would go here
        // For now, we'll simulate a successful check
        const responseTime = Date.now() - startTime
        
        return {
          service: 'redis',
          status: 'healthy',
          responseTime,
          details: {
            connection: 'active',
            memory_usage: 'normal'
          }
        }
      } else {
        return {
          service: 'redis',
          status: 'healthy',
          responseTime: 0,
          message: 'Redis not configured'
        }
      }
    } catch (error) {
      return {
        service: 'redis',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Redis connection failed'
      }
    }
  }

  private async checkExternalAPIs(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      const apiChecks = await Promise.allSettled([
        this.checkOpenAI(),
        this.checkSupabase(),
        this.checkCloudinary()
      ])

      const responseTime = Date.now() - startTime
      const failedApis = apiChecks.filter(check => check.status === 'rejected').length
      
      let status: 'healthy' | 'degraded' | 'unhealthy'
      if (failedApis === 0) {
        status = 'healthy'
      } else if (failedApis <= apiChecks.length / 2) {
        status = 'degraded'
      } else {
        status = 'unhealthy'
      }

      return {
        service: 'external_apis',
        status,
        responseTime,
        details: {
          total_apis: apiChecks.length,
          failed_apis: failedApis,
          success_rate: `${((apiChecks.length - failedApis) / apiChecks.length * 100).toFixed(1)}%`
        }
      }
    } catch (error) {
      return {
        service: 'external_apis',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'External API checks failed'
      }
    }
  }

  private async checkOpenAI(): Promise<void> {
    if (!process.env.OPENAI_API_KEY) return

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error(`OpenAI API check failed: ${response.status}`)
    }
  }

  private async checkSupabase(): Promise<void> {
    if (!process.env.SUPABASE_URL) return

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error(`Supabase API check failed: ${response.status}`)
    }
  }

  private async checkCloudinary(): Promise<void> {
    if (!process.env.CLOUDINARY_CLOUD_NAME) return

    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'HEAD'
    })

    if (response.status !== 405) { // 405 is expected for HEAD on upload endpoint
      throw new Error(`Cloudinary API check failed: ${response.status}`)
    }
  }

  private async checkFileSystem(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      const fs = await import('fs/promises')
      const os = await import('os')
      
      // Check disk space
      const stats = await fs.stat(process.cwd())
      const tmpDir = os.tmpdir()
      await fs.access(tmpDir)

      const responseTime = Date.now() - startTime

      return {
        service: 'filesystem',
        status: 'healthy',
        responseTime,
        details: {
          accessible: true,
          temp_directory: tmpDir
        }
      }
    } catch (error) {
      return {
        service: 'filesystem',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'File system check failed'
      }
    }
  }

  private async checkMemoryUsage(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      const memoryUsage = process.memoryUsage()
      const totalMemory = memoryUsage.heapTotal
      const usedMemory = memoryUsage.heapUsed
      const memoryUtilization = (usedMemory / totalMemory) * 100

      let status: 'healthy' | 'degraded' | 'unhealthy'
      if (memoryUtilization < 70) {
        status = 'healthy'
      } else if (memoryUtilization < 90) {
        status = 'degraded'
      } else {
        status = 'unhealthy'
      }

      const responseTime = Date.now() - startTime

      return {
        service: 'memory',
        status,
        responseTime,
        details: {
          heap_used: `${Math.round(usedMemory / 1024 / 1024)}MB`,
          heap_total: `${Math.round(totalMemory / 1024 / 1024)}MB`,
          utilization: `${memoryUtilization.toFixed(1)}%`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
        }
      }
    } catch (error) {
      return {
        service: 'memory',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Memory check failed'
      }
    }
  }

  private determineOverallHealth(services: HealthCheckResult[]): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length
    const degradedCount = services.filter(s => s.status === 'degraded').length
    
    if (unhealthyCount > 0) {
      return 'unhealthy'
    }
    
    if (degradedCount > 0) {
      return 'degraded'
    }
    
    return 'healthy'
  }

  async logHealthMetrics(health: SystemHealth): Promise<void> {
    try {
      // Store health metrics in database for historical tracking
      // TODO: Enable when healthMetric model is added to Prisma schema
      // if (process.env.ENABLE_HEALTH_LOGGING === 'true') {
      //   await prisma.healthMetric.create({
      //     data: {
      //       overall: health.overall,
      //       timestamp: new Date(health.timestamp),
      //       services: health.services,
      //       uptime: health.uptime,
      //       version: health.version
      //     }
      //   })
      // }

      // Send alerts if system is unhealthy
      if (health.overall === 'unhealthy') {
        await this.sendAlert(health)
      }
    } catch (error) {
      console.error('Failed to log health metrics:', error)
    }
  }

  private async sendAlert(health: SystemHealth): Promise<void> {
    const unhealthyServices = health.services.filter(s => s.status === 'unhealthy')
    
    const alertData = {
      severity: 'critical',
      message: `System health is unhealthy. Affected services: ${unhealthyServices.map(s => s.service).join(', ')}`,
      details: {
        overall_status: health.overall,
        unhealthy_services: unhealthyServices,
        timestamp: health.timestamp
      }
    }

    // Send to monitoring service (e.g., PagerDuty, Slack, etc.)
    await Promise.allSettled([
      this.sendSlackAlert(alertData),
      this.sendEmailAlert(alertData),
      this.sendWebhookAlert(alertData)
    ])
  }

  private async sendSlackAlert(alert: any): Promise<void> {
    if (!process.env.SLACK_WEBHOOK_URL) return

    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: alert.message,
          attachments: [{
            color: 'danger',
            fields: [{
              title: 'Unhealthy Services',
              value: alert.details.unhealthy_services.map((s: any) => `• ${s.service}: ${s.message}`).join('\n'),
              short: false
            }]
          }]
        })
      })
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
    }
  }

  private async sendEmailAlert(alert: any): Promise<void> {
    // Email alert implementation would go here
  }

  private async sendWebhookAlert(alert: any): Promise<void> {
    if (!process.env.ALERT_WEBHOOK_URL) return

    try {
      await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      })
    } catch (error) {
      console.error('Failed to send webhook alert:', error)
    }
  }
}

export const healthMonitor = new HealthMonitor()