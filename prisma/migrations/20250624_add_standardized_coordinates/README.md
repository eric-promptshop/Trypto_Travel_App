# Standardized Coordinates Migration

This migration adds standardized coordinate fields to multiple tables in the database to support geospatial features and location-based queries.

## Changes

### New Fields Added

1. **Content Table**
   - `coordinates` (JSONB): Stores lat/lng coordinates
   - `googlePlaceId` (TEXT): Google Place ID for the location

2. **Lead Table**
   - `destinationCoordinates` (JSONB): Coordinates of the lead's destination
   - `destinationPlaceId` (TEXT): Google Place ID for the destination

3. **LeadEnhanced Table**
   - `destinationCoordinates` (JSONB): Coordinates of the lead's destination
   - `destinationPlaceId` (TEXT): Google Place ID for the destination

4. **Itinerary Table**
   - `destinationCoordinates` (JSONB): Coordinates of the itinerary destination
   - `destinationPlaceId` (TEXT): Google Place ID for the destination

5. **Operator Table**
   - `coordinates` (JSONB): Business location coordinates
   - `googlePlaceId` (TEXT): Google Place ID for the business

6. **Tour Table**
   - `googlePlaceId` (TEXT): Google Place ID (coordinates field already existed)

### Indexes Added

GIN indexes were created on all coordinate fields for efficient geospatial queries, and B-tree indexes on all googlePlaceId fields for fast lookups.

## Coordinate Format

All coordinate fields use the following JSON format:
```json
{
  "lat": 48.8566,
  "lng": 2.3522
}
```

## Running the Migration

1. Apply the database migration:
   ```bash
   npx prisma migrate deploy
   ```

2. Run the data migration script to populate coordinates for existing records:
   ```bash
   npx tsx scripts/migrate-coordinates.ts
   ```

## Benefits

- **Consistent Format**: All location data now uses the same coordinate format
- **Google Places Integration**: Place IDs enable rich location data from Google
- **Performance**: GIN indexes enable fast geospatial queries
- **Map Features**: Enables accurate map display and distance calculations
- **Search**: Supports location-based search and filtering

## Notes

- The data migration script uses the Google Places API and includes rate limiting
- Existing records without coordinates will be geocoded based on their location strings
- The migration is idempotent - it can be run multiple times safely