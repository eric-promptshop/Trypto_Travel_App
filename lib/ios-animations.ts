import { Variants, Transition, TargetAndTransition } from "framer-motion"

// iOS-style spring physics
export const iosSpring = {
  type: "spring",
  damping: 20,
  stiffness: 300,
  mass: 0.8,
} as const

// Smoother iOS spring for subtle animations
export const iosSmoothSpring = {
  type: "spring",
  damping: 30,
  stiffness: 400,
  mass: 1,
} as const

// Quick iOS spring for responsive feedback
export const iosQuickSpring = {
  type: "spring",
  damping: 25,
  stiffness: 500,
  mass: 0.5,
} as const

// iOS-style easing curves
export const iosEase = [0.25, 0.1, 0.25, 1] as const
export const iosEaseOut = [0, 0, 0.2, 1] as const
export const iosEaseIn = [0.42, 0, 1, 1] as const
export const iosEaseInOut = [0.42, 0, 0.58, 1] as const

// iOS-style fade and scale animation
export const iosFadeScale: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.95,
    filter: "blur(10px)"
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    filter: "blur(0px)",
    transition: iosSpring
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    filter: "blur(10px)",
    transition: { duration: 0.2, ease: iosEaseIn }
  }
}

// iOS modal slide animation
export const iosSlideUp: Variants = {
  initial: { 
    y: "100%",
    borderRadius: "0px"
  },
  animate: { 
    y: 0,
    borderRadius: "12px",
    transition: iosSpring
  },
  exit: { 
    y: "100%",
    borderRadius: "0px",
    transition: { ...iosSpring, damping: 30 }
  }
}

// iOS-style tap animation
export const iosTap = {
  scale: 0.97,
  transition: { duration: 0.1, ease: iosEaseOut }
}

// iOS-style message bubble animation
export const iosMessageBubble: Variants = {
  initial: { 
    opacity: 0,
    scale: 0.8,
    y: 20,
    filter: "blur(4px)"
  },
  animate: { 
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      ...iosSmoothSpring,
      opacity: { duration: 0.2 }
    }
  }
}

// iOS-style stagger for lists
export const iosStagger = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    }
  }
}

// iOS-style button press
export const iosButtonPress: TargetAndTransition = {
  scale: 0.95,
  transition: { duration: 0.1, ease: iosEaseOut }
}

// iOS-style page transition
export const iosPageTransition: Variants = {
  initial: { 
    x: "100%",
    boxShadow: "-5px 0 15px rgba(0,0,0,0.1)"
  },
  animate: { 
    x: 0,
    boxShadow: "0px 0 0px rgba(0,0,0,0)",
    transition: iosSpring
  },
  exit: { 
    x: "-30%",
    opacity: 0.8,
    transition: iosSpring
  }
}

// iOS-style rubber band scroll
export const iosRubberBand = {
  type: "spring",
  damping: 40,
  stiffness: 400,
  mass: 1.2,
} as const

// iOS keyboard animation
export const iosKeyboardSlide: Variants = {
  hidden: { 
    y: "100%",
    transition: {
      ...iosQuickSpring,
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  },
  visible: { 
    y: 0,
    transition: {
      ...iosQuickSpring,
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

// Blur backdrop animation
export const iosBlurBackdrop: Variants = {
  initial: { 
    opacity: 0,
    backdropFilter: "blur(0px)"
  },
  animate: { 
    opacity: 1,
    backdropFilter: "blur(20px)",
    transition: { duration: 0.3, ease: iosEaseOut }
  },
  exit: { 
    opacity: 0,
    backdropFilter: "blur(0px)",
    transition: { duration: 0.2, ease: iosEaseIn }
  }
}

// iOS-style loading dots
export const iosLoadingDot: Variants = {
  initial: { 
    y: 0,
    opacity: 0.4
  },
  animate: { 
    y: [-2, 2, -2],
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 1.4,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop"
    }
  }
}

// Utility for iOS-style hover (only on desktop)
export const iosHover = (deviceType: "mobile" | "tablet" | "desktop") => {
  if (deviceType === "desktop") {
    return {
      scale: 1.02,
      transition: iosSmoothSpring
    }
  }
  return {}
}