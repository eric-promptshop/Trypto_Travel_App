# Content Processing System Documentation

## Overview

The Content Processing System is a comprehensive solution for extracting, processing, and structuring travel content from websites and documents. It provides an end-to-end pipeline that handles web scraping, document parsing, content normalization, intelligent tagging, and storage with machine learning capabilities.

## Architecture

The system consists of six main components that work together in a pipeline:

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  Web Scraping   │────▶│ Normalization    │────▶│ Tagging &          │
│  Framework      │     │ Pipeline         │     │ Categorization     │
└─────────────────┘     └──────────────────┘     └────────────────────┘
         │                       ▲                          │
         │                       │                          ▼
┌─────────────────┐             │                 ┌────────────────────┐
│ Document Parser │─────────────┘                 │ Storage & ML       │
│ (PDF/Word)      │                               │ Enhancement        │
└─────────────────┘                               └────────────────────┘
```

## Component Details

### 1. Web Scraping Framework (✅ Complete)

**Location:** `lib/content-processing/scrapers/`

**Features:**
- Puppeteer and Cheerio-based extraction
- Rate limiting with Bottleneck library
- Proxy rotation capability
- Site-specific scrapers (TripAdvisor, Booking.com, GetYourGuide)
- Error handling with exponential backoff
- CAPTCHA detection

**Key Classes:**
- `BaseScraper`: Abstract base class with common functionality
- `RateLimiter`: Request throttling and quota management
- `ScraperLogger`: Dedicated logging system

**Usage Example:**
```typescript
const scraper = new TripAdvisorScraper();
const result = await scraper.scrapeUrl('https://www.tripadvisor.com/...');
if (result.success) {
  console.log(`Found ${result.data.length} activities`);
}
await scraper.dispose();
```

### 2. Document Parser (✅ Complete)

**Location:** `src/parsers/`

**Features:**
- PDF parsing with pdf-parse
- Word document parsing with mammoth.js
- Unified parser interface
- Structure detection for itineraries
- Metadata extraction

**Key Classes:**
- `PDFParser`: Handles PDF documents
- `WordParser`: Handles DOCX files
- `UnifiedDocumentParser`: Detects file type and delegates

**Usage Example:**
```typescript
const buffer = fs.readFileSync('itinerary.pdf');
const parsed = await parseDocument(buffer, 'itinerary.pdf');
console.log(parsed.sections); // Structured content
```

### 3. Content Normalization Pipeline (✅ Complete)

**Location:** `src/normalization/` and `src/normalizers/`

**Features:**
- Unified data schema for all content types
- Web and document content transformers
- Entity recognition (locations, activities, accommodations)
- Date/time normalization (multiple formats, relative dates)
- Price and currency standardization (35+ currencies)
- Content deduplication (exact and near-duplicate detection)
- Batch processing support
- Validation framework

**Key Classes:**
- `NormalizationPipeline`: Main orchestrator
- `WebContentTransformer`: Transforms scraped web content
- `DocumentContentTransformer`: Transforms parsed documents
- `EntityRecognizer`: Extracts entities from text
- `DateNormalizer`: Handles date/time parsing
- `PriceNormalizer`: Currency and price extraction
- `Deduplicator`: MinHash-based duplicate detection

**Usage Example:**
```typescript
const pipeline = new NormalizationPipeline();
const result = await pipeline.normalize(rawContent, 'web', {
  enableDeduplication: true,
  validateOutput: true
});
```

### 4. Content Tagging and Categorization (✅ Complete)

**Location:** `src/tagging/` and `src/taxonomy/`

**Features:**
- Comprehensive travel taxonomy (destinations, activities, etc.)
- Rule-based and NLP tagging
- Hierarchical categorization
- Keyword extraction (TF-IDF)
- Entity tagging
- Confidence scoring
- Batch tagging support

**Key Classes:**
- `ContentTagger`: Main tagging engine
- `KeywordExtractor`: TF-IDF based extraction
- `EntityTagger`: Named entity recognition
- `ConfidenceScorer`: Tag confidence calculation

**Taxonomy Structure:**
- 8 main categories (destinations, activities, accommodations, etc.)
- Multi-level hierarchy with keywords
- Geographic organization
- Attributes (price range, duration, difficulty, suitability)

### 5. Storage and Retrieval System (✅ Complete)

**Location:** `src/storage/`

**Features:**
- PostgreSQL with Prisma ORM
- pgvector extension for similarity search
- Embedding generation (OpenAI/TF-IDF fallback)
- Content deduplication
- Tag-based retrieval
- Feedback mechanism for ML improvement
- Analytics tracking

**Key Classes:**
- `ContentStorageService`: Main storage interface
- `ContentRepository`: Database operations
- `EmbeddingService`: Vector embedding generation

**Database Schema:**
- `ProcessedContent`: Main content storage with embeddings
- `ContentTag`: Hierarchical tags
- `ContentRelation`: Content relationships
- `ContentFeedback`: ML improvement data

### 6. ML Enhancement Features (✅ Complete)

**Features:**
- Vector embeddings for all content
- Cosine similarity search
- Content recommendation system
- Incremental learning from feedback
- A/B testing framework
- Performance monitoring

## End-to-End Flow

1. **Content Acquisition**
   - Web scraping: Extract from travel websites
   - Document parsing: Process PDF/Word itineraries

2. **Normalization**
   - Transform to unified schema
   - Extract entities, dates, prices
   - Validate data quality

3. **Deduplication**
   - Check content hash
   - Near-duplicate detection via MinHash
   - Maintain content freshness

4. **Tagging & Categorization**
   - Apply taxonomy categories
   - Extract keywords
   - Calculate confidence scores

5. **Storage & ML Processing**
   - Generate embeddings
   - Store with metadata
   - Enable similarity search

6. **Retrieval & Recommendations**
   - Query by tags/categories
   - Find similar content
   - Provide recommendations

## Testing

### Unit Tests
- Component-level tests in `__tests__/` directories
- Mock external dependencies
- Test edge cases and error handling

### Integration Tests
- `src/normalization/__tests__/NormalizationPipeline.test.ts`
- `src/storage/__tests__/ContentStorageService.test.ts`
- `src/tagging/__tests__/ContentTagger.test.ts`

### End-to-End Test
Run the complete pipeline test:
```bash
npm run test:e2e
# or
ts-node scripts/test-content-processing-e2e.ts
```

## Configuration

### Environment Variables
```bash
# Required
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key         # For embeddings
DATABASE_URL=postgresql://...    # Supabase connection

