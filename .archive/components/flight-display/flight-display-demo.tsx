'use client';

import React from 'react';
import { FlightCard, Flight } from './index';

// Sample flight data that matches our Flight interface
const sampleFlights: Flight[] = [
  {
    id: 'flight-outbound-1',
    bookingReference: 'ABC123',
    type: 'outbound',
    segments: [
      {
        id: 'segment-1',
        airline: 'American Airlines',
        flightNumber: 'AA2345',
        departure: {
          airport: 'JFK',
          city: 'New York',
          time: '14:30',
          date: '2024-03-15',
          timezone: 'EST',
          gate: 'A12',
          terminal: '8'
        },
        arrival: {
          airport: 'LIM',
          city: 'Lima',
          time: '23:45',
          date: '2024-03-15',
          timezone: 'PET',
          gate: 'B5',
          terminal: '1'
        },
        duration: '8h 15m',
        aircraft: 'Boeing 787-9',
        class: 'business',
        status: 'on-time'
      }
    ],
    passengers: {
      adults: 2,
      children: 1
    },
    totalDuration: '8h 15m',
    baggage: {
      carry: '1 carry-on bag (22 lbs)',
      checked: '2 checked bags (50 lbs each)'
    },
    seatAssignments: ['3A', '3B', '3C'],
    specialRequests: ['Vegetarian meal', 'Window seat preference'],
    bookingClass: 'business',
    price: {
      amount: 1250,
      currency: '$'
    }
  },
  {
    id: 'flight-connecting-1',
    bookingReference: 'DEF456',
    type: 'multi-city',
    segments: [
      {
        id: 'segment-2a',
        airline: 'United Airlines',
        flightNumber: 'UA1234',
        departure: {
          airport: 'LAX',
          city: 'Los Angeles',
          time: '09:15',
          date: '2024-03-20',
          timezone: 'PST',
          gate: 'C15'
        },
        arrival: {
          airport: 'IAH',
          city: 'Houston',
          time: '14:30',
          date: '2024-03-20',
          timezone: 'CST',
          gate: 'D8'
        },
        duration: '3h 15m',
        aircraft: 'Airbus A320',
        class: 'economy',
        status: 'delayed',
        delay: '45 min'
      },
      {
        id: 'segment-2b',
        airline: 'United Airlines',
        flightNumber: 'UA5678',
        departure: {
          airport: 'IAH',
          city: 'Houston',
          time: '16:45',
          date: '2024-03-20',
          timezone: 'CST',
          gate: 'D12'
        },
        arrival: {
          airport: 'GRU',
          city: 'São Paulo',
          time: '06:30',
          date: '2024-03-21',
          timezone: 'BRT',
          gate: 'E3'
        },
        duration: '9h 45m',
        aircraft: 'Boeing 777-300ER',
        class: 'economy',
        status: 'scheduled'
      }
    ],
    layovers: [
      {
        airport: 'IAH',
        city: 'Houston',
        duration: '2h 15m',
        terminal: 'D'
      }
    ],
    passengers: {
      adults: 2
    },
    totalDuration: '15h 15m',
    baggage: {
      carry: '1 carry-on bag (22 lbs)',
      checked: '1 checked bag (50 lbs)'
    },
    seatAssignments: ['24F', '24E'],
    bookingClass: 'economy',
    price: {
      amount: 850,
      currency: '$'
    }
  },
  {
    id: 'flight-return-1',
    bookingReference: 'GHI789',
    type: 'return',
    segments: [
      {
        id: 'segment-3',
        airline: 'Emirates',
        flightNumber: 'EK201',
        departure: {
          airport: 'GIG',
          city: 'Rio de Janeiro',
          time: '22:30',
          date: '2024-03-28',
          timezone: 'BRT'
        },
        arrival: {
          airport: 'JFK',
          city: 'New York',
          time: '11:45',
          date: '2024-03-29',
          timezone: 'EST'
        },
        duration: '9h 15m',
        aircraft: 'Airbus A380',
        class: 'first',
        status: 'in-flight'
      }
    ],
    passengers: {
      adults: 1
    },
    totalDuration: '9h 15m',
    baggage: {
      carry: '2 carry-on bags (22 lbs each)',
      checked: '2 checked bags (70 lbs each)'
    },
    seatAssignments: ['1A'],
    specialRequests: ['Kosher meal', 'Extra legroom'],
    bookingClass: 'first',
    price: {
      amount: 3200,
      currency: '$'
    }
  },
  {
    id: 'flight-cancelled-1',
    bookingReference: 'JKL012',
    type: 'outbound',
    segments: [
      {
        id: 'segment-4',
        airline: 'Delta Air Lines',
        flightNumber: 'DL3456',
        departure: {
          airport: 'ATL',
          city: 'Atlanta',
          time: '08:00',
          date: '2024-03-25',
          timezone: 'EST'
        },
        arrival: {
          airport: 'CUZ',
          city: 'Cusco',
          time: '15:30',
          date: '2024-03-25',
          timezone: 'PET'
        },
        duration: '7h 30m',
        aircraft: 'Boeing 737-800',
        class: 'economy',
        status: 'cancelled'
      }
    ],
    passengers: {
      adults: 4,
      children: 2
    },
    totalDuration: '7h 30m',
    bookingClass: 'economy',
    price: {
      amount: 450,
      currency: '$'
    }
  }
];

