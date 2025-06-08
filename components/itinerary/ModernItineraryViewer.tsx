"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign, 
  Star, 
  Heart,
  Share2,
  Download,
  Edit3,
  Camera,
  Plane,
  Hotel,
  Utensils,
  Car,
  Activity,
  Info,
  Navigation,
  Phone,
  Globe,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Plus,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Activity {
  id: string
  time: string
  title: string
  description: string
  location: string
  type: 'activity' | 'accommodation' | 'transport' | 'dining' | 'shopping'
  duration: string
  cost: number
  rating?: number
  image?: string
  tips?: string[]
  bookingRequired?: boolean
  contactInfo?: {
    phone?: string
    website?: string
    address?: string
  }
}

interface Day {
  date: string
  title: string
  activities: Activity[]
  totalCost: number
  highlights: string[]
}

interface Itinerary {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  totalDays: number
  travelers: number
  totalBudget: number
  spentBudget: number
  days: Day[]
  description: string
  coverImage: string
  status: 'draft' | 'confirmed' | 'completed'
  lastUpdated: string
}

const mockItinerary: Itinerary = {
  id: '1',
  title: 'Peru Adventure',
  destination: 'Peru',
  startDate: '2024-03-15',
  endDate: '2024-03-22',
  totalDays: 7,
  travelers: 2,
  totalBudget: 2500,
  spentBudget: 1800,
  description: 'Explore ancient Incan ruins and vibrant culture in the heart of South America',
  coverImage: '/images/machu-picchu.png',
  status: 'confirmed',
  lastUpdated: '2024-01-15',
  days: [
    {
      date: '2024-03-15',
      title: 'Arrival in Lima',
      totalCost: 150,
      highlights: ['Historic Center', 'Peruvian Cuisine', 'Colonial Architecture'],
      activities: [
        {
          id: '1',
          time: '10:00',
          title: 'Airport Pickup',
          description: 'Private transfer from Jorge Chávez International Airport',
          location: 'Lima Airport',
          type: 'transport',
          duration: '45 minutes',
          cost: 30,
          bookingRequired: true,
          contactInfo: {
            phone: '+51 1 234 5678',
            website: 'limaprivatetransfers.com'
          }
        },
        {
          id: '2',
          time: '12:00',
          title: 'Hotel Check-in',
          description: 'Boutique hotel in the heart of Miraflores district',
          location: 'Hotel Boutique Lima, Miraflores',
          type: 'accommodation',
          duration: 'Overnight',
          cost: 80,
          rating: 4.5,
          image: '/images/lima-hotel.jpg',
          contactInfo: {
            phone: '+51 1 345 6789',
            website: 'hotelboutiquelima.com',
            address: 'Av. José Larco 1234, Miraflores'
          }
        },
        {
          id: '3',
          time: '14:00',
          title: 'Walking Tour of Historic Center',
          description: 'Explore UNESCO World Heritage colonial architecture',
          location: 'Plaza Mayor, Lima',
          type: 'activity',
          duration: '3 hours',
          cost: 25,
          rating: 4.8,
          tips: ['Wear comfortable walking shoes', 'Bring a camera', 'Try local street food']
        },
        {
          id: '4',
          time: '19:00',
          title: 'Welcome Dinner',
          description: 'Traditional Peruvian cuisine at award-winning restaurant',
          location: 'Central Restaurant, Barranco',
          type: 'dining',
          duration: '2 hours',
          cost: 65,
          rating: 4.9,
          bookingRequired: true,
          contactInfo: {
            phone: '+51 1 242 8515',
            website: 'centralrestaurante.com.pe'
          }
        }
      ]
    },
    {
      date: '2024-03-16',
      title: 'Flight to Cusco & Acclimatization',
      totalCost: 280,
      highlights: ['Sacred Valley Views', 'Inca Culture', 'High Altitude'],
      activities: [
        {
          id: '5',
          time: '06:00',
          title: 'Flight to Cusco',
          description: 'Morning flight from Lima to the ancient capital',
          location: 'Alejandro Velasco Astete International Airport',
          type: 'transport',
          duration: '1.5 hours',
          cost: 120,
          bookingRequired: true
        },
        {
          id: '6',
          time: '10:00',
          title: 'Cusco City Tour',
          description: 'Gentle walking tour to help with altitude acclimatization',
          location: 'San Pedro Market, Cusco',
          type: 'activity',
          duration: '2 hours',
          cost: 20,
          tips: ['Drink plenty of water', 'Take it slow', 'Try coca tea']
        },
        {
          id: '7',
          time: '15:00',
          title: 'San Blas Neighborhood',
          description: 'Artisan workshops and stunning city views',
          location: 'San Blas, Cusco',
          type: 'activity',
          duration: '2 hours',
          cost: 15
        },
        {
          id: '8',
          time: '19:00',
          title: 'Dinner at Local Restaurant',
          description: 'Traditional Andean cuisine',
          location: 'Limo Restaurant, Cusco',
          type: 'dining',
          duration: '1.5 hours',
          cost: 45
        }
      ]
    }
  ]
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'activity':
      return <Activity className="w-5 h-5" />
    case 'accommodation':
      return <Hotel className="w-5 h-5" />
    case 'transport':
      return <Car className="w-5 h-5" />
    case 'dining':
      return <Utensils className="w-5 h-5" />
    case 'shopping':
      return <MapPin className="w-5 h-5" />
    default:
      return <MapPin className="w-5 h-5" />
  }
}

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'activity':
      return 'text-blue-600 bg-blue-100'
    case 'accommodation':
      return 'text-green-600 bg-green-100'
    case 'transport':
      return 'text-purple-600 bg-purple-100'
    case 'dining':
      return 'text-orange-600 bg-orange-100'
    case 'shopping':
      return 'text-pink-600 bg-pink-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

