"use client"

import { cn } from "@/lib/utils"
import { useDeviceType } from "@/hooks/use-device-type"
import { motion, HTMLMotionProps } from "framer-motion"
import { smoothSpring } from "@/lib/animations"

interface ResponsiveContainerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  noPadding?: boolean
  animated?: boolean
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = "xl",
  noPadding = false,
  animated = true,
  ...props
}: ResponsiveContainerProps) {
  const deviceType = useDeviceType()
  
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full"
  }
  
  const paddingClasses = {
    mobile: noPadding ? "" : "px-4 py-4",
    tablet: noPadding ? "" : "px-6 py-6",
    desktop: noPadding ? "" : "px-8 py-8"
  }
  
  const containerClass = cn(
    "mx-auto w-full",
    maxWidthClasses[maxWidth],
    paddingClasses[deviceType],
    className
  )
  
  if (!animated) {
    return (
      <div className={containerClass} {...props}>
        {children}
      </div>
    )
  }
  
  return (
    <motion.div
      className={containerClass}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={smoothSpring}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Responsive spacing component
interface ResponsiveSpacingProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl"
}

export function ResponsiveSpacing({ size = "md" }: ResponsiveSpacingProps) {
  const deviceType = useDeviceType()
  
  const spacingClasses = {
    mobile: {
      xs: "h-2",
      sm: "h-3",
      md: "h-4",
      lg: "h-6",
      xl: "h-8"
    },
    tablet: {
      xs: "h-3",
      sm: "h-4",
      md: "h-6",
      lg: "h-8",
      xl: "h-10"
    },
    desktop: {
      xs: "h-4",
      sm: "h-6",
      md: "h-8",
      lg: "h-10",
      xl: "h-12"
    }
  }
  
  return <div className={spacingClasses[deviceType][size]} />
}