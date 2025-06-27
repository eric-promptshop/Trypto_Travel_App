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
  const [isInitializing, setIsInitializing] = useState(false)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const popupsRef = useRef<any[]>([])
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const lastSelectedDayRef = useRef<number | undefined>(selectedDay)
  const lastItineraryStateRef = useRef<boolean>(isItineraryOpen)
  const [currentZoom, setCurrentZoom] = useState(4)
  const [activePopupDay, setActivePopupDay] = useState<number | null>(null)
  const isMountedRef = useRef(true)
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [locationImages, setLocationImages] = useState<Record<string, string>>({})
  const [isLoadingImages, setIsLoadingImages] = useState(true)

  // Set isMountedRef to false when component unmounts
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
        initTimeoutRef.current = null
      }
    }
  }, [])

  // Preload location images
  useEffect(() => {
    async function loadImages() {
      if (!locations.length) return

      setIsLoadingImages(true)

      try {
        const imageMap: Record<string, string> = {}
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

        const results = await Promise.all(imagePromises)
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

    loadImages()
  }, [locations])

  // Load Leaflet scripts and CSS with better error handling
  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if Leaflet is already available
    if ((window as any).L && typeof (window as any).L.map === "function") {
      setIsScriptsLoaded(true)
      return
    }

    if (isScriptsLoaded) return


    const loadCSS = (href: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check if CSS already exists
        const existingLink = document.querySelector(`link[href="${href}"]`)
        if (existingLink) {
          resolve()
          return
        }

        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = href
        link.onload = () => {
          resolve()
        }
        link.onerror = () => {
          const error = `Failed to load CSS: ${href}`
          console.error(error)
          reject(new Error(error))
        }
        document.head.appendChild(link)
      })
    }

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check if script already exists
        const existingScript = document.querySelector(`script[src="${src}"]`)
        if (existingScript) {
          // Wait a bit and check if L is available
          setTimeout(() => {
            if ((window as any).L && typeof (window as any).L.map === "function") {
              resolve()
            } else {
              reject(new Error("Leaflet script loaded but L object not available"))
            }
          }, 100)
          return
        }

        const script = document.createElement("script")
        script.src = src
        script.async = false // Ensure synchronous loading
        script.onload = () => {
          // Wait a moment for the script to initialize
          setTimeout(() => {
            if ((window as any).L && typeof (window as any).L.map === "function") {
              resolve()
            } else {
              const error = "Leaflet script loaded but L object not available"
              console.error(error)
              reject(new Error(error))
            }
          }, 100)
        }
        script.onerror = () => {
          const error = `Failed to load script: ${src}`
          console.error(error)
          reject(new Error(error))
        }
        document.head.appendChild(script)
      })
    }

    // Load resources sequentially
    const loadLeaflet = async () => {
      try {
        setLoadingError(null)

        // Load CSS first
        await loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css")

        // Then load JavaScript
        await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js")

        // Final verification
        if ((window as any).L && typeof (window as any).L.map === "function") {
          if (isMountedRef.current) {
            setIsScriptsLoaded(true)
          }
        } else {
          throw new Error("Leaflet failed final verification")
        }
      } catch (error) {
        console.error("Failed to load Leaflet:", error)
        if (isMountedRef.current) {
          setLoadingError(error instanceof Error ? error.message : "Failed to load map resources")
        }
      }
    }

    loadLeaflet()
  }, [isScriptsLoaded])

  // Clean up existing map instance
  const cleanupMap = useCallback(() => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove()
      } catch (e) {
        console.error("Error removing existing map:", e)
      }
      mapInstanceRef.current = null
      markersRef.current = []
      popupsRef.current = []
      setIsMapReady(false)
    }
  }, [])

  // Initialize map after scripts are loaded and container is available
  useEffect(() => {
    if (!isScriptsLoaded || typeof window === "undefined" || isInitializing || loadingError) return

    // Verify Leaflet is actually available
    const L = (window as any).L
    if (!L || typeof L.map !== "function") {
      console.error("Leaflet not properly loaded")
      setLoadingError("Map library not properly loaded")
      return
    }


    // Clear any existing timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current)
      initTimeoutRef.current = null
    }

    // Clean up existing map
    cleanupMap()

    const initializeMap = () => {
      if (!isMountedRef.current || isInitializing) return

      setIsInitializing(true)

      // Double-check the container still exists and is in the DOM
      const mapContainer = mapContainerRef.current
      if (!mapContainer || !document.contains(mapContainer)) {
        console.error("Map container not available or not in DOM")
        setIsInitializing(false)
        return
      }

      // Verify Leaflet is still available
      const L = (window as any).L
      if (!L || typeof L.map !== "function") {
        console.error("Leaflet not available during initialization")
        setLoadingError("Map library not available")
        setIsInitializing(false)
        return
      }

      try {

        // Initialize map with error handling
        const map = L.map(mapContainer, {
          zoomControl: false,
          attributionControl: true,
          preferCanvas: true,
        }).setView([-15, -60], 4)

        mapInstanceRef.current = map

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(map)

        // Wait for the map to be fully loaded
        map.whenReady(() => {
          if (isMountedRef.current && mapInstanceRef.current === map) {
            setIsMapReady(true)
            setIsInitializing(false)
            // Add markers after map is ready
            addMarkers(L, map)
            // Focus on selected location
            focusOnSelectedDay(map, false)
          }
        })

        // Track zoom level changes
        map.on("zoomend", () => {
          if (isMountedRef.current && mapInstanceRef.current === map) {
            setCurrentZoom(map.getZoom())
          }
        })

        // Add map click handler to close popups when clicking elsewhere
        map.on("click", (e: any) => {
          if ((e.originalEvent.target as HTMLElement).closest(".custom-div-icon")) {
            return
          }
          closeAllPopups(map)
          if (isMountedRef.current) {
            setActivePopupDay(null)
          }
        })

        // Handle map errors
        map.on("error", (e: any) => {
          console.error("Map error:", e)
        })
      } catch (error) {
        console.error("Error initializing Leaflet map:", error)
        setLoadingError("Failed to initialize map")
        setIsInitializing(false)
      }
    }

    // Use a timeout to ensure DOM is stable
    initTimeoutRef.current = setTimeout(initializeMap, 200)

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
        initTimeoutRef.current = null
      }
      setIsInitializing(false)
    }
  }, [isScriptsLoaded, cleanupMap, loadingError])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMap()
    }
  }, [cleanupMap])

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
      if (!map || !L || !isMapReady || !locations.length) return

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
          const popupContent = document.createElement("div")
          popupContent.className = "min-w-[200px] max-w-[250px]"

          const imageUrl =
            locationImages[location.location] ||
            location.image ||
            `/placeholder.svg?height=128&width=250&text=${encodeURIComponent(location.location)}`

          const imageContainer = document.createElement("div")
          imageContainer.className = "relative h-32 w-full"

          const img = document.createElement("img")
          img.src = imageUrl
          img.alt = location.location
          img.className = "w-full h-full object-cover rounded-t-lg"
          img.style.opacity = "0"
          img.onload = () => {
            img.style.opacity = "1"
          }
          img.onerror = function () {
            this.src =
              location.image || `/placeholder.svg?height=128&width=250&text=${encodeURIComponent(location.location)}`
          }

          const dayOverlay = document.createElement("div")
          dayOverlay.className =
            "absolute top-2 left-2 bg-[#ff7b00] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg"
          dayOverlay.textContent = location.day.toString()

          imageContainer.appendChild(img)
          imageContainer.appendChild(dayOverlay)
          popupContent.appendChild(imageContainer)

          const exploreLink = document.createElement("p")
          exploreLink.className =
            "text-xs text-[#ff7b00] font-medium cursor-pointer hover:underline explore-day text-center py-2 px-3 bg-white rounded-b-lg"
          exploreLink.textContent = "Click to explore this day"
          exploreLink.setAttribute("data-day", location.day.toString())

          exploreLink.addEventListener("click", (e) => {
            e.preventDefault()
            e.stopPropagation()

            if (onMarkerClick && isMountedRef.current) {
              onMarkerClick(location.day)
              closeAllPopups(map)
            }
          })

          popupContent.appendChild(exploreLink)

          const popup = L.popup({
            maxWidth: 250,
            className: "custom-popup",
            closeButton: true,
            autoClose: false,
            closeOnClick: false,
            closeOnEscapeKey: true,
          }).setContent(popupContent)

          const marker = L.marker([location.latitude, location.longitude], {
            icon: createCustomIcon(location.day, location.day === selectedDay),
            interactive: true,
            bubblingMouseEvents: false,
          })

          marker.bindPopup(popup)
          marker.addTo(map)

          marker.on("click", function (this: any, e: any) {
            L.DomEvent.stopPropagation(e)

            if (isMountedRef.current) {
              setActivePopupDay(location.day)
            }

            closeAllPopups(map)
            this.openPopup()

            if (onMarkerClick && isMountedRef.current) {
              onMarkerClick(location.day)
            }
          })

          popupsRef.current.push(popup)
          markersRef.current.push(marker)
        } catch (err) {
          console.error("Error creating marker:", err)
        }
      })
    },
    [selectedDay, onMarkerClick, isMapReady, locationImages, locations],
  )

  // Enhanced function to focus on selected day with better animation
  const focusOnSelectedDay = useCallback(
    (map: any, withAnimation = true) => {
      if (!selectedDay || !map || !isMapReady || !locations.length) return

      try {
        const selected = locations.find((loc) => loc.day === selectedDay)
        if (selected) {
          let offsetX = 0
          let offsetY = 0

          // Adjust for itinerary panels when open
          if (isItineraryOpen) {
            const mapContainer = mapContainerRef.current
            if (mapContainer) {
              // Account for left and right panels (total 640px width)
              offsetX = -mapContainer.clientWidth * 0.1 // Slight left offset
              offsetY = mapContainer.clientHeight * 0.05 // Slight top offset for header
            }
          }

          const targetPoint = map.project([selected.latitude, selected.longitude], 6).add([offsetX, offsetY])
          const targetLatLng = map.unproject(targetPoint, 6)

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
      const dayChanged = lastSelectedDayRef.current !== selectedDay
      const itineraryStateChanged = lastItineraryStateRef.current !== isItineraryOpen

      addMarkers(L, mapInstanceRef.current)
      focusOnSelectedDay(mapInstanceRef.current, dayChanged)

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
        try {
          mapInstanceRef.current.invalidateSize()
          focusOnSelectedDay(mapInstanceRef.current, false)
        } catch (error) {
          console.error("Error handling resize:", error)
        }
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isScriptsLoaded, isMapReady, focusOnSelectedDay])

  // Show error state if loading failed
  if (loadingError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 h-full ${className}`}>
        <div className="text-center p-6">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600 mb-2">Failed to load map</p>
          <p className="text-xs text-gray-500">{loadingError}</p>
          <button
            onClick={() => {
              setLoadingError(null)
              setIsScriptsLoaded(false)
            }}
            className="mt-3 px-4 py-2 bg-[#1f5582] text-white rounded text-sm hover:bg-[#1f5582]/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!isScriptsLoaded || isInitializing) {
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
      <div ref={mapContainerRef} className="w-full h-full" />

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
