'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Search, Filter, Trash2, Edit3, Download, Eye, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AssetMetadata, 
  AssetUsage, 
  AssetFilter,
  DEFAULT_ASSET_CATEGORIES 
} from '@/types/assets';
import { formatFileSize, generateAssetUrl } from '@/lib/assets/asset-utils';

interface AssetGalleryProps {
  assets: AssetMetadata[];
  isLoading?: boolean;
  error?: string | null;
  onAssetDelete?: (assetId: string) => void;
  onAssetEdit?: (asset: AssetMetadata) => void;
  onAssetSelect?: (asset: AssetMetadata) => void;
  selectedAssets?: string[];
  selectionMode?: boolean;
  showUsageFilter?: boolean;
  emptyStateMessage?: string;
}

export function AssetGallery({
  assets,
  isLoading = false,
  error = null,
  onAssetDelete,
  onAssetEdit,
  onAssetSelect,
  selectedAssets = [],
  selectionMode = false,
  showUsageFilter = true,
  emptyStateMessage = 'No assets found. Upload some assets to get started.',
}: AssetGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [usageFilter, setUsageFilter] = useState<AssetUsage | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'usage'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    let filtered = assets.filter(asset => asset.isActive);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.originalName.toLowerCase().includes(query) ||
        asset.altText?.toLowerCase().includes(query) ||
        asset.description?.toLowerCase().includes(query) ||
        asset.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply usage filter
    if (usageFilter !== 'all') {
      filtered = filtered.filter(asset => asset.usage.includes(usageFilter));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.originalName.toLowerCase();
          bValue = b.originalName.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'usage':
          aValue = a.usage[0] || '';
          bValue = b.usage[0] || '';
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    return filtered;
  }, [assets, searchQuery, usageFilter, sortBy, sortOrder]);

  // Handle asset download
  const handleDownload = useCallback(async (asset: AssetMetadata) => {
    try {
      const url = generateAssetUrl(asset, { size: 'original' });
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = asset.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download asset:', error);
    }
  }, []);

  // Handle asset preview
  const handlePreview = useCallback((asset: AssetMetadata) => {
    const url = generateAssetUrl(asset, { size: 'large' });
    window.open(url, '_blank');
  }, []);

  // Get usage badge color
  const getUsageBadgeColor = (usage: AssetUsage) => {
    const colors: Record<AssetUsage, string> = {
      'logo-light': 'bg-blue-100 text-blue-800',
      'logo-dark': 'bg-gray-100 text-gray-800',
      'favicon': 'bg-green-100 text-green-800',
      'hero-image': 'bg-purple-100 text-purple-800',
      'background-pattern': 'bg-yellow-100 text-yellow-800',
      'icon': 'bg-indigo-100 text-indigo-800',
      'social-image': 'bg-pink-100 text-pink-800',
      'watermark': 'bg-orange-100 text-orange-800',
      'custom': 'bg-gray-100 text-gray-600',
    };
    return colors[usage] || colors.custom;
  };

  // Get display name for usage
  const getUsageDisplayName = (usage: AssetUsage) => {
    const category = DEFAULT_ASSET_CATEGORIES.find(cat => cat.id === usage);
    return category?.name || usage;
  };

  if (error) {
    return (
      <Alert>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search assets by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Usage Filter */}
        {showUsageFilter && (
          <Select value={usageFilter} onValueChange={(value) => setUsageFilter(value as AssetUsage | 'all')}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by usage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Usage Types</SelectItem>
              {DEFAULT_ASSET_CATEGORIES.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort Controls */}
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="usage">Usage</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {isLoading ? (
          'Loading assets...'
        ) : (
          `Showing ${filteredAssets.length} of ${assets.length} assets`
        )}
      </div>

      {/* Asset Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2">
            {searchQuery || usageFilter !== 'all' ? 'No assets match your filters' : emptyStateMessage}
          </p>
          {(searchQuery || usageFilter !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setUsageFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map(asset => (
            <Card 
              key={asset.id} 
              className={`group hover:shadow-lg transition-shadow ${
                selectedAssets.includes(asset.id) ? 'ring-2 ring-primary' : ''
              }`}
            >
              <CardContent className="p-4">
                {/* Asset Preview */}
                <div 
                  className="aspect-square bg-gray-50 rounded-lg mb-3 overflow-hidden cursor-pointer relative"
                  onClick={() => selectionMode && onAssetSelect ? onAssetSelect(asset) : handlePreview(asset)}
                >
                  {asset.mimeType.startsWith('image/') ? (
                    <img
                      src={generateAssetUrl(asset, { size: 'medium' })}
                      alt={asset.altText || asset.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {asset.mimeType.split('/')[1]?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{asset.originalName}</p>
                      </div>
                    </div>
                  )}

                  {/* Selection Overlay */}
                  {selectionMode && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className={`w-6 h-6 rounded-full border-2 border-white ${
                        selectedAssets.includes(asset.id) ? 'bg-primary' : 'bg-transparent'
                      }`}>
                        {selectedAssets.includes(asset.id) && (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Asset Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-sm truncate flex-1" title={asset.originalName}>
                      {asset.originalName}
                    </h3>
                    
                    {!selectionMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePreview(asset)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(asset)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          {onAssetEdit && (
                            <DropdownMenuItem onClick={() => onAssetEdit(asset)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {onAssetDelete && (
                            <DropdownMenuItem 
                              onClick={() => onAssetDelete(asset.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Usage Badges */}
                  <div className="flex flex-wrap gap-1">
                    {asset.usage.slice(0, 2).map(usage => (
                      <Badge 
                        key={usage} 
                        variant="secondary" 
                        className={`text-xs ${getUsageBadgeColor(usage)}`}
                      >
                        {getUsageDisplayName(usage)}
                      </Badge>
                    ))}
                    {asset.usage.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{asset.usage.length - 2} more
                      </Badge>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Size</span>
                      <span>{formatFileSize(asset.size)}</span>
                    </div>
                    {asset.dimensions && (
                      <div className="flex justify-between">
                        <span>Dimensions</span>
                        <span>{asset.dimensions.width}×{asset.dimensions.height}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Updated</span>
                      <span>{new Date(asset.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {asset.tags.slice(0, 3).map(tag => (
                        <span 
                          key={tag} 
                          className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {asset.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{asset.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 