"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ActivitySelector, ActivityTimeline } from "@/components/trip-customization"
import { Calendar, Users, MapPin, DollarSign, Sparkles, Loader2, Clock, Plus } from "lucide-react"

// Import the SelectedActivity type from the component instead of redefining it
// The component defines its own types that we need to match
interface Activity {
  id: string
  name: string
  description: string
  category: 'adventure' | 'cultural' | 'culinary' | 'nature' | 'entertainment' | 'shopping' | 'historical' | 'art' | 'sports' | 'nightlife'
  imageUrl: string
  imageUrls: string[]
  location: {
    address: string
    city: string
    coordinates: [number, number]
  }
  duration: {
    min: number
    max: number
    typical: number
  }
  pricing: {
    currency: string
    adult: number
    child?: number
    isFree: boolean
  }
  rating: {
    overall: number
    reviewCount: number
  }
  timeSlots: string[]
  difficulty: 'easy' | 'moderate' | 'challenging' | 'extreme'
  features: string[]
  languages: string[]
  minParticipants?: number
  maxParticipants?: number
  ageRestrictions?: {
    minimum?: number
    maximum?: number
  }
  whatToExpect: string[]
  inclusions: string[]
  exclusions: string[]
  meetingPoint: string
  cancellationPolicy: {
    type: 'free' | 'partial' | 'strict'
    description: string
    cutoffHours: number
  }
  providerInfo: {
    name: string
    rating: number
    verificationStatus: 'verified' | 'unverified'
  }
  accessibility: {
    wheelchairAccessible: boolean
    mobilityAid: boolean
    visualAid: boolean
    hearingAid: boolean
  }
}

interface SelectedActivity extends Activity {
  selectedDate: string
  selectedTimeSlot: string
  participants: {
    adults: number
    children: number
  }
  totalPrice: number
}

interface AIRecommendation {
  activity: Activity
  reason: string
  matchScore: number
}

