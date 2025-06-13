"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Calendar, 
  Users, 
  Plane, 
  Hotel, 
  Car, 
  Camera,
  Plus,
  X,
  GripVertical,
  Sparkles,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Auto-resize textarea hook
function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: {
  minHeight: number;
  maxHeight?: number;
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const adjustHeight = React.useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(
          textarea.scrollHeight,
          maxHeight ?? Number.POSITIVE_INFINITY
        )
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

// Autocomplete component
interface Option {
  value: string;
  label: string;
}

interface AutoCompleteProps {
  options: Option[];
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

function AutoComplete({
  options,
  placeholder = "Search...",
  value = "",
  onValueChange,
  className
}: AutoCompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (option: Option) => {
    setInputValue(option.label);
    onValueChange?.(option.value);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        className="border-brand-gray-border focus:border-brand-blue-primary focus:ring-brand-blue-primary"
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-brand-gray-border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              className="px-3 py-2 hover:bg-brand-gray-light cursor-pointer text-sm text-brand-gray-text"
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </div>
          ))}
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
}

function DatePicker({ 
  date, 
  onDateChange, 
  placeholder = "Select date",
  className 
}: DatePickerProps) {
  return (
    <div className={cn("relative", className)}>
      <Input
        value={date ? date.toLocaleDateString() : ""}
        placeholder={placeholder}
        readOnly
        className="cursor-pointer border-brand-gray-border focus:border-brand-blue-primary focus:ring-brand-blue-primary"
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'date';
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            if (target.value) {
              onDateChange?.(new Date(target.value));
            }
          };
          input.click();
        }}
      />
      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray-secondary pointer-events-none" />
    </div>
  );
}

// Draggable list for itinerary items
interface DraggableItemProps {
  id: string;
  content: React.ReactNode;
}

interface DraggableListProps {
  items: DraggableItemProps[];
  onChange?: (items: DraggableItemProps[]) => void;
  className?: string;
}

function DraggableList({ items: initialItems, onChange, className }: DraggableListProps) {
  const [items, setItems] = useState(initialItems);
  const [draggedItem, setDraggedItem] = useState<DraggableItemProps | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  const handleDragStart = (item: DraggableItemProps) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    setDragOverItemId(itemId);
  };

  const handleDragEnd = () => {
    if (!draggedItem || !dragOverItemId) {
      setDraggedItem(null);
      setDragOverItemId(null);
      return;
    }

    const newItems = [...items];
    const draggedIndex = items.findIndex((item) => item.id === draggedItem.id);
    const dropIndex = items.findIndex((item) => item.id === dragOverItemId);

    newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    setItems(newItems);
    onChange?.(newItems);
    setDraggedItem(null);
    setDragOverItemId(null);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            draggable
            onDragStart={() => handleDragStart(item)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              "cursor-grab rounded-lg border bg-white p-4 shadow-sm transition-colors",
              dragOverItemId === item.id && "border-brand-blue-primary bg-brand-gray-light",
              draggedItem?.id === item.id && "opacity-50"
            )}
          >
            {item.content}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Stepper component for form steps
interface StepProps {
  title: string;
  description?: string;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
  stepNumber: number;
}

function Step({ title, description, isActive, isCompleted, onClick, stepNumber }: StepProps) {
  return (
    <div className="flex items-center cursor-pointer" onClick={onClick}>
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors",
        isCompleted ? "bg-brand-blue-primary text-white border-brand-blue-primary" :
        isActive ? "border-brand-blue-primary text-brand-blue-primary" : "border-brand-gray-border text-brand-gray-secondary"
      )}>
        {isCompleted ? "✓" : stepNumber}
      </div>
      <div className="ml-3">
        <div className={cn(
          "text-sm font-medium",
          isActive ? "text-brand-gray-text" : "text-brand-gray-secondary"
        )}>
          {title}
        </div>
        {description && (
          <div className="text-xs text-brand-gray-secondary">{description}</div>
        )}
      </div>
    </div>
  );
}

// Main AI Travel Itinerary Form Component
interface TravelPreference {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  selected: boolean;
}

interface ItineraryItem {
  id: string;
  type: 'flight' | 'hotel' | 'activity' | 'transport';
  title: string;
  description: string;
  time?: string;
  location?: string;
}

interface TravelFormData {
  destination: string;
  startDate?: Date;
  endDate?: Date;
  travelers: number;
  budget: string;
  preferences: TravelPreference[];
  specialRequests: string;
  itineraryItems: ItineraryItem[];
}

