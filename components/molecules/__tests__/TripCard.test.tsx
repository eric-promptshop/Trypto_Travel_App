import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TripCard } from '../TripCard';

describe('TripCard', () => {
  const mockProps = {
    id: '1',
    name: 'Test Trip',
    description: 'This is a test trip description',
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trip information', () => {
    render(<TripCard {...mockProps} />);
    
    expect(screen.getByText('Test Trip')).toBeInTheDocument();
    expect(screen.getByText('This is a test trip description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select Trip' })).toBeInTheDocument();
  });

  it('calls onSelect when button is clicked', () => {
    render(<TripCard {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Select Trip' }));
    expect(mockProps.onSelect).toHaveBeenCalledWith('1');
  });

  it('renders image when imageUrl is provided', () => {
    const propsWithImage = { ...mockProps, imageUrl: 'test-image.jpg' };
    render(<TripCard {...propsWithImage} />);
    
    const image = screen.getByAltText('Test Trip');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'test-image.jpg');
  });

  it('does not render image when imageUrl is not provided', () => {
    render(<TripCard {...mockProps} />);
    
    expect(screen.queryByAltText('Test Trip')).not.toBeInTheDocument();
  });
}); 