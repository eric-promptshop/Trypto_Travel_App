'use client';

import { useState, useCallback } from 'react';
import { ThemeConfiguration, ThemePreset } from '@/types/theme';
import { themePresets } from '@/lib/themes/default-themes';
import { validateTheme } from '@/lib/themes/theme-utils';

export interface ClientProfile {
  id: string;
  name: string;
  domain: string;
  isActive: boolean;
  theme: ThemeConfiguration;
  createdAt: string;
  lastModified: string;
  contactEmail?: string;
  companyLogo?: string;
  features?: {
    enabledFeatures: string[];
    customFeatures?: Record<string, boolean>;
  };
  billing?: {
    plan: 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'suspended' | 'trial';
  };
}

interface ClientManagementProps {
  clients: ClientProfile[];
  onClientsChange: (clients: ClientProfile[]) => void;
  onClientSelect: (client: ClientProfile) => void;
  selectedClient: ClientProfile | null;
}

interface ClientFormData {
  name: string;
  domain: string;
  contactEmail: string;
  theme: ThemePreset;
  isActive: boolean;
  features: string[];
  billingPlan: 'starter' | 'professional' | 'enterprise';
  billingStatus: 'active' | 'suspended' | 'trial';
}

const availableFeatures = [
  { id: 'itinerary-builder', label: 'Itinerary Builder', description: 'AI-powered trip planning' },
  { id: 'crm-integration', label: 'CRM Integration', description: 'Connect with customer data' },
  { id: 'payment-processing', label: 'Payment Processing', description: 'Handle bookings and payments' },
  { id: 'analytics', label: 'Analytics Dashboard', description: 'Track usage and performance' },
  { id: 'white-label-branding', label: 'White-label Branding', description: 'Custom logos and colors' },
  { id: 'api-access', label: 'API Access', description: 'Programmatic integration' },
  { id: 'priority-support', label: 'Priority Support', description: '24/7 dedicated support' },
  { id: 'custom-domains', label: 'Custom Domains', description: 'Use your own domain' }
];

