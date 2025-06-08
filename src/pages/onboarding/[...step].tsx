"use client"

import type React from "react"
import { useParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"

import { WelcomeScreen } from "@/components/onboarding/screens/welcome-screen"
import { CompanyProfileScreen } from "@/components/onboarding/screens/company-profile-screen"
import { ContentImportScreen } from "@/components/onboarding/screens/content-import-screen"
import { PricingConfigurationScreen } from "@/components/onboarding/screens/pricing-configuration-screen"
import { BrandingCustomizationScreen } from "@/components/onboarding/screens/branding-customization-screen"
import { CrmIntegrationsScreen } from "@/components/onboarding/screens/crm-integrations-screen"
import { ReviewLaunchScreen } from "@/components/onboarding/screens/review-launch-screen"
import { useOnboarding } from "@/contexts/onboarding-context"

const stepComponents: { [key: string]: React.ComponentType } = {
  welcome: WelcomeScreen,
  "company-profile": CompanyProfileScreen,
  "content-import": ContentImportScreen,
  pricing: PricingConfigurationScreen,
  branding: BrandingCustomizationScreen,
  integrations: CrmIntegrationsScreen,
  review: ReviewLaunchScreen,
}

export default function OnboardingStepPage() {
  const params = useParams()
  const { currentStepName } = useOnboarding()

  // Ensure currentStepName is valid before trying to access stepComponents
  const StepComponent =
    currentStepName && stepComponents[currentStepName] ? stepComponents[currentStepName] : stepComponents["welcome"] // Fallback to welcome or a loading/error component

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStepName}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto"
      >
        <StepComponent />
      </motion.div>
    </AnimatePresence>
  )
}
