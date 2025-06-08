const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Performance Check Report\n');

// Check build directory size
function getDirectorySize(dir) {
  let size = 0;
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    });
  } catch (e) {
    // Directory doesn't exist
  }
  return size;
}

// Check for large dependencies
function checkLargeDependencies() {
  console.log('📦 Checking dependency sizes...\n');
  
  const largePackages = [
    '@dnd-kit/core',
    '@dnd-kit/sortable',
    'framer-motion',
    'recharts',
    'mapbox-gl',
    'leaflet',
    '@radix-ui',
    'lucide-react'
  ];

  largePackages.forEach(pkg => {
    const pkgPath = path.join('node_modules', pkg);
    if (fs.existsSync(pkgPath)) {
      const size = getDirectorySize(pkgPath);
      console.log(`${pkg}: ${(size / 1024 / 1024).toFixed(2)} MB`);
    }
  });
}

// Check for duplicate components
function checkDuplicateComponents() {
  console.log('\n🔍 Checking for duplicate components...\n');
  
  const componentsDir = './components';
  const componentGroups = {
    logos: [],
    forms: [],
    maps: [],
    itineraries: []
  };

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        const fileName = file.toLowerCase();
        
        if (fileName.includes('logo')) componentGroups.logos.push(filePath);
        if (fileName.includes('form') && !fileName.includes('transform')) componentGroups.forms.push(filePath);
        if (fileName.includes('map')) componentGroups.maps.push(filePath);
        if (fileName.includes('itinerary')) componentGroups.itineraries.push(filePath);
      }
    });
  }

  scanDirectory(componentsDir);

  Object.entries(componentGroups).forEach(([group, files]) => {
    if (files.length > 1) {
      console.log(`${group} (${files.length} files):`);
      files.forEach(file => console.log(`  - ${file}`));
    }
  });
}

// Check bundle recommendations
function checkBundleOptimizations() {
  console.log('\n⚡ Bundle Optimization Recommendations:\n');
  
  const recommendations = [
    {
      check: 'Dynamic imports',
      files: ['components/analytics/AnalyticsDashboard.tsx', 'components/trips/TripDashboard.tsx'],
      recommendation: 'Use dynamic imports for large dashboard components'
    },
    {
      check: 'Tree shaking',
      files: ['lucide-react imports'],
      recommendation: 'Import specific icons instead of entire library'
    },
    {
      check: 'Code splitting',
      files: ['app/admin/*', 'app/analytics/*'],
      recommendation: 'Lazy load admin and analytics routes'
    },
    {
      check: 'Image optimization',
      files: ['public/images/*'],
      recommendation: 'Convert PNG images to WebP format'
    }
  ];

  recommendations.forEach(({ check, recommendation }) => {
    console.log(`✓ ${check}: ${recommendation}`);
  });
}

// Performance metrics
function checkPerformanceMetrics() {
  console.log('\n📊 Performance Metrics:\n');
  
  // Check response time
  try {
    const start = Date.now();
    execSync('curl -s http://localhost:3000 > /dev/null');
    const responseTime = Date.now() - start;
    console.log(`Homepage response time: ${responseTime}ms`);
  } catch (e) {
    console.log('Could not measure response time (server may not be running)');
  }

  // Estimated metrics
  console.log('\nTarget Metrics:');
  console.log('- First Contentful Paint: < 1.8s');
  console.log('- Time to Interactive: < 3.8s');
  console.log('- Total Bundle Size: < 500KB');
  console.log('- Main Thread Work: < 4s');
}

// Run all checks
checkLargeDependencies();
checkDuplicateComponents();
checkBundleOptimizations();
checkPerformanceMetrics();

console.log('\n✅ Performance check complete!\n');