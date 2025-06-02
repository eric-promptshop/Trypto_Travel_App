import { PerformanceOptimizationDemo } from '@/components/performance';

export default function PerformancePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Performance Optimization</h1>
        <p className="text-muted-foreground">
          Comprehensive performance optimization suite for production-ready applications
        </p>
      </div>
      <PerformanceOptimizationDemo />
    </div>
  );
} 