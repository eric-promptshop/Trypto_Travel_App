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

      {/* Skeleton Days */}
      <div className="space-y-6">
        {[1, 2, 3].map((day) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: day * 0.2 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Morning Activity */}
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-4 mt-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>

                {/* Afternoon Activity */}
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-4 mt-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>

                {/* Evening Activity */}
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-4 mt-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Loading Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200"
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