/**
 * Color Contrast Analyzer for WCAG 2.1 Compliance
 * Provides utilities to analyze and validate color contrast ratios
 */

// WCAG 2.1 Level AA Requirements
export const WCAG_AA_REQUIREMENTS = {
  NORMAL_TEXT: 4.5, // 4.5:1 for normal text
  LARGE_TEXT: 3.0,  // 3:1 for large text (18pt+ or 14pt+ bold)
  UI_COMPONENT: 3.0 // 3:1 for UI components and graphical objects
} as const

// Color conversion utilities
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result || !result[1] || !result[2] || !result[3]) return null
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  }
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2

  let r = 0, g = 0, b = 0

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x
  }

  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)

  return { r, g, b }
}

// Parse CSS custom property values (HSL format: "h s% l%")
export function parseHslCustomProperty(value: string): { r: number; g: number; b: number } | null {
  const match = value.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/)
  if (!match || !match[1] || !match[2] || !match[3]) return null
  
  const h = parseFloat(match[1])
  const s = parseFloat(match[2])
  const l = parseFloat(match[3])
  
  return hslToRgb(h, s, l)
}

// Calculate relative luminance
export function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb

  // Convert to sRGB
  const rsRGB = r / 255
  const gsRGB = g / 255
  const bsRGB = b / 255

  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

// Calculate contrast ratio between two colors
export function getContrastRatio(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
  const lum1 = getRelativeLuminance(color1)
  const lum2 = getRelativeLuminance(color2)
  
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

// WCAG compliance checker
export interface ContrastResult {
  ratio: number
  wcagAA: {
    normalText: boolean
    largeText: boolean
    uiComponent: boolean
  }
  wcagAAA: {
    normalText: boolean
    largeText: boolean
  }
  score: 'fail' | 'aa' | 'aaa'
}

export function checkContrastCompliance(foreground: { r: number; g: number; b: number }, background: { r: number; g: number; b: number }): ContrastResult {
  const ratio = getContrastRatio(foreground, background)
  
  const wcagAA = {
    normalText: ratio >= WCAG_AA_REQUIREMENTS.NORMAL_TEXT,
    largeText: ratio >= WCAG_AA_REQUIREMENTS.LARGE_TEXT,
    uiComponent: ratio >= WCAG_AA_REQUIREMENTS.UI_COMPONENT
  }
  
  const wcagAAA = {
    normalText: ratio >= 7.0,
    largeText: ratio >= 4.5
  }
  
  let score: 'fail' | 'aa' | 'aaa' = 'fail'
  if (wcagAAA.normalText) {
    score = 'aaa'
  } else if (wcagAA.normalText) {
    score = 'aa'
  }
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    wcagAA,
    wcagAAA,
    score
  }
}

// CSS Custom Properties from our theme
export const THEME_COLORS = {
  // Light theme colors
  light: {
    background: "0 0% 100%",         // white
    foreground: "0 0% 3.9%",         // very dark gray
    primary: "207 60% 32%",          // blue
    primaryForeground: "0 0% 98%",   // off-white
    secondary: "0 0% 96.1%",         // light gray
    secondaryForeground: "0 0% 9%",  // dark gray
    muted: "0 0% 96.1%",             // light gray
    mutedForeground: "0 0% 42%",     // Updated: medium gray (darkened for contrast)
    accent: "28 100% 50%",           // orange
    accentForeground: "0 0% 98%",    // off-white
    destructive: "0 84% 48%",        // Updated: red (fine-tuned for 4.5:1 contrast)
    destructiveForeground: "0 0% 98%", // off-white
    border: "0 0% 89.8%",            // light gray
    input: "0 0% 89.8%",             // light gray
    ring: "0 0% 3.9%"                // very dark gray
  },
  // Dark theme colors
  dark: {
    background: "0 0% 3.9%",         // very dark gray
    foreground: "0 0% 98%",          // off-white
    primary: "207 60% 32%",          // blue (same as light)
    primaryForeground: "0 0% 98%",   // off-white
    secondary: "0 0% 14.9%",         // dark gray
    secondaryForeground: "0 0% 98%", // off-white
    muted: "0 0% 14.9%",             // dark gray
    mutedForeground: "0 0% 63.9%",   // light gray
    accent: "28 100% 50%",           // orange (same as light)
    accentForeground: "0 0% 98%",    // off-white
    destructive: "0 62.8% 30.6%",    // darker red
    destructiveForeground: "0 0% 98%", // off-white
    border: "0 0% 14.9%",            // dark gray
    input: "0 0% 14.9%",             // dark gray
    ring: "0 0% 83.1%"               // light gray
  }
} as const

