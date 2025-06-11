export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string; // React component name
  isRequired: boolean;
  isCompleted: boolean;
  data?: any;
  validationRules?: ValidationRule[];
  dependencies?: string[]; // Step IDs that must be completed first
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'email' | 'url' | 'min_length' | 'max_length' | 'pattern';
  value?: any;
  message: string;
}

export interface OnboardingWorkflow {
  id: string;
  tenantId: string;
  currentStep: string;
  steps: OnboardingStep[];
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingData {
  // Company Information
  companyInfo?: {
    name: string;
    description: string;
    website?: string;
    logo?: string;
    contactEmail: string;
    contactPhone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };
  
  // Branding & Theme
  branding?: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    logoUrl?: string;
    faviconUrl?: string;
    customCSS?: string;
  };
  
  // Domain Configuration
  domain?: {
    customDomain?: string;
    subdomain: string;
    sslEnabled: boolean;
  };
  
  // Feature Selection
  features?: {
    enabledFeatures: string[];
    customFeatures: Record<string, any>;
  };
  
  // Integration Settings
  integrations?: {
    paymentProvider?: 'stripe' | 'paypal' | 'square';
    emailProvider?: 'sendgrid' | 'mailchimp' | 'mailgun';
    analyticsProvider?: 'google' | 'mixpanel' | 'amplitude';
    crmProvider?: 'hubspot' | 'salesforce' | 'zoho';
  };
  
  // User Management
  users?: {
    adminUser: {
      name: string;
      email: string;
      role: string;
    };
    additionalUsers?: Array<{
      name: string;
      email: string;
      role: string;
    }>;
  };
  
  // Content Setup
  content?: {
    welcomeMessage?: string;
    aboutUs?: string;
    termsOfService?: string;
    privacyPolicy?: string;
    customPages?: Array<{
      title: string;
      slug: string;
      content: string;
    }>;
  };
}

// Default onboarding workflow steps
export const DEFAULT_ONBOARDING_STEPS: Omit<OnboardingStep, 'isCompleted' | 'data'>[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Welcome to your white-label travel platform setup',
    component: 'WelcomeStep',
    isRequired: true,
    dependencies: [],
  },
  {
    id: 'company-info',
    title: 'Company Information',
    description: 'Tell us about your company',
    component: 'CompanyInfoStep',
    isRequired: true,
    dependencies: ['welcome'],
    validationRules: [
      { field: 'name', type: 'required', message: 'Company name is required' },
      { field: 'name', type: 'min_length', value: 2, message: 'Company name must be at least 2 characters' },
      { field: 'contactEmail', type: 'required', message: 'Contact email is required' },
      { field: 'contactEmail', type: 'email', message: 'Please enter a valid email address' },
      { field: 'website', type: 'url', message: 'Please enter a valid website URL' },
    ],
  },
  {
    id: 'branding',
    title: 'Branding & Theme',
    description: 'Customize your platform\'s look and feel',
    component: 'BrandingStep',
    isRequired: true,
    dependencies: ['company-info'],
    validationRules: [
      { field: 'primaryColor', type: 'required', message: 'Primary color is required' },
      { field: 'primaryColor', type: 'pattern', value: /^#[0-9A-F]{6}$/i, message: 'Please enter a valid hex color' },
    ],
  },
  {
    id: 'domain-setup',
    title: 'Domain Configuration',
    description: 'Set up your custom domain',
    component: 'DomainSetupStep',
    isRequired: true,
    dependencies: ['branding'],
    validationRules: [
      { field: 'subdomain', type: 'required', message: 'Subdomain is required' },
      { field: 'subdomain', type: 'pattern', value: /^[a-z0-9-]+$/, message: 'Subdomain can only contain lowercase letters, numbers, and hyphens' },
      { field: 'customDomain', type: 'pattern', value: /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, message: 'Please enter a valid domain name' },
    ],
  },
  {
    id: 'features',
    title: 'Feature Selection',
    description: 'Choose the features you want to enable',
    component: 'FeaturesStep',
    isRequired: true,
    dependencies: ['domain-setup'],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Connect your third-party services',
    component: 'IntegrationsStep',
    isRequired: false,
    dependencies: ['features'],
  },
  {
    id: 'users',
    title: 'User Management',
    description: 'Set up admin users and team members',
    component: 'UsersStep',
    isRequired: true,
    dependencies: ['features'],
    validationRules: [
      { field: 'adminUser.name', type: 'required', message: 'Admin user name is required' },
      { field: 'adminUser.email', type: 'required', message: 'Admin user email is required' },
      { field: 'adminUser.email', type: 'email', message: 'Please enter a valid email address' },
    ],
  },
  {
    id: 'content',
    title: 'Content Setup',
    description: 'Add your initial content and pages',
    component: 'ContentStep',
    isRequired: false,
    dependencies: ['users'],
  },
  {
    id: 'review',
    title: 'Review & Deploy',
    description: 'Review your configuration and deploy your platform',
    component: 'ReviewStep',
    isRequired: true,
    dependencies: ['users'],
  },
];

/**
 * Create a new onboarding workflow for a tenant
 */
