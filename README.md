# 🌟 Trypto AI Trip Builder

<div align="center">

![Trypto Logo](https://via.placeholder.com/200x80/1f5582/ffffff?text=TRYPTO)

**Transform travel requests into interactive, AI-powered custom itineraries**

[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-4.4.5-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC.svg)](https://tailwindcss.com/)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Demo](#-demo) • [API](#-api-reference)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Development](#-development)
- [API Reference](#-api-reference)
- [White-Label Setup](#-white-label-setup)
- [CRM Integration](#-crm-integration)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🎯 Overview

Trypto AI Trip Builder is a revolutionary white-label SaaS solution that transforms traditional travel website request forms into interactive, AI-powered custom trip builders. Built for travel companies who want to provide immediate, visual trip customization experiences while generating higher-quality leads.

### 🎭 The Problem We Solve

- **90% of travel companies** use basic "request a quote" forms
- **Lengthy email exchanges** to clarify trip preferences
- **Poor lead quality** with minimal trip details
- **Time-intensive** manual itinerary creation (20+ minutes per request)
- **Limited customer engagement** with no trip visualization

### ✨ Our Solution

Transform the travel planning experience from static request forms to dynamic, AI-powered trip builders that allow customers to visualize and customize their ideal journey before connecting with travel operators.

---

## 🚀 Features

### 🤖 AI-Powered Trip Generation
- **Automatic Itinerary Creation** from user inputs and company tour content
- **Natural Language Processing** for trip descriptions
- **Voice-to-Text Input** for natural trip planning conversations
- **Smart Content Matching** with existing tour inventory

### 🎨 Interactive Customization
- **Real-Time Trip Modifications** with instant visual feedback
- **Drag-and-Drop Itinerary** editing
- **Dynamic Pricing Updates** based on customizations
- **Mobile-First Design** with touch-friendly interfaces

### 🏢 White-Label Ready
- **Complete Branding Customization** (logos, colors, fonts)
- **Multi-Tenant Architecture** for scalable deployment
- **Custom Domain Support** (company.trypto.com)
- **Flexible Configuration** per travel company

### 💼 CRM Integration
- **Native Integrations** with HubSpot, Salesforce, and Zoho
- **Automatic Lead Creation** with complete trip details
- **Lead Quality Scoring** based on engagement and trip value
- **Real-Time Data Sync** to CRM systems

### 📱 Mobile Excellence
- **Progressive Web App** (PWA) capabilities
- **Offline Functionality** for trip browsing
- **Touch Gestures** for intuitive navigation
- **44px Touch Targets** for accessibility

### 💰 Advanced Pricing Engine
- **Dynamic Cost Calculations** with real-time updates
- **Accommodation Tiers** (3-star to luxury options)
- **Group Discounts** and seasonal pricing
- **Transparent Pricing Breakdowns** with visual charts

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks and concurrent features
- **TypeScript** - Type-safe development with IntelliSense
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Lightning-fast build tool and dev server
- **Zustand** - Lightweight state management
- **React Hook Form** - Performant forms with validation

### UI Components & Interactions
- **Lucide React** - Beautiful, customizable icons
- **Framer Motion** - Smooth animations and gestures
- **React Hot Toast** - Elegant notifications
- **Recharts** - Responsive chart library
- **React Leaflet** - Interactive maps

### Development & Build
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing and optimization
- **Vitest** - Fast unit testing framework
- **Autoprefixer** - Automatic CSS vendor prefixing

### Integrations
- **Axios** - HTTP client for API requests
- **Date-fns** - Modern date utility library
- **Clsx** - Conditional CSS class utility

---

## ⚡ Quick Start

### Prerequisites
- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/trypto-trip-builder.git
cd trypto-trip-builder

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration (see Configuration section)

# 4. Start development server
npm run dev

# 5. Open in browser
# Navigate to http://localhost:3000
```

### First-Time Setup

```bash
# Run setup script for development environment
npm run setup

# Or manually create necessary directories
mkdir -p public/uploads
mkdir -p logs
```

---

## 📁 Project Structure

```
trypto-trip-builder/
├── 📦 Root Configuration
│   ├── package.json              # Dependencies and scripts
│   ├── vite.config.ts            # Vite configuration
│   ├── tsconfig.json             # TypeScript configuration
│   ├── tailwind.config.js        # Tailwind CSS setup
│   └── .env.example              # Environment variables template
│
├── 🎨 Source Code
│   └── src/
│       ├── main.tsx              # React application entry point
│       ├── App.tsx               # Main application component
│       ├── index.css             # Global styles and Tailwind imports
│       │
│       ├── 🧩 Components
│       │   ├── layout/           # Layout components (Header, Navigation)
│       │   ├── common/           # Reusable UI components (Button, Card, Modal)
│       │   ├── trip/             # Trip-specific components (Builder, Overview)
│       │   ├── forms/            # Form components (Request, Voice Input)
│       │   ├── pricing/          # Pricing components (Estimator, Breakdown)
│       │   └── crm/              # CRM integration components
│       │
│       ├── 🔧 Business Logic
│       │   ├── hooks/            # Custom React hooks
│       │   ├── store/            # Zustand state management
│       │   ├── services/         # API services and integrations
│       │   ├── utils/            # Utility functions
│       │   └── types/            # TypeScript type definitions
│       │
│       └── 🎯 Services
│           ├── api/              # REST API services
│           ├── ai/               # AI integration services
│           └── integrations/     # Third-party integrations (CRM)
│
├── 🌐 Public Assets
│   ├── index.html                # HTML template
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker
│   └── favicon.ico               # Application icon
│
├── 🚀 Deployment & Scripts
│   ├── scripts/                  # Build and deployment scripts
│   └── docs/                     # Documentation and guides
│
└── 📚 Documentation
    ├── README.md                 # This file
    ├── CONTRIBUTING.md           # Contribution guidelines
    └── CHANGELOG.md              # Version history
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# API Configuration
VITE_API_BASE_URL=https://api.trypto.com/v1
VITE_AI_SERVICE_URL=https://ai.trypto.com

# CRM Integration Keys
VITE_HUBSPOT_API_KEY=your_hubspot_api_key
VITE_SALESFORCE_API_KEY=your_salesforce_api_key
VITE_ZOHO_API_KEY=your_zoho_api_key

# External Services
VITE_MAPS_API_KEY=your_google_maps_api_key
VITE_IMAGES_CDN_URL=https://cdn.trypto.com

# White-Label Configuration
VITE_COMPANY_ID=default
VITE_DEFAULT_THEME=light
VITE_BRAND_PRIMARY_COLOR=#1f5582
VITE_BRAND_ACCENT_COLOR=#f97316

# Feature Flags
VITE_ENABLE_VOICE_INPUT=true
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_REAL_TIME_PRICING=true
VITE_ENABLE_ANALYTICS=true

# Development
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
```

### Company Configuration

```typescript
// src/config/company.ts
export const companyConfig = {
  id: process.env.VITE_COMPANY_ID || 'default',
  name: 'Adventure Travel Co.',
  logo: '/assets/company-logo.png',
  primaryColor: process.env.VITE_BRAND_PRIMARY_COLOR || '#1f5582',
  accentColor: process.env.VITE_BRAND_ACCENT_COLOR || '#f97316',
  destinations: ['Peru', 'Brazil', 'Argentina', 'Chile'],
  specialties: ['Adventure Travel', 'Cultural Tours', 'Wildlife'],
  
  // Pricing configuration
  pricing: {
    basePricePerDay: {
      '3-star': 150,
      '4-star': 250, 
      '5-star': 400,
      'luxury': 600
    },
    groupDiscounts: [
      { minSize: 4, discount: 0.05 },
      { minSize: 6, discount: 0.10 },
      { minSize: 8, discount: 0.15 }
    ]
  }
}
```

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:host         # Start dev server accessible on network

# Building
npm run build            # Build for production
npm run preview          # Preview production build locally

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues automatically
npm run type-check       # Run TypeScript type checking

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report

# Utilities
npm run clean            # Clean build artifacts
npm run setup            # Setup development environment
```

### Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow TypeScript best practices
   - Use existing component patterns
   - Add proper error handling
   - Write tests for new features

4. **Test Your Changes**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

5. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines

- **TypeScript**: Strict mode enabled, all types must be explicit
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS utility classes
- **State**: Zustand for global state, useState for local state
- **Error Handling**: Try-catch blocks with proper error messages
- **Testing**: Unit tests for utilities, integration tests for components

---

## 📡 API Reference

### Trip Generation

```typescript
// Generate a custom trip
POST /api/trips/generate
{
  "destinations": ["Peru", "Brazil"],
  "startDate": "2024-06-01",
  "endDate": "2024-06-14",
  "travelers": 2,
  "accommodationLevel": "4-star",
  "interests": ["Adventure", "Culture"],
  "specialRequests": "Extra day in Cusco"
}
```

### Content Management

```typescript
// Upload company content
POST /api/content/upload/{companyId}
Content-Type: multipart/form-data

// Scrape website content
POST /api/content/scrape
{
  "websiteUrl": "https://company-website.com",
  "companyId": "company-123"
}
```

### CRM Integration

```typescript
// Create CRM lead
POST /api/crm/leads/{companyId}
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "tripDetails": { /* trip object */ },
  "estimatedValue": 4800
}
```

### Authentication

```typescript
// All API requests require authentication
Headers: {
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
```

**📚 [Full API Documentation](docs/api.md)**

---

## 🏷️ White-Label Setup

### Quick White-Label Deployment

1. **Configure Company Settings**
   ```bash
   # Set environment variables
   VITE_COMPANY_ID=your-company-id
   VITE_BRAND_PRIMARY_COLOR=#your-primary-color
   VITE_BRAND_ACCENT_COLOR=#your-accent-color
   ```

2. **Upload Company Assets**
   ```bash
   # Place company logo
   public/assets/company-logo.png
   
   # Add custom favicon
   public/favicon.ico
   ```

3. **Customize Configuration**
   ```typescript
   // src/config/company.ts
   export const companyConfig = {
     name: "Your Travel Company",
     destinations: ["Your", "Destinations"],
     specialties: ["Your", "Specialties"],
     // ... other settings
   }
   ```

4. **Deploy**
   ```bash
   npm run build
   npm run deploy
   ```

### Multi-Tenant Deployment

For serving multiple travel companies:

```bash
# Environment setup
VITE_MULTI_TENANT=true
VITE_TENANT_CONFIG_API=https://api.trypto.com/tenants

# Dynamic routing
company1.trypto.com -> Company 1 configuration
company2.trypto.com -> Company 2 configuration
```

**📚 [White-Label Guide](docs/white-label.md)**

---

## 🔗 CRM Integration

### Supported CRM Systems

| CRM System | Status | Features |
|------------|--------|----------|
| **HubSpot** | ✅ Native | Contacts, Deals, Custom Properties |
| **Salesforce** | ✅ Native | Leads, Opportunities, Custom Fields |
| **Zoho CRM** | ✅ Native | Leads, Deals, Workflows |
| **Custom CRM** | ✅ Webhook | REST API Integration |

### Setup Examples

#### HubSpot Integration
```typescript
// Configure HubSpot
const hubspotConfig = {
  apiKey: process.env.VITE_HUBSPOT_API_KEY,
  portalId: 'your-portal-id',
  fieldMapping: {
    'travel_destinations': 'destinations',
    'travel_budget': 'estimatedValue',
    'trip_duration': 'duration'
  }
}
```

#### Salesforce Integration
```typescript
// Configure Salesforce
const salesforceConfig = {
  instanceUrl: 'https://your-instance.salesforce.com',
  accessToken: process.env.VITE_SALESFORCE_ACCESS_TOKEN,
  customFields: {
    'Travel_Destinations__c': 'destinations',
    'Estimated_Trip_Value__c': 'estimatedValue'
  }
}
```

**📚 [CRM Integration Guide](docs/crm-integration.md)**

---

## 🚀 Deployment

### Production Build

```bash
# Create production build
npm run build

# Test production build locally
npm run preview
```

### Deployment Platforms

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

#### Netlify
```bash
# Build settings
Build command: npm run build
Publish directory: dist

# Environment variables
Configure in Netlify dashboard
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

#### AWS/Azure/GCP
- Use provided deployment scripts in `scripts/` directory
- Configure CI/CD pipelines for automatic deployments
- Set up proper environment variable management

**📚 [Deployment Guide](docs/deployment.md)**

---

## 📊 Analytics & Monitoring

### Built-in Analytics

- **User Journey Tracking** - Complete funnel analysis
- **Conversion Metrics** - Trip completion rates
- **Engagement Metrics** - Time spent, interactions
- **Performance Monitoring** - Page load times, API response times

### Integration Options

```typescript
// Google Analytics
VITE_GA_TRACKING_ID=GA-XXXXXXXXX

// Mixpanel
VITE_MIXPANEL_TOKEN=your-mixpanel-token

// Custom Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.yourcompany.com
```

---

## 🧪 Testing

### Testing Strategy

- **Unit Tests** - Individual functions and components
- **Integration Tests** - Component interactions
- **E2E Tests** - Complete user workflows
- **Performance Tests** - Load times and responsiveness

### Running Tests

```bash
# Unit tests
npm run test

# Coverage report
npm run test:coverage

# E2E tests (requires setup)
npm run test:e2e

# Performance tests
npm run test:performance
```

### Testing Examples

```typescript
// Component test
import { render, screen } from '@testing-library/react'
import { TripBuilder } from '../TripBuilder'

test('renders trip builder interface', () => {
  render(<TripBuilder />)
  expect(screen.getByText('Build Your Trip')).toBeInTheDocument()
})

// Hook test
import { renderHook } from '@testing-library/react'
import { useTripBuilder } from '../hooks/useTripBuilder'

test('generates trip from request', async () => {
  const { result } = renderHook(() => useTripBuilder())
  await result.current.generateTrip(mockTripRequest)
  expect(result.current.currentTrip).toBeDefined()
})
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following our code standards
4. **Add tests** for new functionality
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to your branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Development Setup for Contributors

```bash
# Clone your fork
git clone https://github.com/your-username/trypto-trip-builder.git

# Add upstream remote
git remote add upstream https://github.com/trypto/trypto-trip-builder.git

# Create development environment
npm install
cp .env.example .env.development
npm run setup
```

### Code Review Process

1. All changes require review from maintainers
2. Tests must pass and coverage maintained
3. Code must follow established patterns
4. Documentation must be updated for new features

---

## 📝 Changelog

### Version 0.1.0 (Current)
- ✨ Initial release with core trip building functionality
- 🤖 AI-powered itinerary generation
- 📱 Mobile-first responsive design
- 🔗 CRM integrations (HubSpot, Salesforce, Zoho)
- 🏢 White-label configuration system
- 💰 Dynamic pricing engine
- 🎙️ Voice input capabilities

### Upcoming Features
- 📊 Advanced analytics dashboard
- 🎥 Video integration for destination previews
- 👥 Social sharing and collaboration
- 📱 Native mobile apps (iOS/Android)
- 🛒 Marketplace for multi-operator comparison
- 💳 Direct payment processing

**📚 [Full Changelog](CHANGELOG.md)**

---

## 📄 License

This project is proprietary software developed as part of the Trypto & PromptShop collaboration.

**Copyright © 2024 Trypto & PromptShop. All rights reserved.**

- ✅ Licensed for use by Trypto and PromptShop
- ✅ Licensed for white-label deployment to travel company clients
- ❌ Not licensed for redistribution or resale
- ❌ Source code is confidential and proprietary

For licensing inquiries, contact: [licensing@trypto.com](mailto:licensing@trypto.com)

---

## 💬 Support

### Documentation & Resources

- 📚 **[API Documentation](docs/api.md)** - Complete API reference
- 🎨 **[Component Library](docs/components.md)** - UI component documentation
- 🚀 **[Deployment Guide](docs/deployment.md)** - Production deployment instructions
- 🏷️ **[White-Label Guide](docs/white-label.md)** - Multi-tenant setup

### Getting Help

- 💌 **Email Support**: [support@trypto.com](mailto:support@trypto.com)
- 💬 **Discord Community**: [Join our Discord](https://discord.gg/trypto)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/trypto/trypto-trip-builder/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/trypto/trypto-trip-builder/discussions)

### Business Inquiries

- 🤝 **Partnerships**: [partnerships@trypto.com](mailto:partnerships@trypto.com)
- 💰 **Enterprise Sales**: [sales@trypto.com](mailto:sales@trypto.com)
- 🏢 **White-Label Licensing**: [licensing@trypto.com](mailto:licensing@trypto.com)

### Response Times

- 🚨 **Critical Issues**: 2-4 hours
- 🐛 **Bug Reports**: 24-48 hours  
- ❓ **General Questions**: 2-3 business days
- 💼 **Enterprise Support**: 1-2 hours (SLA)

---

## 🌟 Acknowledgments

Built with ❤️ by the Trypto & PromptShop teams:

- **Trypto Team** - Travel industry expertise and product vision
- **PromptShop Team** - AI integration and technical implementation
- **Open Source Community** - Amazing tools and libraries that make this possible

### Key Technologies

Special thanks to the amazing open source projects that power Trypto:

- [React](https://reactjs.org/) - The foundation of our UI
- [TypeScript](https://www.typescriptlang.org/) - Type safety and developer experience
- [Vite](https://vitejs.dev/) - Lightning-fast development and building
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [Zustand](https://github.com/pmndrs/zustand) - Simple state management

---

<div align="center">

**[⬆ Back to Top](#-trypto-ai-trip-builder)**

Made with 🌟 by [Trypto](https://trypto.com) & [PromptShop](https://promptshop.ai)

</div>
