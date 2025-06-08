"use client"

import { animate, motion } from "framer-motion"
import React, { useEffect, useRef, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Plane, Sparkles as SparklesIcon, Users, Clock, MapPin, Calendar, Globe, Camera } from "lucide-react"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  className?: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color, className }) => {
  return (
    <div
      className={cn(
        "relative w-full max-w-sm p-6 rounded-xl border border-white/15 backdrop-blur-lg shadow-lg transition-all duration-300 hover:translate-y-[-5px] hover:shadow-xl",
        className
      )}
      style={{
        backgroundColor: `rgba(255, 255, 255, 0.08)`,
        boxShadow: `0 8px 32px 0 rgba(27, 54, 93, 0.15)`
      }}
    >
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <AnimatedSparkles />
      </div>
      
      <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      
      <p className="text-sm text-brand-neutral-200 mb-4">
        {description}
      </p>
      
      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="flex items-center text-sm text-white/70 hover:text-brand-orange-400 transition-colors cursor-pointer">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-orange-400 mr-2"></span>
          Learn more
        </div>
      </div>
    </div>
  )
}

const AnimatedSparkles = () => (
  <div className="h-full w-full absolute top-0 left-0 z-0">
    <SparkleAnimation />
  </div>
)

const SparkleAnimation = () => {
  const randomMove = () => Math.random() * 2 - 1
  const randomOpacity = () => Math.random()
  const random = () => Math.random()

  return (
    <div className="absolute inset-0">
      {[...Array(12)].map((_, i) => (
        <motion.span
          key={`star-${i}`}
          animate={{
            top: `calc(${random() * 100}% + ${randomMove()}px)`,
            left: `calc(${random() * 100}% + ${randomMove()}px)`,
            opacity: randomOpacity(),
            scale: [1, 1.2, 0],
          }}
          transition={{
            duration: random() * 2 + 4,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            top: `${random() * 100}%`,
            left: `${random() * 100}%`,
            width: `2px`,
            height: `2px`,
            borderRadius: "50%",
            zIndex: 1,
          }}
          className="inline-block bg-brand-orange-400"
        />
      ))}
    </div>
  )
}

interface TravelFeatureShowcaseProps {
  className?: string
}

export const TravelFeatureShowcase: React.FC<TravelFeatureShowcaseProps> = ({ className }) => {
  const features = [
    {
      icon: <MapPin className="h-6 w-6 text-white" />,
      title: "Smart Planning",
      description: "AI-powered itinerary suggestions based on your preferences, budget, and travel style for the perfect trip every time.",
      color: "bg-brand-blue-500"
    },
    {
      icon: <Calendar className="h-6 w-6 text-white" />,
      title: "Easy Scheduling",
      description: "Drag-and-drop timeline with real-time updates. Organize your days with intelligent time management and buffer recommendations.",
      color: "bg-brand-orange-500"
    },
    {
      icon: <Users className="h-6 w-6 text-white" />,
      title: "Group Collaboration",
      description: "Plan trips together seamlessly. Vote on activities, share expenses, and keep everyone synchronized with real-time updates.",
      color: "bg-brand-blue-600"
    },
    {
      icon: <Globe className="h-6 w-6 text-white" />,
      title: "Global Coverage",
      description: "Discover destinations and experiences worldwide with local insights, hidden gems, and authentic recommendations from travelers.",
      color: "bg-brand-orange-600"
    }
  ]

  return (
    <div className={cn("w-full py-20 relative", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-brand-blue-700 z-0"></div>
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-brand-orange-500/20 to-brand-orange-600/10 blur-3xl"
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
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-gradient-to-br from-brand-blue-400/15 to-brand-blue-500/20 blur-3xl"
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
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Everything You Need for the Perfect Trip
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-brand-neutral-200 max-w-2xl mx-auto"
          >
            Our travel itinerary builder combines powerful features to make your journey planning seamless and enjoyable.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TravelFeatureShowcase 