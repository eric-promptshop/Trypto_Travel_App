import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorMessageProps {
  error: Error | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
}

export function ErrorMessage({ 
  error, 
  onRetry, 
  onDismiss,
  className = '',
  variant = 'destructive'
}: ErrorMessageProps) {
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : error;
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <Alert variant={variant} className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p>{errorMessage}</p>
          
          {isDevelopment && error instanceof Error && error.stack && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer text-muted-foreground">
                Stack trace
              </summary>
              <pre className="text-xs mt-2 whitespace-pre-wrap bg-black/5 p-2 rounded">
                {error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="h-7 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="h-7 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Inline error message for forms
export function InlineError({ 
  error, 
  className = '' 
}: { 
  error: string | null; 
  className?: string;
}) {
  if (!error) return null;

  return (
    <p className={`text-sm text-red-500 mt-1 ${className}`}>
      {error}
    </p>
  );
}

// API Error handler utility
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unexpected error occurred';
}