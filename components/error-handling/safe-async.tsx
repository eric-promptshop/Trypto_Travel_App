'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useErrorHandler } from './error-boundary';

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isStale: boolean;
  lastUpdated: number | null;
  retryCount: number;
}

export interface AsyncOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  retryDelayMultiplier?: number;
  staleTime?: number;
  abortOnUnmount?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface AsyncOperationMeta {
  id: string;
  startTime: number;
  source: string;
  abortController: AbortController;
}

class SafeAsyncManager {
  private operations = new Map<string, AsyncOperationMeta>();
  
  create<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    options: AsyncOptions & { id?: string } = {}
  ): {
    execute: () => Promise<T>;
    abort: () => void;
    isRunning: () => boolean;
  } {
    const operationId = options.id || `async_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const execute = async (): Promise<T> => {
      // Abort any existing operation with the same ID
      this.abort(operationId);
      
      const abortController = new AbortController();
      const meta: AsyncOperationMeta = {
        id: operationId,
        startTime: Date.now(),
        source: operation.name || 'anonymous',
        abortController,
      };
      
      this.operations.set(operationId, meta);
      
      try {
        // Set up timeout if specified
        if (options.timeout) {
          setTimeout(() => {
            if (this.operations.has(operationId)) {
              abortController.abort(new Error(`Operation ${operationId} timed out after ${options.timeout}ms`));
            }
          }, options.timeout);
        }
        
        const result = await operation(abortController.signal);
        
        // Clean up successful operation
        this.operations.delete(operationId);
        options.onSuccess?.(result);
        
        return result;
      } catch (error) {
        // Clean up failed operation
        this.operations.delete(operationId);
        
        if (abortController.signal.aborted) {
          throw new Error('Operation was aborted');
        }
        
        options.onError?.(error as Error);
        throw error;
      }
    };
    
    const abort = () => this.abort(operationId);
    const isRunning = () => this.operations.has(operationId);
    
    return { execute, abort, isRunning };
  }
  
  abort(operationId: string): boolean {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.abortController.abort();
      this.operations.delete(operationId);
      return true;
    }
    return false;
  }
  
  abortAll(): number {
    const count = this.operations.size;
    for (const [id, operation] of this.operations.entries()) {
      operation.abortController.abort();
    }
    this.operations.clear();
    return count;
  }
  
  getRunningOperations(): AsyncOperationMeta[] {
    return Array.from(this.operations.values());
  }
  
  getOperationStatus(operationId: string): AsyncOperationMeta | null {
    return this.operations.get(operationId) || null;
  }
}

// Global async manager instance
export const asyncManager = new SafeAsyncManager();

// React hook for safe async operations
export function useSafeAsync<T>(
  asyncFunction: (signal: AbortSignal) => Promise<T>,
  dependencies: any[] = [],
  options: AsyncOptions = {}
): AsyncState<T> & {
  execute: () => Promise<void>;
  reset: () => void;
  abort: () => void;
} {
  const { reportError } = useErrorHandler();
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isStale: false,
    lastUpdated: null,
    retryCount: 0,
  });
  
  const operationRef = useRef<{
    execute: () => Promise<T>;
    abort: () => void;
    isRunning: () => boolean;
  } | null>(null);
  
  const isMountedRef = useRef(true);
  
  const execute = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));
    
    const retryOperation = async (retryCount = 0): Promise<void> => {
      try {
        operationRef.current = asyncManager.create(asyncFunction, {
          ...options,
          id: `hook_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        });
        
        const result = await operationRef.current.execute();
        
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            data: result,
            isLoading: false,
            error: null,
            isStale: false,
            lastUpdated: Date.now(),
            retryCount: 0,
          }));
        }
      } catch (error) {
        if (!isMountedRef.current) return;
        
        const err = error as Error;
        
        // Don't retry if operation was aborted
        if (err.message.includes('aborted')) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: err,
          }));
          return;
        }
        
        const maxRetries = options.maxRetries || 3;
        const shouldRetry = retryCount < maxRetries;
        
        if (shouldRetry) {
          const delay = (options.retryDelay || 1000) * Math.pow(options.retryDelayMultiplier || 1.5, retryCount);
          
          setState(prev => ({
            ...prev,
            retryCount: retryCount + 1,
            error: err,
          }));
          
          setTimeout(() => {
            if (isMountedRef.current) {
              retryOperation(retryCount + 1);
            }
          }, delay);
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: err,
            retryCount: retryCount,
          }));
          
          reportError(err, 'useSafeAsync');
        }
      }
    };
    
    await retryOperation();
  }, [asyncFunction, options, reportError]);
  
  const reset = useCallback(() => {
    operationRef.current?.abort();
    setState({
      data: null,
      isLoading: false,
      error: null,
      isStale: false,
      lastUpdated: null,
      retryCount: 0,
    });
  }, []);
  
  const abort = useCallback(() => {
    operationRef.current?.abort();
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: new Error('Operation aborted by user'),
    }));
  }, []);
  
  // Check if data is stale
  useEffect(() => {
    if (state.lastUpdated && options.staleTime) {
      const checkStale = () => {
        const isStale = Date.now() - state.lastUpdated! > options.staleTime!;
        if (isStale && isMountedRef.current) {
          setState(prev => ({ ...prev, isStale: true }));
        }
      };
      
      const timer = setTimeout(checkStale, options.staleTime);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state.lastUpdated, options.staleTime]);
  
  // Auto-execute on dependency changes
  useEffect(() => {
    execute();
  }, dependencies);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (options.abortOnUnmount !== false) {
        operationRef.current?.abort();
      }
    };
  }, [options.abortOnUnmount]);
  
  return {
    ...state,
    execute,
    reset,
    abort,
  };
}

// Hook for managing multiple async operations
export function useAsyncQueue(): {
  add: <T>(
    operation: (signal: AbortSignal) => Promise<T>,
    options?: AsyncOptions & { id?: string }
  ) => Promise<T>;
  abort: (id: string) => boolean;
  abortAll: () => number;
  getRunning: () => AsyncOperationMeta[];
  isRunning: (id?: string) => boolean;
} {
  const add = <T,>(
    operation: (signal: AbortSignal) => Promise<T>,
    options: AsyncOptions & { id?: string } = {}
  ): Promise<T> => {
    const asyncOp = asyncManager.create(operation, options);
    return asyncOp.execute();
  };
  
  const abort = useCallback((id: string) => asyncManager.abort(id), []);
  const abortAll = useCallback(() => asyncManager.abortAll(), []);
  const getRunning = useCallback(() => asyncManager.getRunningOperations(), []);
  const isRunning = useCallback((id?: string) => {
    if (id) {
      return asyncManager.getOperationStatus(id) !== null;
    }
    return asyncManager.getRunningOperations().length > 0;
  }, []);
  
  return {
    add,
    abort,
    abortAll,
    getRunning,
    isRunning,
  };
}

// Utility for creating timeout promises
export function createTimeoutPromise(ms: number, message?: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message || `Timeout after ${ms}ms`));
    }, ms);
  });
}

// Utility for race with timeout
export function raceWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> {
  return Promise.race([
    promise,
    createTimeoutPromise(timeoutMs, timeoutMessage),
  ]);
}

// Utility for retry with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    multiplier?: number;
    maxDelay?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    multiplier = 1.5,
    maxDelay = 10000,
    shouldRetry = () => true,
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }
      
      const delay = Math.min(baseDelay * Math.pow(multiplier, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export default asyncManager; 