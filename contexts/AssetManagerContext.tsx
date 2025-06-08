'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { 
  AssetMetadata, 
  AssetManagerContextValue, 
  AssetUploadRequest,
  AssetUsage,
  BrandingAssetCollection,
  AssetFilter
} from '@/types/assets';
import { validateAssetUpload } from '@/lib/assets/asset-utils';

const AssetManagerContext = createContext<AssetManagerContextValue | undefined>(undefined);

interface AssetManagerProviderProps {
  children: ReactNode;
  clientId?: string;
}

export function AssetManagerProvider({ children, clientId }: AssetManagerProviderProps) {
  const [assets, setAssets] = useState<AssetMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load assets on mount and when clientId changes
  useEffect(() => {
    if (clientId) {
      refreshAssets();
    }
  }, [clientId]);

  // Upload asset function
  const uploadAsset = useCallback(async (request: AssetUploadRequest): Promise<AssetMetadata> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate upload request
      const validationErrors = validateAssetUpload(request);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
      }

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('category', request.category);
      formData.append('clientId', request.clientId);
      
      if (request.altText) formData.append('altText', request.altText);
      if (request.description) formData.append('description', request.description);
      if (request.tags) formData.append('tags', JSON.stringify(request.tags));
      if (request.replaceExisting) formData.append('replaceExisting', 'true');

      // Upload to API
      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      const newAsset = result.asset as AssetMetadata;

      // Update local state
      setAssets(prevAssets => {
        // If replacing existing, remove old asset with same usage
        const filteredAssets = request.replaceExisting 
          ? prevAssets.filter(asset => 
              asset.clientId !== request.clientId || 
              !asset.usage.includes(request.category)
            )
          : prevAssets;
        
        return [...filteredAssets, newAsset];
      });

      return newAsset;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload asset';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete asset function
  const deleteAsset = useCallback(async (assetId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      // Update local state
      setAssets(prevAssets => prevAssets.filter(asset => asset.id !== assetId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete asset';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update asset function
  const updateAsset = useCallback(async (
    assetId: string, 
    updates: Partial<AssetMetadata>
  ): Promise<AssetMetadata> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Update failed');
      }

      const result = await response.json();
      const updatedAsset = result.asset as AssetMetadata;

      // Update local state
      setAssets(prevAssets => 
        prevAssets.map(asset => 
          asset.id === assetId ? updatedAsset : asset
        )
      );

      return updatedAsset;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update asset';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get assets by usage
  const getAssetsByUsage = useCallback((usage: AssetUsage): AssetMetadata[] => {
    return assets.filter(asset => asset.usage.includes(usage) && asset.isActive);
  }, [assets]);

  // Get branding collection for a client
  const getBrandingCollection = useCallback((targetClientId: string): BrandingAssetCollection | null => {
    const clientAssets = assets.filter(asset => 
      asset.clientId === targetClientId && asset.isActive
    );

    if (clientAssets.length === 0) return null;

    // Group assets by usage
    const logoLight = clientAssets.find(asset => asset.usage.includes('logo-light'));
    const logoDark = clientAssets.find(asset => asset.usage.includes('logo-dark'));
    const favicon = clientAssets.find(asset => asset.usage.includes('favicon'));
    const heroImages = clientAssets.filter(asset => asset.usage.includes('hero-image'));
    const backgrounds = clientAssets.filter(asset => asset.usage.includes('background-pattern'));
    const icons = clientAssets.filter(asset => asset.usage.includes('icon'));
    const ogImage = clientAssets.find(asset => asset.usage.includes('social-image'));
    const customAssets = clientAssets.filter(asset => asset.usage.includes('custom'));

    // Find most recent update time
    const lastUpdated = clientAssets.reduce((latest, asset) => {
      return new Date(asset.updatedAt) > new Date(latest) ? asset.updatedAt : latest;
    }, clientAssets[0]?.updatedAt || new Date().toISOString());

    return {
      clientId: targetClientId,
      logos: {
        light: logoLight,
        dark: logoDark,
        favicon: favicon,
      },
      images: {
        hero: heroImages.length > 0 ? heroImages : undefined,
        backgrounds: backgrounds.length > 0 ? backgrounds : undefined,
        icons: icons.length > 0 ? icons : undefined,
      },
      socialAssets: {
        ogImage: ogImage,
        twitterCard: ogImage, // Use same image for Twitter card for now
      },
      customAssets,
      lastUpdated,
    };
  }, [assets]);

  // Refresh assets from API
  const refreshAssets = useCallback(async (): Promise<void> => {
    if (!clientId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ clientId });
      const response = await fetch(`/api/assets?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load assets');
      }

      const result = await response.json();
      setAssets(result.assets || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh assets';
      setError(errorMessage);
      console.error('Failed to refresh assets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  const contextValue: AssetManagerContextValue = {
    assets,
    isLoading,
    error,
    uploadAsset,
    deleteAsset,
    updateAsset,
    getAssetsByUsage,
    getBrandingCollection,
    refreshAssets,
  };

  return (
    <AssetManagerContext.Provider value={contextValue}>
      {children}
    </AssetManagerContext.Provider>
  );
}

// Hook to use asset manager context
export function useAssetManager(): AssetManagerContextValue {
  const context = useContext(AssetManagerContext);
  
  if (context === undefined) {
    throw new Error('useAssetManager must be used within an AssetManagerProvider');
  }
  
  return context;
}

// Hook to get assets by specific usage type
export function useAssetsByUsage(usage: AssetUsage): AssetMetadata[] {
  const { getAssetsByUsage } = useAssetManager();
  return getAssetsByUsage(usage);
}

// Hook to get branding collection for current client
export function useBrandingCollection(clientId: string): BrandingAssetCollection | null {
  const { getBrandingCollection } = useAssetManager();
  return getBrandingCollection(clientId);
} 