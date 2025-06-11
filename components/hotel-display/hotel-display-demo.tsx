'use client';

import React from 'react';
import { HotelCard, Hotel } from './index';

// Sample hotel data that matches our Hotel interface
const sampleHotels: Hotel[] = [
  {
    id: 'hotel-lima-1',
    name: 'Belmond Hotel Monasterio',
    address: 'Plazoleta Nazarenas 337, San Blas',
    city: 'Cusco',
    country: 'Peru',
    coordinates: {
      lat: -13.5164,
      lng: -71.9786
    },
    rating: 4.8,
    category: 'Luxury',
    images: [
      '/images/hotels/monasterio-1.jpg',
      '/images/hotels/monasterio-2.jpg',
      '/images/hotels/monasterio-3.jpg'
    ],
    checkIn: '3:00 PM',
    checkOut: '12:00 PM',
    amenities: [
      'Free WiFi',
      'Restaurant',
      'Bar',
      'Fitness Center',
      'Spa',
      'Room Service',
      'Business Center',
      'Concierge',
      'Laundry Service',
      'Tour Desk',
      'Oxygen Enriched Rooms',
      'Chapel'
    ],
    description: 'A former 16th-century monastery transformed into a luxury hotel, featuring oxygen-enriched rooms to help with altitude acclimatization in Cusco.',
    policies: {
      checkIn: '3:00 PM',
      checkOut: '12:00 PM',
      cancellation: 'Free cancellation up to 24 hours before arrival',
      pets: 'Pets not allowed',
      children: 'Children welcome, extra bed available for additional charge',
      additionalInfo: [
        'Oxygen enrichment system in all rooms',
        'Historic building from 1592',
        'Located in UNESCO World Heritage Site'
      ]
    },
    contact: {
      phone: '+51-84-604000',
      email: 'reservations.monasterio@belmond.com',
      website: 'https://www.belmond.com/hotels/south-america/peru/cusco/belmond-hotel-monasterio/'
    },
    rooms: [
      {
        id: 'superior-room',
        name: 'Superior Room',
        description: 'Elegantly appointed room with colonial furnishings and modern amenities',
        occupancy: {
          adults: 2,
          children: 1,
          maxGuests: 3
        },
        bedConfiguration: '1 King Bed or 2 Twin Beds',
        size: '320 sq ft',
        images: [
          '/images/rooms/superior-1.jpg',
          '/images/rooms/superior-2.jpg'
        ],
        amenities: [
          'Oxygen enrichment system',
          'Minibar',
          'Safe',
          'Hair dryer',
          'Bathrobes',
          'Slippers'
        ],
        price: {
          amount: 450,
          currency: '$',
          period: 'per night'
        }
      },
      {
        id: 'presidential-suite',
        name: 'Presidential Suite',
        description: 'Luxurious suite with separate living area and stunning city views',
        occupancy: {
          adults: 4,
          children: 2,
          maxGuests: 6
        },
        bedConfiguration: '1 King Bed + Sofa Bed',
        size: '850 sq ft',
        images: [
          '/images/rooms/presidential-1.jpg',
          '/images/rooms/presidential-2.jpg'
        ],
        amenities: [
          'Oxygen enrichment system',
          'Separate living area',
          'Jacuzzi',
          'Butler service',
          'Premium minibar',
          'City view terrace'
        ],
        price: {
          amount: 1200,
          currency: '$',
          period: 'per night'
        }
      }
    ]
  },
  {
    id: 'hotel-lima-2',
    name: 'Copacabana Palace Hotel',
    address: 'Avenida Atlântica, 1702',
    city: 'Rio de Janeiro',
    country: 'Brazil',
    coordinates: {
      lat: -22.9675,
      lng: -43.1802
    },
    rating: 4.6,
    category: 'Luxury',
    images: [
      '/images/hotels/copacabana-1.jpg',
      '/images/hotels/copacabana-2.jpg'
    ],
    checkIn: '3:00 PM',
    checkOut: '12:00 PM',
    amenities: [
      'Free WiFi',
      'Beach Access',
      'Pool',
      'Spa',
      'Multiple Restaurants',
      'Bar',
      'Fitness Center',
      'Business Center',
      'Valet Parking',
      'Concierge'
    ],
    description: 'An iconic luxury hotel directly on Copacabana Beach, known for its glamorous history and impeccable service.',
    contact: {
      phone: '+55-21-2548-7070',
      email: 'reservations@copacabanapalace.com.br',
      website: 'https://www.belmond.com/hotels/south-america/brazil/rio-de-janeiro/belmond-copacabana-palace/'
    }
  },
  {
    id: 'hotel-budget',
    name: 'Lima Backpackers',
    address: 'Av. José Larco 189',
    city: 'Lima',
    country: 'Peru',
    rating: 3.2,
    category: 'Budget',
    images: [
      '/images/hotels/backpackers-1.jpg'
    ],
    checkIn: '2:00 PM',
    checkOut: '11:00 AM',
    amenities: [
      'Free WiFi',
      'Shared Kitchen',
      'Common Area',
      'Laundry Facilities',
      'Tour Desk'
    ],
    description: 'Budget-friendly accommodation in the heart of Miraflores, perfect for backpackers and budget travelers.',
    contact: {
      phone: '+51-1-446-5488',
      website: 'https://www.limabackpackers.com'
    }
  }
];

export const HotelDisplayDemo: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-tripnav-blue mb-2">
          Hotel Display Components Demo
        </h1>
        <p className="text-gray-600">
          Showcasing the enhanced hotel display components for TripNav itinerary builder
        </p>
      </div>

      {/* Compact Variant */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Compact View (for itinerary lists)
        </h2>
        <div className="space-y-4">
          {sampleHotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              variant="compact"
              showRooms={false}
              showMap={false}
              showContact={false}
              showPolicies={false}
            />
          ))}
        </div>
      </section>

      {/* Default Variant */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Default View (balanced detail)
        </h2>
        <div className="space-y-6">
          <HotelCard
            hotel={sampleHotels[0]!}
            variant="default"
            showRooms={false}
            showMap={false}
            showContact={false}
            showPolicies={false}
          />
        </div>
      </section>

      {/* Detailed Variant */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Detailed View (full information with collapsible sections)
        </h2>
        <div className="space-y-6">
          <HotelCard
            hotel={sampleHotels[0]!}
            variant="detailed"
            showRooms={true}
            showMap={true}
            showContact={true}
            showPolicies={true}
          />
        </div>
      </section>

      {/* Different Hotel Tiers */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Different Hotel Categories (Luxury, Budget)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HotelCard
            hotel={sampleHotels[1]!}
            variant="default"
            showRooms={false}
          />
          <HotelCard
            hotel={sampleHotels[2]!}
            variant="default"
            showRooms={false}
          />
        </div>
      </section>

      {/* Integration Notes */}
      <section className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Integration Notes
        </h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>• <strong>Variant Selection:</strong> Use 'compact' for itinerary lists, 'default' for hotel details, 'detailed' for full hotel pages</p>
          <p>• <strong>Conditional Rendering:</strong> Toggle sections based on available data and UI requirements</p>
          <p>• <strong>Responsive Design:</strong> All components adapt to mobile and desktop layouts</p>
          <p>• <strong>Accessibility:</strong> Full keyboard navigation and screen reader support</p>
          <p>• <strong>Performance:</strong> Images are optimized with Next.js Image component</p>
          <p>• <strong>Theming:</strong> Uses TripNav color scheme with CSS custom properties</p>
        </div>
      </section>
    </div>
  );
}; 