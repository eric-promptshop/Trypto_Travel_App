'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { 
  TemplateDefinition, 
  TemplateInstance, 
  TemplateConfiguration,
  TemplateEditor,
  TemplateHistoryState,
  TemplateValidationResult,
  ConfiguredComponent,
  TemplateCustomizations,
} from '@/types/templates';
import { DEFAULT_TEMPLATES, getTemplateById } from '@/lib/templates/default-templates';

interface TemplateContextValue {
  // Template library
  availableTemplates: TemplateDefinition[];
  isLoadingTemplates: boolean;
  
  // Current template instance
  currentInstance: TemplateInstance | null;
  isLoadingInstance: boolean;
  
  // Editor state
  editor: TemplateEditor;
  
  // Operations
  loadTemplates: () => Promise<void>;
  createInstance: (templateId: string, clientId: string, name: string) => Promise<TemplateInstance>;
  loadInstance: (instanceId: string) => Promise<TemplateInstance>;
  saveInstance: () => Promise<void>;
  publishInstance: (customDomain?: string) => Promise<string>;
  
  // Editor operations
  selectComponent: (componentId: string | null) => void;
  updateComponent: (componentId: string, updates: Partial<ConfiguredComponent>) => void;
  updateCustomizations: (customizations: Partial<TemplateCustomizations>) => void;
  setPreviewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Validation
  validateTemplate: () => TemplateValidationResult;
  
  // Utils
  isDirty: boolean;
  error: string | null;
}

const TemplateContext = createContext<TemplateContextValue | undefined>(undefined);

interface TemplateProviderProps {
  children: ReactNode;
}

