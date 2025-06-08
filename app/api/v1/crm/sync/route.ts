import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandling } from '@/lib/api/response';
import { withRateLimit, rateLimitConfigs } from '@/lib/middleware/rate-limit';
import { LeadSyncService } from '@/lib/crm/services/lead-sync-service';
import { authenticateRequest } from '@/lib/auth/middleware';

/**
 * POST /api/v1/crm/sync
 * Manually trigger CRM sync for leads
 */
export const POST = withRateLimit(rateLimitConfigs.api)(
  withErrorHandling(async (request: NextRequest) => {
    // Authenticate request (in production, this would check for admin role)
    const user = await authenticateRequest(request);
    
    if (!user) {
      return createErrorResponse('Unauthorized', { code: 'UNAUTHORIZED' }, 401);
    }

    // Get request body
    const body = await request.json();
    const { leadIds, syncAll } = body;

    const syncService = LeadSyncService.getInstance();
    let results;

    try {
      if (syncAll) {
        // Sync all unsynced leads
        results = await syncService.syncUnsyncedLeads();
      } else if (leadIds && Array.isArray(leadIds)) {
        // Sync specific leads
        results = await syncService.syncLeads(leadIds);
      } else {
        return createErrorResponse('Invalid request. Provide leadIds array or syncAll flag.');
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return createSuccessResponse({
        message: `Sync completed. ${successful} successful, ${failed} failed.`,
        results,
        summary: {
          total: results.length,
          successful,
          failed
        }
      });
    } catch (error) {
      console.error('CRM sync error:', error);
      return createErrorResponse(
        'Failed to sync leads to CRM',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        500
      );
    }
  })
);

/**
 * GET /api/v1/crm/sync/status
 * Check CRM sync status for a lead
 */
export const GET = withRateLimit(rateLimitConfigs.api)(
  withErrorHandling(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return createErrorResponse('Lead ID is required');
    }

    // In production, you would fetch the lead status from database
    // For now, return a mock response
    return createSuccessResponse({
      leadId,
      syncStatus: 'pending',
      lastSyncAttempt: null,
      crmType: process.env.CRM_TYPE || 'none',
      message: 'CRM sync status endpoint'
    });
  })
);