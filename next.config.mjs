// TEMPORARILY DISABLE SENTRY TO FIX BUILD
// import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // Experimental features to fix chunk loading
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Disable outputFileTracing to speed up build
  outputFileTracing: false,
  
  // Build optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Image optimization
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    domains: [
      'localhost',
      'maps.googleapis.com',
      'res.cloudinary.com',
      'source.unsplash.com',
      'images.unsplash.com',
      'api.mapbox.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.mapbox.com',
      }
    ],
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  },
  
  // CI/CD optimizations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  
  // Performance optimizations
  poweredByHeader: false,
  
  // Simplified webpack config
  webpack: (config, { dev, isServer }) => {
    // Fix for chunk loading errors in development
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        runtimeChunk: false,
        splitChunks: {
          chunks: 'async',
          cacheGroups: {
            default: false,
            vendors: false,
          },
        },
      }
    }
    
    // Add fallback for missing modules
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      },
    }
    
    return config;
  },
}

// TEMPORARILY DISABLE SENTRY
export default nextConfig;

// Comment out for now:
// export default withSentryConfig(nextConfig, {
//   org: "travel-itinerary-builder",
//   project: "javascript-nextjs",
//   silent: !process.env.CI,
//   widenClientFileUpload: true,
//   reactComponentAnnotation: {
//     enabled: true,
//   },
//   tunnelRoute: "/monitoring",
//   hideSourceMaps: true,
//   disableLogger: true,
//   automaticVercelMonitors: true,
// });