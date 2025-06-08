import { ThemeConfiguration, ThemeValidationResult, ThemeValidationError } from '@/types/theme';

/**
 * Convert a theme configuration to CSS custom properties
 */
export function themeToCSS(theme: ThemeConfiguration): Record<string, string> {
  const cssVariables: Record<string, string> = {};

  // Colors
  Object.entries(theme.colors.primary).forEach(([key, value]) => {
    cssVariables[`--color-primary-${key}`] = value;
  });

  Object.entries(theme.colors.secondary).forEach(([key, value]) => {
    cssVariables[`--color-secondary-${key}`] = value;
  });

  Object.entries(theme.colors.accent).forEach(([key, value]) => {
    cssVariables[`--color-accent-${key}`] = value;
  });

  Object.entries(theme.colors.gray).forEach(([key, value]) => {
    cssVariables[`--color-gray-${key}`] = value;
  });

  // Semantic colors
  cssVariables['--color-success'] = theme.colors.success;
  cssVariables['--color-warning'] = theme.colors.warning;
  cssVariables['--color-error'] = theme.colors.error;
  cssVariables['--color-info'] = theme.colors.info;

  // Typography
  cssVariables['--font-sans'] = theme.typography.fontFamily.sans.join(', ');
  cssVariables['--font-serif'] = theme.typography.fontFamily.serif.join(', ');
  cssVariables['--font-mono'] = theme.typography.fontFamily.mono.join(', ');
  if (theme.typography.fontFamily.display) {
    cssVariables['--font-display'] = theme.typography.fontFamily.display.join(', ');
  }

  Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
    cssVariables[`--font-size-${key}`] = value;
  });

  Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
    cssVariables[`--font-weight-${key}`] = value;
  });

  Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
    cssVariables[`--line-height-${key}`] = value;
  });

  Object.entries(theme.typography.letterSpacing).forEach(([key, value]) => {
    cssVariables[`--letter-spacing-${key}`] = value;
  });

  // Spacing
  Object.entries(theme.spacing.borderRadius).forEach(([key, value]) => {
    cssVariables[`--border-radius-${key}`] = value;
  });

  Object.entries(theme.spacing.spacing).forEach(([key, value]) => {
    cssVariables[`--spacing-${key}`] = value;
  });

  Object.entries(theme.spacing.shadows).forEach(([key, value]) => {
    cssVariables[`--shadow-${key}`] = value;
  });

  // Breakpoints
  Object.entries(theme.breakpoints).forEach(([key, value]) => {
    cssVariables[`--breakpoint-${key}`] = value;
  });

  // Animations
  Object.entries(theme.animations.transition).forEach(([key, value]) => {
    cssVariables[`--transition-${key}`] = value;
  });

  Object.entries(theme.animations.duration).forEach(([key, value]) => {
    cssVariables[`--duration-${key}`] = value;
  });

  Object.entries(theme.animations.timing).forEach(([key, value]) => {
    cssVariables[`--timing-${key}`] = value;
  });

  // Custom properties
  if (theme.customProperties) {
    Object.entries(theme.customProperties).forEach(([key, value]) => {
      cssVariables[key] = value;
    });
  }

  return cssVariables;
}

/**
 * Generate CSS string from theme configuration
 */
export function generateThemeCSS(theme: ThemeConfiguration, selector: string = ':root'): string {
  const cssVariables = themeToCSS(theme);
  const cssRules = Object.entries(cssVariables)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n');

  return `${selector} {\n${cssRules}\n}`;
}

/**
 * Apply theme to the document by injecting CSS variables
 */
