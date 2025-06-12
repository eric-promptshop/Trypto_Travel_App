"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TripNavLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  variant?: 'default' | 'white' | 'dark'
  showTakeoff?: boolean
}

const sizeClasses = {
  sm: 'w-24 h-8',
  md: 'w-32 h-10',
  lg: 'w-40 h-12',
  xl: 'w-48 h-16'
}

export function TripNavLogo({ 
  className, 
  size = 'md', 
  animated = false,
  variant = 'default',
  showTakeoff = false
}: TripNavLogoProps) {
  const containerClass = cn(
    'flex items-center justify-center',
    sizeClasses[size],
    className
  )

  const logoVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    hover: { scale: 1.05 }
  }

  const getColors = () => {
    switch (variant) {
      case 'white':
        return {
          text: '#ffffff',
          orange: '#FF7B00',
          pin: '#FF7B00'
        }
      case 'dark':
        return {
          text: '#1B365D',
          orange: '#FF7B00',
          pin: '#FF7B00'
        }
      default:
        return {
          text: '#1B365D',
          orange: '#FF7B00',
          pin: '#FF7B00'
        }
    }
  }

  const colors = getColors()

  // Animation properties for the location pin
  const pinAnimationProps = animated ? {
    animate: {
      y: [0, -2, 0],
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  } : {}

  // Animation properties for the airplane
  const airplaneAnimationProps = showTakeoff ? {
    initial: { x: -50, y: 20, rotate: -15, opacity: 0 },
    animate: {
      x: [0, 20, 40],
      y: [0, -15, -30],
      rotate: [0, -10, -25],
      opacity: [1, 1, 0]
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: [0.43, 0.13, 0.23, 0.96],
      times: [0, 0.6, 1],
      repeatDelay: 1
    }
  } : animated ? {
    animate: {
      x: [0, 3, 0],
      y: [0, -1, 0]
    },
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut" as const,
      delay: 0.5
    }
  } : {}

  // Animation properties for the connecting line
  const lineAnimationProps = animated ? {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: 1.5, delay: 0.5 }
  } : {}

  // Animation properties for the text
  const textAnimationProps = animated ? {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.8, delay: 1 }
  } : {}

  // Main SVG animation properties
  const svgAnimationProps = animated ? {
    variants: logoVariants,
    initial: "initial",
    animate: "animate",
    whileHover: "hover",
    transition: { duration: 0.3, ease: "easeOut" }
  } : {}

  return (
    <div className={containerClass}>
      <motion.svg
        viewBox="0 0 200 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        {...svgAnimationProps}
      >
        {/* Location Pin */}
        <motion.g {...pinAnimationProps}>
          <path 
            d="M25 15c-5.5 0-10 4.5-10 10 0 7.5 10 20 10 20s10-12.5 10-20c0-5.5-4.5-10-10-10z" 
            fill={colors.pin}
          />
          <circle cx="25" cy="25" r="4" fill="white"/>
        </motion.g>
        
        {/* Airplane */}
        <motion.g
          transform="translate(155, 18)"
          {...airplaneAnimationProps}
        >
          <path 
            d="M0 8l8-3v-2l-3-1v-1l5-1 8 3 5-2 2 1-3 2-5 2-8-3-5 1v1l3 1v2l-8 3z" 
            fill={colors.orange}
          />
          <path 
            d="M8 5l12 0 8-3 4 2-6 3-8 0-10-2z" 
            fill={colors.orange}
          />
        </motion.g>
        
        {/* Airplane trail effect for takeoff */}
        {showTakeoff && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeOut",
              repeatDelay: 1
            }}
          >
            <motion.path
              d="M155 26 Q145 28 135 32"
              stroke={colors.orange}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity="0.4"
              strokeDasharray="4 2"
            />
            <motion.path
              d="M140 30 Q130 32 120 36"
              stroke={colors.orange}
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              opacity="0.3"
              strokeDasharray="3 2"
            />
          </motion.g>
        )}
        
        {/* Orange connecting line */}
        {!showTakeoff && (
          <motion.path 
            d="M35 25 Q95 15 155 25" 
            stroke={colors.orange} 
            strokeWidth="3" 
            fill="none"
            {...lineAnimationProps}
          />
        )}
        
        {/* Runway for takeoff animation */}
        {showTakeoff && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.rect
              x="35"
              y="28"
              width="120"
              height="2"
              fill={colors.orange}
              opacity="0.3"
            />
            <motion.g
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {[40, 60, 80, 100, 120, 140].map((x, i) => (
                <rect
                  key={i}
                  x={x}
                  y="29"
                  width="8"
                  height="1"
                  fill={colors.orange}
                />
              ))}
            </motion.g>
          </motion.g>
        )}
        
        {/* Text "TripNav" */}
        <motion.g 
          fill={colors.text}
          {...textAnimationProps}
        >
          {/* T */}
          <path d="M8 45h24v4h-10v16h-4v-16h-10v-4z"/>
          {/* r */}
          <path d="M35 50h3v15h-3v-2c-1 1.5-2.5 2.5-4.5 2.5-1.5 0-2.5-0.5-3-1.5v-14h3v12c0 1 0.5 1.5 1.5 1.5s1.5-0.5 1.5-1.5v-12z"/>
          {/* i */}
          <path d="M45 46h3v3h-3v-3zm0 4h3v15h-3v-15z"/>
          {/* p */}
          <path d="M52 50h3v2c1-1.5 2.5-2.5 4.5-2.5 3 0 5 2 5 5v10h-3v-9c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5v9h-3v-15z"/>
          {/* N */}
          <path d="M75 45h4l8 12v-12h4v20h-4l-8-12v12h-4v-20z"/>
          {/* a */}
          <path d="M95 55c0-3 2-5.5 5-5.5s5 2.5 5 5.5v10h-3v-2c-1 1.5-2.5 2.5-4 2.5-2 0-3.5-1.5-3.5-3.5 0-2.5 2-3.5 4.5-3.5h3v-1c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5h-3zm7 5v-1h-2.5c-1 0-1.5 0.5-1.5 1.5s0.5 1.5 1.5 1.5 2.5-1 2.5-2z"/>
          {/* v */}
          <path d="M110 50h3l3 12 3-12h3l-4.5 15h-3l-4.5-15z"/>
        </motion.g>
      </motion.svg>
    </div>
  )
} 