# Optional
PERPLEXITY_API_KEY=your_key     # For research features
MODEL=claude-3-opus-20240229
MAX_TOKENS=8192
TEMPERATURE=0.7
DEBUG=true
LOG_LEVEL=info
```

### Prisma Setup
```bash
# Generate client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Enable pgvector
psql $DATABASE_URL < prisma/migrations/enable-pgvector.sql
```

## Performance Considerations

- **Scraping**: Rate limited to respect website policies
- **Batch Processing**: Process content in configurable batches
- **Caching**: Redis layer for frequent queries
- **Indexing**: Optimized database indexes for common queries
- **Embeddings**: Batch generation to minimize API calls

## Monitoring & Analytics

The system tracks:
- Processing success/failure rates
- Average confidence scores
- Tag distribution
- Processing times
- Error patterns

## Future Enhancements

1. **Additional Scrapers**: Expedia, Airbnb, Viator
2. **More Document Formats**: Excel, Google Docs
3. **Language Support**: Multi-language content processing
4. **Real-time Updates**: WebSocket-based content updates
5. **Advanced ML**: Custom embedding models, active learning

## Troubleshooting

### Common Issues

1. **Scraping Failures**
   - Check rate limits
   - Verify selectors are up-to-date
   - Review proxy configuration

2. **Parsing Errors**
   - Ensure document format is supported
   - Check for corrupted files
   - Verify encoding

3. **Storage Issues**
   - Confirm database connection
   - Check pgvector installation
   - Verify API keys for embeddings

### Debug Mode
Enable debug logging:
```bash
DEBUG=true LOG_LEVEL=debug npm run start
```

## API Reference

See individual component documentation:
- [Web Scraping API](./web-scraping-framework.md)
- [Normalization API](./normalization-api.md)
- [Tagging API](./tagging-api.md)
- [Storage API](./storage-api.md) 