interface ModernItineraryViewerProps {
  itinerary?: Itinerary
  onEdit?: () => void
  onShare?: () => void
  onDownload?: () => void
}

export function ModernItineraryViewer({ 
  itinerary = mockItinerary, 
  onEdit, 
  onShare, 
  onDownload 
}: ModernItineraryViewerProps) {
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2024-01-01 ${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const toggleActivityExpansion = (activityId: string) => {
    const newExpanded = new Set(expandedActivities)
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId)
    } else {
      newExpanded.add(activityId)
    }
    setExpandedActivities(newExpanded)
  }

  const currentDay = itinerary.days[selectedDay]
  const progressPercentage = (itinerary.spentBudget / itinerary.totalBudget) * 100

  // Safety check to prevent undefined access
  if (!currentDay) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Day not found</h2>
          <p className="text-gray-600">Please select a valid day from the itinerary.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Plane className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{itinerary.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{itinerary.destination}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(itinerary.startDate)} - {formatDate(itinerary.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{itinerary.travelers} travelers</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button size="sm" onClick={onEdit}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Trip
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Day Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Trip Overview</CardTitle>
                <CardDescription>
                  {itinerary.totalDays} days in {itinerary.destination}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Budget Overview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Budget Progress</span>
                    <span className="font-medium">
                      ${itinerary.spentBudget.toLocaleString()} / ${itinerary.totalBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, progressPercentage)}%` }}
                    />
                  </div>
                </div>

                <Separator />

                {/* Day Navigation */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Daily Itinerary</h4>
                  <div className="space-y-1">
                    {itinerary.days.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedDay(index)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all",
                          selectedDay === index
                            ? "bg-blue-50 border-2 border-blue-200 text-blue-900"
                            : "hover:bg-gray-50 border-2 border-transparent"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Day {index + 1}</p>
                            <p className="text-xs text-gray-600">{day.title}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-xs font-medium">${day.totalCost}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="pt-4">
                  <Badge 
                    variant={itinerary.status === 'confirmed' ? 'default' : 'secondary'}
                    className="w-full justify-center"
                  >
                    {itinerary.status.charAt(0).toUpperCase() + itinerary.status.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Daily Activities */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDay}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Day Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Day {selectedDay + 1}: {currentDay.title}
                      </h2>
                      <p className="text-gray-600">{formatDate(currentDay.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Daily Budget</p>
                      <p className="text-xl font-bold text-gray-900">${currentDay.totalCost}</p>
                    </div>
                  </div>

                  {/* Day Highlights */}
                  <div className="flex flex-wrap gap-2">
                    {currentDay.highlights.map((highlight, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-6">
                  {currentDay.activities.map((activity, index) => {
                    const isExpanded = expandedActivities.has(activity.id)
                    const isLast = index === currentDay.activities.length - 1

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="relative"
                      >
                        {/* Timeline Line */}
                        {!isLast && (
                          <div className="absolute left-6 top-16 w-0.5 h-full bg-gray-200 z-0" />
                        )}

                        <Card className="relative z-10 border-0 shadow-sm hover:shadow-md transition-all">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              {/* Timeline Dot & Icon */}
                              <div className="flex flex-col items-center gap-2">
                                <div className={cn(
                                  "w-12 h-12 rounded-full flex items-center justify-center",
                                  getActivityColor(activity.type)
                                )}>
                                  {getActivityIcon(activity.type)}
                                </div>
                                <Badge variant="outline" className="text-xs px-2 py-1">
                                  {formatTime(activity.time)}
                                </Badge>
                              </div>

                              {/* Activity Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                      {activity.title}
                                    </h3>
                                    <p className="text-gray-600 mb-2">{activity.description}</p>
                                    
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>{activity.location}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{activity.duration}</span>
                                      </div>
                                      {activity.rating && (
                                        <div className="flex items-center gap-1">
                                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                          <span>{activity.rating}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 ml-4">
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-gray-900">${activity.cost}</p>
                                      {activity.bookingRequired && (
                                        <Badge variant="secondary" className="text-xs">
                                          Booking Required
                                        </Badge>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleActivityExpansion(activity.id)}
                                    >
                                      {isExpanded ? (
                                        <ChevronLeft className="w-4 h-4" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="overflow-hidden"
                                    >
                                      <Separator className="my-4" />
                                      
                                      <div className="space-y-4">
                                        {/* Tips */}
                                        {activity.tips && activity.tips.length > 0 && (
                                          <div>
                                            <h4 className="font-medium text-sm text-gray-700 mb-2">
                                              💡 Tips
                                            </h4>
                                            <ul className="space-y-1">
                                              {activity.tips.map((tip, tipIndex) => (
                                                <li key={tipIndex} className="text-sm text-gray-600 flex items-start gap-2">
                                                  <span className="text-blue-500 mt-1">•</span>
                                                  <span>{tip}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}

                                        {/* Contact Information */}
                                        {activity.contactInfo && (
                                          <div>
                                            <h4 className="font-medium text-sm text-gray-700 mb-2">
                                              📞 Contact Information
                                            </h4>
                                            <div className="space-y-2">
                                              {activity.contactInfo.phone && (
                                                <div className="flex items-center gap-2 text-sm">
                                                  <Phone className="w-4 h-4 text-gray-400" />
                                                  <a 
                                                    href={`tel:${activity.contactInfo.phone}`}
                                                    className="text-blue-600 hover:text-blue-800"
                                                  >
                                                    {activity.contactInfo.phone}
                                                  </a>
                                                </div>
                                              )}
                                              {activity.contactInfo.website && (
                                                <div className="flex items-center gap-2 text-sm">
                                                  <Globe className="w-4 h-4 text-gray-400" />
                                                  <a 
                                                    href={`https://${activity.contactInfo.website}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800"
                                                  >
                                                    {activity.contactInfo.website}
                                                  </a>
                                                </div>
                                              )}
                                              {activity.contactInfo.address && (
                                                <div className="flex items-center gap-2 text-sm">
                                                  <MapPin className="w-4 h-4 text-gray-400" />
                                                  <span className="text-gray-600">{activity.contactInfo.address}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 pt-2">
                                          <Button variant="outline" size="sm">
                                            <Navigation className="w-4 h-4 mr-2" />
                                            Get Directions
                                          </Button>
                                          <Button variant="outline" size="sm">
                                            <Info className="w-4 h-4 mr-2" />
                                            More Info
                                          </Button>
                                          {activity.image && (
                                            <Button variant="outline" size="sm">
                                              <Eye className="w-4 h-4 mr-2" />
                                              View Photos
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation between days */}
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setSelectedDay(Math.max(0, selectedDay - 1))}
                disabled={selectedDay === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Day
              </Button>

              <div className="flex items-center gap-2">
                {itinerary.days.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedDay(index)}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all",
                      selectedDay === index ? "bg-blue-500" : "bg-gray-300 hover:bg-gray-400"
                    )}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => setSelectedDay(Math.min(itinerary.days.length - 1, selectedDay + 1))}
                disabled={selectedDay === itinerary.days.length - 1}
                className="flex items-center gap-2"
              >
                Next Day
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Detail Modal */}
      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent className="max-w-2xl">
          {selectedActivity && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedActivity.title}</DialogTitle>
                <DialogDescription>{selectedActivity.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedActivity.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{selectedActivity.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>${selectedActivity.cost}</span>
                  </div>
                </div>
                
                {selectedActivity.image && (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={selectedActivity.image} 
                      alt={selectedActivity.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {selectedActivity.tips && (
                  <div>
                    <h4 className="font-medium mb-2">Tips</h4>
                    <ul className="space-y-1">
                      {selectedActivity.tips.map((tip, index) => (
                        <li key={index} className="text-sm text-gray-600">• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 