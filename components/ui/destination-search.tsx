"use client";

import React, { useState, useRef, useEffect } from "react";
import { MapPin, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Option {
  value: string;
  label: string;
  country?: string;
  region?: string;
  lat?: number;
  lng?: number;
  type?: string;
}

interface DestinationSearchProps {
  destinations: string[];
  onDestinationsChange: (destinations: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function DestinationSearch({
  destinations,
  onDestinationsChange,
  label = "Primary Destinations",
  placeholder = "Search for destinations...",
  error,
  className
}: DestinationSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
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
        setSearchResults(data.results.slice(0, 10));
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Location search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    if (!destinations.includes(option.label)) {
      onDestinationsChange([...destinations, option.label]);
    }
    setInputValue("");
    setIsOpen(false);
  };

  const handleRemove = (destination: string) => {
    onDestinationsChange(destinations.filter(d => d !== destination));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <Label className="block text-sm font-medium text-slate-700">
          {label}
          <span className="text-red-500 ml-1">*</span>
        </Label>
      )}
      
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              placeholder={placeholder}
              className={cn(
                "pl-10 pr-4",
                error && "border-red-300 focus:border-red-500"
              )}
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setInputValue("")}
            className="text-slate-600 hover:text-slate-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        
        {/* Search Results Dropdown */}
        {isOpen && (inputValue.length > 1 || searchResults.length > 0) && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-slate-500">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((option) => (
                <div
                  key={option.value}
                  className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm flex items-center gap-2"
                  onClick={() => handleSelect(option)}
                >
                  <MapPin className="h-3 w-3 text-slate-400" />
                  <div>
                    <div className="text-slate-700 font-medium">
                      {option.label.split(',')[0]}
                    </div>
                    {option.country && (
                      <div className="text-xs text-slate-500">
                        {option.label.split(',').slice(1).join(',').trim() || option.country}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : inputValue.length > 1 ? (
              <div className="px-3 py-2 text-sm text-slate-500">
                No results found for "{inputValue}"
              </div>
            ) : null}
          </div>
        )}
      </div>
      
      {/* Selected Destinations */}
      <div className="space-y-2">
        {destinations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {destinations.map((destination) => (
              <Badge
                key={destination}
                variant="secondary"
                className="pl-3 pr-1 py-1 bg-blue-50 text-blue-700 border-blue-200"
              >
                <span className="text-sm">{destination}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(destination)}
                  className="ml-2 p-1 hover:bg-blue-100 rounded-full transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">No destinations selected</p>
        )}
      </div>
      
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}