export function ClientManagement({ 
  clients, 
  onClientsChange, 
  onClientSelect, 
  selectedClient 
}: ClientManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    domain: '',
    contactEmail: '',
    theme: 'default',
    isActive: true,
    features: ['itinerary-builder'],
    billingPlan: 'starter',
    billingStatus: 'trial'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      domain: '',
      contactEmail: '',
      theme: 'default',
      isActive: true,
      features: ['itinerary-builder'],
      billingPlan: 'starter',
      billingStatus: 'trial'
    });
    setFormErrors({});
  };

  const validateForm = (data: ClientFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.name.trim()) {
      errors.name = 'Client name is required';
    }

    if (!data.domain.trim()) {
      errors.domain = 'Domain is required';
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(data.domain)) {
      errors.domain = 'Please enter a valid domain (e.g., example.com)';
    }

    if (!data.contactEmail.trim()) {
      errors.contactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address';
    }

    // Check for duplicate domain (excluding current client if editing)
    const existingClient = clients.find(client => 
      client.domain === data.domain && client.id !== editingClient?.id
    );
    if (existingClient) {
      errors.domain = 'This domain is already in use by another client';
    }

    return errors;
  };

  const handleInputChange = (field: keyof ClientFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFeatureToggle = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(id => id !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const handleAddClient = useCallback(async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const clientData = {
        name: formData.name,
        domain: formData.domain,
        contactEmail: formData.contactEmail,
        isActive: formData.isActive,
        theme: themePresets[formData.theme],
        features: {
          enabledFeatures: formData.features,
          customFeatures: {}
        },
        billing: {
          plan: formData.billingPlan,
          status: formData.billingStatus
        }
      };

      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create client');
      }

      const newClient: ClientProfile = await response.json();
      
      onClientsChange([...clients, newClient]);
      setShowAddForm(false);
      resetForm();
      
      // Auto-select the new client
      onClientSelect(newClient);
    } catch (error) {
      console.error('Error adding client:', error);
      setFormErrors({ 
        general: error instanceof Error ? error.message : 'Failed to add client. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  }, [formData, clients, onClientsChange, onClientSelect]);

  const handleEditClient = useCallback(async () => {
    if (!editingClient) return;

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        name: formData.name,
        domain: formData.domain,
        contactEmail: formData.contactEmail,
        isActive: formData.isActive,
        theme: themePresets[formData.theme],
        features: {
          enabledFeatures: formData.features,
          customFeatures: editingClient.features?.customFeatures || {}
        },
        billing: {
          plan: formData.billingPlan,
          status: formData.billingStatus
        }
      };

      const response = await fetch(`/api/admin/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update client');
      }

      const updatedClient: ClientProfile = await response.json();
      
      onClientsChange(clients.map(client => 
        client.id === editingClient.id ? updatedClient : client
      ));
      
      setShowEditForm(false);
      setEditingClient(null);
      resetForm();
      
      // Update selected client if it's the one being edited
      if (selectedClient?.id === editingClient.id) {
        onClientSelect(updatedClient);
      }
    } catch (error) {
      console.error('Error updating client:', error);
      setFormErrors({ 
        general: error instanceof Error ? error.message : 'Failed to update client. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  }, [formData, editingClient, clients, onClientsChange, selectedClient, onClientSelect]);

  const handleDeleteClient = useCallback(async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete client');
      }
      
      onClientsChange(clients.filter(client => client.id !== clientId));
      
      // Clear selection if the deleted client was selected
      if (selectedClient?.id === clientId) {
        const remainingClients = clients.filter(client => client.id !== clientId);
        if (remainingClients.length > 0) {
          const firstRemainingClient = remainingClients[0];
          if (firstRemainingClient) {
            onClientSelect(firstRemainingClient);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete client. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [clients, onClientsChange, selectedClient, onClientSelect]);

  const startEdit = (client: ClientProfile) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      domain: client.domain,
      contactEmail: client.contactEmail || '',
      theme: Object.keys(themePresets).find(key => 
        themePresets[key as ThemePreset].id === client.theme.id
      ) as ThemePreset || 'default',
      isActive: client.isActive,
      features: client.features?.enabledFeatures || ['itinerary-builder'],
      billingPlan: client.billing?.plan || 'starter',
      billingStatus: client.billing?.status || 'trial'
    });
    setShowEditForm(true);
  };

  const cancelEdit = () => {
    setShowEditForm(false);
    setEditingClient(null);
    resetForm();
  };

  const ClientForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-6">
      {formErrors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{formErrors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Basic Information */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Client Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formErrors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Adventure Tours Co."
          />
          {formErrors.name && (
            <p className="text-red-600 text-xs">{formErrors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Domain *
          </label>
          <input
            type="text"
            value={formData.domain}
            onChange={(e) => handleInputChange('domain', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formErrors.domain ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="adventure-tours.example.com"
          />
          {formErrors.domain && (
            <p className="text-red-600 text-xs">{formErrors.domain}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Contact Email *
          </label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => handleInputChange('contactEmail', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formErrors.contactEmail ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="contact@adventure-tours.com"
          />
          {formErrors.contactEmail && (
            <p className="text-red-600 text-xs">{formErrors.contactEmail}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Default Theme
          </label>
          <select
            value={formData.theme}
            onChange={(e) => handleInputChange('theme', e.target.value as ThemePreset)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(themePresets).map(([key, theme]) => (
              <option key={key} value={key}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status and Billing */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={formData.isActive ? 'active' : 'inactive'}
            onChange={(e) => handleInputChange('isActive', e.target.value === 'active')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Billing Plan
          </label>
          <select
            value={formData.billingPlan}
            onChange={(e) => handleInputChange('billingPlan', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Billing Status
          </label>
          <select
            value={formData.billingStatus}
            onChange={(e) => handleInputChange('billingStatus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Enabled Features
        </label>
        <div className="grid grid-cols-2 gap-3">
          {availableFeatures.map((feature) => (
            <div key={feature.id} className="flex items-start space-x-3">
              <input
                type="checkbox"
                id={feature.id}
                checked={formData.features.includes(feature.id)}
                onChange={() => handleFeatureToggle(feature.id)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="min-w-0 flex-1">
                <label htmlFor={feature.id} className="text-sm font-medium text-gray-700 cursor-pointer">
                  {feature.label}
                </label>
                <p className="text-xs text-gray-500">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={isEdit ? cancelEdit : () => setShowAddForm(false)}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={isEdit ? handleEditClient : handleAddClient}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : (isEdit ? 'Update Client' : 'Add Client')}
        </button>
      </div>
    </div>
  );

  if (showAddForm) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-6">Add New Client</h3>
        <ClientForm />
      </div>
    );
  }

  if (showEditForm && editingClient) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-6">Edit Client: {editingClient.name}</h3>
        <ClientForm isEdit />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Client Management</h3>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          + Add New Client
        </button>
      </div>

      {/* Client Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Domain</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Theme</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Plan</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Features</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Last Modified</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr 
                key={client.id} 
                className={`border-b hover:bg-gray-50 transition-colors ${
                  selectedClient?.id === client.id ? 'bg-blue-50' : ''
                }`}
              >
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-gray-900">{client.name}</div>
                    {client.contactEmail && (
                      <div className="text-sm text-gray-500">{client.contactEmail}</div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{client.domain}</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {client.theme.name}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    client.billing?.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                    client.billing?.plan === 'professional' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {client.billing?.plan || 'starter'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      client.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {client.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {client.billing?.status && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        client.billing.status === 'active' ? 'bg-green-100 text-green-800' :
                        client.billing.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {client.billing.status}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-xs text-gray-500">
                    {client.features?.enabledFeatures?.length || 0} features
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {new Date(client.lastModified).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onClientSelect(client)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Select
                    </button>
                    <button 
                      onClick={() => startEdit(client)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteClient(client.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No clients yet</div>
          <div className="text-gray-400 text-sm">Add your first client to get started</div>
        </div>
      )}
    </div>
  );
} 