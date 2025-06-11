'use client'

import { useEffect, useState } from 'react'
import { useOnboarding, type OnboardingData } from '@/contexts/onboarding-context'
import { TenantResolver } from '@/lib/middleware/tenant-resolver'

interface TenantOnboardingData {
  tenantId?: string
  status: 'not_started' | 'in_progress' | 'completed'
  lastStep?: string
  createdAt?: string
}

/**
 * Integration wrapper that connects the frontend onboarding flow 
 * to the multi-tenant backend system
 */
export function OnboardingIntegrationWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { onboardingData, updateOnboardingData, currentStepName } = useOnboarding()
  const [tenantData, setTenantData] = useState<TenantOnboardingData>({ status: 'not_started' })
  const [isLoading, setIsLoading] = useState(false)

  // Auto-save onboarding progress to backend
  useEffect(() => {
    if (tenantData.tenantId && onboardingData) {
      saveTenantProgress()
    }
  }, [onboardingData, currentStepName])

  // Initialize or load existing tenant data
  useEffect(() => {
    initializeTenant()
  }, [])

  const initializeTenant = async () => {
    try {
      setIsLoading(true)
      
      // Check if we already have a tenant in progress (stored in localStorage for demo)
      const existingTenantId = localStorage.getItem('onboarding_tenant_id')
      
      if (existingTenantId) {
        // Load existing tenant data
        const response = await fetch(`/api/admin/clients/${existingTenantId}`)
        if (response.ok) {
          const tenant = await response.json()
          setTenantData({
            tenantId: tenant.id,
            status: 'in_progress',
            lastStep: localStorage.getItem('onboarding_last_step') || 'welcome'
          })
          
          // Restore onboarding data from tenant settings
          if (tenant.settings?.onboarding) {
            updateOnboardingData(tenant.settings.onboarding)
          }
        }
      }
    } catch (error) {
      console.error('Error initializing tenant:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveTenantProgress = async () => {
    if (!tenantData.tenantId || isLoading) return

    try {
      const updateData = {
        settings: {
          onboarding: onboardingData,
          onboardingStatus: tenantData.status,
          lastOnboardingStep: currentStepName,
          updatedAt: new Date().toISOString()
        }
      }

      const response = await fetch(`/api/admin/clients/${tenantData.tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        localStorage.setItem('onboarding_last_step', currentStepName)
      }
    } catch (error) {
      console.error('Error saving tenant progress:', error)
    }
  }

  /**
   * Create a new tenant when company profile is completed
   */
  const createTenantFromOnboarding = async (companyProfile: OnboardingData['companyProfile']) => {
    if (!companyProfile || tenantData.tenantId) return

    try {
      setIsLoading(true)

      const slug = companyProfile.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      const tenantCreateData = {
        name: companyProfile.companyName,
        domain: `${slug}.example.com`, // Default domain pattern
        contactEmail: companyProfile.contactEmail,
        isActive: false, // Inactive until onboarding complete
        settings: {
          onboarding: onboardingData,
          onboardingStatus: 'in_progress',
          companyProfile
        }
      }

      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenantCreateData)
      })

      if (response.ok) {
        const newTenant = await response.json()
        setTenantData({
          tenantId: newTenant.id,
          status: 'in_progress',
          lastStep: currentStepName,
          createdAt: new Date().toISOString()
        })

        // Store in localStorage for persistence across sessions
        localStorage.setItem('onboarding_tenant_id', newTenant.id)
        
        return newTenant
      } else {
        throw new Error('Failed to create tenant')
      }
    } catch (error) {
      console.error('Error creating tenant:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Complete onboarding and activate tenant
   */
  const completeOnboarding = async () => {
    if (!tenantData.tenantId) return

    try {
      setIsLoading(true)

      // Update tenant status to active and mark onboarding complete
      const updateData = {
        isActive: true,
        settings: {
          ...onboardingData,
          onboardingStatus: 'completed',
          completedAt: new Date().toISOString()
        }
      }

      const response = await fetch(`/api/admin/clients/${tenantData.tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        setTenantData(prev => ({ ...prev, status: 'completed' }))
        
        // Clear localStorage as onboarding is complete
        localStorage.removeItem('onboarding_tenant_id')
        localStorage.removeItem('onboarding_last_step')

        return await response.json()
      } else {
        throw new Error('Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Deploy the tenant after onboarding completion
   */
  const deployTenant = async (deploymentType: 'path-based' | 'subdomain' | 'custom-domain' = 'path-based') => {
    if (!tenantData.tenantId) return

    try {
      setIsLoading(true)

      const deploymentConfig = {
        tenantId: tenantData.tenantId,
        deploymentType,
        environment: 'staging' as const,
        features: [
          'custom-branding',
          'itinerary-builder',
          'lead-capture'
        ]
      }

      const response = await fetch('/api/admin/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deploymentConfig)
      })

      if (response.ok) {
        const deployment = await response.json()
        return deployment
      } else {
        throw new Error('Failed to deploy tenant')
      }
    } catch (error) {
      console.error('Error deploying tenant:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Provide integration functions to child components
  const integrationContext = {
    tenantData,
    isLoading,
    createTenantFromOnboarding,
    completeOnboarding,
    deployTenant,
    saveTenantProgress
  }

  return (
    <OnboardingIntegrationContext.Provider value={integrationContext}>
      {children}
    </OnboardingIntegrationContext.Provider>
  )
}

// Context for integration functions
import { createContext, useContext } from 'react'

interface OnboardingIntegrationContextType {
  tenantData: TenantOnboardingData
  isLoading: boolean
  createTenantFromOnboarding: (companyProfile: OnboardingData['companyProfile']) => Promise<any>
  completeOnboarding: () => Promise<any>
  deployTenant: (deploymentType?: 'path-based' | 'subdomain' | 'custom-domain') => Promise<any>
  saveTenantProgress: () => Promise<void>
}

const OnboardingIntegrationContext = createContext<OnboardingIntegrationContextType | undefined>(undefined)

export const useOnboardingIntegration = () => {
  const context = useContext(OnboardingIntegrationContext)
  if (context === undefined) {
    throw new Error('useOnboardingIntegration must be used within an OnboardingIntegrationWrapper')
  }
  return context
} 