'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Shield,
  Zap,
  Bug,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle,
  Info,
  Settings,
  Activity,
} from 'lucide-react';

import {
  ErrorBoundary,
  withErrorBoundary,
  useSafeStorage,
  useStorageMonitor,
  useSafeAsync,
  useAsyncQueue,
  useFormValidation,
  useSafeData,
  createSchema,
  dataValidator,
  DataValidator,
} from './index';

// Sample async function that can fail
const unstableAsyncOperation = async (signal: AbortSignal): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check if aborted
  if (signal.aborted) {
    throw new Error('Operation was aborted');
  }
  
  // Random failure for demo
  if (Math.random() < 0.3) {
    throw new Error('Network error: Failed to fetch data');
  }
  
  return `Data loaded at ${new Date().toLocaleTimeString()}`;
};

// Validation schema for demo form
const formSchema = createSchema({
  name: [DataValidator.BUILT_IN_RULES.required, DataValidator.BUILT_IN_RULES.string],
  email: [DataValidator.BUILT_IN_RULES.required, DataValidator.BUILT_IN_RULES.email],
  age: [DataValidator.BUILT_IN_RULES.number, DataValidator.BUILT_IN_RULES.min(0), DataValidator.BUILT_IN_RULES.max(120)],
  website: [DataValidator.BUILT_IN_RULES.url],
});

// Component that might throw errors
const ProblematicComponent: React.FC<{ shouldError: boolean }> = ({ shouldError }) => {
  useEffect(() => {
    if (shouldError) {
      throw new Error('This is a simulated component error for testing error boundaries!');
    }
  }, [shouldError]);

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2 text-green-700">
        <CheckCircle className="h-5 w-5" />
        Component is working normally
      </div>
    </div>
  );
};

// Wrapped component with error boundary
const SafeProblematicComponent = withErrorBoundary(ProblematicComponent, {
  maxRetries: 2,
  showDetails: process.env.NODE_ENV === 'development',
});

