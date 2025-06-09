import { 
  AssetMetadata, 
  AssetUploadRequest, 
  AssetValidationError, 
  AssetUploadConfig,
  AssetUrlOptions,
  AssetOptimization,
  AssetUsage,
  DEFAULT_UPLOAD_CONFIG,
  DEFAULT_ASSET_CATEGORIES
} from '@/types/assets';

/**
 * Validate an asset upload request
 */
export function validateAssetUpload(
  request: AssetUploadRequest,
  config: AssetUploadConfig = DEFAULT_UPLOAD_CONFIG
): AssetValidationError[] {
  const errors: AssetValidationError[] = [];

  // File size validation
  if (request.file.size > config.maxFileSize) {
    errors.push({
      field: 'file.size',
      message: `File size exceeds maximum allowed size of ${formatFileSize(config.maxFileSize)}`,
      code: 'FILE_TOO_LARGE',
    });
  }

  // MIME type validation
  if (!config.allowedMimeTypes.includes(request.file.type)) {
    errors.push({
      field: 'file.type',
      message: `File type ${request.file.type} is not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`,
      code: 'INVALID_FILE_TYPE',
    });
  }

  // File extension validation
  const fileExtension = getFileExtension(request.file.name).toLowerCase();
  if (!config.allowedExtensions.includes(fileExtension)) {
    errors.push({
      field: 'file.name',
      message: `File extension ${fileExtension} is not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`,
      code: 'INVALID_FILE_EXTENSION',
    });
  }

  // Category-specific validation
  const category = DEFAULT_ASSET_CATEGORIES.find(cat => cat.id === request.category);
  if (category) {
    // File size validation for category
    if (request.file.size > category.maxSize) {
      errors.push({
        field: 'file.size',
        message: `File size exceeds maximum allowed size for ${category.name}: ${formatFileSize(category.maxSize)}`,
        code: 'CATEGORY_FILE_TOO_LARGE',
      });
    }

    // MIME type validation for category
    if (!category.allowedTypes.includes(request.file.type)) {
      errors.push({
        field: 'file.type',
        message: `File type ${request.file.type} is not allowed for ${category.name}. Allowed types: ${category.allowedTypes.join(', ')}`,
        code: 'CATEGORY_INVALID_FILE_TYPE',
      });
    }
  }

  // Alt text validation for accessibility
  if (isImageFile(request.file.type) && !request.altText?.trim()) {
    errors.push({
      field: 'altText',
      message: 'Alt text is required for image files for accessibility',
      code: 'MISSING_ALT_TEXT',
    });
  }

  return errors;
}

/**
 * Extract image dimensions from a file
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (!isImageFile(file.type)) return null;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Validate image dimensions against category requirements
 */
