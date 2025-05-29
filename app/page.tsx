"use client"

import { ItineraryBuilder } from "@/components/itinerary-builder"
import { Button } from "@/components/atoms"
import { TripCard } from "@/components/molecules/TripCard"
import { useTripContext } from "@/contexts/TripContext"

function TestComponents() {
  const { trips, addTrip } = useTripContext()

  const handleSelectTrip = (id: string) => {
    console.log('Selected trip:', id)
  }

  const handleAddTrip = () => {
    const newTrip = {
      id: `trip-${Date.now()}`,
      name: `Sample Trip ${trips.length + 1}`
    }
    addTrip(newTrip)
  }

  return (
    <div className="p-6 bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Atomic Design Components Test</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Button Atom Variants:</h3>
        <div className="flex gap-4">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button onClick={handleAddTrip}>Add Trip (Context Test)</Button>
        </div>
        <p className="mt-2 text-sm text-gray-600">Trips in context: {trips.length}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">TripCard Molecule:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
          <TripCard
            id="1"
            name="Peru Adventure"
            description="Explore the ancient wonders of Machu Picchu and the Sacred Valley"
            imageUrl="/images/machu-picchu.png"
            onSelect={handleSelectTrip}
          />
          <TripCard
            id="2"
            name="Brazil Explorer"
            description="Discover the vibrant culture and natural beauty of Brazil"
            onSelect={handleSelectTrip}
          />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <TestComponents />
      <ItineraryBuilder />
    </main>
  )
}
