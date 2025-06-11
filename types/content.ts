// Tenant Content Management Types

// Basic content type structure
export interface TenantContentBase {
  id: string;
  title: string;
  content: any; // JSON content structure
  contentType: string;
  category?: string | null;
  status: string;
  tenantId: string;
  authorId?: string | null;
  metadata?: any;
  version: number;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Extended content type with author details
export interface TenantContentWithAuthor extends TenantContentBase {
  author?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

// Content creation request
export interface CreateContentRequest {
  title: string;
  content: any; // JSON content structure
  contentType: string;
  category?: string;
  metadata?: any;
  status?: string;
}

// Content update request
export interface UpdateContentRequest {
  title?: string;
  content?: any;
  contentType?: string;
  category?: string;
  metadata?: any;
  status?: string;
}

// Content list response
export interface ContentListResponse {
  content: TenantContentWithAuthor[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Content search options
export interface ContentSearchOptions {
  type?: string;
  category?: string;
  limit?: number;
  offset?: number;
  status?: string;
}

// Content types enum
export enum ContentType {
  PAGE = 'page',
  COMPONENT = 'component',
  MEDIA = 'media',
  TEMPLATE = 'template',
  CONFIG = 'config',
}

// Content status enum
export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
} 