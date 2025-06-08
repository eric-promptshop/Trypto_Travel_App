'use client'

import { AdaptiveImage } from '@/components/images/adaptive-image'
import { CURRENT_CONFIG } from '@/components/images/cloudinary-config'

export default function TestCloudinaryPage() {
  const testImageUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4'
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Cloudinary Configuration Test</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-xl font-semibold mb-2">Current Configuration:</h2>
        <pre className="bg-white p-3 rounded text-sm">
          {JSON.stringify({
            cloudName: CURRENT_CONFIG.cloudName,
            useCloudinaryFetch: CURRENT_CONFIG.useCloudinaryFetch,
            hasApiKey: !!CURRENT_CONFIG.apiKey,
            hasApiSecret: !!CURRENT_CONFIG.apiSecret,
            environment: process.env.NODE_ENV
          }, null, 2)}
        </pre>
      </div>
      
      <div className="grid gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Test Image (Low Quality)</h3>
          <AdaptiveImage
            src={testImageUrl}
            alt="Mountain landscape - Low quality"
            width={600}
            height={400}
            quality="low"
            className="rounded shadow-lg"
          />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Test Image (High Quality)</h3>
          <AdaptiveImage
            src={testImageUrl}
            alt="Mountain landscape - High quality"
            width={600}
            height={400}
            quality="high"
            className="rounded shadow-lg"
          />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Different Sizes</h3>
          <div className="flex gap-4">
            <AdaptiveImage
              src={testImageUrl}
              alt="Small"
              width={200}
              height={150}
              className="rounded"
            />
            <AdaptiveImage
              src={testImageUrl}
              alt="Medium"
              width={400}
              height={300}
              className="rounded"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded">
        <p className="text-sm">
          <strong>Expected Behavior:</strong> Images should load through Cloudinary with your cloud name "dxiitzvim".
          Check the Network tab in DevTools to verify images are being served from res.cloudinary.com/dxiitzvim/
        </p>
      </div>
    </div>
  )
}