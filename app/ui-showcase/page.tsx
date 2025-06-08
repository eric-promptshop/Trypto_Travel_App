'use client'

import { useState } from 'react'
import { TripNavButton, Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardImage } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, MapPin, Plane, Clock, CreditCard, Users, Star } from 'lucide-react'

export default function UIShowcase() {
  const [searchValue, setSearchValue] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="container mx-auto px-6 space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-[#1B365D]">TripNav UI Showcase</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Explore our professional-grade UI components designed specifically for travel planning applications
          </p>
        </div>

        {/* Buttons Section */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-[#1B365D] border-b-2 border-[#FF7B00] pb-2 inline-block">
            Professional Buttons
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card variant="elevated" className="p-6">
              <h3 className="font-medium mb-4 text-[#1B365D]">Primary Actions</h3>
              <div className="space-y-3">
                <TripNavButton className="w-full">Book Your Trip</TripNavButton>
                <TripNavButton variant="accent" className="w-full">Explore Destinations</TripNavButton>
                <TripNavButton variant="secondary" className="w-full">View Details</TripNavButton>
              </div>
            </Card>

            <Card variant="elevated" className="p-6">
              <h3 className="font-medium mb-4 text-[#1B365D]">Secondary Actions</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full">Learn More</Button>
                <Button variant="ghost" className="w-full">Cancel</Button>
                <Button variant="link" className="w-full">Terms & Conditions</Button>
              </div>
            </Card>

            <Card variant="elevated" className="p-6">
              <h3 className="font-medium mb-4 text-[#1B365D]">Button Sizes</h3>
              <div className="space-y-3">
                <TripNavButton size="sm" className="w-full">Small Button</TripNavButton>
                <TripNavButton className="w-full">Default Size</TripNavButton>
                <TripNavButton size="lg" className="w-full">Large Button</TripNavButton>
              </div>
            </Card>
          </div>
        </section>

        {/* Cards Section */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-[#1B365D] border-b-2 border-[#FF7B00] pb-2 inline-block">
            Travel Cards
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Trip Card */}
            <Card variant="trip" className="overflow-hidden">
              <CardImage 
                src="https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=400&h=200&fit=crop" 
                alt="Paris" 
                overlay 
              />
              <CardHeader>
                <CardTitle>Weekend in Paris</CardTitle>
                <CardDescription>Experience the city of lights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <Calendar className="mr-2 h-4 w-4 text-[#FF7B00]" />
                  <span>May 15-18, 2024</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4 text-[#FF7B00]" />
                  <span>Paris, France</span>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <div className="text-lg font-semibold text-[#1B365D]">From $1,299</div>
                <Badge variant="business" showIcon>4 days</Badge>
              </CardFooter>
            </Card>

            {/* Destination Card */}
            <Card variant="destination">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Tokyo</CardTitle>
                    <CardDescription>Japan's vibrant capital</CardDescription>
                  </div>
                  <Badge variant="premium" showIcon>Premium</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Discover ancient temples, modern skyscrapers, and incredible cuisine in one of the world's most exciting cities.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="city" showIcon size="small">Urban</Badge>
                  <Badge variant="luxury" showIcon size="small">Fine Dining</Badge>
                  <Badge size="small">Culture</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Booking Card */}
            <Card variant="booking">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Flight to Barcelona</CardTitle>
                  <Plane className="h-5 w-5 text-[#FF7B00]" />
                </div>
                <CardDescription>Economy Class • Round Trip</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm">
                    <div className="font-medium">NYC</div>
                    <div className="text-muted-foreground">9:30 AM</div>
                  </div>
                  <div className="flex-1 mx-4 border-t border-dashed border-[#1B365D]/30 relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#1B365D]" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#1B365D]" />
                  </div>
                  <div className="text-sm text-right">
                    <div className="font-medium">BCN</div>
                    <div className="text-muted-foreground">11:45 PM</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <div className="text-lg font-semibold text-[#1B365D]">$849</div>
                <Badge variant="confirmed" showIcon>Confirmed</Badge>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Inputs Section */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-[#1B365D] border-b-2 border-[#FF7B00] pb-2 inline-block">
            Travel Inputs
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-medium mb-4 text-[#1B365D]">Search & Selection</h3>
              <div className="space-y-4">
                <Input 
                  variant="search" 
                  label="Search Destinations" 
                  placeholder="Where would you like to go?" 
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onClear={() => setSearchValue('')}
                />
                
                <Input 
                  variant="destination" 
                  label="Primary Destination" 
                  placeholder="Enter your main destination" 
                />
                
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paris">Paris, France</SelectItem>
                    <SelectItem value="tokyo">Tokyo, Japan</SelectItem>
                    <SelectItem value="nyc">New York City, USA</SelectItem>
                    <SelectItem value="barcelona">Barcelona, Spain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-medium mb-4 text-[#1B365D]">Trip Details</h3>
              <div className="space-y-4">
                <Input 
                  variant="date" 
                  label="Departure Date" 
                  type="date" 
                />
                
                <Input 
                  variant="email" 
                  label="Contact Email" 
                  placeholder="your@email.com" 
                />
                
                <Input 
                  label="Confirmation Number" 
                  placeholder="Enter confirmation" 
                  success="Booking confirmed!"
                  defaultValue="TN-123456"
                />
              </div>
            </Card>
          </div>
        </section>

        {/* Badges Section */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-[#1B365D] border-b-2 border-[#FF7B00] pb-2 inline-block">
            Status & Category Badges
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-4">
              <h3 className="font-medium mb-3 text-[#1B365D]">Booking Status</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="confirmed" showIcon>Confirmed</Badge>
                <Badge variant="pending" showIcon>Pending</Badge>
                <Badge variant="cancelled" showIcon>Cancelled</Badge>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-3 text-[#1B365D]">Trip Types</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="business" showIcon>Business</Badge>
                <Badge variant="leisure" showIcon>Leisure</Badge>
                <Badge variant="adventure" showIcon>Adventure</Badge>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-3 text-[#1B365D]">Price Categories</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="budget" showIcon>Budget</Badge>
                <Badge variant="premium" showIcon>Premium</Badge>
                <Badge variant="luxury" showIcon>Luxury</Badge>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-3 text-[#1B365D]">Destinations</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="beach" showIcon>Beach</Badge>
                <Badge variant="mountain" showIcon>Mountain</Badge>
                <Badge variant="city" showIcon>City</Badge>
              </div>
            </Card>
          </div>
        </section>

        {/* Alerts Section */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-[#1B365D] border-b-2 border-[#FF7B00] pb-2 inline-block">
            Travel Alerts & Notifications
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Alert variant="booking" dismissible>
                <AlertTitle>Booking Confirmed</AlertTitle>
                <AlertDescription>
                  Your flight to Barcelona has been confirmed. Check-in opens 24 hours before departure.
                </AlertDescription>
              </Alert>
              
              <Alert variant="delay" appearance="outline" dismissible>
                <AlertTitle>Flight Delay</AlertTitle>
                <AlertDescription>
                  Your flight BA2490 has been delayed by 45 minutes. New departure time: 14:45.
                </AlertDescription>
              </Alert>
              
              <Alert variant="weather" appearance="light">
                <AlertTitle>Weather Warning</AlertTitle>
                <AlertDescription>
                  Heavy rainfall expected in Bangkok during your stay. Pack accordingly.
                </AlertDescription>
              </Alert>
            </div>

            <div className="space-y-4">
              <Alert variant="visa" appearance="outline">
                <AlertTitle>Visa Requirement</AlertTitle>
                <AlertDescription>
                  Your trip to Thailand requires a visa. Apply at least 3 weeks before departure.
                </AlertDescription>
              </Alert>
              
              <Alert variant="currency" appearance="light">
                <AlertTitle>Currency Alert</AlertTitle>
                <AlertDescription>
                  The exchange rate for Japanese Yen has improved by 5% since you booked.
                </AlertDescription>
              </Alert>
              
              <Alert variant="destination" dismissible>
                <AlertTitle>Destination Update</AlertTitle>
                <AlertDescription>
                  The Sagrada Familia has changed its visiting hours during your stay.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-12 border-t border-slate-200">
          <p className="text-slate-600">
            All components are built with TripNav brand colors and optimized for travel planning workflows.
          </p>
        </div>

      </div>
    </div>
  )
} 