'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  MapPin, 
  Clock, 
  Users, 
  DollarSign, 
  Star, 
  Calendar,
  CheckCircle,
  XCircle,
  Shield,
  MessageSquare,
  Share,
  Heart,
  ChevronLeft,
  ChevronRight,
  Zap,
  Globe,
  Sparkles,
  Phone,
  Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/lib/analytics/analytics-service'

interface Tour {
  id: string
  name: string
  description: string
  destination: string
  city: string
  country: string
  coordinates?: { lat: number; lng: number }
  price: number
  currency: string
  duration: number
  images: string[]
  rating: number
  reviews: number
  operatorName: string
  operatorId?: string
  featured: boolean
  instantBooking: boolean
  category: string
  included: string[]
  excluded: string[]
  highlights: string[]
  languages: string[]
  groupSize: { min: number; max: number }
  startingPoint?: string
  endingPoint?: string
  cancellationPolicy?: string
  itinerary?: Array<{
    time: string
    title: string
    description: string
  }>
}

export default function TourDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { track } = useAnalytics()
  const tourId = params.tourId as string
  
  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [travelers, setTravelers] = useState(2)
  
  useEffect(() => {
    fetchTourDetails()
  }, [tourId])
  
  const fetchTourDetails = async () => {
    try {
      const response = await fetch(`/api/tours/${tourId}`)
      if (!response.ok) {
        throw new Error('Tour not found')
      }
      const data = await response.json()
      setTour(data.tour)
      
      // Track tour view
      track('tour_detail_viewed', {
        tour_id: data.tour.id,
        tour_name: data.tour.name,
        tour_price: data.tour.price,
        tour_operator: data.tour.operatorName,
        tour_category: data.tour.category,
        tour_destination: data.tour.destination
      })
    } catch (error) {
      console.error('Error fetching tour:', error)
      // Use demo data as fallback
      setTour(generateDemoTour(tourId))
    } finally {
      setLoading(false)
    }
  }
  
  const generateDemoTour = (id: string): Tour => ({
    id,
    name: 'Paris Evening Magic: Eiffel Tower & Seine River Cruise',
    description: 'Experience the City of Lights in all its evening glory. This carefully curated tour combines the best of Paris nightlife with exclusive access to iconic landmarks. Watch the Eiffel Tower sparkle, cruise along the illuminated Seine, and discover hidden gems in Montmartre.',
    destination: 'Paris, France',
    city: 'Paris',
    country: 'France',
    coordinates: { lat: 48.8566, lng: 2.3522 },
    price: 89,
    currency: 'USD',
    duration: 4,
    images: [
      'https://source.unsplash.com/800x600/?paris,eiffel-tower,night',
      'https://source.unsplash.com/800x600/?seine-river,cruise',
      'https://source.unsplash.com/800x600/?montmartre,paris',
      'https://source.unsplash.com/800x600/?paris,cafe'
    ],
    rating: 4.8,
    reviews: 347,
    operatorName: 'Paris Premium Tours',
    operatorId: 'operator-123',
    featured: true,
    instantBooking: true,
    category: 'cultural',
    included: [
      'Professional English-speaking guide',
      'Skip-the-line Eiffel Tower tickets (2nd floor)',
      'Seine River cruise ticket',
      'Metro passes for the evening',
      'Complimentary photos at key locations',
      'Small group (max 15 people)'
    ],
    excluded: [
      'Hotel pickup and drop-off',
      'Meals and drinks',
      'Gratuities',
      'Personal expenses'
    ],
    highlights: [
      'Watch the Eiffel Tower sparkle at night',
      'Cruise the Seine with champagne',
      'Explore artistic Montmartre',
      'Visit a traditional Parisian café',
      'Learn fascinating stories from your guide'
    ],
    languages: ['English', 'Spanish', 'French'],
    groupSize: { min: 2, max: 15 },
    startingPoint: 'Trocadéro Gardens (Metro: Trocadéro)',
    endingPoint: 'Sacré-Cœur, Montmartre',
    cancellationPolicy: 'Free cancellation up to 24 hours before the tour',
    itinerary: [
      {
        time: '6:00 PM',
        title: 'Meet at Trocadéro Gardens',
        description: 'Start with the best view of the Eiffel Tower'
      },
      {
        time: '6:30 PM',
        title: 'Eiffel Tower Visit',
        description: 'Skip the lines and ascend to the 2nd floor'
      },
      {
        time: '7:45 PM',
        title: 'Seine River Cruise',
        description: 'Board your cruise and see Paris from the water'
      },
      {
        time: '9:00 PM',
        title: 'Montmartre Exploration',
        description: 'Wander through the artistic quarter'
      },
      {
        time: '10:00 PM',
        title: 'Tour Ends',
        description: 'Say goodbye at Sacré-Cœur with stunning city views'
      }
    ]
  })
  
  const handleStartPlanning = () => {
    if (tour) {
      track('tour_add_to_planner_clicked', {
        tour_id: tour.id,
        tour_name: tour.name,
        tour_price: tour.price,
        tour_operator: tour.operatorName,
        source: 'tour_detail_page',
        travelers,
        selected_date: selectedDate?.toISOString()
      })
      sessionStorage.setItem('selectedTour', JSON.stringify(tour))
      router.push(`/plan?destination=${encodeURIComponent(tour.destination)}`)
    }
  }
  
  const handleContactOperator = async () => {
    track('tour_contact_operator_clicked', {
      tour_id: tour?.id,
      tour_name: tour?.name,
      tour_price: tour?.price,
      tour_operator: tour?.operatorName,
      travelers,
      selected_date: selectedDate?.toISOString()
    })
    // Generate lead
    try {
      const response = await fetch('/api/tours/generate-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId: tour?.id,
          tourName: tour?.name,
          operatorName: tour?.operatorName,
          operatorId: tour?.operatorId,
          travelerInfo: {
            travelers,
            preferredDate: selectedDate?.toISOString()
          },
          itineraryContext: {
            destination: tour?.destination,
            duration: 1,
            interests: [tour?.category || 'general']
          },
          leadSource: 'tour_detail_page'
        })
      })
      
      if (response.ok) {
        toast.success('Request sent! The tour operator will contact you soon.')
      }
    } catch (error) {
      toast.error('Failed to send request. Please try again.')
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tour details...</p>
        </div>
      </div>
    )
  }
  
  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Tour not found</h2>
          <Button onClick={() => router.push('/tours')}>
            Browse all tours
          </Button>
        </div>
      </div>
    )
  }
  
  // Add structured data for SEO
  const structuredData = tour ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": tour.name,
    "description": tour.description,
    "image": tour.images,
    "offers": {
      "@type": "Offer",
      "price": tour.price,
      "priceCurrency": tour.currency,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": tour.operatorName
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": tour.rating,
      "reviewCount": tour.reviews
    },
    "location": {
      "@type": "Place",
      "name": tour.destination,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": tour.city,
        "addressCountry": tour.country
      }
    }
  } : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add structured data script */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      {/* Image Gallery */}
      <div className="relative h-[300px] sm:h-[400px] md:h-[500px] bg-black">
        <Image
          src={tour.images[selectedImage]}
          alt={tour.name}
          fill
          className="object-cover"
          priority={selectedImage === 0}
          sizes="100vw"
        />
        
        {/* Image Navigation */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {tour.images.map((_, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                selectedImage === index 
                  ? "bg-white w-8" 
                  : "bg-white/50 hover:bg-white/75"
              )}
            />
          ))}
        </div>
        
        {/* Navigation Arrows */}
        <button
          onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : tour.images.length - 1)}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 sm:p-2 rounded-full hover:bg-black/70"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button
          onClick={() => setSelectedImage(prev => prev < tour.images.length - 1 ? prev + 1 : 0)}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 sm:p-2 rounded-full hover:bg-black/70"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        
        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsFavorite(!isFavorite)}
          >
            <Heart className={cn("h-5 w-5", isFavorite && "fill-red-500 text-red-500")} />
          </Button>
          <Button variant="secondary" size="icon">
            <Share className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{tour.name}</h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {tour.city}, {tour.country}
                  </p>
                </div>
                {tour.featured && (
                  <Badge className="bg-orange-500 text-white">Featured</Badge>
                )}
              </div>
              
              {/* Quick Info */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{tour.rating}</span>
                  <span className="text-gray-600">({tour.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="h-5 w-5" />
                  {tour.duration} hours
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="h-5 w-5" />
                  {tour.groupSize.min}-{tour.groupSize.max} people
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Globe className="h-5 w-5" />
                  {tour.languages.join(', ')}
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Overview</h2>
              <p className="text-gray-700 leading-relaxed">{tour.description}</p>
            </div>
            
            {/* Highlights */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Highlights</h2>
              <ul className="space-y-2">
                {tour.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Tabs */}
            <Tabs defaultValue="itinerary" className="mt-8">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                <TabsTrigger value="included">What's Included</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="itinerary" className="mt-6">
                {tour.itinerary ? (
                  <div className="space-y-4">
                    {tour.itinerary.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-600">{item.time}</span>
                          </div>
                          <h4 className="font-semibold mb-1">{item.title}</h4>
                          <p className="text-gray-600">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Detailed itinerary will be provided upon booking.</p>
                )}
              </TabsContent>
              
              <TabsContent value="included" className="mt-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      What's Included
                    </h3>
                    <ul className="space-y-2">
                      {tour.included.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      What's Excluded
                    </h3>
                    <ul className="space-y-2">
                      {tour.excluded.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-6">
                  {/* Rating Summary */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center gap-8">
                      <div>
                        <div className="text-4xl font-bold">{tour.rating}</div>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-5 w-5",
                                i < Math.floor(tour.rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{tour.reviews} reviews</p>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map(rating => {
                          const percentage = rating === 5 ? 65 : rating === 4 ? 25 : rating === 3 ? 7 : rating === 2 ? 2 : 1
                          return (
                            <div key={rating} className="flex items-center gap-2">
                              <span className="text-sm w-3">{rating}</span>
                              <Star className="h-4 w-4 text-gray-400" />
                              <Progress value={percentage} className="flex-1 h-2" />
                              <span className="text-sm text-gray-600 w-10">{percentage}%</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Sample Reviews */}
                  <div className="space-y-4">
                    {[
                      {
                        name: 'Sarah M.',
                        date: '2 weeks ago',
                        rating: 5,
                        comment: 'Absolutely amazing experience! Our guide was knowledgeable and friendly. The sunset from the Eiffel Tower was breathtaking.'
                      },
                      {
                        name: 'John D.',
                        date: '1 month ago',
                        rating: 5,
                        comment: 'Perfect evening in Paris. Small group size made it feel personal. Highly recommend!'
                      },
                      {
                        name: 'Emma L.',
                        date: '1 month ago',
                        rating: 4,
                        comment: 'Great tour overall. The only downside was the cruise was a bit crowded, but still enjoyed it.'
                      }
                    ].map((review, index) => (
                      <div key={index} className="border-b pb-4 last:border-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{review.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{review.name}</p>
                              <p className="text-sm text-gray-600">{review.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    Load more reviews
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Booking Card */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <Card className="lg:sticky lg:top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {tour.currency === 'USD' ? '$' : tour.currency} {tour.price}
                      <span className="text-sm font-normal text-gray-600"> per person</span>
                    </p>
                    {tour.instantBooking && (
                      <Badge variant="outline" className="mt-2 gap-1">
                        <Zap className="h-3 w-3" />
                        Instant Booking
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Selection */}
                <div>
                  <Label htmlFor="date" className="mb-2 block">Select Date</Label>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => toast.info('Calendar picker would open here')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {selectedDate ? selectedDate.toLocaleDateString() : 'Choose a date'}
                  </Button>
                </div>
                
                {/* Travelers */}
                <div>
                  <Label htmlFor="travelers" className="mb-2 block">Number of Travelers</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTravelers(Math.max(tour.groupSize.min, travelers - 1))}
                    >
                      -
                    </Button>
                    <div className="flex-1 text-center font-medium">{travelers}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTravelers(Math.min(tour.groupSize.max, travelers + 1))}
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold">
                    {tour.currency === 'USD' ? '$' : tour.currency} {tour.price * travelers}
                  </span>
                </div>
                
                {/* Actions */}
                <div className="space-y-2">
                  <Button className="w-full" size="lg" onClick={handleStartPlanning}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Use This Template
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleContactOperator}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Operator
                  </Button>
                  <p className="text-xs text-center text-gray-500 px-2">
                    This is a template. You'll customize it in the trip planner.
                  </p>
                </div>
                
                {/* Policies */}
                <div className="pt-4 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-gray-600">{tour.cancellationPolicy}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Operator Info */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Tour Operator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar>
                    <AvatarFallback>{tour.operatorName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{tour.operatorName}</p>
                    <p className="text-sm text-gray-600">Verified operator</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Available Mon-Fri, 9am-6pm
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Response time: ~2 hours
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}