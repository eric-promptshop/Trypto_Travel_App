'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const TEST_LOCATIONS = [
  { name: 'LIMA, PERU', query: 'Lima Peru city' },
  { name: 'CUSCO, PERU', query: 'Cusco Peru Andes' },
  { name: 'MACHU PICCHU, PERU', query: 'Machu Picchu ruins' },
  { name: 'RIO DE JANEIRO, BRAZIL', query: 'Rio de Janeiro Christ Redeemer' },
  { name: 'TOKYO, JAPAN', query: 'Tokyo city skyline' },
  { name: 'PARIS, FRANCE', query: 'Paris Eiffel Tower' }
]

export default function TestUnsplashPage() {
  const [images, setImages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchImage = async (location: string, query: string) => {
    setLoading(prev => ({ ...prev, [location]: true }))
    setErrors(prev => ({ ...prev, [location]: '' }))
    
    try {
      const response = await fetch(`/api/images?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setImages(prev => ({ ...prev, [location]: data.imageUrl }))
    } catch (error) {
      console.error(`Error fetching image for ${location}:`, error)
      setErrors(prev => ({ ...prev, [location]: error instanceof Error ? error.message : 'Failed to fetch image' }))
    } finally {
      setLoading(prev => ({ ...prev, [location]: false }))
    }
  }

  useEffect(() => {
    // Fetch all test images
    TEST_LOCATIONS.forEach(({ name, query }) => {
      fetchImage(name, query)
    })
  }, [])

  const isUnsplashImage = (url: string) => {
    return url.includes('unsplash.com')
  }

  const isFallbackImage = (url: string) => {
    return url.includes('/images/') || url.includes('placeholder')
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Unsplash Integration Test</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-xl font-semibold mb-2">Configuration Status:</h2>
        <div className="text-sm font-mono">
          <p>UNSPLASH_ACCESS_KEY: {process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ? '✅ Set (client-side check not available)' : '❌ Check server config'}</p>
          <p className="text-xs text-gray-600 mt-2">Note: Access key is server-side only for security</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {TEST_LOCATIONS.map(({ name, query }) => (
          <div key={name} className="border rounded-lg overflow-hidden shadow-lg">
            <div className="p-4 bg-gray-50">
              <h3 className="font-semibold">{name}</h3>
              <p className="text-xs text-gray-600">Query: {query}</p>
            </div>
            
            {loading[name] ? (
              <div className="h-48 flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : errors[name] ? (
              <div className="h-48 flex items-center justify-center bg-red-50 p-4">
                <p className="text-red-600 text-sm text-center">{errors[name]}</p>
              </div>
            ) : images[name] ? (
              <div className="relative h-48">
                <Image
                  src={images[name]}
                  alt={name}
                  fill
                  className="object-cover"
                  unoptimized={isUnsplashImage(images[name])}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs">
                  {isUnsplashImage(images[name]) ? (
                    <span className="text-green-400">✅ Unsplash API</span>
                  ) : isFallbackImage(images[name]) ? (
                    <span className="text-yellow-400">⚠️ Fallback Image</span>
                  ) : (
                    <span className="text-gray-400">? Unknown Source</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-48 bg-gray-200"></div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Images from Unsplash API are marked in green</li>
          <li>⚠️ Fallback images (local or placeholder) are marked in yellow</li>
          <li>❌ Errors indicate API issues (check console for details)</li>
        </ul>
        <p className="text-xs text-gray-600 mt-2">
          Check the Network tab in DevTools to see API calls to /api/images
        </p>
      </div>

      <div className="mt-4 flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh All Images
        </button>
      </div>
    </div>
  )
}