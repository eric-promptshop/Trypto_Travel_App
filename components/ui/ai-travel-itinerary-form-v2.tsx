"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Plane, 
  Car, 
  Train, 
  Hotel, 
  Camera, 
  Utensils,
  ChevronDown,
  Sparkles,
  Send,
  X,
  Heart,
  Mountain,
  Building,
  Home,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// AutoComplete component from our previous implementation
interface Option {
  value: string;
  label: string;
  country?: string;
  region?: string;
  lat?: number;
  lng?: number;
  type?: string;
}

interface AutoCompleteProps {
  options: Option[];
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  allowCustomValue?: boolean;
  error?: string;
}

function AutoComplete({
  options,
  placeholder = "Search...",
  value = "",
  onValueChange,
  className,
  allowCustomValue = false,
  error
}: AutoCompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Option[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Use real geocoding API for global location search
  const searchDestinations = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      // Call our geocoding API endpoint
      const response = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        // If custom value is allowed and no exact match, add the query as an option
        const results = [...data.results];
        if (allowCustomValue && !results.find(r => r.label.toLowerCase() === query.toLowerCase())) {
          results.unshift({ value: query, label: query });
        }
        setSearchResults(results.slice(0, 10));
      } else {
        // Fallback if API fails
        if (allowCustomValue) {
          setSearchResults([{ value: query, label: query }]);
        } else {
          setSearchResults([]);
        }
      }
    } catch (error) {
      console.error('Location search error:', error);
      // On error, still allow custom input if enabled
      if (allowCustomValue) {
        setSearchResults([{ value: query, label: query }]);
      } else {
        setSearchResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [allowCustomValue]);

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      searchDestinations(inputValue);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue, searchDestinations]);

  const handleSelect = (option: Option) => {
    setInputValue(option.label);
    onValueChange?.(option.label); // Pass the label as the value for flexibility
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    
    // For custom values, update the parent immediately
    if (allowCustomValue) {
      onValueChange?.(newValue);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        className={cn(
          "border-brand-gray-border focus:border-brand-blue-primary focus:ring-brand-blue-primary",
          error && "border-red-500 focus:border-red-500"
        )}
      />
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
      {isOpen && (inputValue.length > 1 || searchResults.length > 0) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-brand-gray-border rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-brand-gray-secondary">Searching...</div>
          ) : searchResults.length > 0 ? (
            searchResults.map((option) => (
              <div
                key={option.value}
                className="px-3 py-2 hover:bg-brand-gray-light cursor-pointer text-sm"
                onClick={() => handleSelect(option)}
              >
                <div className="text-brand-gray-text font-medium">
                  {option.label.split(',')[0]}
                </div>
                {option.country && (
                  <div className="text-xs text-brand-gray-secondary mt-0.5">
                    {option.label.split(',').slice(1).join(',').trim() || option.country}
                  </div>
                )}
              </div>
            ))
          ) : inputValue.length > 1 ? (
            <div className="px-3 py-2 text-sm text-brand-gray-secondary">
              No results found. Type to use "{inputValue}" as your destination.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Date picker component
interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
}

function DatePicker({ 
  date, 
  onDateChange, 
  placeholder = "Select date",
  className,
  minDate,
  maxDate,
  error
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Detect mobile devices
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches || 
                  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const handleDateClick = () => {
    if (inputRef.current) {
      // Focus first to ensure the input is ready
      inputRef.current.focus();
      // Try showPicker if available, otherwise click
      if (inputRef.current.showPicker) {
        try {
          inputRef.current.showPicker();
        } catch (e) {
          inputRef.current.click();
        }
      } else {
        inputRef.current.click();
      }
    }
  };

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date: Date | undefined) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="date"
        value={formatDateForInput(date)}
        min={minDate ? formatDateForInput(minDate) : undefined}
        max={maxDate ? formatDateForInput(maxDate) : undefined}
        onChange={(e) => {
          if (e.target.value) {
            const newDate = new Date(e.target.value + 'T00:00:00');
            onDateChange?.(newDate);
          } else {
            onDateChange?.(undefined);
          }
        }}
        className={cn(
          "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10",
          isMobile && "opacity-100 bg-white" // Show on mobile
        )}
        aria-label={placeholder}
      />
      <Input
        value={formatDateForDisplay(date)}
        placeholder={placeholder}
        readOnly
        onClick={handleDateClick}
        className={cn(
          "cursor-pointer border-brand-gray-border focus:border-brand-blue-primary focus:ring-brand-blue-primary pr-10",
          error && "border-red-500 focus:border-red-500",
          isMobile && "pointer-events-none" // Disable on mobile to let native input work
        )}
      />
      <Calendar 
        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray-secondary pointer-events-none" 
        onClick={handleDateClick}
      />
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

// Background Beams Component
const BackgroundBeams = React.memo(({ className }: { className?: string }) => {
  const paths = [
    "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875",
    "M-373 -197C-373 -197 -305 208 159 335C623 462 691 867 691 867",
    "M-366 -205C-366 -205 -298 200 166 327C630 454 698 859 698 859",
    "M-359 -213C-359 -213 -291 192 173 319C637 446 705 851 705 851",
    "M-352 -221C-352 -221 -284 184 180 311C644 438 712 843 712 843",
  ];

  return (
    <div className={cn("absolute h-full w-full inset-0 flex items-center justify-center", className)}>
      <svg
        className="z-0 h-full w-full pointer-events-none absolute"
        width="100%"
        height="100%"
        viewBox="0 0 696 316"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {paths.map((path, index) => (
          <motion.path
            key={`path-${index}`}
            d={path}
            stroke={`url(#linearGradient-${index})`}
            strokeOpacity="0.4"
            strokeWidth="0.5"
          />
        ))}
        <defs>
          {paths.map((_, index) => (
            <motion.linearGradient
              id={`linearGradient-${index}`}
              key={`gradient-${index}`}
              initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
              animate={{
                x1: ["0%", "100%"],
                x2: ["0%", "95%"],
                y1: ["0%", "100%"],
                y2: ["0%", `${93 + Math.random() * 8}%`],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                ease: "easeInOut",
                repeat: Infinity,
                delay: Math.random() * 10,
              }}
            >
              <stop stopColor="#18CCFC" stopOpacity="0" />
              <stop stopColor="#18CCFC" />
              <stop offset="32.5%" stopColor="#6344F5" />
              <stop offset="100%" stopColor="#AE48FF" stopOpacity="0" />
            </motion.linearGradient>
          ))}
        </defs>
      </svg>
    </div>
  );
});

BackgroundBeams.displayName = "BackgroundBeams";

// Main AI Travel Itinerary Form Component
interface TravelFormData {
  destination: string;
  startDate?: Date;
  endDate?: Date;
  travelers: number;
  budget: string;
  interests: string[];
  accommodation: string;
  transportation: string[];
  specialRequests: string;
}

interface AITravelItineraryFormProps {
  onComplete: (data: TravelFormData) => void;
  isLoading?: boolean;
}

export function AITravelItineraryForm({ onComplete, isLoading = false }: AITravelItineraryFormProps) {
  const [formData, setFormData] = useState<TravelFormData>({
    destination: "",
    startDate: undefined,
    endDate: undefined,
    travelers: 2,
    budget: "",
    interests: [],
    accommodation: "",
    transportation: [],
    specialRequests: ""
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TravelFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof TravelFormData, boolean>>>({});

  const interestOptions = [
    { id: "culture", label: "Culture & History", icon: Camera },
    { id: "food", label: "Food & Dining", icon: Utensils },
    { id: "adventure", label: "Adventure Sports", icon: Mountain },
    { id: "relaxation", label: "Relaxation & Spa", icon: Heart },
    { id: "nightlife", label: "Nightlife", icon: Building },
    { id: "nature", label: "Nature & Wildlife", icon: Mountain },
    { id: "shopping", label: "Shopping", icon: Building },
    { id: "family", label: "Family Activities", icon: Users }
  ];

  const transportOptions = [
    { id: "flights", label: "Flights", icon: Plane },
    { id: "rental-car", label: "Rental Car", icon: Car },
    { id: "train", label: "Train", icon: Train },
    { id: "local-transport", label: "Local Transport", icon: Car }
  ];

  const accommodationOptions = [
    { value: "budget", label: "Budget (Hostels, Guesthouses)" },
    { value: "mid-range", label: "Mid-range (3-4 star hotels)" },
    { value: "luxury", label: "Luxury (5 star hotels, resorts)" },
    { value: "unique", label: "Unique (Boutique hotels, Airbnb)" }
  ];

  const budgetOptions = [
    { value: "budget", label: "Budget ($50-150/day)" },
    { value: "moderate", label: "Moderate ($150-300/day)" },
    { value: "premium", label: "Premium ($300-500/day)" },
    { value: "luxury", label: "Luxury ($500+/day)" }
  ];

  // Validation function
  const validateField = (field: keyof TravelFormData, value: any): string => {
    switch (field) {
      case 'destination':
        return !value || value.trim().length < 2 ? 'Please enter a destination' : '';
      case 'startDate':
        if (!value) return 'Please select a start date';
        // Create date at midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(value);
        startDate.setHours(0, 0, 0, 0);
        if (startDate < today) return 'Start date cannot be in the past';
        return '';
      case 'endDate':
        if (!value) return 'Please select an end date';
        if (formData.startDate && new Date(value) < new Date(formData.startDate)) {
          return 'End date must be after start date';
        }
        return '';
      case 'travelers':
        return value < 1 ? 'At least 1 traveler is required' : '';
      case 'budget':
        return !value ? 'Please select a budget range' : '';
      case 'interests':
        return value.length === 0 ? 'Please select at least one interest' : '';
      case 'accommodation':
        return !value ? 'Please select accommodation type' : '';
      case 'transportation':
        return value.length === 0 ? 'Please select at least one transportation option' : '';
      default:
        return '';
    }
  };

  // Handle field blur
  const handleBlur = (field: keyof TravelFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TravelFormData, string>> = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof TravelFormData>).forEach(field => {
      if (field !== 'specialRequests') { // specialRequests is optional
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      }
    });
    
    setErrors(newErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    return isValid;
  };

  const handleInterestToggle = (interestId: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const handleTransportToggle = (transportId: string) => {
    setFormData(prev => ({
      ...prev,
      transportation: prev.transportation.includes(transportId)
        ? prev.transportation.filter(id => id !== transportId)
        : [...prev.transportation, transportId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onComplete(formData);
    } else {
      // Scroll to first error
      const firstErrorField = Object.keys(errors).find(key => errors[key as keyof TravelFormData]);
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <BackgroundBeams className="opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-4"
            >
              <Sparkles className="w-8 h-8 text-orange-600" />
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-800 to-orange-700 bg-clip-text text-transparent">
                AI Travel Planner
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-lg text-brand-gray-secondary max-w-2xl mx-auto"
            >
              Let our AI create the perfect itinerary for your next adventure. Just tell us your preferences and we'll handle the rest.
            </motion.p>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Card className="p-8 shadow-xl border-brand-gray-border bg-white/95 backdrop-blur-sm mb-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Destination and Dates Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="destination" className="flex items-center gap-2 text-brand-gray-text">
                      <MapPin className="w-4 h-4 text-blue-700" />
                      Destination <span className="text-red-500">*</span>
                    </Label>
                    <div id="destination">
                      <AutoComplete
                        options={[]}
                        placeholder="Search any destination worldwide..."
                        value={formData.destination}
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, destination: value }));
                          if (touched.destination) {
                            setErrors(prev => ({ ...prev, destination: validateField('destination', value) }));
                          }
                        }}
                        allowCustomValue={true}
                        error={touched.destination ? errors.destination : undefined}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9, duration: 0.4 }}
                    className="space-y-2"
                  >
                    <Label className="flex items-center gap-2 text-brand-gray-text">
                      <Calendar className="w-4 h-4 text-blue-700" />
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <div id="startDate">
                      <DatePicker
                        date={formData.startDate}
                        onDateChange={(date) => {
                          setFormData(prev => ({ ...prev, startDate: date }));
                          if (touched.startDate) {
                            setErrors(prev => ({ ...prev, startDate: validateField('startDate', date) }));
                          }
                        }}
                        placeholder="Departure date"
                        minDate={new Date()}
                        error={touched.startDate ? errors.startDate : undefined}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0, duration: 0.4 }}
                    className="space-y-2"
                  >
                    <Label className="flex items-center gap-2 text-brand-gray-text">
                      <Calendar className="w-4 h-4 text-blue-700" />
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <div id="endDate">
                      <DatePicker
                        date={formData.endDate}
                        onDateChange={(date) => {
                          setFormData(prev => ({ ...prev, endDate: date }));
                          if (touched.endDate) {
                            setErrors(prev => ({ ...prev, endDate: validateField('endDate', date) }));
                          }
                        }}
                        placeholder="Return date"
                        minDate={formData.startDate || new Date()}
                        error={touched.endDate ? errors.endDate : undefined}
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Travelers and Budget Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1, duration: 0.4 }}
                    className="space-y-2"
                  >
                    <Label className="flex items-center gap-2 text-brand-gray-text">
                      <Users className="w-4 h-4 text-blue-700" />
                      Number of Travelers <span className="text-red-500">*</span>
                    </Label>
                    <div id="travelers">
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.travelers}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          setFormData(prev => ({ ...prev, travelers: value }));
                          if (touched.travelers) {
                            setErrors(prev => ({ ...prev, travelers: validateField('travelers', value) }));
                          }
                        }}
                        onBlur={() => handleBlur('travelers')}
                        className={cn(
                          "border-brand-gray-border focus:border-brand-blue-primary focus:ring-brand-blue-primary",
                          touched.travelers && errors.travelers && "border-red-500 focus:border-red-500"
                        )}
                      />
                    </div>
                    {touched.travelers && errors.travelers && (
                      <p className="text-xs text-red-500">{errors.travelers}</p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2, duration: 0.4 }}
                    className="space-y-2"
                  >
                    <Label className="flex items-center gap-2 text-brand-gray-text">
                      <span className="text-lg">💰</span>
                      Budget Range <span className="text-red-500">*</span>
                    </Label>
                    <div id="budget">
                      <select
                        value={formData.budget}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, budget: e.target.value }));
                          if (touched.budget) {
                            setErrors(prev => ({ ...prev, budget: validateField('budget', e.target.value) }));
                          }
                        }}
                        onBlur={() => handleBlur('budget')}
                        className={cn(
                          "flex h-9 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition-shadow focus:outline-none focus:ring-2",
                          "border-brand-gray-border focus:border-brand-blue-primary focus:ring-brand-blue-primary",
                          touched.budget && errors.budget && "border-red-500 focus:border-red-500"
                        )}
                      >
                      <option value="">Select budget</option>
                      {budgetOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                      </select>
                    </div>
                    {touched.budget && errors.budget && (
                      <p className="text-xs text-red-500">{errors.budget}</p>
                    )}
                  </motion.div>
                </div>

                {/* Interests */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3, duration: 0.4 }}
                  className="space-y-4"
                  id="interests"
                >
                  <Label className="text-lg font-semibold text-brand-gray-text">
                    What interests you? <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {interestOptions.map((interest, index) => {
                      const IconComponent = interest.icon;
                      return (
                        <motion.button
                          key={interest.id}
                          type="button"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.4 + index * 0.05, duration: 0.3 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            handleInterestToggle(interest.id);
                            if (touched.interests) {
                              const newInterests = formData.interests.includes(interest.id)
                                ? formData.interests.filter(id => id !== interest.id)
                                : [...formData.interests, interest.id];
                              setErrors(prev => ({ ...prev, interests: validateField('interests', newInterests) }));
                            }
                          }}
                          onBlur={() => handleBlur('interests')}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2",
                            formData.interests.includes(interest.id)
                              ? "border-blue-700 bg-blue-50 text-blue-700"
                              : "border-brand-gray-border hover:border-blue-600/50 hover:bg-brand-gray-light"
                          )}
                        >
                          <IconComponent className="w-5 h-5" />
                          <span className="text-xs font-medium">{interest.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                  {touched.interests && errors.interests && (
                    <p className="text-xs text-red-500">{errors.interests}</p>
                  )}
                </motion.div>

                {/* Transportation and Accommodation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.8, duration: 0.4 }}
                    className="space-y-4"
                    id="transportation"
                  >
                    <Label className="text-lg font-semibold text-brand-gray-text">
                      Transportation Needed <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {transportOptions.map((transport) => {
                        const IconComponent = transport.icon;
                        return (
                          <button
                            key={transport.id}
                            type="button"
                            onClick={() => {
                              handleTransportToggle(transport.id);
                              if (touched.transportation) {
                                const newTransport = formData.transportation.includes(transport.id)
                                  ? formData.transportation.filter(id => id !== transport.id)
                                  : [...formData.transportation, transport.id];
                                setErrors(prev => ({ ...prev, transportation: validateField('transportation', newTransport) }));
                              }
                            }}
                            onBlur={() => handleBlur('transportation')}
                            className={cn(
                              "p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-2",
                              formData.transportation.includes(transport.id)
                                ? "border-blue-700 bg-blue-50 text-blue-700"
                                : "border-brand-gray-border hover:border-blue-600/50 hover:bg-brand-gray-light"
                            )}
                          >
                            <IconComponent className="w-4 h-4" />
                            <span className="text-xs font-medium">{transport.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {touched.transportation && errors.transportation && (
                      <p className="text-xs text-red-500">{errors.transportation}</p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.9, duration: 0.4 }}
                    className="space-y-2"
                  >
                    <Label className="flex items-center gap-2 text-brand-gray-text">
                      <Hotel className="w-4 h-4 text-blue-700" />
                      Accommodation Type <span className="text-red-500">*</span>
                    </Label>
                    <div id="accommodation">
                      <select
                        value={formData.accommodation}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, accommodation: e.target.value }));
                          if (touched.accommodation) {
                            setErrors(prev => ({ ...prev, accommodation: validateField('accommodation', e.target.value) }));
                          }
                        }}
                        onBlur={() => handleBlur('accommodation')}
                        className={cn(
                          "flex h-9 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition-shadow focus:outline-none focus:ring-2",
                          "border-brand-gray-border focus:border-brand-blue-primary focus:ring-brand-blue-primary",
                          touched.accommodation && errors.accommodation && "border-red-500 focus:border-red-500"
                        )}
                      >
                      <option value="">Select accommodation</option>
                      {accommodationOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                      </select>
                    </div>
                    {touched.accommodation && errors.accommodation && (
                      <p className="text-xs text-red-500">{errors.accommodation}</p>
                    )}
                  </motion.div>
                </div>

                {/* Special Requests */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.0, duration: 0.4 }}
                  className="space-y-2"
                >
                  <Label htmlFor="special-requests" className="text-brand-gray-text">
                    Special Requests or Preferences (Optional)
                  </Label>
                  <Textarea
                    id="special-requests"
                    placeholder="Any dietary restrictions, accessibility needs, specific activities, or special occasions?"
                    value={formData.specialRequests}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                    rows={3}
                    className="border-brand-gray-border focus:border-brand-blue-primary focus:ring-brand-blue-primary"
                  />
                </motion.div>

                {/* Error Summary */}
                {Object.keys(errors).length > 0 && Object.values(touched).some(t => t) && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold mb-2">Please complete the following required fields:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {Object.entries(errors)
                          .filter(([field, error]) => field && error && touched[field as keyof TravelFormData])
                          .map(([field, error]) => (
                            <li key={field} className="text-sm">
                              {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1').trim()}: {error}
                            </li>
                          ))
                        }
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.1, duration: 0.4 }}
                  className="flex justify-center pt-6 pb-4"
                >
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                    className="relative overflow-hidden group min-w-[200px] bg-gradient-to-r from-blue-700 to-orange-600 hover:from-blue-800 hover:to-orange-700 text-white shadow-lg"
                  >
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          key="generating"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="w-4 h-4" />
                          </motion.div>
                          Generating Itinerary...
                        </motion.div>
                      ) : (
                        <motion.div
                          key="submit"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Generate My Itinerary
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                  </Button>
                </motion.div>
              </form>
            </Card>
          </motion.div>
          {/* Add some padding at the bottom for mobile */}
          <div className="h-20 sm:h-0" />
        </motion.div>
      </div>
    </div>
  );
}

export default AITravelItineraryForm;