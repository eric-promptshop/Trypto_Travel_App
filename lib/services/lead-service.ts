import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Lead data schemas
export const leadCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  phone: z.string().optional(),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(), 
  travelers: z.number().default(1),
  budget: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  }).optional(),
  interests: z.array(z.string()).default([]),
  source: z.string(),
  sourceDetails: z.any().optional(),
  itinerary: z.any().optional(),
  context: z.any().optional(),
  tags: z.array(z.string()).default([]),
  optInMarketing: z.boolean().default(true),
  operatorId: z.string().optional(),
  tenantId: z.string().default('default')
})

export type LeadCreateInput = z.infer<typeof leadCreateSchema>

export class LeadService {
  /**
   * Create a new lead in the database
   */
  async createLead(data: LeadCreateInput) {
    try {
      // Calculate lead score
      const score = this.calculateLeadScore(data)
      
      // Create lead in database
      const lead = await prisma.leadEnhanced.create({
        data: {
          email: data.email,
          firstName: data.name?.split(' ')[0],
          lastName: data.name?.split(' ').slice(1).join(' '),
          phone: data.phone,
          destination: data.destination,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          travelers: data.travelers,
          budget: data.budget ? {
            min: data.budget.min || 0,
            max: data.budget.max || 0,
            currency: 'USD'
          } : null,
          interests: data.interests,
          source: data.source,
          sourceDetails: data.sourceDetails || {},
          itinerary: data.itinerary || {},
          context: data.context || {},
          tags: data.tags,
          score,
          status: 'new',
          optInMarketing: data.optInMarketing,
          optInTimestamp: data.optInMarketing ? new Date() : null,
          operatorId: data.operatorId,
          tenantId: data.tenantId
        }
      })
      
      // Create initial activity
      await this.createLeadActivity(lead.id, 'created', {
        source: data.source,
        score
      })
      
      return lead
    } catch (error) {
      console.error('Error creating lead:', error)
      throw new Error('Failed to create lead')
    }
  }
  
  /**
   * Update an existing lead
   */
  async updateLead(id: string, data: Partial<LeadCreateInput>) {
    try {
      const updateData: any = {}
      
      if (data.email) updateData.email = data.email
      if (data.name) {
        updateData.firstName = data.name.split(' ')[0]
        updateData.lastName = data.name.split(' ').slice(1).join(' ')
      }
      if (data.phone) updateData.phone = data.phone
      if (data.destination) updateData.destination = data.destination
      if (data.startDate) updateData.startDate = new Date(data.startDate)
      if (data.endDate) updateData.endDate = new Date(data.endDate)
      if (data.travelers !== undefined) updateData.travelers = data.travelers
      if (data.budget) updateData.budget = data.budget
      if (data.interests) updateData.interests = data.interests
      if (data.itinerary) updateData.itinerary = data.itinerary
      if (data.tags) updateData.tags = data.tags
      
      // Recalculate score if relevant fields changed
      if (data.destination || data.startDate || data.budget || data.itinerary) {
        const currentLead = await prisma.leadEnhanced.findUnique({
          where: { id }
        })
        
        if (currentLead) {
          const mergedData = { ...currentLead, ...data }
          updateData.score = this.calculateLeadScore(mergedData as any)
        }
      }
      
      updateData.lastEngagedAt = new Date()
      
      const lead = await prisma.leadEnhanced.update({
        where: { id },
        data: updateData
      })
      
      // Track activity
      await this.createLeadActivity(id, 'updated', {
        fields: Object.keys(updateData)
      })
      
      return lead
    } catch (error) {
      console.error('Error updating lead:', error)
      throw new Error('Failed to update lead')
    }
  }
  
  /**
   * Get lead by email
   */
  async getLeadByEmail(email: string, tenantId: string = 'default') {
    return await prisma.leadEnhanced.findFirst({
      where: {
        email,
        tenantId
      },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })
  }
  
