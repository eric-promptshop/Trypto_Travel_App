'use client'

import React from 'react'
import { 
  DollarSign, 
  Clock, 
  Star, 
  Users,
  Languages,
  Accessibility,
  Shield,
  Calendar
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface TourFiltersProps {
  priceRange: number[]
  onPriceChange: (range: number[]) => void
  duration: string
  onDurationChange: (duration: string) => void
  onApplyFilters: () => void
}

export function TourFilters({
  priceRange,
  onPriceChange,
  duration,
  onDurationChange,
  onApplyFilters
}: TourFiltersProps) {
  // Local state for other filters
  const [rating, setRating] = React.useState(0)
  const [groupSize, setGroupSize] = React.useState<string[]>([])
  const [features, setFeatures] = React.useState<string[]>([])
  const [languages, setLanguages] = React.useState<string[]>([])

  const handleGroupSizeToggle = (size: string) => {
    setGroupSize(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    )
  }

  const handleFeatureToggle = (feature: string) => {
    setFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    )
  }

  const handleLanguageToggle = (language: string) => {
    setLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    )
  }

  const clearFilters = () => {
    onPriceChange([0, 500])
    onDurationChange('all')
    setRating(0)
    setGroupSize([])
    setFeatures([])
    setLanguages([])
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Range */}
        <div>
          <Label className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4" />
            Price Range
          </Label>
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={onPriceChange}
              max={500}
              min={0}
              step={10}
              className="mb-2"
            />
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}+</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Duration */}
        <div>
          <Label className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" />
            Duration
          </Label>
          <RadioGroup value={duration} onValueChange={onDurationChange}>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="duration-all" />
                <Label htmlFor="duration-all" className="font-normal cursor-pointer">
                  All durations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="half-day" id="duration-half" />
                <Label htmlFor="duration-half" className="font-normal cursor-pointer">
                  Half day (up to 4 hours)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full-day" id="duration-full" />
                <Label htmlFor="duration-full" className="font-normal cursor-pointer">
                  Full day (4-8 hours)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multi-day" id="duration-multi" />
                <Label htmlFor="duration-multi" className="font-normal cursor-pointer">
                  Multi-day
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Rating */}
        <div>
          <Label className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4" />
            Minimum Rating
          </Label>
          <div className="flex gap-2">
            {[0, 3, 3.5, 4, 4.5].map(r => (
              <Button
                key={r}
                variant={rating === r ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRating(r)}
                className="flex-1"
              >
                {r === 0 ? 'Any' : `${r}+`}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Group Size */}
        <div>
          <Label className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4" />
            Group Size
          </Label>
          <div className="space-y-2">
            {[
              { value: 'private', label: 'Private tour' },
              { value: 'small', label: 'Small group (2-10)' },
              { value: 'medium', label: 'Medium group (10-20)' },
              { value: 'large', label: 'Large group (20+)' }
            ].map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`group-${option.value}`}
                  checked={groupSize.includes(option.value)}
                  onCheckedChange={() => handleGroupSizeToggle(option.value)}
                />
                <Label 
                  htmlFor={`group-${option.value}`} 
                  className="font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Features */}
        <div>
          <Label className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4" />
            Features
          </Label>
          <div className="space-y-2">
            {[
              { value: 'instant', label: 'Instant booking', icon: Calendar },
              { value: 'free-cancel', label: 'Free cancellation', icon: Shield },
              { value: 'wheelchair', label: 'Wheelchair accessible', icon: Accessibility },
              { value: 'pickup', label: 'Hotel pickup', icon: Users }
            ].map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`feature-${option.value}`}
                  checked={features.includes(option.value)}
                  onCheckedChange={() => handleFeatureToggle(option.value)}
                />
                <Label 
                  htmlFor={`feature-${option.value}`} 
                  className="font-normal cursor-pointer flex items-center gap-2"
                >
                  <option.icon className="h-3 w-3" />
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Languages */}
        <div>
          <Label className="flex items-center gap-2 mb-3">
            <Languages className="h-4 w-4" />
            Guide Languages
          </Label>
          <div className="space-y-2">
            {[
              'English',
              'Spanish',
              'French',
              'German',
              'Italian',
              'Japanese',
              'Chinese',
              'Portuguese'
            ].map(lang => (
              <div key={lang} className="flex items-center space-x-2">
                <Checkbox
                  id={`lang-${lang}`}
                  checked={languages.includes(lang)}
                  onCheckedChange={() => handleLanguageToggle(lang)}
                />
                <Label 
                  htmlFor={`lang-${lang}`} 
                  className="font-normal cursor-pointer"
                >
                  {lang}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Button 
          className="w-full" 
          onClick={onApplyFilters}
        >
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  )
}