export function applyTheme(theme: ThemeConfiguration, isDarkMode: boolean = false): void {
  const cssVariables = themeToCSS(theme);
  const root = document.documentElement;

  // Remove existing theme variables
  Array.from(root.style).forEach(property => {
    if (property.startsWith('--color-') || 
        property.startsWith('--font-') || 
        property.startsWith('--spacing-') ||
        property.startsWith('--border-radius-') ||
        property.startsWith('--shadow-') ||
        property.startsWith('--breakpoint-') ||
        property.startsWith('--transition-') ||
        property.startsWith('--duration-') ||
        property.startsWith('--timing-') ||
        property.startsWith('--line-height-') ||
        property.startsWith('--letter-spacing-')) {
      root.style.removeProperty(property);
    }
  });

  // Apply new theme variables
  Object.entries(cssVariables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  // Set theme metadata
  root.setAttribute('data-theme', theme.id);
  root.setAttribute('data-theme-name', theme.name);
  
  // Update class for dark mode compatibility
  if (isDarkMode) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Generate a dynamic Tailwind configuration object from theme
 */
export function generateTailwindConfig(theme: ThemeConfiguration) {
  return {
    theme: {
      extend: {
        colors: {
          primary: {
            50: `var(--color-primary-50)`,
            100: `var(--color-primary-100)`,
            200: `var(--color-primary-200)`,
            300: `var(--color-primary-300)`,
            400: `var(--color-primary-400)`,
            500: `var(--color-primary-500)`,
            600: `var(--color-primary-600)`,
            700: `var(--color-primary-700)`,
            800: `var(--color-primary-800)`,
            900: `var(--color-primary-900)`,
            950: `var(--color-primary-950)`,
            DEFAULT: `var(--color-primary-500)`,
          },
          secondary: {
            50: `var(--color-secondary-50)`,
            100: `var(--color-secondary-100)`,
            200: `var(--color-secondary-200)`,
            300: `var(--color-secondary-300)`,
            400: `var(--color-secondary-400)`,
            500: `var(--color-secondary-500)`,
            600: `var(--color-secondary-600)`,
            700: `var(--color-secondary-700)`,
            800: `var(--color-secondary-800)`,
            900: `var(--color-secondary-900)`,
            950: `var(--color-secondary-950)`,
            DEFAULT: `var(--color-secondary-500)`,
          },
          accent: {
            50: `var(--color-accent-50)`,
            100: `var(--color-accent-100)`,
            200: `var(--color-accent-200)`,
            300: `var(--color-accent-300)`,
            400: `var(--color-accent-400)`,
            500: `var(--color-accent-500)`,
            600: `var(--color-accent-600)`,
            700: `var(--color-accent-700)`,
            800: `var(--color-accent-800)`,
            900: `var(--color-accent-900)`,
            950: `var(--color-accent-950)`,
            DEFAULT: `var(--color-accent-500)`,
          },
          success: `var(--color-success)`,
          warning: `var(--color-warning)`,
          error: `var(--color-error)`,
          info: `var(--color-info)`,
        },
        fontFamily: {
          sans: `var(--font-sans)`.split(', '),
          serif: `var(--font-serif)`.split(', '),
          mono: `var(--font-mono)`.split(', '),
          display: theme.typography.fontFamily.display ? 
            `var(--font-display)`.split(', ') : undefined,
        },
        fontSize: {
          xs: `var(--font-size-xs)`,
          sm: `var(--font-size-sm)`,
          base: `var(--font-size-base)`,
          lg: `var(--font-size-lg)`,
          xl: `var(--font-size-xl)`,
          '2xl': `var(--font-size-2xl)`,
          '3xl': `var(--font-size-3xl)`,
          '4xl': `var(--font-size-4xl)`,
          '5xl': `var(--font-size-5xl)`,
          '6xl': `var(--font-size-6xl)`,
        },
        spacing: Object.fromEntries(
          Object.keys(theme.spacing.spacing).map(key => [
            key,
            `var(--spacing-${key})`
          ])
        ),
        borderRadius: {
          none: `var(--border-radius-none)`,
          sm: `var(--border-radius-sm)`,
          DEFAULT: `var(--border-radius-base)`,
          md: `var(--border-radius-md)`,
          lg: `var(--border-radius-lg)`,
          xl: `var(--border-radius-xl)`,
          '2xl': `var(--border-radius-2xl)`,
          '3xl': `var(--border-radius-3xl)`,
          full: `var(--border-radius-full)`,
        },
        boxShadow: {
          sm: `var(--shadow-sm)`,
          DEFAULT: `var(--shadow-base)`,
          md: `var(--shadow-md)`,
          lg: `var(--shadow-lg)`,
          xl: `var(--shadow-xl)`,
          '2xl': `var(--shadow-2xl)`,
          inner: `var(--shadow-inner)`,
          none: `var(--shadow-none)`,
        },
        transitionDuration: {
          75: `var(--duration-75)`,
          100: `var(--duration-100)`,
          150: `var(--duration-150)`,
          200: `var(--duration-200)`,
          300: `var(--duration-300)`,
          500: `var(--duration-500)`,
          700: `var(--duration-700)`,
          1000: `var(--duration-1000)`,
        },
        transitionTimingFunction: {
          linear: `var(--timing-linear)`,
          in: `var(--timing-in)`,
          out: `var(--timing-out)`,
          'in-out': `var(--timing-in-out)`,
        },
      },
    },
  };
}

/**
 * Validate a theme configuration
 */
export function validateTheme(theme: Partial<ThemeConfiguration>): ThemeValidationResult {
  const errors: ThemeValidationError[] = [];
  const warnings: ThemeValidationError[] = [];

  // Required fields
  if (!theme.id) {
    errors.push({
      field: 'id',
      message: 'Theme ID is required',
      value: theme.id,
    });
  }

  if (!theme.name) {
    errors.push({
      field: 'name',
      message: 'Theme name is required',
      value: theme.name,
    });
  }

  if (!theme.version) {
    errors.push({
      field: 'version',
      message: 'Theme version is required',
      value: theme.version,
    });
  }

  // Validate colors
  if (theme.colors) {
    const validateColorPalette = (palette: any, paletteName: string) => {
      const requiredShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      requiredShades.forEach(shade => {
        if (!palette[shade]) {
          errors.push({
            field: `colors.${paletteName}.${shade}`,
            message: `Color shade ${shade} is required for ${paletteName} palette`,
            value: palette[shade],
          });
        } else if (!isValidHexColor(palette[shade])) {
          errors.push({
            field: `colors.${paletteName}.${shade}`,
            message: `Invalid hex color format for ${paletteName}.${shade}`,
            value: palette[shade],
          });
        }
      });
    };

    if (theme.colors.primary) {
      validateColorPalette(theme.colors.primary, 'primary');
    }

    if (theme.colors.secondary) {
      validateColorPalette(theme.colors.secondary, 'secondary');
    }

    if (theme.colors.accent) {
      validateColorPalette(theme.colors.accent, 'accent');
    }

    // Validate semantic colors
    const semanticColors = ['success', 'warning', 'error', 'info'];
    semanticColors.forEach(color => {
      if (theme.colors?.[color as keyof typeof theme.colors] && 
          !isValidHexColor(theme.colors[color as keyof typeof theme.colors] as string)) {
        errors.push({
          field: `colors.${color}`,
          message: `Invalid hex color format for ${color}`,
          value: theme.colors[color as keyof typeof theme.colors],
        });
      }
    });
  }

  // Validate typography
  if (theme.typography) {
    if (theme.typography.fontFamily) {
      const fontFamilies = ['sans', 'serif', 'mono'];
      fontFamilies.forEach(family => {
        const fonts = theme.typography?.fontFamily?.[family as keyof typeof theme.typography.fontFamily];
        if (fonts && (!Array.isArray(fonts) || fonts.length === 0)) {
          errors.push({
            field: `typography.fontFamily.${family}`,
            message: `Font family ${family} must be a non-empty array`,
            value: fonts,
          });
        }
      });
    }

    if (theme.typography.fontSize) {
      Object.entries(theme.typography.fontSize).forEach(([size, value]) => {
        if (!isValidCSSSize(value)) {
          errors.push({
            field: `typography.fontSize.${size}`,
            message: `Invalid CSS size format for font size ${size}`,
            value,
          });
        }
      });
    }
  }

  // Check for accessibility concerns
  if (theme.colors?.primary && theme.colors?.secondary) {
    const primaryColor = theme.colors.primary['500'];
    const secondaryColor = theme.colors.secondary['50'];
    
    if (primaryColor && secondaryColor) {
      const contrastRatio = calculateContrastRatio(primaryColor, secondaryColor);
      
      if (contrastRatio < 3) {
        warnings.push({
          field: 'colors.contrast',
          message: 'Low contrast ratio between primary and light colors may cause accessibility issues',
          value: contrastRatio,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Helper function to validate hex color format
 */
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Helper function to validate CSS size values
 */
function isValidCSSSize(size: string): boolean {
  return /^[\d.]+(?:px|em|rem|%|vh|vw|vmin|vmax)$/.test(size);
}

/**
 * Calculate contrast ratio between two hex colors (simplified)
 */
function calculateContrastRatio(color1: string, color2: string): number {
  // This is a simplified version - in production you'd use a proper color library
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance of RGB color
 */
function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  // Add null guards for the destructured values
  if (rs !== undefined && gs !== undefined && bs !== undefined) {
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
  
  return 0;
}

/**
 * Create a theme override by merging partial theme with base theme
 */
export function createThemeOverride(
  baseTheme: ThemeConfiguration,
  overrides: Partial<ThemeConfiguration>
): ThemeConfiguration {
  return {
    ...baseTheme,
    ...overrides,
    colors: {
      ...baseTheme.colors,
      ...overrides.colors,
      primary: {
        ...baseTheme.colors.primary,
        ...overrides.colors?.primary,
      },
      secondary: {
        ...baseTheme.colors.secondary,
        ...overrides.colors?.secondary,
      },
      accent: {
        ...baseTheme.colors.accent,
        ...overrides.colors?.accent,
      },
      gray: {
        ...baseTheme.colors.gray,
        ...overrides.colors?.gray,
      },
    },
    typography: {
      ...baseTheme.typography,
      ...overrides.typography,
      fontFamily: {
        ...baseTheme.typography.fontFamily,
        ...overrides.typography?.fontFamily,
      },
      fontSize: {
        ...baseTheme.typography.fontSize,
        ...overrides.typography?.fontSize,
      },
      fontWeight: {
        ...baseTheme.typography.fontWeight,
        ...overrides.typography?.fontWeight,
      },
      lineHeight: {
        ...baseTheme.typography.lineHeight,
        ...overrides.typography?.lineHeight,
      },
      letterSpacing: {
        ...baseTheme.typography.letterSpacing,
        ...overrides.typography?.letterSpacing,
      },
    },
    spacing: {
      ...baseTheme.spacing,
      ...overrides.spacing,
      borderRadius: {
        ...baseTheme.spacing.borderRadius,
        ...overrides.spacing?.borderRadius,
      },
      spacing: {
        ...baseTheme.spacing.spacing,
        ...overrides.spacing?.spacing,
      },
      shadows: {
        ...baseTheme.spacing.shadows,
        ...overrides.spacing?.shadows,
      },
    },
    breakpoints: {
      ...baseTheme.breakpoints,
      ...overrides.breakpoints,
    },
    animations: {
      ...baseTheme.animations,
      ...overrides.animations,
      transition: {
        ...baseTheme.animations.transition,
        ...overrides.animations?.transition,
      },
      duration: {
        ...baseTheme.animations.duration,
        ...overrides.animations?.duration,
      },
      timing: {
        ...baseTheme.animations.timing,
        ...overrides.animations?.timing,
      },
    },
    customProperties: {
      ...baseTheme.customProperties,
      ...overrides.customProperties,
    },
  };
} 