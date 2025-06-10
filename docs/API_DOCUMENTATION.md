# API Documentation - Travel Itinerary Builder

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Webhooks](#webhooks)
9. [API Versioning](#api-versioning)
10. [Code Examples](#code-examples)

## Introduction

The Travel Itinerary Builder API provides programmatic access to create, manage, and customize travel itineraries. This RESTful API uses JSON for data exchange and follows standard HTTP conventions.

### Base URLs

```
Production:  https://api.travelitinerary.com
Staging:     https://staging-api.travelitinerary.com
Development: http://localhost:3000/api
```

### API Key Management

API keys can be generated through your dashboard at `https://app.travelitinerary.com/settings/api-keys`

## Getting Started

### Quick Start

1. **Get your API key** from the dashboard
2. **Make your first request**:

```bash
curl -X GET "https://api.travelitinerary.com/v1/health" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### SDK Installation

#### JavaScript/TypeScript
```bash
npm install @travelitinerary/sdk
# or
yarn add @travelitinerary/sdk
```

#### Python
```bash
pip install travelitinerary-sdk
```

## Authentication

### Bearer Token Authentication

All API requests require authentication using JWT tokens:

```http
Authorization: Bearer <your_jwt_token>
```

### OAuth 2.0 Flow

For third-party integrations, we support OAuth 2.0:

1. **Authorization Request**
```
GET https://api.travelitinerary.com/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  response_type=code&
  scope=read:trips write:trips
```

2. **Token Exchange**
```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=AUTHORIZATION_CODE&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET
```

### API Key Authentication (Legacy)

For backward compatibility:
```http
X-API-Key: your_api_key
```

## API Endpoints

### Itinerary Generation

#### Generate AI-Powered Itinerary

**POST** `/v1/itineraries/generate`

Creates a personalized travel itinerary using AI.

**Request Body:**
```json
{
  "destination": "Peru",
  "duration": 7,
  "startDate": "2024-07-15",
  "endDate": "2024-07-22",
  "travelers": {
    "adults": 2,
    "children": 0,
    "infants": 0
  },
  "budget": {
    "amount": 3000,
    "currency": "USD",
    "includes": ["accommodation", "activities", "transportation"]
  },
  "preferences": {
    "interests": ["culture", "nature", "adventure"],
    "accommodationType": ["hotel", "boutique"],
    "pace": "moderate",
    "dietaryRestrictions": ["vegetarian"],
    "accessibilityNeeds": []
  },
  "constraints": {
    "mustVisit": ["Machu Picchu"],
    "avoid": ["crowded_places"],
    "maxDailyDistance": 200
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "itineraryId": "itin_abc123xyz",
    "status": "generated",
    "destination": "Peru",
    "duration": 7,
    "totalCost": {
      "amount": 2850,
      "currency": "USD",
      "breakdown": {
        "accommodation": 840,
        "activities": 650,
        "transportation": 460,
        "meals": 700,
        "miscellaneous": 200
      }
    },
    "days": [
      {
        "day": 1,
        "date": "2024-07-15",
        "location": {
          "city": "Lima",
          "country": "Peru",
          "coordinates": {
            "lat": -12.0464,
            "lng": -77.0428
          }
        },
        "activities": [
          {
            "id": "act_lima001",
            "name": "Historic Lima Walking Tour",
            "type": "cultural",
            "startTime": "09:00",
            "endTime": "12:00",
            "duration": 180,
            "cost": {
              "amount": 45,
              "currency": "USD",
              "perPerson": true
            },
            "location": {
              "name": "Plaza de Armas",
              "address": "Plaza de Armas, Lima 15001",
              "coordinates": {
                "lat": -12.0453,
                "lng": -77.0311
              }
            },
            "description": "Explore Lima's historic center including the Cathedral, Government Palace, and colonial architecture",
            "bookingRequired": true,
            "bookingUrl": "https://partner.com/book/lima001",
            "rating": 4.5,
            "reviews": 1234
          }
        ],
        "accommodation": {
          "id": "hotel_lima001",
          "name": "Hotel Bolivar",
          "type": "hotel",
          "checkIn": "2024-07-15T15:00:00",
          "checkOut": "2024-07-16T11:00:00",
          "cost": {
            "amount": 120,
            "currency": "USD",
            "perNight": true
          },
          "location": {
            "address": "Jr. de la Union 958, Lima 15001",
            "coordinates": {
              "lat": -12.0486,
              "lng": -77.0367
            }
          },
          "amenities": ["wifi", "breakfast", "gym", "restaurant"],
          "rating": 4.2,
          "bookingUrl": "https://partner.com/hotel/lima001"
        },
        "transportation": [
          {
            "type": "airport_transfer",
            "from": "Jorge Chavez International Airport",
            "to": "Hotel Bolivar",
            "departureTime": "14:00",
            "arrivalTime": "15:00",
            "cost": {
              "amount": 30,
              "currency": "USD"
            },
            "provider": "Private Transfer",
            "bookingRequired": true
          }
        ],
        "meals": {
          "breakfast": {
            "included": true,
            "location": "Hotel"
          },
          "lunch": {
            "suggestion": "Central Restaurant",
            "estimatedCost": 50
          },
          "dinner": {
            "suggestion": "La Mar Cebicheria",
            "estimatedCost": 40
          }
        }
      }
    ],
    "summary": {
      "totalDistance": 850,
      "citiesVisited": ["Lima", "Cusco", "Aguas Calientes"],
      "highlightActivities": ["Machu Picchu", "Sacred Valley", "Lima Historic Tour"],
      "averageDailyCost": 407
    },
    "metadata": {
      "generatedAt": "2024-01-15T10:30:00Z",
      "aiModel": "gpt-4-travel-v2",
      "confidence": 0.92
    }
  }
}
```

### Trip Management

#### List All Trips

**GET** `/v1/trips`

Retrieves all trips for the authenticated user with pagination and filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 10 | Items per page (max: 100) |
| sort | string | createdAt | Sort field |
| order | string | desc | Sort order (asc/desc) |
| status | string | - | Filter by status |
| destination | string | - | Filter by destination |
| dateFrom | date | - | Filter trips starting after |
| dateTo | date | - | Filter trips ending before |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "id": "trip_abc123",
        "title": "Summer in Peru",
        "destination": "Peru",
        "startDate": "2024-07-15",
        "endDate": "2024-07-22",
        "status": "upcoming",
        "travelers": 2,
        "budget": 3000,
        "thumbnailUrl": "https://cdn.travelitinerary.com/trips/abc123/thumb.jpg",
        "tags": ["adventure", "culture"],
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-16T14:22:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Get Trip Details

**GET** `/v1/trips/{tripId}`

Retrieves detailed information about a specific trip.

**Path Parameters:**
- `tripId` (required): The unique trip identifier

**Query Parameters:**
- `include`: Comma-separated list of related data to include
  - `itinerary`: Full itinerary details
  - `travelers`: Traveler information
  - `documents`: Associated documents
  - `expenses`: Expense tracking

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "trip_abc123",
    "title": "Summer in Peru",
    "description": "A week-long adventure through Peru's highlights",
    "destination": {
      "country": "Peru",
      "cities": ["Lima", "Cusco", "Aguas Calientes"],
      "mainLocation": "Peru"
    },
    "dates": {
      "start": "2024-07-15",
      "end": "2024-07-22",
      "duration": 7,
      "flexible": false
    },
    "travelers": {
      "count": 2,
      "details": [
        {
          "id": "trav_001",
          "name": "John Doe",
          "type": "adult",
          "isPrimary": true
        },
        {
          "id": "trav_002",
          "name": "Jane Doe",
          "type": "adult",
          "isPrimary": false
        }
      ]
    },
    "budget": {
      "planned": 3000,
      "spent": 1250,
      "currency": "USD"
    },
    "status": "upcoming",
    "visibility": "private",
    "itinerary": {
      // Full itinerary object as shown in generate response
    },
    "metadata": {
      "source": "ai_generated",
      "version": 2,
      "lastModified": "2024-01-16T14:22:00Z"
    }
  }
}
```

#### Create Trip

**POST** `/v1/trips`

Creates a new trip from scratch or from an existing itinerary.

**Request Body:**
```json
{
  "title": "European Adventure",
  "description": "Two weeks exploring Western Europe",
  "destination": "France",
  "startDate": "2024-08-01",
  "endDate": "2024-08-14",
  "travelers": 3,
  "budget": 5000,
  "itineraryId": "itin_xyz789", // Optional: Link to generated itinerary
  "visibility": "private",
  "tags": ["europe", "summer", "family"]
}
```

#### Update Trip

**PUT** `/v1/trips/{tripId}`

Updates an entire trip (full replacement).

**PATCH** `/v1/trips/{tripId}`

Partially updates specific fields of a trip.

**Request Body (PATCH example):**
```json
{
  "title": "Amazing European Adventure",
  "budget": 5500,
  "tags": ["europe", "summer", "family", "cities"]
}
```

#### Delete Trip

**DELETE** `/v1/trips/{tripId}`

Permanently deletes a trip and all associated data.

**Query Parameters:**
- `cascade` (boolean): Delete all associated data (default: true)

**Response (204 No Content)**

### Activity Management

#### Search Activities

**GET** `/v1/activities/search`

Search for activities in a specific location.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| location | string | Yes | City or region |
| category | string | No | Activity category |
| date | date | No | Activity date |
| minPrice | number | No | Minimum price |
| maxPrice | number | No | Maximum price |
| duration | string | No | Duration range |
| rating | number | No | Minimum rating |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "act_xyz123",
        "name": "Inca Trail Trek",
        "category": "adventure",
        "location": {
          "city": "Cusco",
          "country": "Peru"
        },
        "duration": {
          "days": 4,
          "hours": 0
        },
        "price": {
          "from": 550,
          "currency": "USD"
        },
        "rating": 4.8,
        "availability": "daily",
        "description": "Classic 4-day trek to Machu Picchu",
        "images": [
          "https://cdn.travelitinerary.com/activities/xyz123/1.jpg"
        ]
      }
    ],
    "totalResults": 45,
    "facets": {
      "categories": {
        "adventure": 12,
        "cultural": 18,
        "nature": 15
      },
      "priceRanges": {
        "0-50": 20,
        "50-100": 15,
        "100+": 10
      }
    }
  }
}
```

### Accommodation

#### Search Accommodations

**GET** `/v1/accommodations/search`

Search for hotels and other accommodations.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| location | string | Yes | City or address |
| checkIn | date | Yes | Check-in date |
| checkOut | date | Yes | Check-out date |
| guests | integer | No | Number of guests |
| rooms | integer | No | Number of rooms |
| type | string | No | Accommodation type |
| amenities | array | No | Required amenities |
| minPrice | number | No | Minimum price per night |
| maxPrice | number | No | Maximum price per night |

### AI Features

#### Chat with AI Travel Assistant

**POST** `/v1/ai/chat`

Interactive chat with AI travel assistant for trip planning.

**Request Body:**
```json
{
  "message": "I want to visit Peru but I'm afraid of altitude sickness",
  "context": {
    "tripId": "trip_abc123", // Optional
    "conversation": [
      {
        "role": "user",
        "content": "Previous message"
      },
      {
        "role": "assistant", 
        "content": "Previous response"
      }
    ]
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "response": "I understand your concern about altitude sickness in Peru. Here are some tips...",
    "suggestions": [
      "Spend 2-3 days acclimatizing in Cusco",
      "Consider medication like Diamox",
      "Stay hydrated and avoid alcohol"
    ],
    "relatedActivities": [
      {
        "id": "act_acc001",
        "name": "Cusco Acclimatization Tour",
        "description": "Gentle city tour perfect for first days"
      }
    ]
  }
}
```

#### Get Pricing Insights

**POST** `/v1/ai/pricing-insights`

Get AI-powered pricing analysis and recommendations.

**Request Body:**
```json
{
  "destination": "Peru",
  "dates": {
    "start": "2024-07-15",
    "end": "2024-07-22"
  },
  "travelers": 2,
  "preferences": {
    "accommodationType": "hotel",
    "comfort": "moderate"
  }
}
```

### Admin Endpoints

#### Theme Management

**GET** `/v1/admin/themes`

List all available themes (admin only).

**POST** `/v1/admin/themes`

Create a new theme.

**Request Body:**
```json
{
  "name": "Ocean Blue",
  "description": "A calming blue theme inspired by the ocean",
  "colors": {
    "primary": "#0066CC",
    "secondary": "#00A3E0",
    "accent": "#FFB800",
    "background": "#F5F8FA",
    "text": "#1A202C"
  },
  "typography": {
    "fontFamily": "Inter, sans-serif",
    "headingFont": "Playfair Display, serif"
  },
  "settings": {
    "borderRadius": "8px",
    "shadowIntensity": "medium"
  }
}
```

#### Client Management

**GET** `/v1/admin/clients`

List all white-label clients.

**POST** `/v1/admin/clients/{clientId}/deploy`

Deploy a white-label instance.

### Analytics

#### Track Event

**POST** `/v1/analytics/track`

Track user behavior and events.

**Request Body:**
```json
{
  "event": "itinerary_generated",
  "properties": {
    "destination": "Peru",
    "duration": 7,
    "budget": 3000,
    "aiModel": "gpt-4"
  },
  "context": {
    "userAgent": "Mozilla/5.0...",
    "ip": "192.168.1.1",
    "referrer": "https://google.com"
  }
}
```

## Data Models

### Trip Object

```typescript
interface Trip {
  id: string;
  title: string;
  description?: string;
  destination: string | Destination;
  startDate: string;
  endDate: string;
  duration: number;
  travelers: number | TravelerDetails[];
  budget: number | Budget;
  status: 'draft' | 'planned' | 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  visibility: 'private' | 'shared' | 'public';
  itinerary?: Itinerary;
  tags: string[];
  metadata: {
    source: string;
    version: number;
    lastModified: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Itinerary Object

```typescript
interface Itinerary {
  id: string;
  destination: string;
  duration: number;
  totalCost: Money;
  days: ItineraryDay[];
  summary: ItinerarySummary;
  metadata: {
    generatedAt: string;
    aiModel: string;
    confidence: number;
  };
}
```

### Activity Object

```typescript
interface Activity {
  id: string;
  name: string;
  type: 'cultural' | 'adventure' | 'nature' | 'food' | 'shopping' | 'relaxation';
  description: string;
  duration: number; // minutes
  cost: Money;
  location: Location;
  startTime: string;
  endTime: string;
  bookingRequired: boolean;
  bookingUrl?: string;
  rating?: number;
  reviews?: number;
  images?: string[];
  accessibility?: AccessibilityInfo;
}
```

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "fields": {
        "destination": "Destination is required",
        "duration": "Duration must be between 1 and 90 days"
      }
    },
    "requestId": "req_abc123xyz",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTHENTICATION_REQUIRED | 401 | Missing or invalid authentication |
| INVALID_TOKEN | 401 | JWT token is invalid or expired |
| INSUFFICIENT_PERMISSIONS | 403 | User lacks required permissions |
| RESOURCE_NOT_FOUND | 404 | Requested resource doesn't exist |
| VALIDATION_ERROR | 422 | Request validation failed |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_SERVER_ERROR | 500 | Server error occurred |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

### Error Recovery

For transient errors (5xx), implement exponential backoff:

```javascript
async function makeRequestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status < 500) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

## Rate Limiting

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642262400
X-RateLimit-Window: 3600
X-RateLimit-Retry-After: 3600
```

### Rate Limit Tiers

| Tier | Requests/Hour | Burst Limit | Cost |
|------|---------------|-------------|------|
| Free | 100 | 10/min | $0 |
| Starter | 1,000 | 50/min | $29/mo |
| Professional | 10,000 | 200/min | $99/mo |
| Enterprise | Custom | Custom | Contact |

### Handling Rate Limits

When rate limited, the API returns:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please retry after 3600 seconds",
    "details": {
      "limit": 1000,
      "remaining": 0,
      "reset": 1642262400,
      "retryAfter": 3600
    }
  }
}
```

## Webhooks

### Webhook Configuration

Configure webhooks through the API:

**POST** `/v1/webhooks`

```json
{
  "url": "https://your-server.com/webhooks/travel",
  "events": ["trip.created", "trip.updated", "itinerary.generated"],
  "secret": "your_webhook_secret",
  "active": true
}
```

### Webhook Events

| Event | Description | Payload |
|-------|-------------|---------|
| trip.created | New trip created | Trip object |
| trip.updated | Trip modified | Trip object with changes |
| trip.deleted | Trip deleted | Trip ID |
| itinerary.generated | AI itinerary created | Itinerary object |
| booking.confirmed | Booking confirmed | Booking details |
| user.registered | New user signup | User object |

### Webhook Security

Verify webhook signatures:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## API Versioning

### Version Strategy

- Current version: `v1`
- Version included in URL path: `/v1/endpoint`
- Deprecated versions supported for 12 months
- Breaking changes require new version

### Version Headers

Request specific API version:
```http
Accept: application/vnd.travelitinerary.v1+json
```

Response includes version:
```http
X-API-Version: v1
X-API-Deprecated: false
```

## Code Examples

### JavaScript/TypeScript

```typescript
import { TravelItineraryClient } from '@travelitinerary/sdk';

