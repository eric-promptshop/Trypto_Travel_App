'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

export type LoadingPriority = 'critical' | 'high' | 'medium' | 'low' | 'background';

export interface LoadingTask {
  id: string;
  priority: LoadingPriority;
  load: () => Promise<void>;
  isVisible?: boolean;
  retries?: number;
  maxRetries?: number;
  timeout?: number;
  dependencies?: string[];
  estimatedTime?: number;
}

export interface LoadingQueueState {
  pending: Map<string, LoadingTask>;
  loading: Map<string, LoadingTask>;
  completed: Set<string>;
  failed: Map<string, { task: LoadingTask; error: Error }>;
}

const PRIORITY_WEIGHTS: Record<LoadingPriority, number> = {
  critical: 1000,
  high: 500,
  medium: 100,
  low: 50,
  background: 1,
};

const DEFAULT_RETRY_DELAY = 1000;
const MAX_CONCURRENT_TASKS = 3;

export class LoadingPriorityQueue {
  private state: LoadingQueueState = {
    pending: new Map(),
    loading: new Map(),
    completed: new Set(),
    failed: new Map(),
  };

  private maxConcurrent: number;
  private isProcessing = false;
  private listeners: ((state: LoadingQueueState) => void)[] = [];
  private abortController = new AbortController();

  constructor(maxConcurrent = MAX_CONCURRENT_TASKS) {
    this.maxConcurrent = maxConcurrent;
  }

  // Add task to queue
  addTask(task: LoadingTask): void {
    // Check if task already exists
    if (this.state.pending.has(task.id) || 
        this.state.loading.has(task.id) || 
        this.state.completed.has(task.id)) {
      return;
    }

    // Set defaults
    const enhancedTask: LoadingTask = {
      retries: 0,
      maxRetries: 3,
      timeout: 10000,
      ...task,
    };

    this.state.pending.set(task.id, enhancedTask);
    this.notifyListeners();
    this.processQueue();
  }

  // Remove task from queue
  removeTask(taskId: string): void {
    this.state.pending.delete(taskId);
    this.state.loading.delete(taskId);
    this.state.completed.delete(taskId);
    this.state.failed.delete(taskId);
    this.notifyListeners();
  }

  // Update task priority
  updatePriority(taskId: string, priority: LoadingPriority): void {
    const task = this.state.pending.get(taskId);
    if (task) {
      task.priority = priority;
      this.notifyListeners();
      this.processQueue();
    }
  }

  // Update task visibility
  updateVisibility(taskId: string, isVisible: boolean): void {
    const task = this.state.pending.get(taskId) || this.state.loading.get(taskId);
    if (task) {
      task.isVisible = isVisible;
      if (isVisible && task.priority === 'low') {
        task.priority = 'medium';
      } else if (!isVisible && task.priority === 'medium') {
        task.priority = 'low';
      }
      this.notifyListeners();
      this.processQueue();
    }
  }

  // Clear all tasks
  clear(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
    
    this.state = {
      pending: new Map(),
      loading: new Map(),
      completed: new Set(),
      failed: new Map(),
    };
    this.notifyListeners();
  }

  // Get queue state
  getState(): LoadingQueueState {
    return { ...this.state };
  }

  // Subscribe to state changes
  subscribe(listener: (state: LoadingQueueState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Process the queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.state.loading.size >= this.maxConcurrent) {
      return;
    }

    this.isProcessing = true;

    try {
      const nextTask = this.getNextTask();
      if (nextTask) {
        await this.executeTask(nextTask);
      }
    } finally {
      this.isProcessing = false;
      
      // Continue processing if there are more tasks and capacity
      if (this.state.pending.size > 0 && this.state.loading.size < this.maxConcurrent) {
        this.processQueue();
      }
    }
  }

  // Get next task based on priority
  private getNextTask(): LoadingTask | null {
    const availableTasks = Array.from(this.state.pending.values())
      .filter(task => this.areDependenciesMet(task));

    if (availableTasks.length === 0) {
      return null;
    }

    // Sort by priority and visibility
    availableTasks.sort((a, b) => {
      const aPriority = PRIORITY_WEIGHTS[a.priority] + (a.isVisible ? 100 : 0);
      const bPriority = PRIORITY_WEIGHTS[b.priority] + (b.isVisible ? 100 : 0);
      return bPriority - aPriority;
    });

    return availableTasks[0] || null;
  }

  // Check if task dependencies are met
  private areDependenciesMet(task: LoadingTask): boolean {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }

