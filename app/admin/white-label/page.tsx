'use client';

import { useEffect, useState } from 'react';
import { 
  ThemeConfiguration,
  ThemePreset
} from '@/types/theme';
import { themePresets, themePresetDefinitions } from '@/lib/themes/default-themes';
import { validateTheme, applyTheme } from '@/lib/themes/theme-utils';
import { ThemeCustomizerConnected } from '@/components/admin/ThemeCustomizerConnected';
import { ClientManagement, ClientProfile } from '@/components/admin/ClientManagement';
import { ThemePreview } from '@/components/admin/ThemePreview';
import { OnboardingWorkflow } from '@/components/admin/onboarding/OnboardingWorkflow';

export default function WhiteLabelDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'themes' | 'clients' | 'preview' | 'onboarding'>('overview');
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfiguration>(themePresets.default);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      const mockClients: ClientProfile[] = [
        {
          id: 'client-1',
          name: 'Adventure Tours Co.',
          domain: 'adventure-tours.example.com',
          contactEmail: 'contact@adventure-tours.com',
          isActive: true,
          theme: themePresets.default,
          features: {
            enabledFeatures: ['itinerary-builder', 'crm-integration', 'white-label-branding'],
            customFeatures: {}
          },
          billing: {
            plan: 'professional',
            status: 'active'
          },
          createdAt: '2024-01-15T10:30:00Z',
          lastModified: '2024-03-20T14:45:00Z'
        },
        {
          id: 'client-2',
          name: 'Luxury Escapes Ltd.',
          domain: 'luxury-escapes.example.com',
          contactEmail: 'admin@luxury-escapes.com',
          isActive: true,
          theme: themePresets.professional,
          features: {
            enabledFeatures: ['itinerary-builder', 'payment-processing', 'analytics', 'priority-support'],
            customFeatures: {}
          },
          billing: {
            plan: 'enterprise',
            status: 'active'
          },
          createdAt: '2024-02-01T09:15:00Z',
          lastModified: '2024-03-18T16:20:00Z'
        },
        {
          id: 'client-3',
          name: 'Budget Backpackers',
          domain: 'budget-backpackers.example.com',
          contactEmail: 'support@budget-backpackers.com',
          isActive: false,
          theme: themePresets.vibrant,
          features: {
            enabledFeatures: ['itinerary-builder'],
            customFeatures: {}
          },
          billing: {
            plan: 'starter',
            status: 'suspended'
          },
          createdAt: '2024-01-20T11:00:00Z',
          lastModified: '2024-02-28T13:30:00Z'
        }
      ];
      
      setClients(mockClients);
      if (mockClients.length > 0) {
        const firstClient = mockClients[0];
        if (firstClient) {
          setSelectedClient(firstClient);
          setSelectedTheme(firstClient.theme);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (preset: ThemePreset) => {
    const newTheme = themePresets[preset];
    setSelectedTheme(newTheme);
    
    if (selectedClient) {
      const updatedClient = {
        ...selectedClient,
        theme: newTheme,
        lastModified: new Date().toISOString()
      };
      setSelectedClient(updatedClient);
      // Update the client in the clients array
      setClients(prev => prev.map(client => 
        client.id === selectedClient.id ? updatedClient : client
      ));
    }
  };

  const handleCustomThemeChange = (newTheme: ThemeConfiguration) => {
    setSelectedTheme(newTheme);
    
    if (selectedClient) {
      const updatedClient = {
        ...selectedClient,
        theme: newTheme,
        lastModified: new Date().toISOString()
      };
      setSelectedClient(updatedClient);
      // Update the client in the clients array
      setClients(prev => prev.map(client => 
        client.id === selectedClient.id ? updatedClient : client
      ));
    }
  };

  const handleClientSelect = (client: ClientProfile) => {
    setSelectedClient(client);
    setSelectedTheme(client.theme);
  };

  const handleClientsChange = (newClients: ClientProfile[]) => {
    setClients(newClients);
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
    if (!isPreviewMode) {
      // Apply theme for preview
      applyTheme(selectedTheme);
    } else {
      // Reset to default theme
      applyTheme(themePresets.default);
    }
  };

  const saveConfiguration = async () => {
    if (!selectedClient) return;
    
    setLoading(true);
    try {
      // Validate theme before saving
      const validation = validateTheme(selectedTheme);
      if (!validation.isValid) {
        alert(`Theme validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      // TODO: Replace with actual API call
      
      // Update local state
      setClients(prev => prev.map(client => 
        client.id === selectedClient.id 
          ? { ...selectedClient, theme: selectedTheme, lastModified: new Date().toISOString() }
          : client
      ));
      
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const publishConfiguration = async () => {
    if (!selectedClient) return;
    
    setLoading(true);
    try {
      // TODO: Replace with actual API call to deploy theme
      
      alert('Configuration published successfully!');
    } catch (error) {
      console.error('Error publishing configuration:', error);
      alert('Failed to publish configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">White-Label Configuration</h1>
          <p className="text-gray-600 mt-2">Manage themes and branding for white-label deployments</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={togglePreview}
            className={`px-4 py-2 rounded transition-colors ${
              isPreviewMode 
                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isPreviewMode ? 'Exit Preview' : 'Preview Mode'}
          </button>
          
          {selectedClient && (
            <>
              <button
                onClick={saveConfiguration}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Save Changes
              </button>
              
              <button
                onClick={publishConfiguration}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                Publish Live
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'themes', label: 'Theme Editor', icon: '🎨' },
            { id: 'clients', label: 'Client Management', icon: '👥' },
            { id: 'onboarding', label: 'Client Onboarding', icon: '🚀' },
            { id: 'preview', label: 'Live Preview', icon: '👁️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - Client Selector */}
        <div className="col-span-3">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-4">Active Clients</h3>
            <div className="space-y-2">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className={`w-full text-left p-3 rounded border transition-colors ${
                    selectedClient?.id === client.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-gray-500">{client.domain}</div>
                  <div className={`text-xs mt-1 ${client.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {client.isActive ? '🟢 Active' : '🔴 Inactive'}
                  </div>
                </button>
              ))}
            </div>
            
            <button className="w-full mt-4 p-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
              + Add New Client
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
                  <div className="text-sm text-gray-600">Total Clients</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {clients.filter(c => c.isActive).length}
                  </div>
                  <div className="text-sm text-gray-600">Active Deployments</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Object.keys(themePresets).length}
                  </div>
                  <div className="text-sm text-gray-600">Available Themes</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-600">Pending Changes</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {clients.slice(0, 3).map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-gray-500">
                          Last modified: {new Date(client.lastModified).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm text-blue-600">
                        Theme: {client.theme.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'themes' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                Theme Configuration
                {selectedClient && <span className="text-sm font-normal text-gray-500 ml-2">
                  for {selectedClient.name}
                </span>}
              </h3>
              
              {/* Theme Presets */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Choose a Base Theme</h4>
                <div className="grid grid-cols-3 gap-4">
                  {themePresetDefinitions.map((preset) => (
                    <button
                      key={preset.configuration.id}
                      onClick={() => handleThemeChange(preset.configuration.id as ThemePreset)}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedTheme.id === preset.configuration.id
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{preset.description}</div>
                      
                      {/* Color Preview */}
                      <div className="flex gap-1 mt-3">
                        {preset.configuration.colors && (
                          <>
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: preset.configuration.colors.primary[500] }}
                            />
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: preset.configuration.colors.accent[500] }}
                            />
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: preset.configuration.colors.secondary[500] }}
                            />
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Customizer */}
              <div className="border-t pt-6">
                <h4 className="font-medium mb-3">Custom Theme Editor</h4>
                {selectedClient?.id ? (
                  <ThemeCustomizerConnected
                    clientId={selectedClient.id}
                    onThemeApplied={(theme) => {
                      setSelectedTheme(theme);
                      if (selectedClient) {
                        handleCustomThemeChange(theme);
                      }
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Select a client to customize theme</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <ClientManagement
              clients={clients}
              onClientsChange={handleClientsChange}
              onClientSelect={handleClientSelect}
              selectedClient={selectedClient}
            />
          )}

          {activeTab === 'onboarding' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Client Onboarding Workflow</h3>
              <p className="text-gray-600 mb-6">
                Guide new white-label clients through the setup process with automated deployment and configuration.
              </p>
              {selectedClient ? (
                <OnboardingWorkflow 
                  tenantId={selectedClient.id}
                  onComplete={(workflow) => {
                    // TODO: Update client status or trigger post-onboarding actions
                  }}
                  onStepComplete={(stepId, data) => {
                    // TODO: Save step progress
                  }}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Client</h3>
                  <p className="text-gray-500">
                    Choose a client from the sidebar to start their onboarding workflow.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preview' && (
            <ThemePreview
              theme={selectedTheme}
              isActive={isPreviewMode}
              onTogglePreview={togglePreview}
            />
          )}
        </div>
      </div>
    </div>
  );
} 