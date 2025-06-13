"use client"

import { useEffect, useState } from "react"

export function useMobileKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    // Only run on mobile devices
    if (typeof window === 'undefined' || !('visualViewport' in window)) return

    let rafId: number
    
    const handleViewportChange = () => {
      if (!window.visualViewport) return
      
      // Cancel any pending updates
      if (rafId) cancelAnimationFrame(rafId)
      
      rafId = requestAnimationFrame(() => {
        const { height: viewportHeight } = window.visualViewport!
        const windowHeight = window.innerHeight
        const keyboardHeight = windowHeight - viewportHeight
        
        setKeyboardHeight(Math.max(0, keyboardHeight))
        setIsKeyboardVisible(keyboardHeight > 50) // Threshold to detect keyboard
      })
    }

    // Initial check
    handleViewportChange()

    // Listen for viewport changes
    window.visualViewport?.addEventListener('resize', handleViewportChange)
    window.visualViewport?.addEventListener('scroll', handleViewportChange)

    // Fallback for older browsers
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setTimeout(() => {
          setIsKeyboardVisible(true)
          // Estimate keyboard height for fallback
          setKeyboardHeight(window.innerHeight * 0.4)
        }, 300)
      }
    }

    const handleBlur = () => {
      setTimeout(() => {
        setIsKeyboardVisible(false)
        setKeyboardHeight(0)
      }, 300)
    }

    document.addEventListener('focusin', handleFocus)
    document.addEventListener('focusout', handleBlur)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.visualViewport?.removeEventListener('resize', handleViewportChange)
      window.visualViewport?.removeEventListener('scroll', handleViewportChange)
      document.removeEventListener('focusin', handleFocus)
      document.removeEventListener('focusout', handleBlur)
    }
  }, [])

  return { keyboardHeight, isKeyboardVisible }
}

// Hook to handle input positioning above keyboard
export function useInputAboveKeyboard(inputRef: React.RefObject<HTMLElement>) {
  const { keyboardHeight, isKeyboardVisible } = useMobileKeyboard()
  
  useEffect(() => {
    if (!inputRef.current) return
    
    const container = inputRef.current.closest('.chat-container') as HTMLElement
    if (!container) return
    
    // Apply transform to push input above keyboard
    if (isKeyboardVisible && keyboardHeight > 0) {
      container.style.transform = `translateY(-${keyboardHeight}px)`
      container.style.transition = 'transform 0.3s ease-out'
    } else {
      container.style.transform = 'translateY(0)'
    }
    
    return () => {
      container.style.transform = ''
      container.style.transition = ''
    }
  }, [keyboardHeight, isKeyboardVisible, inputRef])
  
  return { keyboardHeight, isKeyboardVisible }
}