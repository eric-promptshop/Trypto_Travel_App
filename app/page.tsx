"use client"

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAnalytics } from '@/lib/analytics/analytics-service'
import { useTripContext } from '@/contexts/TripContext'
import { TripCard } from '@/components/molecules/TripCard'
import { 
  Plane, 
  Map, 
  Calendar, 
  Users, 
  Globe, 
  Sparkles, 
  ArrowRight,
  CheckCircle,
  Clock,
  Shield,
  Smartphone,
  Compass,
  PalmtreeIcon,
  Luggage,
  MapPin,
  Camera
} from 'lucide-react'
import { TripNavLogo } from '@/components/ui/TripNavLogo'
import { cn } from '@/lib/utils'
import { TravelFeatureShowcase } from '@/components/sections/FeatureShowcase'
import { TravelCTA } from '@/components/sections/CTASection'

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Planning',
    description: 'Get personalized itineraries created by advanced AI that understands your preferences.'
  },
  {
    icon: Globe,
    title: 'Global Destinations',
    description: 'Explore over 200+ destinations worldwide with detailed local insights and recommendations.'
  },
  {
    icon: Smartphone,
    title: 'Mobile Optimized',
    description: 'Plan and manage your trips on any device with our responsive, mobile-first design.'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your travel data is encrypted and protected with enterprise-grade security.'
  },
  {
    icon: Users,
    title: 'Group Planning',
    description: 'Collaborate with fellow travelers and plan group trips with shared itineraries.'
  },
  {
    icon: Clock,
    title: 'Real-time Updates',
    description: 'Get live pricing, availability, and updates for your bookings and activities.'
  }
]

const recentTrips = [
  {
    id: '1',
    name: 'Peru Adventure',
    description: 'Explore ancient Incan ruins and vibrant culture in the heart of South America',
    imageUrl: '/images/machu-picchu.png',
    duration: '7 days',
    budget: '$2,500',
    status: 'planned'
  },
  {
    id: '2',
    name: 'Brazilian Discovery',
    description: 'From Rio de Janeiro to the Amazon rainforest',
    imageUrl: '/images/rio-de-janeiro.png',
    duration: '10 days',
    budget: '$3,200',
    status: 'in-progress'
  },
  {
    id: '3',
    name: 'Sacred Valley Trek',
    description: 'Hiking adventure through Peru\'s mystical landscapes',
    imageUrl: '/images/sacred-valley.png',
    duration: '5 days',
    budget: '$1,800',
    status: 'completed'
  }
]

// Animation variants for staggered children
const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 20,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring',
        bounce: 0.3,
        duration: 1.2,
      },
    },
  },
}

// Rotating words for dynamic text
const travelWords = ["Adventures", "Journeys", "Memories", "Experiences"]

