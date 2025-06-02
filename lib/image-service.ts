// Image service to fetch real location images

// Map of verified location images as fallbacks
const VERIFIED_LOCATION_IMAGES: Record<string, string> = {
  "LIMA, PERU": "/images/lima-peru.png",
  "PUERTO MALDONADO, PERU": "/images/puerto-maldonado.png",
  "CUSCO, PERU": "/images/cusco-peru.png",
  "SACRED VALLEY, PERU": "/images/sacred-valley.png",
  "MACHU PICCHU, PERU": "/images/machu-picchu.png",
  "RIO DE JANEIRO, BRAZIL": "/images/rio-de-janeiro.png",
}

// Function to get a real image for a location
export async function getLocationImage(location: string, query?: string): Promise<string> {
  try {
    // Format the search query with specific landmarks to improve relevance
    let searchQuery = ""

    if (location.includes("LIMA")) {
      searchQuery = "lima peru miraflores skyline plaza de armas"
    } else if (location.includes("PUERTO MALDONADO")) {
      searchQuery = "amazon rainforest puerto maldonado peru jungle"
    } else if (location.includes("CUSCO")) {
      searchQuery = "cusco peru plaza de armas cathedral inca"
    } else if (location.includes("SACRED VALLEY")) {
      searchQuery = "sacred valley peru pisac ollantaytambo inca terraces"
    } else if (location.includes("MACHU PICCHU")) {
      searchQuery = "machu picchu inca ruins huayna picchu mountain"
    } else if (location.includes("RIO DE JANEIRO")) {
      searchQuery = "rio de janeiro christ redeemer copacabana sugarloaf"
    } else {
      searchQuery = `${location.toLowerCase().replace(/,.*$/, "")} landmark travel destination`
    }

    // Override with custom query if provided
    if (query) {
      searchQuery = query
    }

    console.log(`Fetching image for: ${searchQuery}`)

    // Use Unsplash API to get a random image for the location
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
        searchQuery,
      )}&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`,
        },
      },
    )

    if (!response.ok) {
      console.error(`Unsplash API error: ${response.status}`)
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Successfully fetched image for ${location}`)

    // Validate image has relevant tags or description
    const isRelevant = validateImageRelevance(data, location)

    if (!isRelevant) {
      console.warn(`Image for ${location} may not be relevant, using verified fallback`)
      return (
        VERIFIED_LOCATION_IMAGES[location] ||
        `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(location)}`
      )
    }

    return data.urls.regular
  } catch (error) {
    console.error("Error fetching location image:", error)
    // Return a verified fallback image for the location
    return (
      VERIFIED_LOCATION_IMAGES[location] || `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(location)}`
    )
  }
}

// Function to validate image relevance based on tags, description, and location
function validateImageRelevance(imageData: any, location: string): boolean {
  if (!imageData || !location) return false

  // Extract location name without country
  const locationParts = location.split(",")
  const locationName = locationParts[0]?.toLowerCase().trim() || ""

  if (!locationName) return false

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

// Cache for storing fetched images to avoid repeated API calls
const imageCache: Record<string, string> = {}

// Function to get an image with caching
export async function getCachedLocationImage(location: string, query?: string): Promise<string> {
  const cacheKey = `${location}-${query || ""}`

  // Return cached image if available
  if (imageCache[cacheKey]) {
    return imageCache[cacheKey]
  }

  try {
    const imageUrl = await getLocationImage(location, query)
    // Cache the result
    imageCache[cacheKey] = imageUrl
    return imageUrl
  } catch (error) {
    console.error("Error in getCachedLocationImage:", error)
    return (
      VERIFIED_LOCATION_IMAGES[location] || `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(location)}`
    )
  }
}

// Function to preload images for all locations
export async function preloadLocationImages(
  locations: Array<{ location: string; title: string }>,
): Promise<Record<string, string>> {
  const imagePromises = locations.map(async (loc) => {
    const imageUrl = await getCachedLocationImage(loc.location, loc.title)
    return { location: loc.location, url: imageUrl }
  })

  try {
    const results = await Promise.all(imagePromises)
    const imageMap: Record<string, string> = {}

    results.forEach((result) => {
      imageMap[result.location] = result.url
    })

    return imageMap
  } catch (error) {
    console.error("Error preloading images:", error)
    return {}
  }
}

// Function to get a realistic image URL based on location
export async function getRealisticImageUrl(location: string): Promise<string> {
  try {
    // First try to get from cache
    const cacheKey = `location-${location}`
    const cachedImage = typeof window !== "undefined" ? sessionStorage.getItem(cacheKey) : null

    if (cachedImage) {
      return cachedImage
    }

    // If no cached image, use our verified images as a fallback
    const fallbackImage = VERIFIED_LOCATION_IMAGES[location]

    // Fetch from Unsplash
    const imageUrl = await getLocationImage(location)

    // Cache the result
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(cacheKey, imageUrl)
      } catch (e) {
        console.warn("Could not cache image URL:", e)
      }
    }

    return imageUrl
  } catch (error) {
    console.error("Error getting realistic image:", error)
    return (
      VERIFIED_LOCATION_IMAGES[location] || `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(location)}`
    )
  }
}