export function TemplateProvider({ children }: TemplateProviderProps) {
  const [availableTemplates, setAvailableTemplates] = useState<TemplateDefinition[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [currentInstance, setCurrentInstance] = useState<TemplateInstance | null>(null);
  const [isLoadingInstance, setIsLoadingInstance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [editor, setEditor] = useState<TemplateEditor>({
    currentTemplate: null,
    selectedComponent: null,
    previewMode: 'desktop',
    isEditing: false,
    isDirty: false,
    history: [],
    historyIndex: -1,
  });

  // Load available templates
  const loadTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    setError(null);

    try {
      // For now, use default templates. In production, this would fetch from API
      setAvailableTemplates(DEFAULT_TEMPLATES);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
      setError(errorMessage);
      console.error('Failed to load templates:', err);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  // Create new template instance
  const createInstance = useCallback(async (
    templateId: string, 
    clientId: string, 
    name: string
  ): Promise<TemplateInstance> => {
    setError(null);

    try {
      const template = getTemplateById(templateId);
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }

      // Create new instance with default configuration
      const instance: TemplateInstance = {
        id: `instance-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        templateId,
        clientId,
        name,
        status: 'draft',
        configuration: {
          components: template.components.map(component => ({
            ...component,
            isVisible: true,
            customContent: {},
            customStyles: {},
            assetMappings: {},
          })),
          globalSettings: template.settings,
          customizations: {
            theme: {
              colors: {},
              fonts: {},
              spacing: {},
            },
            content: {
              brandName: name,
            },
            assets: {},
          },
        },
      };

      // Save to API (placeholder)
      const response = await fetch('/api/templates/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instance),
      });

      if (!response.ok) {
        throw new Error('Failed to create template instance');
      }

      const savedInstance = await response.json();
      setCurrentInstance(savedInstance);
      
      // Initialize editor state
      setEditor(prev => ({
        ...prev,
        currentTemplate: savedInstance,
        isEditing: true,
        isDirty: false,
        history: [{
          id: `history-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Created instance',
          configuration: savedInstance.configuration,
        }],
        historyIndex: 0,
      }));

      return savedInstance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template instance';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Load existing template instance
  const loadInstance = useCallback(async (instanceId: string): Promise<TemplateInstance> => {
    setIsLoadingInstance(true);
    setError(null);

    try {
      const response = await fetch(`/api/templates/instances/${instanceId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load template instance');
      }

      const instance = await response.json();
      setCurrentInstance(instance);
      
      // Initialize editor state
      setEditor(prev => ({
        ...prev,
        currentTemplate: instance,
        isEditing: true,
        isDirty: false,
        selectedComponent: null,
        history: [{
          id: `history-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Loaded instance',
          configuration: instance.configuration,
        }],
        historyIndex: 0,
      }));

      return instance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load template instance';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoadingInstance(false);
    }
  }, []);

  // Save current instance
  const saveInstance = useCallback(async (): Promise<void> => {
    if (!currentInstance) return;

    setError(null);

    try {
      const response = await fetch(`/api/templates/instances/${currentInstance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentInstance),
      });

      if (!response.ok) {
        throw new Error('Failed to save template instance');
      }

      const savedInstance = await response.json();
      setCurrentInstance(savedInstance);
      
      setEditor(prev => ({
        ...prev,
        currentTemplate: savedInstance,
        isDirty: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save template instance';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [currentInstance]);

  // Publish template instance
  const publishInstance = useCallback(async (customDomain?: string): Promise<string> => {
    if (!currentInstance) {
      throw new Error('No template instance to publish');
    }

    setError(null);

    try {
      const response = await fetch(`/api/templates/instances/${currentInstance.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: currentInstance.id,
          publishSettings: {
            customDomain,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish template instance');
      }

      const result = await response.json();
      
      // Update instance status
      const updatedInstance: TemplateInstance = {
        ...currentInstance,
        status: 'published',
        publishedAt: new Date().toISOString(),
        url: result.url,
        ...(customDomain && { customDomain }),
      };
      
      setCurrentInstance(updatedInstance);
      setEditor(prev => ({
        ...prev,
        currentTemplate: updatedInstance,
      }));

      return result.url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish template instance';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [currentInstance]);

  // Add history state
  const addHistoryState = useCallback((action: string, configuration: TemplateConfiguration) => {
    setEditor(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      const newState: TemplateHistoryState = {
        id: `history-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action,
        configuration,
      };
      
      newHistory.push(newState);
      
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: true,
      };
    });
  }, []);

  // Select component
  const selectComponent = useCallback((componentId: string | null) => {
    setEditor(prev => ({
      ...prev,
      selectedComponent: componentId,
    }));
  }, []);

  // Update component
  const updateComponent = useCallback((
    componentId: string, 
    updates: Partial<ConfiguredComponent>
  ) => {
    if (!currentInstance) return;

    const updatedConfiguration = {
      ...currentInstance.configuration,
      components: currentInstance.configuration.components.map(component =>
        component.id === componentId
          ? { ...component, ...updates }
          : component
      ),
    };

    setCurrentInstance(prev => prev ? {
      ...prev,
      configuration: updatedConfiguration,
    } : null);

    addHistoryState(`Updated component ${componentId}`, updatedConfiguration);
  }, [currentInstance, addHistoryState]);

  // Update customizations
  const updateCustomizations = useCallback((customizations: Partial<TemplateCustomizations>) => {
    if (!currentInstance) return;

    const updatedConfiguration = {
      ...currentInstance.configuration,
      customizations: {
        ...currentInstance.configuration.customizations,
        ...customizations,
      },
    };

    setCurrentInstance(prev => prev ? {
      ...prev,
      configuration: updatedConfiguration,
    } : null);

    addHistoryState('Updated customizations', updatedConfiguration);
  }, [currentInstance, addHistoryState]);

  // Set preview mode
  const setPreviewMode = useCallback((mode: 'desktop' | 'tablet' | 'mobile') => {
    setEditor(prev => ({
      ...prev,
      previewMode: mode,
    }));
  }, []);

  // Undo
  const undo = useCallback(() => {
    if (!currentInstance || editor.historyIndex <= 0) return;

    const previousState = editor.history[editor.historyIndex - 1];
    if (!previousState) return;
    
    setCurrentInstance(prev => prev ? {
      ...prev,
      configuration: previousState.configuration,
    } : null);

    setEditor(prev => ({
      ...prev,
      historyIndex: prev.historyIndex - 1,
      isDirty: prev.historyIndex - 1 > 0,
    }));
  }, [currentInstance, editor.historyIndex, editor.history]);

  // Redo
  const redo = useCallback(() => {
    if (!currentInstance || editor.historyIndex >= editor.history.length - 1) return;

    const nextState = editor.history[editor.historyIndex + 1];
    if (!nextState) return;
    
    setCurrentInstance(prev => prev ? {
      ...prev,
      configuration: nextState.configuration,
    } : null);

    setEditor(prev => ({
      ...prev,
      historyIndex: prev.historyIndex + 1,
      isDirty: true,
    }));
  }, [currentInstance, editor.historyIndex, editor.history]);

  // Validate template
  const validateTemplate = useCallback((): TemplateValidationResult => {
    if (!currentInstance) {
      return {
        isValid: false,
        errors: [{ type: 'invalid-configuration', message: 'No template instance loaded', suggestions: [] }],
        warnings: [],
      };
    }

    const errors = [];
    const warnings = [];

    // Check for missing required components
    const requiredComponents = currentInstance.configuration.components.filter(c => c.isRequired);
    for (const component of requiredComponents) {
      if (!component.isVisible) {
        errors.push({
          type: 'missing-required-prop' as const,
          componentId: component.id,
          message: `Required component "${component.name}" is hidden`,
          suggestions: ['Make the component visible or replace it with an alternative'],
        });
      }
    }

    // Check for missing brand name
    if (!currentInstance.configuration.customizations.content.brandName?.trim()) {
      errors.push({
        type: 'missing-required-prop' as const,
        message: 'Brand name is required',
        suggestions: ['Add a brand name in the customizations panel'],
      });
    }

    // Accessibility warnings
    const imageComponents = currentInstance.configuration.components.filter(c => 
      c.type === 'hero' || c.type === 'gallery'
    );
    
    for (const component of imageComponents) {
      if (!component.props.altText && !component.customContent?.altText) {
        warnings.push({
          type: 'accessibility' as const,
          componentId: component.id,
          message: `Image component "${component.name}" is missing alt text`,
          severity: 'high' as const,
          suggestions: ['Add descriptive alt text for accessibility'],
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [currentInstance]);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Computed values
  const canUndo = editor.historyIndex > 0;
  const canRedo = editor.historyIndex < editor.history.length - 1;
  const isDirty = editor.isDirty;

  const contextValue: TemplateContextValue = {
    availableTemplates,
    isLoadingTemplates,
    currentInstance,
    isLoadingInstance,
    editor,
    loadTemplates,
    createInstance,
    loadInstance,
    saveInstance,
    publishInstance,
    selectComponent,
    updateComponent,
    updateCustomizations,
    setPreviewMode,
    undo,
    redo,
    canUndo,
    canRedo,
    validateTemplate,
    isDirty,
    error,
  };

  return (
    <TemplateContext.Provider value={contextValue}>
      {children}
    </TemplateContext.Provider>
  );
}

// Hook to use template context
export function useTemplate(): TemplateContextValue {
  const context = useContext(TemplateContext);
  
  if (context === undefined) {
    throw new Error('useTemplate must be used within a TemplateProvider');
  }
  
  return context;
}

// Hook to get current template instance
export function useCurrentTemplate(): TemplateInstance | null {
  const { currentInstance } = useTemplate();
  return currentInstance;
}

// Hook to get selected component
export function useSelectedComponent(): ConfiguredComponent | null {
  const { currentInstance, editor } = useTemplate();
  
  if (!currentInstance || !editor.selectedComponent) return null;
  
  return currentInstance.configuration.components.find(
    c => c.id === editor.selectedComponent
  ) || null;
} 