// Component-specific color analysis
export interface ComponentColorAnalysis {
  componentName: string
  elements: Array<{
    elementName: string
    foreground: string
    background: string
    result: ContrastResult
    textType: 'normal' | 'large' | 'ui-component'
    passes: boolean
  }>
  overallScore: 'fail' | 'partial' | 'pass'
  issuesFound: number
}

export function analyzeComponentColors(componentName: string, colorCombinations: Array<{
  elementName: string
  foreground: string // HSL string like "0 0% 45.1%"
  background: string // HSL string like "0 0% 100%"
  textType: 'normal' | 'large' | 'ui-component'
}>): ComponentColorAnalysis {
  const elements = colorCombinations.map(({ elementName, foreground, background, textType }) => {
    const fgRgb = parseHslCustomProperty(foreground)
    const bgRgb = parseHslCustomProperty(background)
    
    if (!fgRgb || !bgRgb) {
      throw new Error(`Invalid color format for ${elementName}`)
    }
    
    const result = checkContrastCompliance(fgRgb, bgRgb)
    
    let passes: boolean
    switch (textType) {
      case 'normal':
        passes = result.wcagAA.normalText
        break
      case 'large':
        passes = result.wcagAA.largeText
        break
      case 'ui-component':
        passes = result.wcagAA.uiComponent
        break
      default:
        passes = false
    }
    
    return {
      elementName,
      foreground,
      background,
      result,
      textType,
      passes
    }
  })
  
  const issuesFound = elements.filter(el => !el.passes).length
  const overallScore: 'fail' | 'partial' | 'pass' = issuesFound === 0 ? 'pass' : issuesFound === elements.length ? 'fail' : 'partial'
  
  return {
    componentName,
    elements,
    overallScore,
    issuesFound
  }
}

// Predefined component analyses
export function analyzeProgressIndicator(): ComponentColorAnalysis {
  return analyzeComponentColors('Progress Indicator', [
    {
      elementName: 'Active step indicator',
      foreground: THEME_COLORS.light.primaryForeground,
      background: THEME_COLORS.light.primary,
      textType: 'ui-component'
    },
    {
      elementName: 'Completed step text',
      foreground: THEME_COLORS.light.foreground,
      background: THEME_COLORS.light.background,
      textType: 'normal'
    },
    {
      elementName: 'Inactive step text',
      foreground: THEME_COLORS.light.mutedForeground,
      background: THEME_COLORS.light.background,
      textType: 'normal'
    },
    {
      elementName: 'Progress bar fill',
      foreground: THEME_COLORS.light.primary,
      background: THEME_COLORS.light.background,
      textType: 'ui-component'
    },
    {
      elementName: 'Focus indicator',
      foreground: THEME_COLORS.light.ring,
      background: THEME_COLORS.light.background,
      textType: 'ui-component'
    }
  ])
}

export function analyzeVoiceInput(): ComponentColorAnalysis {
  return analyzeComponentColors('Voice Input Components', [
    {
      elementName: 'Primary button text',
      foreground: THEME_COLORS.light.primaryForeground,
      background: THEME_COLORS.light.primary,
      textType: 'normal'
    },
    {
      elementName: 'Transcript text',
      foreground: THEME_COLORS.light.foreground,
      background: THEME_COLORS.light.background,
      textType: 'normal'
    },
    {
      elementName: 'Error message text',
      foreground: THEME_COLORS.light.destructiveForeground,
      background: THEME_COLORS.light.destructive,
      textType: 'normal'
    },
    {
      elementName: 'Recording indicator',
      foreground: THEME_COLORS.light.destructive,
      background: THEME_COLORS.light.background,
      textType: 'ui-component'
    },
    {
      elementName: 'Helper text',
      foreground: THEME_COLORS.light.mutedForeground,
      background: THEME_COLORS.light.background,
      textType: 'normal'
    }
  ])
}

