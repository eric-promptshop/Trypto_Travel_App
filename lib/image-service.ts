const VERIFIED_LOCATION_IMAGES: Record<string, string> = {
  "LIMA, PERU": "/images/lima-peru.png",
  "PUERTO MALDONADO, PERU": "/images/puerto-maldonado.png",
  "CUSCO, PERU": "/images/cusco-peru.png",
  "SACRED VALLEY, PERU": "/images/sacred-valley.png",
  "MACHU PICCHU, PERU": "/images/machu-picchu.png",
  "RIO DE JANEIRO, BRAZIL": "/images/rio-de-janeiro.png",
}

// Function to get a real image for a location via API route
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

    // Use our API route with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

    try {
      const response = await fetch(
        `/api/images?query=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}`,
        {
          signal: controller.signal,
        },
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error(`Image API error: ${response.status}`)
        throw new Error(`Failed to fetch image: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      console.log(`Successfully fetched image for ${location}`)
      return data.imageUrl
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    console.error("Error fetching location image:", error)
    // Return a verified fallback image for the location
    const fallbackImage =
      VERIFIED_LOCATION_IMAGES[location] || `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(location)}`
    console.log(`Using fallback image for ${location}: ${fallbackImage}`)
    return fallbackImage
  }
}

// Cache for storing fetched images to avoid repeated API calls
const imageCache: Record<string, string> = {}

// Function to get an image with caching
export async function getCachedLocationImage(location: string, query?: string): Promise<string> {
  const cacheKey = `${location}-${query || ""}`

  // Return cached image if available
  if (imageCache[cacheKey]) {
    console.log(`Using cached image for ${location}`)
    return imageCache[cacheKey]
  }

  try {
    const imageUrl = await getLocationImage(location, query)
    // Cache the result
    imageCache[cacheKey] = imageUrl
    return imageUrl
  } catch (error) {
    console.error("Error in getCachedLocationImage:", error)
    const fallbackImage =
      VERIFIED_LOCATION_IMAGES[location] || `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(location)}`
    // Cache the fallback too to avoid repeated failures
    imageCache[cacheKey] = fallbackImage
    return fallbackImage
  }
}

// Function to preload images for all locations
export async function preloadLocationImages(
  locations: Array<{ location: string; title: string }>,
): Promise<Record<string, string>> {
  const imagePromises = locations.map(async (loc) => {
    try {
      const imageUrl = await getCachedLocationImage(loc.location, loc.title)
      return { location: loc.location, url: imageUrl }
    } catch (error) {
      console.error(`Error preloading image for ${loc.location}:`, error)
      const fallbackImage =
        VERIFIED_LOCATION_IMAGES[loc.location] ||
        `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(loc.location)}`
      return { location: loc.location, url: fallbackImage }
    }
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
    // Return fallback images for all locations
    const fallbackMap: Record<string, string> = {}
    locations.forEach((loc) => {
      fallbackMap[loc.location] =
        VERIFIED_LOCATION_IMAGES[loc.location] ||
        `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(loc.location)}`
    })
    return fallbackMap
  }
}

// Function to get a realistic image URL based on location
export async function getRealisticImageUrl(location: string): Promise<string> {
  try {
    // First try to get from cache
    const cacheKey = `location-${location}`
    const cachedImage = typeof window !== "undefined" ? sessionStorage.getItem(cacheKey) : null

    if (cachedImage) {
      console.log(`Using session cached image for ${location}`)
      return cachedImage
    }

    // Check if we have a verified image for this location
    const verifiedImage = VERIFIED_LOCATION_IMAGES[location]
    if (verifiedImage) {
      console.log(`Using verified image for ${location}: ${verifiedImage}`)

      // Cache the verified image
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(cacheKey, verifiedImage)
        } catch (e) {
          console.warn("Could not cache image URL:", e)
        }
      }

      return verifiedImage
    }

    // Try to fetch from our API route
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
    const fallbackImage =
      VERIFIED_LOCATION_IMAGES[location] || `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(location)}`
    console.log(`Final fallback for ${location}: ${fallbackImage}`)
    return fallbackImage
  }
}
