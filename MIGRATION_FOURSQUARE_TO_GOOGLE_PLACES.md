# Migration Guide: Foursquare to Google Places API

This guide helps you migrate from Foursquare API to Google Places API in the Travel Itinerary Builder application.

## Overview

We've replaced the Foursquare Places API with Google Places API throughout the application for better reliability, more detailed data, and broader coverage.

## Steps to Complete Migration

### 1. Update Environment Variables

In your `.env.local` file:

**Remove:**
```
FOURSQUARE_API_KEY=your-foursquare-key
```

**Add:**
```
GOOGLE_PLACES_API_KEY=your-google-places-api-key
```

### 2. Obtain and Configure Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. **IMPORTANT**: Enable the **Places API (New)** from the API Library:
   - Go to "APIs & Services" → "Library"
   - Search for "Places API"
   - Click on "Places API (New)" 
   - Click "ENABLE"
4. Go to **Credentials** and create a new API key
5. (Optional) Restrict the API key:
   - For development: Add `localhost:3000` to HTTP referrer restrictions
   - For production: Add your domain(s)
   - Or use IP restrictions for server-side only usage

**Common Issues:**
- "REQUEST_DENIED" error: The Places API is not enabled for your project
- "Invalid API key": The key doesn't exist or has incorrect restrictions
- No results: Check that your location format is correct (e.g., "Paris, France")

### 3. API Key Configuration Options

The Google Places service will check for API keys in this order:
1. `GOOGLE_PLACES_API_KEY` (recommended)
2. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (if you already have Google Maps configured)

### 4. Features and Improvements

The Google Places integration provides:
- ✅ More detailed place information
- ✅ Better search relevance
- ✅ Editorial summaries for attractions
- ✅ Real-time opening hours
- ✅ User reviews integration
- ✅ High-quality photos via Google
- ✅ More place categories (entertainment, shopping, culture)

### 5. API Differences

#### Categories
Foursquare categories → Google Places types:
- `attractions` → tourist_attraction, museum, art_gallery
- `restaurants` → restaurant, cafe, food
- `accommodation` → lodging, hotel, hostel
- `entertainment` → night_club, bar, movie_theater (NEW)
- `shopping` → shopping_mall, store, market (NEW)
- `culture` → museum, art_gallery, church, temple (NEW)

#### Response Format
The place data structure remains the same for compatibility:
```typescript
interface PlaceData {
  id: string
  name: string
  category: PlaceCategory
  description: string
  location: PlaceLocation
  rating?: number
  reviewCount?: number
  priceLevel?: number
  imageUrl?: string
  isOpen?: boolean
  categories: string[]
  website?: string
  phone?: string
  tips?: string[]
  relevanceScore?: number
}
```

### 6. Testing the Migration

Test your Google Places integration:
```bash
# Test the API endpoint
curl http://localhost:3000/api/places/test?location=Paris&type=attractions

# Or use the POST endpoint for comprehensive testing
curl -X POST http://localhost:3000/api/places/test \
  -H "Content-Type: application/json" \
  -d '{"location": "Paris", "interests": ["culture", "food"]}'
```

### 7. Fallback Behavior

If the Google Places API key is not configured or the API fails:
- The system automatically falls back to high-quality demo data
- No functionality is lost - users can still explore the application
- A warning is logged in the console for debugging

### 8. Cost Considerations

Google Places API pricing:
- **Basic Data**: $17 per 1,000 requests
- **Contact & Atmosphere Data**: $20 per 1,000 requests
- **$200 free credit** monthly for all Google Maps Platform APIs

To minimize costs:
- The implementation uses Text Search (not Nearby Search) for efficiency
- Results are limited by default
- Consider implementing caching for frequently searched locations

### 9. Cleanup

After confirming the migration works:
1. Delete `/lib/services/foursquare.ts` (no longer needed)
2. Remove any Foursquare-related documentation
3. Update any API documentation to reference Google Places

## Troubleshooting

**"Google Places API unavailable" error:**
- Check that your API key is correctly set in `.env.local`
- Verify the Places API is enabled in Google Cloud Console
- Check API key restrictions

**No results returned:**
- Verify the location string format (e.g., "Paris, France" or "New York, NY")
- Check if the category filter is too restrictive
- Try increasing the search radius

**Rate limiting:**
- Google Places API has generous rate limits
- If you hit limits, implement request caching
- Consider upgrading your Google Cloud plan

## Support

For issues with:
- **Google Places API**: Check [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- **Application Integration**: Open an issue in the project repository