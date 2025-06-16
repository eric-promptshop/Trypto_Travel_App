"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
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
  CheckCircle,
  Clock,
  Shield,
  Smartphone,
  Building2,
  Palmtree
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
    duration: '7 days',
    budget: '$2,500',
    status: 'planned',
    rating: 4.9,
    travelers: 2,
    color: 'from-[#1f5582] to-[#2d6ba3]'
  },
  {
    id: '2',
    name: 'Brazilian Discovery',
    description: 'From Rio de Janeiro to the Amazon rainforest',
    duration: '10 days',
    budget: '$3,200',
    status: 'in-progress',
    rating: 4.8,
    travelers: 4,
    color: 'from-[#ff6b35] to-[#ff8759]'
  },
  {
    id: '3',
    name: 'Sacred Valley Trek',
    description: 'Hiking adventure through Peru\'s mystical landscapes',
    duration: '5 days',
    budget: '$1,800',
    status: 'completed',
    rating: 5.0,
    travelers: 3,
    color: 'from-[#2d6ba3] to-[#3d8bd3]'
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
        type: 'spring' as const,
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
    <span className={cn("relative inline-block min-w-[200px] sm:min-w-[250px] md:min-w-[300px]", className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          className="absolute inset-0 flex items-center justify-start"
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <span className="bg-gradient-to-r from-[#ff6b35] to-[#ff8759] bg-clip-text text-transparent font-bold text-4xl sm:text-5xl md:text-6xl lg:text-6xl whitespace-nowrap">
            {words[currentIndex]}
          </span>
        </motion.span>
      </AnimatePresence>
      <span className="opacity-0 font-bold text-4xl sm:text-5xl md:text-6xl lg:text-6xl">{words[0]}</span>
    </span>
  )
}

function HeroBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Clean gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-orange-50" />
      
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-[#ff6b35]/20 to-[#ff8759]/10 blur-3xl"
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
        className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-[#1f5582]/10 to-[#2d6ba3]/20 blur-3xl"
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
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle, #1f5582 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />
    </div>
  )
}



export default function Home() {
  const { data: session } = useSession()
  const { track } = useAnalytics()
  const [mounted, setMounted] = useState(false)
  // const [activeFeature] = useState(0) - removed to fix hydration
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    setMounted(true)
    track('homepage_visit')
    
    // Auto-rotation disabled for cleaner UI
    // const interval = setInterval(() => {
    //   setActiveFeature(prev => (prev + 1) % features.length)
    // }, 3000)
    
    // return () => clearInterval(interval)
  }, [track])

  const handleGetStarted = () => {
    track('get_started_click', { location: 'hero' })
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
          <Palmtree className="absolute inset-0 m-auto h-8 w-8 text-primary opacity-70" />
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
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <motion.div
                variants={transitionVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8"
              >
                {/* Logo */}
                <motion.div variants={transitionVariants.item}>
                  <TripNavLogo size="xl" animated={true} className="mx-auto" />
                </motion.div>

                {/* Main Heading */}
                <motion.h1 
                  variants={transitionVariants.item}
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-bold text-[#1f5582] max-w-4xl mx-auto leading-tight"
                >
                  Plan Epic{' '}
                  <TextRotator words={travelWords} />
                  <br />
                  <span className="text-[#374151]">Effortlessly</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p 
                  variants={transitionVariants.item}
                  className="text-xl text-[#6b7280] max-w-3xl mx-auto leading-relaxed"
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
                    className="bg-gradient-to-r from-[#ff6b35] to-[#ff8759] hover:from-[#ff5525] hover:to-[#ff7649] text-white border-0 px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    asChild
                  >
                    <Link href="/plan" onClick={handleGetStarted}>
                      <span>Start Your Journey</span>
                      <motion.div
                        animate={{ x: isHovered ? 5 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </motion.div>
                    </Link>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-[#e5e7eb] text-[#1f5582] hover:bg-[#f3f4f6] px-8 py-4 text-lg transition-all duration-300"
                    asChild
                  >
                    <Link href="/onboarding">
                      <Building2 className="mr-2 h-5 w-5" />
                      Tour Operator
                    </Link>
                  </Button>
                </motion.div>

                {/* Secondary CTA for White Label */}
                <motion.p
                  variants={transitionVariants.item}
                  className="text-[#6b7280] mt-6"
                >
                  Are you a tour operator? 
                  <Link 
                    href="/onboarding" 
                    className="text-[#ff6b35] hover:text-[#ff5525] ml-2 font-medium transition-colors duration-300 underline underline-offset-4"
                  >
                    Launch your white-label platform →
                  </Link>
                </motion.p>

                {/* Stats */}
                <motion.div 
                  variants={transitionVariants.item}
                  className="grid grid-cols-3 gap-8 max-w-md mx-auto pt-12"
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#1f5582] mb-1">50K+</div>
                    <div className="text-[#6b7280] text-sm">Trips Planned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#1f5582] mb-1">180+</div>
                    <div className="text-[#6b7280] text-sm">Countries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#ff6b35] mb-1">4.9★</div>
                    <div className="text-[#6b7280] text-sm">User Rating</div>
                  </div>
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
          <Link href="/plan">
            <div className="relative cursor-pointer hover:scale-105 transition-transform">
              <div className="absolute inset-0 rounded-xl bg-[#ff6b35]/10 blur-xl" />
              <div className="relative bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#ff6b35]/10 rounded-lg">
                    <Plane className="h-5 w-5 text-[#ff6b35]" />
                  </div>
                  <div>
                    <div className="text-[#1f5582] font-medium text-sm">Ready to explore?</div>
                    <div className="text-[#6b7280] text-xs">Start your journey today</div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-[#f3f4f6] relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 border-[#e5e7eb]">
              <span className="text-[#1f5582] font-medium">Features</span>
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f5582] mb-4 tracking-tight">
              Why Choose TravelBuilder?
            </h2>
            <p className="text-xl text-[#6b7280] max-w-2xl mx-auto">
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
                <Card className="h-full border-[#e5e7eb] bg-white hover:shadow-lg transition-all duration-300 overflow-hidden group">
                  <CardHeader className="relative">
                    <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-[#ff6b35]/10 group-hover:bg-[#ff6b35]/20 transition-colors duration-300" />
                    <div className="relative z-10">
                      <div className="bg-[#1f5582]/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#1f5582]/20 transition-colors duration-300">
                        <feature.icon className="h-7 w-7 text-[#1f5582]" />
                      </div>
                      <CardTitle className="text-xl text-[#1f5582]">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-[#6b7280]">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {/* Feature highlight */}
          <motion.div 
            className="mt-20 bg-gradient-to-r from-[#1f5582] to-[#2d6ba3] rounded-2xl p-8 overflow-hidden relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <motion.div 
                className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/10 blur-3xl"
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
                <Badge className="mb-4 bg-[#ff6b35] text-white border-0">
                  <span>Featured</span>
                </Badge>
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                  AI-Powered Itinerary Creation
                </h3>
                <p className="text-white/80 mb-6">
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
                      className="flex items-start text-white"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      viewport={{ once: true }}
                    >
                      <CheckCircle className="h-5 w-5 text-[#ff6b35] mr-2 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
                <Button className="mt-6 bg-white text-[#1f5582] hover:bg-[#f3f4f6]" asChild>
                  <Link href="/plan">
                    Try It Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="relative">
                <motion.div 
                  className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl border border-white/20"
                  whileInView={{ 
                    y: [0, -10, 0],
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                  viewport={{ once: true }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-white font-semibold">AI Trip Planner</h4>
                      <Badge className="bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30">Active</Badge>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="text-white/60 text-sm">Analyzing preferences...</div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <motion.div 
                            className="bg-[#ff6b35] h-2 rounded-full"
                            animate={{ width: ["0%", "100%"] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-6">
                        {['Adventure', 'Culture', 'Relaxation'].map((type, i) => (
                          <div key={type} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                            <div className="text-[#ff6b35] text-2xl font-bold">{85 + i * 5}%</div>
                            <div className="text-white/60 text-xs mt-1">{type}</div>
                          </div>
                        ))}
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
        <section className="py-20 bg-gradient-to-b from-white to-[#f3f4f6] relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
          
          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <Badge variant="outline" className="mb-2 border-[#e5e7eb]">
                    <span className="text-[#1f5582] font-medium">Your Trips</span>
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold text-[#1f5582] mb-2 tracking-tight">
                    Welcome back, {session.user?.name?.split(' ')[0]}!
                  </h2>
                  <p className="text-xl text-[#6b7280]">
                    Continue planning your adventures or start a new journey.
                  </p>
                </div>
                <Button 
                  size="lg"
                  className="group bg-[#ff6b35] hover:bg-[#ff5525] text-white"
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
                          duration={trip.duration}
                          budget={trip.budget}
                          rating={trip.rating}
                          travelers={trip.travelers}
                          status={trip.status}
                          color={trip.color}
                          onSelect={handleTripSelect}
                          className="hover:shadow-xl transition-all duration-300"
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
                          duration={trip.duration}
                          budget={trip.budget}
                          rating={trip.rating}
                          travelers={trip.travelers}
                          status={trip.status}
                          color={trip.color}
                          onSelect={handleTripSelect}
                          className="hover:shadow-xl transition-all duration-300"
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
                          duration={trip.duration}
                          budget={trip.budget}
                          rating={trip.rating}
                          travelers={trip.travelers}
                          status={trip.status}
                          color={trip.color}
                          onSelect={handleTripSelect}
                          className="hover:shadow-xl transition-all duration-300"
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
                          duration={trip.duration}
                          budget={trip.budget}
                          rating={trip.rating}
                          travelers={trip.travelers}
                          status={trip.status}
                          color={trip.color}
                          onSelect={handleTripSelect}
                          className="hover:shadow-xl transition-all duration-300"
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

      {/* White Label Section */}
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
              White-Label Your Travel Platform
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
              Launch your own branded travel planning platform with our comprehensive white-label solution. 
              Perfect for tour operators, travel agencies, and destination management companies.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              {[
                {
                  title: 'Your Brand',
                  description: 'Fully customizable with your logo, colors, and domain',
                  icon: Sparkles
                },
                {
                  title: 'AI-Powered',
                  description: 'Leverage our advanced AI for itinerary planning',
                  icon: Globe
                },
                {
                  title: 'Ready to Scale',
                  description: 'Handle unlimited clients and trips effortlessly',
                  icon: Users
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    <feature.icon className="h-8 w-8 text-[#ff6b35] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-white/70 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-white text-[#1f5582] hover:bg-[#f3f4f6] px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
                asChild
              >
                <Link href="/onboarding">
                  <Plane className="mr-2 h-5 w-5" />
                  Start White-Label Setup
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
                  View Live Demo
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4 border-[#e5e7eb]">
              <span className="text-[#1f5582] font-medium">Quick Access</span>
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f5582] mb-4 tracking-tight">
              Ready to Explore?
            </h2>
            <p className="text-xl text-[#6b7280] max-w-2xl mx-auto">
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
                action: 'plan_new_trip',
                requiresAuth: false
              },
              {
                icon: Calendar,
                title: 'View Itinerary',
                description: 'See your current travel plans and schedules',
                href: '/itinerary-display',
                action: 'view_itinerary',
                requiresAuth: true
              },
              {
                icon: Map,
                title: 'My Trips',
                description: 'Manage all your past and upcoming adventures',
                href: '/trips',
                action: 'browse_trips',
                requiresAuth: true
              },
              {
                icon: CheckCircle,
                title: 'Get Help',
                description: 'Learn how to make the most of our platform',
                href: '/docs',
                action: 'get_help',
                requiresAuth: false
              }
            ].filter(item => session || !item.requiresAuth).map((item, index) => (
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
                  <Card className="h-full border-[#e5e7eb] bg-white hover:shadow-lg transition-all duration-300 overflow-hidden group">
                    <CardHeader className="text-center">
                      <div className="mx-auto bg-[#1f5582]/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#ff6b35]/10 transition-all duration-300 group-hover:scale-110">
                        <item.icon className="h-8 w-8 text-[#1f5582] group-hover:text-[#ff6b35] transition-colors duration-300" />
                      </div>
                      <CardTitle className="text-[#1f5582] group-hover:text-[#ff6b35] transition-colors duration-300">{item.title}</CardTitle>
                      <CardDescription className="text-base text-[#6b7280]">
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
