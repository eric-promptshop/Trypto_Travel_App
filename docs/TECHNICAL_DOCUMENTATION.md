# Travel Itinerary Builder - Technical Documentation

## Architecture Overview

### Technology Stack

**Frontend:**
- Next.js 15.2.4 (React 19)
- TypeScript for type safety
- Tailwind CSS for styling
- Radix UI components
- Framer Motion for animations

**Backend:**
- Next.js API Routes
- Prisma ORM with PostgreSQL
- NextAuth.js for authentication
- Supabase for database and real-time features

**Infrastructure:**
- Vercel for hosting and deployment
- GitHub Actions for CI/CD
- Cloudinary for image optimization
- Various API integrations for travel data

### Project Structure

```
travel-itinerary-builder/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   ├── (demo)/            # Demo pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── travel-forms/     # Form components
│   └── atoms/            # Atomic design components
├── lib/                  # Utility libraries
│   ├── auth/            # Authentication logic
│   ├── api/             # API utilities
│   └── utils.ts         # General utilities
├── hooks/               # Custom React hooks
├── contexts/            # React contexts
├── prisma/              # Database schema and migrations
├── docs/                # Documentation
└── __tests__/           # Test files
```

## Core Components

### Itinerary Engine (`lib/itinerary-engine/`)

The heart of the application, responsible for generating and optimizing travel itineraries.

**Key Components:**
- `main-engine.ts`: Primary itinerary generation logic
- `preference-matching-service.ts`: Matches user preferences with activities
- `pricing-calculation-service.ts`: Calculates costs and budget optimization
- `day-planning-service.ts`: Optimizes daily schedules

**Usage:**
```typescript
import { ItineraryEngine } from '@/lib/itinerary-engine/main-engine'

const engine = new ItineraryEngine()
const itinerary = await engine.generateItinerary({
  destination: 'Peru',
  duration: 7,
  budget: 3000,
  travelers: 2,
  interests: ['culture', 'nature']
})
```

### Content Processing System (`lib/content-processing/`)

Handles web scraping and data normalization from travel websites.

**Key Components:**
- `scrapers/`: Web scrapers for different travel sites
- `normalizers/`: Data normalization and cleaning
- `storage/`: Content storage and retrieval

**Scrapers Available:**
- BookingComScraper: Hotel and accommodation data
- TripAdvisorScraper: Reviews and ratings
- GetYourGuideScraper: Activities and tours

### Form Components (`components/travel-forms/`)

Enhanced form components with validation and user experience optimizations.

**Key Components:**
- `destination-selector.tsx`: Destination search with autocomplete
- `date-range-picker.tsx`: Date selection with calendar
- `budget-range-slider.tsx`: Budget range selection
- `enhanced-form-components.tsx`: Validation and error handling

### Authentication (`lib/auth/`)

NextAuth.js configuration with role-based access control.

**Features:**
- Multiple authentication providers
- JWT token management
- Role-based permissions
- Session management

## API Endpoints

### Core API Routes

**POST /api/generate-itinerary**
```typescript
{
  destination: string
  duration: number
  travelers: number
  budget: number
  interests: string[]
  dates?: {
    start: string
    end: string
  }
}
```

**GET /api/v1/trips**
- Retrieve user's saved trips
- Pagination support
- Filtering and sorting

**POST /api/v1/trips**
- Create new trip
- Validation and error handling

**GET /api/health**
- System health check
- Database connectivity
- External service status

### Authentication Endpoints

**POST /api/auth/[...nextauth]**
- NextAuth.js authentication
- Multiple provider support
- Session management

### Admin Endpoints

**POST /api/v1/roles/assign**
- Assign roles to users
- Admin-only access

**GET /api/v1/domains**
- White-label domain management
- Tenant configuration

## Database Schema

### Core Tables

**Users**
```sql
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String?
  image       String?
  role        Role     @default(USER)
  trips       Trip[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Trips**
```sql
model Trip {
  id          String   @id @default(cuid())
  title       String
  destination String
  startDate   DateTime?
  endDate     DateTime?
  budget      Float?
  travelers   Int      @default(1)
  itinerary   Json?
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Content**
```sql
model Content {
  id          String   @id @default(cuid())
  title       String
  description String?
  url         String?
  type        ContentType
  metadata    Json?
  embedding   Unsupported("vector")?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Development Setup

### Prerequisites

1. Node.js 18+ 
2. PostgreSQL 14+
3. Git

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/travel-itinerary-builder.git
cd travel-itinerary-builder

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# External APIs
OPENAI_API_KEY="your-openai-key"
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-key"

# Image Processing
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
```

## Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### E2E Tests
```bash
# Run Cypress tests
npm run test:e2e

# Open Cypress GUI
npm run test:e2e:open
```

### Testing Philosophy
- Unit tests for individual components and utilities
- Integration tests for API endpoints
- E2E tests for critical user journeys
- Minimum 70% code coverage requirement

## Performance Optimization

### Frontend Optimizations
- Next.js automatic code splitting
- Image optimization with Cloudinary
- Lazy loading for components
- Service worker for offline support

### Backend Optimizations
- Database connection pooling
- Redis caching layer
- API response caching
- Database query optimization

### Monitoring
- Real-time performance metrics
- Error tracking with detailed logs
- User analytics and behavior tracking
- Automated alerting for critical issues

## Security

### Data Protection
- HTTPS enforcement
- Data encryption at rest and in transit
- Input validation and sanitization
- SQL injection prevention with Prisma

### Authentication & Authorization
- JWT token security
- Role-based access control (RBAC)
- Session management
- Password security best practices

### API Security
- Rate limiting
- CORS configuration
- API key management
- Request validation

## Deployment

### Production Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment-specific Configurations
- Development: Hot reloading, detailed logging
- Staging: Production-like environment for testing
- Production: Optimized builds, monitoring, scaling

### CI/CD Pipeline
1. Code push triggers GitHub Actions
2. Run linting and type checking
3. Execute test suites
4. Build application
5. Deploy to staging/production
6. Run smoke tests
7. Monitor deployment health

## API Documentation

### Swagger/OpenAPI
- Interactive API documentation
- Request/response examples
- Authentication requirements
- Rate limiting information

### Integration Guides
- Step-by-step integration tutorials
- SDKs for popular languages
- Webhook documentation
- Error handling guides

## Troubleshooting

### Common Issues

**Build Failures**
- Check TypeScript errors
- Verify environment variables
- Clear node_modules and reinstall

**Database Connection Issues**
- Verify DATABASE_URL format
- Check network connectivity
- Ensure database is running

**Authentication Problems**
- Verify NEXTAUTH configuration
- Check provider credentials
- Review callback URLs

### Debug Tools
- Next.js debugging capabilities
- Prisma database introspection
- Browser developer tools
- Server logs and monitoring

## Contributing

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier for code formatting
- Conventional commit messages

### Pull Request Process
1. Fork repository
2. Create feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit pull request
6. Code review process
7. Merge after approval

---

For questions or support, contact the development team at dev@travelitinerary.com