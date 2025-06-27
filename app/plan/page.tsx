'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AIRequestForm } from '@/components/ai-request-form'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnalytics } from '@/lib/analytics/analytics-service'
import { SkeletonItinerary } from '@/components/ui/skeleton-itinerary'
import { toast } from 'sonner'
import { ItineraryUIProvider } from '@/components/itinerary/ItineraryUIContext'
import { Card, CardContent } from '@/components/ui/card'
import { TourDiscoveryPanel } from '@/components/TourDiscoveryPanel'
import { MagicEditAssistant } from '@/components/MagicEditAssistant'
import { SkeletonItineraryTimeline } from '@/components/SkeletonItineraryTimeline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useVoiceInput } from '@/hooks/use-voice-input'
import { useLeadGeneration } from '@/hooks/use-lead-generation'
import { LeadGenerationPopup } from '@/components/LeadGenerationPopup'
import { cn } from '@/lib/utils'
import { useItineraryState, migrateLocalStorageData } from '@/lib/state/itinerary-state'
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign,
  Sparkles,
  Plus,
  Edit2,
  Star,
  Clock,
  Tag,
  Heart,
  Mic,
  MicOff,
  Loader2,
  Save
} from 'lucide-react'

interface FormData {
  destinations?: string[]
  travelDates?: {
    startDate?: string
    endDate?: string
    flexible?: boolean
  }
  travelers?: {
    adults?: number
    children?: number
  }
  budget?: {
    amount?: number
    currency?: string
    perPerson?: boolean
  }
  accommodation?: string
  interests?: string[]
  specialRequirements?: string
  completeness?: number
  tripId?: string
}

interface SkeletonDay {
  day: number
  date: string
  title: string
  activities: {
    id: string
    time: string
    title: string
    description: string
    duration: string
          category: 'dining' | 'activity' | 'transport' | 'accommodation' | 'tour'
    isPlaceholder: boolean
  }[]
}

interface SkeletonItineraryData {
  destination: string
  duration: number
  startDate: string
  endDate: string
  travelers: number
  estimatedBudget: number
  interests?: string[]
  days: SkeletonDay[]
}

