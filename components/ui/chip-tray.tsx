import React from 'react'
import { cn } from '@/lib/utils'
import { Chip } from './chip'

interface ChipTrayProps {
  chips: Array<{ text: string; icon?: React.ReactNode }>
  onChipClick: (text: string) => void
  isLoading?: boolean
  className?: string
  isKeyboardVisible?: boolean
}

export function ChipTray({ 
  chips, 
  onChipClick, 
  isLoading = false,
  className,
  isKeyboardVisible = false
}: ChipTrayProps) {
  return (
    <div 
      className={cn(
        "sticky bottom-0 z-10",
        "bg-white dark:bg-gray-900",
        "border-t border-[#e2e8f0] dark:border-gray-700",
        "transition-transform duration-200 ease-out",
        isKeyboardVisible && "translate-y-[-48px]",
        className
      )}
    >
      {/* Helper text for empty state */}
      <div className="text-center pt-3 pb-2 animate-fadeIn">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 Tip: tap a quick shortcut below to get ideas
        </p>
      </div>
      
      {/* Chips container */}
      <div className="px-4 pb-4">
        {/* Mobile: horizontal scroll */}
        <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div 
            className="flex gap-2 pb-1"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {chips.map((chip, idx) => (
              <Chip
                key={idx}
                onClick={() => onChipClick(chip.text)}
                icon={chip.icon}
                className="flex-shrink-0"
                style={{ scrollSnapAlign: 'start' }}
                aria-label={`Ask about ${chip.text}`}
                disabled={isLoading}
              >
                {chip.text}
              </Chip>
            ))}
          </div>
        </div>
        
        {/* Desktop: wrapped flex */}
        <div className="hidden md:block">
          <div className="flex flex-wrap gap-2 justify-center max-w-[640px] mx-auto">
            {chips.map((chip, idx) => (
              <Chip
                key={idx}
                onClick={() => onChipClick(chip.text)}
                icon={chip.icon}
                aria-label={`Ask about ${chip.text}`}
                disabled={isLoading}
              >
                {chip.text}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}