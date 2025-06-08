import { prisma } from '@/lib/prisma';
import { CrmFactory } from '@/lib/crm/crm-factory';
import { CrmConfig, CrmType } from '@/lib/crm/types/crm-integration';
import { EmailService } from './email-service';

export interface LeadSyncResult {
  success: boolean;
  leadId: string;
  crmId?: string;
  crmType?: CrmType;
  error?: string;
  syncedAt?: Date;
}

export class LeadSyncService {
  private static instance: LeadSyncService;

  private constructor() {}

  static getInstance(): LeadSyncService {
    if (!LeadSyncService.instance) {
      LeadSyncService.instance = new LeadSyncService();
    }
    return LeadSyncService.instance;
  }

  /**
   * Sync a lead to the configured CRM
   */
  async syncLead(leadId: string): Promise<LeadSyncResult> {
    try {
      // Get lead data
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          // Include related itinerary if exists
          itineraries: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!lead) {
        return {
          success: false,
          leadId,
          error: 'Lead not found'
        };
      }

      // Get tenant CRM configuration
      const crmConfig = await this.getTenantCrmConfig(lead.tenantId);
      
      if (!crmConfig || crmConfig.type === 'none') {
        console.log(`[LeadSync] No CRM configured for tenant ${lead.tenantId}`);
        return {
          success: true,
          leadId,
          error: 'No CRM configured'
        };
      }

      // Initialize CRM connector
      const crmConnector = CrmFactory.create(crmConfig);

      // Prepare lead data for CRM
      const crmLead = {
        id: lead.id,
        email: lead.email,
        firstName: lead.name?.split(' ')[0] || '',
        lastName: lead.name?.split(' ').slice(1).join(' ') || '',
        phone: lead.phone || '',
        company: '',
        customFields: {
          destination: lead.destination,
          travelDates: `${lead.startDate?.toISOString()} - ${lead.endDate?.toISOString()}`,
          travelers: lead.travelers.toString(),
          budget: `$${lead.budgetMin} - $${lead.budgetMax}`,
          interests: JSON.parse(lead.interests as string || '[]').join(', '),
          leadScore: lead.score.toString(),
          source: 'AI Trip Builder',
          hasItinerary: lead.itineraries.length > 0 ? 'Yes' : 'No'
        }
      };

      // Sync to CRM
      console.log(`[LeadSync] Syncing lead ${leadId} to ${crmConfig.type}`);
      const syncResult = await crmConnector.syncLead(crmLead);

      if (syncResult.success && syncResult.crmId) {
        // Update lead with CRM sync status
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            crmSyncStatus: 'synced',
            crmSyncedAt: new Date()
          }
        });

        console.log(`[LeadSync] Successfully synced lead ${leadId} to ${crmConfig.type} (CRM ID: ${syncResult.crmId})`);

        // Send email notification to sales team
        const emailService = EmailService.getInstance();
        emailService.sendLeadNotificationEmail(
          leadId,
          {
            id: lead.id,
            email: lead.email,
            name: lead.name
          },
          lead.itineraries[0] ? {
            id: lead.itineraries[0].id,
            title: lead.itineraries[0].title || 'Trip Itinerary',
            destinations: [lead.destination],
            highlights: [],
            duration: lead.endDate && lead.startDate 
              ? Math.ceil((lead.endDate.getTime() - lead.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
              : 0,
            travelers: lead.travelers,
            totalCost: (lead.budgetMin + lead.budgetMax) / 2,
            createdAt: lead.createdAt.toISOString()
          } : undefined
        ).catch(error => {
          console.error('[LeadSync] Failed to send email notification:', error);
        });

        return {
          success: true,
          leadId,
          crmId: syncResult.crmId,
          crmType: crmConfig.type,
          syncedAt: new Date()
        };
      } else {
        // Update lead with sync failure
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            crmSyncStatus: 'failed'
          }
        });

        console.error(`[LeadSync] Failed to sync lead ${leadId}:`, syncResult.error);

        return {
          success: false,
          leadId,
          error: syncResult.error || 'Unknown sync error'
        };
      }
    } catch (error) {
      console.error(`[LeadSync] Error syncing lead ${leadId}:`, error);
      
      // Update lead with error status
      try {
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            crmSyncStatus: 'error'
          }
        });
      } catch (updateError) {
        console.error('[LeadSync] Failed to update lead status:', updateError);
      }

      return {
        success: false,
        leadId,
        error: error instanceof Error ? error.message : 'Sync failed'
      };
    }
  }

  /**
   * Batch sync multiple leads
   */
  async syncLeads(leadIds: string[]): Promise<LeadSyncResult[]> {
    const results: LeadSyncResult[] = [];
    
    // Process leads in batches to avoid overwhelming the CRM API
    const batchSize = 10;
    for (let i = 0; i < leadIds.length; i += batchSize) {
      const batch = leadIds.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(leadId => this.syncLead(leadId))
      );
      results.push(...batchResults);
      
      // Add a small delay between batches
      if (i + batchSize < leadIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Sync all unsynced leads
   */
  async syncUnsyncedLeads(tenantId?: string): Promise<LeadSyncResult[]> {
    const where: any = {
      OR: [
        { crmSyncStatus: null },
        { crmSyncStatus: 'pending' },
        { crmSyncStatus: 'failed' }
      ]
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const unsyncedLeads = await prisma.lead.findMany({
      where,
      select: { id: true },
      take: 100 // Limit to prevent overwhelming the system
    });

    console.log(`[LeadSync] Found ${unsyncedLeads.length} unsynced leads`);

    return this.syncLeads(unsyncedLeads.map(lead => lead.id));
  }

  /**
   * Get tenant CRM configuration
   */
  private async getTenantCrmConfig(tenantId: string): Promise<CrmConfig | null> {
    // For now, return configuration from environment variables
    // In production, this would fetch from tenant settings
    const crmType = process.env.CRM_TYPE as CrmType || 'none';
    
    if (crmType === 'none') {
      return null;
    }

    const config: CrmConfig = {
      type: crmType,
      enabled: true
    };

    // Add CRM-specific configuration
    switch (crmType) {
      case 'hubspot':
        config.apiKey = process.env.HUBSPOT_API_KEY;
        config.portalId = process.env.HUBSPOT_PORTAL_ID;
        break;
      case 'salesforce':
        config.clientId = process.env.SALESFORCE_CLIENT_ID;
        config.clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
        config.refreshToken = process.env.SALESFORCE_REFRESH_TOKEN;
        config.instanceUrl = process.env.SALESFORCE_INSTANCE_URL;
        break;
      case 'zoho':
        config.clientId = process.env.ZOHO_CLIENT_ID;
        config.clientSecret = process.env.ZOHO_CLIENT_SECRET;
        config.refreshToken = process.env.ZOHO_REFRESH_TOKEN;
        config.accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com';
        config.apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';
        break;
    }

    return config;
  }

  /**
   * Handle CRM webhook for lead updates
   */
  async handleCrmWebhook(
    crmType: CrmType,
    event: string,
    payload: any
  ): Promise<void> {
    console.log(`[LeadSync] Handling ${crmType} webhook: ${event}`);

    // Handle different webhook events
    switch (event) {
      case 'contact.updated':
      case 'lead.updated':
        await this.handleLeadUpdate(crmType, payload);
        break;
      case 'contact.deleted':
      case 'lead.deleted':
        await this.handleLeadDeletion(crmType, payload);
        break;
      default:
        console.log(`[LeadSync] Unhandled webhook event: ${event}`);
    }
  }

  private async handleLeadUpdate(crmType: CrmType, payload: any): Promise<void> {
    // Implementation would update local lead data based on CRM changes
    console.log(`[LeadSync] Handling lead update from ${crmType}`, payload);
  }

  private async handleLeadDeletion(crmType: CrmType, payload: any): Promise<void> {
    // Implementation would handle lead deletion from CRM
    console.log(`[LeadSync] Handling lead deletion from ${crmType}`, payload);
  }
}