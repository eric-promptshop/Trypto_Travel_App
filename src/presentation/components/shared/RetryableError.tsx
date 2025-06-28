import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface RetryableErrorProps {
  error: Error | string;
  onRetry: () => void | Promise<void>;
  maxRetries?: number;
  retryDelay?: number;
  autoRetry?: boolean;
  className?: string;
}

export function RetryableError({
  error,
  onRetry,
  maxRetries = 3,
  retryDelay = 3000,
  autoRetry = true,
  className = ''
}: RetryableErrorProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const errorMessage = error instanceof Error ? error.message : error;
  const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                        errorMessage.toLowerCase().includes('fetch');

  useEffect(() => {
    if (autoRetry && retryCount < maxRetries && !isRetrying) {
      const delay = retryDelay * Math.pow(2, retryCount); // Exponential backoff
      setCountdown(Math.ceil(delay / 1000));

      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            handleRetry();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [retryCount, autoRetry, maxRetries, retryDelay, isRetrying]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setCountdown(null);
    
    try {
      await onRetry();
      // If successful, reset retry count
      setRetryCount(0);
    } catch (error) {
      // If failed, increment retry count
      setRetryCount(prev => prev + 1);
    } finally {
      setIsRetrying(false);
    }
  };

  const canRetry = retryCount < maxRetries;

  return (
    <Card className={`max-w-md ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {isNetworkError ? (
            <WifiOff className="h-5 w-5 text-orange-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          <CardTitle>
            {isNetworkError ? 'Connection Problem' : 'Something went wrong'}
          </CardTitle>
        </div>
        <CardDescription>
          {errorMessage}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {retryCount > 0 && (
          <div className="text-sm text-muted-foreground">
            Retry attempt {retryCount} of {maxRetries}
          </div>
        )}

        {countdown !== null && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Retrying in {countdown} seconds...
            </div>
            <Progress 
              value={((retryDelay / 1000 - countdown) / (retryDelay / 1000)) * 100} 
              className="h-2"
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleRetry}
            disabled={!canRetry || isRetrying}
            variant={canRetry ? 'default' : 'outline'}
            className="flex-1"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {canRetry ? 'Retry Now' : 'Max Retries Reached'}
              </>
            )}
          </Button>
          
          {countdown !== null && (
            <Button
              onClick={() => setCountdown(null)}
              variant="outline"
              size="sm"
            >
              Cancel Auto-retry
            </Button>
          )}
        </div>

        {!canRetry && (
          <div className="text-sm text-muted-foreground">
            Please check your connection and try refreshing the page.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for retry logic
export function useRetry(
  fn: () => Promise<void>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onError?: (error: Error, retryCount: number) => void;
  } = {}
) {
  const { maxRetries = 3, retryDelay = 1000, onError } = options;
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async () => {
    setIsRetrying(true);
    setError(null);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await fn();
        setRetryCount(0);
        setError(null);
        break;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setRetryCount(attempt);
        
        if (onError) {
          onError(error, attempt);
        }

        if (attempt < maxRetries) {
          await new Promise(resolve => 
            setTimeout(resolve, retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    setIsRetrying(false);
  };

  return {
    execute,
    isRetrying,
    retryCount,
    error,
    canRetry: retryCount < maxRetries
  };
}