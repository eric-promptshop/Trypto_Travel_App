import React from 'react'
import { render, screen } from '@testing-library/react'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

describe('AnalyticsDashboard', () => {
  it('renders the analytics dashboard', () => {
    render(<AnalyticsDashboard />)
    
    // Check for main title
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
    
    // Check for key metrics cards
    expect(screen.getByText('Total Trips')).toBeInTheDocument()
    expect(screen.getByText('Active Users')).toBeInTheDocument()
    expect(screen.getByText('Conversion Rate')).toBeInTheDocument()
    expect(screen.getByText('Avg Trip Value')).toBeInTheDocument()
  })

  it('displays trip volume chart', () => {
    render(<AnalyticsDashboard />)
    
    expect(screen.getByText('Trip Volume')).toBeInTheDocument()
    expect(screen.getByText('Trips Created')).toBeInTheDocument()
    expect(screen.getByText('Trips Booked')).toBeInTheDocument()
  })

  it('shows popular destinations', () => {
    render(<AnalyticsDashboard />)
    
    expect(screen.getByText('Popular Destinations')).toBeInTheDocument()
    // Check for at least one destination
    expect(screen.getByText(/Peru/)).toBeInTheDocument()
  })

  it('displays user engagement metrics', () => {
    render(<AnalyticsDashboard />)
    
    expect(screen.getByText('User Engagement')).toBeInTheDocument()
    expect(screen.getByText('Session Duration')).toBeInTheDocument()
    expect(screen.getByText('Bounce Rate')).toBeInTheDocument()
  })

  it('shows conversion funnel', () => {
    render(<AnalyticsDashboard />)
    
    expect(screen.getByText('Conversion Funnel')).toBeInTheDocument()
    expect(screen.getByText('Landing Page')).toBeInTheDocument()
    expect(screen.getByText('Trip Form')).toBeInTheDocument()
    expect(screen.getByText('Itinerary View')).toBeInTheDocument()
    expect(screen.getByText('Booking')).toBeInTheDocument()
  })

  it('renders revenue insights', () => {
    render(<AnalyticsDashboard />)
    
    expect(screen.getByText('Revenue Insights')).toBeInTheDocument()
    expect(screen.getByText('Revenue by Channel')).toBeInTheDocument()
  })

  it('shows growth metrics', () => {
    render(<AnalyticsDashboard />)
    
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument()
    expect(screen.getByText('Growth Rate')).toBeInTheDocument()
    expect(screen.getByText('New Users')).toBeInTheDocument()
  })
})