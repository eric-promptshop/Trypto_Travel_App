'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: 'default' | 'compact';
  className?: string | undefined;
  headerClassName?: string | undefined;
  contentClassName?: string | undefined;
  icon?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = false,
  variant = 'default',
  className,
  headerClassName,
  contentClassName,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleOpen();
    }
  };

  return (
    <div className={cn('border-b border-gray-200 last:border-b-0', className)}>
      <button
        className={cn(
          'flex w-full items-center justify-between py-3 text-left transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-tripnav-blue focus:ring-offset-2',
          variant === 'compact' ? 'py-2' : 'py-3',
          headerClassName
        )}
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="text-tripnav-blue flex-shrink-0" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className={cn(
            'font-medium text-gray-900',
            variant === 'compact' ? 'text-sm' : 'text-base'
          )}>
            {title}
          </span>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="text-gray-500 flex-shrink-0"
          aria-hidden="true"
        >
          <ChevronDown size={variant === 'compact' ? 16 : 20} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className={cn(
              'pb-3 text-gray-700',
              variant === 'compact' ? 'pb-2 text-sm' : 'pb-3',
              contentClassName
            )}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Specialized collapsible section for hotel amenities
interface AmenitiesSectionProps {
  amenities: string[];
  variant?: 'default' | 'compact';
  className?: string | undefined;
}

export const AmenitiesSection: React.FC<AmenitiesSectionProps> = ({
  amenities,
  variant = 'default',
  className,
}) => {
  if (!amenities || amenities.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      title={`Amenities (${amenities.length})`}
      variant={variant}
      className={className}
      icon={<span className="text-lg">🏨</span>}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {amenities.map((amenity, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span className="w-1.5 h-1.5 bg-tripnav-blue rounded-full flex-shrink-0" />
            <span className="text-gray-700">{amenity}</span>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
};

// Specialized collapsible section for hotel policies
interface PoliciesSectionProps {
  policies: {
    checkIn?: string;
    checkOut?: string;
    cancellation?: string;
    pets?: string;
    children?: string;
    additionalInfo?: string[];
  };
  variant?: 'default' | 'compact';
  className?: string | undefined;
}

export const PoliciesSection: React.FC<PoliciesSectionProps> = ({
  policies,
  variant = 'default',
  className,
}) => {
  const hasPolicies = Object.values(policies).some(value => 
    value && (Array.isArray(value) ? value.length > 0 : true)
  );

  if (!hasPolicies) {
    return null;
  }

  return (
    <CollapsibleSection
      title="Policies & Information"
      variant={variant}
      className={className}
      icon={<span className="text-lg">📋</span>}
    >
      <div className="space-y-3">
        {policies.checkIn && (
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <span className="font-medium text-gray-900 min-w-24">Check-in:</span>
            <span className="text-gray-700">{policies.checkIn}</span>
          </div>
        )}
        {policies.checkOut && (
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <span className="font-medium text-gray-900 min-w-24">Check-out:</span>
            <span className="text-gray-700">{policies.checkOut}</span>
          </div>
        )}
        {policies.cancellation && (
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <span className="font-medium text-gray-900 min-w-24">Cancellation:</span>
            <span className="text-gray-700">{policies.cancellation}</span>
          </div>
        )}
        {policies.pets && (
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <span className="font-medium text-gray-900 min-w-24">Pets:</span>
            <span className="text-gray-700">{policies.pets}</span>
          </div>
        )}
        {policies.children && (
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <span className="font-medium text-gray-900 min-w-24">Children:</span>
            <span className="text-gray-700">{policies.children}</span>
          </div>
        )}
        {policies.additionalInfo && policies.additionalInfo.length > 0 && (
          <div className="mt-4">
            <span className="font-medium text-gray-900 block mb-2">Additional Information:</span>
            <ul className="space-y-1">
              {policies.additionalInfo.map((info, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0 mt-1.5" />
                  <span className="text-gray-700">{info}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}; 