export function analyzeInterestTags(): ComponentColorAnalysis {
  return analyzeComponentColors('Interest Tags', [
    {
      elementName: 'Selected tag text',
      foreground: THEME_COLORS.light.primaryForeground,
      background: THEME_COLORS.light.primary,
      textType: 'normal'
    },
    {
      elementName: 'Unselected tag text',
      foreground: THEME_COLORS.light.mutedForeground,
      background: THEME_COLORS.light.background,
      textType: 'normal'
    },
    {
      elementName: 'Disabled tag text',
      foreground: THEME_COLORS.light.mutedForeground,
      background: THEME_COLORS.light.muted,
      textType: 'normal'
    },
    {
      elementName: 'Category header',
      foreground: THEME_COLORS.light.foreground,
      background: THEME_COLORS.light.background,
      textType: 'large'
    },
    {
      elementName: 'Focus indicator',
      foreground: THEME_COLORS.light.ring,
      background: THEME_COLORS.light.background,
      textType: 'ui-component'
    }
  ])
}

export function analyzeFormComponents(): ComponentColorAnalysis {
  return analyzeComponentColors('Form Components', [
    {
      elementName: 'Input text',
      foreground: THEME_COLORS.light.foreground,
      background: THEME_COLORS.light.background,
      textType: 'normal'
    },
    {
      elementName: 'Label text',
      foreground: THEME_COLORS.light.foreground,
      background: THEME_COLORS.light.background,
      textType: 'normal'
    },
    {
      elementName: 'Error state text',
      foreground: THEME_COLORS.light.destructive,
      background: THEME_COLORS.light.background,
      textType: 'normal'
    },
    {
      elementName: 'Placeholder text',
      foreground: THEME_COLORS.light.mutedForeground,
      background: THEME_COLORS.light.background,
      textType: 'normal'
    },
    {
      elementName: 'Button text',
      foreground: THEME_COLORS.light.primaryForeground,
      background: THEME_COLORS.light.primary,
      textType: 'normal'
    }
  ])
}

// Generate full accessibility report
export interface AccessibilityReport {
  timestamp: string
  components: ComponentColorAnalysis[]
  summary: {
    totalComponents: number
    passedComponents: number
    partialComponents: number
    failedComponents: number
    totalIssues: number
    overallCompliance: number
  }
  recommendations: string[]
}

export function generateAccessibilityReport(): AccessibilityReport {
  const components = [
    analyzeProgressIndicator(),
    analyzeVoiceInput(),
    analyzeInterestTags(),
    analyzeFormComponents()
  ]
  
  const passedComponents = components.filter(c => c.overallScore === 'pass').length
  const partialComponents = components.filter(c => c.overallScore === 'partial').length
  const failedComponents = components.filter(c => c.overallScore === 'fail').length
  const totalIssues = components.reduce((sum, c) => sum + c.issuesFound, 0)
  const totalElements = components.reduce((sum, c) => sum + c.elements.length, 0)
  const passedElements = totalElements - totalIssues
  const overallCompliance = Math.round((passedElements / totalElements) * 100)
  
  const recommendations: string[] = []
  
  components.forEach(component => {
    if (component.issuesFound > 0) {
      component.elements.forEach(element => {
        if (!element.passes) {
          const required = element.textType === 'normal' ? '4.5:1' : '3:1'
          recommendations.push(
            `${component.componentName} - ${element.elementName}: Current ratio ${element.result.ratio}:1, needs ${required} (${element.textType} text)`
          )
        }
      })
    }
  })
  
  return {
    timestamp: new Date().toISOString(),
    components,
    summary: {
      totalComponents: components.length,
      passedComponents,
      partialComponents,
      failedComponents,
      totalIssues,
      overallCompliance
    },
    recommendations
  }
} 