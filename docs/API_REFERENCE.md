# API Reference

## Base URL
```
Production: https://travelitinerary.com/api
Staging: https://staging.travelitinerary.com/api
Development: http://localhost:3000/api
```

## Authentication

All API requests require authentication via JWT tokens provided by NextAuth.js.

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Core Endpoints

### Generate Itinerary

**POST /generate-itinerary**

Creates a new travel itinerary based on user preferences.

**Request Body:**
```json
{
  "destination": "Peru",
  "duration": 7,
  "travelers": 2,
  "budget": 3000,
  "interests": ["culture", "nature", "adventure"],
  "startDate": "2024-07-15",
  "endDate": "2024-07-22",
  "accommodationType": "hotel",
  "transportPreference": "mixed"
}
```

**Response (200):**
```json
{
  "success": true,
  "itinerary": {
    "id": "clx123456",
    "destination": "Peru",
    "totalCost": 2850,
    "days": [
      {
        "date": "2024-07-15",
        "location": "Lima",
        "activities": [
          {
            "id": "act_001",
            "name": "City Tour of Lima",
            "type": "cultural",
            "duration": 180,
            "cost": 45,
            "description": "Explore historic Lima center",
            "startTime": "09:00",
            "endTime": "12:00"
          }
        ],
        "accommodation": {
          "name": "Hotel Bolivar",
          "type": "hotel",
          "cost": 120,
          "rating": 4.2
        }
      }
    ]
  }
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid destination specified",
  "code": "INVALID_DESTINATION"
}

// 422 Unprocessable Entity
{
  "error": "Validation failed",
  "details": {
    "duration": "Duration must be between 1 and 90 days",
    "budget": "Budget must be a positive number"
  }
}
```

### Trip Management

#### Get All Trips

**GET /v1/trips**

Retrieves all trips for the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `sort` (optional): Sort field (createdAt, updatedAt, title)
- `order` (optional): Sort order (asc, desc)

**Response (200):**
```json
{
  "trips": [
    {
      "id": "trip_001",
      "title": "Peru Adventure",
      "destination": "Peru",
      "startDate": "2024-07-15",
      "endDate": "2024-07-22",
      "budget": 3000,
      "travelers": 2,
      "status": "planned",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-16T14:22:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### Create Trip

**POST /v1/trips**

Creates a new trip.

**Request Body:**
```json
{
  "title": "European Adventure",
  "destination": "France",
  "startDate": "2024-08-01",
  "endDate": "2024-08-14",
  "budget": 5000,
  "travelers": 3,
  "itinerary": {}
}
```

#### Get Single Trip

**GET /v1/trips/{id}**

Retrieves a specific trip with full itinerary details.

**Response (200):**
```json
{
  "id": "trip_001",
  "title": "Peru Adventure",
  "destination": "Peru",
  "startDate": "2024-07-15",
  "endDate": "2024-07-22",
  "budget": 3000,
  "travelers": 2,
  "itinerary": {
    "days": [...],
    "totalCost": 2850,
    "currency": "USD"
  },
  "status": "planned",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-16T14:22:00Z"
}
```

#### Update Trip

**PUT /v1/trips/{id}**

Updates an existing trip.

**PATCH /v1/trips/{id}**

Partially updates an existing trip.

#### Delete Trip

**DELETE /v1/trips/{id}**

Deletes a trip permanently.

**Response (204):** No content

### Content Management

#### Get Content

**GET /v1/content**

Retrieves travel content (destinations, activities, etc.).

**Query Parameters:**
- `type`: Content type (destination, activity, accommodation)
- `location`: Filter by location
- `category`: Filter by category
- `limit`: Items to return

**Response (200):**
```json
{
  "content": [
    {
      "id": "content_001",
      "title": "Machu Picchu",
      "description": "Ancient Incan citadel",
      "type": "destination",
      "location": "Peru",
      "metadata": {
        "coordinates": [-13.1631, -72.5450],
        "category": "historical",
        "rating": 4.8
      }
    }
  ]
}
```

#### Create Content

**POST /v1/content**

Creates new travel content (admin only).

### User Management

#### Get Current User

**GET /v1/users/me**

Returns information about the authenticated user.

**Response (200):**
```json
{
  "id": "user_001",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "preferences": {
    "defaultCurrency": "USD",
    "language": "en",
    "notifications": true
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### Update User Preferences

**PATCH /v1/users/me**

Updates user preferences.

**Request Body:**
```json
{
  "preferences": {
    "defaultCurrency": "EUR",
    "language": "fr",
    "notifications": false
  }
}
```

### Role Management (Admin Only)

#### Assign Role

**POST /v1/roles/assign**

Assigns a role to a user.

**Request Body:**
```json
{
  "userId": "user_001",
  "role": "ADMIN"
}
```

#### Revoke Role

**DELETE /v1/roles/revoke/{userId}**

Revokes roles from a user.

### Domain Management (Admin Only)

#### Get Domains

**GET /v1/domains**

Lists all configured domains for white-label deployments.

#### Deploy Domain

**POST /v1/deploy**

Deploys a new white-label instance.

## System Endpoints

### Health Check

**GET /health**

System health and status check.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "connected",
    "cache": "connected",
    "external_apis": "operational"
  },
  "version": "1.0.0"
}
```

### Documentation

**GET /docs**

Returns interactive API documentation (Swagger UI).

## Error Handling

### Standard Error Format

All errors follow this structure:

```json
{
  "error": "Human readable error message",
  "code": "ERROR_CODE",
  "details": {},
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456"
}
```

### HTTP Status Codes

- `200` OK - Request successful
- `201` Created - Resource created successfully
- `204` No Content - Request successful, no content returned
- `400` Bad Request - Invalid request format
- `401` Unauthorized - Authentication required
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource not found
- `422` Unprocessable Entity - Validation errors
- `429` Too Many Requests - Rate limit exceeded
- `500` Internal Server Error - Server error
- `503` Service Unavailable - Service temporarily unavailable

### Common Error Codes

- `INVALID_REQUEST` - Malformed request
- `AUTHENTICATION_REQUIRED` - Missing or invalid authentication
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `VALIDATION_FAILED` - Request validation errors
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVICE_UNAVAILABLE` - External service unavailable

