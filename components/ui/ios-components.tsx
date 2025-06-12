"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { iosSpring, iosSmoothSpring, iosButtonPress, iosBlurBackdrop } from "@/lib/ios-animations"
import { forwardRef } from "react"

// iOS-style glass morphism card
export const IOSCard = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { blur?: boolean }
>(({ className, blur = true, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn(
      "relative overflow-hidden rounded-2xl",
      blur && "backdrop-blur-xl bg-white/80 dark:bg-gray-900/80",
      "border border-white/20",
      "shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
      className
    )}
    whileHover={{ scale: 1.01 }}
    transition={iosSmoothSpring}
    {...props}
  >
    {/* iOS-style inner shadow */}
    <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none" />
    {children}
  </motion.div>
))
IOSCard.displayName = "IOSCard"

// iOS-style button with haptic feedback
interface IOSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
}

export const IOSButton = forwardRef<HTMLButtonElement, IOSButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const variants = {
      primary: "bg-blue-500 text-white shadow-[0_4px_14px_rgba(59,130,246,0.4)]",
      secondary: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
      ghost: "bg-transparent hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
    }
    
    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg"
    }
    
    return (
      <motion.button
        ref={ref}
        className={cn(
          "relative rounded-xl font-medium",
          "transition-colors duration-200",
          "active:scale-95",
          variants[variant],
          sizes[size],
          className
        )}
        whileTap={iosButtonPress}
        transition={iosSpring}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        {variant === "primary" && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-white"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.2 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.button>
    )
  }
)
IOSButton.displayName = "IOSButton"

// iOS-style loading indicator
export function IOSLoadingDots() {
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-gray-400 rounded-full"
          animate={{
            y: [0, -6, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.4,
            ease: "easeInOut",
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  )
}

// iOS-style backdrop blur
interface IOSBackdropProps {
  isOpen: boolean
  onClose?: () => void
  children?: React.ReactNode
}

export function IOSBackdrop({ isOpen, onClose, children }: IOSBackdropProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="absolute inset-0 bg-black/20"
            variants={iosBlurBackdrop}
          />
          <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// iOS-style input with floating label
interface IOSInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const IOSInput = forwardRef<HTMLInputElement, IOSInputProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="relative">
        {label && (
          <label className="absolute -top-2 left-4 px-1 text-xs font-medium text-gray-600 bg-white dark:bg-gray-900">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full px-4 py-3 rounded-xl",
            "bg-gray-50 dark:bg-gray-800/50",
            "border-2 border-transparent",
            "focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800",
            "transition-all duration-200",
            "placeholder-gray-400",
            "text-base",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
IOSInput.displayName = "IOSInput"

// iOS-style message bubble
interface IOSMessageBubbleProps {
  message: string
  isUser?: boolean
  timestamp?: Date
}

export function IOSMessageBubble({ message, isUser = false, timestamp }: IOSMessageBubbleProps) {
  return (
    <motion.div
      className={cn(
        "max-w-[80%] px-4 py-3 rounded-2xl",
        isUser 
          ? "bg-blue-500 text-white ml-auto rounded-br-md" 
          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
      )}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={iosSmoothSpring}
    >
      <p className="text-[15px] leading-relaxed">{message}</p>
      {timestamp && (
        <p className={cn(
          "text-xs mt-1",
          isUser ? "text-blue-100" : "text-gray-500"
        )}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </motion.div>
  )
}