import React from 'react'
import { cn } from '@/lib/utils'

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'active'
  icon?: React.ReactNode
}

export function Chip({ 
  children, 
  className, 
  variant = 'default',
  icon,
  ...props 
}: ChipProps) {
  const text = typeof children === 'string' ? children : ''
  const displayText = text.length > 24 ? `${text.substring(0, 24)}...` : text

  return (
    <button
      role="button"
      className={cn(
        "inline-flex items-center gap-1.5",
        "px-3 py-1.5",
        "text-sm font-medium",
        "rounded-full",
        "transition-all duration-100",
        "focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-1",
        "active:scale-95",
        variant === 'default' && [
          "bg-[#f2f4f7] text-[#0f172a]",
          "hover:bg-brand-blue-50",
          "dark:bg-[#334155] dark:text-[#e2e8f0]",
          "dark:hover:bg-brand-blue-900/20"
        ],
        variant === 'active' && [
          "bg-brand-blue-500 text-white",
          "hover:bg-brand-blue-600"
        ],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="truncate">{displayText}</span>
    </button>
  )
}