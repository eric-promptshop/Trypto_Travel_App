# Technical Design Document: AI Travel Planner

**Version:** 2.1  
**Date:** June 24, 2025  
**Author:** Gemini

## 1. System Overview & Architecture

This document outlines the technical design for the AI Travel Planner. The architecture is designed for a fluid, interactive user experience, scalability, and rapid development.

### 1.1. Core Technology Stack
- **Frontend:** Next.js (React) hosted on Vercel.
- **Backend & DB:** Supabase (PostgreSQL, Auth, Edge Functions, Storage).
- **AI Services:** Replicate for custom AI model execution.
- **Mapping & POI Services:** Google Maps Platform (Maps JavaScript API, Places API).

## 2. Frontend Architecture (Next.js)

The frontend will be a responsive SPA experience built with Next.js.

### 2.1. Key Application Sections
- **Traveler Itinerary Canvas:** The core interactive planning interface. This component will be designed to be "sandboxed" for the operator preview feature.
- **Tour Template Library:** A new public-facing set of pages, likely under `/explore`, built using Next.js for SSG (Static Site Generation) to ensure fast load times and SEO benefits. Each published tour template will have its own static page.
- **Tour Operator Dashboard:** An SSR-rendered application for operators to manage their tours, leads, and integrations.

## 3. Backend Architecture (Supabase)

### 3.1. Database Schema

```sql
-- operators table
CREATE TABLE operators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  company_name TEXT NOT NULL,
  website_url TEXT
);

-- tours table
CREATE TABLE tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID REFERENCES operators(id),
  title TEXT NOT NULL,
  description TEXT,
  -- A 'published' tour is a "template" discoverable by all users.
  -- A 'draft' tour is only visible to its owner for preview and editing.
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused')),
  -- Additional fields like price, duration, etc.
  itinerary_data JSONB -- Stores the structured, geocoded itinerary items.
);

-- leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID REFERENCES tours(id),
  -- Traveler and trip details...
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'booked'))
);
```

### 3.2. Serverless Edge Functions
- **import-from-url:** Scrapes operator websites to create draft tours.
- **generate-itinerary:** Generates a full trip plan from a traveler's prompt.
- **create-lead-from-trip:** Creates a lead and sends an email notification.

## 4. API Endpoints

### 4.1. Operator API (Authenticated)
- `POST /api/operator/tours/import-from-url`: Initiates AI web scraping.
- `GET /api/operator/tours`: Fetches all tours (draft and published) for the logged-in operator.
- `GET /api/operator/tours/:id?preview=true`: **New:** Fetches a single draft tour's data to power the Live Itinerary Preview feature.
- `PUT /api/operator/tours/:id`: Updates a tour, including changing its status from 'draft' to 'published'.
- `GET /api/operator/dashboard`: Retrieves stats for the dashboard.
- `GET /api/operator/leads`: Fetches leads for the operator.

### 4.2. Public/Traveler API
- `GET /api/tours/templates`: **New:** A public endpoint to fetch all tours where status = 'published'. This powers the Tour Template Library and will support searching and filtering.
- `POST /api/trips/generate`: Creates a new trip using AI based on user prompt.
- `PUT /api/trips/:id`: Updates a traveler's specific trip itinerary.

## 5. Key Feature Logic

### 5.1. Operator Live Preview
- In the operator dashboard, a "Preview" button will be available for any tour with a status of 'draft'.
- Clicking this button will open a new page or modal. This view will render the main ItineraryCanvas component.
- The component will be passed the draft tour's ID. It will then call the new `GET /api/operator/tours/:id?preview=true` endpoint to fetch the draft data.
- The ItineraryCanvas will render this draft data exactly as a traveler would see it, providing a high-fidelity, read-only preview. This ensures the operator has full confidence before publishing.

### 5.2. Tour Template System
- When an operator updates a tour's status to 'published', that tour becomes part of the public tour template library.
- The public `/explore` pages on the frontend will call the `GET /api/tours/templates` endpoint to display these published tours.
- When a traveler selects a template, its structured itinerary_data is used as the starting point for their own new, unique trip plan.