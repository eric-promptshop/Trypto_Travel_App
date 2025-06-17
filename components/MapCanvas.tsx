"use client"

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePlanStore } from '@/store/planStore'

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

// Custom marker icons
const createCustomIcon = (color: string, size: number = 25) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

interface MapCanvasProps {
  className?: string
  aspectRatio?: string
}

// Map controller component
function MapController() {
  const map = useMap()
  const { mapCenter, mapZoom, flyToPoi, flyToBounds, itinerary } = usePlanStore()
  const prevCenterRef = useRef(mapCenter)
  const prevZoomRef = useRef(mapZoom)
  const hasInitializedRef = useRef(false)
  
  // Handle initial map centering based on POIs
  useEffect(() => {
    if (!hasInitializedRef.current && itinerary && itinerary.pois.length > 0) {
      const validPois = itinerary.pois.filter(p => p.location.lat !== 0 && p.location.lng !== 0)
      if (validPois.length > 0) {
        const bounds = L.latLngBounds(validPois.map(p => [p.location.lat, p.location.lng]))
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
        hasInitializedRef.current = true
      }
    }
  }, [itinerary, map])
  
  // Handle map center/zoom changes from store
  useEffect(() => {
    // Skip if center is still at [0,0] (not initialized)
    if (mapCenter[0] === 0 && mapCenter[1] === 0) return
    
    if (
      prevCenterRef.current[0] !== mapCenter[0] || 
      prevCenterRef.current[1] !== mapCenter[1] ||
      prevZoomRef.current !== mapZoom
    ) {
      map.flyTo(mapCenter, mapZoom, {
        duration: 0.8,
        easeLinearity: 0.5
      })
      prevCenterRef.current = mapCenter
      prevZoomRef.current = mapZoom
    }
  }, [mapCenter, mapZoom, map])
  
  // Subscribe to flyTo events
  useEffect(() => {
    const unsubscribe = usePlanStore.subscribe(
      (state) => state.selectedPoiId,
      (selectedPoiId) => {
        if (selectedPoiId) {
          const poi = usePlanStore.getState().itinerary?.pois.find(p => p.id === selectedPoiId)
          if (poi) {
            map.flyTo([poi.location.lat, poi.location.lng], 16, {
              duration: 0.8
            })
          }
        }
      }
    )
    
    return unsubscribe
  }, [map])
  
  return null
}

// Map event handler component
function MapEventHandler() {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter()
      const zoom = map.getZoom()
      usePlanStore.getState().setMapView([center.lat, center.lng], zoom)
    }
  })
  
  return null
}

// Animated marker component
interface AnimatedMarkerProps {
  position: [number, number]
  isHighlighted: boolean
  isSelected: boolean
  poiId: string
  poiName: string
}

