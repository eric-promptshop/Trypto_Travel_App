"use client"

import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useItineraryUI } from './ItineraryUIContext'

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

interface MapCenterControllerProps {
  center: [number, number]
}

function MapCenterController({ center }: MapCenterControllerProps) {
  const map = useMap()
  
  useEffect(() => {
    map.flyTo(center, 13, {
      animate: true,
      duration: 1
    })
  }, [center, map])
  
  return null
}

interface Activity {
  id: string
  name: string
  time?: string
  location: {
    lat: number
    lng: number
    address?: string
  }
  description?: string
}

interface ItineraryMapProps {
  activities: Activity[]
  center: [number, number]
}

export function ItineraryMap({ activities, center }: ItineraryMapProps) {
  const { highlightedLocationId, setHighlightedLocationId, selectedLocationId, setSelectedLocationId } = useItineraryUI()
  
  const createNumberedIcon = (number: number, isHighlighted: boolean = false, isSelected: boolean = false) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          background-color: ${isSelected ? '#F97316' : isHighlighted ? '#FB923C' : '#3B82F6'};
          color: white;
          width: ${isHighlighted || isSelected ? '36px' : '32px'};
          height: ${isHighlighted || isSelected ? '36px' : '32px'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: ${isHighlighted || isSelected ? '16px' : '14px'};
          border: ${isHighlighted || isSelected ? '3px' : '2px'} solid white;
          box-shadow: 0 ${isHighlighted || isSelected ? '4px 8px' : '2px 4px'} rgba(0,0,0,0.3);
          transition: all 0.2s ease;
        ">
          ${number}
        </div>
      `,
      iconSize: isHighlighted || isSelected ? [36, 36] : [32, 32],
      iconAnchor: isHighlighted || isSelected ? [18, 18] : [16, 16],
      popupAnchor: [0, isHighlighted || isSelected ? -18 : -16]
    })
  }
  
  return (
    <MapContainer
      center={center}
      zoom={13}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapCenterController center={center} />
      
      {activities.map((activity, index) => {
        const isHighlighted = highlightedLocationId === activity.id
        const isSelected = selectedLocationId === activity.id
        
        return (
          <Marker
            key={activity.id}
            position={[activity.location.lat, activity.location.lng]}
            icon={createNumberedIcon(index + 1, isHighlighted, isSelected)}
            eventHandlers={{
              mouseover: () => setHighlightedLocationId(activity.id),
              mouseout: () => setHighlightedLocationId(null),
              click: () => setSelectedLocationId(activity.id)
            }}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-semibold">{activity.name}</h4>
                {activity.time && <p className="text-sm text-gray-600">{activity.time}</p>}
                {activity.description && <p className="text-sm mt-1">{activity.description}</p>}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}