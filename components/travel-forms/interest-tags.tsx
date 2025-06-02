"use client"

import * as React from "react"
import { 
  Palmtree, 
  Building2, 
  Palette, 
  UtensilsCrossed, 
  ShoppingBag, 
  TreePine,
  Mountain,
  Camera,
  Music,
  Gamepad2,
  Crown,
  MapPin,
  Users,
  Sparkles,
  Heart,
  Coffee
} from "lucide-react"
import { cn } from "@/lib/utils"

// Interest categories and their respective interests
interface Interest {
  id: string
  name: string
  category: 'activities' | 'culture' | 'food' | 'shopping' | 'nature' | 'entertainment'
  icon: React.ElementType
  description: string
}

const INTERESTS: Interest[] = [
  // Activities
  { id: 'adventure', name: 'Adventure Sports', category: 'activities', icon: Mountain, description: 'Exciting outdoor activities and extreme sports' },
  { id: 'photography', name: 'Photography', category: 'activities', icon: Camera, description: 'Capturing beautiful moments and scenic views' },
  { id: 'wellness', name: 'Wellness & Spa', category: 'activities', icon: Heart, description: 'Relaxation, wellness treatments, and spa experiences' },
  
  // Culture
  { id: 'museums', name: 'Museums & Galleries', category: 'culture', icon: Palette, description: 'Art galleries, museums, and cultural exhibitions' },
  { id: 'history', name: 'Historical Sites', category: 'culture', icon: Crown, description: 'Ancient ruins, castles, and historical landmarks' },
  { id: 'music', name: 'Live Music', category: 'culture', icon: Music, description: 'Concerts, live performances, and music venues' },
  { id: 'architecture', name: 'Architecture', category: 'culture', icon: Building2, description: 'Architectural marvels and urban design' },
  
  // Food
  { id: 'dining', name: 'Fine Dining', category: 'food', icon: UtensilsCrossed, description: 'High-end restaurants and gourmet experiences' },
  { id: 'street-food', name: 'Street Food', category: 'food', icon: Coffee, description: 'Local street vendors and authentic cuisine' },
  
  // Shopping
  { id: 'luxury', name: 'Luxury Shopping', category: 'shopping', icon: ShoppingBag, description: 'High-end boutiques and designer stores' },
  { id: 'markets', name: 'Local Markets', category: 'shopping', icon: MapPin, description: 'Traditional markets and local crafts' },
  
  // Nature
  { id: 'beaches', name: 'Beaches', category: 'nature', icon: Palmtree, description: 'Beautiful coastlines and beach activities' },
  { id: 'hiking', name: 'Hiking & Nature', category: 'nature', icon: TreePine, description: 'Nature trails, hiking, and outdoor exploration' },
  
  // Entertainment
  { id: 'nightlife', name: 'Nightlife', category: 'entertainment', icon: Sparkles, description: 'Bars, clubs, and evening entertainment' },
  { id: 'gaming', name: 'Gaming & Arcades', category: 'entertainment', icon: Gamepad2, description: 'Gaming centers, arcades, and entertainment venues' },
  { id: 'family', name: 'Family Activities', category: 'entertainment', icon: Users, description: 'Family-friendly attractions and activities' }
]

type CategoryKey = 'activities' | 'culture' | 'food' | 'shopping' | 'nature' | 'entertainment'

const categoryColors: Record<CategoryKey, string> = {
  activities: 'hover:border-blue-200 hover:bg-blue-50 focus:ring-blue-500',
  culture: 'hover:border-purple-200 hover:bg-purple-50 focus:ring-purple-500',
  food: 'hover:border-orange-200 hover:bg-orange-50 focus:ring-orange-500',
  shopping: 'hover:border-pink-200 hover:bg-pink-50 focus:ring-pink-500',
  nature: 'hover:border-green-200 hover:bg-green-50 focus:ring-green-500',
  entertainment: 'hover:border-yellow-200 hover:bg-yellow-50 focus:ring-yellow-500'
}

const categoryLabels: Record<CategoryKey, string> = {
  activities: 'Activities & Sports',
  culture: 'Culture & Arts',
  food: 'Food & Dining',
  shopping: 'Shopping',
  nature: 'Nature & Outdoors',
  entertainment: 'Entertainment'
}

