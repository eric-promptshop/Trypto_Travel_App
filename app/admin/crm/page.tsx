'use client';

import { useEffect, useState } from 'react';
import { 
  CrmIntegrationFactory, 
  WebhookService, 
  EmailService,
  CrmType,
  CrmAuthConfig
} from '@/lib/crm';

interface IntegrationStatus {
  type: CrmType;
  connected: boolean;
  lastTested?: string;
  metadata?: any;
}

export default function CrmDashboard() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [webhookStats, setWebhookStats] = useState<any>(null);
  const [emailCount, setEmailCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedCrm, setSelectedCrm] = useState<CrmType>('none');
  
  // Initialize services
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get webhook statistics
      const webhookService = WebhookService.getInstance();
      const stats = webhookService.getStatistics();
      setWebhookStats(stats);
      
      // Get email count
      const emailService = EmailService.getInstance();
      const emails = emailService.getSentEmails();
      setEmailCount(emails.size);
      
      // Check integration statuses
      const crmTypes: CrmType[] = ['hubspot', 'salesforce', 'zoho', 'none'];
      const statuses: IntegrationStatus[] = [];
      
      for (const type of crmTypes) {
        const config: CrmAuthConfig = { type, sandbox: true };
        const integration = CrmIntegrationFactory.getInstance().create(type, config);
        
        // Test connection
        const result = await integration.testConnection();
        statuses.push({
          type,
          connected: result.success,
          lastTested: new Date().toISOString(),
          metadata: result.metadata
        });
      }
      
      setIntegrations(statuses);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleConnect = async (type: CrmType) => {
    setLoading(true);
    try {
      const config: CrmAuthConfig = { 
        type, 
        sandbox: true,
        apiKey: 'demo_key_' + Math.random().toString(36).substr(2, 9)
      };
      
      const integration = CrmIntegrationFactory.getInstance().create(type, config);
      await integration.authenticate(config);
      
      // Reload data
      await loadDashboardData();
      alert(`Successfully connected to ${type}!`);
    } catch (error) {
      console.error('Error connecting:', error);
      alert(`Failed to connect to ${type}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTestWebhook = async () => {
    try {
      const webhookService = WebhookService.getInstance();
      
      // Register a test webhook
      const result = await webhookService.registerWebhook(
        selectedCrm,
        'https://example.com/webhook',
        ['contact.created', 'lead.updated'],
        'test_secret'
      );
      
      if (result.success) {
        // Simulate incoming webhook
        await webhookService.handleIncomingWebhook(
          selectedCrm,
          'contact.created',
          { id: 'test_123', email: 'test@example.com' }
        );
        
        alert('Test webhook sent successfully!');
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      alert('Failed to test webhook');
    }
  };
  
  const handleTestEmail = async () => {
    try {
      const emailService = EmailService.getInstance();
      
      const result = await emailService.sendItineraryEmail({
        recipientEmail: 'customer@example.com',
        recipientName: 'John Doe',
        itinerary: {
          id: 'test_itinerary_123',
          title: 'Amazing Europe Adventure',
          duration: 10,
          destinations: ['Paris', 'Rome', 'Barcelona'],
          totalCost: 5000,
          travelers: 2,
          highlights: ['Eiffel Tower visit', 'Colosseum tour', 'Sagrada Familia'],
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        personalMessage: 'Your dream vacation awaits!'
      });
      
      if (result.success) {
        alert('Test email sent! Check console for output.');
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('Failed to send test email');
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">CRM Integration Dashboard</h1>
      
      {/* Integration Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Integration Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {integrations.map((integration) => (
            <div 
              key={integration.type}
              className={`border rounded-lg p-4 ${
                integration.connected ? 'border-green-500' : 'border-gray-300'
              }`}
            >
              <h3 className="font-semibold capitalize">{integration.type}</h3>
              <p className={`text-sm ${
                integration.connected ? 'text-green-600' : 'text-gray-500'
              }`}>
                {integration.connected ? 'Connected' : 'Not Connected'}
              </p>
              {integration.type !== 'none' && !integration.connected && (
                <button
                  onClick={() => handleConnect(integration.type)}
                  disabled={loading}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  Connect
                </button>
              )}
              {integration.metadata && (
                <div className="mt-2 text-xs text-gray-600">
                  {integration.metadata.sandbox && <span>Sandbox Mode</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Webhook Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Webhook Statistics</h2>
        {webhookStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{webhookStats.totalWebhooks}</p>
              <p className="text-sm text-gray-600">Total Webhooks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{webhookStats.activeWebhooks}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{webhookStats.totalEvents}</p>
              <p className="text-sm text-gray-600">Total Events</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{webhookStats.pendingEvents}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{webhookStats.failedEvents}</p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Email Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Email Statistics</h2>
        <div className="text-center">
          <p className="text-3xl font-bold">{emailCount}</p>
          <p className="text-sm text-gray-600">Emails Sent</p>
        </div>
      </div>
      
      {/* Test Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Test Webhook</label>
            <div className="flex gap-2">
              <select
                value={selectedCrm}
                onChange={(e) => setSelectedCrm(e.target.value as CrmType)}
                className="border rounded px-3 py-2"
              >
                <option value="hubspot">HubSpot</option>
                <option value="salesforce">Salesforce</option>
                <option value="zoho">Zoho</option>
                <option value="none">None</option>
              </select>
              <button
                onClick={handleTestWebhook}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                Send Test Webhook
              </button>
            </div>
          </div>
          
          <div>
            <button
              onClick={handleTestEmail}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Send Test Email
            </button>
          </div>
          
          <div>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Refresh Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 