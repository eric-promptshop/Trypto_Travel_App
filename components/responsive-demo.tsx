"use client"

import { motion } from "framer-motion"
import { useDeviceType } from "@/hooks/use-device-type"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  fadeIn, 
  slideUp, 
  scaleIn, 
  staggerContainer, 
  staggerItem, 
  cardHover, 
  getDeviceAnimation,
  smoothSpring 
} from "@/lib/animations"

export function ResponsiveDemo() {
  const deviceType = useDeviceType()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
      <motion.div
        className="max-w-7xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Header with device type indicator */}
        <motion.div variants={staggerItem} className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Responsive Design Demo</h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md">
            <span className="text-sm text-gray-600">Current Device:</span>
            <span className="font-semibold text-brand-blue-600 capitalize">{deviceType}</span>
          </div>
        </motion.div>

        {/* Device-specific layouts */}
        {deviceType === 'mobile' && (
          <MobileLayout />
        )}
        
        {deviceType === 'tablet' && (
          <TabletLayout />
        )}
        
        {deviceType === 'desktop' && (
          <DesktopLayout />
        )}
      </motion.div>
    </div>
  )
}

// Mobile Layout - Stack everything vertically
function MobileLayout() {
  return (
    <motion.div 
      className="space-y-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={staggerItem}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mobile Layout</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Optimized for touch with larger tap targets and vertical scrolling.
            </p>
            <Button className="w-full mt-4" size="lg">
              Full Width Button
            </Button>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Stack cards vertically on mobile */}
      {[1, 2, 3].map((i) => (
        <motion.div key={i} variants={staggerItem}>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Feature {i}</h3>
              <p className="text-sm text-gray-600">
                Mobile-optimized content with simplified interactions.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

// Tablet Layout - 2 column grid
function TabletLayout() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={smoothSpring}
    >
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tablet Layout</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Balanced layout with 2-column grid for optimal tablet viewing.
          </p>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...smoothSpring, delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="h-full">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Feature {i}</h3>
                <p className="text-sm text-gray-600">
                  Tablet-optimized with touch-friendly hover states.
                </p>
                <Button className="mt-4" size="default">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// Desktop Layout - 3 column grid with advanced interactions
function DesktopLayout() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={smoothSpring}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <CardTitle>Desktop Layout</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Full-featured desktop experience with hover effects and 3-column grid.
            </p>
          </CardContent>
        </Card>
      </motion.div>
      
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <motion.div
            key={i}
            variants={cardHover}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
          >
            <Card className="h-full cursor-pointer">
              <CardContent className="p-6">
                <div className="h-32 bg-gradient-to-br from-brand-blue-500 to-brand-orange-500 rounded-lg mb-4" />
                <h3 className="font-semibold mb-2">Feature {i}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Desktop-optimized with rich hover interactions and animations.
                </p>
                <Button variant="outline" size="sm">
                  Explore Feature
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}