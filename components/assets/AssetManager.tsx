'use client';

import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Upload, Grid, List, Trash2 } from 'lucide-react';
import { AssetUpload } from './AssetUpload';
import { AssetGallery } from './AssetGallery';
import { useAssetManager } from '@/contexts/AssetManagerContext';
import { AssetMetadata } from '@/types/assets';

interface AssetManagerProps {
  clientId: string;
  onAssetSelect?: (asset: AssetMetadata) => void;
  selectionMode?: boolean;
  selectedAssets?: string[];
}

export function AssetManager({ 
  clientId, 
  onAssetSelect,
  selectionMode = false,
  selectedAssets = []
}: AssetManagerProps) {
  const { 
    assets, 
    isLoading, 
    error, 
    deleteAsset, 
    refreshAssets 
  } = useAssetManager();
  
  const [activeTab, setActiveTab] = useState('gallery');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(selectedAssets);

  // Handle asset upload completion
  const handleUploadComplete = useCallback((assetId: string) => {
    setActiveTab('gallery'); // Switch to gallery after upload
    refreshAssets(); // Refresh the asset list
  }, [refreshAssets]);

  // Handle asset deletion
  const handleAssetDelete = useCallback(async (assetId: string) => {
    try {
      await deleteAsset(assetId);
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  }, [deleteAsset]);

  // Handle asset selection
  const handleAssetSelect = useCallback((asset: AssetMetadata) => {
    if (selectionMode) {
      const isSelected = selectedAssetIds.includes(asset.id);
      const updatedSelection = isSelected
        ? selectedAssetIds.filter(id => id !== asset.id)
        : [...selectedAssetIds, asset.id];
      
      setSelectedAssetIds(updatedSelection);
      
      if (onAssetSelect) {
        onAssetSelect(asset);
      }
    }
  }, [selectionMode, selectedAssetIds, onAssetSelect]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedAssetIds.length === 0) return;
    
    const confirmDelete = confirm(
      `Are you sure you want to delete ${selectedAssetIds.length} assets? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    try {
      await Promise.all(selectedAssetIds.map(id => deleteAsset(id)));
      setSelectedAssetIds([]);
    } catch (error) {
      console.error('Failed to delete assets:', error);
    }
  }, [selectedAssetIds, deleteAsset]);

  // Filter assets for current client
  const clientAssets = assets.filter(asset => asset.clientId === clientId);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Asset Management</h2>
          <p className="text-muted-foreground">
            Upload and manage your branding assets
          </p>
        </div>
        
        {/* Bulk Actions */}
        {selectionMode && selectedAssetIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedAssetIds.length} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Gallery ({clientAssets.length})
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Assets
          </TabsTrigger>
        </TabsList>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-4">
          <AssetGallery
            assets={clientAssets}
            isLoading={isLoading}
            error={error}
            onAssetDelete={handleAssetDelete}
            onAssetSelect={handleAssetSelect}
            selectedAssets={selectedAssetIds}
            selectionMode={selectionMode}
            emptyStateMessage={`No assets found for this client. Switch to the Upload tab to add some assets.`}
          />
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <AssetUpload
            clientId={clientId}
            onUploadComplete={handleUploadComplete}
            maxFiles={10}
          />
        </TabsContent>
      </Tabs>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold">{clientAssets.length}</div>
          <div className="text-sm text-muted-foreground">Total Assets</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">
            {clientAssets.filter(a => a.usage.includes('logo-light') || a.usage.includes('logo-dark')).length}
          </div>
          <div className="text-sm text-muted-foreground">Logos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">
            {clientAssets.filter(a => a.usage.includes('hero-image')).length}
          </div>
          <div className="text-sm text-muted-foreground">Hero Images</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">
            {Math.round(clientAssets.reduce((sum, asset) => sum + asset.size, 0) / 1024 / 1024)}MB
          </div>
          <div className="text-sm text-muted-foreground">Total Size</div>
        </div>
      </div>
    </div>
  );
} 