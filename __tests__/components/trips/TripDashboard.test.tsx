import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { TripDashboard } from '@/components/trips/TripDashboard'

// Mock the useTrips hook
jest.mock('@/hooks/use-trips', () => ({
  useTrips: () => ({
    trips: [
      {
        id: 'trip-1',
        name: 'Peru Adventure',
        destination: 'Peru',
        startDate: '2024-03-15',
        endDate: '2024-03-22',
        status: 'confirmed',
        travelers: 2,
        budget: 2500,
        createdAt: '2024-01-01'
      },
      {
        id: 'trip-2',
        name: 'Japan Journey',
        destination: 'Japan',
        startDate: '2024-05-10',
        endDate: '2024-05-20',
        status: 'draft',
        travelers: 4,
        budget: 5000,
        createdAt: '2024-01-15'
      }
    ],
    loading: false,
    error: null,
    createTrip: jest.fn(),
    updateTrip: jest.fn(),
    deleteTrip: jest.fn()
  })
}))

describe('TripDashboard', () => {
  it('renders trip dashboard', () => {
    render(<TripDashboard />)
    
    expect(screen.getByText('Your Trips')).toBeInTheDocument()
    expect(screen.getByText('Manage and organize all your travel plans')).toBeInTheDocument()
  })

  it('displays trip cards', () => {
    render(<TripDashboard />)
    
    expect(screen.getByText('Peru Adventure')).toBeInTheDocument()
    expect(screen.getByText('Japan Journey')).toBeInTheDocument()
  })

  it('shows trip status badges', () => {
    render(<TripDashboard />)
    
    expect(screen.getByText('confirmed')).toBeInTheDocument()
    expect(screen.getByText('draft')).toBeInTheDocument()
  })

  it('displays trip dates', () => {
    render(<TripDashboard />)
    
    expect(screen.getByText(/Mar 15 - Mar 22, 2024/)).toBeInTheDocument()
    expect(screen.getByText(/May 10 - May 20, 2024/)).toBeInTheDocument()
  })

  it('shows traveler counts', () => {
    render(<TripDashboard />)
    
    expect(screen.getByText('2 travelers')).toBeInTheDocument()
    expect(screen.getByText('4 travelers')).toBeInTheDocument()
  })

  it('displays budget information', () => {
    render(<TripDashboard />)
    
    expect(screen.getByText('$2,500')).toBeInTheDocument()
    expect(screen.getByText('$5,000')).toBeInTheDocument()
  })

  it('has search functionality', () => {
    render(<TripDashboard />)
    
    const searchInput = screen.getByPlaceholderText(/search trips/i)
    expect(searchInput).toBeInTheDocument()
    
    fireEvent.change(searchInput, { target: { value: 'Peru' } })
    
    expect(screen.getByText('Peru Adventure')).toBeInTheDocument()
    expect(screen.queryByText('Japan Journey')).not.toBeInTheDocument()
  })

  it('has filter options', () => {
    render(<TripDashboard />)
    
    expect(screen.getByText('All Trips')).toBeInTheDocument()
    expect(screen.getByText('Upcoming')).toBeInTheDocument()
    expect(screen.getByText('Past')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('shows create new trip button', () => {
    render(<TripDashboard />)
    
    expect(screen.getByText('Create New Trip')).toBeInTheDocument()
  })

  it('displays sort options', () => {
    render(<TripDashboard />)
    
    const sortButton = screen.getByText(/sort/i)
    fireEvent.click(sortButton)
    
    expect(screen.getByText('Date (Newest)')).toBeInTheDocument()
    expect(screen.getByText('Date (Oldest)')).toBeInTheDocument()
    expect(screen.getByText('Name (A-Z)')).toBeInTheDocument()
    expect(screen.getByText('Budget (High-Low)')).toBeInTheDocument()
  })

  it('shows trip actions menu', () => {
    render(<TripDashboard />)
    
    const moreButtons = screen.getAllByLabelText(/more options/i)
    fireEvent.click(moreButtons[0])
    
    expect(screen.getByText('View Details')).toBeInTheDocument()
    expect(screen.getByText('Edit Trip')).toBeInTheDocument()
    expect(screen.getByText('Share')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('displays empty state when no trips', () => {
    // Mock empty trips
    jest.doMock('@/hooks/use-trips', () => ({
      useTrips: () => ({
        trips: [],
        loading: false,
        error: null
      })
    }))

    render(<TripDashboard />)
    
    expect(screen.getByText(/no trips yet/i)).toBeInTheDocument()
    expect(screen.getByText(/create your first trip/i)).toBeInTheDocument()
  })

  it('handles loading state', () => {
    // Mock loading state
    jest.doMock('@/hooks/use-trips', () => ({
      useTrips: () => ({
        trips: [],
        loading: true,
        error: null
      })
    }))

    render(<TripDashboard />)
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})