"use client"

import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './ItineraryMap.css'
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
            <Popup className="map-popup" closeButton={false}>
              <div className="p-3 min-w-[200px] max-w-[280px]">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 pr-2">{activity.name}</h4>
                  <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {index + 1}
                  </span>
                </div>
                {activity.time && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{activity.time}</span>
                  </div>
                )}
                {activity.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{activity.description}</p>
                )}
                {activity.location.address && (
                  <div className="flex items-start gap-1 text-xs text-gray-500 mt-2">
                    <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="line-clamp-2">{activity.location.address}</span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}