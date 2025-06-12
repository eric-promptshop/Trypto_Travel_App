import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useBatteryStatus } from "@/hooks/use-battery-status"
import { MapPin, LocateFixed, Clock, Moon, Sun, Globe, Battery, X } from "lucide-react"
import { useState, useEffect } from "react"

export function GeolocationBanner() {
  const { level: batteryLevel } = useBatteryStatus()
  const batteryOptimizedOptions = (batteryLevel ?? 1) < 0.5 ? { 
    enableHighAccuracy: false, 
    maximumAge: 300000, // 5 minutes cache for low battery
    autoUpdate: false 
  } : {}
  
  const { 
    coords, 
    error, 
    permission, 
    isLoading, 
    locationContext, 
    requestLocation,
    getBatteryOptimizedOptions 
  } = useGeolocation(batteryOptimizedOptions)
  
  const [showLocationInsights, setShowLocationInsights] = useState(false)
  const [recommendationText, setRecommendationText] = useState<string>("")
  const [isDismissed, setIsDismissed] = useState(false)

  // Generate location-based recommendations
  useEffect(() => {
    if (locationContext) {
      const { isNightTime, countryCode, cityName, timezone } = locationContext
      let recommendation = ""

      // Time-based recommendations
      if (isNightTime) {
        recommendation = "It's evening in your area. Consider indoor activities or dining experiences."
      } else {
        const hour = locationContext.localTime.getHours()
        if (hour < 10) {
          recommendation = "Good morning! Perfect time for outdoor activities and sightseeing."
        } else if (hour < 14) {
          recommendation = "Great time for cultural visits and walking tours."
        } else if (hour < 18) {
          recommendation = "Ideal for outdoor adventures and recreational activities."
        } else {
          recommendation = "Evening approaches - consider sunset viewing spots or local dining."
        }
      }

      // Location-specific enhancements
      if (countryCode) {
        switch (countryCode) {
          case 'US':
            recommendation += " Check local state regulations and popular attractions."
            break
          case 'CA':
            recommendation += " Explore Canada's natural beauty and cultural sites."
            break
          case 'GB':
          case 'UK':
            recommendation += " Discover Britain's rich history and countryside."
            break
          case 'JP':
            recommendation += " Experience Japan's unique culture and cuisine."
            break
          case 'DE':
            recommendation += " Explore Germany's castles, museums, and beer gardens."
            break
          case 'FR':
            recommendation += " Enjoy France's art, cuisine, and historic landmarks."
            break
          default:
            recommendation += " Discover local culture and hidden gems in your area."
        }
      }

      setRecommendationText(recommendation)
    }
  }, [locationContext])

  // Load dismissed state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('geolocationBannerDismissed')
    if (dismissed === 'true') {
      setIsDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('geolocationBannerDismissed', 'true')
  }

  if (isDismissed) {
    return null
  }

  if (permission === "granted" && coords && locationContext) {
    return (
      <div className="fixed top-24 left-0 w-full z-30 flex justify-center pointer-events-none">
        <div className="max-w-md w-full mx-auto px-2 pt-2">
          <Alert className="bg-blue-50 border-blue-300 text-blue-900 shadow-lg pointer-events-auto backdrop-blur-sm relative">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors"
              aria-label="Dismiss location banner"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start space-x-3">
              <LocateFixed className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1 pr-6">
                <AlertTitle className="flex items-center gap-2">
                  Location Context
                  {locationContext.isNightTime ? (
                    <Moon className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Sun className="w-4 h-4 text-yellow-500" />
                  )}
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {locationContext.cityName && (
                      <span className="font-semibold">{locationContext.cityName}</span>
                    )}
                    {locationContext.countryCode && (
                      <span className="text-xs bg-blue-100 px-2 py-0.5 rounded">
                        {locationContext.countryCode}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-blue-700">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{locationContext.localTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <span>{locationContext.timezone.split('/').pop()}</span>
                    </div>
                    {(batteryLevel ?? 1) < 0.5 && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <Battery className="w-3 h-3" />
                        <span>Battery saving</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setShowLocationInsights(!showLocationInsights)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                  >
                    {showLocationInsights ? "Hide" : "Show"} recommendations
                  </button>

                  {showLocationInsights && recommendationText && (
                    <div className="mt-2 p-2 bg-blue-100 rounded-md text-xs text-blue-800 border border-blue-200">
                      {recommendationText}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        </div>
      </div>
    )
  }

  if (permission === "denied") {
    return (
      <div className="fixed top-24 left-0 w-full z-30 flex justify-center pointer-events-none">
        <div className="max-w-md w-full mx-auto px-2 pt-2">
          <Alert className="bg-red-50 border-red-300 text-red-900 shadow-lg pointer-events-auto backdrop-blur-sm relative">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
              aria-label="Dismiss location banner"
            >
              <X className="w-4 h-4" />
            </button>
            <MapPin className="w-5 h-5 text-red-600" />
            <div>
              <AlertTitle>Location Disabled</AlertTitle>
              <AlertDescription>
                Location access is denied. Enable location in your browser settings for personalized suggestions based on your timezone and local context.
              </AlertDescription>
            </div>
          </Alert>
        </div>
      </div>
    )
  }

  if (permission === "prompt") {
    return (
      <div className="fixed top-24 left-0 w-full z-30 flex justify-center pointer-events-none">
        <div className="max-w-md w-full mx-auto px-2 pt-2">
          <Alert className="bg-yellow-50 border-yellow-300 text-yellow-900 shadow-lg pointer-events-auto backdrop-blur-sm relative">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-yellow-600 hover:text-yellow-800 p-1 rounded hover:bg-yellow-100 transition-colors"
              aria-label="Dismiss location banner"
            >
              <X className="w-4 h-4" />
            </button>
            <MapPin className="w-5 h-5 text-yellow-600" />
            <div>
              <AlertTitle>Enable Smart Location Features</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>Get personalized recommendations based on your timezone, local time, and regional context.</p>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1 rounded bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-medium text-xs border border-yellow-400 shadow focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    onClick={requestLocation}
                    disabled={isLoading}
                    style={{ pointerEvents: "auto" }}
                  >
                    {isLoading ? "Requesting..." : "Enable Location"}
                  </button>
                  {(batteryLevel ?? 1) < 0.5 && (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <Battery className="w-3 h-3" />
                      Battery optimized
                    </span>
                  )}
                </div>
                {error && <p className="text-xs text-red-700">{error}</p>}
              </AlertDescription>
            </div>
          </Alert>
        </div>
      </div>
    )
  }

  return null
} 