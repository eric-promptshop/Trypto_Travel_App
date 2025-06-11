"use client"

import * as React from "react"
import { MapPin, Star, DollarSign, Navigation, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AccommodationLocation {
  id: string
  name: string
  coordinates: [number, number] // [lat, lng]
  starRating: 1 | 2 | 3 | 4 | 5
  pricePerNight: number
  currency: string
  imageUrl: string
  type: string
  ratings: {
    overall: number
    reviewCount: number
  }
  distanceFromCenter?: number
}

interface AccommodationMapProps {
  accommodations: AccommodationLocation[]
  selectedAccommodation?: AccommodationLocation | undefined
  onAccommodationSelect: (accommodation: AccommodationLocation) => void
  center?: [number, number]
  zoom?: number
  height?: string
  className?: string
}

// Mock map component since we don't have an actual map library integrated
// In a real implementation, this would use Google Maps, Mapbox, or similar
const MockMapComponent: React.FC<{
  accommodations: AccommodationLocation[]
  selectedAccommodation?: AccommodationLocation | undefined
  onAccommodationSelect: (accommodation: AccommodationLocation) => void
  center: [number, number]
  zoom: number
  height: string
}> = ({ accommodations, selectedAccommodation, onAccommodationSelect, center, zoom, height }) => {
  const [mapCenter, setMapCenter] = React.useState(center)
  const [mapZoom, setMapZoom] = React.useState(zoom)
  const [hoveredAccommodation, setHoveredAccommodation] = React.useState<string | null>(null)

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price)
  }

  // Simple calculation to convert lat/lng to pixel positions for our mock map
  const getPixelPosition = (coordinates: [number, number]): [number, number] => {
    const [lat, lng] = coordinates
    const [centerLat, centerLng] = mapCenter
    
    // Simple projection (not accurate for real maps, just for demo)
    const x = ((lng - centerLng) * mapZoom * 100) + 250
    const y = ((centerLat - lat) * mapZoom * 100) + 200
    
    return [Math.max(10, Math.min(490, x)), Math.max(10, Math.min(390, y))]
  }

  const handleZoomIn = () => {
    setMapZoom(prev => Math.min(prev * 1.5, 10))
  }

  const handleZoomOut = () => {
    setMapZoom(prev => Math.max(prev / 1.5, 0.5))
  }

  const handleResetView = () => {
    setMapCenter(center)
    setMapZoom(zoom)
  }

  const centerOnAccommodation = (accommodation: AccommodationLocation) => {
    setMapCenter(accommodation.coordinates)
    setMapZoom(3)
  }

  return (
    <div className="relative">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          className="bg-white shadow-md"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          className="bg-white shadow-md"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetView}
          className="bg-white shadow-md"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Map Container */}
      <div 
        className="relative bg-gradient-to-br from-blue-100 to-green-100 rounded-lg overflow-hidden border"
        style={{ height }}
      >
        {/* Mock map background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-8 grid-rows-6 h-full">
            {Array.from({ length: 48 }, (_, i) => (
              <div
                key={i}
                className="border border-gray-300 border-opacity-30"
              />
            ))}
          </div>
        </div>

        {/* Street/Area labels for context */}
        <div className="absolute top-16 left-8 text-sm text-gray-600 font-medium opacity-60">
          City Center
        </div>
        <div className="absolute bottom-20 right-12 text-sm text-gray-600 font-medium opacity-60">
          Tourist District
        </div>
        <div className="absolute top-32 right-16 text-sm text-gray-600 font-medium opacity-60">
          Business Area
        </div>

        {/* Accommodation Markers */}
        {accommodations.map((accommodation) => {
          const [x, y] = getPixelPosition(accommodation.coordinates)
          const isSelected = selectedAccommodation?.id === accommodation.id
          const isHovered = hoveredAccommodation === accommodation.id

          return (
            <div
              key={accommodation.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
              style={{ left: x, top: y }}
              onMouseEnter={() => setHoveredAccommodation(accommodation.id)}
              onMouseLeave={() => setHoveredAccommodation(null)}
              onClick={() => onAccommodationSelect(accommodation)}
            >
              {/* Marker */}
              <div
                className={cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200",
                  isSelected 
                    ? "bg-blue-600 border-white scale-125 shadow-lg" 
                    : isHovered
                      ? "bg-blue-500 border-white scale-110 shadow-md"
                      : "bg-white border-gray-300 hover:border-blue-300"
                )}
              >
                <MapPin 
                  className={cn(
                    "h-4 w-4",
                    isSelected || isHovered ? "text-white" : "text-gray-600"
                  )} 
                />
              </div>

              {/* Hover/Selected Info Card */}
              {(isHovered || isSelected) && (
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-30">
                  <Card className="w-64 shadow-lg">
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <img
                          src={accommodation.imageUrl}
                          alt={accommodation.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm leading-tight truncate">
                            {accommodation.name}
                          </h4>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: accommodation.starRating }, (_, i) => (
                              <Star
                                key={i}
                                className="h-3 w-3 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-600 capitalize">
                              {accommodation.type}
                            </span>
                            <span className="font-semibold text-sm">
                              {formatPrice(accommodation.pricePerNight, accommodation.currency)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-600">
                              {accommodation.ratings.overall.toFixed(1)} ({accommodation.ratings.reviewCount})
                            </span>
                          </div>
                          {accommodation.distanceFromCenter && (
                            <div className="text-xs text-gray-500 mt-1">
                              {accommodation.distanceFromCenter}km from center
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )
        })}

        {/* Center Marker */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ left: 250, top: 200 }}
        >
          <div className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow">
            <Navigation className="h-3 w-3 text-white" />
          </div>
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
            <Badge variant="secondary" className="text-xs">
              City Center
            </Badge>
          </div>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="text-sm font-medium mb-2">Map Legend</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full border border-white"></div>
                <span>City Center</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full border border-gray-300"></div>
                <span>Accommodation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full border border-white"></div>
                <span>Selected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const AccommodationMap: React.FC<AccommodationMapProps> = ({
  accommodations,
  selectedAccommodation,
  onAccommodationSelect,
  center = [48.8566, 2.3522], // Default to Paris
  zoom = 2,
  height = "400px",
  className
}) => {
  const [showListView, setShowListView] = React.useState(false)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Accommodation Locations</h3>
          <p className="text-sm text-gray-600">
            {accommodations.length} accommodation{accommodations.length !== 1 ? 's' : ''} on map
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowListView(!showListView)}
        >
          {showListView ? "Hide List" : "Show List"}
        </Button>
      </div>

      {/* Map */}
      <MockMapComponent
        accommodations={accommodations}
        selectedAccommodation={selectedAccommodation}
        onAccommodationSelect={onAccommodationSelect}
        center={center}
        zoom={zoom}
        height={height}
      />

      {/* List View */}
      {showListView && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accommodations List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {accommodations.map((accommodation, index) => (
                <div
                  key={accommodation.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-colors",
                    selectedAccommodation?.id === accommodation.id
                      ? "bg-blue-50 border-blue-200"
                      : "hover:bg-gray-50 border-transparent"
                  )}
                  onClick={() => onAccommodationSelect(accommodation)}
                >
                  <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs font-medium">
                    {index + 1}
                  </div>
                  <img
                    src={accommodation.imageUrl}
                    alt={accommodation.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {accommodation.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center">
                        {Array.from({ length: accommodation.starRating }, (_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600">
                        {accommodation.ratings.overall.toFixed(1)}
                      </span>
                      {accommodation.distanceFromCenter && (
                        <span className="text-xs text-gray-500">
                          • {accommodation.distanceFromCenter}km
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: accommodation.currency,
                        minimumFractionDigits: 0
                      }).format(accommodation.pricePerNight)}
                    </div>
                    <div className="text-xs text-gray-600">per night</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 