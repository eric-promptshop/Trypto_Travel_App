'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  action?: () => Promise<void>;
  validation?: () => Promise<boolean>;
  errorMessage?: string;
}

interface WhiteLabelOnboardingProps {
  tenantId: string;
  onComplete?: () => void;
}

export function WhiteLabelOnboarding({ tenantId, onComplete }: WhiteLabelOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeSteps();
  }, [tenantId]);

  const initializeSteps = () => {
    const onboardingSteps: OnboardingStep[] = [
      {
        id: 'basic_info',
        title: 'Basic Information',
        description: 'Set up your company name, logo, and basic contact information',
        status: 'pending',
        action: async () => {
          // This would open a form to collect basic tenant information
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        },
        validation: async () => {
          // Check if basic info is complete
          const response = await fetch(`/api/admin/tenants/${tenantId}/validation/basic-info`);
          return response.ok;
        }
      },
      {
        id: 'theme_setup',
        title: 'Theme Customization',
        description: 'Choose or customize your brand colors, fonts, and visual style',
        status: 'pending',
        action: async () => {
          // Redirect to theme customization interface
          window.location.href = '/admin/white-label?tab=themes';
        },
        validation: async () => {
          const response = await fetch(`/api/admin/tenants/${tenantId}/validation/theme`);
          return response.ok;
        }
      },
      {
        id: 'content_setup',
        title: 'Initial Content',
        description: 'Create your homepage, about page, and essential content',
        status: 'pending',
        action: async () => {
          // Open content creation wizard
          window.location.href = '/admin/white-label?tab=content&wizard=true';
        },
        validation: async () => {
          const response = await fetch(`/api/content?status=published`, {
            headers: { 'x-tenant-slug': tenantId }
          });
          const data = await response.json();
          return data.content && data.content.length >= 3; // At least 3 published pages
        }
      },
      {
        id: 'domain_config',
        title: 'Domain Configuration',
        description: 'Set up your custom domain and SSL certificate',
        status: 'pending',
        action: async () => {
          // Open domain configuration
          window.location.href = '/admin/white-label?tab=domains';
        },
        validation: async () => {
          const response = await fetch(`/api/admin/domains`, {
            headers: { 'x-tenant-slug': tenantId }
          });
          const data = await response.json();
          return data.domains?.customDomain && data.domains?.verificationStatus === 'verified';
        }
      },
      {
        id: 'user_setup',
        title: 'User Management',
        description: 'Add team members and configure their roles and permissions',
        status: 'pending',
        action: async () => {
          // Open user management
          window.location.href = '/admin/white-label?tab=users';
        },
        validation: async () => {
          const response = await fetch(`/api/admin/roles/users`, {
            headers: { 'x-tenant-slug': tenantId }
          });
          const data = await response.json();
          return data.userRoles && data.userRoles.length >= 2; // At least 2 users configured
        }
      },
      {
        id: 'test_deployment',
        title: 'Test Deployment',
        description: 'Deploy to staging environment for testing and preview',
        status: 'pending',
        action: async () => {
          await deployToStaging();
        },
        validation: async () => {
          const response = await fetch(`/api/admin/deploy?environment=staging`, {
            headers: { 'x-tenant-slug': tenantId }
          });
          const data = await response.json();
          return data.deployments && data.deployments.some((d: any) => 
            d.environment === 'staging' && d.status === 'success'
          );
        }
      },
      {
        id: 'production_deployment',
        title: 'Production Deployment',
        description: 'Launch your white-label instance to production',
        status: 'pending',
        action: async () => {
          await deployToProduction();
        },
        validation: async () => {
          const response = await fetch(`/api/admin/deploy?environment=production`, {
            headers: { 'x-tenant-slug': tenantId }
          });
          const data = await response.json();
          return data.deployments && data.deployments.some((d: any) => 
            d.environment === 'production' && d.status === 'success'
          );
        }
      }
    ];

    setSteps(onboardingSteps);
    validateAllSteps(onboardingSteps);
  };

  const validateAllSteps = async (stepsToValidate: OnboardingStep[]) => {
    const updatedSteps = [...stepsToValidate];
    
    for (let i = 0; i < updatedSteps.length; i++) {
      const step = updatedSteps[i];
      if (step && step.validation) {
        try {
          const isValid = await step.validation();
          step.status = isValid ? 'completed' : 'pending';
        } catch (error) {
          step.status = 'error';
          step.errorMessage = 'Validation failed';
        }
      }
    }

    setSteps(updatedSteps);
    
    // Find the first non-completed step
    const firstIncomplete = updatedSteps.findIndex(step => step.status !== 'completed');
    setCurrentStep(firstIncomplete >= 0 ? firstIncomplete : updatedSteps.length - 1);
  };

  const executeStep = async (stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step || !step.action) return;

    setLoading(true);
    const updatedSteps = [...steps];
    const updatedStep = updatedSteps[stepIndex];
    if (updatedStep) {
      updatedStep.status = 'in_progress';
    }
    setSteps(updatedSteps);

    try {
      await step.action();
      
      // Validate the step after execution
      const currentStep = updatedSteps[stepIndex];
      if (currentStep) {
        if (step.validation) {
          const isValid = await step.validation();
          currentStep.status = isValid ? 'completed' : 'error';
          if (!isValid) {
            currentStep.errorMessage = 'Step validation failed';
          }
        } else {
          currentStep.status = 'completed';
        }
      }
      
      setSteps(updatedSteps);
      
      // Move to next step if current step is completed
      const finalStep = updatedSteps[stepIndex];
      if (finalStep && finalStep.status === 'completed' && stepIndex < steps.length - 1) {
        setCurrentStep(stepIndex + 1);
      }
      
      // Check if all steps are completed
      if (updatedSteps.every(step => step.status === 'completed')) {
        onComplete?.();
      }
    } catch (error) {
      const errorStep = updatedSteps[stepIndex];
      if (errorStep) {
        errorStep.status = 'error';
        errorStep.errorMessage = error instanceof Error ? error.message : 'Step execution failed';
      }
      setSteps(updatedSteps);
    } finally {
      setLoading(false);
    }
  };

  const deployToStaging = async () => {
    const response = await fetch('/api/admin/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-slug': tenantId,
      },
      body: JSON.stringify({
        environment: 'staging',
        features: ['all'], // Enable all features for testing
      })
    });

    if (!response.ok) {
      throw new Error('Failed to deploy to staging');
    }

    // Wait for deployment to complete (simplified - in reality, would poll status)
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second wait
  };

  const deployToProduction = async () => {
    const response = await fetch('/api/admin/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-slug': tenantId,
      },
      body: JSON.stringify({
        environment: 'production',
      })
    });

    if (!response.ok) {
      throw new Error('Failed to deploy to production');
    }

    // Wait for deployment to complete
    await new Promise(resolve => setTimeout(resolve, 60000)); // 60 second wait
  };

  const getStepIcon = (status: OnboardingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'in_progress':
        return <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">White-Label Setup</h1>
        <p className="text-gray-600 mt-2">
          Complete these steps to set up your white-label travel platform
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">Setup Progress</span>
          <span className="text-sm text-gray-500">
            {steps.filter(s => s.status === 'completed').length} of {steps.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`border rounded-lg p-6 transition-all duration-200 ${
              index === currentStep 
                ? 'border-blue-500 bg-blue-50' 
                : step.status === 'completed'
                ? 'border-green-200 bg-green-50'
                : step.status === 'error'
                ? 'border-red-200 bg-red-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {getStepIcon(step.status)}
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {index + 1}. {step.title}
                  </h3>
                  {step.status === 'pending' && index === currentStep && (
                    <button
                      onClick={() => executeStep(index)}
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Processing...' : 'Start'}
                    </button>
                  )}
                  {step.status === 'error' && (
                    <button
                      onClick={() => executeStep(index)}
                      disabled={loading}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Retry
                    </button>
                  )}
                </div>
                
                <p className="text-gray-600 mt-1">{step.description}</p>
                
                {step.status === 'error' && step.errorMessage && (
                  <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm">{step.errorMessage}</p>
                  </div>
                )}
                
                {step.status === 'in_progress' && (
                  <div className="mt-2 p-3 bg-blue-100 border border-blue-200 rounded-md">
                    <p className="text-blue-700 text-sm">This step is in progress...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completion Message */}
      {steps.every(step => step.status === 'completed') && (
        <div className="mt-8 p-6 bg-green-100 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                🎉 Congratulations! Your white-label platform is ready!
              </h3>
              <p className="text-green-700 mt-1">
                Your travel platform has been successfully deployed and is ready for use.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Support Information */}
      <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
        <p className="text-gray-600 mb-3">
          If you encounter any issues during setup, our support team is here to help.
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            📧 Email: <a href="mailto:support@yourcompany.com" className="text-blue-600 hover:underline">support@yourcompany.com</a>
          </p>
          <p className="text-sm text-gray-600">
            📖 Documentation: <a href="/docs/white-label" className="text-blue-600 hover:underline">White-Label Setup Guide</a>
          </p>
          <p className="text-sm text-gray-600">
            💬 Live Chat: Available 9 AM - 5 PM EST
          </p>
        </div>
      </div>
    </div>
  );
}