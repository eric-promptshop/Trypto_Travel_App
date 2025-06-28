# Tour API Route Mappings

## Migration Date: 2025-06-28T00:00:00.000Z

| Operation | Method | Old Route | New Route | Status |
|-----------|--------|-----------|-----------|---------|
| Create Tour | POST | /api/tour-operator/tours | /api/v1/tours | ✅ |
| Get Tours | GET | /api/tour-operator/tours | /api/v1/tours | ✅ |
| Get Tour by ID | GET | /api/tour-operator/tours/[tourId] | /api/v1/tours/[tourId] | ✅ |
| Update Tour | PUT | /api/tour-operator/tours/[tourId] | /api/v1/tours/[tourId] | ✅ |
| Delete Tour | POST | /api/tour-operator/tours/[tourId] | /api/v1/tours/[tourId]/archive | ✅ |
| Search Tours | GET | /api/tours/discover | /api/v1/tours/search | ✅ |

## Usage Examples

### Before (Old API)
```javascript
// Create tour
fetch('/api/tour-operator/tours', {
  method: 'POST',
  body: JSON.stringify(tourData)
})

// Get tours
fetch('/api/tour-operator/tours')

// Update tour
fetch(`/api/tour-operator/tours/${tourId}`, {
  method: 'PUT',
  body: JSON.stringify(updates)
})
```

### After (New API)
```javascript
// Create tour
fetch('/api/v1/tours', {
  method: 'POST',
  body: JSON.stringify(tourData)
})

// Get tours
fetch('/api/v1/tours')

// Update tour
fetch(`/api/v1/tours/${tourId}`, {
  method: 'PUT',
  body: JSON.stringify(updates)
})

// Publish tour (new endpoint)
fetch(`/api/v1/tours/${tourId}/publish`, {
  method: 'POST'
})

// Archive tour (replaces delete)
fetch(`/api/v1/tours/${tourId}/archive`, {
  method: 'POST'
})
```

## Response Format Changes

### Old Format
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### New Format
```json
{
  "id": "...",
  "title": "...",
  "status": "...",
  // Direct response without wrapper
}
```

## Error Handling

### Old Format
```json
{
  "success": false,
  "error": "Error message"
}
```

### New Format
```json
{
  "error": "Error message",
  "details": [
    { "field": "title", "message": "Title is required" }
  ]
}
```