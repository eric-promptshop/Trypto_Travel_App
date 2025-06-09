import {
  TemplateDefinition,
  TemplateComponent,
  ComponentType,
  DEFAULT_TEMPLATE_SETTINGS,
  ComponentDefinition,
  COMPONENT_CATEGORIES,
} from '@/types/templates';

// Travel Landing Page Template
export const TRAVEL_LANDING_TEMPLATE: TemplateDefinition = {
  id: 'travel-landing-v1',
  name: 'Travel Landing Page',
  description: 'A modern landing page template designed for travel companies and tour operators',
  category: 'landing-page',
  version: '1.0.0',
  thumbnail: '/templates/travel-landing-thumb.jpg',
  previewImages: [
    '/templates/travel-landing-preview-1.jpg',
    '/templates/travel-landing-preview-2.jpg',
    '/templates/travel-landing-preview-3.jpg',
  ],
  components: [
    {
      id: 'header',
      type: 'header',
      name: 'Header',
      description: 'Navigation header with logo and menu',
      props: {
        logo: '/assets/placeholder-logo.svg',
        navigationItems: [
          { label: 'Destinations', href: '/destinations' },
          { label: 'Tours', href: '/tours' },
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' },
        ],
        ctaButton: { label: 'Book Now', href: '/book' },
        showSearch: true,
      },
      isRequired: true,
      isCustomizable: true,
      order: 1,
      styles: {
        layout: {
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        appearance: {
          backgroundColor: 'var(--color-background)',
          borderBottom: '1px solid var(--color-border)',
        },
      },
    },
    {
      id: 'hero',
      type: 'hero',
      name: 'Hero Section',
      description: 'Large hero section with background image and call-to-action',
      props: {
        headline: 'Discover Your Next Adventure',
        subheadline: 'Experience the world with our carefully curated travel packages and expert guides',
        backgroundImage: '/assets/hero-travel-bg.jpg',
        ctaButton: { label: 'Explore Destinations', href: '/destinations' },
        secondaryButton: { label: 'Watch Video', href: '#video' },
        showSearchForm: true,
        searchFormFields: ['destination', 'dates', 'travelers'],
      },
      isRequired: true,
      isCustomizable: true,
      order: 2,
      styles: {
        layout: {
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '4rem 2rem',
          position: 'relative',
        },
        appearance: {
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        },
        typography: {
          textAlign: 'center',
          color: 'white',
        },
      },
    },
    {
      id: 'features',
      type: 'feature-grid',
      name: 'Features Grid',
      description: 'Grid showcasing key features and benefits',
      props: {
        title: 'Why Choose Us',
        subtitle: 'We make travel planning effortless and memorable',
        features: [
          {
            icon: '/icons/expert-guides.svg',
            title: 'Expert Guides',
            description: 'Local experts who know the hidden gems and best experiences',
          },
          {
            icon: '/icons/best-prices.svg',
            title: 'Best Prices',
            description: 'Competitive pricing with no hidden fees or surprises',
          },
          {
            icon: '/icons/support.svg',
            title: '24/7 Support',
            description: 'Round-the-clock assistance before, during, and after your trip',
          },
          {
            icon: '/icons/safe-travel.svg',
            title: 'Safe Travel',
            description: 'Comprehensive safety measures and travel insurance included',
          },
        ],
        layout: 'grid',
        columns: 4,
      },
      isRequired: false,
      isCustomizable: true,
      order: 3,
      styles: {
        layout: {
          padding: '6rem 2rem',
          maxWidth: '1200px',
          margin: '0 auto',
        },
        responsive: {
          mobile: {
            layout: { padding: '3rem 1rem' },
          },
        },
      },
    },
    {
      id: 'destinations',
      type: 'gallery',
      name: 'Popular Destinations',
      description: 'Gallery showcasing popular travel destinations',
      props: {
        title: 'Popular Destinations',
        subtitle: 'Explore our most loved travel destinations',
        items: [
          {
            image: '/destinations/bali.jpg',
            title: 'Bali, Indonesia',
            description: 'Tropical paradise with stunning beaches and rich culture',
            price: 'From $1,299',
            link: '/destinations/bali',
          },
          {
            image: '/destinations/tokyo.jpg',
            title: 'Tokyo, Japan',
            description: 'Modern metropolis blending tradition with innovation',
            price: 'From $1,599',
            link: '/destinations/tokyo',
          },
          {
            image: '/destinations/santorini.jpg',
            title: 'Santorini, Greece',
            description: 'Iconic white buildings and breathtaking sunsets',
            price: 'From $1,799',
            link: '/destinations/santorini',
          },
        ],
        layout: 'masonry',
        showPrices: true,
      },
      isRequired: false,
      isCustomizable: true,
      order: 4,
    },
    {
      id: 'testimonials',
      type: 'testimonials',
      name: 'Customer Testimonials',
      description: 'Social proof from satisfied customers',
      props: {
        title: 'What Our Travelers Say',
        testimonials: [
          {
            quote: 'Amazing experience! The guides were knowledgeable and the itinerary was perfect.',
            author: 'Sarah Johnson',
            location: 'New York, USA',
            avatar: '/avatars/sarah.jpg',
            rating: 5,
          },
          {
            quote: 'Best vacation ever! Everything was organized flawlessly.',
            author: 'Mike Chen',
            location: 'Toronto, Canada',
            avatar: '/avatars/mike.jpg',
            rating: 5,
          },
          {
            quote: 'Exceeded our expectations in every way. Highly recommended!',
            author: 'Emma Wilson',
            location: 'London, UK',
            avatar: '/avatars/emma.jpg',
            rating: 5,
          },
        ],
        layout: 'carousel',
        showRatings: true,
      },
      isRequired: false,
      isCustomizable: true,
      order: 5,
    },
    {
      id: 'cta',
      type: 'cta-section',
      name: 'Call to Action',
      description: 'Final call-to-action to encourage bookings',
      props: {
        title: 'Ready for Your Next Adventure?',
        subtitle: 'Join thousands of satisfied travelers and book your dream trip today',
        primaryButton: { label: 'Start Planning', href: '/book' },
        secondaryButton: { label: 'View Tours', href: '/tours' },
        backgroundType: 'gradient',
        gradient: 'linear-gradient(135deg, var(--color-primary-600), var(--color-secondary-600))',
      },
      isRequired: false,
      isCustomizable: true,
      order: 6,
    },
    {
      id: 'footer',
      type: 'footer',
      name: 'Footer',
      description: 'Site footer with links and contact information',
      props: {
        logo: '/assets/logo-white.svg',
        description: 'Your trusted partner for unforgettable travel experiences around the world.',
        sections: [
          {
            title: 'Destinations',
            links: [
              { label: 'Asia', href: '/destinations/asia' },
              { label: 'Europe', href: '/destinations/europe' },
              { label: 'Americas', href: '/destinations/americas' },
              { label: 'Africa', href: '/destinations/africa' },
            ],
          },
          {
            title: 'Company',
            links: [
              { label: 'About Us', href: '/about' },
              { label: 'Careers', href: '/careers' },
              { label: 'Press', href: '/press' },
              { label: 'Partners', href: '/partners' },
            ],
          },
          {
            title: 'Support',
            links: [
              { label: 'Help Center', href: '/help' },
              { label: 'Contact Us', href: '/contact' },
              { label: 'Travel Insurance', href: '/insurance' },
              { label: 'Booking Terms', href: '/terms' },
            ],
          },
        ],
        socialLinks: [
          { platform: 'facebook', url: '#', label: 'Facebook' },
          { platform: 'instagram', url: '#', label: 'Instagram' },
          { platform: 'twitter', url: '#', label: 'Twitter' },
        ],
        contactInfo: {
          email: 'hello@travelcompany.com',
          phone: '+1 (555) 123-4567',
        },
        showNewsletter: true,
      },
      isRequired: true,
      isCustomizable: true,
      order: 7,
    },
  ],
  settings: {
    ...DEFAULT_TEMPLATE_SETTINGS,
    layout: {
      maxWidth: '1400px',
      containerSpacing: '2rem',
      sectionSpacing: '6rem',
    },
    seo: {
      title: 'Travel Adventures | Discover Your Next Destination',
      description: 'Plan your perfect vacation with our expert travel guides and curated experiences. Book now for unforgettable adventures around the world.',
      keywords: ['travel', 'vacation', 'tours', 'destinations', 'booking'],
    },
  },
  metadata: {
    tags: ['travel', 'landing-page', 'booking', 'tourism'],
    difficulty: 'beginner',
    estimatedSetupTime: 30,
    features: [
      'Responsive design',
      'Hero search form',
      'Destination gallery',
      'Customer testimonials',
      'Social proof',
      'SEO optimized',
    ],
    compatibility: {
      devices: ['mobile', 'tablet', 'desktop'],
      browsers: ['Chrome', 'Firefox', 'Safari', 'Edge'],
    },
    documentation: '/docs/templates/travel-landing',
  },
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
};

// Simple About Page Template
export const ABOUT_PAGE_TEMPLATE: TemplateDefinition = {
  id: 'about-page-v1',
  name: 'About Us Page',
  description: 'Professional about page template showcasing company story and team',
  category: 'about-page',
  version: '1.0.0',
  thumbnail: '/templates/about-page-thumb.jpg',
  previewImages: ['/templates/about-page-preview-1.jpg'],
  components: [
    {
      id: 'header',
      type: 'header',
      name: 'Header',
      description: 'Simple navigation header',
      props: {
        logo: '/assets/placeholder-logo.svg',
        navigationItems: [
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' },
          { label: 'Services', href: '/services' },
          { label: 'Contact', href: '/contact' },
        ],
      },
      isRequired: true,
      isCustomizable: true,
      order: 1,
    },
    {
      id: 'hero-about',
      type: 'hero',
      name: 'Page Hero',
      description: 'Simple hero section for about page',
      props: {
        headline: 'About Our Company',
        subheadline: 'Learn about our mission, values, and the team behind our success',
        backgroundType: 'color',
        backgroundColor: 'var(--color-secondary-50)',
      },
      isRequired: true,
      isCustomizable: true,
      order: 2,
      styles: {
        layout: {
          minHeight: '40vh',
          padding: '4rem 2rem',
        },
      },
    },
    {
      id: 'story',
      type: 'content-block',
      name: 'Our Story',
      description: 'Company story and mission',
      props: {
        title: 'Our Story',
        content: `
          <p>Founded in 2015, we began with a simple mission: to make travel planning effortless and extraordinary. What started as a small team of travel enthusiasts has grown into a trusted platform serving thousands of adventurers worldwide.</p>
          
          <p>We believe that every journey should be unique, memorable, and perfectly tailored to your dreams. Our team of experienced travel specialists works tirelessly to curate authentic experiences that connect you with the heart and soul of each destination.</p>
        `,
        image: '/images/company-story.jpg',
        layout: 'side-by-side',
        imagePosition: 'right',
      },
      isRequired: false,
      isCustomizable: true,
      order: 3,
    },
    {
      id: 'values',
      type: 'feature-grid',
      name: 'Our Values',
      description: 'Company core values',
      props: {
        title: 'Our Values',
        subtitle: 'The principles that guide everything we do',
        features: [
          {
            icon: '/icons/authenticity.svg',
            title: 'Authenticity',
            description: 'We create genuine connections between travelers and local cultures',
          },
          {
            icon: '/icons/sustainability.svg',
            title: 'Sustainability',
            description: 'We promote responsible travel that benefits local communities',
          },
          {
            icon: '/icons/excellence.svg',
            title: 'Excellence',
            description: 'We strive for perfection in every detail of your journey',
          },
        ],
        layout: 'grid',
        columns: 3,
      },
      isRequired: false,
      isCustomizable: true,
      order: 4,
    },
    {
      id: 'team',
      type: 'content-block',
      name: 'Our Team',
      description: 'Team showcase section',
      props: {
        title: 'Meet Our Team',
        content: 'Our diverse team of travel experts, local guides, and customer success specialists are here to make your journey unforgettable.',
        showTeamGrid: true,
        teamMembers: [
          {
            name: 'Alice Johnson',
            role: 'CEO & Founder',
            image: '/team/alice.jpg',
            bio: 'Passionate traveler with 15+ years in tourism industry',
          },
          {
            name: 'David Chen',
            role: 'Head of Operations',
            image: '/team/david.jpg',
            bio: 'Operations expert ensuring seamless travel experiences',
          },
          {
            name: 'Sarah Martinez',
            role: 'Travel Specialist',
            image: '/team/sarah.jpg',
            bio: 'Destination expert specializing in European tours',
          },
        ],
      },
      isRequired: false,
      isCustomizable: true,
      order: 5,
    },
    {
      id: 'footer',
      type: 'footer',
      name: 'Footer',
      description: 'Site footer',
      props: {
        simple: true,
        logo: '/assets/logo.svg',
        description: 'Your trusted travel partner.',
        contactInfo: {
          email: 'info@company.com',
          phone: '+1 (555) 123-4567',
        },
      },
      isRequired: true,
      isCustomizable: true,
      order: 6,
    },
  ],
  settings: DEFAULT_TEMPLATE_SETTINGS,
  metadata: {
    tags: ['about', 'company', 'team', 'simple'],
    difficulty: 'beginner',
    estimatedSetupTime: 15,
    features: ['Responsive design', 'Team showcase', 'Company story', 'Values section'],
    compatibility: {
      devices: ['mobile', 'tablet', 'desktop'],
      browsers: ['Chrome', 'Firefox', 'Safari', 'Edge'],
    },
  },
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
};

// Contact Page Template
export const CONTACT_PAGE_TEMPLATE: TemplateDefinition = {
  id: 'contact-page-v1',
  name: 'Contact Us Page',
  description: 'Professional contact page with form and company information',
  category: 'contact-page',
  version: '1.0.0',
  thumbnail: '/templates/contact-page-thumb.jpg',
  previewImages: ['/templates/contact-page-preview-1.jpg'],
  components: [
    {
      id: 'header',
      type: 'header',
      name: 'Header',
      description: 'Navigation header',
      props: {
        logo: '/assets/placeholder-logo.svg',
        navigationItems: [
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' },
          { label: 'Services', href: '/services' },
          { label: 'Contact', href: '/contact' },
        ],
      },
      isRequired: true,
      isCustomizable: true,
      order: 1,
    },
    {
      id: 'contact-hero',
      type: 'hero',
      name: 'Contact Hero',
      description: 'Contact page hero section',
      props: {
        headline: 'Get in Touch',
        subheadline: 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
        backgroundType: 'gradient',
        gradient: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
      },
      isRequired: true,
      isCustomizable: true,
      order: 2,
      styles: {
        layout: {
          minHeight: '50vh',
          padding: '4rem 2rem',
        },
        typography: {
          color: 'white',
          textAlign: 'center',
        },
      },
    },
    {
      id: 'contact-form',
      type: 'form',
      name: 'Contact Form',
      description: 'Contact form with validation',
      props: {
        title: 'Send us a Message',
        fields: [
          { type: 'text', name: 'name', label: 'Full Name', required: true },
          { type: 'email', name: 'email', label: 'Email Address', required: true },
          { type: 'text', name: 'subject', label: 'Subject', required: true },
          { type: 'textarea', name: 'message', label: 'Message', required: true, rows: 5 },
        ],
        submitButton: { label: 'Send Message' },
        layout: 'two-column',
      },
      isRequired: true,
      isCustomizable: true,
      order: 3,
    },
    {
      id: 'contact-info',
      type: 'content-block',
      name: 'Contact Information',
      description: 'Company contact details',
      props: {
        title: 'Contact Information',
        layout: 'info-cards',
        contactCards: [
          {
            icon: '/icons/phone.svg',
            title: 'Phone',
            content: '+1 (555) 123-4567',
            link: 'tel:+15551234567',
          },
          {
            icon: '/icons/email.svg',
            title: 'Email',
            content: 'hello@company.com',
            link: 'mailto:hello@company.com',
          },
          {
            icon: '/icons/location.svg',
            title: 'Address',
            content: '123 Business St, Suite 100\nCity, State 12345',
          },
          {
            icon: '/icons/clock.svg',
            title: 'Business Hours',
            content: 'Monday - Friday: 9AM - 6PM\nSaturday: 10AM - 4PM',
          },
        ],
      },
      isRequired: false,
      isCustomizable: true,
      order: 4,
    },
    {
      id: 'footer',
      type: 'footer',
      name: 'Footer',
      description: 'Site footer',
      props: {
        simple: true,
        logo: '/assets/logo.svg',
        contactInfo: {
          email: 'info@company.com',
          phone: '+1 (555) 123-4567',
        },
      },
      isRequired: true,
      isCustomizable: true,
      order: 5,
    },
  ],
  settings: DEFAULT_TEMPLATE_SETTINGS,
  metadata: {
    tags: ['contact', 'form', 'business'],
    difficulty: 'beginner',
    estimatedSetupTime: 20,
    features: ['Contact form', 'Form validation', 'Contact information', 'Responsive design'],
    compatibility: {
      devices: ['mobile', 'tablet', 'desktop'],
      browsers: ['Chrome', 'Firefox', 'Safari', 'Edge'],
    },
  },
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
};

// Export all templates
export const DEFAULT_TEMPLATES: TemplateDefinition[] = [
  TRAVEL_LANDING_TEMPLATE,
  ABOUT_PAGE_TEMPLATE,
  CONTACT_PAGE_TEMPLATE,
];

// Template utility functions
export function getTemplateById(id: string): TemplateDefinition | undefined {
  return DEFAULT_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: string): TemplateDefinition[] {
  return DEFAULT_TEMPLATES.filter(template => template.category === category);
}

export function getAllTemplateCategories(): string[] {
  return [...new Set(DEFAULT_TEMPLATES.map(template => template.category))];
}

export function getActiveTemplates(): TemplateDefinition[] {
  return DEFAULT_TEMPLATES.filter(template => template.isActive);
} 