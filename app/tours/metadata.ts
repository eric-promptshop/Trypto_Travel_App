import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore Amazing Tours Worldwide | TripNav',
  description: 'Discover curated tours and experiences from trusted local operators. Browse thousands of verified tours in destinations around the world.',
  keywords: 'tours, travel experiences, guided tours, local operators, vacation activities, sightseeing tours',
  openGraph: {
    title: 'Explore Amazing Tours Worldwide | TripNav',
    description: 'Discover curated tours and experiences from trusted local operators worldwide.',
    type: 'website',
    url: 'https://tripnav.com/tours',
    images: [
      {
        url: 'https://tripnav.com/og-tours.jpg',
        width: 1200,
        height: 630,
        alt: 'TripNav Tours - Explore the World',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore Amazing Tours Worldwide | TripNav',
    description: 'Discover curated tours and experiences from trusted local operators.',
    images: ['https://tripnav.com/og-tours.jpg'],
  },
  alternates: {
    canonical: 'https://tripnav.com/tours',
  },
}