function AnimatedMarker({ position, isHighlighted, isSelected, poiId, poiName }: AnimatedMarkerProps) {
  const markerRef = useRef<L.Marker>(null)
  const { highlightPoi, selectPoi, itinerary } = usePlanStore()
  const [showPopup, setShowPopup] = useState(false)
  
  // Get POI details
  const poi = useMemo(() => {
    return itinerary?.pois.find(p => p.id === poiId)
  }, [itinerary, poiId])
  
  // Get activity index for numbering
  const activityIndex = useMemo(() => {
    if (!itinerary?.selectedDayId) return -1
    const day = itinerary.days.find(d => d.id === itinerary.selectedDayId)
    if (!day) return -1
    return day.slots.findIndex(slot => slot.poiId === poiId)
  }, [itinerary, poiId])
  
  // Create custom icon based on state
  const icon = useMemo(() => {
    const iconSize = isHighlighted || isSelected ? 35 : 25
    const iconAnchor = isHighlighted || isSelected ? [17.5, 35] : [12.5, 25]
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="${cn(
          'marker-pin',
          isHighlighted && 'highlighted',
          isSelected && 'selected'
        )}">
          <div class="marker-pin-inner">${activityIndex >= 0 ? activityIndex + 1 : ''}</div>
        </div>
      `,
      iconSize: [iconSize, iconSize],
      iconAnchor: iconAnchor as [number, number],
      popupAnchor: [0, -iconSize]
    })
  }, [isHighlighted, isSelected, activityIndex])
  
  // Add drop animation when marker appears
  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current
      marker.setOpacity(0)
      
      setTimeout(() => {
        marker.setOpacity(1)
        if (marker.getElement()) {
          marker.getElement()!.classList.add('marker-drop-animation')
        }
      }, 100)
    }
  }, [])
  
  // Show popup when selected
  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup()
    }
  }, [isSelected])
  
  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
      eventHandlers={{
        mouseover: () => highlightPoi(poiId),
        mouseout: () => highlightPoi(null),
        click: () => {
          selectPoi(poiId)
          setShowPopup(true)
        }
      }}
    >
      {poi && (
        <Popup 
          className="map-popup" 
          closeButton={false}
          autoPan={true}
        >
          <div className="p-3 min-w-[200px] max-w-[280px]">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900 pr-2">{poi.name}</h4>
              {activityIndex >= 0 && (
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {activityIndex + 1}
                </span>
              )}
            </div>
            {poi.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{poi.description}</p>
            )}
            {poi.location.address && (
              <div className="flex items-start gap-1 text-xs text-gray-500 mt-2">
                <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-2">{poi.location.address}</span>
              </div>
            )}
            {poi.rating && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                <span className="text-yellow-500">★</span>
                <span>{poi.rating.toFixed(1)}</span>
                {poi.reviews && <span className="text-gray-400">({poi.reviews})</span>}
              </div>
            )}
          </div>
        </Popup>
      )}
    </Marker>
  )
}

// Route polyline component with skeleton
interface RoutePolylineProps {
  positions: [number, number][]
  isCalculating: boolean
}

function RoutePolyline({ positions, isCalculating }: RoutePolylineProps) {
  if (isCalculating) {
    return (
      <Polyline
        positions={positions}
        color="#E5E7EB"
        weight={4}
        opacity={0.6}
        dashArray="10, 10"
        className="route-skeleton"
      />
    )
  }
  
  return (
    <Polyline
      positions={positions}
      color="#3B82F6"
      weight={4}
      opacity={0.8}
      smoothFactor={1}
      className="route-line"
    />
  )
}

// Main map component
function MapCanvasContent({ className, aspectRatio = '16/9' }: MapCanvasProps) {
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  const routeCalculationTimeoutRef = useRef<NodeJS.Timeout>()
  
  const {
    itinerary,
    selectedDayId,
    highlightedPoiId,
    selectedPoiId,
    getDayRoute,
    mapCenter,
    mapZoom,
    searchPois
  } = usePlanStore()
  
  // Get current day's activities and route
  const currentDayRoute = useMemo(() => {
    if (!selectedDayId) return []
    return getDayRoute(selectedDayId)
  }, [selectedDayId, getDayRoute])
  
  // All POIs to display on map
  const allPois = useMemo(() => {
    if (!itinerary || !selectedDayId) return []
    
    const day = itinerary.days.find(d => d.id === selectedDayId)
    if (!day) return []
    
    return day.slots
      .map(slot => itinerary.pois.find(p => p.id === slot.poiId))
      .filter(Boolean) as typeof itinerary.pois
  }, [itinerary, selectedDayId])
  
  // Throttled route calculation
  const calculateRoute = useCallback(() => {
    if (routeCalculationTimeoutRef.current) {
      clearTimeout(routeCalculationTimeoutRef.current)
    }
    
    setIsCalculatingRoute(true)
    
    routeCalculationTimeoutRef.current = setTimeout(() => {
      // Simulate route calculation
      setIsCalculatingRoute(false)
    }, 500)
  }, [])
  
  // Recalculate route when POIs change
  useEffect(() => {
    if (currentDayRoute.length > 1) {
      calculateRoute()
    }
  }, [currentDayRoute, calculateRoute])
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (routeCalculationTimeoutRef.current) {
        clearTimeout(routeCalculationTimeoutRef.current)
      }
    }
  }, [])
  
  // Use a sensible default center if map center is not initialized
  const initialCenter = mapCenter[0] === 0 && mapCenter[1] === 0 ? [40.7128, -74.0060] : mapCenter
  
  return (
    <div 
      className={cn("relative w-full bg-gray-100", className)}
      style={{ aspectRatio }}
    >
      <MapContainer
        center={initialCenter}
        zoom={mapZoom}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Map controllers */}
        <MapController />
        <MapEventHandler />
        
        {/* Route polyline */}
        {currentDayRoute.length > 1 && (
          <RoutePolyline
            positions={currentDayRoute}
            isCalculating={isCalculatingRoute}
          />
        )}
        
        {/* Search result POI markers (lighter style) */}
        {searchPois.map((poi) => {
          // Don't show search POIs that are already in the itinerary
          const isInItinerary = allPois.some(p => p.id === poi.id)
          if (isInItinerary) return null
          
          return (
            <Marker
              key={`search-${poi.id}`}
              position={[poi.location.lat, poi.location.lng]}
              icon={L.divIcon({
                className: 'custom-marker',
                html: `
                  <div style="
                    background-color: ${highlightedPoiId === poi.id ? '#FB923C' : '#E5E7EB'};
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    transition: all 0.2s;
                  "></div>
                `,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
              eventHandlers={{
                mouseover: () => usePlanStore.getState().highlightPoi(poi.id),
                mouseout: () => usePlanStore.getState().highlightPoi(null),
                click: () => usePlanStore.getState().selectPoi(poi.id)
              }}
            />
          )
        })}
        
        {/* Itinerary POI markers */}
        {allPois.map((poi) => (
          <AnimatedMarker
            key={poi.id}
            position={[poi.location.lat, poi.location.lng]}
            isHighlighted={highlightedPoiId === poi.id}
            isSelected={selectedPoiId === poi.id}
            poiId={poi.id}
            poiName={poi.name}
          />
        ))}
      </MapContainer>
      
      {/* Loading overlay */}
      {isCalculatingRoute && (
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] flex items-center justify-center z-10">
          <div className="bg-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm">Optimizing route...</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Export with dynamic import for SSR
export const MapCanvas = dynamic(
  () => Promise.resolve(MapCanvasContent),
  {
    ssr: false,
    loading: () => (
      <div className="w-full bg-gray-100 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }
)

// Add custom styles
if (typeof window !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    .custom-marker {
      background: transparent;
      border: none;
    }
    
    .marker-pin {
      width: 25px;
      height: 25px;
      background: #3B82F6;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      position: relative;
    }
    
    .marker-pin-inner {
      position: absolute;
      color: white;
      font-weight: bold;
      font-size: 14px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(45deg);
      text-align: center;
      line-height: 1;
    }
    
    .marker-pin.highlighted {
      background: #FB923C;
      transform: rotate(-45deg) scale(1.2);
      box-shadow: 0 4px 8px rgba(251,146,60,0.4);
    }
    
    .marker-pin.selected {
      background: #3B82F6;
      transform: rotate(-45deg) scale(1.3);
      box-shadow: 0 4px 12px rgba(59,130,246,0.5);
    }
    
    .marker-drop-animation {
      animation: markerDrop 0.5s ease-out;
    }
    
    @keyframes markerDrop {
      0% {
        transform: translateY(-30px);
        opacity: 0;
      }
      60% {
        transform: translateY(5px);
      }
      100% {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    .route-line {
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }
    
    .route-skeleton {
      animation: routePulse 1.5s ease-in-out infinite;
    }
    
    @keyframes routePulse {
      0%, 100% {
        opacity: 0.3;
      }
      50% {
        opacity: 0.6;
      }
    }
    
    /* Airbnb-style popup styles */
    .map-popup .leaflet-popup-content-wrapper {
      padding: 0;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .map-popup .leaflet-popup-content {
      margin: 0;
      min-width: 200px;
      max-width: 280px;
    }
    
    .map-popup .leaflet-popup-tip {
      background: white;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
  `
  document.head.appendChild(style)
}