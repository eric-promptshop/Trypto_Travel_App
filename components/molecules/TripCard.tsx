import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, DollarSign, Star, ArrowRight } from 'lucide-react';

interface TripCardProps {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  duration?: string;
  budget?: string;
  rating?: number;
  travelers?: number;
  status?: string;
  onSelect: (id: string) => void;
  className?: string;
  color?: string;
}

export const TripCard: React.FC<TripCardProps> = ({
  id,
  name,
  description,
  imageUrl,
  duration,
  budget,
  rating,
  travelers,
  status,
  onSelect,
  className,
  color = 'from-[#1f5582] to-[#2d6ba3]',
}) => {
  const statusConfig = {
    planned: { label: 'Planned', variant: 'secondary' as const },
    'in-progress': { label: 'In Progress', variant: 'default' as const },
    completed: { label: 'Completed', variant: 'outline' as const }
  };

  return (
    <div 
      className={`group bg-white rounded-xl shadow-lg overflow-hidden border border-[#e5e7eb] cursor-pointer hover:shadow-xl transition-all duration-300 ${className || ''}`}
      onClick={() => onSelect(id)}
    >
      {imageUrl ? (
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {status && (
            <div className="absolute top-4 right-4">
              <Badge variant={statusConfig[status as keyof typeof statusConfig]?.variant}>
                {statusConfig[status as keyof typeof statusConfig]?.label || status}
              </Badge>
            </div>
          )}
          
          {rating && (
            <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
              <Star className="h-4 w-4 fill-current text-[#ff6b35]" />
              <span className="text-sm font-semibold text-[#1f5582]">{rating}</span>
            </div>
          )}
        </div>
      ) : (
        <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${color}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="h-24 w-24 text-white/20" />
          </div>
          
          {status && (
            <div className="absolute top-4 right-4">
              <Badge 
                variant={statusConfig[status as keyof typeof statusConfig]?.variant}
                className="bg-white/90 text-[#1f5582] border-0"
              >
                {statusConfig[status as keyof typeof statusConfig]?.label || status}
              </Badge>
            </div>
          )}
          
          {rating && (
            <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
              <Star className="h-4 w-4 fill-current text-[#ff6b35]" />
              <span className="text-sm font-semibold text-[#1f5582]">{rating}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="p-5">
        <h3 className="text-xl font-bold text-[#1f5582] mb-2 line-clamp-1">{name}</h3>
        
        {description && (
          <p className="text-[#6b7280] text-sm mb-4 line-clamp-2">{description}</p>
        )}
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          {duration && (
            <div className="flex items-center gap-2 text-sm text-[#6b7280]">
              <Calendar className="h-4 w-4" />
              <span>{duration}</span>
            </div>
          )}
          
          {travelers && (
            <div className="flex items-center gap-2 text-sm text-[#6b7280]">
              <Users className="h-4 w-4" />
              <span>{travelers} travelers</span>
            </div>
          )}
          
          {budget && (
            <div className="flex items-center gap-2 text-sm text-[#6b7280]">
              <DollarSign className="h-4 w-4" />
              <span>{budget}</span>
            </div>
          )}
        </div>
        
        <Button 
          className="w-full group/button bg-[#ff6b35] hover:bg-[#ff5525] text-white border-0"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(id);
          }}
        >
          View Details
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover/button:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}; 