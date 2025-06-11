'use client';

import React, { useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Zap,
  Package,
  Activity,
  BarChart3,
  Settings,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
  Eye,
  Gauge
} from 'lucide-react';

// Import our optimization components
import BundleAnalyzer from './bundle-analyzer';
import CodeSplittingDemo from './code-splitting';
import ReactOptimizationsDemo from './react-optimizations';
import PerformanceMonitor from './performance-monitor';

interface OptimizationFeature {
  name: string;
  description: string;
  category: 'bundling' | 'loading' | 'runtime' | 'monitoring';
  status: 'implemented' | 'active' | 'recommended';
  impact: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
}

const optimizationFeatures: OptimizationFeature[] = [
  {
    name: 'Bundle Analysis',
    description: 'Comprehensive bundle size analysis and optimization recommendations',
    category: 'bundling',
    status: 'implemented',
    impact: 'high',
    icon: <Package className="h-4 w-4" />
  },
  {
    name: 'Code Splitting',
    description: 'Lazy loading with performance tracking and smart fallbacks',
    category: 'loading',
    status: 'active',
    impact: 'high',
    icon: <Zap className="h-4 w-4" />
  },
  {
    name: 'React Memoization',
    description: 'React.memo, useMemo, and useCallback optimizations',
    category: 'runtime',
    status: 'active',
    impact: 'medium',
    icon: <Activity className="h-4 w-4" />
  },
  {
    name: 'Virtual Lists',
    description: 'Virtualized rendering for large datasets',
    category: 'runtime',
    status: 'implemented',
    impact: 'high',
    icon: <BarChart3 className="h-4 w-4" />
  },
  {
    name: 'Input Debouncing',
    description: 'Debounced inputs to reduce excessive operations',
    category: 'runtime',
    status: 'active',
    impact: 'medium',
    icon: <Clock className="h-4 w-4" />
  },
  {
    name: 'Performance Monitoring',
    description: 'Real-time performance metrics and Core Web Vitals',
    category: 'monitoring',
    status: 'active',
    impact: 'medium',
    icon: <Gauge className="h-4 w-4" />
  },
  {
    name: 'Image Optimization',
    description: 'Adaptive images with Cloudinary integration',
    category: 'loading',
    status: 'implemented',
    impact: 'high',
    icon: <Eye className="h-4 w-4" />
  },
  {
    name: 'Error Boundaries',
    description: 'Graceful error handling with recovery mechanisms',
    category: 'runtime',
    status: 'implemented',
    impact: 'medium',
    icon: <CheckCircle className="h-4 w-4" />
  }
];

export default function PerformanceOptimizationDemo() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'bundling', 'loading', 'runtime', 'monitoring'];
  
  const filteredFeatures = selectedCategory === 'all' 
    ? optimizationFeatures 
    : optimizationFeatures.filter(f => f.category === selectedCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'implemented': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bundling': return <Package className="h-4 w-4" />;
      case 'loading': return <Zap className="h-4 w-4" />;
      case 'runtime': return <Activity className="h-4 w-4" />;
      case 'monitoring': return <Gauge className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const stats = {
    totalFeatures: optimizationFeatures.length,
    activeFeatures: optimizationFeatures.filter(f => f.status === 'active').length,
    highImpact: optimizationFeatures.filter(f => f.impact === 'high').length,
    categories: [...new Set(optimizationFeatures.map(f => f.category))].length
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Performance Optimization Suite
          </CardTitle>
          <p className="text-muted-foreground">
            Comprehensive performance optimization tools and monitoring for production-ready applications
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Settings className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{stats.totalFeatures}</p>
              <p className="text-sm text-muted-foreground">Total Features</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats.activeFeatures}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{stats.highImpact}</p>
              <p className="text-sm text-muted-foreground">High Impact</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{stats.categories}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  size="sm"
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="flex items-center gap-2"
                >
                  {getCategoryIcon(category)}
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFeatures.map((feature, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {feature.icon}
                      <h3 className="font-semibold">{feature.name}</h3>
                    </div>
                    <div className="flex gap-1">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getStatusColor(feature.status))}
                      >
                        {feature.status}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getImpactColor(feature.impact))}
                      >
                        {feature.impact} impact
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {feature.category}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bundle">Bundle Analysis</TabsTrigger>
          <TabsTrigger value="splitting">Code Splitting</TabsTrigger>
          <TabsTrigger value="optimizations">React Optimizations</TabsTrigger>
          <TabsTrigger value="monitoring">Performance Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Build-time Optimizations</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Bundle analysis and size optimization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Tree shaking and dead code elimination</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">CSS optimization and minification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Image optimization with Cloudinary</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Runtime Optimizations</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Lazy loading with smart fallbacks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">React memoization techniques</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Virtual list rendering</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Input debouncing and throttling</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Performance Targets</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-lg font-bold text-green-600">&lt; 1.2s</p>
                    <p className="text-xs text-green-700 dark:text-green-300">LCP Target</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">&lt; 50ms</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">FID Target</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-lg font-bold text-purple-600">&lt; 0.1</p>
                    <p className="text-xs text-purple-700 dark:text-purple-300">CLS Target</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-lg font-bold text-orange-600">60 FPS</p>
                    <p className="text-xs text-orange-700 dark:text-orange-300">Render Target</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bundle" className="space-y-6">
          <Suspense 
            fallback={
              <Card className="p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </Card>
            }
          >
            <BundleAnalyzer />
          </Suspense>
        </TabsContent>

        <TabsContent value="splitting" className="space-y-6">
          <Suspense 
            fallback={
              <Card className="p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </Card>
            }
          >
            <CodeSplittingDemo />
          </Suspense>
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-6">
          <Suspense 
            fallback={
              <Card className="p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </Card>
            }
          >
            <ReactOptimizationsDemo />
          </Suspense>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Suspense 
            fallback={
              <Card className="p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </Card>
            }
          >
            <PerformanceMonitor />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
} 