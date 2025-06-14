"use client"

import { useEffect } from 'react'

interface FontLoaderProps {
  fonts: string[]
}

export function FontLoader({ fonts }: FontLoaderProps) {
  useEffect(() => {
    // Remove any existing font link
    const existingLink = document.getElementById('google-fonts-preview')
    if (existingLink) {
      existingLink.remove()
    }

    // Create new link element
    const link = document.createElement('link')
    link.id = 'google-fonts-preview'
    link.rel = 'stylesheet'
    
    // Build Google Fonts URL
    const fontFamilies = fonts
      .map(font => font.replace(' ', '+') + ':wght@400;500;600;700')
      .join('&family=')
    
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`
    
    // Add to document head
    document.head.appendChild(link)

    // Cleanup on unmount
    return () => {
      const linkToRemove = document.getElementById('google-fonts-preview')
      if (linkToRemove) {
        linkToRemove.remove()
      }
    }
  }, [fonts])

  return null
}