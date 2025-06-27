'use client';

import { useState, useEffect } from 'react';
import type { 
  OnboardingWorkflow, 
  OnboardingStep
} from '@/lib/onboarding/workflow';
import { 
  createOnboardingWorkflow,
  getCurrentStep,
  getNextStep,
  completeStep,
  getWorkflowProgress,
  generateOnboardingChecklist
} from '@/lib/onboarding/workflow';
import { OnboardingStepRenderer } from './OnboardingStepRenderer';
import { OnboardingProgress } from './OnboardingProgress';
import { OnboardingChecklist } from './OnboardingChecklist';

interface OnboardingWorkflowProps {
  tenantId: string;
  onComplete?: (workflow: OnboardingWorkflow) => void;
  onStepComplete?: (stepId: string, data: any) => void;
  initialWorkflow?: OnboardingWorkflow;
}

export function OnboardingWorkflow({
  tenantId,
  onComplete,
  onStepComplete,
  initialWorkflow
}: OnboardingWorkflowProps) {
  const [workflow, setWorkflow] = useState<OnboardingWorkflow | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);

  // Initialize workflow
  useEffect(() => {
    if (initialWorkflow) {
      setWorkflow(initialWorkflow);
      setCurrentStep(getCurrentStep(initialWorkflow));
    } else {
      const newWorkflow = createOnboardingWorkflow(tenantId);
      setWorkflow(newWorkflow);
      setCurrentStep(getCurrentStep(newWorkflow));
    }
  }, [tenantId, initialWorkflow]);

  const handleStepComplete = async (stepId: string, data: any) => {
    if (!workflow) return;

    setIsLoading(true);
    setError(null);

    try {
      const updatedWorkflow = completeStep(workflow, stepId, data);
      setWorkflow(updatedWorkflow);
      setCurrentStep(getCurrentStep(updatedWorkflow));

      // Call the callback
      onStepComplete?.(stepId, data);

      // Check if workflow is complete
      if (updatedWorkflow.isCompleted) {
        onComplete?.(updatedWorkflow);
      }

      // TODO: Save workflow to backend
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete step';
      setError(errorMessage);
      console.error('Error completing step:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepBack = () => {
    if (!workflow || !currentStep) return;

    const currentIndex = workflow.steps.findIndex(step => step.id === currentStep.id);
    if (currentIndex > 0) {
      const previousStep = workflow.steps[currentIndex - 1];
      if (previousStep) {
        setCurrentStep(previousStep);
      }
    }
  };

  const handleStepSkip = () => {
    if (!workflow || !currentStep || currentStep.isRequired) return;

    const nextStep = getNextStep(workflow);
    if (nextStep) {
      setCurrentStep(nextStep);
    }
  };

  const handleStepSelect = (stepId: string) => {
    if (!workflow) return;

    const step = workflow.steps.find(s => s.id === stepId);
    if (step) {
      setCurrentStep(step);
    }
  };

  if (!workflow || !currentStep) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing onboarding workflow...</p>
        </div>
      </div>
    );
  }

  const progress = getWorkflowProgress(workflow);
  const checklist = generateOnboardingChecklist(workflow);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Onboarding</h1>
            <p className="text-gray-600 mt-2">
              Set up your white-label travel platform step by step
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowChecklist(!showChecklist)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {showChecklist ? 'Hide' : 'Show'} Checklist
            </button>
            
            <div className="text-sm text-gray-500">
              Progress: {progress}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <OnboardingProgress workflow={workflow} />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - Checklist */}
        {showChecklist && (
          <div className="col-span-3">
            <OnboardingChecklist
              checklist={checklist}
              currentStepId={currentStep.id}
              onStepSelect={handleStepSelect}
            />
          </div>
        )}

        {/* Main Content */}
        <div className={showChecklist ? 'col-span-9' : 'col-span-12'}>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="inline-flex text-red-400 hover:text-red-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-md">
            <OnboardingStepRenderer
              step={currentStep}
              onComplete={handleStepComplete}
              onBack={handleStepBack}
              onSkip={handleStepSkip}
              isLoading={isLoading}
              canGoBack={workflow.steps.findIndex(s => s.id === currentStep.id) > 0}
              canSkip={!currentStep.isRequired}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 