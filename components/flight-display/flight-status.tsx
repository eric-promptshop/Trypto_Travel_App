'use client';

import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  Plane, 
  PlaneTakeoff, 
  PlaneLanding,
  Loader,
  MapPin,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type FlightStatus = 
  | 'scheduled'
  | 'on-time'
  | 'delayed'
  | 'boarding'
  | 'departed'
  | 'in-flight'
  | 'arrived'
  | 'cancelled'
  | 'diverted'
  | 'unknown';

export interface FlightStatusProps {
  status: FlightStatus;
  delay?: string; // e.g., "30 min"
  gate?: string;
  variant?: 'default' | 'compact';
  className?: string | undefined;
  showIcon?: boolean;
  showText?: boolean;
}

const FLIGHT_STATUS_CONFIG = {
  scheduled: {
    label: 'Scheduled',
    icon: Calendar,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    iconColor: 'text-gray-600',
  },
  'on-time': {
    label: 'On Time',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
    iconColor: 'text-green-600',
  },
  delayed: {
    label: 'Delayed',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    iconColor: 'text-yellow-600',
  },
  boarding: {
    label: 'Boarding',
    icon: PlaneTakeoff,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    iconColor: 'text-blue-600',
  },
  departed: {
    label: 'Departed',
    icon: PlaneTakeoff,
    color: 'bg-tripnav-blue/10 text-tripnav-blue border-tripnav-blue/20',
    iconColor: 'text-tripnav-blue',
  },
  'in-flight': {
    label: 'In Flight',
    icon: Plane,
    color: 'bg-tripnav-blue/10 text-tripnav-blue border-tripnav-blue/20',
    iconColor: 'text-tripnav-blue',
  },
  arrived: {
    label: 'Arrived',
    icon: PlaneLanding,
    color: 'bg-green-100 text-green-800 border-green-200',
    iconColor: 'text-green-600',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    iconColor: 'text-red-600',
  },
  diverted: {
    label: 'Diverted',
    icon: AlertTriangle,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    iconColor: 'text-orange-600',
  },
  unknown: {
    label: 'Unknown',
    icon: Loader,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    iconColor: 'text-gray-600',
  },
} as const;

export const FlightStatus: React.FC<FlightStatusProps> = ({
  status,
  delay,
  gate,
  variant = 'default',
  className,
  showIcon = true,
  showText = true,
}) => {
  const isCompact = variant === 'compact';
  const config = FLIGHT_STATUS_CONFIG[status];
  const IconComponent = config.icon;

  const getDisplayText = (): string => {
    let text: string = config.label;
    
    if (status === 'delayed' && delay) {
      text = `Delayed ${delay}`;
    }
    
    if (gate && (status === 'boarding' || status === 'on-time' || status === 'delayed')) {
      text += ` • Gate ${gate}`;
    }
    
    return text;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && (
        <IconComponent 
          className={cn(
            config.iconColor,
            isCompact ? 'w-4 h-4' : 'w-5 h-5'
          )}
        />
      )}
      
      {showText && (
        <Badge 
          variant="outline"
          className={cn(
            'font-medium',
            config.color,
            isCompact ? 'text-xs px-2 py-0.5' : 'text-sm px-2 py-1'
          )}
        >
          {getDisplayText()}
        </Badge>
      )}
    </div>
  );
};

// Simplified status indicator for compact displays
interface StatusIndicatorProps {
  status: FlightStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string | undefined;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  className,
}) => {
  const config = FLIGHT_STATUS_CONFIG[status];
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <IconComponent 
        className={cn(
          config.iconColor,
          sizeClasses[size]
        )}
      />
    </div>
  );
};

// Flight progress component showing journey status
interface FlightProgressProps {
  status: FlightStatus;
  departureTime: string;
  arrivalTime: string;
  estimatedArrival?: string;
  className?: string | undefined;
}

export const FlightProgress: React.FC<FlightProgressProps> = ({
  status,
  departureTime,
  arrivalTime,
  estimatedArrival,
  className,
}) => {
  const getProgressPercentage = () => {
    switch (status) {
      case 'scheduled':
      case 'delayed':
        return 0;
      case 'boarding':
        return 5;
      case 'departed':
        return 10;
      case 'in-flight':
        return 50;
      case 'arrived':
        return 100;
      case 'cancelled':
      case 'diverted':
        return 0;
      default:
        return 0;
    }
  };

  const progress = getProgressPercentage();
  const config = FLIGHT_STATUS_CONFIG[status];

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full transition-all duration-500',
              status === 'cancelled' || status === 'diverted' 
                ? 'bg-red-400' 
                : 'bg-gradient-to-r from-tripnav-blue to-tripnav-orange'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Status icon on progress bar */}
        {progress > 0 && progress < 100 && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${Math.max(progress, 10)}%` }}
          >
            <div className="w-6 h-6 bg-white rounded-full border-2 border-tripnav-blue flex items-center justify-center">
              <StatusIndicator status={status} size="sm" />
            </div>
          </div>
        )}
      </div>

      {/* Time Labels */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1">
          <PlaneTakeoff size={14} className="text-tripnav-blue" />
          <span className="text-gray-600">{departureTime}</span>
        </div>
        
        <FlightStatus 
          status={status} 
          variant="compact" 
          showIcon={false}
        />
        
        <div className="flex items-center gap-1">
          <PlaneLanding size={14} className="text-tripnav-orange" />
          <span className="text-gray-600">
            {estimatedArrival || arrivalTime}
          </span>
        </div>
      </div>
      
      {estimatedArrival && estimatedArrival !== arrivalTime && (
        <div className="text-xs text-gray-500 text-center">
          Originally scheduled: {arrivalTime}
        </div>
      )}
    </div>
  );
};

// Utility function to determine status from flight data
export const determineFlightStatus = (
  scheduledDeparture: Date,
  actualDeparture?: Date,
  scheduledArrival?: Date,
  actualArrival?: Date,
  isCancelled?: boolean
): FlightStatus => {
  const now = new Date();
  
  if (isCancelled) return 'cancelled';
  
  if (actualArrival) return 'arrived';
  
  if (actualDeparture) {
    return scheduledArrival && now >= scheduledArrival ? 'in-flight' : 'in-flight';
  }
  
  const departureTime = scheduledDeparture.getTime();
  const nowTime = now.getTime();
  const timeDiff = departureTime - nowTime;
  
  // Within 30 minutes of departure
  if (timeDiff <= 30 * 60 * 1000 && timeDiff > 0) {
    return 'boarding';
  }
  
  // Past departure time but no actual departure recorded
  if (timeDiff <= 0) {
    return 'delayed';
  }
  
  return 'scheduled';
}; 