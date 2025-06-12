import { Variants, Transition } from "framer-motion"

// Spring configurations for smooth, professional animations
export const springConfig = {
  type: "spring",
  stiffness: 400,
  damping: 30,
} as const

export const smoothSpring = {
  type: "spring",
  stiffness: 300,
  damping: 25,
} as const

export const gentleSpring = {
  type: "spring",
  stiffness: 200,
  damping: 20,
} as const

// Easing functions
export const easeInOutCubic = [0.65, 0, 0.35, 1] as const
export const easeOutExpo = [0.19, 1, 0.22, 1] as const

// Page transitions
export const pageTransition: Transition = {
  type: "tween",
  ease: easeInOutCubic,
  duration: 0.4,
}

// Fade animations
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" }
  }
}

// Slide animations
export const slideUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { ...smoothSpring }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2 }
  }
}

export const slideIn: Variants = {
  hidden: { 
    opacity: 0, 
    x: -20 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { ...smoothSpring }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { duration: 0.2 }
  }
}

// Scale animations
export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { ...springConfig }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.2 }
  }
}

// Stagger children animations
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    }
  }
}

export const staggerItem: Variants = {
  hidden: { 
    opacity: 0, 
    y: 10 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { ...smoothSpring }
  }
}

// Card hover animations
export const cardHover = {
  rest: { 
    scale: 1,
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
  },
  hover: { 
    scale: 1.02,
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    transition: { ...springConfig }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  }
}

// Mobile-specific animations (faster, simpler)
export const mobileSlideUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 10 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" }
  }
}

// Tablet-specific animations (balanced)
export const tabletFadeScale: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.98 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.25, ease: easeOutExpo }
  }
}

// Layout animations
export const layoutTransition = {
  layout: true,
  layoutId: "shared-element",
  transition: { ...smoothSpring }
}

// Utility function to get device-appropriate animations
export function getDeviceAnimation(
  deviceType: "mobile" | "tablet" | "desktop",
  animationType: "slide" | "fade" | "scale" = "slide"
) {
  if (deviceType === "mobile") {
    return mobileSlideUp
  }
  
  if (deviceType === "tablet") {
    return tabletFadeScale
  }
  
  // Desktop animations
  switch (animationType) {
    case "fade":
      return fadeIn
    case "scale":
      return scaleIn
    default:
      return slideUp
  }
}