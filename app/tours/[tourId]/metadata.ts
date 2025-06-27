import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

interface Props {
  params: { tourId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tourId = params.tourId
  
  try {
    // Fetch tour data
    const tour = await prisma.content.findFirst({
      where: {
        id: tourId,
        type: 'activity',
        active: true
      }
    })
    
    if (!tour) {
      return {
        title: 'Tour Not Found | TripNav',
        description: 'The requested tour could not be found.',
      }
    }
    
    // Parse metadata
    const metadata = tour.metadata ? JSON.parse(tour.metadata) : {}
    const images = tour.images ? JSON.parse(tour.images) : []
    
    const tourTitle = `${tour.name} | ${tour.city}, ${tour.country} | TripNav`
    const tourDescription = tour.description || `Experience ${tour.name} in ${tour.city}. Book this amazing tour with verified local operators.`
    
    return {
      title: tourTitle,
      description: tourDescription,
      keywords: `${tour.name}, ${tour.city} tours, ${tour.country} experiences, ${metadata.category || 'tours'}, ${metadata.operatorName || 'local operator'}`,
      openGraph: {
        title: tourTitle,
        description: tourDescription,
        type: 'website',
        url: `https://tripnav.com/tours/${tourId}`,
        images: images.length > 0 ? [
          {
            url: images[0],
            width: 1200,
            height: 630,
            alt: tour.name,
          }
        ] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: tour.name,
        description: tourDescription,
        images: images.length > 0 ? [images[0]] : undefined,
      },
      alternates: {
        canonical: `https://tripnav.com/tours/${tourId}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Tour Details | TripNav',
      description: 'View tour details and book your next adventure with TripNav.',
    }
  }
}

// Generate static params for popular tours
export async function generateStaticParams() {
  try {
    const tours = await prisma.content.findMany({
      where: {
        type: 'activity',
        active: true,
        featured: true
      },
      select: {
        id: true
      },
      take: 100 // Pre-generate top 100 featured tours
    })
    
    return tours.map((tour) => ({
      tourId: tour.id,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}