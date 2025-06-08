import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DestinationSelector } from '@/components/travel-forms/destination-selector'
import { DateRangePicker } from '@/components/travel-forms/date-range-picker'
import { TravelerCounter } from '@/components/travel-forms/traveler-counter'
import { BudgetRangeSlider } from '@/components/travel-forms/budget-range-slider'

describe('Travel Form Components', () => {
  describe('DestinationSelector', () => {
    it('renders destination input', () => {
      render(<DestinationSelector value="" onChange={() => {}} />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('calls onChange when destination is entered', async () => {
      const mockOnChange = jest.fn()
      render(<DestinationSelector value="" onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'Peru' } })
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Peru')
      })
    })
  })

  describe('DateRangePicker', () => {
    it('renders date picker', () => {
      render(<DateRangePicker value={undefined} onChange={() => {}} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('handles date selection', () => {
      const mockOnChange = jest.fn()
      render(<DateRangePicker value={undefined} onChange={mockOnChange} />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      // Check if calendar appears
      expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument()
    })
  })

  describe('TravelerCounter', () => {
    it('renders with default value', () => {
      render(<TravelerCounter value={1} onChange={() => {}} />)
      expect(screen.getByDisplayValue('1')).toBeInTheDocument()
    })

    it('increases count when plus button clicked', () => {
      const mockOnChange = jest.fn()
      render(<TravelerCounter value={1} onChange={mockOnChange} />)
      
      const plusButton = screen.getByRole('button', { name: /increase|plus|\+/ })
      fireEvent.click(plusButton)
      
      expect(mockOnChange).toHaveBeenCalledWith(2)
    })

    it('decreases count when minus button clicked', () => {
      const mockOnChange = jest.fn()
      render(<TravelerCounter value={2} onChange={mockOnChange} />)
      
      const minusButton = screen.getByRole('button', { name: /decrease|minus|-/ })
      fireEvent.click(minusButton)
      
      expect(mockOnChange).toHaveBeenCalledWith(1)
    })

    it('does not go below 1 traveler', () => {
      const mockOnChange = jest.fn()
      render(<TravelerCounter value={1} onChange={mockOnChange} />)
      
      const minusButton = screen.getByRole('button', { name: /decrease|minus|-/ })
      fireEvent.click(minusButton)
      
      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('BudgetRangeSlider', () => {
    it('renders slider with default values', () => {
      render(<BudgetRangeSlider value={[1000, 5000]} onChange={() => {}} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('displays budget range values', () => {
      render(<BudgetRangeSlider value={[1000, 5000]} onChange={() => {}} />)
      expect(screen.getByText(/1000|1,000/)).toBeInTheDocument()
      expect(screen.getByText(/5000|5,000/)).toBeInTheDocument()
    })
  })
})