import { OnboardingProvider } from '@/contexts/onboarding-context'
import { OnboardingIntegrationWrapper } from '@/components/onboarding/OnboardingIntegrationWrapper'
import { OnboardingProgressBar } from '@/components/onboarding/onboarding-progress-bar'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OnboardingProvider>
      <OnboardingIntegrationWrapper>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
          <OnboardingProgressBar />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </OnboardingIntegrationWrapper>
    </OnboardingProvider>
  )
} 