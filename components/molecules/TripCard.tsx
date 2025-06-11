import React from 'react';
import { Button } from '@/components/ui/button';

interface TripCardProps {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const TripCard: React.FC<TripCardProps> = ({
  id,
  name,
  description,
  imageUrl,
  onSelect,
  className,
}) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-200 hover:scale-105 ${className || ''}`}
      onClick={() => onSelect(id)}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-32 object-cover rounded-md mb-3"
        />
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{name}</h3>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
      )}
      <Button onClick={() => onSelect(id)}>Select Trip</Button>
    </div>
  );
}; 