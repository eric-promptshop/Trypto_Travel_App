import { useEffect, useState, useCallback } from "react"

export interface GeolocationCoords {
  latitude: number
  longitude: number
}

export type GeolocationPermission = "granted" | "denied" | "prompt" | null

export interface LocationContext {
  timezone: string
  countryCode: string | null
  cityName: string | null
  isNightTime: boolean
  localTime: Date
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  autoUpdate?: boolean
  updateInterval?: number
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [coords, setCoords] = useState<GeolocationCoords | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permission, setPermission] = useState<GeolocationPermission>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [locationContext, setLocationContext] = useState<LocationContext | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)

  const defaultOptions: Required<GeolocationOptions> = {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 60000, // 1 minute cache
    autoUpdate: false,
    updateInterval: 300000, // 5 minutes
  }

  const mergedOptions = { ...defaultOptions, ...options }

  // Check permission status on mount
  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null
    if (typeof window !== "undefined" && navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status) => {
          setPermission(status.state as GeolocationPermission)
          permissionStatus = status
          status.onchange = () => setPermission(status.state as GeolocationPermission)
        })
        .catch(() => setPermission(null))
    }
    return () => {
      if (permissionStatus) permissionStatus.onchange = null
    }
  }, [])

  // Enhanced location context detection
  const getLocationContext = useCallback(async (latitude: number, longitude: number): Promise<LocationContext> => {
    try {
      // Get timezone from coordinates
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const localTime = new Date()

      // Basic night/day detection (can be enhanced with sunrise/sunset APIs)
      const hour = localTime.getHours()
      const isNightTime = hour < 6 || hour > 20

      // Try to get location details from OpenStreetMap Nominatim API
      let countryCode: string | null = null
      let cityName: string | null = null

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`,
          {
            headers: {
              'User-Agent': 'TryptoAI/1.0'
            }
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          countryCode = data.address?.country_code?.toUpperCase() || null
          cityName = data.address?.city || data.address?.town || data.address?.village || null
        }
      } catch (reverseGeoError) {
        console.warn('Reverse geocoding failed:', reverseGeoError)
      }

      return {
        timezone,
        countryCode,
        cityName,
        isNightTime,
        localTime
      }
    } catch (error) {
      console.warn('Location context detection failed:', error)
      // Return minimal context
      return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        countryCode: null,
        cityName: null,
        isNightTime: false,
        localTime: new Date()
      }
    }
  }, [])

  const handleLocationUpdate = useCallback(async (position: GeolocationPosition) => {
    const newCoords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }
    
    setCoords(newCoords)
    setIsLoading(false)
    setError(null)

    // Get enhanced location context
    try {
      const context = await getLocationContext(newCoords.latitude, newCoords.longitude)
      setLocationContext(context)
    } catch (contextError) {
      console.warn('Failed to get location context:', contextError)
    }
  }, [getLocationContext])

  const handleLocationError = useCallback((err: GeolocationPositionError) => {
    let errorMessage = "Location access failed"
    
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = "Location access denied by user"
        break
      case err.POSITION_UNAVAILABLE:
        errorMessage = "Location information unavailable"
        break
      case err.TIMEOUT:
        errorMessage = "Location request timed out"
        break
    }
    
    setError(errorMessage)
    setIsLoading(false)
  }, [])

  const requestLocation = useCallback(() => {
    setIsLoading(true)
    setError(null)
    
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.")
      setIsLoading(false)
      return
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy: mergedOptions.enableHighAccuracy,
      timeout: mergedOptions.timeout,
      maximumAge: mergedOptions.maximumAge
    }

    navigator.geolocation.getCurrentPosition(
      handleLocationUpdate,
      handleLocationError,
      geoOptions
    )
  }, [mergedOptions, handleLocationUpdate, handleLocationError])

  // Auto-update functionality with watch position
  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchId !== null) return

    const geoOptions: PositionOptions = {
      enableHighAccuracy: mergedOptions.enableHighAccuracy,
      timeout: mergedOptions.timeout,
      maximumAge: mergedOptions.maximumAge
    }

    const id = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      handleLocationError,
      geoOptions
    )
    
    setWatchId(id)
  }, [mergedOptions, handleLocationUpdate, handleLocationError, watchId])

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
  }, [watchId])

  // Auto-update effect
  useEffect(() => {
    if (mergedOptions.autoUpdate && permission === "granted") {
      startWatching()
    } else {
      stopWatching()
    }

    return () => stopWatching()
  }, [mergedOptions.autoUpdate, permission, startWatching, stopWatching])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching()
    }
  }, [stopWatching])

  // Helper function to get battery-optimized options
  const getBatteryOptimizedOptions = useCallback((batteryLevel: number): GeolocationOptions => {
    if (batteryLevel < 0.2) { // Low battery
      return {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000, // 5 minutes cache
        autoUpdate: false
      }
    } else if (batteryLevel < 0.5) { // Medium battery
      return {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 120000, // 2 minutes cache
        updateInterval: 600000 // 10 minutes update
      }
    } else { // Good battery
      return {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000, // 1 minute cache
        updateInterval: 300000 // 5 minutes update
      }
    }
  }, [])

  return { 
    coords, 
    error, 
    permission, 
    isLoading, 
    locationContext,
    isWatching: watchId !== null,
    requestLocation,
    startWatching,
    stopWatching,
    getBatteryOptimizedOptions
  }
} 