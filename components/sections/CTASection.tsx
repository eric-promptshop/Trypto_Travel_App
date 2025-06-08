"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { MapPin, Compass, ArrowRight, Plane, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

interface TravelCTAProps {
  title?: string
  subtitle?: string
  description?: string
  primaryAction?: {
    text: string
    href: string
  }
  secondaryAction?: {
    text: string
    href: string
  }
  className?: string
}

const GlassCard = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) => {
  return (
    <div 
      className={cn(
        "relative rounded-xl border border-white/15 bg-white/5 p-8 md:p-12 backdrop-blur-lg",
        "shadow-[0_8px_32px_0_rgba(27,54,93,0.15)]",
        "before:absolute before:inset-0 before:-z-10 before:rounded-xl before:bg-gradient-to-r before:from-brand-blue-800 before:to-brand-blue-900 before:opacity-70 before:blur-[2px]",
        className
      )}
    >
      {children}
    </div>
  )
}

export function TravelCTA({
  title = "Start Your Next Adventure",
  subtitle = "Travel Planning Made Easy",
  description = "Create personalized travel itineraries with our AI-powered platform. Discover hidden gems, plan your perfect route, and make unforgettable memories with TripNav.",
  primaryAction = {
    text: "Start Planning",
    href: "/plan",
  },
  secondaryAction = {
    text: "Watch Demo",
    href: "/demo",
  },
  className,
}: TravelCTAProps) {
  return (
    <section className={cn("relative overflow-hidden py-20 md:py-32", className)}>
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-brand-blue-700" />
      
      {/* Decorative elements */}
      <motion.div 
        className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-orange-500/20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      <motion.div 
        className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-brand-blue-400/15 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1
        }}
      />
      
      <div className="container relative mx-auto px-6">
        <div className="mx-auto max-w-4xl">
          <GlassCard className="overflow-hidden">
            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Badge variant="outline" className="mb-6 bg-brand-orange-500/10 text-brand-orange-400 border-brand-orange-500/30 hover:bg-brand-orange-500/20">
                  <Sparkles className="mr-2 h-3 w-3" />
                  {subtitle}
                </Badge>
              </motion.div>

              {/* Title */}
              <motion.h2 
                className="mb-6 text-4xl font-bold text-white sm:text-5xl md:text-6xl lg:text-7xl leading-tight"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                {title}
              </motion.h2>

              {/* Description */}
              <motion.p 
                className="mb-10 max-w-2xl text-lg md:text-xl text-brand-neutral-200 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                {description}
              </motion.p>

              {/* Action Buttons */}
              <motion.div 
                className="flex flex-col space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-brand-orange-500 to-brand-orange-600 hover:from-brand-orange-600 hover:to-brand-orange-700 text-white border-0 px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
                  asChild
                >
                  <a href={primaryAction.href}>
                    <Plane className="mr-2 h-5 w-5 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
                    {primaryAction.text}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-white/30 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 px-8 py-4 text-lg rounded-full"
                  asChild
                >
                  <a href={secondaryAction.href}>
                    {secondaryAction.text}
                  </a>
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="grid grid-cols-3 gap-8 max-w-lg mx-auto pt-12 mt-12 border-t border-white/10"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">50K+</div>
                  <div className="text-brand-neutral-300 text-sm">Happy Travelers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">180+</div>
                  <div className="text-brand-neutral-300 text-sm">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">4.9★</div>
                  <div className="text-brand-neutral-300 text-sm">Rating</div>
                </div>
              </motion.div>
              
              {/* Decorative icons */}
              <div className="absolute -left-6 top-1/2 opacity-5">
                <MapPin className="h-24 w-24 text-white" />
              </div>
              <div className="absolute -right-6 bottom-0 opacity-5">
                <Compass className="h-32 w-32 text-white" />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  )
}

export default TravelCTA 