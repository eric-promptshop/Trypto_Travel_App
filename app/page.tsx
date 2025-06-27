"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAnalytics } from '@/lib/analytics/analytics-service'
import { TripCard } from '@/components/molecules/TripCard'
import { 
  Plane, 
  Map, 
  Calendar, 
  Users, 
  Globe, 
  Sparkles, 
  ArrowRight,
  Clock,
  Shield,
  Smartphone,
  Building2,
  Mic,
  Play,
  Pause,
  Star,
  Quote,
  TrendingUp,
  Award,
  DollarSign
} from 'lucide-react'
import { TripNavLogo } from '@/components/ui/TripNavLogo'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Planning',
    description: 'Get personalized itineraries created by advanced AI that understands your preferences.',
    stats: '95% satisfaction rate'
  },
  {
    icon: Globe,
    title: 'Global Destinations',
    description: 'Explore over 200+ destinations worldwide with detailed local insights and recommendations.',
    stats: '200+ cities covered'
  },
  {
    icon: Smartphone,
    title: 'Mobile Optimized',
    description: 'Plan and manage your trips on any device with our responsive, mobile-first design.',
    stats: '4.8★ App Store rating'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your travel data is encrypted and protected with enterprise-grade security.',
    stats: 'SOC 2 compliant'
  },
  {
    icon: Users,
    title: 'Group Planning',
    description: 'Collaborate with fellow travelers and plan group trips with shared itineraries.',
    stats: '10K+ group trips'
  },
  {
    icon: Clock,
    title: 'Real-time Updates',
    description: 'Get live pricing, availability, and updates for your bookings and activities.',
    stats: 'Live updates 24/7'
  }
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Adventure Traveler',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    content: 'TripNav helped me plan my 3-week Japan trip perfectly. The AI suggestions were spot-on!',
    rating: 5,
    destination: 'Tokyo, Japan'
  },
  {
    name: 'Mark Rodriguez',
    role: 'Family Vacationer',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    content: 'Planning with kids is tough, but TripNav made our Disney trip stress-free and magical.',
    rating: 5,
    destination: 'Orlando, USA'
  },
  {
    name: 'Elena Petrova',
    role: 'Solo Explorer',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    content: 'As a solo traveler, the safety recommendations and local insights were invaluable.',
    rating: 5,
    destination: 'Bali, Indonesia'
  }
]

const stats = [
  { value: '50K+', label: 'Happy Travelers' },
  { value: '200+', label: 'Destinations' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '1M+', label: 'Trips Planned' }
]

const travelWords = ['Adventures', 'Journeys', 'Escapes', 'Discoveries', 'Expeditions']

const transitionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  },
  item: {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8 }
    }
  }
}