export const EdgeCaseDemo: React.FC = () => {
  const [shouldError, setShouldError] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    website: '',
  });
  
  // Safe storage demo
  const [storageValue, setStorageValue, removeStorageValue] = useSafeStorage(
    'demo-data',
    { count: 0, timestamp: Date.now() },
    { maxAge: 5 * 60 * 1000 } // 5 minutes
  );
  
  const { getStorageInfo, clearExpired, clearAll } = useStorageMonitor();
  const [storageInfo, setStorageInfo] = useState(getStorageInfo());
  
  // Safe async demo
  const asyncState = useSafeAsync(
    unstableAsyncOperation,
    [],
    {
      timeout: 5000,
      maxRetries: 3,
      retryDelay: 1000,
      staleTime: 30000,
    }
  );
  
  const asyncQueue = useAsyncQueue();
  const [queueOperations, setQueueOperations] = useState<any[]>([]);
  
  // Form validation demo
  const { validate, sanitize } = useFormValidation(formData, formSchema);
  const [validationResult, setValidationResult] = useState(validate(formData));
  
  // Safe data operations demo
  const { safeParseJSON, safeGetProperty, sanitizeInput, getValueOrFallback } = useSafeData();
  const [jsonInput, setJsonInput] = useState('{"test": "value", "nested": {"prop": 123}}');
  const [propertyPath, setPropertyPath] = useState('nested.prop');
  
  // Update validation when form data changes
  useEffect(() => {
    const sanitized = sanitize(formData);
    setValidationResult(validate(sanitized));
  }, [formData, validate, sanitize]);
  
  // Update storage info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStorageInfo(getStorageInfo());
      setQueueOperations(asyncQueue.getRunning());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [getStorageInfo, asyncQueue]);
  
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const simulateStorageOperation = () => {
    const newValue = {
      count: storageValue.count + 1,
      timestamp: Date.now(),
    };
    setStorageValue(newValue);
  };
  
  const addAsyncOperation = () => {
    const opId = `op_${Date.now()}`;
    asyncQueue.add(unstableAsyncOperation, { id: opId, timeout: 10000 });
  };
  
  const jsonParseResult = safeParseJSON(jsonInput, { error: 'Invalid JSON' });
  const propertyResult = jsonParseResult.success 
    ? safeGetProperty(jsonParseResult.data, propertyPath, 'Property not found')
    : { success: false, fallback: 'JSON is invalid' };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-tripnav-navy mb-2">
          Edge Case Handling & Error Recovery Demo
        </h1>
        <p className="text-gray-600">
          This demo showcases robust error handling, data validation, safe storage, and async operations management.
        </p>
      </div>

      <Tabs defaultValue="error-boundary" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="error-boundary" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Error Boundary
          </TabsTrigger>
          <TabsTrigger value="safe-storage" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Safe Storage
          </TabsTrigger>
          <TabsTrigger value="async-ops" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Async Ops
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Validation
          </TabsTrigger>
          <TabsTrigger value="data-safety" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Data Safety
          </TabsTrigger>
        </TabsList>

        {/* Error Boundary Demo */}
        <TabsContent value="error-boundary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Error Boundary Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setShouldError(!shouldError)}
                  variant={shouldError ? "destructive" : "outline"}
                >
                  {shouldError ? "Stop Error" : "Trigger Error"}
                </Button>
                <Badge variant={shouldError ? "destructive" : "secondary"}>
                  {shouldError ? "Error Mode" : "Normal Mode"}
                </Badge>
              </div>
              
              <ErrorBoundary
                maxRetries={2}
                showDetails={true}
                onError={(error, errorInfo, errorId) => {
                }}
              >
                <SafeProblematicComponent shouldError={shouldError} />
              </ErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Safe Storage Demo */}
        <TabsContent value="safe-storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Safe Storage Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Current Storage Value</Label>
                  <div className="p-3 bg-gray-50 rounded-md text-sm font-mono">
                    Count: {storageValue.count}<br />
                    Timestamp: {new Date(storageValue.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div>
                  <Label>Storage Information</Label>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>localStorage:</span>
                      <Badge variant={storageInfo.localStorage ? "default" : "destructive"}>
                        {storageInfo.localStorage ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Items:</span>
                      <span>{storageInfo.itemCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{storageInfo.estimatedSize}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={simulateStorageOperation}>
                  Update Storage
                </Button>
                <Button onClick={removeStorageValue} variant="outline">
                  Remove Value
                </Button>
                <Button onClick={() => clearExpired()} variant="outline">
                  Clear Expired ({clearExpired()} items)
                </Button>
                <Button onClick={clearAll} variant="destructive">
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Async Operations Demo */}
        <TabsContent value="async-ops" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Async Operations Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Single Async Operation</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {asyncState.isLoading && <Clock className="h-4 w-4 animate-spin" />}
                      <Badge variant={
                        asyncState.error ? "destructive" : 
                        asyncState.isLoading ? "secondary" : 
                        asyncState.data ? "default" : "outline"
                      }>
                        {asyncState.error ? "Error" : 
                         asyncState.isLoading ? "Loading" : 
                         asyncState.data ? "Success" : "Ready"}
                      </Badge>
                      {asyncState.retryCount > 0 && (
                        <Badge variant="outline">
                          Retry {asyncState.retryCount}
                        </Badge>
                      )}
                    </div>
                    
                    {asyncState.data && (
                      <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                        ✅ {asyncState.data}
                      </div>
                    )}
                    
                    {asyncState.error && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                        ❌ {asyncState.error.message}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={asyncState.execute} 
                        disabled={asyncState.isLoading}
                        size="sm"
                      >
                        {asyncState.isLoading ? "Loading..." : "Execute"}
                      </Button>
                      <Button onClick={asyncState.abort} variant="outline" size="sm">
                        Abort
                      </Button>
                      <Button onClick={asyncState.reset} variant="outline" size="sm">
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>Async Operation Queue</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm">
                        Running: {queueOperations.length}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={addAsyncOperation} size="sm">
                        Add Operation
                      </Button>
                      <Button 
                        onClick={() => asyncQueue.abortAll()} 
                        variant="destructive" 
                        size="sm"
                      >
                        Abort All
                      </Button>
                    </div>
                    
                    {queueOperations.length > 0 && (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {queueOperations.map((op) => (
                          <div key={op.id} className="flex items-center justify-between p-2 bg-blue-50 rounded text-xs">
                            <span>{op.id}</span>
                            <Button 
                              onClick={() => asyncQueue.abort(op.id)}
                              variant="outline"
                              size="sm"
                            >
                              Abort
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Demo */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Data Validation & Sanitization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className={cn(
                        validationResult.errors.some(e => e.field === 'name') && "border-red-500"
                      )}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      className={cn(
                        validationResult.errors.some(e => e.field === 'email') && "border-red-500"
                      )}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleFormChange('age', sanitizeInput(e.target.value, 'number'))}
                      className={cn(
                        validationResult.errors.some(e => e.field === 'age') && "border-red-500"
                      )}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleFormChange('website', e.target.value)}
                      className={cn(
                        validationResult.errors.some(e => e.field === 'website') && "border-red-500"
                      )}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Validation Results</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {validationResult.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                        {validationResult.isValid ? "Valid" : "Invalid"}
                      </Badge>
                    </div>
                    
                    {validationResult.errors.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-red-600">Errors:</Label>
                        {validationResult.errors.map((error, index) => (
                          <Alert key={index} variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>{error.field}:</strong> {error.message}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                    
                    {validationResult.warnings.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-yellow-600">Warnings:</Label>
                        {validationResult.warnings.map((warning, index) => (
                          <Alert key={index}>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              <strong>{warning.field}:</strong> {warning.message}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Safety Demo */}
        <TabsContent value="data-safety" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Safe Data Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label>JSON Input</Label>
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      className="w-full p-2 border rounded-md text-sm font-mono"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label>Property Path</Label>
                    <Input
                      value={propertyPath}
                      onChange={(e) => setPropertyPath(e.target.value)}
                      placeholder="e.g., nested.prop"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>JSON Parse Result</Label>
                    <div className={cn(
                      "p-3 rounded-md text-sm",
                      jsonParseResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                    )}>
                      {jsonParseResult.success ? (
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(jsonParseResult.data, null, 2)}
                        </pre>
                      ) : (
                        <div className="text-red-700">
                          ❌ {jsonParseResult.error?.message}
                          {jsonParseResult.fallback && (
                            <div className="mt-2 text-gray-600">
                              Fallback: {JSON.stringify(jsonParseResult.fallback)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Property Access Result</Label>
                    <div className={cn(
                      "p-3 rounded-md text-sm",
                      propertyResult.success ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"
                    )}>
                      {propertyResult.success ? (
                        <div className="text-green-700">
                          ✅ Value: {JSON.stringify(propertyResult.data)}
                        </div>
                      ) : (
                        <div className="text-yellow-700">
                          ⚠️ {propertyResult.error?.message || 'Property not accessible'}
                          <div className="mt-1">
                            Fallback: {JSON.stringify(propertyResult.fallback)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Safety Features Demonstrated</Label>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Safe JSON parsing with fallbacks
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Protected property access
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Automatic error recovery
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Type-safe operations
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EdgeCaseDemo; 