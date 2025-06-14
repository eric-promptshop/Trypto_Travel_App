"use client"

import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Users, ArrowLeft, Heart, Share2, Star } from "lucide-react"
import { LogoDisplay } from "./logo-display"

interface MobilePreviewProps {
  logoUrl?: string
  primaryColor: string
  secondaryColor?: string
  font: string
}

export function MobilePreview({ logoUrl, primaryColor, secondaryColor, font }: MobilePreviewProps) {
  const accentColor = secondaryColor || primaryColor

  return (
    <div 
      className="w-full max-w-[375px] bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl mx-auto"
    >
      {/* Phone Frame */}
      <div className="bg-slate-800 rounded-[2.25rem] p-1">
        {/* Screen */}
        <div 
          className="bg-white rounded-[2rem] overflow-hidden"
          style={{ fontFamily: font }}
        >
          {/* Status Bar */}
          <div className="bg-slate-900 text-white text-xs px-6 py-1 flex justify-between items-center">
            <span>9:41</span>
            <div className="flex gap-1">
              <div className="w-4 h-3 bg-white/80 rounded-sm"></div>
              <div className="w-4 h-3 bg-white/80 rounded-sm"></div>
              <div className="w-4 h-3 bg-white/80 rounded-sm"></div>
            </div>
          </div>

          {/* App Content */}
          <div className="h-[667px] overflow-hidden relative">
            {/* Header */}
            <header 
              className="px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <ArrowLeft className="h-5 w-5 text-white" />
              {logoUrl ? (
                <LogoDisplay
                  src={logoUrl}
                  alt="Logo"
                  width={70}
                  height={24}
                  className="object-contain h-5 w-auto max-w-[70px]"
                  containerClassName="bg-white rounded px-1.5 py-0.5 shadow-sm"
                />
              ) : (
                <div className="h-6 w-16 bg-white/30 rounded animate-pulse" />
              )}
              <div className="flex gap-2">
                <Heart className="h-5 w-5 text-white" />
                <Share2 className="h-5 w-5 text-white" />
              </div>
            </header>

            {/* Hero Image */}
            <div className="h-48 bg-gradient-to-br from-slate-200 to-slate-300 relative">
              <div className="absolute bottom-4 left-4 right-4">
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  Machu Picchu Express
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">
                    {[1,2,3,4,5].map(i => (
                      <Star 
                        key={i} 
                        className="h-4 w-4 fill-yellow-400 text-yellow-400" 
                      />
                    ))}
                  </div>
                  <span className="text-white text-sm">4.9 (127 reviews)</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Quick Info */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <Calendar className="h-5 w-5 mx-auto mb-1" style={{ color: accentColor }} />
                  <p className="text-xs text-slate-600">Duration</p>
                  <p className="font-semibold text-sm">5 Days</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <Users className="h-5 w-5 mx-auto mb-1" style={{ color: accentColor }} />
                  <p className="text-xs text-slate-600">Group Size</p>
                  <p className="font-semibold text-sm">Max 12</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <MapPin className="h-5 w-5 mx-auto mb-1" style={{ color: accentColor }} />
                  <p className="text-xs text-slate-600">Location</p>
                  <p className="font-semibold text-sm">Peru</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 
                  className="font-semibold text-lg mb-2"
                  style={{ color: primaryColor }}
                >
                  About This Tour
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Experience the magic of Machu Picchu with our expertly guided tour. 
                  Journey through the Sacred Valley and discover ancient Incan mysteries.
                </p>
              </div>

              {/* Highlights */}
              <div>
                <h3 
                  className="font-semibold mb-2"
                  style={{ color: primaryColor }}
                >
                  Highlights
                </h3>
                <div className="space-y-2">
                  {[
                    "Expert local guides",
                    "All meals included",
                    "Comfortable accommodation",
                    "Small group experience"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div 
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: accentColor }}
                      />
                      <span className="text-sm text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-500">From</p>
                  <p className="text-2xl font-bold" style={{ color: primaryColor }}>$899</p>
                </div>
                <Button 
                  size="lg"
                  style={{ 
                    backgroundColor: accentColor,
                    color: 'white'
                  }}
                  className="hover:opacity-90"
                >
                  Book Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}