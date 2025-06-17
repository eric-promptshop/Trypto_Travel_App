'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TripNavLogo } from '@/components/ui/TripNavLogo'
import { Calendar, MapPin, Clock, Star, DollarSign, ChevronRight, Copy, Download } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SharedItineraryPage() {
  const searchParams = useSearchParams()
  const [itinerary, setItinerary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Get parameters from URL
  const tripId = searchParams.get('id')
  const title = searchParams.get('title')
  const destination = searchParams.get('destination')
  const dates = searchParams.get('dates')
  
  const [startDate, endDate] = dates?.split('_') || []
  
  useEffect(() => {
    // In a real app, you would fetch the full itinerary from the API
    // For now, we'll create a demo itinerary
    if (tripId && title && destination) {
      // Simulate loading
      setTimeout(() => {
        setItinerary({
          id: tripId,
          title: decodeURIComponent(title),
          destination: decodeURIComponent(destination),
          startDate,
          endDate,
          days: generateDemoItinerary()
        })
        setIsLoading(false)
      }, 1000)
    }
  }, [tripId, title, destination, startDate, endDate])
  
  // Generate demo itinerary data
  const generateDemoItinerary = () => {
    const days = []
    const start = new Date(startDate || Date.now())
    const end = new Date(endDate || Date.now())
    const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    for (let i = 0; i < dayCount; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      
      days.push({
        dayNumber: i + 1,
        date: date.toISOString(),
        activities: generateDayActivities(i + 1)
      })
    }
    
    return days
  }
  
  const generateDayActivities = (dayNumber: number) => {
    const activities = [
      {
        time: '9:00 AM',
        name: 'Breakfast at Local Café',
        category: 'restaurant',
        duration: '1 hour',
        price: 2,
        rating: 4.5
      },
      {
        time: '10:30 AM',
        name: dayNumber === 1 ? 'City Walking Tour' : 'Museum Visit',
        category: 'attraction',
        duration: '2 hours',
        price: 3,
        rating: 4.8
      },
      {
        time: '1:00 PM',
        name: 'Lunch at Traditional Restaurant',
        category: 'restaurant',
        duration: '1.5 hours',
        price: 3,
        rating: 4.6
      },
      {
        time: '3:00 PM',
        name: dayNumber % 2 === 0 ? 'Beach Time' : 'Shopping District',
        category: dayNumber % 2 === 0 ? 'activity' : 'shopping',
        duration: '2 hours',
        price: 1,
        rating: 4.4
      },
      {
        time: '7:00 PM',
        name: 'Dinner with a View',
        category: 'restaurant',
        duration: '2 hours',
        price: 4,
        rating: 4.9
      }
    ]
    
    return activities
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }
  
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <TripNavLogo size="lg" animated className="mx-auto mb-4" />
          <p className="text-gray-600">Loading itinerary...</p>
        </div>
      </div>
    )
  }
  
  if (!itinerary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <TripNavLogo size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Itinerary Not Found</h1>
          <p className="text-gray-600 mb-4">This itinerary link may be invalid or expired.</p>
          <Link href="/">
            <Button>Go to Homepage</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <TripNavLogo size="md" />
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Link href="/auth/signup">
                <Button size="sm">
                  Save & Edit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-blue-600 to-brand-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{itinerary.title}</h1>
          <div className="flex items-center gap-4 text-white/90">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {itinerary.destination}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(itinerary.startDate)} - {formatDate(itinerary.endDate)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Main Content */}
          <div className="space-y-6">
            {itinerary.days.map((day: any) => (
              <Card key={day.dayNumber} className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Day {day.dayNumber} - {formatDate(day.date)}
                </h2>
                <div className="space-y-4">
                  {day.activities.map((activity: any, index: number) => (
                    <div
                      key={index}
                      className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-brand-blue-100 text-brand-blue-600 rounded-lg flex items-center justify-center">
                          <Clock className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.time} • {activity.duration}
                            </p>
                          </div>
                          <div className="text-right">
                            {activity.rating && (
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{activity.rating}</span>
                              </div>
                            )}
                            {activity.price && (
                              <div className="text-sm text-gray-600 mt-1">
                                {'$'.repeat(activity.price)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* CTA Card */}
            <Card className="p-6 bg-gradient-to-br from-brand-blue-50 to-brand-orange-50">
              <h3 className="font-bold text-lg mb-2">Make This Trip Yours</h3>
              <p className="text-sm text-gray-600 mb-4">
                Sign up for free to customize this itinerary, add notes, and share with travel companions.
              </p>
              <Link href={`/auth/signup?redirect=/plan/${tripId}`} className="block">
                <Button className="w-full">
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Customize Itinerary
                </Button>
              </Link>
            </Card>
            
            {/* Features */}
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">With a Free Account</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm">Edit and customize activities</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm">Add notes and reminders</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm">Share with travel companions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm">Access from any device</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm">Download as PDF</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-100 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-600">
            <p>© 2024 TripNav. All rights reserved.</p>
            <div className="mt-2">
              <Link href="/privacy" className="hover:text-brand-blue-600">Privacy Policy</Link>
              <span className="mx-2">•</span>
              <Link href="/terms" className="hover:text-brand-blue-600">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}