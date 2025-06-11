# Travel Content Taxonomy

## Overview

This taxonomy provides a comprehensive hierarchical structure for categorizing travel-related content. It's designed to support automatic tagging, content organization, and improved search/retrieval in the travel itinerary builder system.

## Structure

### Content Categories

The taxonomy defines 8 main content categories:

1. **Destinations** - Places to visit (cities, natural areas, attractions)
2. **Activities** - Things to do (tours, adventures, cultural experiences)
3. **Accommodations** - Places to stay (hotels, rentals, unique lodging)
4. **Transportation** - Ways to travel (flights, trains, local transport)
5. **Dining** - Food and restaurants
6. **Shopping** - Markets, malls, and shopping experiences
7. **Practical Information** - Travel requirements, local info, tips
8. **Itineraries** - Complete travel plans and schedules

### Hierarchical Organization

Each category has a multi-level hierarchy. For example:

```
Activity
├── Sightseeing & Tours
│   ├── City Tours
│   │   ├── Walking Tours
│   │   ├── Bus Tours
│   │   └── Bike Tours
│   └── Guided Tours
├── Outdoor & Adventure
│   ├── Water Sports
│   │   ├── Diving
│   │   ├── Surfing
│   │   └── Kayaking
│   └── Hiking & Trekking
└── Cultural Experiences
    ├── Museums & Galleries
    └── Local Experiences
```

### Geographic Hierarchy

Destinations are organized by:
- Continent
- Region
- Country
- State/Province
- City

### Attributes

Content can be tagged with various attributes:

- **Price Range**: $ (budget) to $$$$ (luxury)
- **Duration**: Quick (0-2h), Half-day, Full-day, Multi-day
- **Difficulty**: Easy, Moderate, Challenging, Extreme
- **Suitability**: Families, Couples, Solo, Groups, Business

## Usage

### TypeScript Implementation

```typescript
import { TravelTaxonomy, TaxonomyHelper } from './travel-taxonomy';

// Get keywords for a category
const beachKeywords = TravelTaxonomy.destination.types.beach.keywords;

// Match text to categories
const matches = TaxonomyHelper.matchCategories(
  "Snorkeling tour in the coral reef",
  0.7 // confidence threshold
);

// Get hierarchical path
const path = TaxonomyHelper.getCategoryPath('diving');
// Returns: ['activity', 'outdoor_adventure', 'water_sports', 'diving']
```

### JSON Format

The taxonomy is also available in JSON format (`travel-taxonomy.json`) for easy integration with other systems.

### Tagging Strategy

1. **Primary Category**: Assign the main content type (destination, activity, etc.)
2. **Subcategories**: Apply relevant subcategories based on content analysis
3. **Attributes**: Add price, duration, difficulty, and suitability tags
4. **Keywords**: Use associated keywords for improved searchability
5. **Geographic Tags**: For destinations, add continent/region/country tags

### Confidence Scoring

When automatically tagging content:
- **High Confidence (0.8-1.0)**: Direct keyword matches, clear category indicators
- **Medium Confidence (0.6-0.8)**: Partial matches, related terms
- **Low Confidence (< 0.6)**: Weak associations, consider manual review

## Extension Guidelines

### Adding New Categories

1. Identify the parent category
2. Define unique keywords that don't overlap with existing categories
3. Add synonyms and related terms
4. Update both TypeScript and JSON files
5. Test with sample content

### Localization

The taxonomy supports multiple languages by:
- Adding translated keywords to existing categories
- Maintaining language-specific synonym lists
- Using locale codes in keyword arrays

## Integration Points

### Content Processing Pipeline

1. **Web Scraper**: Uses taxonomy to identify content types during extraction
2. **Document Parser**: Maps document sections to taxonomy categories
3. **Normalizer**: Applies taxonomy tags during content standardization
4. **Storage**: Indexes content by taxonomy categories for efficient retrieval
5. **Search**: Uses taxonomy for query expansion and result ranking

### Machine Learning Enhancement

The taxonomy provides:
- Training labels for content classifiers
- Feature vectors for similarity calculations
- Hierarchical structure for recommendation systems

## Best Practices

1. **Multiple Tags**: Content can belong to multiple categories (e.g., "Beach Resort" = beach + accommodation)
2. **Hierarchical Inheritance**: Child categories inherit parent attributes
3. **Context Matters**: Consider surrounding text when assigning categories
4. **Regular Updates**: Review and update taxonomy based on new content patterns
5. **Feedback Loop**: Use user interactions to refine category assignments

## Maintenance

- Review quarterly for new travel trends
- Add seasonal categories as needed
- Monitor tagging accuracy metrics
- Update based on user search patterns
- Coordinate with content team for consistency 