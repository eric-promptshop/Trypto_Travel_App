"use client"

import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, Clock, ChevronRight, Menu, Sparkles, Plane, Hotel, Camera, Utensils } from "lucide-react"
import { LogoDisplay } from "./logo-display"
import { Badge } from "@/components/ui/badge"

interface ItineraryBuilderPreviewProps {
  logoUrl?: string
  primaryColor: string
  secondaryColor?: string
  font: string
}

export function ItineraryBuilderPreview({ logoUrl, primaryColor, secondaryColor, font }: ItineraryBuilderPreviewProps) {
  const accentColor = secondaryColor || primaryColor

  return (
    <div 
      className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200"
      style={{ 
        fontFamily: font
      }}
    >
      {/* Header */}
      <header 
        className="border-b"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <LogoDisplay
                  src={logoUrl}
                  alt="Logo"
                  width={120}
                  height={30}
                  className="object-contain h-7 w-auto max-w-[120px]"
                  containerClassName="bg-white rounded px-2 py-1 shadow-sm"
                />
              ) : (
                <div className="h-8 w-24 bg-white/30 rounded animate-pulse" />
              )}
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-white/90 hover:text-white text-sm font-medium">My Trips</a>
              <a href="#" className="text-white/90 hover:text-white text-sm font-medium">Explore</a>
              <Button 
                size="sm" 
                variant="secondary"
                style={{ 
                  backgroundColor: 'white',
                  color: primaryColor
                }}
                className="hover:opacity-90"
              >
                Sign In
              </Button>
            </nav>
            
            <button className="md:hidden text-white">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Trip Builder Content */}
      <div className="p-6">
        {/* Trip Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" style={{ color: accentColor }} />
            <span className="text-sm font-medium" style={{ color: accentColor }}>AI-Powered Itinerary</span>
          </div>
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: primaryColor }}
          >
            7 Days in Paris, France
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              March 15-21, 2024
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              2 Travelers
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Paris, France
            </span>
          </div>
        </div>

        {/* Day Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map((day, index) => (
            <Button
              key={day}
              size="sm"
              variant={index === 0 ? "default" : "outline"}
              style={{
                backgroundColor: index === 0 ? primaryColor : 'transparent',
                color: index === 0 ? 'white' : primaryColor,
                borderColor: primaryColor
              }}
              className="whitespace-nowrap"
            >
              {day}
            </Button>
          ))}
        </div>

        {/* Day 1 Itinerary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: primaryColor }}>
              Day 1: Arrival & Montmartre
            </h2>
            <Badge variant="outline" style={{ borderColor: accentColor, color: accentColor }}>
              Thursday, March 15
            </Badge>
          </div>

          {/* Morning Activity */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <div 
                className="p-2 rounded-lg bg-white"
                style={{ color: accentColor }}
              >
                <Plane className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium">Airport Arrival & Hotel Check-in</h3>
                  <span className="text-sm text-slate-500">9:00 AM - 12:00 PM</span>
                </div>
                <p className="text-sm text-slate-600 mb-2">
                  Arrive at Charles de Gaulle Airport. Take RER B train to city center.
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Hotel className="h-3 w-3 mr-1" />
                    Hotel des Arts Montmartre
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    €15 transport
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Afternoon Activity */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <div 
                className="p-2 rounded-lg bg-white"
                style={{ color: accentColor }}
              >
                <Camera className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium">Explore Montmartre & Sacré-Cœur</h3>
                  <span className="text-sm text-slate-500">2:00 PM - 6:00 PM</span>
                </div>
                <p className="text-sm text-slate-600 mb-2">
                  Walk through charming streets, visit the basilica, and enjoy panoramic city views.
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    18th Arrondissement
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Free admission
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Evening Activity */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <div 
                className="p-2 rounded-lg bg-white"
                style={{ color: accentColor }}
              >
                <Utensils className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium">Dinner at La Maison Rose</h3>
                  <span className="text-sm text-slate-500">7:30 PM - 9:30 PM</span>
                </div>
                <p className="text-sm text-slate-600 mb-2">
                  Experience authentic French cuisine at this iconic pink restaurant in Montmartre.
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Utensils className="h-3 w-3 mr-1" />
                    French Bistro
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    €50-70 per person
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              style={{ 
                borderColor: primaryColor,
                color: primaryColor
              }}
            >
              <Clock className="h-4 w-4 mr-2" />
              Customize Schedule
            </Button>
            <Button 
              variant="outline"
              style={{ 
                borderColor: primaryColor,
                color: primaryColor
              }}
            >
              Add Activity
            </Button>
          </div>
          <Button 
            style={{ 
              backgroundColor: accentColor,
              color: 'white'
            }}
            className="hover:opacity-90"
          >
            Save Itinerary
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-slate-50 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <p>Powered by AI Travel Assistant</p>
          <p>© 2024 Your Travel Company</p>
        </div>
      </footer>
    </div>
  )
}