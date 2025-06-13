"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

export interface OnboardingData {
  companyProfile?: {
    companyName: string
    websiteUrl: string
    contactEmail: string
    phoneNumber?: string
    primaryDestinations: string[]
    companyType: "custom" | "group" | "both"
    averageTripValue: string
    monthlyLeads: string
  }
  contentImport?: {
    method?: "scan" | "upload" | "manual"
    importedToursCount?: number
    tours?: Array<{ id: string; name: string; destination: string; duration: string; status: "enabled" | "disabled" }>
  }
  pricingConfig?: {
    matrix: Array<{ id: string; destination: string; star3: string; star4: string; star5: string }>
    includeMargin: boolean
    displayRanges: boolean
  }
  branding?: {
    logoUrl?: string
    logoFile?: File
    primaryColor: string
    secondaryColor?: string
    font: "Inter" | "Georgia" | "Open Sans" | "Roboto"
  }
  integrations?: {
    crm?: "hubspot" | "salesforce" | "zoho" | "email"
    hubspotApiKey?: string
    hubspotPipeline?: string
    hubspotLeadAssignee?: string
    emailRecipients?: string[]
    emailFormat?: "simple" | "detailed"
  }
  registration?: {
    email: string
    firstName: string
    lastName: string
    userId?: string
    completed?: boolean
  }
  tenantId?: string
  isReadyToLaunch?: boolean
}

interface OnboardingContextType {
  onboardingData: OnboardingData
  updateOnboardingData: (data: Partial<OnboardingData>) => void
  currentStepIndex: number
  totalSteps: number
  navigateToNextStep: () => void
  navigateToPrevStep: () => void
  navigateToStep: (stepName: string) => void
  currentStepName: string
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export const onboardingSteps = [
  { name: "welcome", path: "/onboarding/welcome", title: "Welcome" },
  { name: "company-profile", path: "/onboarding/company-profile", title: "Company Profile" },
  { name: "content-import", path: "/onboarding/content-import", title: "Content Import" },
  { name: "pricing", path: "/onboarding/pricing", title: "Pricing Configuration" },
  { name: "branding", path: "/onboarding/branding", title: "Branding Customization" },
  { name: "integrations", path: "/onboarding/integrations", title: "CRM & Integrations" },
  { name: "registration", path: "/onboarding/registration", title: "Account Registration" },
  { name: "review", path: "/onboarding/review", title: "Review & Launch" },
]

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    branding: { primaryColor: "#1f5582", font: "Inter" }, // Default branding
    pricingConfig: { matrix: [], includeMargin: true, displayRanges: true },
  })
  const router = useRouter()
  const pathname = usePathname()

  const currentStepIndex = onboardingSteps.findIndex((step) => step.path === pathname)
  const currentStepName = onboardingSteps[currentStepIndex]?.name || "welcome"

  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...data }))
  }

  const navigateToNextStep = () => {
    if (currentStepIndex < onboardingSteps.length - 1) {
      const nextStep = onboardingSteps[currentStepIndex + 1]
      if (nextStep) {
        router.push(nextStep.path)
      }
    }
  }

  const navigateToPrevStep = () => {
    if (currentStepIndex > 0) {
      const prevStep = onboardingSteps[currentStepIndex - 1]
      if (prevStep) {
        router.push(prevStep.path)
      }
    }
  }

  const navigateToStep = (stepName: string) => {
    const step = onboardingSteps.find((s) => s.name === stepName)
    if (step) {
      router.push(step.path)
    }
  }

  return (
    <OnboardingContext.Provider
      value={{
        onboardingData,
        updateOnboardingData,
        currentStepIndex: currentStepIndex >= 0 ? currentStepIndex : 0,
        totalSteps: onboardingSteps.length,
        navigateToNextStep,
        navigateToPrevStep,
        navigateToStep,
        currentStepName,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