// Enhanced Hero Background with video-like experience
function HeroBackground() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  const heroImages = [
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&h=1080&fit=crop'
  ]

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isPlaying, heroImages.length])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImageIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImages[currentImageIndex]})` }}
        />
      </AnimatePresence>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Video Controls */}
      <div className="absolute bottom-6 left-6 flex items-center gap-3 text-white">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsPlaying(!isPlaying)}
          className="h-8 w-8 text-white hover:bg-white/20"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <div className="flex gap-1">
          {heroImages.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all cursor-pointer",
                index === currentImageIndex ? "bg-white" : "bg-white/50"
              )}
              onClick={() => setCurrentImageIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Text Rotator Component
function TextRotator({ words }: { words: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [words.length])

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={currentIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="text-[#ff6b35] !text-[inherit]"
        style={{ 
          display: 'inline-block',
          fontSize: 'inherit !important',
          fontWeight: 'inherit !important',
          lineHeight: 'inherit !important'
        }}
      >
        {words[currentIndex]}
      </motion.span>
    </AnimatePresence>
  )
}

// Inspirational Prompt Component (PRD requirement)
function InspirationalPrompt() {
  const [inputValue, setInputValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  
  // Add dynamic style for placeholder and ensure white background
  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .dream-destination-input::placeholder {
        color: #9ca3af !important;
        opacity: 1 !important;
      }
      .dream-destination-input {
        background-color: #ffffff !important;
        color: #111827 !important;
        -webkit-text-fill-color: #111827 !important;
      }
      .dream-destination-input:focus {
        background-color: #ffffff !important;
        color: #111827 !important;
      }
      .dream-destination-input:-webkit-autofill,
      .dream-destination-input:-webkit-autofill:hover,
      .dream-destination-input:-webkit-autofill:focus,
      .dream-destination-input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px white inset !important;
        -webkit-text-fill-color: #111827 !important;
        background-color: #ffffff !important;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const handleGetStarted = () => {
    // Navigate to AI planning interface with natural language input
    window.location.href = `/plan${inputValue ? `?q=${encodeURIComponent(inputValue)}` : ''}`
  }

  const startVoiceInput = () => {
    setIsListening(true)
    // Voice recognition implementation would go here
    setTimeout(() => setIsListening(false), 3000) // Demo timeout
  }

  return (
    <motion.div
      variants={transitionVariants.item}
      className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl max-w-2xl mx-auto"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-[#1f5582] text-center mb-6">
        Where is your next story taking you?
      </h2>
      
      <div className="space-y-6">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Tell me about your dream destination..."
            className="dream-destination-input w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-200 focus:border-[#1f5582] focus:outline-none pr-16 !bg-white !text-gray-900"
            style={{
              backgroundColor: '#ffffff !important',
              color: '#111827 !important',
              caretColor: '#111827',
              WebkitTextFillColor: '#111827',
              opacity: 1
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleGetStarted()}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={startVoiceInput}
            className={cn(
              "absolute right-2 top-2 h-12 w-12",
              isListening && "text-red-500 animate-pulse"
            )}
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleGetStarted}
            className="flex-1 bg-gradient-to-r from-[#1f5582] to-[#2d6ba3] hover:from-[#1a4a73] hover:to-[#265a94] text-white py-4 text-lg font-semibold rounded-xl"
          >
            Start Planning
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            className="border-2 border-[#1f5582] text-[#1f5582] hover:bg-[#1f5582] hover:text-white py-4 px-6 rounded-xl"
            asChild
          >
            <Link href="/demo">View Demo</Link>
          </Button>
        </div>
        
        <div className="text-center text-sm text-gray-600">
          Try: "7 days in Japan with temples and food" or "Family trip to Costa Rica"
        </div>
      </div>
    </motion.div>
  )
}

export default function Home() {
  const { track } = useAnalytics()

  useEffect(() => {
    track('homepage_visit')
  }, [track])

  const handleGetStarted = () => {
    track('get_started_click', { location: 'hero' })
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Section with Background */}
      <section className="relative h-screen flex items-center justify-center">
        <HeroBackground />
        
        <div className="relative z-10 container mx-auto px-6">
          <motion.div
            variants={transitionVariants}
            initial="hidden"
            animate="visible"
            className="text-center text-white space-y-8"
          >
            {/* Logo */}
            <motion.div variants={transitionVariants.item}>
              <TripNavLogo size="xl" animated={true} className="mx-auto text-white" />
            </motion.div>

            {/* Main Heading */}
            <motion.h1 
              variants={transitionVariants.item}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold max-w-4xl mx-auto leading-tight"
            >
              Plan Epic{' '}
              <TextRotator words={travelWords} />
              <br />
              <span className="text-white/90">Effortlessly</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              variants={transitionVariants.item}
              className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
            >
              Transform your travel dreams into reality with AI-powered planning
            </motion.p>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white/50 rounded-full mt-2" />
          </div>
        </motion.div>
      </section>

      {/* Inspirational Prompt Section */}
      <section className="py-20 relative bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-6">
          <InspirationalPrompt />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-[#1f5582] to-[#2d6ba3]">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-white/80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 border-[#e5e7eb]">
              <span className="text-[#1f5582] font-medium">Why Choose TripNav</span>
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f5582] mb-4 tracking-tight">
              Experience the Future of Travel Planning
            </h2>
            <p className="text-xl text-[#6b7280] max-w-3xl mx-auto">
              Our AI-powered platform connects you with local tour operators while creating
              personalized itineraries that match your unique travel style.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#1f5582] to-[#ff6b35] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed mb-4">{feature.description}</p>
                    <div className="text-sm font-semibold text-[#ff6b35]">{feature.stats}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 border-[#e5e7eb]">
              <span className="text-[#1f5582] font-medium">Success Stories</span>
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f5582] mb-4 tracking-tight">
              Loved by Travelers Worldwide
            </h2>
            <p className="text-xl text-[#6b7280] max-w-3xl mx-auto">
              Join thousands who've discovered their perfect trips with TripNav
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <Quote className="w-8 h-8 text-[#ff6b35]/20 mb-4" />
                    <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-4">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                        <p className="text-sm text-gray-600">{testimonial.role}</p>
                        <p className="text-xs text-[#ff6b35]">{testimonial.destination}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#ff6b35] text-[#ff6b35]" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tour Operator Section */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-[#1f5582] to-[#2d6ba3]">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#ff6b35]/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-[#ff6b35]/20 text-[#ff6b35] border-[#ff6b35]/30">
              <span className="font-medium">For Tour Operators</span>
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Grow Your Tour Business with AI-Powered Leads
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
              Join 500+ tour operators who are connecting with travelers actively planning trips.
              Get qualified leads, not just clicks.
            </p>
            
            {/* Value Props Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
              {[
                {
                  title: 'Qualified Leads',
                  description: 'Connect with travelers ready to book',
                  icon: Users,
                  stat: '85% conversion rate'
                },
                {
                  title: 'Commission-Based',
                  description: 'Pay only when you make sales',
                  icon: DollarSign,
                  stat: 'No upfront costs'
                },
                {
                  title: 'AI Matching',
                  description: 'Smart algorithm matches tours to travelers',
                  icon: Sparkles,
                  stat: '3x more bookings'
                },
                {
                  title: 'Growth Tools',
                  description: 'Analytics and insights to scale',
                  icon: TrendingUp,
                  stat: '150% avg growth'
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <feature.icon className="h-8 w-8 text-[#ff6b35] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-white/70 text-sm mb-3">{feature.description}</p>
                    <div className="text-[#ff6b35] font-bold text-sm">{feature.stat}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Success Story */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-3xl mx-auto mb-12 border border-white/20">
              <Quote className="w-10 h-10 text-[#ff6b35] mx-auto mb-4" />
              <p className="text-white text-lg italic mb-4">
                "TripNav transformed our business. We went from 10 bookings per month to over 150. 
                The quality of leads is incredible - these are travelers who actually book!"
              </p>
              <div className="flex items-center justify-center gap-4">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop"
                  alt="Tour operator"
                  className="w-12 h-12 rounded-full"
                />
                <div className="text-left">
                  <div className="text-white font-semibold">Carlos Martinez</div>
                  <div className="text-white/70 text-sm">Adventure Tours Costa Rica</div>
                  <div className="flex gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#ff6b35] text-[#ff6b35]" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-white text-[#1f5582] hover:bg-[#f3f4f6] px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
                asChild
              >
                <Link href="/onboarding">
                  <Building2 className="mr-2 h-5 w-5" />
                  Start Getting Leads Today
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg backdrop-blur-md"
                asChild
              >
                <Link href="/demo-multitenant">
                  View Demo Platform
                </Link>
              </Button>
            </div>

            <div className="mt-6 text-white/60 text-sm">
              <Award className="inline w-4 h-4 mr-1" />
              Trusted by 500+ tour operators worldwide
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f5582] mb-6">
              Ready for Your Next Adventure?
            </h2>
            <p className="text-xl text-[#6b7280] mb-8 max-w-2xl mx-auto">
              Join thousands of travelers who've discovered their perfect trips with our AI-powered platform
            </p>

            <Button
              size="lg"
              className="bg-gradient-to-r from-[#1f5582] to-[#2d6ba3] hover:from-[#1a4a73] hover:to-[#265a94] text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={handleGetStarted}
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <div className="mt-6 text-gray-500 text-sm">
              Free to start • No credit card required • AI-powered recommendations
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
