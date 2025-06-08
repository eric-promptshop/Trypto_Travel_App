"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Star, Clock, Sparkles, CheckCircle, Globe, Shield, Headphones } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TripNavLogo } from "@/components/ui/TripNavLogo"
import { useRouter } from "next/navigation"

interface LandingPageProps {
  onGetStarted: () => void
}

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Planning",
    description:
      "Our intelligent system creates personalized itineraries based on your preferences, budget, and travel style.",
  },
  {
    icon: Globe,
    title: "150+ Destinations",
    description:
      "From hidden gems to iconic landmarks, explore curated experiences across the globe with local insights.",
  },
  {
    icon: Clock,
    title: "3-Minute Setup",
    description:
      "Get a complete travel itinerary in minutes, not days. Our streamlined process makes planning effortless.",
  },
  {
    icon: Shield,
    title: "Expert Curation",
    description: "Every recommendation is vetted by travel experts to ensure authentic, high-quality experiences.",
  },
]

const testimonials = [
  {
    name: "Sarah Chen",
    location: "San Francisco, CA",
    text: "TripNav planned our perfect 2-week European adventure. Every detail was spot-on!",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    location: "Austin, TX",
    text: "The AI understood exactly what we wanted. Best travel planning experience ever.",
    rating: 5,
  },
  {
    name: "Elena Rodriguez",
    location: "Miami, FL",
    text: "Saved us hours of research. The itinerary was flawless from start to finish.",
    rating: 5,
  },
]

const stats = [
  { number: "10,000+", label: "Happy Travelers" },
  { number: "150+", label: "Destinations" },
  { number: "4.9/5", label: "Average Rating" },
  { number: "3 min", label: "Planning Time" },
]

function LandingPage({ onGetStarted }: LandingPageProps) {
  const [currentFeature, setCurrentFeature] = useState(0)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const router = useRouter()

  const handleTourOperatorOnboarding = () => {
    router.push("/onboarding/welcome")
  }

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-orange-50/30 overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-[#1f5582]/10 to-[#ff7b00]/10 rounded-full blur-xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-[#ff7b00]/10 to-[#1f5582]/10 rounded-full blur-xl"
          animate={{
            x: [0, -25, 0],
            y: [0, 15, 0],
          }}
          transition={{
            duration: 6,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-[#1f5582]/5 to-[#ff7b00]/5 rounded-full blur-2xl"
          animate={{
            x: [0, 20, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="relative z-20 px-4 py-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <TripNavLogo />
            <div className="flex items-center gap-4">
              <Button
                onClick={handleTourOperatorOnboarding}
                variant="ghost"
                className="text-[#1f5582] hover:bg-[#1f5582]/10 px-6 py-2 rounded-full font-medium transition-all duration-300 hidden md:flex items-center gap-2"
              >
                Tour Operators
              </Button>
              <Button
                onClick={onGetStarted}
                variant="outline"
                className="border-2 border-[#1f5582] text-[#1f5582] hover:bg-[#1f5582] hover:text-white px-6 py-2 rounded-full font-medium transition-all duration-300 hidden sm:flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-4 pt-8 pb-16 md:pt-12 md:pb-24">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1f5582]/10 to-[#ff7b00]/10 backdrop-blur-sm border border-[#1f5582]/20 rounded-full px-4 py-2 mb-6">
                <Star className="w-4 h-4 text-[#ff7b00] fill-current" />
                <span className="text-sm font-medium text-[#1f5582]">Rated 4.9/5 by 10,000+ travelers</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-[#1f5582] via-[#2d6ba3] to-[#ff7b00] bg-clip-text text-transparent">
                  Plan Your Perfect
                </span>
                <br />
                <span className="text-gray-900">Adventure</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Get a personalized travel itinerary in minutes with our AI-powered planning assistant. From hidden gems
                to iconic destinations, we'll craft your dream trip.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={onGetStarted}
                  size="lg"
                  className="bg-gradient-to-r from-[#1f5582] to-[#2d6ba3] hover:from-[#1a4a73] hover:to-[#265a94] text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[200px]"
                >
                  Start Planning Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-[#1f5582] text-[#1f5582] hover:bg-[#1f5582] hover:text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 min-w-[200px]"
                >
                  View Sample Trip
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-2xl md:text-3xl font-bold text-[#1f5582] mb-1">{stat.number}</div>
                  <div className="text-sm md:text-base text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose TripNav?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Experience the future of travel planning with our intelligent platform
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#1f5582] to-[#ff7b00] rounded-xl flex items-center justify-center mx-auto mb-4">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-4 py-16 bg-gradient-to-r from-[#1f5582]/5 to-[#ff7b00]/5">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-lg text-gray-600">Three simple steps to your perfect trip</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Tell Us Your Dreams",
                  description: "Share your travel preferences, budget, and interests through our intelligent form",
                },
                {
                  step: "2",
                  title: "AI Creates Magic",
                  description: "Our AI analyzes thousands of options to craft your personalized itinerary",
                },
                {
                  step: "3",
                  title: "Book & Explore",
                  description: "Review, customize, and book your perfect trip with our travel experts",
                },
              ].map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-[#1f5582] to-[#ff7b00] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">{step.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Loved by Travelers</h2>
              <p className="text-lg text-gray-600">See what our community says about their experiences</p>
            </motion.div>

            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                      <div className="flex justify-center mb-4">
                        {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-[#ff7b00] fill-current" />
                        ))}
                      </div>
                      <p className="text-lg text-gray-700 mb-6 italic">"{testimonials[currentTestimonial].text}"</p>
                      <div>
                        <div className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</div>
                        <div className="text-gray-600 text-sm">{testimonials[currentTestimonial].location}</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center mt-6 gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentTestimonial ? "bg-[#1f5582] w-6" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-16 bg-gradient-to-r from-[#1f5582] to-[#2d6ba3]">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready for Your Next Adventure?</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of travelers who've discovered their perfect trips with TripNav
              </p>

              <Button
                onClick={onGetStarted}
                size="lg"
                className="bg-[#ff7b00] hover:bg-[#e66d00] text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Start Planning Your Trip
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <div className="mt-6 text-blue-200 text-sm">Free to start • No credit card required • 3-minute setup</div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 py-8 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4" />
                <span className="text-sm">24/7 Support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Expert Verified</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 TripNav. All rights reserved. Making travel planning effortless.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default LandingPage
