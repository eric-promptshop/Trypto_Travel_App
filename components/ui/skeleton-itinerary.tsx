"use client"

import React from "react"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Sparkles, MapPin, Calendar, Clock } from "lucide-react"

export function SkeletonItinerary() {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-3 mb-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-8 h-8 text-[#ff6b35]" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900">
            Generating Your Perfect Itinerary
          </h2>
        </motion.div>
        <p className="text-gray-600">
          Our AI is crafting a personalized travel experience just for you...
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#2563eb] to-[#ff6b35]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 20, ease: "easeInOut" }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-600 text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Analyzing destinations...
          </motion.span>
        </div>
      </div>

      {/* Did You Know Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-1">Did you know?</h4>
            <motion.p
              key="tip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-blue-800"
            >
              Our AI analyzes over 50,000 data points to create your perfect itinerary, including weather patterns, local events, and traveler reviews.
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}