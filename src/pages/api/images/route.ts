import { type NextRequest, NextResponse } from "next/server"

// Map of verified location images as fallbacks
const VERIFIED_LOCATION_IMAGES: Record<string, string> = {
  "LIMA, PERU": "/images/lima-peru.png",
  "PUERTO MALDONADO, PERU": "/images/puerto-maldonado.png",
  "CUSCO, PERU": "/images/cusco-peru.png",
  "SACRED VALLEY, PERU": "/images/sacred-valley.png",
  "MACHU PICCHU, PERU": "/images/machu-picchu.png",
  "RIO DE JANEIRO, BRAZIL": "/images/rio-de-janeiro.png",
}

// Function to validate image relevance based on tags, description, and location
function validateImageRelevance(imageData: any, location: string): boolean {
  if (!imageData) return false

  // Extract location name without country
  const locationName = location.split(",")[0].toLowerCase().trim()

  // Check description
  if (imageData.description && imageData.description.toLowerCase().includes(locationName)) {
    return true
  }

  // Check alt description
  if (imageData.alt_description && imageData.alt_description.toLowerCase().includes(locationName)) {
    return true
  }

  // Check tags if available
  if (imageData.tags && Array.isArray(imageData.tags)) {
    for (const tag of imageData.tags) {
      if (tag.title && tag.title.toLowerCase().includes(locationName)) {
        return true
      }
    }
  }

  // If location is a major landmark, be more lenient
  if (location.includes("MACHU PICCHU") || location.includes("RIO DE JANEIRO")) {
    return true // These are distinctive enough that we'll trust Unsplash search
  }

  // Default to true for now, but with a warning logged
  console.warn(`Could not verify image relevance for ${location}, using anyway`)
  return true
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")
    const location = searchParams.get("location")

    if (!query || !location) {
      return NextResponse.json({ error: "Missing query or location parameter" }, { status: 400 })
    }

    // Check if we have the Unsplash access key
    const accessKey = process.env.UNSPLASH_ACCESS_KEY
    if (!accessKey || accessKey === 'your_unsplash_api_key_here') {
      console.warn("UNSPLASH_ACCESS_KEY not configured, using fallback image")
      const fallbackImage =
        VERIFIED_LOCATION_IMAGES[location] ||
        `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(location)}`
      return NextResponse.json({ imageUrl: fallbackImage })
    }

    // Try to fetch from Unsplash API first
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      const response = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high`,
        {
          headers: {
            Authorization: `Client-ID ${accessKey}`,
          },
          signal: controller.signal,
        },
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error(`Unsplash API error: ${response.status} - ${response.statusText}`)
        
        // Handle specific error codes
        if (response.status === 403) {
          console.warn("Unsplash API rate limit or permission error, using fallback")
        } else if (response.status === 401) {
          console.warn("Unsplash API authentication error, check your access key")
        }
        
        throw new Error(`Failed to fetch image: ${response.status}`)
      }

      const data = await response.json()

      // Validate image has relevant tags or description
      const isRelevant = validateImageRelevance(data, location)

      if (!isRelevant) {
        console.warn(`Image for ${location} may not be relevant, using verified fallback`)
        const fallbackImage =
          VERIFIED_LOCATION_IMAGES[location] ||
          `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(location)}`
        return NextResponse.json({ imageUrl: fallbackImage })
      }

      // Return the optimized image URL (use 'regular' size for good quality)
      return NextResponse.json({ imageUrl: data.urls.regular })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error("Unsplash API error, falling back to local image:", fetchError)
      
      // Return fallback image on any error
      const fallbackImage =
        VERIFIED_LOCATION_IMAGES[location] ||
        `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(location)}`
      return NextResponse.json({ imageUrl: fallbackImage })
    }
  } catch (error) {
    console.error("Error in images API route:", error)

    // Return fallback image on error
    const location = new URL(request.url).searchParams.get("location") || ""
    const fallbackImage =
      VERIFIED_LOCATION_IMAGES[location] || `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(location)}`

    console.log(`Returning fallback image due to error: ${fallbackImage}`)
    return NextResponse.json({ imageUrl: fallbackImage })
  }
}
