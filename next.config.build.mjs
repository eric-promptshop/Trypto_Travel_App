/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal config for build testing
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  images: {
    domains: [
      'localhost',
      'maps.googleapis.com',
      'res.cloudinary.com',
      'source.unsplash.com',
      'images.unsplash.com',
      'api.mapbox.com',
    ],
  },
  
  // Disable telemetry
  telemetry: false,
  
  // Optimize build
  swcMinify: true,
  productionBrowserSourceMaps: false,
  
  // Skip type checking and linting during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig