'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  PrintShareActions, 
  ItineraryData 
} from './print-share-actions';
import { 
  useShareAnalytics, 
  ShareAnalyticsDashboard 
} from './share-analytics';

// Sample itinerary data for demo
const SAMPLE_ITINERARY: ItineraryData = {
  id: 'demo-trip-001',
  title: 'Amazing Peru Adventure',
  destination: 'Peru',
  dates: {
    start: '2024-03-15',
    end: '2024-03-22',
  },
  travelers: 2,
  days: [
    {
      date: '2024-03-15',
      activities: [
        {
          time: '2:30 PM',
          title: 'Flight to Lima',
          description: 'American Airlines AA1145 from Miami to Jorge Chávez International Airport',
          location: 'Miami International Airport',
          type: 'flight',
          status: 'confirmed',
          confirmationNumber: 'AA1145LIMA',
          notes: 'Check-in opens 24 hours before departure. Gate information available 2 hours before flight.',
        },
        {
          time: '10:45 PM',
          title: 'Arrival in Lima',
          description: 'Arrive at Jorge Chávez International Airport, collect luggage and take taxi to hotel',
          location: 'Jorge Chávez International Airport, Lima',
          type: 'transport',
          status: 'confirmed',
        },
        {
          time: '11:30 PM',
          title: 'Hotel Check-in',
          description: 'Check into Hilton Lima Miraflores for overnight stay before connecting flight',
          location: 'Hilton Lima Miraflores',
          type: 'hotel',
          status: 'confirmed',
          confirmationNumber: 'HILTON789456',
        },
      ],
    },
    {
      date: '2024-03-16',
      activities: [
        {
          time: '7:00 AM',
          title: 'Hotel Breakfast',
          description: 'Continental breakfast at hotel restaurant before departing for Cusco',
          location: 'Hilton Lima Miraflores',
          type: 'meal',
          status: 'confirmed',
        },
        {
          time: '10:30 AM',
          title: 'Flight to Cusco',
          description: 'LATAM Airlines LA2025 from Lima to Alejandro Velasco Astete International Airport',
          location: 'Jorge Chávez International Airport, Lima',
          type: 'flight',
          status: 'confirmed',
          confirmationNumber: 'LA2025CUSCO',
        },
        {
          time: '12:15 PM',
          title: 'Arrival in Cusco',
          description: 'Arrive in Cusco and acclimatize to the altitude (11,200 feet)',
          location: 'Alejandro Velasco Astete International Airport, Cusco',
          type: 'activity',
          status: 'confirmed',
          notes: 'Take it slow for the first day to adjust to altitude. Drink plenty of water.',
        },
        {
          time: '2:00 PM',
          title: 'Hotel Check-in',
          description: 'Check into Casa Andina Premium Cusco for 3-night stay',
          location: 'Casa Andina Premium Cusco',
          type: 'hotel',
          status: 'confirmed',
          confirmationNumber: 'CASA123789',
        },
        {
          time: '4:00 PM',
          title: 'Cusco City Walking Tour',
          description: 'Guided walking tour of historic Cusco including Plaza de Armas and Qorikancha',
          location: 'Plaza de Armas, Cusco',
          type: 'activity',
          status: 'confirmed',
          notes: 'Wear comfortable walking shoes and bring sun protection.',
        },
        {
          time: '7:30 PM',
          title: 'Traditional Peruvian Dinner',
          description: 'Authentic Peruvian cuisine at Chicha por Gastón Acurio',
          location: 'Chicha por Gastón Acurio, Cusco',
          type: 'meal',
          status: 'confirmed',
        },
      ],
    },
    {
      date: '2024-03-17',
      activities: [
        {
          time: '6:00 AM',
          title: 'Sacred Valley Tour Departure',
          description: 'Full-day Sacred Valley tour including Pisac Market and Ollantaytambo',
          location: 'Hotel pickup',
          type: 'activity',
          status: 'confirmed',
          notes: 'Bring layers as weather can change quickly in the mountains.',
        },
        {
          time: '9:30 AM',
          title: 'Pisac Market Visit',
          description: 'Explore traditional Andean market with local textiles and crafts',
          location: 'Pisac, Sacred Valley',
          type: 'activity',
          status: 'confirmed',
        },
        {
          time: '1:00 PM',
          title: 'Lunch in Sacred Valley',
          description: 'Traditional buffet lunch with Andean specialties',
          location: 'Sacred Valley Restaurant',
          type: 'meal',
          status: 'confirmed',
        },
        {
          time: '3:00 PM',
          title: 'Ollantaytambo Fortress',
          description: 'Explore ancient Inca ruins and terraces at Ollantaytambo',
          location: 'Ollantaytambo Archaeological Site',
          type: 'activity',
          status: 'confirmed',
          notes: 'Entrance included in Sacred Valley ticket. Bring water and camera.',
        },
        {
          time: '6:30 PM',
          title: 'Return to Cusco',
          description: 'Return transfer to hotel in Cusco',
          location: 'Casa Andina Premium Cusco',
          type: 'transport',
          status: 'confirmed',
        },
      ],
    },
    {
      date: '2024-03-18',
      activities: [
        {
          time: '4:00 AM',
          title: 'Machu Picchu Train Departure',
          description: 'Train to Aguas Calientes (Machu Picchu Pueblo) via PeruRail',
          location: 'Ollantaytambo Train Station',
          type: 'transport',
          status: 'confirmed',
          confirmationNumber: 'PERURAIL456123',
          notes: 'Early departure required. Hotel will provide breakfast box.',
        },
        {
          time: '7:30 AM',
          title: 'Arrival at Aguas Calientes',
          description: 'Arrive at Machu Picchu Pueblo and board bus to citadel',
          location: 'Aguas Calientes, Peru',
          type: 'transport',
          status: 'confirmed',
        },
        {
          time: '8:30 AM',
          title: 'Machu Picchu Guided Tour',
          description: 'Comprehensive guided tour of the ancient Inca citadel',
          location: 'Machu Picchu Citadel',
          type: 'activity',
          status: 'confirmed',
          notes: 'Bring passport for entry. No large bags allowed. Photography permitted in most areas.',
        },
        {
          time: '12:00 PM',
          title: 'Lunch at Machu Picchu',
          description: 'Lunch at Belmond Sanctuary Lodge with citadel views',
          location: 'Belmond Sanctuary Lodge',
          type: 'meal',
          status: 'confirmed',
        },
        {
          time: '2:00 PM',
          title: 'Free Time at Machu Picchu',
          description: 'Additional time to explore and take photos at your own pace',
          location: 'Machu Picchu Citadel',
          type: 'activity',
          status: 'confirmed',
        },
        {
          time: '4:30 PM',
          title: 'Return Train to Cusco',
          description: 'Return journey to Cusco via PeruRail with scenic mountain views',
          location: 'Aguas Calientes Train Station',
          type: 'transport',
          status: 'confirmed',
          confirmationNumber: 'PERURAIL789456',
        },
        {
          time: '8:00 PM',
          title: 'Arrival in Cusco',
          description: 'Late evening arrival back at hotel in Cusco',
          location: 'Casa Andina Premium Cusco',
          type: 'transport',
          status: 'confirmed',
        },
      ],
    },
  ],
  contacts: [
    {
      type: 'emergency',
      name: 'US Embassy Lima',
      phone: '+51-1-618-2000',
      email: 'lima-acs@state.gov',
    },
    {
      type: 'hotel',
      name: 'Casa Andina Premium Cusco',
      phone: '+51-84-232-610',
      email: 'cusco@casa-andina.com',
    },
    {
      type: 'local',
      name: 'Peru Travel Guide - Carlos',
      phone: '+51-984-123-456',
      email: 'carlos@peruguide.com',
    },
  ],
  notes: [
    'Altitude sickness prevention: Drink plenty of water, avoid alcohol first day, take it slow',
    'Weather can be unpredictable in the mountains - pack layers',
    'Always carry passport - required for Machu Picchu entry',
    'Tipping guide: 10-15% at restaurants, 5-10 soles for tour guides',
    'Keep copies of important documents separate from originals',
  ],
};

