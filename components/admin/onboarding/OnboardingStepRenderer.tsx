'use client';

import { useState } from 'react';
import type { OnboardingStep } from '@/lib/onboarding/workflow';

interface OnboardingStepRendererProps {
  step: OnboardingStep;
  onComplete: (stepId: string, data: any) => void;
  onBack?: () => void;
  onSkip?: () => void;
  isLoading?: boolean;
  canGoBack?: boolean;
  canSkip?: boolean;
}

export function OnboardingStepRenderer({
  step,
  onComplete,
  onBack,
  onSkip,
  isLoading = false,
  canGoBack = false,
  canSkip = false
}: OnboardingStepRendererProps) {
  const [formData, setFormData] = useState<any>(step.data || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Add basic validation based on step ID
    switch (step.id) {
      case 'domain-setup':
        if (!formData.domain) {
          newErrors.domain = 'Domain is required';
        } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,})$/.test(formData.domain)) {
          newErrors.domain = 'Please enter a valid domain';
        }
        break;
      
      case 'branding':
        if (!formData.companyName) {
          newErrors.companyName = 'Company name is required';
        }
        if (!formData.primaryColor) {
          newErrors.primaryColor = 'Primary color is required';
        }
        break;
      
      case 'content':
        if (!formData.dataSource && step.isRequired) {
          newErrors.dataSource = 'Please select a data source';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onComplete(step.id, formData);
    }
  };

  const renderStepContent = () => {
    switch (step.id) {
      case 'domain-setup':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Domain Configuration</h3>
              <p className="text-gray-600 mb-6">
                Configure your custom domain for the white-label platform. This will be the URL your customers use to access your travel booking system.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Domain *
              </label>
              <input
                type="text"
                value={formData.domain || ''}
                onChange={(e) => handleInputChange('domain', e.target.value)}
                placeholder="travel.yourcompany.com"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.domain ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.domain && (
                <p className="text-red-500 text-sm mt-1">{errors.domain}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Enter the domain where your white-label platform will be hosted
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SSL Certificate
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.enableSSL !== false}
                  onChange={(e) => handleInputChange('enableSSL', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Enable SSL/HTTPS (Recommended)</span>
              </div>
            </div>
          </div>
        );

      case 'branding':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Brand Configuration</h3>
              <p className="text-gray-600 mb-6">
                Customize the appearance and branding of your white-label platform to match your company's identity.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.companyName || ''}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Your Travel Company"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.companyName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.companyName && (
                  <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Brand Color *
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.primaryColor || '#3B82F6'}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor || '#3B82F6'}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    placeholder="#3B82F6"
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.primaryColor ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.primaryColor && (
                  <p className="text-red-500 text-sm mt-1">{errors.primaryColor}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo Upload
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Upload Logo
                  </button>
                  <p className="mt-2 text-sm text-gray-500">PNG, JPG, SVG up to 2MB</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">User Management Setup</h3>
              <p className="text-gray-600 mb-6">
                Configure user roles and access permissions for your white-label platform administrators.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email Address *
              </label>
              <input
                type="email"
                value={formData.adminEmail || ''}
                onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                placeholder="admin@yourcompany.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-500 text-sm mt-1">
                This email will receive setup notifications and have admin access
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Authentication Method
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="authMethod"
                    value="email"
                    checked={formData.authMethod === 'email' || !formData.authMethod}
                    onChange={(e) => handleInputChange('authMethod', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Email & Password</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="authMethod"
                    value="sso"
                    checked={formData.authMethod === 'sso'}
                    onChange={(e) => handleInputChange('authMethod', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Single Sign-On (SSO)</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Content Migration</h3>
              <p className="text-gray-600 mb-6">
                Import your existing travel content or start with our default templates.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Source
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="dataSource"
                    value="existing"
                    checked={formData.dataSource === 'existing'}
                    onChange={(e) => handleInputChange('dataSource', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Import Existing Data</div>
                    <div className="text-sm text-gray-500">Upload CSV files or connect to existing systems</div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="dataSource"
                    value="templates"
                    checked={formData.dataSource === 'templates'}
                    onChange={(e) => handleInputChange('dataSource', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Use Template Content</div>
                    <div className="text-sm text-gray-500">Start with our curated travel content library</div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="dataSource"
                    value="blank"
                    checked={formData.dataSource === 'blank'}
                    onChange={(e) => handleInputChange('dataSource', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Start Blank</div>
                    <div className="text-sm text-gray-500">Set up an empty platform and add content later</div>
                  </div>
                </label>
              </div>
              {errors.dataSource && (
                <p className="text-red-500 text-sm mt-1">{errors.dataSource}</p>
              )}
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Testing & Deployment</h3>
              <p className="text-gray-600 mb-6">
                Review your configuration and deploy your white-label platform.
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Pre-deployment Checklist</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Domain configured</li>
                <li>✅ Branding applied</li>
                <li>✅ User management set up</li>
                <li>✅ Content imported</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deployment Environment
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="environment"
                    value="staging"
                    checked={formData.environment === 'staging' || !formData.environment}
                    onChange={(e) => handleInputChange('environment', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Staging (for testing)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="environment"
                    value="production"
                    checked={formData.environment === 'production'}
                    onChange={(e) => handleInputChange('environment', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Production (live deployment)</span>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">{step.title}</h3>
              <p className="text-gray-600 mb-6">{step.description}</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-yellow-800 text-sm">
                This step is under development. Click "Complete Step" to continue.
              </p>
            </div>
          </div>
        );
    }
  };

  // Calculate step number from workflow
  const getStepNumber = (stepId: string) => {
    // This is a simple way to get step order - in a real implementation
    // you might want to get this from the workflow steps array
    const stepOrder: Record<string, number> = {
      'welcome': 1,
      'company-info': 2,
      'branding': 3,
      'domain-setup': 4,
      'features': 5,
      'integrations': 6,
      'users': 7,
      'content': 8,
      'review': 9
    };
    return stepOrder[stepId] || 1;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full font-medium">
            {getStepNumber(step.id)}
          </div>
          <div className="ml-4">
            <h2 className="text-2xl font-bold text-gray-900">{step.title}</h2>
            <p className="text-gray-600">{step.description}</p>
          </div>
          {step.isRequired && (
            <span className="ml-auto px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
              Required
            </span>
          )}
        </div>
        
        {step.isCompleted && (
          <div className="flex items-center text-green-600 text-sm">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Completed
          </div>
        )}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        {renderStepContent()}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {canGoBack && (
            <button
              onClick={onBack}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              ← Back
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {canSkip && !step.isRequired && (
            <button
              onClick={onSkip}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Skip
            </button>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {step.isCompleted ? 'Update Step' : 'Complete Step'}
          </button>
        </div>
      </div>
    </div>
  );
} 