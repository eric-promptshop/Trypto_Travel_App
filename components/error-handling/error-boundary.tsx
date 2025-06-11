'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  isReported: boolean;
  copySuccess: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  maxRetries?: number;
  showDetails?: boolean;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isReported: false,
      copySuccess: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { errorId } = this.state;
    
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo,
    });

    // Report error
    this.reportError(error, errorInfo, errorId);

    // Call custom error handler
    this.props.onError?.(error, errorInfo, errorId);
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.children !== this.props.children && resetOnPropsChange) {
      this.reset();
    }

    if (hasError && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some((key, index) => key !== prevResetKeys[index]);
      
      if (hasResetKeyChanged) {
        this.reset();
      }
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    try {
      // In a real application, you would send this to your error reporting service
      const errorReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getUserId(), // Implement based on your auth system
      };

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error Report:', errorReport);
      }

      // Here you would typically send to your error reporting service:
      // await errorReportingService.report(errorReport);

      this.setState({ isReported: true });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private getUserId = (): string => {
    // Implement based on your authentication system
    return 'anonymous';
  };

  private reset = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isReported: false,
      copySuccess: false,
    });
  };

  private retry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState({ 
        retryCount: retryCount + 1,
        copySuccess: false,
      });
      
      // Reset after a brief delay
      this.resetTimeoutId = window.setTimeout(() => {
        this.reset();
      }, 100);
    }
  };

  private copyErrorDetails = async () => {
    const { error, errorInfo, errorId } = this.state;
    
    const errorDetails = [
      `Error ID: ${errorId}`,
      `Message: ${error?.message || 'Unknown error'}`,
      `Component Stack: ${errorInfo?.componentStack || 'Not available'}`,
      `Stack Trace: ${error?.stack || 'Not available'}`,
      `Timestamp: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent}`,
    ].join('\n\n');

    try {
      await navigator.clipboard.writeText(errorDetails);
      this.setState({ copySuccess: true });
      
      // Reset copy success after 2 seconds
      setTimeout(() => {
        this.setState({ copySuccess: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' => {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('chunk') || message.includes('loading')) {
      return 'low'; // Usually network-related
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'medium'; // Auth-related
    }
    
    return 'high'; // Unknown errors are high priority
  };

  override render() {
    const { children, fallback, maxRetries = 3, showDetails = false } = this.props;
    const { hasError, error, errorInfo, errorId, retryCount, isReported, copySuccess } = this.state;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo!, this.retry);
      }

      const severity = this.getErrorSeverity(error);
      const canRetry = retryCount < maxRetries;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant={severity === 'high' ? 'destructive' : 'default'}>
                <AlertDescription>
                  We encountered an unexpected error. {canRetry ? 'You can try again' : 'Please refresh the page'} or contact support if the problem persists.
                </AlertDescription>
              </Alert>

              {/* Error ID for support */}
              <div className="text-sm text-gray-600">
                <span className="font-medium">Error ID:</span> {errorId}
                {isReported && (
                  <span className="ml-2 text-green-600 text-xs">✓ Reported</span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {canRetry && (
                  <Button onClick={this.retry} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again ({maxRetries - retryCount} left)
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>

                <Button 
                  variant="outline" 
                  onClick={this.copyErrorDetails}
                  className="flex items-center gap-2"
                >
                  {copySuccess ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Details
                    </>
                  )}
                </Button>
              </div>

              {/* Retry count indicator */}
              {retryCount > 0 && (
                <div className="text-sm text-gray-500">
                  Retry attempt: {retryCount}/{maxRetries}
                </div>
              )}

              {/* Error details for development or when explicitly requested */}
              {(showDetails || process.env.NODE_ENV === 'development') && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs font-mono overflow-auto max-h-48">
                    <div className="mb-2">
                      <strong>Error:</strong> {error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{error.stack}</pre>
                    </div>
                    {errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error reporting in functional components
export function useErrorHandler() {
  const reportError = (error: Error, context?: string) => {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    // In a real application, report to your error service
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Report:', {
        errorId,
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return { reportError };
}

export default ErrorBoundary; 