'use client'

import { useState } from 'react'
import { Button, TripNavButton } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, MapPin, Plane, TrendingUp, Activity, DollarSign, 
  BarChart3, Users, Star, Settings, Grip, Edit2, Trash2,
  Share2, Download, Filter, Search, AlertCircle
} from 'lucide-react'

// Import the new components
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { PricingInsights } from '@/components/pricing/PricingInsights'
import { ActivityManager } from '@/components/itinerary/ActivityManager'
import { TripDashboard } from '@/components/trips/TripDashboard'
import { ConnectedItineraryViewer } from '@/components/itinerary/ConnectedItineraryViewer'

export default function UIShowcaseV2() {
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data for demonstrations
  const mockActivities = [
    {
      id: '1',
      name: 'Machu Picchu Sunrise Tour',
      type: 'activity' as const,
      date: '2024-05-15',
      time: '05:00',
      location: 'Machu Picchu, Peru',
      cost: 150,
      notes: 'Early morning hike to catch the sunrise',
      rating: 4.9,
      bookingRequired: true,
      contactInfo: 'tour@machupicchu.com',
      tips: 'Bring warm clothes for early morning'
    },
    {
      id: '2',
      name: 'Hotel Belmond Sanctuary Lodge',
      type: 'accommodation' as const,
      date: '2024-05-14',
      time: '15:00',
      location: 'Aguas Calientes, Peru',
      cost: 450,
      notes: 'Luxury accommodation near Machu Picchu',
      rating: 4.8
    }
  ]

  const mockFormData = {
    destination: 'Peru',
    budget: 3000,
    startDate: '2024-05-14',
    endDate: '2024-05-21',
    travelers: 2,
    interests: ['adventure', 'culture', 'nature']
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[#1B365D] to-[#FF7B00] bg-clip-text text-transparent">
            TripNav UI Components
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Showcasing today's new components: Analytics Dashboard, Pricing Engine, Activity Manager, and more
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <Badge variant="secondary">Component Consolidation</Badge>
            <Badge variant="secondary">Real-time Analytics</Badge>
            <Badge variant="secondary">Dynamic Pricing</Badge>
            <Badge variant="secondary">Drag & Drop</Badge>
            <Badge variant="secondary">API Integration</Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-6 lg:w-[800px] mx-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="trips">Trips</TabsTrigger>
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Today's Component Updates</CardTitle>
                <CardDescription>
                  Major UI improvements and new features added to the TripNav platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#FF7B00]" />
                      New Components
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        AnalyticsDashboard - Comprehensive platform analytics
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        PricingInsights - Real-time pricing engine
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        ActivityManager - Drag & drop itinerary management
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        TripDashboard - Trip organization & filtering
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        ConnectedItineraryViewer - Smart data integration
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[#FF7B00]" />
                      Consolidation Complete
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Single logo component (removed duplicates)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Unified form system (1200+ lines removed)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Standardized itinerary components
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Migrated to ModernItineraryViewer
                      </li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Production Ready</AlertTitle>
                  <AlertDescription>
                    All components are tested, documented, and ready for staging deployment.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Analytics Dashboard Component</CardTitle>
                <CardDescription>
                  Real-time platform analytics with charts, metrics, and AI insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Pricing Insights Component</CardTitle>
                <CardDescription>
                  Dynamic pricing engine with budget optimization and market insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingInsights 
                  tripId="demo-trip"
                  budget={mockFormData.budget}
                  startDate={mockFormData.startDate}
                  endDate={mockFormData.endDate}
                  destination={mockFormData.destination}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Activity Manager Component</CardTitle>
                <CardDescription>
                  Drag & drop interface for managing itinerary activities with inline editing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityManager 
                  activities={mockActivities}
                  onActivitiesChange={(activities) => console.log('Activities updated:', activities)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trips Tab */}
          <TabsContent value="trips" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Trip Dashboard Component</CardTitle>
                <CardDescription>
                  Comprehensive trip management with filtering, search, and bulk actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TripDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Buttons Tab */}
          <TabsContent value="buttons" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">TripNav Button System</CardTitle>
                <CardDescription>
                  Custom button variants designed for travel planning interfaces
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Action Variants</h3>
                    <Button className="w-full">Default Action</Button>
                    <TripNavButton variant="accent" className="w-full">
                      Accent Action
                    </TripNavButton>
                    <TripNavButton variant="destination" className="w-full">
                      Destination
                    </TripNavButton>
                    <TripNavButton variant="booking" className="w-full">
                      Book Now
                    </TripNavButton>
                  </div>

                  {/* Status Buttons */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Status Variants</h3>
                    <TripNavButton variant="confirmed" className="w-full">
                      Confirmed
                    </TripNavButton>
                    <TripNavButton variant="pending" className="w-full">
                      Pending
                    </TripNavButton>
                    <TripNavButton variant="cancelled" className="w-full">
                      Cancelled
                    </TripNavButton>
                    <TripNavButton variant="delay" className="w-full">
                      Delayed
                    </TripNavButton>
                  </div>

                  {/* Category Buttons */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Category Variants</h3>
                    <TripNavButton variant="business" className="w-full">
                      Business
                    </TripNavButton>
                    <TripNavButton variant="leisure" className="w-full">
                      Leisure
                    </TripNavButton>
                    <TripNavButton variant="adventure" className="w-full">
                      Adventure
                    </TripNavButton>
                    <TripNavButton variant="luxury" className="w-full">
                      Luxury
                    </TripNavButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Connected Itinerary Demo */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Connected Itinerary Viewer</CardTitle>
              <CardDescription>
                Smart component that fetches data from APIs and provides fallback to mock data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Demo Mode</AlertTitle>
                <AlertDescription>
                  This component normally connects to backend APIs. In demo mode, it displays sample data.
                </AlertDescription>
              </Alert>
              <div className="h-[600px] overflow-auto border rounded-lg">
                <ConnectedItineraryViewer />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}