function TextRotator({ words, className = "" }: { words: string[], className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length)
    }, 3000)

    return () => clearInterval(timer)
  }, [words.length])

  return (
    <span className={cn("relative inline-block min-w-[200px]", className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <span className="bg-gradient-to-r from-brand-orange-400 to-brand-orange-600 bg-clip-text text-transparent">
            {words[currentIndex]}
          </span>
        </motion.span>
      </AnimatePresence>
      <span className="opacity-0">{words[0]}</span>
    </span>
  )
}

function HeroBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-brand-blue-700" />
      
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-brand-orange-500/30 to-brand-orange-600/20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      <motion.div
        className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-gradient-to-br from-brand-blue-400/20 to-brand-blue-500/30 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1
        }}
      />

      {/* Dot pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Subtle geometric lines */}
      <div className="absolute inset-0">
        <svg className="w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description, delay = 0 }: {
  icon: any,
  title: string,
  description: string,
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="group relative"
    >
      <div className="absolute inset-0 rounded-2xl bg-white/5 blur-xl" />
      <div className="relative p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-brand-orange-500/20 rounded-xl group-hover:bg-brand-orange-500/30 transition-colors duration-300">
            <Icon className="h-6 w-6 text-brand-orange-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{title}</h3>
            <p className="text-brand-neutral-200 text-sm mt-1">{description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function StatsCard({ value, label, delay = 0 }: { value: string, label: string, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="text-center"
    >
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-brand-neutral-200 text-sm">{label}</div>
    </motion.div>
  )
}

export default function Home() {
  const { data: session } = useSession()
  const { track } = useAnalytics()
  const { trips } = useTripContext()
  const [mounted, setMounted] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9])
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100])
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    setMounted(true)
    track('homepage_visit')
    
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [track])

  const handleGetStarted = () => {
    track('get_started_click', { location: 'hero' })
  }

  const handleExploreDemo = () => {
    track('explore_demo_click', { location: 'hero' })
  }

  const handleTripSelect = (tripId: string) => {
    track('trip_card_click', { tripId })
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="relative w-20 h-20">
          <motion.div 
            className="absolute inset-0 rounded-full border-t-2 border-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <PalmtreeIcon className="absolute inset-0 m-auto h-8 w-8 text-primary opacity-70" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <HeroBackground />
      
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">
              <motion.div
                variants={transitionVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8"
              >
                {/* Logo */}
                <motion.div variants={transitionVariants.item}>
                  <TripNavLogo size="xl" animated={true} variant="white" className="mx-auto" />
                </motion.div>

                {/* Main Heading */}
                <motion.h1 
                  variants={transitionVariants.item}
                  className="text-5xl md:text-6xl lg:text-7xl font-bold text-white max-w-4xl mx-auto leading-tight"
                >
                  Plan Epic{' '}
                  <TextRotator words={travelWords} />
                  <br />
                  <span className="text-brand-neutral-100">Effortlessly</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p 
                  variants={transitionVariants.item}
                  className="text-xl md:text-2xl text-brand-neutral-200 max-w-3xl mx-auto leading-relaxed"
                >
                  Create detailed itineraries, discover hidden gems, and make every trip unforgettable 
                  with our AI-powered travel planning platform.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div 
                  variants={transitionVariants.item}
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-brand-orange-500 to-brand-orange-600 hover:from-brand-orange-600 hover:to-brand-orange-700 text-white border-0 px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <span>Start Planning</span>
                    <motion.div
                      animate={{ x: isHovered ? 5 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </motion.div>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg rounded-full backdrop-blur-md"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </motion.div>

                {/* Stats */}
                <motion.div 
                  variants={transitionVariants.item}
                  className="grid grid-cols-3 gap-8 max-w-md mx-auto pt-12"
                >
                  <StatsCard value="50K+" label="Trips Planned" delay={0.8} />
                  <StatsCard value="180+" label="Countries" delay={1.0} />
                  <StatsCard value="4.9★" label="User Rating" delay={1.2} />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <TravelFeatureShowcase />

        {/* Call to Action */}
        <TravelCTA />

        {/* Floating action card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.6 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-white/10 blur-xl" />
            <div className="relative bg-white/20 backdrop-blur-md rounded-xl border border-white/30 p-4 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-brand-orange-500/20 rounded-lg">
                  <Plane className="h-5 w-5 text-brand-orange-400" />
                </div>
                <div>
                  <div className="text-white font-medium text-sm">Ready to explore?</div>
                  <div className="text-brand-neutral-200 text-xs">Start your journey today</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">
              <span className="text-primary font-medium">Features</span>
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Why Choose TravelBuilder?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the future of travel planning with our cutting-edge features designed for modern travelers.
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
                whileHover={{ y: -5 }}
              >
                <Card className="h-full border-border/50 backdrop-blur-sm bg-background/80 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden group">
                  <CardHeader className="relative">
                    <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300" />
                    <div className="relative z-10">
                      <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                        <feature.icon className="h-7 w-7 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {/* Feature highlight */}
          <motion.div 
            className="mt-20 bg-gradient-to-r from-background via-background/90 to-background rounded-2xl border border-border/50 p-8 backdrop-blur-sm overflow-hidden relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <motion.div 
                className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl"
                animate={{ 
                  x: [0, 30, 0],
                  y: [0, -30, 0],
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
              <div>
                <Badge variant="secondary" className="mb-4">
                  <span className="text-primary">Featured</span>
                </Badge>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  AI-Powered Itinerary Creation
                </h3>
                <p className="text-muted-foreground mb-6">
                  Our advanced AI analyzes thousands of travel data points to create the perfect itinerary based on your preferences, budget, and travel style.
                </p>
                <ul className="space-y-3">
                  {[
                    'Personalized recommendations based on your interests',
                    'Optimized routes to maximize your time',
                    'Weather-aware scheduling',
                    'Budget-conscious planning'
                  ].map((item, i) => (
                    <motion.li 
                      key={i}
                      className="flex items-start"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      viewport={{ once: true }}
                    >
                      <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
                <Button className="mt-6" asChild>
                  <Link href="/plan">
                    Try It Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent md:hidden z-10" />
                <motion.div 
                  className="bg-muted rounded-xl overflow-hidden shadow-2xl"
                  whileInView={{ 
                    rotateY: [0, 5, 0, -5, 0],
                    rotateX: [0, -5, 0, 5, 0]
                  }}
                  transition={{ 
                    duration: 10, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                  viewport={{ once: true }}
                >
                  <div className="p-1 bg-muted">
                    <div className="flex items-center space-x-1 mb-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    </div>
                    <div className="bg-background rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-6 w-32 bg-muted/70 rounded" />
                        <div className="h-6 w-20 bg-primary/20 rounded" />
                      </div>
                      <div className="space-y-3">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeFeature}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-3"
                          >
                            <div className="h-4 w-full bg-muted/70 rounded" />
                            <div className="h-4 w-5/6 bg-muted/70 rounded" />
                            <div className="h-4 w-4/6 bg-muted/70 rounded" />
                            <div className="mt-4 grid grid-cols-3 gap-2">
                              <div className="h-20 bg-primary/10 rounded" />
                              <div className="h-20 bg-primary/10 rounded" />
                              <div className="h-20 bg-primary/10 rounded" />
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recent Trips / Dashboard Section */}
      {session && (
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <Badge variant="outline" className="mb-2">
                    <span className="text-primary font-medium">Your Trips</span>
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">
                    Welcome back, {session.user?.name?.split(' ')[0]}!
                  </h2>
                  <p className="text-xl text-muted-foreground">
                    Continue planning your adventures or start a new journey.
                  </p>
                </div>
                <Button 
                  size="lg"
                  className="group"
                  asChild
                >
                  <Link href="/trips">
                    <Map className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                    View All Trips
                  </Link>
                </Button>
              </div>

              <Tabs defaultValue="all" className="mb-8">
                <TabsList className="mb-6">
                  <TabsTrigger value="all">All Trips</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentTrips.map((trip, index) => (
                      <motion.div
                        key={trip.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -5 }}
                      >
                        <TripCard
                          id={trip.id}
                          name={trip.name}
                          description={trip.description}
                          imageUrl={trip.imageUrl}
                          onSelect={handleTripSelect}
                          className="hover:shadow-xl transition-all duration-300 border-border/50 backdrop-blur-sm bg-background/80"
                        />
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="upcoming" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentTrips.filter(t => t.status === 'planned').map((trip, index) => (
                      <motion.div
                        key={trip.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ y: -5 }}
                      >
                        <TripCard
                          id={trip.id}
                          name={trip.name}
                          description={trip.description}
                          imageUrl={trip.imageUrl}
                          onSelect={handleTripSelect}
                          className="hover:shadow-xl transition-all duration-300 border-border/50 backdrop-blur-sm bg-background/80"
                        />
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="past" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentTrips.filter(t => t.status === 'completed').map((trip, index) => (
                      <motion.div
                        key={trip.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ y: -5 }}
                      >
                        <TripCard
                          id={trip.id}
                          name={trip.name}
                          description={trip.description}
                          imageUrl={trip.imageUrl}
                          onSelect={handleTripSelect}
                          className="hover:shadow-xl transition-all duration-300 border-border/50 backdrop-blur-sm bg-background/80"
                        />
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="drafts" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentTrips.filter(t => t.status === 'in-progress').map((trip, index) => (
                      <motion.div
                        key={trip.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ y: -5 }}
                      >
                        <TripCard
                          id={trip.id}
                          name={trip.name}
                          description={trip.description}
                          imageUrl={trip.imageUrl}
                          onSelect={handleTripSelect}
                          className="hover:shadow-xl transition-all duration-300 border-border/50 backdrop-blur-sm bg-background/80"
                        />
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="py-20 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4">
              <span className="text-primary font-medium">Quick Access</span>
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Ready to Explore?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose how you'd like to start your travel planning journey.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Plane,
                title: 'Plan New Trip',
                description: 'Start from scratch with our AI-powered planning tool',
                href: '/plan',
                action: 'plan_new_trip'
              },
              {
                icon: Calendar,
                title: 'View Itinerary',
                description: 'See your current travel plans and schedules',
                href: '/itinerary-display',
                action: 'view_itinerary'
              },
              {
                icon: Map,
                title: 'My Trips',
                description: 'Manage all your past and upcoming adventures',
                href: '/trips',
                action: 'browse_trips'
              },
              {
                icon: CheckCircle,
                title: 'Get Help',
                description: 'Learn how to make the most of our platform',
                href: '/docs',
                action: 'get_help'
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Link 
                  href={item.href} 
                  onClick={() => track('quick_action_click', { action: item.action })}
                  className="block h-full"
                >
                  <Card className="h-full border-border/50 backdrop-blur-sm bg-background/80 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden group">
                    <CardHeader className="text-center">
                      <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                        <item.icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors duration-300">{item.title}</CardTitle>
                      <CardDescription className="text-base">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
