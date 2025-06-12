"use client"

import { motion } from 'framer-motion'
import { Plane } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TripNavLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  variant?: 'default' | 'white'
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl'
}

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-6 w-6'
}

export function TripNavLogo({ 
  className, 
  size = 'md', 
  animated = true,
  variant = 'default'
}: TripNavLogoProps) {
  const textColor = variant === 'white' ? 'text-white' : 'text-[#1f5582]'
  const iconColor = variant === 'white' ? 'text-white' : 'text-[#ff6b35]'
  const underlineColor = variant === 'white' ? 'bg-white' : 'bg-[#1f5582]'
  
  const containerVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 }
  }
  
  const airplaneVariants = {
    initial: { x: 0, rotate: 0 },
    hover: { x: 3, rotate: 5 }
  }
  
  const underlineVariants = {
    initial: { width: "0%" },
    animate: { width: "100%" },
    hover: { width: "110%" }
  }
  
  const logoContent = (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2">
        <span className={cn(
          textColor,
          "font-bold tracking-tight",
          sizeClasses[size]
        )}>
          TripNav
        </span>
        <motion.div 
          className={iconColor}
          variants={animated ? airplaneVariants : undefined}
          initial="initial"
          whileHover="hover"
          transition={{ duration: 0.2 }}
        >
          <Plane className={cn(iconSizes[size], "fill-current")} />
        </motion.div>
      </div>
      <motion.div 
        className={cn(underlineColor, "h-0.5 rounded-full")}
        variants={animated ? underlineVariants : undefined}
        initial={animated ? "initial" : { width: "100%" }}
        animate={animated ? "animate" : undefined}
        whileHover={animated ? "hover" : undefined}
        transition={{ duration: 0.3 }}
      />
    </div>
  )
  
  if (animated) {
    return (
      <motion.div 
        className="flex items-center gap-2 group cursor-pointer"
        variants={containerVariants}
        initial="initial"
        whileHover="hover"
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {logoContent}
      </motion.div>
    )
  }
  
  return (
    <div className="flex items-center gap-2 group cursor-pointer">
      {logoContent}
    </div>
  )
}