export const FlightDisplayDemo: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-tripnav-blue mb-2">
          Flight Display Components Demo
        </h1>
        <p className="text-gray-600">
          Showcasing the comprehensive flight display components for TripNav itinerary builder
        </p>
      </div>

      {/* Compact Variant */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Compact View (for itinerary lists)
        </h2>
        <div className="space-y-4">
          {sampleFlights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              variant="compact"
              showProgress={false}
              showDetails={false}
              showBaggage={false}
            />
          ))}
        </div>
      </section>

      {/* Default Variant */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Default View (balanced detail with progress)
        </h2>
        <div className="space-y-6">
          <FlightCard
            flight={sampleFlights[0]!}
            variant="default"
            showProgress={true}
            showDetails={false}
            showBaggage={false}
          />
        </div>
      </section>

      {/* Detailed Variant */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Detailed View (full information with collapsible sections)
        </h2>
        <div className="space-y-6">
          <FlightCard
            flight={sampleFlights[1]!}
            variant="detailed"
            showProgress={true}
            showDetails={true}
            showBaggage={true}
          />
        </div>
      </section>

      {/* Different Flight Statuses */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Flight Status Variations
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FlightCard
            flight={sampleFlights[2]!}
            variant="default"
            showProgress={true}
            showDetails={false}
          />
          <FlightCard
            flight={sampleFlights[3]!}
            variant="default"
            showProgress={true}
            showDetails={false}
          />
        </div>
      </section>

      {/* Integration Notes */}
      <section className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Flight Component Features
        </h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>• <strong>Flight Timeline:</strong> Visual representation with departure/arrival times, layovers, and flight duration</p>
          <p>• <strong>Airline Information:</strong> Airline branding, logos, flight numbers, and aircraft details</p>
          <p>• <strong>Flight Status:</strong> Real-time status indicators with appropriate colors and icons</p>
          <p>• <strong>Progress Tracking:</strong> Visual progress bar showing flight journey status</p>
          <p>• <strong>Multi-segment Support:</strong> Handles connecting flights and layovers</p>
          <p>• <strong>Mobile Responsive:</strong> Optimized layouts for mobile and desktop</p>
          <p>• <strong>Accessibility:</strong> Screen reader support and keyboard navigation</p>
          <p>• <strong>Timezone Handling:</strong> Displays times with appropriate timezone information</p>
          <p>• <strong>Collapsible Details:</strong> Organized information in expandable sections</p>
          <p>• <strong>TripNav Styling:</strong> Consistent navy blue and orange color scheme</p>
        </div>
      </section>
    </div>
  );
}; 