  /**
   * Get lead by ID
   */
  async getLeadById(id: string) {
    return await prisma.leadEnhanced.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' }
        },
        operator: true
      }
    })
  }
  
  /**
   * List leads with filtering and pagination
   */
  async listLeads(params: {
    tenantId?: string
    operatorId?: string
    status?: string
    minScore?: number
    page?: number
    limit?: number
    orderBy?: 'createdAt' | 'score' | 'lastEngagedAt'
    order?: 'asc' | 'desc'
  }) {
    const {
      tenantId = 'default',
      operatorId,
      status,
      minScore,
      page = 1,
      limit = 20,
      orderBy = 'createdAt',
      order = 'desc'
    } = params
    
    const where: any = { tenantId }
    if (operatorId) where.operatorId = operatorId
    if (status) where.status = status
    if (minScore) where.score = { gte: minScore }
    
    const [leads, total] = await Promise.all([
      prisma.leadEnhanced.findMany({
        where,
        orderBy: { [orderBy]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          operator: true
        }
      }),
      prisma.leadEnhanced.count({ where })
    ])
    
    return {
      leads,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  }
  
  /**
   * Update lead status
   */
  async updateLeadStatus(id: string, status: string, notes?: string) {
    const lead = await prisma.leadEnhanced.update({
      where: { id },
      data: {
        status,
        notes: notes || undefined,
        lastEngagedAt: new Date()
      }
    })
    
    await this.createLeadActivity(id, 'status_changed', {
      oldStatus: lead.status,
      newStatus: status,
      notes
    })
    
    return lead
  }
  
  /**
   * Assign lead to operator
   */
  async assignLeadToOperator(leadId: string, operatorId: string) {
    const lead = await prisma.leadEnhanced.update({
      where: { id: leadId },
      data: {
        operatorId,
        assignedTo: operatorId,
        status: 'assigned'
      }
    })
    
    await this.createLeadActivity(leadId, 'assigned', {
      operatorId
    })
    
    return lead
  }
  
  /**
   * Create lead activity record
   */
  async createLeadActivity(leadId: string, type: string, metadata?: any) {
    return await prisma.leadActivity.create({
      data: {
        leadId,
        type,
        description: this.getActivityDescription(type, metadata),
        metadata: metadata || {}
      }
    })
  }
  
  /**
   * Calculate lead score based on various factors
   */
  private calculateLeadScore(data: any): number {
    let score = 0
    
    // Base score for providing email
    score += 10
    
    // Contact information completeness
    if (data.name) score += 5
    if (data.phone) score += 5
    
    // Trip details (shows serious intent)
    if (data.destination) score += 15
    if (data.startDate && data.endDate) score += 20
    if (data.travelers && data.travelers > 1) score += 10
    
    // Budget information (qualified lead)
    if (data.budget) {
      score += 15
      if (data.budget.max && data.budget.max > 5000) score += 10
    }
    
    // Interests and preferences
    if (data.interests && data.interests.length > 0) {
      score += 5 * Math.min(data.interests.length, 3)
    }
    
    // Itinerary context (high intent)
    if (data.itinerary && Object.keys(data.itinerary).length > 0) {
      score += 25
    }
    
    // Marketing opt-in
    if (data.optInMarketing) score += 5
    
    // Source bonuses
    const sourceScores: Record<string, number> = {
      'itinerary_builder': 20,
      'tour_discovery': 15,
      'operator_widget': 15,
      'landing_page': 10,
      'blog': 5
    }
    
    if (data.source && sourceScores[data.source]) {
      score += sourceScores[data.source]
    }
    
    // Cap at 100
    return Math.min(score, 100)
  }
  
  /**
   * Generate human-readable activity description
   */
  private getActivityDescription(type: string, metadata?: any): string {
    switch (type) {
      case 'created':
        return `Lead created from ${metadata?.source || 'unknown source'} with score ${metadata?.score || 0}`
      case 'updated':
        return `Lead information updated: ${metadata?.fields?.join(', ') || 'unknown fields'}`
      case 'status_changed':
        return `Status changed from ${metadata?.oldStatus || 'unknown'} to ${metadata?.newStatus || 'unknown'}`
      case 'assigned':
        return `Lead assigned to operator ${metadata?.operatorId || 'unknown'}`
      case 'email_sent':
        return `Email sent: ${metadata?.subject || 'unknown'}`
      case 'tour_viewed':
        return `Viewed tour: ${metadata?.tourName || 'unknown'}`
      case 'itinerary_saved':
        return `Saved itinerary for ${metadata?.destination || 'unknown'}`
      default:
        return `Activity: ${type}`
    }
  }
  
  /**
   * Get lead statistics
   */
  async getLeadStats(params: {
    tenantId?: string
    operatorId?: string
    dateFrom?: Date
    dateTo?: Date
  }) {
    const where: any = {}
    if (params.tenantId) where.tenantId = params.tenantId
    if (params.operatorId) where.operatorId = params.operatorId
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {}
      if (params.dateFrom) where.createdAt.gte = params.dateFrom
      if (params.dateTo) where.createdAt.lte = params.dateTo
    }
    
    const [total, byStatus, bySource, avgScore] = await Promise.all([
      prisma.leadEnhanced.count({ where }),
      prisma.leadEnhanced.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.leadEnhanced.groupBy({
        by: ['source'],
        where,
        _count: true
      }),
      prisma.leadEnhanced.aggregate({
        where,
        _avg: { score: true }
      })
    ])
    
    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
      bySource: bySource.reduce((acc, item) => {
        acc[item.source] = item._count
        return acc
      }, {} as Record<string, number>),
      averageScore: avgScore._avg.score || 0
    }
  }
}

// Export singleton instance
export const leadService = new LeadService()