interface InterestTagsProps {
  selectedInterests: string[]
  onInterestToggle: (interestId: string) => void
  maxSelections?: number
  disabled?: boolean
  className?: string
  showCategoryLabels?: boolean
}

export const InterestTags: React.FC<InterestTagsProps> = ({
  selectedInterests,
  onInterestToggle,
  maxSelections = 5,
  disabled = false,
  className,
  showCategoryLabels = true
}) => {
  // Group interests by category
  const interestsByCategory = INTERESTS.reduce((acc, interest) => {
    if (!acc[interest.category]) {
      acc[interest.category] = []
    }
    acc[interest.category].push(interest)
    return acc
  }, {} as Record<CategoryKey, Interest[]>)

  const fieldsetId = React.useId()
  const descriptionId = React.useId()

  const toggleInterest = (interestId: string) => {
    if (disabled) return
    onInterestToggle(interestId)
  }

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, interestId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleInterest(interestId)
    }
  }

  const remainingSelections = maxSelections - selectedInterests.length
  const isAtLimit = selectedInterests.length >= maxSelections

  return (
    <fieldset 
      className={cn("space-y-6", className)}
      disabled={disabled}
      aria-labelledby={fieldsetId}
      aria-describedby={descriptionId}
    >
      <legend 
        id={fieldsetId}
        className="text-base font-medium text-foreground"
      >
        Select Your Interests
      </legend>
      
      <div id={descriptionId} className="text-sm text-muted-foreground">
        Choose up to {maxSelections} interests to personalize your travel recommendations.
        {remainingSelections > 0 && !isAtLimit && (
          <span className="block mt-1" aria-live="polite">
            {remainingSelections} more selection{remainingSelections !== 1 ? 's' : ''} remaining.
          </span>
        )}
        {isAtLimit && (
          <span className="block mt-1 text-amber-600" aria-live="polite">
            Maximum selections reached. Deselect an interest to choose a different one.
          </span>
        )}
      </div>

      <div className="space-y-6" role="group" aria-label="Interest categories">
        {Object.entries(interestsByCategory).map(([category, interests]) => {
          const categoryKey = category as CategoryKey
          return (
            <div key={category} className="space-y-3">
              {showCategoryLabels && (
                <h3 className="text-sm font-medium text-foreground">
                  {categoryLabels[categoryKey]}
                </h3>
              )}
              
              <div 
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={`${categoryLabels[categoryKey]} interests`}
              >
                {interests.map((interest) => {
                  const isSelected = selectedInterests.includes(interest.id)
                  const isDisabledState = disabled || (!isSelected && isAtLimit)
                  const Icon = interest.icon
                  const categoryColor = categoryColors[interest.category]
                  
                  return (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => toggleInterest(interest.id)}
                      onKeyDown={(e) => handleKeyDown(e, interest.id)}
                      disabled={isDisabledState}
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-describedby={`${interest.id}-desc`}
                      tabIndex={isDisabledState ? -1 : 0}
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        "border-2 focus:outline-none focus:ring-2 focus:ring-offset-2",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm focus:ring-primary"
                          : cn("border-border bg-background", categoryColor),
                        isDisabledState && "opacity-50 cursor-not-allowed",
                        !isDisabledState && "cursor-pointer hover:scale-105"
                      )}
                      title={interest.description}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span>{interest.name}</span>
                      {isSelected && <span className="sr-only">(selected)</span>}
                      <span id={`${interest.id}-desc`} className="sr-only">
                        {interest.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected interests summary */}
      <div 
        className="space-y-2" 
        aria-live="polite"
        aria-label="Selected interests summary"
      >
        <div className="text-sm font-medium">
          Selected ({selectedInterests.length}/{maxSelections}):
        </div>
        {selectedInterests.length > 0 ? (
          <div className="flex flex-wrap gap-1 text-xs">
            {selectedInterests.map((interestId) => {
              const interest = INTERESTS.find(i => i.id === interestId)
              return interest ? (
                <span 
                  key={interestId}
                  className="bg-primary/10 text-primary px-2 py-1 rounded"
                >
                  {interest.name}
                </span>
              ) : null
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            No interests selected yet
          </div>
        )}
      </div>

      {/* Screen reader instructions */}
      <div className="sr-only" aria-live="polite">
        Use the checkbox buttons to select your interests. 
        Each button shows an interest with a description. 
        You can select up to {maxSelections} interests total.
      </div>
    </fieldset>
  )
}

export default InterestTags 