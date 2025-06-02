import React from 'react';

interface ThumbZoneWrapperProps {
  children: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
  className?: string;
}

export const ThumbZoneWrapper: React.FC<ThumbZoneWrapperProps> = ({ 
  children, 
  priority,
  className = '' 
}) => {
  // Get positioning class based on priority
  const getPositioningClass = () => {
    switch (priority) {
      case 'high':
        return 'thumb-zone-high thumb-zone-high-right';
      case 'medium':
        return 'thumb-zone-medium thumb-zone-medium-right';
      case 'low':
        return 'thumb-zone-low';
      default:
        return '';
    }
  };
  
  return (
    <div className={`thumb-zone-wrapper ${getPositioningClass()} ${className}`}>
      {children}
    </div>
  );
}; 