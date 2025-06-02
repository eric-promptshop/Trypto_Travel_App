'use client';

import React, { 
  useState, 
  useEffect, 
  useMemo, 
  useCallback, 
  useRef,
  memo,
  ReactNode,
  ComponentType
} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Zap,
  Clock,
  MemoryStick,
  Cpu,
  Activity,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Filter,
  RefreshCw
} from 'lucide-react';

// Performance monitoring hook
export function usePerformanceTracker(componentName: string) {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());
  const lastRenderTime = useRef(Date.now());

  renderCount.current++;

  useEffect(() => {
    const renderTime = Date.now() - lastRenderTime.current;
    console.log(`${componentName} rendered in ${renderTime}ms (render #${renderCount.current})`);
    lastRenderTime.current = Date.now();
  });

  return {
    renderCount: renderCount.current,
    mountTime: mountTime.current,
    totalLifetime: Date.now() - mountTime.current
  };
}

// Debounced input hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Virtual list hook for large datasets
export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    startIndex,
    endIndex
  };
}

// Memoized heavy computation component
const HeavyComputationComponent = memo(({ 
  data, 
  multiplier 
}: { 
  data: number[]; 
  multiplier: number; 
}) => {
  const performanceTracker = usePerformanceTracker('HeavyComputationComponent');

  const expensiveCalculation = useMemo(() => {
    console.log('🔄 Running expensive calculation...');
    const start = Date.now();
    
    // Simulate heavy computation
    let result = 0;
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < 1000; j++) {
        result += Math.sqrt(data[i] * multiplier) / (j + 1);
      }
    }
    
    const duration = Date.now() - start;
    console.log(`✅ Calculation completed in ${duration.toFixed(2)}ms`);
    
    return { value: result.toFixed(2), duration: Math.round(duration) };
  }, [data, multiplier]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Heavy Computation Result</h3>
        <Badge variant="outline">Renders: {performanceTracker.renderCount}</Badge>
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-bold text-blue-600">{expensiveCalculation.value}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Computed in {expensiveCalculation.duration}ms</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4" />
          <span>Data points: {data.length}</span>
        </div>
      </div>
    </Card>
  );
});

HeavyComputationComponent.displayName = 'HeavyComputationComponent';

// Virtual list item component
const VirtualListItem = memo(({ 
  item, 
  index 
}: { 
  item: { id: number; name: string; value: number }; 
  index: number; 
}) => (
  <div className="flex items-center justify-between p-3 border-b bg-background">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
        {index + 1}
      </div>
      <div>
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-muted-foreground">ID: {item.id}</p>
      </div>
    </div>
    <Badge variant="secondary">{item.value}</Badge>
  </div>
));

VirtualListItem.displayName = 'VirtualListItem';

// Search component with debouncing
function DebouncedSearch({ 
  onSearch, 
  placeholder = "Search..." 
}: { 
  onSearch: (term: string) => void;
  placeholder?: string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const performance = usePerformanceTracker('DebouncedSearch');

  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        <Badge variant="outline" className="text-xs">
          Renders: {performance.renderCount}
        </Badge>
      </div>
    </div>
  );
}

