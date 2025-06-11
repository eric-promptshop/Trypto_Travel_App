'use client'

import { useState } from 'react'
import { Button, TripNavButton } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { 
  BookOpen, 
  Plane, 
  MapPin, 
  Calendar, 
  Users, 
  CreditCard, 
  Star,
  ChevronRight,
  CheckCircle,
  Palette,
  Navigation,
  Smartphone
} from 'lucide-react'

export default function Guide() {
  const [activeSection, setActiveSection] = useState('getting-started')

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Plane,
      description: 'Learn the basics of TripNav'
    },
    {
      id: 'planning',
      title: 'Planning Your Trip',
      icon: Calendar,
      description: 'Step-by-step trip planning'
    },
    {
      id: 'ui-components',
      title: 'UI Components',
      icon: Palette,
      description: 'Explore our design system'
    },
    {
      id: 'mobile',
      title: 'Mobile Features',
      icon: Smartphone,
      description: 'Mobile-optimized experience'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-[#1B365D] text-white">
              <BookOpen className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#1B365D] mb-4">TripNav Guide</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to know to plan amazing trips with TripNav's professional travel planning platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-[#1B365D] flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-[#FF7B00]" />
                  Guide Sections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      activeSection === section.id
                        ? 'bg-[#1B365D] text-white shadow-sm'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <section.icon className={`h-4 w-4 ${
                      activeSection === section.id ? 'text-[#FF7B00]' : 'text-slate-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{section.title}</div>
                      <div className={`text-xs ${
                        activeSection === section.id ? 'text-white/80' : 'text-slate-500'
                      }`}>
                        {section.description}
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-transform ${
                      activeSection === section.id ? 'rotate-90' : ''
                    }`} />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Getting Started */}
            {activeSection === 'getting-started' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-[#1B365D] mb-4">Getting Started with TripNav</h2>
                  <p className="text-lg text-slate-600">
                    Welcome to TripNav! Your professional travel planning platform designed to create amazing itineraries effortlessly.
                  </p>
                </div>

                {/* Quick Start Steps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-[#FF7B00]" />
                      Quick Start in 3 Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-[#1B365D] text-white rounded-full flex items-center justify-center mx-auto mb-3">
                          <Plane className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-[#1B365D] mb-2">1. Plan Your Trip</h3>
                        <p className="text-sm text-slate-600">Enter your destination, dates, and preferences to get started</p>
                      </div>
                      
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-[#FF7B00] text-white rounded-full flex items-center justify-center mx-auto mb-3">
                          <MapPin className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-[#1B365D] mb-2">2. Customize</h3>
                        <p className="text-sm text-slate-600">Personalize your itinerary with activities, hotels, and experiences</p>
                      </div>
                      
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-[#1B365D] mb-2">3. Book & Go</h3>
                        <p className="text-sm text-slate-600">Review your itinerary and book your perfect trip</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Features */}
                <Card>
                  <CardHeader>
                    <CardTitle>Key Features</CardTitle>
                    <CardDescription>Discover what makes TripNav special</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Badge variant="secondary" className="mt-1">
                          <Star className="h-3 w-3" />
                        </Badge>
                        <div>
                          <h4 className="font-medium text-[#1B365D]">AI-Powered Planning</h4>
                          <p className="text-sm text-slate-600">Smart suggestions based on your preferences</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Badge variant="secondary" className="mt-1">
                          <MapPin className="h-3 w-3" />
                        </Badge>
                        <div>
                          <h4 className="font-medium text-[#1B365D]">Real-time Updates</h4>
                          <p className="text-sm text-slate-600">Live flight status and travel alerts</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Badge variant="secondary" className="mt-1">
                          <Users className="h-3 w-3" />
                        </Badge>
                        <div>
                          <h4 className="font-medium text-[#1B365D]">Group Planning</h4>
                          <p className="text-sm text-slate-600">Collaborate with travel companions</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Badge variant="secondary" className="mt-1">
                          <CreditCard className="h-3 w-3" />
                        </Badge>
                        <div>
                          <h4 className="font-medium text-[#1B365D]">Budget Tracking</h4>
                          <p className="text-sm text-slate-600">Keep track of expenses and savings</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Alert variant="default">
                  <AlertTitle>Pro Tip</AlertTitle>
                  <AlertDescription>
                    Start by exploring the UI Components section to see all the travel-specific features we've built for you!
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Planning Your Trip */}
            {activeSection === 'planning' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-[#1B365D] mb-4">Planning Your Trip</h2>
                  <p className="text-lg text-slate-600">
                    Follow our step-by-step guide to create the perfect itinerary for your next adventure.
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Step 1: Choose Your Destination</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600">Start by selecting where you want to go. Our smart search helps you find the perfect destination.</p>
                    <Alert variant="default">
                      <AlertTitle>Destination Tips</AlertTitle>
                      <AlertDescription>
                        Consider factors like weather, local events, and seasonal pricing when choosing your travel dates.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Step 2: Set Your Dates & Budget</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600">Select your travel dates and set a realistic budget for your trip.</p>
                    <div className="flex gap-2">
                      <Badge variant="default">Budget-Friendly</Badge>
                      <Badge variant="secondary">Premium</Badge>
                      <Badge variant="outline">Luxury</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Step 3: Customize Your Experience</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600">Add activities, accommodations, and experiences that match your interests.</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default">Adventure</Badge>
                      <Badge variant="default">Leisure</Badge>
                      <Badge variant="default">Business</Badge>
                      <Badge variant="secondary">Beach</Badge>
                      <Badge variant="secondary">City</Badge>
                      <Badge variant="secondary">Mountain</Badge>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center">
                  <Button className="px-8">
                    Start Planning Your Trip
                  </Button>
                </div>
              </div>
            )}

            {/* UI Components */}
            {activeSection === 'ui-components' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-[#1B365D] mb-4">TripNav UI Components</h2>
                  <p className="text-lg text-slate-600">
                    Explore our professional-grade UI components designed specifically for travel planning.
                  </p>
                </div>

                <Alert variant="default">
                  <AlertTitle>Component Library</AlertTitle>
                  <AlertDescription>
                    Visit our dedicated UI Showcase page to see all components with live examples and interactive demos.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Buttons & Actions</CardTitle>
                      <CardDescription>Professional buttons with TripNav branding</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <TripNavButton size="sm" className="w-full">Primary Action</TripNavButton>
                      <TripNavButton variant="accent" size="sm" className="w-full">Secondary Action</TripNavButton>
                      <Button variant="outline" size="sm" className="w-full">Outline Style</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Status Badges</CardTitle>
                      <CardDescription>Travel-specific status indicators</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="default">Confirmed</Badge>
                        <Badge variant="secondary">Pending</Badge>
                        <Badge variant="destructive">Cancelled</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Travel Alerts</CardTitle>
                      <CardDescription>Important notifications and updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Alert variant="destructive">
                        <AlertTitle>Flight Update</AlertTitle>
                        <AlertDescription>Your flight has been updated with new departure time.</AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Trip Categories</CardTitle>
                      <CardDescription>Different types of travel experiences</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="default">Business</Badge>
                        <Badge variant="secondary">Leisure</Badge>
                        <Badge variant="outline">Adventure</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Brand Colors</CardTitle>
                    <CardDescription>TripNav's professional color palette</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-[#1B365D] rounded-lg mx-auto mb-2"></div>
                        <div className="font-medium text-[#1B365D]">Primary Blue</div>
                        <div className="text-sm text-slate-500">#1B365D</div>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-[#FF7B00] rounded-lg mx-auto mb-2"></div>
                        <div className="font-medium text-[#1B365D]">Accent Orange</div>
                        <div className="text-sm text-slate-500">#FF7B00</div>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white border-2 border-slate-200 rounded-lg mx-auto mb-2"></div>
                        <div className="font-medium text-[#1B365D]">Clean White</div>
                        <div className="text-sm text-slate-500">#FFFFFF</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center">
                  <Button variant="outline" onClick={() => window.open('/ui-showcase', '_blank')}>
                    <Palette className="mr-2 h-4 w-4" />
                    View Full Component Library
                  </Button>
                </div>
              </div>
            )}

            {/* Mobile Features */}
            {activeSection === 'mobile' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-[#1B365D] mb-4">Mobile Experience</h2>
                  <p className="text-lg text-slate-600">
                    TripNav is fully optimized for mobile devices, giving you access to your trips anywhere.
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Mobile-First Design</CardTitle>
                    <CardDescription>Optimized for touch and small screens</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600">
                      Every component is designed to work perfectly on mobile devices with touch-friendly interactions and responsive layouts.
                    </p>
                    <Alert variant="default">
                      <AlertTitle>Try it out!</AlertTitle>
                      <AlertDescription>
                        Access TripNav on your phone or tablet to experience the mobile-optimized interface.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Offline Access</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 mb-3">
                        View your itineraries even when you don't have internet connection.
                      </p>
                      <Badge variant="default">Available Offline</Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 mb-3">
                        Fast access to check-in, boarding passes, and travel documents.
                      </p>
                      <Badge variant="default">One-Tap Access</Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
} 