interface AITravelItineraryFormProps {
  onComplete: (data: TravelFormData) => void;
  isLoading?: boolean;
}

export function AITravelItineraryForm({ onComplete, isLoading = false }: AITravelItineraryFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<TravelFormData>({
    destination: "",
    travelers: 2,
    budget: "",
    preferences: [
      { id: "flights", label: "Flights", icon: Plane, selected: false },
      { id: "hotels", label: "Hotels", icon: Hotel, selected: false },
      { id: "transport", label: "Transport", icon: Car, selected: false },
      { id: "activities", label: "Activities", icon: Camera, selected: false },
    ],
    specialRequests: "",
    itineraryItems: []
  });

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 80,
    maxHeight: 200,
  });

  const destinations = [
    { value: "paris", label: "Paris, France" },
    { value: "tokyo", label: "Tokyo, Japan" },
    { value: "nyc", label: "New York City, USA" },
    { value: "london", label: "London, UK" },
    { value: "bali", label: "Bali, Indonesia" },
    { value: "rome", label: "Rome, Italy" },
    { value: "dubai", label: "Dubai, UAE" },
    { value: "singapore", label: "Singapore" },
    { value: "barcelona", label: "Barcelona, Spain" },
    { value: "sydney", label: "Sydney, Australia" },
  ];

  const steps = [
    { title: "Destination & Dates", description: "Where and when" },
    { title: "Preferences", description: "What you need" },
    { title: "Review & Generate", description: "Finalize details" }
  ];

  const togglePreference = (id: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.map(pref =>
        pref.id === id ? { ...pref, selected: !pref.selected } : pref
      )
    }));
  };

  const addItineraryItem = () => {
    const newItem: ItineraryItem = {
      id: Date.now().toString(),
      type: 'activity',
      title: "New Activity",
      description: "Add description...",
      time: "10:00 AM",
      location: formData.destination
    };
    
    setFormData(prev => ({
      ...prev,
      itineraryItems: [...prev.itineraryItems, newItem]
    }));
  };

  const removeItineraryItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      itineraryItems: prev.itineraryItems.filter(item => item.id !== id)
    }));
  };

  const updateItineraryItems = (items: DraggableItemProps[]) => {
    const updatedItems = items.map(item => 
      formData.itineraryItems.find(itItem => itItem.id === item.id)!
    );
    setFormData(prev => ({ ...prev, itineraryItems: updatedItems }));
  };

  const handleSubmit = () => {
    // Complete the form data with additional processing
    const completeData = {
      ...formData,
      completeness: 100,
      tripId: Date.now().toString()
    };
    
    onComplete(completeData);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="destination" className="flex items-center gap-2 text-brand-gray-text">
                <MapPin className="h-4 w-4 text-brand-blue-primary" />
                Destination
              </Label>
              <AutoComplete
                options={destinations}
                placeholder="Where would you like to go?"
                value={formData.destination}
                onValueChange={(value) => {
                  const destination = destinations.find(d => d.value === value)?.label || value;
                  setFormData(prev => ({ ...prev, destination }));
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-brand-gray-text">Start Date</Label>
                <DatePicker
                  date={formData.startDate}
                  onDateChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                  placeholder="Departure date"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-brand-gray-text">End Date</Label>
                <DatePicker
                  date={formData.endDate}
                  onDateChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                  placeholder="Return date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="travelers" className="flex items-center gap-2 text-brand-gray-text">
                <Users className="h-4 w-4 text-brand-blue-primary" />
                Number of Travelers
              </Label>
              <Input
                id="travelers"
                type="number"
                min="1"
                max="20"
                value={formData.travelers}
                onChange={(e) => setFormData(prev => ({ ...prev, travelers: parseInt(e.target.value) || 1 }))}
                className="border-brand-gray-border focus:border-brand-blue-primary focus:ring-brand-blue-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget" className="text-brand-gray-text">Budget Range</Label>
              <Input
                id="budget"
                placeholder="e.g., $2000 - $5000"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                className="border-brand-gray-border focus:border-brand-blue-primary focus:ring-brand-blue-primary"
              />
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <Label className="text-brand-gray-text">What would you like help with?</Label>
              <div className="grid grid-cols-2 gap-3">
                {formData.preferences.map((pref) => {
                  const IconComponent = pref.icon;
                  return (
                    <Card
                      key={pref.id}
                      className={cn(
                        "p-4 cursor-pointer transition-all hover:shadow-md border",
                        pref.selected ? "border-brand-blue-primary bg-blue-50" : "border-brand-gray-border"
                      )}
                      onClick={() => togglePreference(pref.id)}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className={cn(
                          "h-5 w-5",
                          pref.selected ? "text-brand-blue-primary" : "text-brand-gray-secondary"
                        )} />
                        <span className={cn(
                          "font-medium",
                          pref.selected ? "text-brand-blue-primary" : "text-brand-gray-text"
                        )}>
                          {pref.label}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requests" className="text-brand-gray-text">Special Requests or Preferences</Label>
              <Textarea
                ref={textareaRef}
                id="requests"
                placeholder="Any dietary restrictions, accessibility needs, specific interests, or other preferences..."
                value={formData.specialRequests}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, specialRequests: e.target.value }));
                  adjustHeight();
                }}
                className="min-h-[80px] resize-none border-brand-gray-border focus:border-brand-blue-primary focus:ring-brand-blue-primary"
              />
            </div>
          </motion.div>
        );

      case 2:
        const draggableItems = formData.itineraryItems.map(item => ({
          id: item.id,
          content: (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-brand-gray-secondary" />
                <div>
                  <div className="font-medium text-brand-gray-text">{item.title}</div>
                  <div className="text-sm text-brand-gray-secondary">{item.description}</div>
                  {item.time && (
                    <Badge variant="outline" className="mt-1 text-xs border-brand-gray-border">
                      {item.time}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItineraryItem(item.id)}
                className="text-brand-gray-secondary hover:text-brand-gray-text"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )
        }));

        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-brand-gray-text">Trip Summary</Label>
                <Badge variant="secondary" className="flex items-center gap-1 bg-brand-orange-accent text-white border-0">
                  <Sparkles className="h-3 w-3" />
                  AI Powered
                </Badge>
              </div>
              
              <Card className="p-4 bg-brand-gray-light border-brand-gray-border">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-brand-blue-primary" />
                    <span className="font-medium text-brand-gray-text">{formData.destination || "Destination not set"}</span>
                  </div>
                  {formData.startDate && formData.endDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-brand-blue-primary" />
                      <span className="text-sm text-brand-gray-text">
                        {formData.startDate.toLocaleDateString()} - {formData.endDate.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-brand-blue-primary" />
                    <span className="text-sm text-brand-gray-text">{formData.travelers} travelers</span>
                  </div>
                  {formData.budget && (
                    <div className="text-sm text-brand-gray-secondary">Budget: {formData.budget}</div>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-brand-gray-text">Custom Itinerary Items</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addItineraryItem}
                  className="border-brand-blue-primary text-brand-blue-primary hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              {formData.itineraryItems.length > 0 ? (
                <DraggableList
                  items={draggableItems}
                  onChange={updateItineraryItems}
                />
              ) : (
                <Card className="p-8 text-center border-dashed border-brand-gray-border">
                  <div className="text-brand-gray-secondary">
                    No custom items added. Click "Add Item" to create your own itinerary items.
                  </div>
                </Card>
              )}
            </div>

            {formData.specialRequests && (
              <div className="space-y-2">
                <Label className="text-brand-gray-text">Special Requests</Label>
                <Card className="p-3 bg-brand-gray-light border-brand-gray-border">
                  <p className="text-sm text-brand-gray-text">{formData.specialRequests}</p>
                </Card>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2 text-brand-gray-text">
          <Sparkles className="h-8 w-8 text-brand-orange-accent" />
          AI Travel Itinerary Planner
        </h1>
        <p className="text-brand-gray-secondary">
          Let AI create the perfect travel itinerary tailored to your preferences
        </p>
      </div>

      {/* Stepper */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-8">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <Step
                title={step.title}
                description={step.description}
                isActive={currentStep === index}
                isCompleted={currentStep > index}
                onClick={() => setCurrentStep(index)}
                stepNumber={index + 1}
              />
              {index < steps.length - 1 && (
                <div className={cn(
                  "h-0.5 w-16 transition-colors",
                  currentStep > index ? "bg-brand-blue-primary" : "bg-brand-gray-border"
                )} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card className="p-8 border-brand-gray-border">
        {renderStepContent()}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="border-brand-gray-border text-brand-gray-text hover:bg-brand-gray-light"
        >
          Previous
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button
            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
            disabled={currentStep === 0 && !formData.destination}
            className="bg-brand-blue-primary hover:bg-brand-blue-secondary text-white"
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-blue-primary to-brand-orange-accent hover:from-brand-blue-secondary hover:to-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Itinerary...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Generate AI Itinerary
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default AITravelItineraryForm;