"use client"

import * as React from "react"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DragDropTimeline, ActivityTimeline } from "@/components/trip-customization"
import { 
  Calendar, 
  Users, 
  MapPin, 
  DollarSign, 
  Sparkles,
  RefreshCw,
  Info,
  GripVertical,
  Clock,
  Star
} from "lucide-react"

// Mock selected activity interface
interface SelectedActivity {
  id: string
  name: string
  description: string
  category: 'adventure' | 'cultural' | 'culinary' | 'nature' | 'entertainment' | 'shopping' | 'historical' | 'art' | 'sports' | 'nightlife'
  imageUrl: string
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
  selectedDate: string
  selectedTimeSlot: string
  participants: {
    adults: number
    children: number
  }
  totalPrice: number
}

export default function DragDropTimelinePage() {
  // Trip configuration
  const tripDates = {
    startDate: new Date('2024-03-15'),
    endDate: new Date('2024-03-18')
  }

  const travelers = {
    adults: 2,
    children: 1,
    infants: 0
  }

  // Mock selected activities data
  const [selectedActivities, setSelectedActivities] = useState<SelectedActivity[]>([
    {
      id: "eiffel-tower-visit",
      name: "Eiffel Tower Guided Tour",
      description: "Skip-the-line access with professional guide. Learn about the history and architecture of Paris's most iconic landmark.",
      category: "cultural",
      imageUrl: "/api/placeholder/400/300",
      location: {
        address: "Champ de Mars, 5 Av. Anatole France, 75007 Paris",
        city: "Paris",
        coordinates: [48.8584, 2.2945]
      },
      duration: { min: 90, max: 150, typical: 120 },
      pricing: { currency: "EUR", adult: 35, child: 17, isFree: false },
      rating: { overall: 4.7, reviewCount: 12840 },
      selectedDate: "2024-03-15",
      selectedTimeSlot: "09:00",
      participants: { adults: 2, children: 1 },
      totalPrice: 87
    },
    {
      id: "seine-river-cruise",
      name: "Seine River Evening Cruise",
      description: "Romantic evening cruise along the Seine with dinner service. See Paris illuminated at night.",
      category: "entertainment",
      imageUrl: "/api/placeholder/400/300",
      location: {
        address: "Port de la Bourdonnais, 75007 Paris",
        city: "Paris",
        coordinates: [48.8606, 2.2978]
      },
      duration: { min: 150, max: 180, typical: 165 },
      pricing: { currency: "EUR", adult: 89, child: 45, isFree: false },
      rating: { overall: 4.5, reviewCount: 8920 },
      selectedDate: "2024-03-15",
      selectedTimeSlot: "19:30",
      participants: { adults: 2, children: 1 },
      totalPrice: 223
    },
    {
      id: "louvre-museum",
      name: "Louvre Museum Private Tour",
      description: "3-hour private tour of the world's largest art museum. See the Mona Lisa, Venus de Milo, and other masterpieces.",
      category: "cultural",
      imageUrl: "/api/placeholder/400/300",
      location: {
        address: "Rue de Rivoli, 75001 Paris",
        city: "Paris",
        coordinates: [48.8606, 2.3376]
      },
      duration: { min: 180, max: 240, typical: 210 },
      pricing: { currency: "EUR", adult: 120, child: 60, isFree: false },
      rating: { overall: 4.8, reviewCount: 15600 },
      selectedDate: "2024-03-16",
      selectedTimeSlot: "10:00",
      participants: { adults: 2, children: 1 },
      totalPrice: 300
    },
    {
      id: "cooking-class",
      name: "French Cooking Masterclass",
      description: "Learn to prepare authentic French cuisine with a professional chef. Includes 3-course meal and wine pairing.",
      category: "culinary",
      imageUrl: "/api/placeholder/400/300",
      location: {
        address: "15 Rue Dauphine, 75006 Paris",
        city: "Paris",
        coordinates: [48.8566, 2.3407]
      },
      duration: { min: 180, max: 240, typical: 210 },
      pricing: { currency: "EUR", adult: 95, child: 50, isFree: false },
      rating: { overall: 4.9, reviewCount: 3240 },
      selectedDate: "2024-03-16",
      selectedTimeSlot: "15:00",
      participants: { adults: 2, children: 1 },
      totalPrice: 240
    },
    {
      id: "versailles-day-trip",
      name: "Palace of Versailles Day Trip",
      description: "Full day excursion to the magnificent Palace of Versailles with guided tour of palace and gardens.",
      category: "historical",
      imageUrl: "/api/placeholder/400/300",
      location: {
        address: "Place d'Armes, 78000 Versailles",
        city: "Versailles",
        coordinates: [48.8049, 2.1204]
      },
      duration: { min: 480, max: 540, typical: 510 },
      pricing: { currency: "EUR", adult: 75, child: 40, isFree: false },
      rating: { overall: 4.6, reviewCount: 9850 },
      selectedDate: "2024-03-17",
      selectedTimeSlot: "08:30",
      participants: { adults: 2, children: 1 },
      totalPrice: 190
    },
    {
      id: "montmartre-walking-tour",
      name: "Montmartre & Sacré-Cœur Walking Tour",
      description: "Explore the artistic heart of Paris with visits to Place du Tertre, Moulin Rouge, and Sacré-Cœur Basilica.",
      category: "cultural",
      imageUrl: "/api/placeholder/400/300",
      location: {
        address: "Place du Tertre, 75018 Paris",
        city: "Paris",
        coordinates: [48.8867, 2.3431]
      },
      duration: { min: 150, max: 180, typical: 165 },
      pricing: { currency: "EUR", adult: 25, child: 12, isFree: false },
      rating: { overall: 4.4, reviewCount: 6540 },
      selectedDate: "2024-03-18",
      selectedTimeSlot: "14:00",
      participants: { adults: 2, children: 1 },
      totalPrice: 62
    }
  ])

  // State management
  const [currentView, setCurrentView] = useState<'drag-drop' | 'timeline'>('drag-drop')

  // Event handlers
  const handleActivityRemove = (activityId: string) => {
    setSelectedActivities(prev => prev.filter(a => a.id !== activityId))
  }

  const handleActivityReorder = (reorderedActivities: SelectedActivity[]) => {
    setSelectedActivities(reorderedActivities)
  }

  const handleActivityDateChange = (activityId: string, newDate: string) => {
    setSelectedActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { ...activity, selectedDate: newDate }
          : activity
      )
    )
  }

  const handleAddActivity = (date: string) => {
    console.log('Add activity for date:', date)
    // In a real app, this would open the activity selector
  }

  const resetToDefaultItinerary = () => {
    // Reset to original order
    setSelectedActivities([...selectedActivities].sort((a, b) => a.selectedDate.localeCompare(b.selectedDate)))
  }

  // Statistics
  const totalActivities = selectedActivities.length
  const totalPrice = selectedActivities.reduce((sum, activity) => sum + activity.totalPrice, 0)
  const uniqueDays = new Set(selectedActivities.map(a => a.selectedDate)).size

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <GripVertical className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Drag-and-Drop Timeline Demo
            </h1>
            <p className="text-xl text-gray-600 mt-2">
              Interactive itinerary reordering with drag-and-drop functionality
            </p>
          </div>
        </div>

        {/* Trip Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Paris Adventure Trip
            </CardTitle>
            <CardDescription>
              March 15-18, 2024 • {travelers.adults} adults, {travelers.children} child
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalActivities}</div>
                <div className="text-sm text-gray-600">Total Activities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">€{totalPrice}</div>
                <div className="text-sm text-gray-600">Total Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{uniqueDays}</div>
                <div className="text-sm text-gray-600">Days Planned</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card className="mb-8 border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            Drag-and-Drop Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-amber-800">Reordering Capabilities:</h4>
              <ul className="space-y-1 text-amber-700">
                <li>• Drag activities within the same day</li>
                <li>• Move activities between different days</li>
                <li>• Automatic time slot optimization</li>
                <li>• Visual feedback during drag operations</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-amber-800">Smart Validation:</h4>
              <ul className="space-y-1 text-amber-700">
                <li>• Prevents invalid day assignments</li>
                <li>• Conflict detection and warnings</li>
                <li>• Touch and keyboard accessibility</li>
                <li>• Responsive design for all devices</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Requirements */}
      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Package Requirements:</strong> This demo requires installing @dnd-kit packages:
          <code className="block mt-2 p-2 bg-gray-100 rounded text-sm">
            npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
          </code>
        </AlertDescription>
      </Alert>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant={currentView === 'drag-drop' ? 'default' : 'outline'}
            onClick={() => setCurrentView('drag-drop')}
            className="gap-2"
          >
            <GripVertical className="h-4 w-4" />
            Drag-and-Drop Timeline
          </Button>
          <Button
            variant={currentView === 'timeline' ? 'default' : 'outline'}
            onClick={() => setCurrentView('timeline')}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Standard Timeline
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          onClick={resetToDefaultItinerary}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reset Order
        </Button>
      </div>

      {/* Timeline Views */}
      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as 'drag-drop' | 'timeline')}>
        <TabsContent value="drag-drop" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Drag-and-Drop Timeline</CardTitle>
              <CardDescription>
                Drag activities to reorder them within days or move them to different days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DragDropTimeline
                selectedActivities={selectedActivities}
                tripDates={tripDates}
                onActivityRemove={handleActivityRemove}
                onActivityReorder={handleActivityReorder}
                onActivityDateChange={handleActivityDateChange}
                onAddActivityClick={handleAddActivity}
                maxActivitiesPerDay={4}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Standard Activity Timeline</CardTitle>
              <CardDescription>
                Traditional timeline view for comparison (read-only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityTimeline
                selectedActivities={selectedActivities}
                tripDates={tripDates}
                onActivityRemove={handleActivityRemove}
                onAddActivityClick={handleAddActivity}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Technical Details */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
          <CardDescription>
            Architecture and features of the drag-and-drop system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Core Technologies</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>@dnd-kit/core:</strong> Modern drag-and-drop engine</li>
                <li>• <strong>@dnd-kit/sortable:</strong> List reordering utilities</li>
                <li>• <strong>React state management:</strong> Real-time updates</li>
                <li>• <strong>TypeScript:</strong> Type-safe implementation</li>
                <li>• <strong>Tailwind CSS:</strong> Responsive design</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Key Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Touch support:</strong> Works on mobile devices</li>
                <li>• <strong>Keyboard navigation:</strong> Accessibility compliant</li>
                <li>• <strong>Visual feedback:</strong> Clear drag states</li>
                <li>• <strong>Conflict detection:</strong> Smart validation</li>
                <li>• <strong>Auto time slots:</strong> Intelligent scheduling</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 