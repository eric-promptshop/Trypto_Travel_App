"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePlanStore } from '@/store/planStore'

interface GoogleMapCanvasProps {
  className?: string
  aspectRatio?: string
  onError?: () => void
  center?: { lat: number; lng: number }
  zoom?: number
  places?: Array<{
    id: string
    name: string
    location: {
      coordinates: {
        latitude: number
        longitude: number
      }
    }
    category?: string
  }>
  onPlaceSelect?: (place: any) => void
}

declare global {
  interface Window {
    google: any
    initGoogleMap: () => void
  }
}

export default function GoogleMapCanvas({ className, aspectRatio = "16/9", onError }: GoogleMapCanvasProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylineRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { 
    itinerary, 
    mapCenter, 
    mapZoom, 
    currentPoiId,
    selectedPoiId,
    flyToPoi,
    flyToBounds,
    setMapCenter,
    setMapZoom 
  } = usePlanStore()

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Fetch API key from server
        const response = await fetch('/api/maps/config')
        if (!response.ok) {
          throw new Error('Failed to fetch maps configuration')
        }
        
        const config = await response.json()
        const apiKey = config.apiKey
        
        if (!apiKey) {
          setError('Google Maps API key not configured')
          setIsLoading(false)
          onError?.()
          return
        }

        // Check if already loaded
        if (window.google && window.google.maps) {
          initializeMap()
          return
        }

        // Create script tag
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = true
        script.defer = true
        
        // Define initialization callback
        window.initGoogleMap = () => {
          initializeMap()
        }
        
        script.src += '&callback=initGoogleMap'
        
        script.onerror = () => {
          setError('Failed to load Google Maps')
          setIsLoading(false)
          onError?.()
        }
        
        document.head.appendChild(script)
      } catch (error) {
        setError('Failed to load maps configuration')
        setIsLoading(false)
        onError?.()
      }
    }
    
    loadGoogleMaps()
    
    return () => {
      delete window.initGoogleMap
      const scriptTag = document.querySelector(`script[src*="maps.googleapis.com"]`)
      if (scriptTag) {
        scriptTag.remove()
      }
    }
  }, [onError])

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return
    
    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: mapCenter[0], lng: mapCenter[1] },
        zoom: mapZoom,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ],
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false
      })
      
      googleMapRef.current = map
      
      // Add zoom and center change listeners
      map.addListener('zoom_changed', () => {
        const zoom = map.getZoom()
        if (zoom !== undefined) {
          setMapZoom(zoom)
        }
      })
      
      map.addListener('center_changed', () => {
        const center = map.getCenter()
        if (center) {
          setMapCenter([center.lat(), center.lng()])
        }
      })
      
      setIsLoading(false)
      updateMarkers()
    } catch (err) {
      console.error('Error initializing map:', err)
      setError('Failed to initialize Google Maps')
      setIsLoading(false)
      onError?.()
    }
  }, [mapCenter, mapZoom, setMapCenter, setMapZoom, onError])

  // Update markers when itinerary changes
  const updateMarkers = useCallback(() => {
    if (!googleMapRef.current || !window.google) return
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
    
    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null)
    }
    
    if (!itinerary || !itinerary.days) return
    
    const bounds = new window.google.maps.LatLngBounds()
    const path: any[] = []
    
    // Add markers for each POI in the selected day
    const selectedDay = itinerary.days.find(d => d.id === itinerary.selectedDayId)
    if (selectedDay) {
      selectedDay.slots.forEach((slot, slotIndex) => {
        const poi = itinerary.pois.find(p => p.id === slot.poiId)
        if (!poi || !poi.location) return
        
        const position = { 
          lat: poi.location.lat, 
          lng: poi.location.lng 
        }
        
        const marker = new window.google.maps.Marker({
          position,
          map: googleMapRef.current,
          title: poi.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: selectedPoiId === poi.id ? '#ff6b6b' : '#4ecdc4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          }
        })
        
        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${poi.name}</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">Activity ${slotIndex + 1} • ${slot.startTime}</p>
            </div>
          `
        })
        
        marker.addListener('click', () => {
          infoWindow.open(googleMapRef.current, marker)
        })
        
        markersRef.current.push(marker)
        bounds.extend(position)
        path.push(position)
      })
    }
    
    // Draw route polyline
    if (path.length > 1) {
      polylineRef.current = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#4ecdc4',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: googleMapRef.current
      })
    }
    
    // Fit bounds
    if (markersRef.current.length > 0) {
      googleMapRef.current.fitBounds(bounds, { padding: 50 })
    } else if (itinerary && itinerary.destination) {
      // If no markers, try to center on destination using geocoding
      // For now, just use default center
      googleMapRef.current.setCenter({ lat: mapCenter[0], lng: mapCenter[1] })
      googleMapRef.current.setZoom(12)
    }
  }, [itinerary, selectedPoiId, mapCenter])

  // Update markers when itinerary changes
  useEffect(() => {
    if (googleMapRef.current) {
      updateMarkers()
    }
  }, [itinerary, updateMarkers])

  // Handle fly to POI
  useEffect(() => {
    if (googleMapRef.current && flyToPoi) {
      const poi = itinerary?.pois.find(p => p.id === flyToPoi)
      
      if (poi && poi.location) {
        googleMapRef.current.panTo({
          lat: poi.location.lat,
          lng: poi.location.lng
        })
        googleMapRef.current.setZoom(16)
      }
    }
  }, [flyToPoi, itinerary])

  // Handle fly to bounds
  useEffect(() => {
    if (googleMapRef.current && flyToBounds) {
      const bounds = new window.google.maps.LatLngBounds()
      flyToBounds.forEach(coord => {
        bounds.extend({ lat: coord[0], lng: coord[1] })
      })
      googleMapRef.current.fitBounds(bounds, { padding: 50 })
    }
  }, [flyToBounds])

  if (error) {
    return (
      <div className={cn(
        "relative bg-gray-100 rounded-lg flex items-center justify-center",
        className
      )} style={{ aspectRatio }}>
        <div className="text-center p-4">
          <p className="text-red-600 mb-2">{error}</p>
          <p className="text-sm text-gray-600">Using Leaflet map as fallback</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative rounded-lg overflow-hidden", className)} style={{ aspectRatio }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}

export { GoogleMapCanvas }