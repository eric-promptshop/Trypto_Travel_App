import React from 'react';
import { Button } from '../atoms';

interface TripCardProps {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  onSelect: (id: string) => void;
}

export const TripCard: React.FC<TripCardProps> = ({
  id,
  name,
  description,
  imageUrl,
  onSelect,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-40 object-cover rounded-md mb-3"
        />
      )}
      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <Button onClick={() => onSelect(id)}>Select Trip</Button>
    </div>
  );
}; 