## Rate Limiting

### Limits

- **Authenticated users:** 1000 requests per hour
- **Anonymous users:** 100 requests per hour
- **Premium users:** 5000 requests per hour

### Headers

Rate limit information is included in response headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642262400
X-RateLimit-Window: 3600
```

## Pagination

Large result sets are paginated using cursor-based pagination.

### Request Parameters

```http
GET /v1/trips?limit=20&cursor=eyJpZCI6InRyaXBfMTIzIn0
```

### Response Format

```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "hasMore": true,
    "nextCursor": "eyJpZCI6InRyaXBfMTQ1In0",
    "prevCursor": "eyJpZCI6InRyaXBfMTAxIn0"
  }
}
```

## Webhooks

### Configuration

Configure webhook endpoints in your admin dashboard.

### Events

- `trip.created` - New trip created
- `trip.updated` - Trip modified
- `trip.deleted` - Trip deleted
- `user.registered` - New user registration

### Payload Format

```json
{
  "event": "trip.created",
  "data": {
    "tripId": "trip_001",
    "userId": "user_001"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "signature": "sha256=..."
}
```

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @travelitinerary/api-client
```

### Python
```bash
pip install travelitinerary-api
```

### Examples

#### JavaScript
```javascript
import { TravelItineraryAPI } from '@travelitinerary/api-client'

const client = new TravelItineraryAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.travelitinerary.com'
})

const itinerary = await client.generateItinerary({
  destination: 'Peru',
  duration: 7,
  budget: 3000
})
```

#### Python
```python
from travelitinerary import Client

client = Client(api_key='your-api-key')
itinerary = client.generate_itinerary(
    destination='Peru',
    duration=7,
    budget=3000
)
```

## Support

- **Documentation:** https://docs.travelitinerary.com
- **Support Email:** api-support@travelitinerary.com
- **Status Page:** https://status.travelitinerary.com
- **GitHub Issues:** https://github.com/org/travel-itinerary-builder/issues