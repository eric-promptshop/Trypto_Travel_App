import { createApi } from 'unsplash-js'

// Initialize Unsplash client
const accessKey = process.env.UNSPLASH_ACCESS_KEY || ''

if (!accessKey) {
}

const unsplash = accessKey ? createApi({ accessKey }) : null

export interface UnsplashImage {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  description: string | null
  alt_description: string | null
  user: {
    name: string
    username: string
  }
  blur_hash: string | null
}

// Cache for image URLs to avoid repeated API calls
const imageCache = new Map<string, UnsplashImage>()

/**
 * Search for images on Unsplash based on a query
 * @param query - Search query (e.g., "Golden Gate Bridge San Francisco")
 * @param perPage - Number of results to return (default: 5)
 */
export async function searchImages(
  query: string,
  perPage: number = 5
): Promise<UnsplashImage[]> {
  try {
    // If no Unsplash client, return empty array
    if (!unsplash) {
      return []
    }

    // Check cache first
    const cacheKey = `${query}-${perPage}`
    if (imageCache.has(cacheKey)) {
      return [imageCache.get(cacheKey)!]
    }

    const result = await unsplash.search.getPhotos({
      query,
      perPage,
      orientation: 'landscape',
    })

    if (result.errors) {
      console.error('Unsplash API error:', result.errors)
      return []
    }

    const images = result.response.results.map((photo) => ({
      id: photo.id,
      urls: photo.urls,
      description: photo.description,
      alt_description: photo.alt_description,
      user: {
        name: photo.user.name,
        username: photo.user.username,
      },
      blur_hash: photo.blur_hash,
    }))

    // Cache the first image
    if (images.length > 0) {
      imageCache.set(cacheKey, images[0])
    }

    return images
  } catch (error) {
    console.error('Error fetching images from Unsplash:', error)
    return []
  }
}

/**
 * Get a single image for a location
 * @param location - Location name (e.g., "Eiffel Tower Paris")
 */
export async function getLocationImage(location: string): Promise<UnsplashImage | null> {
  const images = await searchImages(location, 1)
  return images.length > 0 ? images[0] : null
}

/**
 * Get images for multiple locations
 * @param locations - Array of location names
 */
export async function getLocationImages(
  locations: string[]
): Promise<Map<string, UnsplashImage | null>> {
  const imageMap = new Map<string, UnsplashImage | null>()
  
  // Fetch images in parallel but with a small delay to avoid rate limiting
  const promises = locations.map(async (location, index) => {
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, index * 100))
    const image = await getLocationImage(location)
    imageMap.set(location, image)
  })
  
  await Promise.all(promises)
  return imageMap
}

/**
 * Get image URL with specific dimensions
 * @param image - Unsplash image object
 * @param width - Desired width
 * @param height - Desired height
 */
export function getImageUrl(
  image: UnsplashImage,
  width: number = 800,
  height: number = 400
): string {
  // Use Unsplash's dynamic image resizing
  return `${image.urls.raw}&w=${width}&h=${height}&fit=crop&crop=entropy`
}

/**
 * Get a placeholder image URL for when Unsplash images are not available
 * @param query - Search query to generate a relevant placeholder
 * @param width - Image width
 * @param height - Image height
 */
export function getPlaceholderImage(
  query: string,
  width: number = 800,
  height: number = 400
): string {
  // Use Unsplash's source API as fallback
  const encodedQuery = encodeURIComponent(query)
  return `https://source.unsplash.com/${width}x${height}/?${encodedQuery},travel,landscape`
}