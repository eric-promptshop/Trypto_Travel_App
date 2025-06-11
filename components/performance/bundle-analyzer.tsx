'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Package,
  FileText,
  Download,
  Zap,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  TrendingUp,
  Clock,
  HardDrive,
  Wifi,
  Target,
  Minimize2
} from 'lucide-react';

interface BundleStats {
  totalSize: number;
  gzippedSize: number;
  modules: number;
  assets: number;
  chunks: number;
  dependencies: string[];
  largestFiles: Array<{
    name: string;
    size: number;
    gzipped: number;
    type: 'js' | 'css' | 'image' | 'font' | 'other';
  }>;
  recommendations: Array<{
    type: 'warning' | 'info' | 'success';
    message: string;
    impact: 'high' | 'medium' | 'low';
    action?: string;
  }>;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const generateMockBundleStats = (): BundleStats => {
  return {
    totalSize: 2456320, // 2.4MB
    gzippedSize: 856432, // 856KB
    modules: 287,
    assets: 45,
    chunks: 12,
    dependencies: [
      '@radix-ui/react-*',
      'next',
      'react',
      'react-dom',
      'lucide-react',
      'framer-motion',
      'mapbox-gl',
      'recharts',
      'date-fns',
      'clsx',
      'tailwindcss'
    ],
    largestFiles: [
      { name: 'mapbox-gl.js', size: 456320, gzipped: 125432, type: 'js' },
      { name: 'framer-motion.js', size: 287650, gzipped: 78234, type: 'js' },
      { name: 'recharts.js', size: 234567, gzipped: 67890, type: 'js' },
      { name: 'radix-ui-bundle.js', size: 198765, gzipped: 54321, type: 'js' },
      { name: 'main.css', size: 156789, gzipped: 45678, type: 'css' },
      { name: 'itinerary-images.js', size: 123456, gzipped: 34567, type: 'js' },
      { name: 'vendor.js', size: 98765, gzipped: 27890, type: 'js' },
      { name: 'app.js', size: 87654, gzipped: 23456, type: 'js' }
    ],
    recommendations: [
      {
        type: 'warning',
        message: 'Mapbox GL is consuming 18.6% of your bundle. Consider lazy loading.',
        impact: 'high',
        action: 'Implement dynamic imports for map components'
      },
      {
        type: 'warning',
        message: 'Multiple Radix UI components detected. Tree shaking may not be optimal.',
        impact: 'medium',
        action: 'Use direct imports: @radix-ui/react-dialog instead of @radix-ui/react'
      },
      {
        type: 'info',
        message: 'Framer Motion is large but well-optimized for animations.',
        impact: 'low',
        action: 'Consider motion/reduced for simple animations'
      },
      {
        type: 'success',
        message: 'Next.js code splitting is working effectively.',
        impact: 'low'
      },
      {
        type: 'info',
        message: 'CSS bundle size is reasonable for a component library.',
        impact: 'low'
      }
    ]
  };
};

interface ChunkAnalysis {
  name: string;
  size: number;
  gzipped: number;
  modules: string[];
  loadTime: number;
  critical: boolean;
}

const generateChunkAnalysis = (): ChunkAnalysis[] => {
  return [
    {
      name: 'main',
      size: 125000,
      gzipped: 35000,
      modules: ['app/layout', 'app/page', 'components/ui/*'],
      loadTime: 150,
      critical: true
    },
    {
      name: 'framework',
      size: 285000,
      gzipped: 78000,
      modules: ['react', 'react-dom', 'next/router'],
      loadTime: 320,
      critical: true
    },
    {
      name: 'vendor',
      size: 456000,
      gzipped: 125000,
      modules: ['@radix-ui/*', 'framer-motion', 'date-fns'],
      loadTime: 450,
      critical: false
    },
    {
      name: 'maps',
      size: 512000,
      gzipped: 140000,
      modules: ['mapbox-gl', 'react-map-gl'],
      loadTime: 580,
      critical: false
    },
    {
      name: 'charts',
      size: 234000,
      gzipped: 67000,
      modules: ['recharts', 'd3-*'],
      loadTime: 280,
      critical: false
    }
  ];
};

export default function BundleAnalyzer() {
  const [bundleStats, setBundleStats] = useState<BundleStats | null>(null);
  const [chunkAnalysis, setChunkAnalysis] = useState<ChunkAnalysis[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const runAnalysis = async () => {
    setAnalyzing(true);
    // Simulate analysis time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setBundleStats(generateMockBundleStats());
    setChunkAnalysis(generateChunkAnalysis());
    setAnalyzing(false);
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'js': return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'css': return <PieChart className="h-4 w-4 text-blue-500" />;
      case 'image': return <Download className="h-4 w-4 text-green-500" />;
      default: return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  if (analyzing || !bundleStats) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bundle Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <p className="text-center text-muted-foreground">
              Analyzing bundle composition and performance...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bundle Analysis
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comprehensive analysis of your application bundle size and performance
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <HardDrive className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{formatBytes(bundleStats.totalSize)}</p>
              <p className="text-sm text-muted-foreground">Total Size</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Minimize2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{formatBytes(bundleStats.gzippedSize)}</p>
              <p className="text-sm text-muted-foreground">Gzipped</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Package className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{bundleStats.modules}</p>
              <p className="text-sm text-muted-foreground">Modules</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{bundleStats.chunks}</p>
              <p className="text-sm text-muted-foreground">Chunks</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Compression Ratio</span>
              <span className="text-sm text-muted-foreground">
                {Math.round((1 - bundleStats.gzippedSize / bundleStats.totalSize) * 100)}% reduction
              </span>
            </div>
            <Progress 
              value={(1 - bundleStats.gzippedSize / bundleStats.totalSize) * 100} 
              className="h-2"
            />
          </div>

          <Button onClick={runAnalysis} className="w-full">
            <TrendingUp className="h-4 w-4 mr-2" />
            Re-run Analysis
          </Button>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="files">Large Files</TabsTrigger>
          <TabsTrigger value="chunks">Chunks</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Dependencies Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {bundleStats.dependencies.map((dep, index) => (
                  <Badge key={index} variant="secondary" className="justify-center">
                    {dep}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Largest Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bundleStats.largestFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFileTypeIcon(file.type)}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatBytes(file.size)} → {formatBytes(file.gzipped)} (gzipped)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {((file.size / bundleStats.totalSize) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chunks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Chunk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chunkAnalysis.map((chunk, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{chunk.name}</h3>
                        {chunk.critical && (
                          <Badge variant="destructive" className="text-xs">Critical</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {chunk.loadTime}ms
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Size</p>
                        <p className="font-medium">{formatBytes(chunk.size)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Gzipped</p>
                        <p className="font-medium">{formatBytes(chunk.gzipped)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Modules</p>
                      <div className="flex flex-wrap gap-1">
                        {chunk.modules.map((module, moduleIndex) => (
                          <Badge key={moduleIndex} variant="outline" className="text-xs">
                            {module}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Optimization Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bundleStats.recommendations.map((rec, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      {getRecommendationIcon(rec.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{rec.message}</p>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getImpactColor(rec.impact))}
                          >
                            {rec.impact} impact
                          </Badge>
                        </div>
                        {rec.action && (
                          <p className="text-sm text-muted-foreground">{rec.action}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 