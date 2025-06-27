#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Performance benchmark and optimization analysis
 */
class PerformanceBenchmark {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      buildMetrics: {},
      runtimeMetrics: {},
      bundleAnalysis: {},
      recommendations: []
    };
  }

  async runBenchmark() {

    await this.analyzeBuildPerformance();
    await this.analyzeBundleSize();
    await this.checkDependencySizes();
    await this.analyzeCodeSplitting();
    await this.checkImageOptimization();
    await this.generateOptimizationRecommendations();
    await this.saveReport();

  }

  async analyzeBuildPerformance() {
    
    try {
      const startTime = Date.now();
      
      // Build the application and measure time
      execSync('npm run build', { stdio: 'inherit' });
      
      const buildTime = Date.now() - startTime;
      
      this.results.buildMetrics = {
        buildTime: buildTime,
        buildTimeFormatted: `${(buildTime / 1000).toFixed(2)}s`
      };

      
      // Check if build output exists
      const buildDir = path.join(process.cwd(), '.next');
      if (fs.existsSync(buildDir)) {
        const buildStats = this.analyzeBuildOutput(buildDir);
        this.results.buildMetrics.outputSize = buildStats;
      }
      
    } catch (error) {
      this.results.buildMetrics.error = error.message;
    }
  }

  analyzeBuildOutput(buildDir) {
    const getDirectorySize = (dirPath) => {
      let totalSize = 0;
      
      const items = fs.readdirSync(dirPath);
      items.forEach(item => {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          totalSize += getDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      });
      
      return totalSize;
    };

    const totalSize = getDirectorySize(buildDir);
    
    return {
      totalBytes: totalSize,
      totalMB: (totalSize / 1024 / 1024).toFixed(2)
    };
  }

  async analyzeBundleSize() {
    
    const buildManifest = path.join(process.cwd(), '.next', 'build-manifest.json');
    const pagesManifest = path.join(process.cwd(), '.next', 'server', 'pages-manifest.json');
    
    if (fs.existsSync(buildManifest)) {
      const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
      
      const bundleAnalysis = {
        pages: {},
        totalBundles: 0,
        largestBundles: []
      };
      
      // Analyze page bundles
      Object.entries(manifest.pages).forEach(([page, files]) => {
        bundleAnalysis.pages[page] = {
          files: files.length,
          fileList: files
        };
        bundleAnalysis.totalBundles += files.length;
      });
      
      this.results.bundleAnalysis = bundleAnalysis;
    }
  }

  async checkDependencySizes() {
    
    try {
      // Analyze package.json dependencies
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const heavyDependencies = [];
      const nodeModulesPath = path.join(process.cwd(), 'node_modules');
      
      if (fs.existsSync(nodeModulesPath)) {
        Object.keys(dependencies).forEach(dep => {
          const depPath = path.join(nodeModulesPath, dep);
          if (fs.existsSync(depPath)) {
            try {
              const depSize = this.getDirectorySize(depPath);
              if (depSize > 1024 * 1024) { // Over 1MB
                heavyDependencies.push({
                  name: dep,
                  size: depSize,
                  sizeMB: (depSize / 1024 / 1024).toFixed(2)
                });
              }
            } catch (error) {
              // Ignore errors for symlinks or inaccessible directories
            }
          }
        });
      }
      
      heavyDependencies.sort((a, b) => b.size - a.size);
      
      this.results.bundleAnalysis.heavyDependencies = heavyDependencies.slice(0, 10);
      
    } catch (error) {
    }
  }

  getDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const items = fs.readdirSync(dirPath);
      items.forEach(item => {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          totalSize += this.getDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      });
    } catch (error) {
      // Ignore errors for inaccessible directories
    }
    
    return totalSize;
  }

  async analyzeCodeSplitting() {
    
    const issues = [];
    
    // Check for dynamic imports
    const appDir = path.join(process.cwd(), 'app');
    const componentsDir = path.join(process.cwd(), 'components');
    
    const dynamicImports = this.findDynamicImports([appDir, componentsDir]);
    
    if (dynamicImports.length === 0) {
      issues.push({
        type: 'code_splitting',
        severity: 'medium',
        message: 'No dynamic imports found - consider code splitting for better performance'
      });
    }
    
    // Check for large page components
    if (fs.existsSync(appDir)) {
      const pageFiles = this.findPageFiles(appDir);
      pageFiles.forEach(file => {
        const stats = fs.statSync(file);
        if (stats.size > 50 * 1024) { // Over 50KB
          issues.push({
            type: 'large_component',
            severity: 'low',
            file: file.replace(process.cwd(), ''),
            message: 'Large component file - consider splitting into smaller components',
            size: `${(stats.size / 1024).toFixed(2)}KB`
          });
        }
      });
    }
    
    this.results.bundleAnalysis.codeSplittingIssues = issues;
  }

  findDynamicImports(directories) {
    const dynamicImports = [];
    
    directories.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.scanForDynamicImports(dir, dynamicImports);
      }
    });
    
    return dynamicImports;
  }

  scanForDynamicImports(dir, results) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory() && !file.startsWith('.')) {
        this.scanForDynamicImports(filePath, results);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('import(') || content.includes('dynamic(')) {
          results.push(filePath.replace(process.cwd(), ''));
        }
      }
    });
  }

  findPageFiles(dir) {
    const pageFiles = [];
    
    const scanDir = (dirPath) => {
      const files = fs.readdirSync(dirPath);
      
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          scanDir(filePath);
        } else if (file === 'page.tsx' || file === 'page.ts' || file === 'layout.tsx') {
          pageFiles.push(filePath);
        }
      });
    };
    
    scanDir(dir);
    return pageFiles;
  }

  async checkImageOptimization() {
    
    const publicDir = path.join(process.cwd(), 'public');
    const imageIssues = [];
    
    if (fs.existsSync(publicDir)) {
      this.scanForImages(publicDir, imageIssues);
    }
    
    this.results.bundleAnalysis.imageOptimization = {
      totalImages: imageIssues.length,
      largeImages: imageIssues.filter(img => img.size > 500 * 1024), // Over 500KB
      unoptimizedImages: imageIssues.filter(img => 
        !img.path.includes('webp') && 
        !img.path.includes('avif') && 
        (img.path.includes('jpg') || img.path.includes('jpeg') || img.path.includes('png'))
      )
    };
    
  }

  scanForImages(dir, results) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        this.scanForImages(filePath, results);
      } else if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(file)) {
        results.push({
          path: filePath.replace(process.cwd(), ''),
          size: stats.size,
          sizeMB: (stats.size / 1024 / 1024).toFixed(2)
        });
      }
    });
  }

  generateOptimizationRecommendations() {
    
    const recommendations = [];
    
    // Build performance recommendations
    if (this.results.buildMetrics.buildTime > 60000) { // Over 1 minute
      recommendations.push({
        category: 'Build Performance',
        priority: 'high',
        issue: 'Slow build times',
        recommendation: 'Optimize build process with caching and parallel processing',
        impact: 'Developer Experience'
      });
    }
    
    // Bundle size recommendations
    if (this.results.bundleAnalysis.heavyDependencies?.length > 0) {
      recommendations.push({
        category: 'Bundle Size',
        priority: 'medium',
        issue: 'Heavy dependencies detected',
        recommendation: 'Consider lighter alternatives or lazy loading for heavy dependencies',
        impact: 'Loading Performance',
        details: this.results.bundleAnalysis.heavyDependencies.slice(0, 3).map(dep => dep.name)
      });
    }
    
    // Code splitting recommendations
    const codeSplittingIssues = this.results.bundleAnalysis.codeSplittingIssues || [];
    if (codeSplittingIssues.length > 0) {
      recommendations.push({
        category: 'Code Splitting',
        priority: 'medium',
        issue: 'Limited code splitting detected',
        recommendation: 'Implement dynamic imports for route-based and component-based code splitting',
        impact: 'Initial Load Performance'
      });
    }
    
    // Image optimization recommendations
    const imageOpt = this.results.bundleAnalysis.imageOptimization;
    if (imageOpt?.largeImages?.length > 0) {
      recommendations.push({
        category: 'Image Optimization',
        priority: 'medium',
        issue: `${imageOpt.largeImages.length} large images found`,
        recommendation: 'Compress images and consider modern formats (WebP, AVIF)',
        impact: 'Loading Performance'
      });
    }
    
    // General Next.js optimizations
    recommendations.push(
      {
        category: 'Next.js Optimization',
        priority: 'low',
        issue: 'General optimization opportunities',
        recommendation: 'Implement image optimization, font optimization, and bundle analyzer',
        impact: 'Overall Performance'
      },
      {
        category: 'Caching',
        priority: 'medium',
        issue: 'Caching strategy',
        recommendation: 'Implement proper HTTP caching headers and CDN usage',
        impact: 'Repeat Visit Performance'
      }
    );
    
    this.results.recommendations = recommendations;
  }

  async saveReport() {
    const reportPath = path.join(__dirname, 'performance-report.json');
    
    const summary = {
      buildTime: this.results.buildMetrics.buildTimeFormatted,
      totalRecommendations: this.results.recommendations.length,
      highPriorityIssues: this.results.recommendations.filter(r => r.priority === 'high').length,
      bundleIssues: (this.results.bundleAnalysis.codeSplittingIssues || []).length
    };
    
    const report = {
      summary,
      ...this.results
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
  }
}

// Run the benchmark if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.runBenchmark()
    .catch(error => {
      console.error('Performance benchmark failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceBenchmark;