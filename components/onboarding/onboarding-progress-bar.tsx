"use client"

import { Progress } from "@/components/ui/progress"
import { useOnboarding, onboardingSteps } from "@/contexts/onboarding-context"

export function OnboardingProgressBar() {
  const { currentStepIndex, totalSteps } = useOnboarding()
  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100
  const currentStepDetails = onboardingSteps[currentStepIndex]

  return (
    <div className="sticky top-0 z-50 bg-white shadow-sm py-3 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-primary-blue">{currentStepDetails?.title || "Onboarding"}</span>
          <span className="text-sm text-slate-600">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
        </div>
        <Progress value={progressPercentage} className="w-full h-2 [&>div]:bg-accent-orange" />
      </div>
    </div>
  )
}
