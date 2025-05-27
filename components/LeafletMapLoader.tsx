"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRealisticImageUrl } from "@/lib/image-service"

interface LocationData {
  day: number
  title: string
  location: string
  latitude: number
  longitude: number
  image?: string
}

interface LeafletMapLoaderProps {
  locations: LocationData[]
  selectedDay?: number
  onMarkerClick?: (day: number) => void
  className?: string
  isItineraryOpen: boolean
}

export function LeafletMapLoader({
  locations,
  selectedDay,
  onMarkerClick,
  className = "",
  isItineraryOpen,
}: LeafletMapLoaderProps) {
  const [isScriptsLoaded, setIsScriptsLoaded] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const popupsRef = useRef<any[]>([])
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const lastSelectedDayRef = useRef<number | undefined>(selectedDay)
  const lastItineraryStateRef = useRef<boolean>(isItineraryOpen)
  const [currentZoom, setCurrentZoom] = useState(4)
  const [activePopupDay, setActivePopupDay] = useState<number | null>(null)
  const isMountedRef = useRef(true)
  // Update the locationImages state to handle promises
  const [locationImages, setLocationImages] = useState<Record<string, string>>({})
  const [isLoadingImages, setIsLoadingImages] = useState(true)

  // Set isMountedRef to false when component unmounts
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Preload location images
  useEffect(() => {
    async function loadImages() {
      setIsLoadingImages(true)

      try {
        // Create a map of location names to image URLs
        const imageMap: Record<string, string> = {}

        // Load images in parallel
        const imagePromises = locations.map(async (location) => {
          try {
            const imageUrl = await getRealisticImageUrl(location.location)
            return { location: location.location, url: imageUrl }
          } catch (error) {
            console.error(`Error loading image for ${location.location}:`, error)
            return {
              location: location.location,
              url:
                location.image || `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(location.location)}`,
            }
          }
        })

        // Wait for all images to load
        const results = await Promise.all(imagePromises)

        // Populate the image map
        results.forEach((result) => {
          imageMap[result.location] = result.url
        })

        if (isMountedRef.current) {
          setLocationImages(imageMap)
        }
      } catch (error) {
        console.error("Error preloading images:", error)
      } finally {
        if (isMountedRef.current) {
          setIsLoadingImages(false)
        }
      }
    }

    // Start loading images
    loadImages()
  }, [locations])

  // Load Leaflet scripts and CSS
  useEffect(() => {
    // Skip if already loaded
    if (isScriptsLoaded || typeof window === "undefined") return
    if ((window as any).L) {
      setIsScriptsLoaded(true)
      return
    }

    // Function to load scripts
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script")
        script.src = src
        script.onload = () => resolve()
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
        document.head.appendChild(script)
      })
    }

    // Function to load CSS
    const loadCSS = (href: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = href
        link.onload = () => resolve()
        link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`))
        document.head.appendChild(link)
      })
    }

    // Load Leaflet resources
    Promise.all([
      loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"),
      loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"),
    ])
      .then(() => {
        if (isMountedRef.current) {
          setIsScriptsLoaded(true)
        }
      })
      .catch((error) => {
        console.error("Failed to load Leaflet:", error)
      })

    // Cleanup function
    return () => {
      // No cleanup needed for script/CSS loading
    }
  }, [isScriptsLoaded])

  // Initialize map after scripts are loaded and container is available
  useEffect(() => {
    if (!isScriptsLoaded || typeof window === "undefined") return

    const L = (window as any).L
    if (!L) {
      console.error("Leaflet not found on window object")
      return
    }

    // Clean up existing map instance if it exists
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove()
      } catch (e) {
        console.error("Error removing existing map:", e)
      }
      mapInstanceRef.current = null
      setIsMapReady(false)
    }

    // Use ref to get the container
    const mapContainer = mapContainerRef.current
    if (!mapContainer) {
      console.error("Map container ref not available")
      return
    }

    // Initialize map with a slight delay to ensure DOM is ready
    const initializeMap = () => {
      try {
        // Double-check the container still exists
        if (!mapContainerRef.current) {
          console.error("Map container lost during initialization")
          return
        }

        // Initialize map
        const map = L.map(mapContainerRef.current, {
          zoomControl: false, // Disable built-in zoom controls
          attributionControl: true,
        }).setView([-15, -60], 4)

        mapInstanceRef.current = map

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        // Wait for the map to be fully loaded
        map.whenReady(() => {
          if (isMountedRef.current) {
            setIsMapReady(true)
            // Add markers after map is ready
            addMarkers(L, map)
            // Focus on selected location
            focusOnSelectedDay(map, false)
          }
        })

        // Track zoom level changes
        map.on("zoomend", () => {
          if (isMountedRef.current) {
            setCurrentZoom(map.getZoom())
          }
        })

        // Add map click handler to close popups when clicking elsewhere
        map.on("click", (e) => {
          // Don't close popups if clicking on a marker
          if ((e.originalEvent.target as HTMLElement).closest(".custom-div-icon")) {
            return
          }

          // Close all popups
          closeAllPopups(map)
          if (isMountedRef.current) {
            setActivePopupDay(null)
          }
        })
      } catch (error) {
        console.error("Error initializing Leaflet map:", error)
      }
    }

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(initializeMap)

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          console.error("Error cleaning up map:", e)
        }
        mapInstanceRef.current = null
        markersRef.current = []
        popupsRef.current = []
        setIsMapReady(false)
      }
    }
  }, [isScriptsLoaded]) // Only re-run when scripts are loaded

  // Helper function to close all popups
  const closeAllPopups = (map: any) => {
    if (!map) return

    try {
      map.closePopup()
      popupsRef.current.forEach((popup) => {
        if (map.hasLayer(popup)) {
          map.closePopup(popup)
        }
      })
    } catch (error) {
      console.error("Error closing popups:", error)
    }
  }

  // Custom zoom functions
  const handleZoomIn = () => {
    if (!mapInstanceRef.current || !isMapReady) return
    try {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1)
    } catch (error) {
      console.error("Error zooming in:", error)
    }
  }

  const handleZoomOut = () => {
    if (!mapInstanceRef.current || !isMapReady) return
    try {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1)
    } catch (error) {
      console.error("Error zooming out:", error)
    }
  }

  // Function to add markers to the map
  const addMarkers = useCallback(
    (L: any, map: any) => {
      if (!map || !L || !isMapReady) return

      // Clear existing markers and popups
      try {
        markersRef.current.forEach((marker) => {
          if (map && marker) {
            map.removeLayer(marker)
          }
        })
        markersRef.current = []
        popupsRef.current = []
      } catch (error) {
        console.error("Error clearing markers:", error)
      }

      // Create custom icon function
      const createCustomIcon = (day: number, isSelected: boolean) => {
        return L.divIcon({
          className: "custom-div-icon",
          html: `
            <div class="relative marker-day-${day}">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${
                isSelected ? "bg-[#ff7b00] text-white" : "bg-[#1f5582] text-white"
              }">
                ${day}
              </div>
              ${
                isSelected
                  ? `
                <div class="absolute -inset-1 rounded-full border-2 border-[#ff7b00] animate-pulse"></div>
                <div class="absolute -inset-3 rounded-full border-2 border-[#ff7b00] opacity-30"></div>
              `
                  : ""
              }
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20],
        })
      }

      // Add markers
      locations.forEach((location) => {
        try {
          // Create popup content - we'll use a simpler approach without complex HTML
          const popupContent = document.createElement("div")
          popupContent.className = "min-w-[200px] max-w-[250px]"

          // Get the image URL for this location
          const imageUrl =
            locationImages[location.location] ||
            location.image ||
            `/placeholder.svg?height=128&width=250&text=${encodeURIComponent(location.location)}`

          // Add image
          const imageContainer = document.createElement("div")
          imageContainer.className = "relative h-32 w-full"

          const img = document.createElement("img")
          img.src = imageUrl
          img.alt = location.location
          img.className = "w-full h-full object-cover rounded-t-lg"

          // Add loading state
          img.style.opacity = "0"
          img.onload = () => {
            img.style.opacity = "1"
          }

          img.onerror = function () {
            this.src =
              location.image || `/placeholder.svg?height=128&width=250&text=${encodeURIComponent(location.location)}`
          }

          // Add day number overlay on the image
          const dayOverlay = document.createElement("div")
          dayOverlay.className =
            "absolute top-2 left-2 bg-[#ff7b00] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg"
          dayOverlay.textContent = location.day.toString()

          imageContainer.appendChild(img)
          imageContainer.appendChild(dayOverlay)
          popupContent.appendChild(imageContainer)

          // Add explore link with proper event handling
          const exploreLink = document.createElement("p")
          exploreLink.className =
            "text-xs text-[#ff7b00] font-medium cursor-pointer hover:underline explore-day text-center py-2 px-3 bg-white rounded-b-lg"
          exploreLink.textContent = "Click to explore this day"
          exploreLink.setAttribute("data-day", location.day.toString())

          // Add click handler directly to the element
          exploreLink.addEventListener("click", (e) => {
            e.preventDefault()
            e.stopPropagation()

            if (onMarkerClick && isMountedRef.current) {
              console.log("Explore link clicked for day:", location.day)
              onMarkerClick(location.day)

              // Close the popup after clicking
              closeAllPopups(map)
            }
          })

          popupContent.appendChild(exploreLink)

          // Create popup with specific options
          const popup = L.popup({
            maxWidth: 250,
            className: "custom-popup",
            closeButton: true,
            autoClose: false,
            closeOnClick: false,
            closeOnEscapeKey: true,
          }).setContent(popupContent)

          // Create marker with custom icon
          const marker = L.marker([location.latitude, location.longitude], {
            icon: createCustomIcon(location.day, location.day === selectedDay),
            interactive: true, // Ensure marker is interactive
            bubblingMouseEvents: false, // Prevent event bubbling
          })

          // Bind popup to marker
          marker.bindPopup(popup)

          // Add marker to map
          marker.addTo(map)

          // Add click handler with explicit popup management
          marker.on("click", function (e) {
            console.log("Marker clicked for day:", location.day)

            // Stop propagation to prevent map click handler
            L.DomEvent.stopPropagation(e)

            // Set the active popup day
            if (isMountedRef.current) {
              setActivePopupDay(location.day)
            }

            // Close any open popups first
            closeAllPopups(map)

            // Open this popup
            this.openPopup()

            // IMPORTANT: Also navigate to the day when clicking the marker
            if (onMarkerClick && isMountedRef.current) {
              onMarkerClick(location.day)
            }
          })

          // Store popup reference
          popupsRef.current.push(popup)

          // Store marker reference
          markersRef.current.push(marker)
        } catch (err) {
          console.error("Error creating marker:", err)
        }
      })
    },
    [selectedDay, onMarkerClick, isMapReady, locationImages],
  )

  // Enhanced function to focus on selected day with better animation
  const focusOnSelectedDay = useCallback(
    (map: any, withAnimation = true) => {
      if (!selectedDay || !map || !isMapReady) return

      try {
        const selected = locations.find((loc) => loc.day === selectedDay)
        if (selected) {
          // Calculate the center point adjustment based on itinerary state
          let offsetX = 0

          // If itinerary is open, offset the center point to account for the sidebar
          if (isItineraryOpen) {
            // Get the map container width
            const mapContainer = mapContainerRef.current
            if (mapContainer) {
              // Offset by 25% of the map width (half of the 50% sidebar width)
              offsetX = -mapContainer.clientWidth * 0.25
            }
          }

          // Create a new point with the offset
          const targetPoint = map.project([selected.latitude, selected.longitude], 6).add([offsetX, 0])
          const targetLatLng = map.unproject(targetPoint, 6)

          // Set the view with or without animation
          if (withAnimation) {
            map.flyTo(targetLatLng, 6, {
              animate: true,
              duration: 1.5,
              easeLinearity: 0.25,
            })
          } else {
            map.setView(targetLatLng, 6, {
              animate: false,
            })
          }
        }
      } catch (error) {
        console.error("Error focusing on day:", error)
      }
    },
    [selectedDay, isItineraryOpen, locations, isMapReady],
  )

  // Update markers and focus when selected day changes
  useEffect(() => {
    if (!isScriptsLoaded || !isMapReady || typeof window === "undefined" || !mapInstanceRef.current) return

    const L = (window as any).L
    if (!L) return

    try {
      // Check if selected day has changed
      const dayChanged = lastSelectedDayRef.current !== selectedDay
      // Check if itinerary state has changed
      const itineraryStateChanged = lastItineraryStateRef.current !== isItineraryOpen

      // Update markers with new selection state
      addMarkers(L, mapInstanceRef.current)

      // Focus on selected day - use animation only when day changes, not on layout changes
      focusOnSelectedDay(mapInstanceRef.current, dayChanged)

      // Update refs for next comparison
      lastSelectedDayRef.current = selectedDay
      lastItineraryStateRef.current = isItineraryOpen
    } catch (error) {
      console.error("Error updating map:", error)
    }
  }, [selectedDay, locations, isScriptsLoaded, isMapReady, isItineraryOpen, addMarkers, focusOnSelectedDay])

  // Handle window resize to ensure map is properly centered
  useEffect(() => {
    if (!isScriptsLoaded || !isMapReady || typeof window === "undefined" || !mapInstanceRef.current) return

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
        // Re-center map on resize without animation
        focusOnSelectedDay(mapInstanceRef.current, false)
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [isScriptsLoaded, isMapReady, focusOnSelectedDay])

  if (!isScriptsLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 h-full ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1f5582] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map resources...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full"></div>

      {/* Custom Zoom Controls */}
      {isMapReady && (
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1000]">
          <Button
            variant="outline"
            size="icon"
            className="bg-white shadow-md hover:bg-gray-50 h-10 w-10 rounded-md relative overflow-visible"
            onClick={handleZoomIn}
            type="button"
          >
            <Plus className="h-5 w-5 text-[#1f5582] pointer-events-none" />
            <span className="sr-only">Zoom in</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-white shadow-md hover:bg-gray-50 h-10 w-10 rounded-md relative overflow-visible"
            onClick={handleZoomOut}
            type="button"
          >
            <Minus className="h-5 w-5 text-[#1f5582] pointer-events-none" />
            <span className="sr-only">Zoom out</span>
          </Button>
        </div>
      )}

      {/* Map Info Overlay */}
      {isMapReady && (
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-600 z-[400]">
          <div className="text-[10px] opacity-70">Click markers to explore • Zoom: {currentZoom.toFixed(1)}x</div>
        </div>
      )}
    </div>
  )
}