export async function validateImageDimensions(
  file: File,
  usage: AssetUsage
): Promise<AssetValidationError[]> {
  const errors: AssetValidationError[] = [];
  
  if (!isImageFile(file.type)) return errors;

  const dimensions = await getImageDimensions(file);
  if (!dimensions) {
    errors.push({
      field: 'file',
      message: 'Could not read image dimensions',
      code: 'INVALID_IMAGE',
    });
    return errors;
  }

  const category = DEFAULT_ASSET_CATEGORIES.find(cat => cat.id === usage);
  if (!category?.recommendedDimensions) return errors;

  const { recommendedDimensions } = category;

  // Check minimum dimensions if specified
  if (recommendedDimensions.width && dimensions.width < recommendedDimensions.width * 0.8) {
    errors.push({
      field: 'dimensions.width',
      message: `Image width ${dimensions.width}px is too small. Recommended: ${recommendedDimensions.width}px`,
      code: 'IMAGE_TOO_SMALL',
    });
  }

  if (recommendedDimensions.height && dimensions.height < recommendedDimensions.height * 0.8) {
    errors.push({
      field: 'dimensions.height',
      message: `Image height ${dimensions.height}px is too small. Recommended: ${recommendedDimensions.height}px`,
      code: 'IMAGE_TOO_SMALL',
    });
  }

  // Check aspect ratio if specified
  if (recommendedDimensions.aspectRatio) {
    const ratioParts = recommendedDimensions.aspectRatio.split(':');
    if (ratioParts.length === 2) {
      const ratioW = Number(ratioParts[0]);
      const ratioH = Number(ratioParts[1]);
      if (!isNaN(ratioW) && !isNaN(ratioH) && ratioH !== 0) {
        const expectedRatio = ratioW / ratioH;
        const actualRatio = dimensions.width / dimensions.height;
        const tolerance = 0.1; // 10% tolerance

        if (Math.abs(actualRatio - expectedRatio) > tolerance) {
          errors.push({
            field: 'dimensions.aspectRatio',
            message: `Image aspect ratio ${actualRatio.toFixed(2)} doesn't match recommended ${recommendedDimensions.aspectRatio}`,
            code: 'INVALID_ASPECT_RATIO',
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Generate secure filename for asset storage
 */
export function generateAssetFilename(originalName: string, clientId: string, usage: AssetUsage): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  const safeName = sanitizeFilename(getFilenameWithoutExtension(originalName));
  
  return `${clientId}/${usage}/${timestamp}-${randomString}-${safeName}${extension}`;
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Get file extension including the dot
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? '' : filename.substring(lastDotIndex);
}

/**
 * Get filename without extension
 */
export function getFilenameWithoutExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? filename : filename.substring(0, lastDotIndex);
}

/**
 * Check if file type is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate optimized asset URL with parameters
 */
export function generateAssetUrl(
  asset: AssetMetadata,
  options: AssetUrlOptions = {}
): string {
  let url = asset.cdn?.url || `/api/assets/${asset.id}`;

  const params = new URLSearchParams();

  // Add size parameter
  if (options.size && options.size !== 'original') {
    params.append('size', options.size);
  }

  // Add optimization parameters
  if (options.optimization) {
    const { format, quality, width, height, fit } = options.optimization;
    
    if (format) params.append('format', format);
    if (quality) params.append('quality', quality.toString());
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    if (fit) params.append('fit', fit);
  }

  // Add cache busting
  if (options.cacheBusting) {
    params.append('v', asset.version.toString());
  }

  // Append parameters to URL
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  return url;
}

/**
 * Generate responsive image URLs for different sizes
 */
export function generateResponsiveUrls(asset: AssetMetadata): Record<string, string> {
  return {
    thumbnail: generateAssetUrl(asset, { size: 'thumbnail' }),
    small: generateAssetUrl(asset, { size: 'small' }),
    medium: generateAssetUrl(asset, { size: 'medium' }),
    large: generateAssetUrl(asset, { size: 'large' }),
    original: generateAssetUrl(asset, { size: 'original' }),
  };
}

/**
 * Create asset metadata from upload request
 */
export async function createAssetMetadata(
  request: AssetUploadRequest,
  filename: string,
  uploadedBy: string
): Promise<Partial<AssetMetadata>> {
  const dimensions = await getImageDimensions(request.file);

  const metadata: Partial<AssetMetadata> = {
    filename,
    originalName: request.file.name,
    mimeType: request.file.type,
    size: request.file.size,
    tags: request.tags || [],
    usage: [request.category],
    clientId: request.clientId,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    isActive: true,
  };
  
  // Add optional fields only if they exist
  if (request.altText !== undefined) {
    metadata.altText = request.altText;
  }
  if (request.description !== undefined) {
    metadata.description = request.description;
  }

  // Only add dimensions if they exist
  if (dimensions) {
    metadata.dimensions = dimensions;
  }

  return metadata;
}

/**
 * Check if asset needs optimization
 */
export function shouldOptimizeAsset(asset: AssetMetadata, config: AssetUploadConfig): boolean {
  if (!config.autoOptimize) return false;
  if (!isImageFile(asset.mimeType)) return false;
  
  // Optimize if file is large or not in optimal format
  const isLarge = asset.size > 1024 * 1024; // 1MB
  const isUnoptimizedFormat = !['image/webp', 'image/avif'].includes(asset.mimeType);
  
  return isLarge || isUnoptimizedFormat;
}

/**
 * Generate thumbnail sizes for an asset
 */
export function generateThumbnailSizes(
  originalDimensions: { width: number; height: number },
  thumbnailSizes: number[]
): Array<{ width: number; height: number; size: number }> {
  const aspectRatio = originalDimensions.width / originalDimensions.height;
  
  return thumbnailSizes.map(size => {
    if (aspectRatio > 1) {
      // Landscape: constrain width
      return {
        width: size,
        height: Math.round(size / aspectRatio),
        size,
      };
    } else {
      // Portrait or square: constrain height
      return {
        width: Math.round(size * aspectRatio),
        height: size,
        size,
      };
    }
  });
}

/**
 * Extract metadata from file for analysis
 */
export async function extractFileMetadata(file: File): Promise<Record<string, any>> {
  const metadata: Record<string, any> = {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString(),
  };

  // For images, add dimension information
  if (isImageFile(file.type)) {
    const dimensions = await getImageDimensions(file);
    if (dimensions) {
      metadata.dimensions = dimensions;
      metadata.aspectRatio = (dimensions.width / dimensions.height).toFixed(2);
    }
  }

  return metadata;
}

/**
 * Check if asset can be replaced by another asset
 */
export function canReplaceAsset(
  existingAsset: AssetMetadata,
  newFile: File,
  newUsage: AssetUsage
): { canReplace: boolean; reason?: string } {
  // Check if usage matches
  if (!existingAsset.usage.includes(newUsage)) {
    return {
      canReplace: false,
      reason: 'Usage type does not match existing asset',
    };
  }

  // Check if file type is compatible
  const category = DEFAULT_ASSET_CATEGORIES.find(cat => cat.id === newUsage);
  if (category && !category.allowedTypes.includes(newFile.type)) {
    return {
      canReplace: false,
      reason: 'File type is not compatible with asset category',
    };
  }

  return { canReplace: true };
}

/**
 * Generate asset preview URL for temporary display during upload
 */
export function generatePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Clean up preview URL to prevent memory leaks
 */
export function cleanupPreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
} 