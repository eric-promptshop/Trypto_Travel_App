'use client';

import React from 'react';
import { TemplateInstance } from '@/types/templates';

interface TemplatePreviewProps {
  instance: TemplateInstance;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  selectedComponentId?: string;
  onComponentSelect: (componentId: string) => void;
}

export function TemplatePreview({ 
  instance, 
  previewMode, 
  selectedComponentId, 
  onComponentSelect 
}: TemplatePreviewProps) {
  return (
    <div className="h-full p-8 flex items-center justify-center">
      <div 
        className={`bg-white shadow-lg transition-all duration-300 ${
          previewMode === 'mobile' ? 'w-96 max-w-sm' : 
          previewMode === 'tablet' ? 'w-3/4 max-w-4xl' : 
          'w-full max-w-6xl'
        }`}
        style={{ aspectRatio: previewMode === 'mobile' ? '9/16' : '16/10' }}
      >
        <div className="h-full border border-border rounded-lg overflow-hidden">
          <div className="p-8 h-full flex items-center justify-center text-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">{instance.name}</h2>
              <p className="text-muted-foreground mb-4">
                Template preview for {previewMode} view
              </p>
              <div className="space-y-2">
                {instance.configuration.components.map((component) => (
                  <div
                    key={component.id}
                    className={`p-2 border rounded cursor-pointer transition-colors ${
                      selectedComponentId === component.id ? 'bg-primary/10 border-primary' : 'border-border'
                    }`}
                    onClick={() => onComponentSelect(component.id)}
                  >
                    <span className="text-sm">{component.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 