import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ItineraryBuilder } from '@/components/itinerary-builder'

// Mock the TripContext
const mockTripContext = {
  trip: null,
  updateTrip: jest.fn(),
  isLoading: false,
  error: null
}

jest.mock('@/contexts/TripContext', () => ({
  useTripContext: () => mockTripContext
}))

describe('ItineraryBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the main form', () => {
    render(<ItineraryBuilder />)
    expect(screen.getByRole('form')).toBeInTheDocument()
  })

  it('displays all required form sections', () => {
    render(<ItineraryBuilder />)
    
    // Check for form sections
    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/dates|duration/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/travelers|people/i)).toBeInTheDocument()
  })

  it('shows validation errors for empty form', async () => {
    render(<ItineraryBuilder />)
    
    const submitButton = screen.getByRole('button', { name: /submit|create|generate/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    render(<ItineraryBuilder />)
    
    // Fill out the form
    const destinationInput = screen.getByLabelText(/destination/i)
    fireEvent.change(destinationInput, { target: { value: 'Peru' } })
    
    const submitButton = screen.getByRole('button', { name: /submit|create|generate/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockTripContext.updateTrip).toHaveBeenCalled()
    })
  })

  it('displays loading state', () => {
    mockTripContext.isLoading = true
    render(<ItineraryBuilder />)
    
    expect(screen.getByText(/loading|generating/i)).toBeInTheDocument()
  })

  it('displays error state', () => {
    mockTripContext.error = 'Failed to generate itinerary'
    render(<ItineraryBuilder />)
    
    expect(screen.getByText(/failed|error/i)).toBeInTheDocument()
  })
})