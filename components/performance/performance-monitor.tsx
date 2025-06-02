'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Gauge, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fps: 60,
    memoryUsage: 45,
    loadTime: 850,
    domNodes: 1234
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <Gauge className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">90</p>
            <p className="text-sm text-muted-foreground">Performance Score</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <Activity className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{metrics.fps}</p>
            <p className="text-sm text-muted-foreground">FPS</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{metrics.memoryUsage}%</p>
            <p className="text-sm text-muted-foreground">Memory</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{metrics.loadTime}ms</p>
            <p className="text-sm text-muted-foreground">Load Time</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 