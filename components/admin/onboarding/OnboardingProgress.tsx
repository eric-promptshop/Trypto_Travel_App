'use client';

import type { OnboardingWorkflow } from '@/lib/onboarding/workflow';
import { getWorkflowProgress } from '@/lib/onboarding/workflow';

interface OnboardingProgressProps {
  workflow: OnboardingWorkflow;
}

export function OnboardingProgress({ workflow }: OnboardingProgressProps) {
  const progress = getWorkflowProgress(workflow);
  const completedSteps = workflow.steps.filter(step => step.isCompleted).length;
  const totalSteps = workflow.steps.filter(step => step.isRequired).length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Setup Progress
        </span>
        <span className="text-sm text-gray-500">
          {completedSteps} of {totalSteps} steps completed
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Getting Started</span>
        <span>Ready to Launch</span>
      </div>
    </div>
  );
} 