interface PrintShareDemoProps {
  className?: string;
  showAnalytics?: boolean;
}

export const PrintShareDemo: React.FC<PrintShareDemoProps> = ({
  className,
  showAnalytics = true,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<'buttons' | 'dropdown' | 'toolbar'>('buttons');
  const [showLabels, setShowLabels] = useState(true);
  const [lastShareEvent, setLastShareEvent] = useState<string | null>(null);
  const { trackShare } = useShareAnalytics();

  // Handle share events for demo
  const handleShare = (method: string, success: boolean) => {
    // Track the share event
    trackShare(method, success, {
      id: SAMPLE_ITINERARY.id,
      destination: SAMPLE_ITINERARY.destination,
    });

    // Show feedback
    setLastShareEvent(`${method} share ${success ? 'successful' : 'failed'}`);
    setTimeout(() => setLastShareEvent(null), 3000);
  };

  return (
    <div className={cn('max-w-6xl mx-auto space-y-8', className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Print & Share Functionality Demo
        </h2>
        <p className="text-lg text-gray-600">
          Professional print layouts, multi-platform sharing, and comprehensive analytics
        </p>
      </div>

      {/* Sample Itinerary Preview */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{SAMPLE_ITINERARY.title}</h3>
            <p className="text-gray-600">
              {SAMPLE_ITINERARY.destination} • {SAMPLE_ITINERARY.dates.start} to {SAMPLE_ITINERARY.dates.end} • {SAMPLE_ITINERARY.travelers} travelers
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Sample itinerary for demonstration
          </div>
        </div>

        {/* Itinerary content preview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Day 1 Preview - {SAMPLE_ITINERARY.days[0]?.date || 'N/A'}</h4>
          <div className="space-y-2">
            {SAMPLE_ITINERARY.days[0]?.activities.slice(0, 2).map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="text-sm font-medium text-tripnav-navy w-16">{activity.time}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{activity.title}</div>
                  <div className="text-sm text-gray-600">{activity.description}</div>
                </div>
              </div>
            )) || []}
            <div className="text-sm text-gray-500 italic">...and {SAMPLE_ITINERARY.days.reduce((total, day) => total + day.activities.length, 0) - 2} more activities</div>
          </div>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Customize Display</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variant Style
            </label>
            <select
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-tripnav-navy focus:border-transparent"
            >
              <option value="buttons">Action Buttons</option>
              <option value="dropdown">Single Dropdown</option>
              <option value="toolbar">Compact Toolbar</option>
            </select>
          </div>
          
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="rounded border-gray-300 text-tripnav-navy focus:ring-tripnav-navy"
              />
              <span className="text-sm font-medium text-gray-700">Show Labels</span>
            </label>
          </div>

          <div>
            {lastShareEvent && (
              <div className="text-sm px-3 py-2 bg-green-50 text-green-700 rounded-md border border-green-200">
                ✅ {lastShareEvent}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print & Share Actions Demo */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Print & Share Actions</h3>
        <div className="space-y-4">
          <PrintShareActions
            itinerary={SAMPLE_ITINERARY}
            variant={selectedVariant}
            showLabels={showLabels}
            onShare={handleShare}
            className="justify-center"
          />
          
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>Try it out:</strong> Click any action above to see the functionality. 
            Print opens browser print dialog, share options open in new windows/tabs, 
            and QR codes are generated automatically. All events are tracked for analytics.
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="text-2xl mb-3">🖨️</div>
          <h4 className="font-semibold text-gray-900 mb-2">Professional Print Layout</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Optimized for letter-size paper</li>
            <li>• Print-specific CSS styling</li>
            <li>• Automatic page breaks</li>
            <li>• QR code inclusion</li>
            <li>• Clean, professional formatting</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="text-2xl mb-3">🔗</div>
          <h4 className="font-semibold text-gray-900 mb-2">Multi-Platform Sharing</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Email with pre-filled content</li>
            <li>• Social media integration</li>
            <li>• WhatsApp sharing</li>
            <li>• Copy link to clipboard</li>
            <li>• QR code generation</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="text-2xl mb-3">📊</div>
          <h4 className="font-semibold text-gray-900 mb-2">Advanced Analytics</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Share method tracking</li>
            <li>• Success/failure rates</li>
            <li>• Device breakdown</li>
            <li>• Popular destinations</li>
            <li>• Data export capabilities</li>
          </ul>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Share Analytics Dashboard</h3>
          <ShareAnalyticsDashboard 
            showRawData={process.env.NODE_ENV === 'development'}
          />
        </div>
      )}

      {/* Implementation Notes */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3">Implementation Features</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>🎯 Production Ready:</strong> Includes error handling, fallbacks, and cross-browser compatibility.
          </p>
          <p>
            <strong>🚀 Performance Optimized:</strong> Lazy loading, efficient analytics storage, and minimal bundle impact.
          </p>
          <p>
            <strong>🔐 Privacy Focused:</strong> Local analytics storage with optional external tracking integration.
          </p>
          <p>
            <strong>📱 Responsive Design:</strong> Works seamlessly across desktop, tablet, and mobile devices.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintShareDemo; 