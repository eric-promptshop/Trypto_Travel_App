// Branding Asset Management Types

export interface AssetMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  altText?: string;
  description?: string;
  tags: string[];
  usage: AssetUsage[];
  clientId: string;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
  version: number;
  isActive: boolean;
  cdn?: {
    url: string;
    provider: 'cloudflare' | 'aws' | 'vercel';
    optimized: boolean;
  };
}

export type AssetUsage = 
  | 'logo-light' 
  | 'logo-dark' 
  | 'favicon' 
  | 'hero-image' 
  | 'background-pattern' 
  | 'icon' 
  | 'social-image' 
  | 'watermark'
  | 'custom';

export interface AssetCategory {
  id: string;
  name: string;
  description: string;
  allowedTypes: string[];
  maxSize: number;
  recommendedDimensions?: {
    width: number;
    height: number;
    aspectRatio?: string;
  };
  required: boolean;
  multiple: boolean;
}

export interface AssetUploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  autoOptimize: boolean;
  generateThumbnails: boolean;
  thumbnailSizes: number[];
  compressionQuality: number;
  enableCDN: boolean;
}

export interface AssetUploadRequest {
  file: File;
  category: AssetUsage;
  altText?: string;
  description?: string;
  tags?: string[];
  clientId: string;
  replaceExisting?: boolean;
}

export interface AssetUploadResponse {
  success: boolean;
  asset?: AssetMetadata;
  error?: string;
  validationErrors?: AssetValidationError[];
}

export interface AssetValidationError {
  field: string;
  message: string;
  code: string;
}

export interface AssetFilter {
  clientId?: string;
  usage?: AssetUsage[];
  mimeType?: string[];
  tags?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  isActive?: boolean;
  search?: string;
}

export interface AssetListResponse {
  success: boolean;
  assets: AssetMetadata[];
  totalCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface AssetStorageProvider {
  name: string;
  type: 'local' | 's3' | 'cloudflare' | 'vercel-blob';
  config: Record<string, any>;
  baseUrl: string;
  cdnUrl?: string;
}

export interface AssetOptimization {
  format: 'webp' | 'avif' | 'jpeg' | 'png';
  quality: number;
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface AssetVariant {
  id: string;
  size: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
  url: string;
  width: number;
  height: number;
  fileSize: number;
  format: string;
}

export interface BrandingAssetCollection {
  clientId: string;
  logos: {
    light?: AssetMetadata;
    dark?: AssetMetadata;
    favicon?: AssetMetadata;
  };
  images: {
    hero?: AssetMetadata[];
    backgrounds?: AssetMetadata[];
    icons?: AssetMetadata[];
  };
  socialAssets: {
    ogImage?: AssetMetadata;
    twitterCard?: AssetMetadata;
  };
  customAssets: AssetMetadata[];
  lastUpdated: string;
}

// Context types for asset management
export interface AssetManagerContextValue {
  assets: AssetMetadata[];
  isLoading: boolean;
  error: string | null;
  uploadAsset: (request: AssetUploadRequest) => Promise<AssetMetadata>;
  deleteAsset: (assetId: string) => Promise<void>;
  updateAsset: (assetId: string, updates: Partial<AssetMetadata>) => Promise<AssetMetadata>;
  getAssetsByUsage: (usage: AssetUsage) => AssetMetadata[];
  getBrandingCollection: (clientId: string) => BrandingAssetCollection | null;
  refreshAssets: () => Promise<void>;
}

// Asset URL generation types
export interface AssetUrlOptions {
  size?: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
  optimization?: AssetOptimization;
  cacheBusting?: boolean;
}

// Asset validation rules
export interface AssetValidationRules {
  logo: {
    maxSize: number;
    dimensions: { min: { width: number; height: number }, max: { width: number; height: number } };
    formats: string[];
    aspectRatio?: number;
  };
  favicon: {
    maxSize: number;
    dimensions: { width: number; height: number }[];
    formats: string[];
  };
  hero: {
    maxSize: number;
    dimensions: { min: { width: number; height: number } };
    formats: string[];
    aspectRatio?: number;
  };
}

export const DEFAULT_ASSET_CATEGORIES: AssetCategory[] = [
  {
    id: 'logo-light',
    name: 'Logo (Light Mode)',
    description: 'Company logo for light backgrounds',
    allowedTypes: ['image/png', 'image/svg+xml', 'image/jpeg'],
    maxSize: 2 * 1024 * 1024, // 2MB
    recommendedDimensions: {
      width: 200,
      height: 60,
      aspectRatio: '3:1',
    },
    required: true,
    multiple: false,
  },
  {
    id: 'logo-dark',
    name: 'Logo (Dark Mode)',
    description: 'Company logo for dark backgrounds',
    allowedTypes: ['image/png', 'image/svg+xml', 'image/jpeg'],
    maxSize: 2 * 1024 * 1024,
    recommendedDimensions: {
      width: 200,
      height: 60,
      aspectRatio: '3:1',
    },
    required: false,
    multiple: false,
  },
  {
    id: 'favicon',
    name: 'Favicon',
    description: 'Website favicon (32x32px)',
    allowedTypes: ['image/png', 'image/x-icon', 'image/svg+xml'],
    maxSize: 100 * 1024, // 100KB
    recommendedDimensions: {
      width: 32,
      height: 32,
    },
    required: true,
    multiple: false,
  },
  {
    id: 'hero-image',
    name: 'Hero Images',
    description: 'Large banner images for hero sections',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    recommendedDimensions: {
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
    },
    required: false,
    multiple: true,
  },
  {
    id: 'background-pattern',
    name: 'Background Patterns',
    description: 'Repeatable background patterns',
    allowedTypes: ['image/png', 'image/svg+xml', 'image/jpeg'],
    maxSize: 1 * 1024 * 1024, // 1MB
    required: false,
    multiple: true,
  },
  {
    id: 'icon',
    name: 'Custom Icons',
    description: 'Custom icons and symbols',
    allowedTypes: ['image/svg+xml', 'image/png'],
    maxSize: 500 * 1024, // 500KB
    recommendedDimensions: {
      width: 64,
      height: 64,
    },
    required: false,
    multiple: true,
  },
];

export const DEFAULT_UPLOAD_CONFIG: AssetUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'],
  autoOptimize: true,
  generateThumbnails: true,
  thumbnailSizes: [150, 300, 600],
  compressionQuality: 85,
  enableCDN: true,
}; 