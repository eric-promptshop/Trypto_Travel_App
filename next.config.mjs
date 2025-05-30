/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output configuration for Docker
  output: 'standalone',
  
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
    ],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  },
  
  // CI/CD optimizations
  eslint: {
    ignoreDuringBuilds: false, // Enable linting in CI
  },
  typescript: {
    ignoreBuildErrors: false, // Enable type checking in CI
  },
  
  // Performance optimizations
  poweredByHeader: false,
}

export default nextConfig
