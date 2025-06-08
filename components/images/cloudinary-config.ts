// Cloudinary Configuration for Travel Itinerary Builder
// This file shows how to configure Cloudinary for both demo and production use

export interface CloudinaryConfig {
  cloudName: string;
  useCloudinaryFetch: boolean;
  apiKey?: string; // Only needed for uploads/management
  apiSecret?: string; // Only needed for uploads/management
}

// Demo Configuration (No account needed)
// Uses Cloudinary's demo account to transform external images
export const DEMO_CONFIG: CloudinaryConfig = {
  cloudName: 'demo',
  useCloudinaryFetch: true, // Fetch and transform external URLs (like Unsplash)
};

// Production Configuration (Free Cloudinary account required)
// 1. Sign up at https://cloudinary.com (free tier: 25GB storage, 25GB bandwidth/month)
// 2. Get your cloud name from the dashboard
// 3. Replace 'your-cloud-name' with your actual cloud name
export const PRODUCTION_CONFIG: CloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  useCloudinaryFetch: true, // Use fetch mode to transform external images (Unsplash, etc.)
  // API credentials only needed if you plan to upload images programmatically
  ...(process.env.CLOUDINARY_API_KEY && { apiKey: process.env.CLOUDINARY_API_KEY }),
  ...(process.env.CLOUDINARY_API_SECRET && { apiSecret: process.env.CLOUDINARY_API_SECRET }),
};

// Current configuration - use production config if cloud name is provided
export const CURRENT_CONFIG: CloudinaryConfig = 
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME !== 'your-cloud-name'
    ? PRODUCTION_CONFIG 
    : DEMO_CONFIG;

// Helper function to get image sources with current config
export function getImageSources(baseUrl: string, options: {
  qualities?: ('low' | 'medium' | 'high' | 'original')[];
  width: number;
  height: number;
  format?: 'webp' | 'jpg' | 'png' | 'auto';
}) {
  return {
    ...options,
    cloudName: CURRENT_CONFIG.cloudName,
    useCloudinaryFetch: CURRENT_CONFIG.useCloudinaryFetch,
    format: options.format || 'auto',
  };
}

// Environment Variables Setup (for production):
// Add to your .env.local file:
/*
# Cloudinary Configuration (get from https://console.cloudinary.com)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# Optional: Only needed for programmatic uploads
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
*/

// Example Usage:
/*
import { useImageSources } from '../adaptive-image';
import { getImageSources } from './cloudinary-config';

const sources = useImageSources(imageUrl, getImageSources(imageUrl, {
  width: 400,
  height: 300,
  qualities: ['low', 'medium', 'high'],
}));
*/ 