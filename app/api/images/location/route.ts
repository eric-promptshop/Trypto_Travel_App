import { NextRequest, NextResponse } from 'next/server'
import { getLocationImage, getImageUrl } from '@/lib/services/unsplash-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get('location')
    const width = searchParams.get('width') || '800'
    const height = searchParams.get('height') || '400'
    
    if (!location) {
      return NextResponse.json(
        { error: 'Location parameter is required' },
        { status: 400 }
      )
    }
    
    // Get image from Unsplash
    const image = await getLocationImage(location)
    
    if (!image) {
      // Return a placeholder URL if no image found
      return NextResponse.json({
        url: `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(location)},travel,landscape`,
        isPlaceholder: true
      })
    }
    
    // Return the image URL with specified dimensions
    return NextResponse.json({
      url: getImageUrl(image, parseInt(width), parseInt(height)),
      description: image.description || image.alt_description,
      credit: {
        name: image.user.name,
        username: image.user.username
      },
      blurHash: image.blur_hash,
      isPlaceholder: false
    })
  } catch (error) {
    console.error('Error fetching location image:', error)
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    )
  }
}