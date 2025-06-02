'use client';

import { useState } from 'react';
import { 
  CrmIntegrationFactory,
  CrmType,
  CrmAuthConfig,
  CrmContact,
  CrmLead,
  CrmItineraryData,
  EmailService
} from '@/lib/crm';

export default function CrmDemo() {
  const [selectedCrm, setSelectedCrm] = useState<CrmType>('hubspot');
  const [contactId, setContactId] = useState<string>('');
  const [leadId, setLeadId] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    setLogs(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 9)]);
  };
  
  const handleCreateContact = async () => {
    try {
      addLog(`Creating contact in ${selectedCrm}...`);
      
      const config: CrmAuthConfig = { type: selectedCrm, sandbox: true };
      const integration = CrmIntegrationFactory.getInstance().create(selectedCrm, config);
      
      // Authenticate
      await integration.authenticate(config);
      
      // Create contact
      const contact: CrmContact = {
        email: 'demo@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        company: 'Travel Co',
        tripInterest: 'European vacation'
      };
      
      const result = await integration.createContact(contact);
      
      if (result.success && result.data) {
        setContactId(result.data.id || '');
        addLog(`✅ Contact created: ${result.data.id}`);
      } else {
        addLog(`❌ Failed to create contact: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleCreateLead = async () => {
    try {
      addLog(`Creating lead in ${selectedCrm}...`);
      
      const config: CrmAuthConfig = { type: selectedCrm, sandbox: true };
      const integration = CrmIntegrationFactory.getInstance().create(selectedCrm, config);
      
      // Authenticate
      await integration.authenticate(config);
      
      // Create lead with itinerary
      const lead: CrmLead = {
        contactId,
        status: 'new',
        score: 85,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const itinerary: CrmItineraryData = {
        id: 'demo_itinerary_001',
        title: 'European Adventure 2024',
        duration: 14,
        destinations: ['Paris', 'Rome', 'Barcelona', 'Amsterdam'],
        totalCost: 8500,
        travelers: 2,
        highlights: [
          'Eiffel Tower at sunset',
          'Vatican City tour',
          'La Sagrada Familia',
          'Amsterdam canal cruise'
        ],
        startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      };
      
      const result = await integration.createLead(lead, itinerary);
      
      if (result.success && result.data) {
        setLeadId(result.data.id || '');
        addLog(`✅ Lead created: ${result.data.id}`);
        
        // Additional metadata from different CRMs
        if (result.metadata) {
          if (result.metadata.dealId) {
            addLog(`📊 HubSpot Deal ID: ${result.metadata.dealId}`);
          }
          if (result.metadata.opportunityId) {
            addLog(`📊 Salesforce Opportunity: ${result.metadata.opportunityId}`);
          }
        }
      } else {
        addLog(`❌ Failed to create lead: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleSendEmail = async () => {
    try {
      addLog('Sending email notification...');
      
      const emailService = EmailService.getInstance();
      
      const result = await emailService.sendItineraryEmail({
        recipientEmail: 'customer@demo.com',
        recipientName: 'Jane Smith',
        itinerary: {
          id: 'email_demo_001',
          title: 'Tropical Paradise Getaway',
          duration: 7,
          destinations: ['Bali', 'Lombok', 'Gili Islands'],
          totalCost: 3500,
          travelers: 2,
          highlights: [
            'Private beach villa',
            'Snorkeling with sea turtles',
            'Traditional cooking class',
            'Sunset dinner cruise'
          ],
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        personalMessage: 'Your tropical escape awaits! We\'ve crafted the perfect island-hopping adventure for you.',
        senderInfo: {
          name: 'Travel Agent Demo',
          email: 'agent@trypto.ai',
          company: 'Trypto Travel'
        }
      });
      
      if (result.success) {
        addLog('✅ Email sent successfully (check console)');
      } else {
        addLog(`❌ Failed to send email: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleTestConnection = async () => {
    try {
      addLog(`Testing ${selectedCrm} connection...`);
      
      const config: CrmAuthConfig = { type: selectedCrm, sandbox: true };
      const integration = CrmIntegrationFactory.getInstance().create(selectedCrm, config);
      
      const result = await integration.testConnection();
      
      if (result.success) {
        addLog(`✅ Connection successful`);
        
        // Show CRM-specific info
        if (result.metadata) {
          if (result.metadata.hubspotApi) {
            addLog(`📊 HubSpot API: ${result.metadata.hubspotApi}, Rate limit: ${result.metadata.rateLimitRemaining}/${result.metadata.dailyLimit}`);
          }
          if (result.metadata.apiVersion) {
            addLog(`📊 Salesforce API: ${result.metadata.apiVersion}`);
          }
          if (result.metadata.zohoApi) {
            addLog(`📊 Zoho API: ${result.metadata.zohoApi}, Credits: ${result.metadata.apiLimits?.creditsAvailable}`);
          }
        }
      } else {
        addLog(`❌ Connection failed: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">CRM Integration Demo</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Select CRM</h2>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {(['hubspot', 'salesforce', 'zoho', 'none'] as CrmType[]).map(crm => (
            <button
              key={crm}
              onClick={() => setSelectedCrm(crm)}
              className={`px-4 py-2 rounded capitalize ${
                selectedCrm === crm
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {crm === 'none' ? 'No CRM' : crm}
            </button>
          ))}
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleTestConnection}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Test Connection
          </button>
          
          <div className="flex gap-4">
            <button
              onClick={handleCreateContact}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Create Contact
            </button>
            
            <button
              onClick={handleCreateLead}
              disabled={!contactId && selectedCrm !== 'none'}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Create Lead with Itinerary
            </button>
            
            <button
              onClick={handleSendEmail}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Send Email
            </button>
          </div>
          
          {contactId && (
            <p className="text-sm text-gray-600">Contact ID: {contactId}</p>
          )}
          {leadId && (
            <p className="text-sm text-gray-600">Lead ID: {leadId}</p>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
        <div className="bg-gray-100 rounded p-4 h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No activity yet. Try testing a connection!</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This is a placeholder CRM integration for demo purposes. 
          In production, these would connect to real CRM APIs. Check the browser console 
          for detailed logs and email output.
        </p>
      </div>
    </div>
  );
} 