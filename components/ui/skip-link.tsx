"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  href,
  children,
  className
}) => {
  return (
    <Link
      href={href}
      className={cn(
        // Hidden by default, visible when focused
        "sr-only focus:not-sr-only",
        // Positioning and styling when visible
        "focus:absolute focus:top-4 focus:left-4 focus:z-50",
        "focus:bg-primary focus:text-primary-foreground",
        "focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "transition-all duration-200",
        className
      )}
      tabIndex={0}
    >
      {children}
    </Link>
  )
}

interface SkipLinksProps {
  links: Array<{
    href: string
    label: string
  }>
  className?: string
}

export const SkipLinks: React.FC<SkipLinksProps> = ({
  links,
  className
}) => {
  return (
    <nav 
      className={cn("sr-only focus-within:not-sr-only", className)}
      aria-label="Skip navigation links"
    >
      <ul className="flex gap-2 absolute top-4 left-4 z-50">
        {links.map((link, index) => (
          <li key={index}>
            <SkipLink href={link.href}>
              {link.label}
            </SkipLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default SkipLink 