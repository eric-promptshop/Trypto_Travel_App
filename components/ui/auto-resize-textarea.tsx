import React, { useEffect, useRef, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number
  minRows?: number
}

export const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ className, maxRows = 6, minRows = 1, onChange, value, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    
    // Combine refs
    useEffect(() => {
      if (ref && textareaRef.current) {
        if (typeof ref === 'function') {
          ref(textareaRef.current)
        } else {
          ref.current = textareaRef.current
        }
      }
    }, [ref])

    const adjustHeight = () => {
      const textarea = textareaRef.current
      if (!textarea) return

      // Reset height to get accurate scrollHeight
      textarea.style.height = 'auto'
      
      // Calculate new height
      const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight)
      const minHeight = lineHeight * minRows
      const maxHeight = lineHeight * maxRows
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)
      
      // Apply with animation
      textarea.style.height = `${newHeight}px`
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
    }

    useEffect(() => {
      adjustHeight()
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight()
      onChange?.(e)
    }

    return (
      <textarea
        ref={textareaRef}
        className={cn(
          "w-full resize-none",
          "px-3 py-3",
          "text-base leading-normal",
          "bg-white dark:bg-gray-900",
          "border border-gray-300 dark:border-gray-700",
          "rounded-xl",
          "placeholder:text-gray-400 dark:placeholder:text-gray-500",
          "focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent",
          "focus:shadow-sm",
          "transition-all duration-100",
          className
        )}
        onChange={handleChange}
        value={value}
        rows={minRows}
        style={{
          transition: 'height 100ms ease'
        }}
        {...props}
      />
    )
  }
)

AutoResizeTextarea.displayName = 'AutoResizeTextarea'