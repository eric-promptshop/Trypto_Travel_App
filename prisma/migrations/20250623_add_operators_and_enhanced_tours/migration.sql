-- AlterTable - Add missing fields to User table for operator relationships
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "operatorId" TEXT;

-- CreateTable - Operators (tour operators and agencies)
CREATE TABLE IF NOT EXISTS "operators" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "coverImage" TEXT,
    "address" JSONB,
    "timezone" TEXT DEFAULT 'UTC',
    "languages" TEXT[],
    "currencies" TEXT[] DEFAULT ARRAY['USD'],
    "certifications" JSONB,
    "settings" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verifiedAt" TIMESTAMP(3),
    "subscription" JSONB,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operators_pkey" PRIMARY KEY ("id")
);

-- CreateTable - Tours (enhanced from content table)
CREATE TABLE IF NOT EXISTS "tours" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "destination" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "coordinates" JSONB,
    "duration" INTEGER NOT NULL,
    "durationType" TEXT NOT NULL DEFAULT 'hours',
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "priceType" TEXT NOT NULL DEFAULT 'per_person',
    "groupSize" JSONB,
    "categories" TEXT[],
    "difficulty" TEXT,
    "languages" TEXT[],
    "images" JSONB NOT NULL,
    "videos" JSONB,
    "highlights" TEXT[],
    "included" TEXT[],
    "excluded" TEXT[],
    "itinerary" JSONB,
    "startingPoint" TEXT,
    "endingPoint" TEXT,
    "meetingInstructions" TEXT,
    "cancellationPolicy" TEXT,
    "healthAndSafety" TEXT,
    "accessibility" TEXT,
    "schedule" JSONB,
    "availability" JSONB,
    "metadata" JSONB,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "reviewCount" INTEGER DEFAULT 0,
    "viewCount" INTEGER DEFAULT 0,
    "bookingCount" INTEGER DEFAULT 0,
    "externalId" TEXT,
    "sourceUrl" TEXT,
    "lastScrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable - Enhanced Leads with full context
CREATE TABLE IF NOT EXISTS "leads_enhanced" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "source" TEXT NOT NULL,
    "sourceDetails" JSONB,
    "destination" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "flexibleDates" BOOLEAN DEFAULT false,
    "travelers" INTEGER DEFAULT 1,
    "budget" JSONB,
    "interests" TEXT[],
    "specialRequests" TEXT,
    "itinerary" JSONB,
    "tourIds" TEXT[],
    "context" JSONB,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "referrer" TEXT,
    "utmParams" JSONB,
    "score" INTEGER DEFAULT 0,
    "tags" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'new',
    "engagementHistory" JSONB,
    "lastEngagedAt" TIMESTAMP(3),
    "crmId" TEXT,
    "crmSyncStatus" TEXT,
    "crmSyncedAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "notes" TEXT,
    "optInMarketing" BOOLEAN DEFAULT true,
    "optInTimestamp" TIMESTAMP(3),
    "operatorId" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_enhanced_pkey" PRIMARY KEY ("id")
);

-- CreateTable - Lead Activities for tracking engagement
CREATE TABLE IF NOT EXISTS "lead_activities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable - Bookings
CREATE TABLE IF NOT EXISTS "bookings" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "leadId" TEXT,
    "userId" TEXT,
    "operatorId" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "travelDate" DATE NOT NULL,
    "travelers" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "specialRequests" TEXT,
    "internalNotes" TEXT,
    "customerDetails" JSONB NOT NULL,
    "confirmationSentAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable - Reviews
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "bookingId" TEXT,
    "userId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "images" TEXT[],
    "helpful" INTEGER DEFAULT 0,
    "verified" BOOLEAN DEFAULT false,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable - Widget Configurations
CREATE TABLE IF NOT EXISTS "widget_configs" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'itinerary_builder',
    "theme" JSONB NOT NULL,
    "features" TEXT[],
    "domains" TEXT[],
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "analytics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widget_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable - Integrations
CREATE TABLE IF NOT EXISTS "integrations" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "credentials" JSONB,
    "webhooks" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "operators_slug_key" ON "operators"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "operators_email_key" ON "operators"("email");
CREATE INDEX IF NOT EXISTS "operators_tenantId_idx" ON "operators"("tenantId");
CREATE INDEX IF NOT EXISTS "operators_status_idx" ON "operators"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tours_slug_operatorId_key" ON "tours"("slug", "operatorId");
CREATE INDEX IF NOT EXISTS "tours_operatorId_idx" ON "tours"("operatorId");
CREATE INDEX IF NOT EXISTS "tours_destination_idx" ON "tours"("destination");
CREATE INDEX IF NOT EXISTS "tours_status_idx" ON "tours"("status");
CREATE INDEX IF NOT EXISTS "tours_featured_idx" ON "tours"("featured");
CREATE INDEX IF NOT EXISTS "tours_categories_idx" ON "tours" USING GIN ("categories");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "leads_enhanced_email_idx" ON "leads_enhanced"("email");
CREATE INDEX IF NOT EXISTS "leads_enhanced_operatorId_idx" ON "leads_enhanced"("operatorId");
CREATE INDEX IF NOT EXISTS "leads_enhanced_tenantId_idx" ON "leads_enhanced"("tenantId");
CREATE INDEX IF NOT EXISTS "leads_enhanced_status_idx" ON "leads_enhanced"("status");
CREATE INDEX IF NOT EXISTS "leads_enhanced_createdAt_idx" ON "leads_enhanced"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lead_activities_leadId_idx" ON "lead_activities"("leadId");
CREATE INDEX IF NOT EXISTS "lead_activities_type_idx" ON "lead_activities"("type");
CREATE INDEX IF NOT EXISTS "lead_activities_createdAt_idx" ON "lead_activities"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "bookings_bookingNumber_key" ON "bookings"("bookingNumber");
CREATE INDEX IF NOT EXISTS "bookings_tourId_idx" ON "bookings"("tourId");
CREATE INDEX IF NOT EXISTS "bookings_operatorId_idx" ON "bookings"("operatorId");
CREATE INDEX IF NOT EXISTS "bookings_userId_idx" ON "bookings"("userId");
CREATE INDEX IF NOT EXISTS "bookings_leadId_idx" ON "bookings"("leadId");
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings"("status");
CREATE INDEX IF NOT EXISTS "bookings_travelDate_idx" ON "bookings"("travelDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviews_tourId_idx" ON "reviews"("tourId");
CREATE INDEX IF NOT EXISTS "reviews_bookingId_idx" ON "reviews"("bookingId");
CREATE INDEX IF NOT EXISTS "reviews_userId_idx" ON "reviews"("userId");
CREATE INDEX IF NOT EXISTS "reviews_status_idx" ON "reviews"("status");
CREATE INDEX IF NOT EXISTS "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "widget_configs_apiKey_key" ON "widget_configs"("apiKey");
CREATE INDEX IF NOT EXISTS "widget_configs_operatorId_idx" ON "widget_configs"("operatorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "integrations_operatorId_idx" ON "integrations"("operatorId");
CREATE INDEX IF NOT EXISTS "integrations_type_idx" ON "integrations"("type");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operators" ADD CONSTRAINT "operators_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads_enhanced" ADD CONSTRAINT "leads_enhanced_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads_enhanced" ADD CONSTRAINT "leads_enhanced_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads_enhanced"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads_enhanced"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widget_configs" ADD CONSTRAINT "widget_configs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;