export default function ActivitySelectionDemo() {
  // Demo state
  const [selectedActivities, setSelectedActivities] = React.useState<any[]>([])
  const [currentView, setCurrentView] = React.useState<'selection' | 'timeline'>('selection')
  const [aiRecommendations, setAiRecommendations] = React.useState<AIRecommendation[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = React.useState(false)
  const [showRecommendations, setShowRecommendations] = React.useState(false)

  // Demo trip parameters
  const destination = "Paris, France"
  const tripDates = {
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-04')
  }
  const participants = {
    adults: 2,
    children: 1
  }

  // Event handlers
  const handleActivitySelect = (activity: any) => {
    setSelectedActivities(prev => [...prev, activity])
  }

  const handleActivityRemove = (activityId: string) => {
    setSelectedActivities(prev => prev.filter(a => a.id !== activityId))
  }

  const handleAddActivityClick = () => {
    setCurrentView('selection')
  }

  // Calculate summary stats
  const totalPrice = selectedActivities.reduce((sum, activity) => sum + activity.totalPrice, 0)
  const totalActivities = selectedActivities.length
  
  // Fetch AI recommendations
  const fetchAIRecommendations = async () => {
    setIsLoadingRecommendations(true)
    try {
      // Build context from selected activities
      const selectedCategories = selectedActivities.map(a => a.category)
      const averagePrice = totalPrice / (totalActivities || 1)
      
      const response = await fetch('/api/trips-ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          tripDates,
          participants,
          selectedActivities: selectedActivities.map(a => ({
            id: a.id,
            name: a.name,
            category: a.category,
            price: a.totalPrice
          })),
          preferences: {
            categories: selectedCategories,
            priceRange: {
              min: averagePrice * 0.5,
              max: averagePrice * 1.5
            }
          }
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAiRecommendations(data.recommendations || [])
      }
    } catch (error) {
      console.error('Failed to fetch AI recommendations:', error)
      // Fallback to pattern-based recommendations
      generateFallbackRecommendations()
    } finally {
      setIsLoadingRecommendations(false)
    }
  }
  
  // Fallback recommendation logic
  const generateFallbackRecommendations = () => {
    const mockRecommendations: AIRecommendation[] = [
      {
        activity: {
          id: '10',
          name: 'Eiffel Tower Summit Access',
          description: 'Skip the lines and enjoy breathtaking views from the summit of Paris\'s most iconic landmark.',
          category: 'cultural',
          imageUrl: '/api/placeholder/400/250',
          imageUrls: ['/api/placeholder/400/250'],
          location: { address: 'Champ de Mars, 5 Avenue Anatole', city: 'Paris', coordinates: [48.8584, 2.2945] },
          duration: { min: 120, max: 180, typical: 150 },
          pricing: { currency: 'EUR', adult: 28, child: 14, isFree: false },
          rating: { overall: 4.7, reviewCount: 5234 },
          timeSlots: ['09:00', '14:00', '19:00'],
          difficulty: 'easy',
          features: ['photoOpportunity', 'wheelchairAccessible', 'kidfriendly'],
          languages: ['English', 'French'],
          minParticipants: 1,
          maxParticipants: 50,
          ageRestrictions: { minimum: 0 },
          whatToExpect: ['360-degree views', 'Skip-the-line access', 'Glass floor experience'],
          inclusions: ['Summit access', 'Audio guide'],
          exclusions: ['Food and drinks'],
          meetingPoint: 'Eiffel Tower South Pillar',
          cancellationPolicy: { type: 'partial', description: '50% refund if cancelled 24h before', cutoffHours: 24 },
          providerInfo: { name: 'Paris Tours', rating: 4.5, verificationStatus: 'verified' },
          accessibility: { wheelchairAccessible: true, mobilityAid: true, visualAid: false, hearingAid: true }
        } as Activity,
        reason: 'Essential Paris experience that complements your cultural interests',
        matchScore: 0.95
      },
      {
        activity: {
          id: '11',
          name: 'Evening Seine River Dinner Cruise',
          description: 'Combine sightseeing with fine dining on a romantic evening cruise.',
          category: 'culinary',
          imageUrl: '/api/placeholder/400/250',
          imageUrls: ['/api/placeholder/400/250'],
          location: { address: 'Port de Solférino', city: 'Paris', coordinates: [48.8606, 2.3376] },
          duration: { min: 150, max: 180, typical: 165 },
          pricing: { currency: 'EUR', adult: 95, child: 45, isFree: false },
          rating: { overall: 4.5, reviewCount: 892 },
          timeSlots: ['19:30'],
          difficulty: 'easy',
          features: ['culinary', 'photoOpportunity', 'romantic'],
          languages: ['English', 'French'],
          minParticipants: 2,
          maxParticipants: 100,
          ageRestrictions: { minimum: 0 },
          whatToExpect: ['4-course dinner', 'Illuminated monuments', 'Live music'],
          inclusions: ['Dinner', 'Welcome glass of champagne'],
          exclusions: ['Additional drinks'],
          meetingPoint: 'Port de Solférino',
          cancellationPolicy: { type: 'strict', description: 'No refund if cancelled less than 48h before', cutoffHours: 48 },
          providerInfo: { name: 'Seine Cruises', rating: 4.4, verificationStatus: 'verified' },
          accessibility: { wheelchairAccessible: true, mobilityAid: true, visualAid: false, hearingAid: true }
        } as Activity,
        reason: 'Perfect evening activity after your daytime cultural tours',
        matchScore: 0.88
      }
    ]
    setAiRecommendations(mockRecommendations)
  }
  
  // Trigger recommendations when activities change
  React.useEffect(() => {
    if (selectedActivities.length > 0 && showRecommendations) {
      fetchAIRecommendations()
    }
  }, [selectedActivities.length, showRecommendations])

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Activity Selection & Management Demo
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Task 5.3: Build Activity Selection and Management System
          </p>
          
          {/* Trip Summary */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Trip Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Destination</p>
                    <p className="font-semibold">{destination}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">4 days</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Travelers</p>
                    <p className="font-semibold">{participants.adults} adults, {participants.children} child</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Activities Total</p>
                    <p className="font-semibold">{formatPrice(totalPrice)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Activities Summary */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-base px-3 py-1">
                {totalActivities} Activities Selected
              </Badge>
              <Badge variant="secondary" className="text-base px-3 py-1">
                Total: {formatPrice(totalPrice)}
              </Badge>
            </div>
            <Button
              onClick={() => {
                setShowRecommendations(!showRecommendations)
                if (!showRecommendations && selectedActivities.length > 0) {
                  fetchAIRecommendations()
                }
              }}
              variant="outline"
              disabled={selectedActivities.length === 0}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              AI Recommendations
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="selection">Activity Selection</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          </TabsList>

          {/* Activity Selection Tab */}
          <TabsContent value="selection" className="space-y-6">
            {/* AI Recommendations Section */}
            {showRecommendations && selectedActivities.length > 0 && (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-orange-500" />
                      <CardTitle>AI-Powered Recommendations</CardTitle>
                    </div>
                    {isLoadingRecommendations && (
                      <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                    )}
                  </div>
                  <CardDescription>
                    Based on your selected activities and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingRecommendations ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    </div>
                  ) : aiRecommendations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiRecommendations.map((rec) => (
                        <Card key={rec.activity.id} className="overflow-hidden">
                          <div className="aspect-video relative">
                            <img
                              src={rec.activity.imageUrl}
                              alt={rec.activity.name}
                              className="w-full h-full object-cover"
                            />
                            <Badge className="absolute top-2 right-2 bg-orange-500">
                              {Math.round(rec.matchScore * 100)}% Match
                            </Badge>
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-lg mb-2">{rec.activity.name}</h4>
                            <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span>{Math.round(rec.activity.duration.typical / 60)}h</span>
                                <DollarSign className="h-4 w-4 text-gray-500 ml-2" />
                                <span>{formatPrice(rec.activity.pricing.adult, rec.activity.pricing.currency)}</span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleActivitySelect({
                                  ...rec.activity,
                                  selectedDate: tripDates.startDate.toISOString(),
                                  selectedTimeSlot: rec.activity.timeSlots[0],
                                  participants,
                                  totalPrice: rec.activity.pricing.adult * participants.adults + (rec.activity.pricing.child || 0) * participants.children
                                })}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      No recommendations available. Try adding more activities to get personalized suggestions.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Activity Selection Interface</CardTitle>
                <CardDescription>
                  Browse and select activities with advanced filtering, search, and category options.
                  Features demonstrated:
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary">Category Filtering</Badge>
                  <Badge variant="secondary">Search with Autocomplete</Badge>
                  <Badge variant="secondary">Price & Duration Filters</Badge>
                  <Badge variant="secondary">Grid/List View</Badge>
                  <Badge variant="secondary">Favorites System</Badge>
                  <Badge variant="secondary">Real-time Pricing</Badge>
                  <Badge variant="secondary">AI Recommendations</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ActivitySelector
                  destination={destination}
                  tripDates={tripDates}
                  onActivitySelect={handleActivitySelect}
                  onActivityRemove={handleActivityRemove}
                  selectedActivities={selectedActivities}
                  participants={participants}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline View Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline & Conflict Detection</CardTitle>
                <CardDescription>
                  View selected activities organized by day with automatic conflict detection.
                  Features demonstrated:
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary">Day-by-Day Timeline</Badge>
                  <Badge variant="secondary">Time Conflict Detection</Badge>
                  <Badge variant="secondary">Empty State Handling</Badge>
                  <Badge variant="secondary">Activity Management</Badge>
                  <Badge variant="secondary">Duration & Pricing Summary</Badge>
                  <Badge variant="secondary">Add Activity Suggestions</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ActivityTimeline
                  selectedActivities={selectedActivities}
                  tripDates={tripDates}
                  onActivityRemove={handleActivityRemove}
                  onAddActivityClick={handleAddActivityClick}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Implementation Details */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Implementation Features</CardTitle>
            <CardDescription>
              Task 5.3 deliverables completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">✅ Activity Cards</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Images, descriptions, duration, and pricing</li>
                  <li>• Category badges and difficulty indicators</li>
                  <li>• Star ratings and review counts</li>
                  <li>• Feature badges (guided tour, accessible, etc.)</li>
                  <li>• Add/remove functionality with animations</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">✅ Category-based Filtering</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Cultural, adventure, culinary, nature, etc.</li>
                  <li>• Duration and price range sliders</li>
                  <li>• Difficulty level filtering</li>
                  <li>• Feature-based filtering</li>
                  <li>• Real-time filter application</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">✅ Search & Autocomplete</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Search by name, description, tags</li>
                  <li>• Autocomplete suggestions with images</li>
                  <li>• Real-time search results</li>
                  <li>• Search result highlighting</li>
                  <li>• Multiple sorting options</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">✅ Timeline View</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Day-by-day activity organization</li>
                  <li>• Time conflict detection and alerts</li>
                  <li>• Empty state suggestions</li>
                  <li>• Activity duration and pricing summaries</li>
                  <li>• Quick add/remove actions</li>
                </ul>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div>
              <h4 className="font-semibold mb-3">🔧 Technical Implementation</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <p className="font-medium text-gray-900 mb-2">TypeScript Interfaces</p>
                  <p>Comprehensive type safety with Activity, SelectedActivity, and filter interfaces</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">State Management</p>
                  <p>React hooks for activity selection, filtering, favorites, and conflict detection</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">Responsive Design</p>
                  <p>Mobile-first design with grid/list views and touch-friendly interactions</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button 
            onClick={() => setCurrentView('selection')}
            variant={currentView === 'selection' ? 'default' : 'outline'}
          >
            Select Activities
          </Button>
          <Button 
            onClick={() => setCurrentView('timeline')}
            variant={currentView === 'timeline' ? 'default' : 'outline'}
          >
            View Timeline
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setSelectedActivities([])}
          >
            Clear All
          </Button>
        </div>
      </div>
    </div>
  )
} 