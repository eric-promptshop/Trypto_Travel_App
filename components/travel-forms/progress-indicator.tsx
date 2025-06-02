"use client"

import * as React from "react"
import { Check, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface Step {
  id: string
  title: string
  description?: string
  icon?: React.ElementType
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number
  className?: string
  showLabels?: boolean
  showProgress?: boolean
  onStepClick?: (stepIndex: number) => void
  allowClickback?: boolean
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  className,
  showLabels = true,
  showProgress = true,
  onStepClick,
  allowClickback = false
}) => {
  const progressValue = ((currentStep + 1) / steps.length) * 100
  const progressId = React.useId()
  const stepsId = React.useId()

  // Handle keyboard navigation
  const handleStepKeyDown = (event: React.KeyboardEvent, stepIndex: number) => {
    const isClickable = allowClickback && (stepIndex < currentStep || stepIndex === currentStep) && onStepClick
    
    if (!isClickable) return

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        onStepClick(stepIndex)
        break
      case 'ArrowLeft':
        event.preventDefault()
        // Navigate to previous clickable step
        for (let i = stepIndex - 1; i >= 0; i--) {
          if (i <= currentStep) {
            onStepClick(i)
            break
          }
        }
        break
      case 'ArrowRight':
        event.preventDefault()
        // Navigate to next clickable step
        for (let i = stepIndex + 1; i < steps.length; i++) {
          if (i <= currentStep) {
            onStepClick(i)
            break
          }
        }
        break
      case 'Home':
        event.preventDefault()
        // Go to first clickable step
        onStepClick(0)
        break
      case 'End':
        event.preventDefault()
        // Go to last clickable step (current step)
        onStepClick(currentStep)
        break
    }
  }

  return (
    <div className={cn("space-y-4", className)} role="region" aria-labelledby={progressId}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="sr-only" id={progressId}>
            Form Progress: Step {currentStep + 1} of {steps.length}
          </div>
          <Progress 
            value={progressValue} 
            className="h-2"
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-labelledby={progressId}
          />
          <div className="text-xs text-muted-foreground text-center" aria-live="polite">
            {currentStep + 1} of {steps.length} completed
          </div>
        </div>
      )}

      {/* Step Indicators */}
      <div 
        className="flex items-center justify-between" 
        role="tablist" 
        aria-labelledby={stepsId}
        aria-orientation="horizontal"
      >
        <div className="sr-only" id={stepsId}>Form Steps</div>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isClickable = allowClickback && (isCompleted || isCurrent) && onStepClick
          const Icon = step.icon

          // Generate detailed aria-label
          const getAriaLabel = () => {
            const stepNumber = `Step ${index + 1} of ${steps.length}`
            const stepTitle = step.title
            const status = isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming'
            const clickable = isClickable ? ', clickable' : ''
            return `${stepNumber}: ${stepTitle}, ${status}${clickable}`
          }

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center space-y-2">
                {/* Step Circle */}
                <button
                  type="button"
                  onClick={() => isClickable ? onStepClick(index) : undefined}
                  onKeyDown={(e) => handleStepKeyDown(e, index)}
                  disabled={!isClickable}
                  role="tab"
                  aria-selected={isCurrent}
                  aria-label={getAriaLabel()}
                  aria-describedby={step.description ? `${step.id}-desc` : undefined}
                  tabIndex={isCurrent ? 0 : (isClickable ? -1 : undefined)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && !isCompleted && "border-primary bg-background text-primary",
                    !isCurrent && !isCompleted && "border-muted bg-muted text-muted-foreground",
                    isClickable && "cursor-pointer hover:scale-105 hover:border-primary/50",
                    !isClickable && "cursor-default"
                  )}
                >
                  {isCompleted ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span className="sr-only">Completed</span>
                    </>
                  ) : Icon ? (
                    <Icon className="w-5 h-5" />
                  ) : (
                    <span aria-hidden="true">{index + 1}</span>
                  )}
                </button>

                {/* Step Label */}
                {showLabels && (
                  <div className="text-center max-w-24">
                    <div className={cn(
                      "text-xs font-medium",
                      (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.title}
                    </div>
                    {step.description && (
                      <div 
                        className="text-xs text-muted-foreground mt-1"
                        id={`${step.id}-desc`}
                      >
                        {step.description}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <ChevronRight 
                  className="w-4 h-4 text-muted-foreground mx-2 hidden sm:block" 
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Mobile: Current Step Info */}
      <div className="sm:hidden text-center" aria-live="polite">
        <div className="text-sm font-medium">
          {steps[currentStep]?.title}
        </div>
        {steps[currentStep]?.description && (
          <div className="text-xs text-muted-foreground">
            {steps[currentStep].description}
          </div>
        )}
      </div>

      {/* Screen Reader Instructions */}
      <div className="sr-only" aria-live="polite">
        {allowClickback && onStepClick && (
          <p>
            Use arrow keys to navigate between completed steps, Enter or Space to select a step.
            Press Home to go to the first step, End to go to the current step.
          </p>
        )}
      </div>
    </div>
  )
} 