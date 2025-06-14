"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, Clock, ChevronRight, Menu, Search, Heart, User } from "lucide-react"

interface BrandingPreviewProps {
  logoUrl?: string
  primaryColor: string
  secondaryColor?: string
  font: string
  scale?: number
}

export function BrandingPreview({ logoUrl, primaryColor, secondaryColor, font, scale = 1 }: BrandingPreviewProps) {
  const accentColor = secondaryColor || primaryColor

  return (
    <div 
      className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200"
      style={{ 
        fontFamily: font,
        transform: `scale(${scale})`,
        transformOrigin: 'top center'
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
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={120}
                  height={40}
                  className="object-contain h-8 w-auto"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              ) : (
                <div className="h-8 w-24 bg-white/30 rounded animate-pulse" />
              )}
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-white/90 hover:text-white text-sm font-medium">Destinations</a>
              <a href="#" className="text-white/90 hover:text-white text-sm font-medium">Tours</a>
              <a href="#" className="text-white/90 hover:text-white text-sm font-medium">About</a>
              <Button 
                size="sm" 
                variant="secondary"
                style={{ 
                  backgroundColor: accentColor,
                  color: 'white',
                  borderColor: accentColor
                }}
                className="hover:opacity-90"
              >
                Get Started
              </Button>
            </nav>
            
            <button className="md:hidden text-white">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: primaryColor }}
          >
            Create Your Perfect Journey
          </h1>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            Discover amazing destinations and build custom itineraries tailored to your travel style.
          </p>
          
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-md p-2 flex items-center gap-2 max-w-2xl mx-auto">
            <Search className="h-5 w-5 text-slate-400 ml-2" />
            <input 
              type="text" 
              placeholder="Where do you want to go?"
              className="flex-1 outline-none text-sm"
              style={{ fontFamily: font }}
            />
            <Button 
              size="sm"
              style={{ 
                backgroundColor: accentColor,
                color: 'white'
              }}
              className="hover:opacity-90"
            >
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Tours */}
      <section className="p-6">
        <h2 
          className="text-xl font-semibold mb-4"
          style={{ color: primaryColor }}
        >
          Popular Tours
        </h2>
        
        <div className="grid gap-4">
          {[
            { name: "Machu Picchu Adventure", duration: "7 Days", price: "$1,299", guests: "12" },
            { name: "Sacred Valley Explorer", duration: "5 Days", price: "$899", guests: "8" }
          ].map((tour, index) => (
            <div key={index} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-2">{tour.name}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" style={{ color: accentColor }} />
                      {tour.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" style={{ color: accentColor }} />
                      Max {tour.guests} guests
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" style={{ color: accentColor }} />
                      Peru
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">From</p>
                  <p className="text-lg font-bold" style={{ color: primaryColor }}>{tour.price}</p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="mt-2"
                    style={{ 
                      borderColor: accentColor,
                      color: accentColor
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trip Builder CTA */}
      <section 
        className="p-6 m-6 rounded-lg text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Build Your Custom Trip</h3>
            <p className="text-sm opacity-90">Create a personalized itinerary in minutes</p>
          </div>
          <Button 
            size="sm" 
            variant="secondary"
            style={{ 
              backgroundColor: 'white',
              color: primaryColor
            }}
            className="hover:opacity-90"
          >
            Start Planning
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50 px-6 py-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <p>&copy; 2024 Your Travel Company</p>
          <div className="flex items-center gap-4">
            <Heart className="h-4 w-4" style={{ color: accentColor }} />
            <User className="h-4 w-4" style={{ color: accentColor }} />
          </div>
        </div>
      </footer>
    </div>
  )
}