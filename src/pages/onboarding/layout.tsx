import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { OnboardingProvider } from "@/contexts/onboarding-context"
import { OnboardingProgressBar } from "@/components/onboarding/onboarding-progress-bar"
import { TripNavLogo } from "@/components/ui/TripNavLogo"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TripNav Onboarding - Set Up Your AI Trip Builder",
  description: "Configure your AI-powered trip builder in just a few steps",
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <OnboardingProvider>
          {/* Header with TripNav Logo */}
          <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="container mx-auto px-4 py-4">
              <TripNavLogo />
            </div>
          </header>

          {/* Progress Bar */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="container mx-auto px-4 py-3">
              <OnboardingProgressBar />
            </div>
          </div>

          {/* Main Content */}
          <main className="min-h-screen bg-gray-50">{children}</main>
        </OnboardingProvider>
      </body>
    </html>
  )
}
