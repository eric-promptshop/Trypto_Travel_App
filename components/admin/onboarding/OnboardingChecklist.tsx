'use client';

interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  isRequired: boolean;
  canStart: boolean;
}

interface OnboardingChecklistProps {
  checklist: ChecklistItem[];
  currentStepId: string;
  onStepSelect: (stepId: string) => void;
}

export function OnboardingChecklist({ 
  checklist, 
  currentStepId, 
  onStepSelect 
}: OnboardingChecklistProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Setup Checklist</h3>
      
      <div className="space-y-2">
        {checklist.map((item) => (
          <button
            key={item.id}
            onClick={() => onStepSelect(item.id)}
            disabled={!item.canStart && !item.isCompleted}
            className={`w-full text-left p-3 rounded-md border transition-all ${
              item.id === currentStepId
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                : item.isCompleted
                ? 'border-green-200 bg-green-50 hover:bg-green-100'
                : item.canStart
                ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-3">
                {item.isCompleted ? (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : item.id === currentStepId ? (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                ) : item.canStart ? (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                ) : (
                  <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${
                  item.isCompleted 
                    ? 'text-green-800' 
                    : item.id === currentStepId 
                    ? 'text-blue-800' 
                    : item.canStart 
                    ? 'text-gray-900' 
                    : 'text-gray-500'
                }`}>
                  {item.title}
                </div>
                
                <div className="flex items-center mt-1">
                  {item.isRequired && (
                    <span className="text-xs text-red-600 mr-2">Required</span>
                  )}
                  
                  <span className={`text-xs ${
                    item.isCompleted 
                      ? 'text-green-600' 
                      : item.id === currentStepId 
                      ? 'text-blue-600' 
                      : item.canStart 
                      ? 'text-gray-500' 
                      : 'text-gray-400'
                  }`}>
                    {item.isCompleted 
                      ? 'Completed' 
                      : item.id === currentStepId 
                      ? 'In Progress' 
                      : item.canStart 
                      ? 'Ready' 
                      : 'Locked'
                    }
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Completed
          </div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            Current
          </div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 border-2 border-gray-300 rounded-full mr-2"></div>
            Available
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-200 rounded-full mr-2"></div>
            Locked
          </div>
        </div>
      </div>
    </div>
  );
} 