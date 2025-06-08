import React from 'react'
import { render, screen } from '@testing-library/react'
import { ConnectedItineraryViewer } from '@/components/itinerary/ConnectedItineraryViewer'
import { TripProvider } from '@/lib/state/trip-customization-context'

// Mock the hooks
jest.mock('@/hooks/use-trips', () => ({
  useTrips: () => ({
    trips: [
      {
        id: 'trip-1',
        name: 'Peru Adventure',
        destination: 'Peru',
        startDate: '2024-03-15',
        endDate: '2024-03-22',
        travelers: 2,
        budget: 2500,
        status: 'confirmed'
      }
    ],
    loading: false,
    error: null
  })
}))

jest.mock('@/hooks/use-itinerary', () => ({
  useItinerary: () => ({
    itinerary: {
      id: 'itinerary-1',
      tripId: 'trip-1',
      days: [
        {
          date: '2024-03-15',
          title: 'Arrival in Lima',
          activities: [
            {
              id: 'activity-1',
              time: '10:00',
              title: 'Airport Pickup',
              description: 'Private transfer',
              type: 'transport',
              cost: 30
            }
          ],
          totalCost: 150
        }
      ],
      totalCost: 1800
    },
    loading: false,
    error: null,
    updateActivity: jest.fn(),
    deleteActivity: jest.fn(),
    reorderActivities: jest.fn()
  })
}))

describe('ConnectedItineraryViewer', () => {
  it('renders connected itinerary viewer', () => {
    render(
      <TripProvider>
        <ConnectedItineraryViewer />
      </TripProvider>
    )
    
    expect(screen.getByText('Peru Adventure')).toBeInTheDocument()
  })

  it('displays trip dates', () => {
    render(
      <TripProvider>
        <ConnectedItineraryViewer />
      </TripProvider>
    )
    
    expect(screen.getByText(/March 15, 2024/)).toBeInTheDocument()
    expect(screen.getByText(/March 22, 2024/)).toBeInTheDocument()
  })

  it('shows traveler count', () => {
    render(
      <TripProvider>
        <ConnectedItineraryViewer />
      </TripProvider>
    )
    
    expect(screen.getByText(/2 travelers/)).toBeInTheDocument()
  })

  it('displays budget progress', () => {
    render(
      <TripProvider>
        <ConnectedItineraryViewer />
      </TripProvider>
    )
    
    expect(screen.getByText('Budget Progress')).toBeInTheDocument()
    expect(screen.getByText(/\$1,800 \/ \$2,500/)).toBeInTheDocument()
  })

  it('shows daily activities', () => {
    render(
      <TripProvider>
        <ConnectedItineraryViewer />
      </TripProvider>
    )
    
    expect(screen.getByText('Day 1: Arrival in Lima')).toBeInTheDocument()
    expect(screen.getByText('Airport Pickup')).toBeInTheDocument()
    expect(screen.getByText('Private transfer')).toBeInTheDocument()
  })

  it('displays activity cost', () => {
    render(
      <TripProvider>
        <ConnectedItineraryViewer />
      </TripProvider>
    )
    
    expect(screen.getByText('$30')).toBeInTheDocument()
  })

  it('shows action buttons', () => {
    render(
      <TripProvider>
        <ConnectedItineraryViewer />
      </TripProvider>
    )
    
    expect(screen.getByText('Share')).toBeInTheDocument()
    expect(screen.getByText('Download PDF')).toBeInTheDocument()
    expect(screen.getByText('Edit Trip')).toBeInTheDocument()
  })

  it('handles loading state', () => {
    // Mock loading state
    jest.doMock('@/hooks/use-itinerary', () => ({
      useItinerary: () => ({
        itinerary: null,
        loading: true,
        error: null
      })
    }))

    render(
      <TripProvider>
        <ConnectedItineraryViewer />
      </TripProvider>
    )
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('handles error state', () => {
    // Mock error state
    jest.doMock('@/hooks/use-itinerary', () => ({
      useItinerary: () => ({
        itinerary: null,
        loading: false,
        error: 'Failed to load itinerary'
      })
    }))

    render(
      <TripProvider>
        <ConnectedItineraryViewer />
      </TripProvider>
    )
    
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })
})