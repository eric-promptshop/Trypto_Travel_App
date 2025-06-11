import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActivityManager } from '@/components/itinerary/ActivityManager'

describe('ActivityManager', () => {
  const mockActivities = [
    {
      id: 'activity-1',
      name: 'Machu Picchu Tour',
      type: 'sightseeing',
      duration: 240,
      price: 150,
      description: 'Visit the ancient Inca citadel'
    },
    {
      id: 'activity-2',
      name: 'Sacred Valley Tour',
      type: 'cultural',
      duration: 360,
      price: 85,
      description: 'Explore traditional markets and ruins'
    }
  ]

  const mockOnUpdate = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnReorder = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders activity manager with activities', () => {
    render(
      <ActivityManager 
        activities={mockActivities}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
      />
    )
    
    expect(screen.getByText('Activity Manager')).toBeInTheDocument()
    expect(screen.getByText('Machu Picchu Tour')).toBeInTheDocument()
    expect(screen.getByText('Sacred Valley Tour')).toBeInTheDocument()
  })

  it('displays activity details correctly', () => {
    render(
      <ActivityManager 
        activities={mockActivities}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
      />
    )
    
    expect(screen.getByText('4 hours')).toBeInTheDocument()
    expect(screen.getByText('$150')).toBeInTheDocument()
    expect(screen.getByText('6 hours')).toBeInTheDocument()
    expect(screen.getByText('$85')).toBeInTheDocument()
  })

  it('shows add activity button', () => {
    render(
      <ActivityManager 
        activities={mockActivities}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
      />
    )
    
    expect(screen.getByText('Add Activity')).toBeInTheDocument()
  })

  it('handles activity deletion', () => {
    render(
      <ActivityManager 
        activities={mockActivities}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
      />
    )
    
    const deleteButtons = screen.getAllByLabelText(/delete/i)
    fireEvent.click(deleteButtons[0])
    
    expect(mockOnDelete).toHaveBeenCalledWith('activity-1')
  })

  it('displays total cost of activities', () => {
    render(
      <ActivityManager 
        activities={mockActivities}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
      />
    )
    
    expect(screen.getByText('Total Cost:')).toBeInTheDocument()
    expect(screen.getByText('$235')).toBeInTheDocument()
  })

  it('shows activity type badges', () => {
    render(
      <ActivityManager 
        activities={mockActivities}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
      />
    )
    
    expect(screen.getByText('sightseeing')).toBeInTheDocument()
    expect(screen.getByText('cultural')).toBeInTheDocument()
  })

  it('renders empty state when no activities', () => {
    render(
      <ActivityManager 
        activities={[]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
      />
    )
    
    expect(screen.getByText(/no activities/i)).toBeInTheDocument()
  })

  it('supports drag and drop functionality', () => {
    render(
      <ActivityManager 
        activities={mockActivities}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onReorder={mockOnReorder}
      />
    )
    
    // Check for drag handles
    const dragHandles = screen.getAllByLabelText(/drag/i)
    expect(dragHandles).toHaveLength(2)
  })
})