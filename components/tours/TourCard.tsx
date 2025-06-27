'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Star, 
  Clock, 
  MapPin, 
  DollarSign, 
  Users,
  Calendar,
  Heart,
  Share,
  Zap
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Tour {
  id: string
  name: string
  description: string
  destination: string
  city: string
  country: string
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
}

interface TourCardProps {
  tour: Tour
  variant?: 'grid' | 'list'
  onClick?: () => void
  onStartPlanning?: () => void
  className?: string
}

export function TourCard({ 
  tour, 
  variant = 'grid',
  onClick,
  onStartPlanning,
  className 
}: TourCardProps) {
  const [isFavorite, setIsFavorite] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)
  
  // Fallback image URL
  const imageUrl = React.useMemo(() => {
    if (imageError || !tour.images || tour.images.length === 0) {
      return `https://source.unsplash.com/400x300/?${encodeURIComponent(tour.category || 'travel')},${encodeURIComponent(tour.city || 'destination')}`
    }
    return tour.images[0]
  }, [imageError, tour.images, tour.category, tour.city])

  // Lead capture function
  const captureLeadInteraction = async (interactionType: 'view' | 'favorite' | 'share' | 'start_planning') => {
    try {
      // Only capture leads for verified operator tours
      if (tour.operatorName === 'Google Places' || !tour.operatorId) {
        return
      }

      await fetch('/api/tours/generate-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId: tour.id,
          tourName: tour.name,
          operatorName: tour.operatorName,
          operatorId: tour.operatorId,
          interactionType,
          travelerInfo: {
            searchLocation: tour.destination
          },
          leadSource: 'tour_library_search',
          metadata: {
            tourPrice: tour.price,
            tourDuration: tour.duration,
            tourCategory: tour.category
          }
        })
      })
    } catch (error) {
      console.error('Failed to capture lead:', error)
    }
  }

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFavorite(!isFavorite)
    
    if (!isFavorite) {
      await captureLeadInteraction('favorite')
      toast.success('Added to favorites')
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    await captureLeadInteraction('share')
    
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: tour.name,
        text: tour.description,
        url: window.location.origin + `/tours/${tour.id}`
      })
    }
  }

  const handleClick = async () => {
    await captureLeadInteraction('view')
    onClick?.()
  }

  const handleStartPlanning = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await captureLeadInteraction('start_planning')
    onStartPlanning?.()
  }

  if (variant === 'list') {
    return (
      <Card 
        className={cn(
          "overflow-hidden cursor-pointer hover:shadow-lg transition-shadow",
          className
        )}
        onClick={handleClick}
      >
        <div className="flex">
          {/* Image */}
          <div className="relative w-64 h-48">
            <Image
              src={imageUrl}
              alt={tour.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
              sizes="(max-width: 768px) 256px, (max-width: 1200px) 384px, 256px"
            />
            {tour.featured && (
              <Badge className="absolute top-2 left-2 bg-orange-500 text-white">
                Featured
              </Badge>
            )}
          </div>

          {/* Content */}
          <CardContent className="flex-1 p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-semibold mb-1">{tour.name}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {tour.city}, {tour.country}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFavorite}
                  className="h-8 w-8"
                >
                  <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="h-8 w-8"
                >
                  <Share className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-gray-600 mb-4 line-clamp-2">{tour.description}</p>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{tour.rating.toFixed(1)}</span>
                <span className="text-sm text-gray-600">({tour.reviews} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                {tour.duration} hours
              </div>
              <Badge variant="secondary">{tour.category}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  <span className="text-sm font-normal text-gray-600">From </span>
                  {tour.currency === 'USD' ? '$' : tour.currency} {tour.price}
                  <span className="text-sm font-normal text-gray-600"> per person</span>
                </p>
                {tour.instantBooking && (
                  <Badge variant="outline" className="mt-1 gap-1">
                    <Zap className="h-3 w-3" />
                    Instant Booking
                  </Badge>
                )}
              </div>
              <Button onClick={handleStartPlanning}>
                Start Planning
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    )
  }

  // Grid variant
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          "overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col",
          className
        )}
        onClick={handleClick}
      >
        {/* Image */}
        <div className="relative h-48">
          <Image
            src={imageUrl}
            alt={tour.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
          {tour.featured && (
            <Badge className="absolute top-2 left-2 bg-orange-500 text-white">
              Featured
            </Badge>
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleFavorite}
              className="h-8 w-8 bg-white/90 hover:bg-white"
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleShare}
              className="h-8 w-8 bg-white/90 hover:bg-white"
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1 line-clamp-2">{tour.name}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
              <MapPin className="h-3 w-3" />
              {tour.city}, {tour.country}
            </p>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{tour.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-600">({tour.reviews})</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="h-3 w-3" />
                {tour.duration}h
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{tour.description}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">
                  {tour.currency === 'USD' ? '$' : tour.currency} {tour.price}
                  <span className="text-xs font-normal text-gray-600"> /person</span>
                </p>
                <p className="text-xs text-gray-600">by {tour.operatorName}</p>
              </div>
              {tour.instantBooking && (
                <Badge variant="outline" className="gap-1">
                  <Zap className="h-3 w-3" />
                  Instant
                </Badge>
              )}
            </div>
            
            <Button 
              className="w-full"
              size="sm"
              onClick={handleStartPlanning}
            >
              Start Planning
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}