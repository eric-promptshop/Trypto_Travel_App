"use client"

import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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
  const createNumberedIcon = (number: number) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          background-color: #3B82F6;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          ${number}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
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
      
      {activities.map((activity, index) => (
        <Marker
          key={activity.id}
          position={[activity.location.lat, activity.location.lng]}
          icon={createNumberedIcon(index + 1)}
        >
          <Popup>
            <div className="p-2">
              <h4 className="font-semibold">{activity.name}</h4>
              {activity.time && <p className="text-sm text-gray-600">{activity.time}</p>}
              {activity.description && <p className="text-sm mt-1">{activity.description}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}