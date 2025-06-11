'use client'

import { AuditIssue } from './types'

interface ElementMetrics {
  selector: string
  width: number
  height: number
  fontSize?: number
  lineHeight?: number
  color?: string
  backgroundColor?: string
  position?: {
    top: number
    left: number
    right: number
    bottom: number
  }
  overflow?: {
    x: boolean
    y: boolean
  }
}

export class DOMAnalyzer {
  private issues: AuditIssue[] = []
  private currentPage: string

  constructor(page: string = '/') {
    this.currentPage = page
  }

  // Analyze all interactive elements for touch target sizes
  analyzeTouchTargets(): AuditIssue[] {
    const touchIssues: AuditIssue[] = []
    const minTouchSize = 44 // Apple's recommended minimum

    // Query all interactive elements
    const interactiveSelectors = [
      'button',
      'a',
      'input[type="button"]',
      'input[type="submit"]',
      'input[type="checkbox"]',
      'input[type="radio"]',
      '[role="button"]',
      '[onclick]',
      '.clickable',
      '[tabindex]:not([tabindex="-1"])'
    ]

    interactiveSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      
      elements.forEach((element, index) => {
        const rect = element.getBoundingClientRect()
        const computedStyle = window.getComputedStyle(element)
        
        // Check if element is visible
        if (rect.width === 0 || rect.height === 0 || computedStyle.display === 'none') {
          return
        }

        // Check touch target size
        if (rect.width < minTouchSize || rect.height < minTouchSize) {
          const elementPath = this.getElementPath(element)
          
          touchIssues.push({
            id: `touch-${selector.replace(/[^\w]/g, '')}-${index}`,
            component: elementPath,
            page: this.currentPage,
            category: 'touch-target',
            severity: rect.width < 32 || rect.height < 32 ? 'high' : 'medium',
            description: `Touch target too small: ${Math.round(rect.width)}x${Math.round(rect.height)}px`,
            recommendation: `Increase size to at least 44x44px. Consider using padding or pseudo-elements to increase touch area without affecting visual design.`,
            element: selector,
            metrics: {
              current: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
              recommended: '44x44px'
            }
          })
        }

        // Check spacing between interactive elements
        this.checkElementSpacing(element, selector, index, touchIssues)
      })
    })

    return touchIssues
  }

  // Analyze text readability
  analyzeReadability(): AuditIssue[] {
    const readabilityIssues: AuditIssue[] = []
    const minFontSize = 16 // Recommended minimum for mobile
    const minLineHeight = 1.5 // Recommended minimum line height ratio

    // Query all text elements
    const textSelectors = ['p', 'span', 'div', 'li', 'td', 'th', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    
    textSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      
      elements.forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element)
        const fontSize = parseFloat(computedStyle.fontSize)
        const lineHeight = parseFloat(computedStyle.lineHeight)
        const lineHeightRatio = lineHeight / fontSize

        // Check if element contains text
        if (!element.textContent?.trim()) return

        // Check font size
        if (fontSize < minFontSize && !selector.match(/^h[1-6]$/)) {
          const elementPath = this.getElementPath(element)
          
          readabilityIssues.push({
            id: `readability-size-${selector}-${index}`,
            component: elementPath,
            page: this.currentPage,
            category: 'readability',
            severity: fontSize < 14 ? 'high' : 'medium',
            description: `Font size too small for mobile: ${fontSize}px`,
            recommendation: `Increase font size to at least 16px for body text. Current size may be difficult to read on mobile devices.`,
            element: selector,
            metrics: {
              current: `${fontSize}px`,
              recommended: '16px'
            }
          })
        }

        // Check line height
        if (lineHeightRatio < minLineHeight && fontSize >= 14) {
          readabilityIssues.push({
            id: `readability-height-${selector}-${index}`,
            component: this.getElementPath(element),
            page: this.currentPage,
            category: 'readability',
            severity: 'low',
            description: `Line height too tight: ${lineHeightRatio.toFixed(2)}`,
            recommendation: `Increase line height to at least 1.5x font size for better readability on mobile.`,
            element: selector,
            metrics: {
              current: lineHeightRatio.toFixed(2),
              recommended: '1.5'
            }
          })
        }

        // Check color contrast
        this.checkColorContrast(element, selector, index, readabilityIssues)
      })
    })

    return readabilityIssues
  }

  // Analyze layout and overflow issues
  analyzeLayout(): AuditIssue[] {
    const layoutIssues: AuditIssue[] = []
    const viewportWidth = window.innerWidth

    // Check for horizontal overflow
    const allElements = document.querySelectorAll('*')
    
    allElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect()
      const computedStyle = window.getComputedStyle(element)

      // Check if element extends beyond viewport
      if (rect.right > viewportWidth && computedStyle.display !== 'none') {
        layoutIssues.push({
          id: `overflow-horizontal-${index}`,
          component: this.getElementPath(element),
          page: this.currentPage,
          category: 'overflow',
          severity: 'high',
          description: `Element extends beyond viewport by ${Math.round(rect.right - viewportWidth)}px`,
          recommendation: `Adjust width, padding, or margins to fit within viewport. Consider using responsive units like % or vw.`,
          element: element.tagName.toLowerCase(),
          metrics: {
            current: `${Math.round(rect.width)}px wide`,
            recommended: `max ${viewportWidth}px`
          }
        })
      }

      // Check for fixed positioning issues
      if (computedStyle.position === 'fixed') {
        this.checkFixedPositioning(element, index, layoutIssues)
      }
    })

    // Check for viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]')
    if (!viewportMeta) {
      layoutIssues.push({
        id: 'viewport-meta-missing',
        component: 'head',
        page: this.currentPage,
        category: 'overflow',
        severity: 'high',
        description: 'Missing viewport meta tag',
        recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to ensure proper mobile rendering.'
      })
    }

    return layoutIssues
  }

  // Check spacing between interactive elements
  private checkElementSpacing(element: Element, selector: string, index: number, issues: AuditIssue[]) {
    const rect = element.getBoundingClientRect()
    const minSpacing = 8 // Minimum spacing between touch targets

    // Find nearby interactive elements
    const nearbyElements = document.elementsFromPoint(
      rect.left + rect.width + minSpacing / 2,
      rect.top + rect.height / 2
    )

    nearbyElements.forEach(nearby => {
      if (nearby !== element && this.isInteractive(nearby)) {
        const nearbyRect = nearby.getBoundingClientRect()
        const horizontalGap = Math.abs(rect.right - nearbyRect.left)
        const verticalGap = Math.abs(rect.bottom - nearbyRect.top)

        if (horizontalGap < minSpacing || verticalGap < minSpacing) {
          issues.push({
            id: `spacing-${selector.replace(/[^\w]/g, '')}-${index}`,
            component: this.getElementPath(element),
            page: this.currentPage,
            category: 'spacing',
            severity: 'medium',
            description: `Insufficient spacing between interactive elements: ${Math.min(horizontalGap, verticalGap)}px`,
            recommendation: `Increase spacing to at least 8px between interactive elements for easier touch interaction.`,
            element: selector,
            metrics: {
              current: `${Math.min(horizontalGap, verticalGap)}px`,
              recommended: '8px'
            }
          })
        }
      }
    })
  }

  // Check color contrast for readability
  private checkColorContrast(element: Element, selector: string, index: number, issues: AuditIssue[]) {
    const computedStyle = window.getComputedStyle(element)
    const color = computedStyle.color
    const backgroundColor = this.getEffectiveBackgroundColor(element)

    if (color && backgroundColor) {
      const contrast = this.calculateContrast(color, backgroundColor)
      const minContrast = parseFloat(computedStyle.fontSize) < 18 ? 4.5 : 3

      if (contrast < minContrast) {
        issues.push({
          id: `contrast-${selector}-${index}`,
          component: this.getElementPath(element),
          page: this.currentPage,
          category: 'readability',
          severity: contrast < 3 ? 'high' : 'medium',
          description: `Low color contrast: ${contrast.toFixed(2)}:1`,
          recommendation: `Increase contrast to at least ${minContrast}:1 for better readability. Current colors may be difficult to read on mobile screens.`,
          element: selector,
          metrics: {
            current: `${contrast.toFixed(2)}:1`,
            recommended: `${minContrast}:1`
          }
        })
      }
    }
  }

  // Check fixed positioning issues on mobile
  private checkFixedPositioning(element: Element, index: number, issues: AuditIssue[]) {
    const rect = element.getBoundingClientRect()
    const viewportHeight = window.innerHeight

    // Check if fixed element takes too much vertical space
    if (rect.height > viewportHeight * 0.2) {
      issues.push({
        id: `fixed-height-${index}`,
        component: this.getElementPath(element),
        page: this.currentPage,
        category: 'overflow',
        severity: 'medium',
        description: `Fixed element uses ${Math.round((rect.height / viewportHeight) * 100)}% of viewport height`,
        recommendation: `Consider reducing height or using different positioning on mobile to preserve screen real estate.`,
        element: element.tagName.toLowerCase()
      })
    }
  }

  // Helper: Get element path for identification
  private getElementPath(element: Element): string {
    const path: string[] = []
    let current: Element | null = element

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase()
      
      if (current.id) {
        selector += `#${current.id}`
      } else if (current.className) {
        const classes = current.className.split(' ').filter(c => c).join('.')
        if (classes) selector += `.${classes}`
      }

      path.unshift(selector)
      current = current.parentElement
    }

    return path.join(' > ')
  }

  // Helper: Check if element is interactive
  private isInteractive(element: Element): boolean {
    const tagName = element.tagName.toLowerCase()
    const role = element.getAttribute('role')
    const tabIndex = element.getAttribute('tabindex')

    return (
      ['button', 'a', 'input', 'select', 'textarea'].includes(tagName) ||
      role === 'button' ||
      element.hasAttribute('onclick') ||
      (tabIndex !== null && tabIndex !== '-1')
    )
  }

  // Helper: Get effective background color
  private getEffectiveBackgroundColor(element: Element): string | null {
    let current: Element | null = element

    while (current) {
      const style = window.getComputedStyle(current)
      const bgColor = style.backgroundColor

      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        return bgColor
      }

      current = current.parentElement
    }

    return 'rgb(255, 255, 255)' // Default to white
  }

  // Helper: Calculate color contrast ratio
  private calculateContrast(color1: string, color2: string): number {
    const rgb1 = this.parseColor(color1)
    const rgb2 = this.parseColor(color2)

    if (!rgb1 || !rgb2) return 1

    const l1 = this.relativeLuminance(rgb1)
    const l2 = this.relativeLuminance(rgb2)

    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  }

  // Helper: Parse color string to RGB
  private parseColor(color: string): { r: number; g: number; b: number } | null {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    
    if (match && match[1] && match[2] && match[3]) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      }
    }

    return null
  }

  // Helper: Calculate relative luminance
  private relativeLuminance(rgb: { r: number; g: number; b: number }): number {
    const rsRGB = rgb.r / 255
    const gsRGB = rgb.g / 255
    const bsRGB = rgb.b / 255

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  // Run all analyses
  runFullAnalysis(): AuditIssue[] {
    this.issues = [
      ...this.analyzeTouchTargets(),
      ...this.analyzeReadability(),
      ...this.analyzeLayout()
    ]

    return this.issues
  }
} 