    return task.dependencies.every(depId => this.state.completed.has(depId));
  }

  // Execute a single task
  private async executeTask(task: LoadingTask): Promise<void> {
    // Move from pending to loading
    this.state.pending.delete(task.id);
    this.state.loading.set(task.id, task);
    this.notifyListeners();

    const timeoutId = task.timeout ? setTimeout(() => {
      this.handleTaskFailure(task, new Error('Task timeout'));
    }, task.timeout) : null;

    try {
      await Promise.race([
        task.load(),
        new Promise((_, reject) => {
          this.abortController.signal.addEventListener('abort', () => {
            reject(new Error('Task aborted'));
          });
        }),
      ]);

      // Task completed successfully
      this.state.loading.delete(task.id);
      this.state.completed.add(task.id);
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      this.notifyListeners();
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      this.handleTaskFailure(task, error as Error);
    }
  }

  // Handle task failure with retry logic
  private handleTaskFailure(task: LoadingTask, error: Error): void {
    this.state.loading.delete(task.id);

    const retries = (task.retries || 0) + 1;
    const maxRetries = task.maxRetries || 3;

    if (retries < maxRetries && !this.abortController.signal.aborted) {
      // Retry the task
      const retryTask = { ...task, retries };
      
      setTimeout(() => {
        this.state.pending.set(task.id, retryTask);
        this.notifyListeners();
        this.processQueue();
      }, DEFAULT_RETRY_DELAY * retries);
    } else {
      // Task failed permanently
      this.state.failed.set(task.id, { task, error });
    }

    this.notifyListeners();
  }

  // Notify all listeners of state changes
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in loading queue listener:', error);
      }
    });
  }
}

// React hook for using the loading priority queue
export function useLoadingPriorityQueue(maxConcurrent?: number) {
  const queueRef = useRef<LoadingPriorityQueue | null>(null);
  const [state, setState] = useState<LoadingQueueState>({
    pending: new Map(),
    loading: new Map(),
    completed: new Set(),
    failed: new Map(),
  });

  // Initialize queue
  useEffect(() => {
    queueRef.current = new LoadingPriorityQueue(maxConcurrent);
    
    const unsubscribe = queueRef.current.subscribe(setState);
    
    return () => {
      unsubscribe();
      queueRef.current?.clear();
    };
  }, [maxConcurrent]);

  const addTask = useCallback((task: LoadingTask) => {
    queueRef.current?.addTask(task);
  }, []);

  const removeTask = useCallback((taskId: string) => {
    queueRef.current?.removeTask(taskId);
  }, []);

  const updatePriority = useCallback((taskId: string, priority: LoadingPriority) => {
    queueRef.current?.updatePriority(taskId, priority);
  }, []);

  const updateVisibility = useCallback((taskId: string, isVisible: boolean) => {
    queueRef.current?.updateVisibility(taskId, isVisible);
  }, []);

  const clear = useCallback(() => {
    queueRef.current?.clear();
  }, []);

  return {
    state,
    addTask,
    removeTask,
    updatePriority,
    updateVisibility,
    clear,
  };
}

// Hook for loading individual items with priority queue integration
export function useLoadingItem(
  id: string,
  loadFn: () => Promise<void>,
  options: {
    priority?: LoadingPriority;
    dependencies?: string[];
    timeout?: number;
    maxRetries?: number;
  } = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { addTask, removeTask, state } = useLoadingPriorityQueue();

  const load = useCallback(() => {
    if (isLoaded || isLoading) return;

    const task: LoadingTask = {
      id,
      priority: options.priority || 'medium',
      load: async () => {
        setIsLoading(true);
        setError(null);
        try {
          await loadFn();
          setIsLoaded(true);
        } catch (err) {
          setError(err as Error);
          throw err;
        } finally {
          setIsLoading(false);
        }
      },
      ...(options.dependencies && { dependencies: options.dependencies }),
      ...(options.timeout && { timeout: options.timeout }),
      ...(options.maxRetries && { maxRetries: options.maxRetries }),
    };

    addTask(task);
  }, [id, loadFn, options, isLoaded, isLoading, addTask]);

  const reset = useCallback(() => {
    removeTask(id);
    setIsLoading(false);
    setIsLoaded(false);
    setError(null);
  }, [id, removeTask]);

  // Update loading state based on queue state
  useEffect(() => {
    const taskInQueue = state.loading.has(id);
    const taskCompleted = state.completed.has(id);
    const taskFailed = state.failed.has(id);

    if (taskInQueue && !isLoading) {
      setIsLoading(true);
    } else if (!taskInQueue && isLoading && !taskCompleted) {
      setIsLoading(false);
    }

    if (taskCompleted && !isLoaded) {
      setIsLoaded(true);
      setIsLoading(false);
    }

    if (taskFailed) {
      const failedTask = state.failed.get(id);
      if (failedTask) {
        setError(failedTask.error);
        setIsLoading(false);
      }
    }
  }, [state, id, isLoading, isLoaded]);

  return {
    isLoading,
    isLoaded,
    error,
    load,
    reset,
  };
} 