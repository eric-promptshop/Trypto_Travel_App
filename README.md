# Trypto AI Travel Itinerary Builder

An AI-powered travel planning application that transforms traditional request forms into intelligent, conversational experiences.

## Features

- 🤖 **AI-Powered Request Form**: Natural language conversation to gather travel preferences
- 🗺️ **Interactive Itinerary Builder**: Visual map-based trip planning with day-by-day details
- 💬 **Smart Chat Assistant**: Context-aware AI helper for trip modifications and questions
- 📱 **Mobile-First Design**: Responsive, touch-friendly interface
- 🎤 **Voice Input**: Speech-to-text for hands-free interaction
- 🎯 **Real-Time Validation**: Live progress tracking and data extraction

## Setup Instructions

### Prerequisites

- Node.js 20+
- npm, yarn, or pnpm
- Supabase account (for database)
- OpenAI API key (for AI features)
- Vercel account (for deployment)

### 1. Environment Variables

Create a `.env.local` file in your project root:

\`\`\`env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (see SUPABASE_CONNECTION_GUIDE.md)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_database_url

# Optional: Image Services
UNSPLASH_ACCESS_KEY=your_unsplash_api_key_here
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
\`\`\`

**Important Security Notes:**
- Never commit API keys to version control
- Use environment variables for all sensitive data
- The UNSPLASH_ACCESS_KEY is optional - the app will use fallback images if not provided

### 2. Installation

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

### 3. Database Setup

\`\`\`bash
# Set up Supabase credentials
npm run setup:supabase

# Push schema to database
npm run db:push

# Seed initial data (optional)
npm run db:seed
\`\`\`

See [SUPABASE_CONNECTION_GUIDE.md](./SUPABASE_CONNECTION_GUIDE.md) for detailed instructions.

### 4. Development

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

## API Endpoints

- `/api/form-chat` - AI conversation for the request form
- `/api/extract-form-data` - Extract structured data from conversations
- `/api/chat` - Itinerary-specific chat assistant
- `/api/images` - Location image fetching (with fallbacks)

## Architecture

### AI-Powered Request Form
- Conversational interface using OpenAI GPT-4o-mini
- Real-time data extraction and validation
- Voice input support via Web Speech API
- Progressive information gathering with visual feedback

### Itinerary Builder
- Interactive map using Leaflet
- Day-by-day trip visualization
- Expandable content with smooth animations
- Integrated chat assistant for modifications

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **AI**: Vercel AI SDK with OpenAI
- **Styling**: Tailwind CSS with shadcn/ui components
- **Animations**: Framer Motion
- **Maps**: Leaflet with custom markers
- **Voice**: Web Speech API

## Deployment

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/travel-itinerary-builder)

### Manual Deployment

1. **Install Vercel CLI**: `npm i -g vercel`
2. **Set up environment variables**: `npm run vercel:setup`
3. **Deploy to staging**: `npm run deploy:preview`
4. **Deploy to production**: `npm run deploy:production`

### Automated Deployment

- **Production**: Push to `main` branch
- **Staging**: Push to `develop` branch

See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for detailed instructions.

### Environment Management

- **Switch to staging**: `npm run env:staging`
- **Switch to production**: `npm run env:production`
- **Pull Vercel env vars**: `npm run vercel:pull`

## Security Best Practices

- API keys are only used server-side
- Client-side code never exposes sensitive credentials
- Graceful fallbacks when APIs are unavailable
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary to Trypto.