export function createOnboardingWorkflow(tenantId: string): OnboardingWorkflow {
  const steps: OnboardingStep[] = DEFAULT_ONBOARDING_STEPS.map(step => {
    const newStep: OnboardingStep = {
      id: step.id,
      title: step.title,
      description: step.description,
      component: step.component,
      isRequired: step.isRequired,
      isCompleted: false,
      data: {},
    };
    
    if (step.validationRules) {
      newStep.validationRules = step.validationRules;
    }
    
    if (step.dependencies) {
      newStep.dependencies = step.dependencies;
    }
    
    return newStep;
  });

  const firstStep = steps[0];
  if (!firstStep) {
    throw new Error('No steps defined for onboarding workflow');
  }

  return {
    id: `onboarding-${tenantId}-${Date.now()}`,
    tenantId,
    currentStep: firstStep.id,
    steps,
    isCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Get the current step in the workflow
 */
export function getCurrentStep(workflow: OnboardingWorkflow): OnboardingStep | null {
  return workflow.steps.find(step => step.id === workflow.currentStep) || null;
}

/**
 * Get the next available step
 */
export function getNextStep(workflow: OnboardingWorkflow): OnboardingStep | null {
  const currentStepIndex = workflow.steps.findIndex(step => step.id === workflow.currentStep);
  
  if (currentStepIndex === -1) return null;
  
  // Find the next incomplete step
  for (let i = currentStepIndex + 1; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    if (step && !step.isCompleted && areStepDependenciesMet(workflow, step)) {
      return step;
    }
  }
  
  return null;
}

/**
 * Check if all dependencies for a step are completed
 */
export function areStepDependenciesMet(workflow: OnboardingWorkflow, step: OnboardingStep): boolean {
  if (!step.dependencies || step.dependencies.length === 0) {
    return true;
  }
  
  return step.dependencies.every(depId => {
    const depStep = workflow.steps.find(s => s.id === depId);
    return depStep?.isCompleted || false;
  });
}

/**
 * Validate step data against validation rules
 */
export function validateStepData(step: OnboardingStep, data: any): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  
  if (!step.validationRules) {
    return { isValid: true, errors };
  }
  
  step.validationRules.forEach(rule => {
    const fieldValue = getNestedValue(data, rule.field);
    
    switch (rule.type) {
      case 'required':
        if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
          errors[rule.field] = rule.message;
        }
        break;
        
      case 'email':
        if (fieldValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
          errors[rule.field] = rule.message;
        }
        break;
        
      case 'url':
        if (fieldValue && !/^https?:\/\/.+/.test(fieldValue)) {
          errors[rule.field] = rule.message;
        }
        break;
        
      case 'min_length':
        if (fieldValue && fieldValue.length < rule.value) {
          errors[rule.field] = rule.message;
        }
        break;
        
      case 'max_length':
        if (fieldValue && fieldValue.length > rule.value) {
          errors[rule.field] = rule.message;
        }
        break;
        
      case 'pattern':
        if (fieldValue && !rule.value.test(fieldValue)) {
          errors[rule.field] = rule.message;
        }
        break;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Complete a step and move to the next one
 */
export function completeStep(
  workflow: OnboardingWorkflow, 
  stepId: string, 
  data: any
): OnboardingWorkflow {
  const stepIndex = workflow.steps.findIndex(step => step.id === stepId);
  
  if (stepIndex === -1) {
    throw new Error(`Step not found: ${stepId}`);
  }
  
  const step = workflow.steps[stepIndex];
  if (!step) {
    throw new Error(`Step not found at index: ${stepIndex}`);
  }
  
  // Validate step data
  const validation = validateStepData(step, data);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
  }
  
  // Update step
  const updatedSteps = [...workflow.steps];
  const updatedStep: OnboardingStep = {
    id: step.id,
    title: step.title,
    description: step.description,
    component: step.component,
    isRequired: step.isRequired,
    isCompleted: true,
    data,
  };
  
  if (step.validationRules) {
    updatedStep.validationRules = step.validationRules;
  }
  
  if (step.dependencies) {
    updatedStep.dependencies = step.dependencies;
  }
  
  updatedSteps[stepIndex] = updatedStep;
  
  // Find next step
  const nextStep = getNextStep({ ...workflow, steps: updatedSteps });
  const currentStep = nextStep ? nextStep.id : stepId;
  
  // Check if workflow is completed
  const isCompleted = updatedSteps.every(s => s.isCompleted || !s.isRequired);
  
  const result: OnboardingWorkflow = {
    ...workflow,
    steps: updatedSteps,
    currentStep,
    isCompleted,
    updatedAt: new Date(),
  };
  
  if (isCompleted) {
    result.completedAt = new Date();
  }
  
  return result;
}

/**
 * Get workflow progress percentage
 */
export function getWorkflowProgress(workflow: OnboardingWorkflow): number {
  const requiredSteps = workflow.steps.filter(step => step.isRequired);
  const completedRequiredSteps = requiredSteps.filter(step => step.isCompleted);
  
  return Math.round((completedRequiredSteps.length / requiredSteps.length) * 100);
}

/**
 * Get all completed onboarding data
 */
export function getOnboardingData(workflow: OnboardingWorkflow): Partial<OnboardingData> {
  const data: Partial<OnboardingData> = {};
  
  workflow.steps.forEach(step => {
    if (step.isCompleted && step.data) {
      switch (step.id) {
        case 'company-info':
          data.companyInfo = step.data;
          break;
        case 'branding':
          data.branding = step.data;
          break;
        case 'domain-setup':
          data.domain = step.data;
          break;
        case 'features':
          data.features = step.data;
          break;
        case 'integrations':
          data.integrations = step.data;
          break;
        case 'users':
          data.users = step.data;
          break;
        case 'content':
          data.content = step.data;
          break;
      }
    }
  });
  
  return data;
}

/**
 * Helper function to get nested object values
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Generate onboarding checklist for display
 */
export function generateOnboardingChecklist(workflow: OnboardingWorkflow): Array<{
  id: string;
  title: string;
  isCompleted: boolean;
  isRequired: boolean;
  canStart: boolean;
}> {
  return workflow.steps.map(step => ({
    id: step.id,
    title: step.title,
    isCompleted: step.isCompleted,
    isRequired: step.isRequired,
    canStart: areStepDependenciesMet(workflow, step),
  }));
} 