// Main optimization demo component
export default function ReactOptimizationsDemo() {
  const [computationData, setComputationData] = useState(() => 
    Array.from({ length: 100 }, (_, i) => i + 1)
  );
  const [multiplier, setMultiplier] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [virtualData] = useState(() =>
    Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i + 1}`,
      value: Math.floor(Math.random() * 1000)
    }))
  );

  const performanceTracker = usePerformanceTracker('ReactOptimizationsDemo');

  // Memoized filtered virtual data
  const filteredVirtualData = useMemo(() => {
    if (!searchTerm) return virtualData;
    return virtualData.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [virtualData, searchTerm]);

  // Virtual list configuration
  const itemHeight = 60;
  const containerHeight = 400;
  
  const {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    startIndex,
    endIndex
  } = useVirtualList({
    items: filteredVirtualData,
    itemHeight,
    containerHeight
  });

  // Memoized callbacks
  const handleDataSizeChange = useCallback((newSize: number) => {
    setComputationData(Array.from({ length: newSize }, (_, i) => i + 1));
  }, []);

  const handleMultiplierChange = useCallback((newMultiplier: number) => {
    setMultiplier(newMultiplier);
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, [setScrollTop]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            React Performance Optimizations
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Demonstrations of React optimization techniques including memoization, virtualization, and debouncing
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{performanceTracker.renderCount}</p>
              <p className="text-sm text-muted-foreground">Main Renders</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{virtualData.length.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Filter className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{filteredVirtualData.length.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Filtered Items</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Activity className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{visibleItems.length}</p>
              <p className="text-sm text-muted-foreground">Visible Items</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="memoization" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="memoization">Memoization</TabsTrigger>
          <TabsTrigger value="virtualization">Virtualization</TabsTrigger>
          <TabsTrigger value="debouncing">Debouncing</TabsTrigger>
        </TabsList>

        <TabsContent value="memoization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MemoryStick className="h-5 w-5" />
                React.memo & useMemo Demo
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Heavy computations are memoized and only re-run when dependencies change
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Data Size</label>
                    <div className="flex gap-2 mt-1">
                      {[50, 100, 200, 500].map(size => (
                        <Button
                          key={size}
                          size="sm"
                          variant={computationData.length === size ? "default" : "outline"}
                          onClick={() => handleDataSizeChange(size)}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Multiplier</label>
                    <div className="flex gap-2 mt-1">
                      {[1, 2, 5, 10].map(mult => (
                        <Button
                          key={mult}
                          size="sm"
                          variant={multiplier === mult ? "default" : "outline"}
                          onClick={() => handleMultiplierChange(mult)}
                        >
                          {mult}x
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Optimization Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">React.memo prevents unnecessary re-renders</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">useMemo caches expensive calculations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">useCallback prevents prop changes</span>
                      </div>
                    </div>
                  </div>
                </div>

                <HeavyComputationComponent data={computationData} multiplier={multiplier} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="virtualization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Virtual List Demo
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Only renders visible items from a large dataset of {virtualData.length.toLocaleString()} items
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <DebouncedSearch 
                onSearch={handleSearch}
                placeholder={`Search ${virtualData.length.toLocaleString()} items...`}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Showing items {startIndex + 1} - {endIndex + 1} of {filteredVirtualData.length.toLocaleString()}</span>
                  <Badge variant="outline">
                    Rendered: {visibleItems.length} / {filteredVirtualData.length.toLocaleString()}
                  </Badge>
                </div>
                
                <div 
                  className="border rounded-lg overflow-auto"
                  style={{ height: containerHeight }}
                  onScroll={handleScroll}
                >
                  <div style={{ height: totalHeight, position: 'relative' }}>
                    <div style={{ transform: `translateY(${offsetY}px)` }}>
                      {visibleItems.map((item, index) => (
                        <VirtualListItem
                          key={item.id}
                          item={item}
                          index={startIndex + index}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-lg font-bold text-green-600">{((visibleItems.length / filteredVirtualData.length) * 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">DOM Usage</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{itemHeight}px</p>
                  <p className="text-xs text-muted-foreground">Item Height</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-lg font-bold text-purple-600">{Math.floor(totalHeight / 1000)}K</p>
                  <p className="text-xs text-muted-foreground">Total Height</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debouncing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Debounced Search Demo
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Search input is debounced by 300ms to prevent excessive filtering operations
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <DebouncedSearch 
                    onSearch={handleSearch}
                    placeholder="Try typing quickly..."
                  />
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Debouncing Benefits</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Reduces API calls</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Prevents excessive filtering</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Improves user experience</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Reduces component re-renders</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Search Results</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Current search: "{searchTerm || '(none)'}"
                    </p>
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-blue-600">
                        {filteredVirtualData.length.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        results found ({((filteredVirtualData.length / virtualData.length) * 100).toFixed(1)}% of total)
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Performance Impact</span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Without debouncing, typing "react" would trigger 5 filter operations. 
                      With debouncing, only 1 operation occurs after you stop typing.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 