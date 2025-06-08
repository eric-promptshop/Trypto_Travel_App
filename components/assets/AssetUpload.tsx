'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Image, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AssetUploadRequest, 
  AssetUsage, 
  AssetValidationError,
  DEFAULT_ASSET_CATEGORIES 
} from '@/types/assets';
import { formatFileSize } from '@/lib/assets/asset-utils';

interface AssetUploadProps {
  clientId: string;
  onUploadComplete?: (assetId: string) => void;
  onUploadError?: (error: string) => void;
  allowedUsages?: AssetUsage[];
  maxFiles?: number;
}

interface UploadFile {
  file: File;
  id: string;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  assetId?: string;
}

export function AssetUpload({ 
  clientId, 
  onUploadComplete, 
  onUploadError,
  allowedUsages,
  maxFiles = 5 
}: AssetUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedUsage, setSelectedUsage] = useState<AssetUsage>('custom');
  const [altText, setAltText] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get available usage options
  const availableUsages = allowedUsages || 
    DEFAULT_ASSET_CATEGORIES.map(cat => cat.id as AssetUsage);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  }, []);

  // Process selected files
  const handleFiles = useCallback((newFiles: File[]) => {
    const processedFiles: UploadFile[] = newFiles.slice(0, maxFiles - files.length).map(file => ({
      file,
      id: Math.random().toString(36).substring(2),
      progress: 0,
      status: 'pending' as const,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setFiles(prev => [...prev, ...processedFiles]);
  }, [files.length, maxFiles]);

  // Remove file from upload queue
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Clean up preview URL
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updated;
    });
  }, []);

  // Add tag
  const addTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  // Remove tag
  const removeTag = useCallback((tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  }, []);

  // Handle tag input key press
  const handleTagKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  }, [addTag]);

  // Upload a single file
  const uploadFile = useCallback(async (uploadFile: UploadFile) => {
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id 
        ? { ...f, status: 'uploading', progress: 0 }
        : f
    ));

    try {
      const request: AssetUploadRequest = {
        file: uploadFile.file,
        category: selectedUsage,
        altText: altText.trim() || undefined,
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        clientId,
        replaceExisting,
      };

      // Create FormData
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('category', request.category);
      formData.append('clientId', request.clientId);
      
      if (request.altText) formData.append('altText', request.altText);
      if (request.description) formData.append('description', request.description);
      if (request.tags) formData.append('tags', JSON.stringify(request.tags));
      if (request.replaceExisting) formData.append('replaceExisting', 'true');

      // Upload with progress tracking
      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'success', 
              progress: 100,
              assetId: result.asset.id 
            }
          : f
      ));

      if (onUploadComplete) {
        onUploadComplete(result.asset.id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  }, [selectedUsage, altText, description, tags, clientId, replaceExisting, onUploadComplete, onUploadError]);

  // Upload all files
  const uploadAllFiles = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    // Upload files sequentially to avoid overwhelming the server
    for (const file of pendingFiles) {
      await uploadFile(file);
    }
  }, [files, uploadFile]);

  // Clear all files
  const clearFiles = useCallback(() => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  }, [files]);

  // Get upload stats
  const uploadStats = {
    total: files.length,
    pending: files.filter(f => f.status === 'pending').length,
    uploading: files.filter(f => f.status === 'uploading').length,
    success: files.filter(f => f.status === 'success').length,
    error: files.filter(f => f.status === 'error').length,
  };

  const canUpload = files.length > 0 && uploadStats.pending > 0;
  const isUploading = uploadStats.uploading > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Assets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Configuration */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="usage">Asset Usage</Label>
            <Select value={selectedUsage} onValueChange={(value) => setSelectedUsage(value as AssetUsage)}>
              <SelectTrigger>
                <SelectValue placeholder="Select usage type" />
              </SelectTrigger>
              <SelectContent>
                {availableUsages.map(usage => {
                  const category = DEFAULT_ASSET_CATEGORIES.find(cat => cat.id === usage);
                  return (
                    <SelectItem key={usage} value={usage}>
                      {category?.name || usage}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="altText">Alt Text</Label>
            <Input
              id="altText"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe the image for accessibility"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description of the asset"
            rows={2}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                {tag}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyPress}
              placeholder="Add tags (press Enter or comma)"
            />
            <Button type="button" onClick={addTag} variant="outline" size="sm">
              Add
            </Button>
          </div>
        </div>

        {/* Replace existing checkbox */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="replaceExisting"
            checked={replaceExisting}
            onChange={(e) => setReplaceExisting(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="replaceExisting" className="text-sm">
            Replace existing asset of the same type
          </Label>
        </div>

        {/* File Drop Zone */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
            ${dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Upload up to {maxFiles} files. Supported formats: PNG, JPG, SVG, ICO
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,.svg,.ico,.webp,.gif"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Files to Upload</h4>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={uploadAllFiles}
                  disabled={!canUpload || isUploading}
                  size="sm"
                >
                  Upload All ({uploadStats.pending})
                </Button>
                <Button
                  type="button"
                  onClick={clearFiles}
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {files.map(file => (
                <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {/* Preview */}
                  <div className="flex-shrink-0">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt="Preview"
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.file.size)}
                    </p>
                    
                    {/* Progress Bar */}
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="mt-1" />
                    )}
                    
                    {/* Error Message */}
                    {file.status === 'error' && file.error && (
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {file.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {file.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    {file.status === 'pending' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Stats */}
            {uploadStats.total > 0 && (
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Total: {uploadStats.total}</span>
                {uploadStats.success > 0 && (
                  <span className="text-green-600">Success: {uploadStats.success}</span>
                )}
                {uploadStats.error > 0 && (
                  <span className="text-red-600">Error: {uploadStats.error}</span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 