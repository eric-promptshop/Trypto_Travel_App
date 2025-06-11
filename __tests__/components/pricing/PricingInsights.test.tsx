import React from 'react'
import { render, screen } from '@testing-library/react'
import { PricingInsights } from '@/components/pricing/PricingInsights'

describe('PricingInsights', () => {
  const mockTripData = {
    id: 'test-trip-1',
    name: 'Test Trip to Peru',
    days: 7,
    travelers: 2,
    activities: 10,
    accommodations: 6,
    totalBudget: 5000
  }

  it('renders pricing insights component', () => {
    render(<PricingInsights tripData={mockTripData} />)
    
    expect(screen.getByText('Pricing Insights')).toBeInTheDocument()
    expect(screen.getByText('Smart pricing recommendations based on market analysis')).toBeInTheDocument()
  })

  it('displays total trip cost', () => {
    render(<PricingInsights tripData={mockTripData} />)
    
    expect(screen.getByText('Total Trip Cost')).toBeInTheDocument()
    expect(screen.getByText(/\$\d+/)).toBeInTheDocument()
  })

  it('shows budget utilization', () => {
    render(<PricingInsights tripData={mockTripData} />)
    
    expect(screen.getByText('Budget Utilization')).toBeInTheDocument()
    expect(screen.getByText(/%$/)).toBeInTheDocument()
  })

  it('displays savings opportunities', () => {
    render(<PricingInsights tripData={mockTripData} />)
    
    expect(screen.getByText('Potential Savings')).toBeInTheDocument()
    expect(screen.getByText(/Up to \$\d+/)).toBeInTheDocument()
  })

  it('shows best booking time recommendation', () => {
    render(<PricingInsights tripData={mockTripData} />)
    
    expect(screen.getByText('Best Time to Book')).toBeInTheDocument()
    expect(screen.getByText(/\d+-\d+ days/)).toBeInTheDocument()
  })

  it('displays cost breakdown', () => {
    render(<PricingInsights tripData={mockTripData} />)
    
    expect(screen.getByText('Cost Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Accommodation')).toBeInTheDocument()
    expect(screen.getByText('Activities')).toBeInTheDocument()
    expect(screen.getByText('Transportation')).toBeInTheDocument()
    expect(screen.getByText('Dining')).toBeInTheDocument()
  })

  it('shows price optimization suggestions', () => {
    render(<PricingInsights tripData={mockTripData} />)
    
    expect(screen.getByText('Price Optimization')).toBeInTheDocument()
    // Should have at least one optimization tip
    expect(screen.getAllByText(/Book|Save|Consider|Try/).length).toBeGreaterThan(0)
  })

  it('displays market trends', () => {
    render(<PricingInsights tripData={mockTripData} />)
    
    expect(screen.getByText('Market Trends')).toBeInTheDocument()
    expect(screen.getByText(/trending/i)).toBeInTheDocument()
  })

  it('shows seasonal factors', () => {
    render(<PricingInsights tripData={mockTripData} />)
    
    expect(screen.getByText('Seasonal Factors')).toBeInTheDocument()
    expect(screen.getByText(/High Season|Low Season|Shoulder Season/)).toBeInTheDocument()
  })
})