-- AlterTable: Add standardized coordinate fields to Content table
ALTER TABLE "content" ADD COLUMN "coordinates" JSONB;
ALTER TABLE "content" ADD COLUMN "googlePlaceId" TEXT;

-- AlterTable: Add coordinate fields to Lead table
ALTER TABLE "leads" ADD COLUMN "destinationCoordinates" JSONB;
ALTER TABLE "leads" ADD COLUMN "destinationPlaceId" TEXT;

-- AlterTable: Add coordinate fields to LeadEnhanced table
ALTER TABLE "leads_enhanced" ADD COLUMN "destinationCoordinates" JSONB;
ALTER TABLE "leads_enhanced" ADD COLUMN "destinationPlaceId" TEXT;

-- AlterTable: Add coordinate fields to Itinerary table
ALTER TABLE "itineraries" ADD COLUMN "destinationCoordinates" JSONB;
ALTER TABLE "itineraries" ADD COLUMN "destinationPlaceId" TEXT;

-- AlterTable: Add coordinate fields to Operator table (for business location)
ALTER TABLE "operators" ADD COLUMN "coordinates" JSONB;
ALTER TABLE "operators" ADD COLUMN "googlePlaceId" TEXT;

-- AlterTable: Standardize Tour coordinates format (add googlePlaceId)
ALTER TABLE "tours" ADD COLUMN "googlePlaceId" TEXT;

-- Create indexes for better geospatial queries
CREATE INDEX "content_coordinates_idx" ON "content" USING GIN ("coordinates");
CREATE INDEX "content_googlePlaceId_idx" ON "content" ("googlePlaceId");

CREATE INDEX "leads_destinationCoordinates_idx" ON "leads" USING GIN ("destinationCoordinates");
CREATE INDEX "leads_destinationPlaceId_idx" ON "leads" ("destinationPlaceId");

CREATE INDEX "leads_enhanced_destinationCoordinates_idx" ON "leads_enhanced" USING GIN ("destinationCoordinates");
CREATE INDEX "leads_enhanced_destinationPlaceId_idx" ON "leads_enhanced" ("destinationPlaceId");

CREATE INDEX "itineraries_destinationCoordinates_idx" ON "itineraries" USING GIN ("destinationCoordinates");
CREATE INDEX "itineraries_destinationPlaceId_idx" ON "itineraries" ("destinationPlaceId");

CREATE INDEX "operators_coordinates_idx" ON "operators" USING GIN ("coordinates");
CREATE INDEX "operators_googlePlaceId_idx" ON "operators" ("googlePlaceId");

CREATE INDEX "tours_coordinates_idx" ON "tours" USING GIN ("coordinates");
CREATE INDEX "tours_googlePlaceId_idx" ON "tours" ("googlePlaceId");

-- Add comment to describe coordinate format
COMMENT ON COLUMN "content"."coordinates" IS 'JSON object with lat and lng properties: {"lat": number, "lng": number}';
COMMENT ON COLUMN "tours"."coordinates" IS 'JSON object with lat and lng properties: {"lat": number, "lng": number}';
COMMENT ON COLUMN "leads"."destinationCoordinates" IS 'JSON object with lat and lng properties: {"lat": number, "lng": number}';
COMMENT ON COLUMN "leads_enhanced"."destinationCoordinates" IS 'JSON object with lat and lng properties: {"lat": number, "lng": number}';
COMMENT ON COLUMN "itineraries"."destinationCoordinates" IS 'JSON object with lat and lng properties: {"lat": number, "lng": number}';
COMMENT ON COLUMN "operators"."coordinates" IS 'JSON object with lat and lng properties: {"lat": number, "lng": number}';

-- Migration to populate coordinates for existing tours that have location data
-- This would be run separately as a data migration script
-- UPDATE tours 
-- SET coordinates = jsonb_build_object('lat', 0, 'lng', 0)
-- WHERE coordinates IS NULL AND destination IS NOT NULL;