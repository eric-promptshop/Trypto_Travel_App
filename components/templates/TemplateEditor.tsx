'use client';

import React, { useState, useCallback } from 'react';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Save, 
  Eye, 
  Undo, 
  Redo, 
  Settings,
  Layers,
  Palette,
  Type,
  Upload,
  AlertTriangle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useTemplate, 
  useCurrentTemplate, 
  useSelectedComponent 
} from '@/contexts/TemplateContext';
import { AssetManager } from '@/components/assets/AssetManager';
import { ComponentEditor } from './ComponentEditor';
import { TemplatePreview } from './TemplatePreview';
import { TemplateValidationResult, ConfiguredComponent } from '@/types/templates';

interface TemplateEditorProps {
  instanceId?: string;
  onPublish?: (url: string) => void;
  onSave?: () => void;
}

export function TemplateEditor({ instanceId, onPublish, onSave }: TemplateEditorProps) {
  const [activeTab, setActiveTab] = useState<'components' | 'assets' | 'settings'>('components');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResults, setValidationResults] = useState<TemplateValidationResult | null>(null);

  const {
    currentInstance,
    editor,
    setPreviewMode,
    selectComponent,
    updateCustomizations,
    saveInstance,
    publishInstance,
    validateTemplate,
    undo,
    redo,
    canUndo,
    canRedo,
    isDirty,
    error,
  } = useTemplate();

  const selectedComponent = useSelectedComponent();

  // Handle save
  const handleSave = useCallback(async () => {
    if (!currentInstance) return;

    setIsSaving(true);
    try {
      await saveInstance();
      onSave?.();
    } catch (err) {
      console.error('Failed to save template:', err);
    } finally {
      setIsSaving(false);
    }
  }, [currentInstance, saveInstance, onSave]);

  // Handle publish
  const handlePublish = useCallback(async () => {
    if (!currentInstance) return;

    // Validate before publishing
    const validation = validateTemplate();
    setValidationResults(validation);

    if (!validation.isValid) {
      return;
    }

    setIsPublishing(true);
    try {
      const url = await publishInstance();
      onPublish?.(url);
    } catch (err) {
      console.error('Failed to publish template:', err);
    } finally {
      setIsPublishing(false);
    }
  }, [currentInstance, validateTemplate, publishInstance, onPublish]);

  // Handle validation
  const handleValidate = useCallback(() => {
    const results = validateTemplate();
    setValidationResults(results);
  }, [validateTemplate]);

  // Handle component selection from preview
  const handleComponentSelect = useCallback((componentId: string) => {
    selectComponent(componentId);
    setActiveTab('components');
  }, [selectComponent]);

  if (!currentInstance) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No template instance loaded</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{currentInstance.name}</h2>
            <Badge variant={currentInstance.status === 'published' ? 'default' : 'secondary'}>
              {currentInstance.status}
            </Badge>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={redo}
              disabled={!canRedo}
            >
              <Redo className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>

          {/* Preview mode controls */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button
              size="sm"
              variant={editor.previewMode === 'desktop' ? 'default' : 'ghost'}
              onClick={() => setPreviewMode('desktop')}
              className="flex-1"
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.previewMode === 'tablet' ? 'default' : 'ghost'}
              onClick={() => setPreviewMode('tablet')}
              className="flex-1"
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.previewMode === 'mobile' ? 'default' : 'ghost'}
              onClick={() => setPreviewMode('mobile')}
              className="flex-1"
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <Alert className="m-4" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Validation results */}
        {validationResults && (
          <div className="mx-4 mb-4">
            {validationResults.errors.length > 0 && (
              <Alert variant="destructive" className="mb-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {validationResults.errors.length} error(s) found
                </AlertDescription>
              </Alert>
            )}
            {validationResults.warnings.length > 0 && (
              <Alert className="mb-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {validationResults.warnings.length} warning(s) found
                </AlertDescription>
              </Alert>
            )}
            {validationResults.isValid && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Template is ready to publish</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Main content tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4">
            <TabsTrigger value="components" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Components
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="components" className="h-full">
              <ScrollArea className="h-full px-4">
                <div className="space-y-4">
                  {/* Component list */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Page Components</h3>
                    <div className="space-y-2">
                      {currentInstance.configuration.components.map((component) => (
                        <Card 
                          key={component.id}
                          className={`cursor-pointer transition-colors ${
                            selectedComponent?.id === component.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => selectComponent(component.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{component.name}</p>
                                <p className="text-xs text-muted-foreground">{component.type}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {component.isRequired && (
                                  <Badge variant="secondary" className="text-xs">Required</Badge>
                                )}
                                {!component.isVisible && (
                                  <Badge variant="outline" className="text-xs">Hidden</Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Component editor */}
                  {selectedComponent && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-medium mb-2">Edit Component</h3>
                        <ComponentEditor 
                          component={selectedComponent}
                          onUpdate={(updates: Partial<ConfiguredComponent>) => {
                            // Handle component updates
                            console.log('Component updates:', updates);
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="assets" className="h-full">
              <div className="h-full px-4">
                <AssetManager
                  clientId={currentInstance.clientId}
                  selectionMode={true}
                  onAssetSelect={(asset) => {
                    // Handle asset selection for component
                    console.log('Asset selected:', asset);
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="h-full">
              <ScrollArea className="h-full px-4">
                <div className="space-y-4">
                  {/* Global settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Template Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Template Name</label>
                        <input
                          type="text"
                          value={currentInstance.name}
                          onChange={(e) => {
                            // Update template name
                            console.log('Update name:', e.target.value);
                          }}
                          className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Theme settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Theme
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Customize colors, fonts, and spacing
                      </p>
                    </CardContent>
                  </Card>

                  {/* Typography settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Typography
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Adjust fonts and text styles
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer actions */}
        <div className="p-4 border-t space-y-2">
          <Button
            onClick={handleValidate}
            variant="outline"
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            Validate Template
          </Button>
          
          <Button
            onClick={handlePublish}
            disabled={isPublishing || (validationResults?.isValid === false)}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {isPublishing ? 'Publishing...' : 'Publish Template'}
          </Button>
        </div>
      </div>

      {/* Main preview area */}
      <div className="flex-1 bg-muted/30">
        <TemplatePreview
          instance={currentInstance}
          previewMode={editor.previewMode}
          selectedComponentId={selectedComponent?.id}
          onComponentSelect={handleComponentSelect}
        />
      </div>
    </div>
  );
} 