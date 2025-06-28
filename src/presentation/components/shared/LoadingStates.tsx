import React from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Full page loading spinner
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

// Inline loading spinner
export function InlineLoader({ 
  size = 'default',
  className = '' 
}: { 
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${className}`} 
    />
  );
}

// Tour card skeleton
export function TourCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

// Tour list skeleton
export function TourListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <TourCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// Loading overlay
export function LoadingOverlay({ 
  isLoading, 
  message = 'Processing...' 
}: { 
  isLoading: boolean;
  message?: string;
}) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-3">
        <InlineLoader size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Async component wrapper
interface AsyncComponentProps<T> {
  isLoading: boolean;
  error: Error | string | null;
  data: T | null;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onRetry?: () => void;
  children: (data: T) => React.ReactNode;
}

export function AsyncComponent<T>({
  isLoading,
  error,
  data,
  loadingComponent,
  errorComponent,
  onRetry,
  children
}: AsyncComponentProps<T>) {
  if (isLoading) {
    return <>{loadingComponent || <InlineLoader />}</>;
  }

  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    
    const ErrorMessage = require('./ErrorMessage').ErrorMessage;
    return <ErrorMessage error={error} onRetry={onRetry} />;
  }

  if (!data) {
    return null;
  }

  return <>{children(data)}</>;
}