// Component to handle URL parameters
function PlanPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { track } = useAnalytics()
  
  const [currentView, setCurrentView] = useState<'form' | 'skeleton' | 'generating' | 'voice'>('form')
  const [formData, setFormData] = useState<FormData>({})
  const [skeletonItinerary, setSkeletonItinerary] = useState<SkeletonItineraryData | null>(null)
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState<string>('')
  const [voiceQuery, setVoiceQuery] = useState<string>('')
  const [hasTriedGeneration, setHasTriedGeneration] = useState(false)
  
  // Use unified state
  const { currentItinerary, setCurrentItinerary } = useItineraryState()
  
  // Migrate old localStorage data on mount
  useEffect(() => {
    migrateLocalStorageData()
  }, [])
  
  // Voice input hook
  const { isListening, isSupported, startListening, stopListening } = useVoiceInput({
    onResult: (transcript) => {
      setVoiceQuery(transcript)
      generateSkeletonFromQuery(transcript)
    },
    onError: (error) => {
      console.error('Voice input error:', error)
      toast.error('Voice input failed. Please try typing instead.')
      setCurrentView('form')
    }
  })
  
  // Lead generation hook
  const {
    showPopup,
    triggerReason,
    handlePopupClose,
    triggerForSaveItinerary
  } = useLeadGeneration({
    timeDelay: 90000, // 90 seconds (1.5 minutes)
    scrollThreshold: 70, // 70% scroll
    exitIntentEnabled: true
  })

  const generateSkeletonFromQuery = useCallback(async (query: string) => {
    setCurrentView('generating')
    setHasTriedGeneration(true)
    track('skeleton_generation_started', { query })

    try {
      // Parse the natural language query with AI
      const parseResponse = await fetch('/api/ai/parse-travel-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      if (!parseResponse.ok) {
        throw new Error('Failed to parse query')
      }

      const parsedData = await parseResponse.json()
      
      // Generate full itinerary using our new endpoint
      const generateResponse = await fetch('/api/itinerary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: parsedData.destination || 'Unknown Destination',
          dates: {
            startDate: parsedData.startDate || new Date().toISOString().split('T')[0],
            endDate: parsedData.endDate || new Date(Date.now() + (parsedData.duration || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          travelers: {
            adults: parsedData.travelers || 2,
            children: 0
          },
          budget: parsedData.budget ? {
            amount: parsedData.budget,
            currency: 'USD',
            perPerson: false
          } : undefined,
          interests: parsedData.interests || [],
          accommodation: parsedData.accommodation,
          specialRequirements: parsedData.specialRequirements,
          naturalLanguageInput: query
        })
      })
      
      if (!generateResponse.ok) {
        const errorText = await generateResponse.text()
        console.error('Generate itinerary failed:', generateResponse.status, errorText)
        throw new Error(`Failed to generate itinerary: ${generateResponse.status} - ${errorText}`)
      }
      
      const generateResult = await generateResponse.json()
      
      if (!generateResult.success || !generateResult.itinerary) {
        throw new Error(generateResult.error || 'Failed to generate itinerary')
      }
      
      const itinerary = generateResult.itinerary
      
      // Convert to skeleton format for display
      const skeleton = {
        destination: itinerary.destination,
        duration: itinerary.duration,
        startDate: itinerary.startDate,
        endDate: itinerary.endDate,
        travelers: typeof itinerary.travelers === 'number' ? itinerary.travelers : itinerary.travelers.adults + itinerary.travelers.children,
        estimatedBudget: itinerary.estimatedTotalCost || itinerary.totalBudget || 0,
        interests: itinerary.metadata?.interests || parsedData.interests || [],
        days: (itinerary.days || []).map((day: any) => ({
          day: day.day,
          date: day.date,
          title: day.title,
          activities: (day.activities || []).map((activity: any) => ({
            id: activity.id || `activity-${Date.now()}-${Math.random()}`,
            time: activity.time,
            title: activity.title,
            description: activity.description,
            duration: activity.duration,
            category: activity.category || 'activity',
            isPlaceholder: false,
            price: activity.price,
            imageUrl: activity.imageUrl,
            rating: activity.rating,
            location: activity.location
          }))
        }))
      }
      
      setSkeletonItinerary(skeleton)
      setCurrentView('skeleton')
      
      // Store the full itinerary in unified state
      setCurrentItinerary(itinerary)
      
      track('skeleton_generation_complete', { 
        destination: skeleton.destination,
        duration: skeleton.duration 
      })
    } catch (error) {
      console.error('Failed to generate skeleton:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      toast.error(error instanceof Error ? error.message : 'Failed to generate itinerary. Please try the form instead.')
      setCurrentView('form')
    }
  }, [track])

  // Check for URL parameters and pre-selected tour on mount
  useEffect(() => {
    // Prevent re-triggering if we've already tried
    if (hasTriedGeneration) return
    
    const query = searchParams.get('q')
    const destination = searchParams.get('destination')
    
    if (query) {
      setNaturalLanguageQuery(query)
      generateSkeletonFromQuery(query)
    } else if (destination) {
      // Check for pre-selected tour from tour library
      const storedTour = sessionStorage.getItem('selectedTour')
      if (storedTour) {
        try {
          const tour = JSON.parse(storedTour)
          sessionStorage.removeItem('selectedTour') // Clear after use
          
          // Generate a natural language query from the tour
          const tourQuery = `I want to visit ${destination} and include the "${tour.name}" tour. Plan a ${tour.duration || 7} day trip for 2 people.`
          setNaturalLanguageQuery(tourQuery)
          generateSkeletonFromQuery(tourQuery)
        } catch (error) {
          console.error('Error parsing stored tour:', error)
        }
      } else {
        // Just use the destination
        const destQuery = `Plan a trip to ${destination}`
        setNaturalLanguageQuery(destQuery)
        generateSkeletonFromQuery(destQuery)
      }
    }
  }, [searchParams, generateSkeletonFromQuery, hasTriedGeneration])

  const generateSkeletonItinerary = (parsedData: any): SkeletonItineraryData => {
    const destination = parsedData.destination || 'Your Destination'
    const duration = parsedData.duration || 7
    const startDate = parsedData.startDate || new Date().toISOString().split('T')[0]
    const travelers = parsedData.travelers || 2
    const travelStyle = parsedData.travelStyle || 'balanced'
    const interests = parsedData.interests || []
    
    const days: SkeletonDay[] = []
    
    // Generate more contextual activities based on interests and travel style
    const activityTemplates = getActivityTemplates(destination, interests, travelStyle)
    
    for (let i = 0; i < duration; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      
      const dayActivities = []
      
      // Morning activity
      if (i === 0) {
        dayActivities.push({
          id: `day-${i}-arrival`,
          time: '14:00',
          title: 'Airport Transfer & Hotel Check-in',
          description: 'Settle into your accommodation and get oriented with the neighborhood',
          duration: '2 hours',
          category: 'transport' as const,
          isPlaceholder: true
        })
      } else {
        dayActivities.push({
          id: `day-${i}-breakfast`,
          time: '08:00',
          title: 'Breakfast at Hotel',
          description: 'Start your day with a hearty meal',
          duration: '1 hour',
          category: 'dining' as const,
          isPlaceholder: true
        })
      }
      
      // Add themed activities based on interests
      if (interests.includes('culture') || interests.includes('history')) {
        dayActivities.push({
          id: `day-${i}-cultural`,
          time: '10:00',
          title: `${destination} Cultural Experience`,
          description: 'Explore museums, historical sites, or cultural landmarks',
          duration: '3 hours',
          category: 'activity' as const,
          isPlaceholder: true
        })
      } else if (interests.includes('adventure') || interests.includes('nature')) {
        dayActivities.push({
          id: `day-${i}-adventure`,
          time: '09:00',
          title: `${destination} Adventure Activity`,
          description: 'Outdoor adventures and nature exploration',
          duration: '4 hours',
          category: 'activity' as const,
          isPlaceholder: true
        })
      } else {
        dayActivities.push({
          id: `day-${i}-explore`,
          time: '10:00',
          title: `Explore ${destination}`,
          description: 'Discover popular attractions and hidden gems',
          duration: '3 hours',
          category: 'activity' as const,
          isPlaceholder: true
        })
      }
      
      // Lunch
      dayActivities.push({
        id: `day-${i}-lunch`,
        time: '13:00',
        title: interests.includes('food') ? 'Local Food Tour' : 'Lunch Break',
        description: interests.includes('food') ? 'Taste authentic local cuisine' : 'Refuel with a delicious meal',
        duration: '1.5 hours',
        category: 'dining' as const,
        isPlaceholder: true
      })
      
      // Afternoon activity
      if (i === duration - 1) {
        dayActivities.push({
          id: `day-${i}-departure`,
          time: '15:00',
          title: 'Hotel Check-out & Airport Transfer',
          description: 'Head to the airport for your departure',
          duration: '2 hours',
          category: 'transport' as const,
          isPlaceholder: true
        })
      } else {
        dayActivities.push({
          id: `day-${i}-afternoon`,
          time: '15:00',
          title: getAfternoonActivity(destination, interests, i),
          description: 'Continue your exploration',
          duration: '2.5 hours',
          category: 'activity' as const,
          isPlaceholder: true
        })
      }
      
      // Evening activity for some days
      if (i > 0 && i < duration - 1 && (i % 2 === 0 || interests.includes('nightlife'))) {
        dayActivities.push({
          id: `day-${i}-evening`,
          time: '19:00',
          title: interests.includes('nightlife') ? 'Evening Entertainment' : 'Dinner Experience',
          description: interests.includes('nightlife') ? 'Experience local nightlife' : 'Special dinner at recommended restaurant',
          duration: '2 hours',
          category: 'dining' as const,
          isPlaceholder: true
        })
      }
      
      days.push({
        day: i + 1,
        date: date.toISOString().split('T')[0],
        title: getDayTitle(i, duration, destination, interests),
        activities: dayActivities
      })
    }

    return {
      destination,
      duration,
      startDate,
      endDate: days[days.length - 1].date,
      travelers,
      estimatedBudget: calculateEstimatedBudget(duration, travelers, travelStyle),
      interests,
      days
    }
  }

  const getActivityTemplates = (destination: string, interests: string[], travelStyle: string) => {
    // This would be expanded with more sophisticated activity generation
    return {
      cultural: ['museums', 'historical sites', 'art galleries', 'cultural shows'],
      adventure: ['hiking', 'water sports', 'zip-lining', 'rock climbing'],
      relaxation: ['spa', 'beach time', 'yoga', 'meditation'],
      food: ['cooking classes', 'food tours', 'wine tasting', 'local markets']
    }
  }

  const getAfternoonActivity = (destination: string, interests: string[], dayIndex: number) => {
    const activities = [
      `${destination} Walking Tour`,
      `Local Market Visit`,
      `Scenic Viewpoint`,
      `Neighborhood Exploration`,
      `Shopping District Tour`
    ]
    return activities[dayIndex % activities.length]
  }

  const getDayTitle = (index: number, duration: number, destination: string, interests: string[]) => {
    if (index === 0) return `Arrival in ${destination}`
    if (index === duration - 1) return 'Departure Day'
    if (interests.includes('culture')) return `Cultural ${destination}`
    if (interests.includes('adventure')) return `Adventure Day ${index + 1}`
    if (interests.includes('relaxation')) return `Relaxation & Wellness`
    return `Exploring ${destination}`
  }

  const calculateEstimatedBudget = (duration: number, travelers: number, travelStyle: string) => {
    const dailyBudgetPerPerson = {
      luxury: 300,
      comfort: 150,
      budget: 75,
      balanced: 150
    }
    const daily = dailyBudgetPerPerson[travelStyle as keyof typeof dailyBudgetPerPerson] || 150
    return duration * travelers * daily
  }

  const handleFormComplete = async (data: FormData & { generatedItinerary?: any }) => {
    setFormData(data)
    
    try {
      // If we already have a generated itinerary, use it
      if (data.generatedItinerary) {
        const tripId = data.tripId || `temp-${Date.now()}`
        
        // Itinerary is already stored in unified state by AIRequestForm
        
        router.push(`/plan/${tripId}`)
        return
      }
      
      // Otherwise, generate a new itinerary using our endpoint
      setCurrentView('generating')
      
      const response = await fetch('/api/itinerary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: data.destinations?.[0] || '',
          dates: {
            startDate: data.travelDates?.startDate || new Date().toISOString().split('T')[0],
            endDate: data.travelDates?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          travelers: {
            adults: data.travelers?.adults || 2,
            children: data.travelers?.children || 0
          },
          budget: data.budget,
          interests: data.interests || [],
          accommodation: data.accommodation,
          transportation: [],
          specialRequirements: data.specialRequirements,
          naturalLanguageInput: naturalLanguageQuery || voiceQuery
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate itinerary')
      }
      
      const result = await response.json()
      
      if (result.success && result.itinerary) {
        // Store the generated itinerary in unified state
        const tripId = `trip-${Date.now()}`
        setCurrentItinerary(result.itinerary)
        
        toast.success('Itinerary generated successfully!')
        router.push(`/plan/${tripId}`)
      } else {
        throw new Error(result.error || 'Failed to generate itinerary')
      }
      
    } catch (error) {
      console.error('Error generating itinerary:', error)
      toast.error('Failed to generate itinerary. Please try again.')
      setCurrentView('form')
    }
    
    track('trip_planning_form_complete', data)
  }

  const handleBackToHome = () => {
    router.push('/')
  }

  const handleRefineItinerary = () => {
    // Convert skeleton to form data and show form
    const convertedFormData: FormData = {
      destinations: [skeletonItinerary?.destination || ''],
      travelers: { adults: skeletonItinerary?.travelers || 2 },
      travelDates: {
        startDate: skeletonItinerary?.startDate,
        endDate: skeletonItinerary?.endDate
      }
    }
    setFormData(convertedFormData)
    setCurrentView('form')
  }

  const handleContinueWithSkeleton = () => {
    // Check if we have a full itinerary stored, otherwise use skeleton
    const tripId = `trip-${Date.now()}`
    
    if (!currentItinerary && skeletonItinerary) {
      // If no full itinerary, convert skeleton to basic itinerary format
      const basicItinerary = {
        destination: skeletonItinerary.destination,
        duration: skeletonItinerary.duration,
        startDate: skeletonItinerary.startDate,
        endDate: skeletonItinerary.endDate,
        travelers: {
          adults: skeletonItinerary.travelers,
          children: 0
        },
        days: skeletonItinerary.days,
        highlights: [],
        tips: [],
        estimatedTotalCost: skeletonItinerary.estimatedBudget
      }
      setCurrentItinerary(basicItinerary)
    }
    
    router.push(`/plan/${tripId}`)
  }

  const handleAddTourToItinerary = (tour: any) => {
    if (!skeletonItinerary) return
    
    // Add tour to skeleton itinerary by converting it to an activity
    const newActivity = {
      id: `tour-${Date.now()}`,
      time: '10:00', // Default time
      title: tour.name,
      description: `${tour.description} (by ${tour.operatorName})`,
      duration: `${tour.duration} hours`,
      category: 'tour' as const,
      isPlaceholder: false,
      location: tour.location,
      coordinates: tour.coordinates,
      price: tour.price,
      rating: tour.rating,
      imageUrl: tour.images?.[0]
    }
    
    // Add to the first available day (or create a new day logic here)
    const updatedSkeleton = {
      ...skeletonItinerary,
      days: skeletonItinerary.days.map((day, index) => 
        index === 0 ? {
          ...day,
          activities: [...day.activities, newActivity]
        } : day
      )
    }
    
    setSkeletonItinerary(updatedSkeleton)
  }

  const handleUpdateItinerary = async (changes: any[]) => {
    if (!skeletonItinerary) return
    
    // Process itinerary changes from Magic Edit
    let updatedSkeleton = { ...skeletonItinerary }
    
    for (const change of changes) {
      switch (change.type) {
        case 'add':
          // Add new activity to specified day
          const dayIndex = change.data?.dayIndex || 0
          const newActivity = {
            id: `activity-${Date.now()}`,
            time: change.data?.time || '10:00',
            title: change.data?.title || 'New Activity',
            description: change.data?.description || '',
            duration: change.data?.duration || '1 hour',
            category: change.data?.category || 'activity' as const,
            isPlaceholder: false
          }
          
          updatedSkeleton.days[dayIndex] = {
            ...updatedSkeleton.days[dayIndex],
            activities: [...updatedSkeleton.days[dayIndex].activities, newActivity]
          }
          break
          
        case 'remove':
          // Remove activity by ID
          updatedSkeleton.days = updatedSkeleton.days.map(day => ({
            ...day,
            activities: day.activities.filter(activity => activity.id !== change.target)
          }))
          break
          
        case 'modify':
          // Modify activity properties
          updatedSkeleton.days = updatedSkeleton.days.map(day => ({
            ...day,
            activities: day.activities.map(activity => 
              activity.id === change.target 
                ? { ...activity, ...change.data }
                : activity
            )
          }))
          break
      }
    }
    
    setSkeletonItinerary(updatedSkeleton)
  }

  const handleReorderActivities = (dayIndex: number, newActivities: any[]) => {
    if (!skeletonItinerary) return
    
    const updatedSkeleton = {
      ...skeletonItinerary,
      days: skeletonItinerary.days.map((day, index) => 
        index === dayIndex ? { ...day, activities: newActivities } : day
      )
    }
    
    setSkeletonItinerary(updatedSkeleton)
  }

  const handleEditActivity = (activity: any) => {
    // Placeholder for activity editing functionality
  }

  const handleDeleteActivity = (activityId: string) => {
    if (!skeletonItinerary) return
    
    const updatedSkeleton = {
      ...skeletonItinerary,
      days: skeletonItinerary.days.map(day => ({
        ...day,
        activities: day.activities.filter(activity => activity.id !== activityId)
      }))
    }
    
    setSkeletonItinerary(updatedSkeleton)
  }

  const handleAddActivity = (dayIndex: number) => {
    if (!skeletonItinerary) return
    
    const newActivity = {
      id: `activity-${Date.now()}`,
      time: '10:00',
      title: 'New Activity',
      description: 'Click to edit this activity',
      duration: '1 hour',
      category: 'activity' as const,
      isPlaceholder: false
    }
    
    const updatedSkeleton = {
      ...skeletonItinerary,
      days: skeletonItinerary.days.map((day, index) => 
        index === dayIndex ? {
          ...day,
          activities: [...day.activities, newActivity]
        } : day
      )
    }
    
    setSkeletonItinerary(updatedSkeleton)
  }

  if (currentView === 'voice') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-auto text-center"
        >
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-[#1f5582] to-[#ff6b35] rounded-full flex items-center justify-center mx-auto mb-6">
              <motion.div
                animate={{ scale: isListening ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 1, repeat: isListening ? Infinity : 0 }}
              >
                <Mic className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            {isListening && (
              <motion.div
                className="absolute inset-0 w-24 h-24 bg-gradient-to-r from-[#1f5582] to-[#ff6b35] rounded-full mx-auto opacity-30"
                animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isListening ? 'Listening...' : 'Click to start'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isListening 
              ? 'Tell me about your dream trip'
              : 'Use your voice to describe your perfect vacation'}
          </p>
          
          {voiceQuery && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 italic">"{voiceQuery}"</p>
            </div>
          )}
          
          <div className="flex gap-3 justify-center">
            <Button
              size="lg"
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "gap-2",
                isListening 
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-gradient-to-r from-[#1f5582] to-[#2d6ba3] text-white"
              )}
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Start Recording
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setCurrentView('form')}
            >
              Type Instead
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (currentView === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-auto text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-[#1f5582] to-[#ff6b35] rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Creating Your Itinerary
          </h2>
          <p className="text-gray-600 mb-6">
            Our AI is analyzing your preferences and crafting the perfect trip...
          </p>
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div 
                className="bg-gradient-to-r from-[#1f5582] to-[#ff6b35] h-2 rounded-full"
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </div>
            <p className="text-sm text-gray-500">
              "{naturalLanguageQuery || voiceQuery}"
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (currentView === 'skeleton' && skeletonItinerary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={handleBackToHome}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{skeletonItinerary.destination}</h1>
                  <p className="text-sm text-gray-600">
                    {skeletonItinerary.duration} days • {skeletonItinerary.travelers} travelers
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="gap-1">
                  <DollarSign className="w-3 h-3" />
                  ~${skeletonItinerary.estimatedBudget.toLocaleString()}
                </Badge>
                <Button
                  variant="outline"
                  onClick={() => {
                    const triggered = triggerForSaveItinerary()
                    if (!triggered) {
                      // User is logged in or has already converted
                      handleContinueWithSkeleton()
                    }
                  }}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Itinerary
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRefineItinerary}
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Refine
                </Button>
                <Button
                  onClick={handleContinueWithSkeleton}
                  className="bg-gradient-to-r from-[#1f5582] to-[#2d6ba3] text-white gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Continue Planning
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Three-Panel Layout (PRD Requirement) */}
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
            
            {/* Source Panel (Left) */}
            <div className="lg:col-span-3 space-y-6">
              <TourDiscoveryPanel
                destination={skeletonItinerary.destination}
                interests={skeletonItinerary.interests}
                duration={skeletonItinerary.duration}
                travelers={skeletonItinerary.travelers}
                budget={skeletonItinerary.estimatedBudget}
                onAddTour={handleAddTourToItinerary}
                className="h-full"
              />
            </div>

            {/* Itinerary Canvas (Center) */}
            <div className="lg:col-span-6">
              <SkeletonItineraryTimeline
                days={skeletonItinerary.days}
                onReorderActivities={handleReorderActivities}
                onEditActivity={handleEditActivity}
                onDeleteActivity={handleDeleteActivity}
                onAddActivity={handleAddActivity}
                className="h-full"
              />
            </div>

            {/* Magic Edit Assistant Panel (Right) */}
            <div className="lg:col-span-3 space-y-6">
              <MagicEditAssistant
                itinerary={skeletonItinerary}
                onUpdateItinerary={handleUpdateItinerary}
                className="h-full"
              />
            </div>
          </div>
        </div>
        
        {/* Lead Generation Popup */}
        <LeadGenerationPopup
          isOpen={showPopup}
          onClose={handlePopupClose}
          triggerReason={triggerReason}
          itineraryContext={{
            destination: skeletonItinerary.destination,
            duration: skeletonItinerary.duration,
            travelers: skeletonItinerary.travelers
          }}
        />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      {/* Quick Voice Input Option */}
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Plan Your Perfect Trip
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Use AI to create a personalized itinerary in seconds
          </p>
          
          {/* Reset button when there's been an error */}
          {hasTriedGeneration && currentView === 'form' && (
            <Button
              variant="outline"
              onClick={() => {
                setHasTriedGeneration(false)
                setNaturalLanguageQuery('')
                setVoiceQuery('')
                // Clear URL parameters
                router.push('/plan')
              }}
              className="mb-4"
            >
              Clear and Try Again
            </Button>
          )}
          
          {isSupported && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => setCurrentView('voice')}
              className="gap-2 mb-8"
            >
              <Mic className="w-5 h-5" />
              Use Voice Input
            </Button>
          )}
        </div>
        
        <AIRequestForm 
          onComplete={handleFormComplete} 
          onGenerating={() => setCurrentView('generating')}
        />
      </div>
      
      {/* Lead Generation Popup for form view */}
      <LeadGenerationPopup
        isOpen={showPopup}
        onClose={handlePopupClose}
        triggerReason={triggerReason}
      />
    </motion.div>
  )
}

export default function PlanTripPage() {
  return (
    <ItineraryUIProvider>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }>
        <PlanPageContent />
      </Suspense>
    </ItineraryUIProvider>
  )
}