import { ReactElement } from 'react';
import { RenderOptions } from '@testing-library/react';

// Type for custom render function
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: any;
  store?: any;
  // Add any other provider options here
}

export interface CustomRenderResult {
  // Add any custom return types from render utilities
}

// Mock types for Next.js router
export interface MockRouter {
  push: jest.Mock;
  replace: jest.Mock;
  back: jest.Mock;
  forward: jest.Mock;
  reload: jest.Mock;
  query: Record<string, string | string[]>;
  pathname: string;
  asPath: string;
  route: string;
  basePath: string;
  isReady: boolean;
  isPreview: boolean;
  isLocaleDomain: boolean;
}

// API Testing types
export interface MockApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  headers?: Record<string, string>;
}

export interface TestApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: any;
} 