const client = new TravelItineraryClient({
  apiKey: process.env.TRAVEL_API_KEY,
  version: 'v1'
});

// Generate an itinerary
async function createPeruTrip() {
  try {
    const itinerary = await client.itineraries.generate({
      destination: 'Peru',
      duration: 7,
      startDate: '2024-07-15',
      travelers: { adults: 2 },
      budget: { amount: 3000, currency: 'USD' },
      preferences: {
        interests: ['culture', 'nature'],
        pace: 'moderate'
      }
    });
    
    console.log('Generated itinerary:', itinerary);
    
    // Create a trip from the itinerary
    const trip = await client.trips.create({
      title: 'Summer in Peru',
      itineraryId: itinerary.id
    });
    
    return trip;
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Python

```python
from travelitinerary import Client
from datetime import date

client = Client(api_key=os.environ['TRAVEL_API_KEY'])

# Search for activities
activities = client.activities.search(
    location='Cusco',
    category='adventure',
    min_price=50,
    max_price=200
)

for activity in activities:
    print(f"{activity.name}: ${activity.price.from_price}")

# Generate and save itinerary
itinerary = client.itineraries.generate(
    destination='Peru',
    duration=7,
    start_date=date(2024, 7, 15),
    travelers={'adults': 2},
    budget={'amount': 3000, 'currency': 'USD'}
)

trip = client.trips.create(
    title='Peru Adventure',
    itinerary_id=itinerary.id
)
```

### cURL Examples

```bash
# Generate itinerary
curl -X POST https://api.travelitinerary.com/v1/itineraries/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Peru",
    "duration": 7,
    "travelers": {"adults": 2},
    "budget": {"amount": 3000, "currency": "USD"}
  }'

# List trips with filters
curl -X GET "https://api.travelitinerary.com/v1/trips?status=upcoming&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update trip
curl -X PATCH https://api.travelitinerary.com/v1/trips/trip_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Amazing Peru Adventure",
    "tags": ["bucket-list", "photography"]
  }'
```

## Support & Resources

### Documentation
- API Reference: https://docs.travelitinerary.com/api
- SDKs: https://github.com/travelitinerary/sdks
- Tutorials: https://docs.travelitinerary.com/tutorials

### Community
- Discord: https://discord.gg/travelitinerary
- Stack Overflow: Tag `travelitinerary-api`
- GitHub Discussions: https://github.com/travelitinerary/api/discussions

### Support Channels
- Email: api-support@travelitinerary.com
- Enterprise Support: enterprise@travelitinerary.com
- Status Page: https://status.travelitinerary.com