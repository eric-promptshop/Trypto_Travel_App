'use client';

import React from 'react';
import { ConfiguredComponent } from '@/types/templates';

interface ComponentEditorProps {
  component: ConfiguredComponent;
  onUpdate: (updates: Partial<ConfiguredComponent>) => void;
}

export function ComponentEditor({ component, onUpdate }: ComponentEditorProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Component editor for {component.name} coming soon...
      </p>
    </div>
  );
} 