// White-Label Theme Configuration Types

export interface ThemeColors {
  // Primary brand colors
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;  // Main primary color
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  
  // Secondary brand colors
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;  // Main secondary color
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };

  // Accent colors
  accent: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;  // Main accent color
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };

  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Neutral colors (grayscale)
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
}

export interface ThemeTypography {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
    display?: string[];  // For headings/display text
  };
  
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
  };

  fontWeight: {
    thin: string;
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
    extrabold: string;
  };

  lineHeight: {
    tight: string;
    snug: string;
    normal: string;
    relaxed: string;
    loose: string;
  };

  letterSpacing: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
  };
}

export interface ThemeSpacing {
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };

  spacing: {
    px: string;
    0.5: string;
    1: string;
    1.5: string;
    2: string;
    2.5: string;
    3: string;
    3.5: string;
    4: string;
    5: string;
    6: string;
    7: string;
    8: string;
    9: string;
    10: string;
    11: string;
    12: string;
    14: string;
    16: string;
    20: string;
    24: string;
    28: string;
    32: string;
    36: string;
    40: string;
    44: string;
    48: string;
    52: string;
    56: string;
    60: string;
    64: string;
    72: string;
    80: string;
    96: string;
  };

  shadows: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    inner: string;
    none: string;
  };
}

export interface ThemeBreakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ThemeAnimations {
  transition: {
    none: string;
    all: string;
    default: string;
    colors: string;
    opacity: string;
    shadow: string;
    transform: string;
  };

  duration: {
    75: string;
    100: string;
    150: string;
    200: string;
    300: string;
    500: string;
    700: string;
    1000: string;
  };

  timing: {
    linear: string;
    in: string;
    out: string;
    'in-out': string;
  };
}

export interface ThemeConfiguration {
  id: string;
  name: string;
  description?: string;
  version: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  breakpoints: ThemeBreakpoints;
  animations: ThemeAnimations;
  customProperties?: Record<string, string>;  // For additional CSS custom properties
}

export interface WhiteLabelBranding {
  companyName: string;
  companyLogo: {
    light: string;  // URL or path to light mode logo
    dark?: string;  // URL or path to dark mode logo
    favicon?: string;  // URL or path to favicon
  };
  brandingAssets: {
    heroImage?: string;
    backgroundPatterns?: string[];
    icons?: Record<string, string>;
  };
  socialLinks?: {
    website?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

export interface WhiteLabelConfiguration {
  id: string;
  clientId: string;
  isActive: boolean;
  theme: ThemeConfiguration;
  branding: WhiteLabelBranding;
  features: {
    enabledFeatures: string[];
    disabledFeatures: string[];
    customFeatures?: Record<string, any>;
  };
  domains: {
    primary: string;
    aliases?: string[];
    customDomain?: string;
  };
  settings: {
    language: string;
    currency: string;
    timezone: string;
    dateFormat: string;
    enableAnalytics: boolean;
    enableChatSupport: boolean;
  };
  createdAt: string;
  updatedAt: string;
  deployedAt?: string;
}

// Default theme configurations
export type ThemePreset = 'default' | 'modern' | 'classic' | 'minimal' | 'vibrant' | 'professional';

export interface ThemePresetDefinition {
  name: string;
  description: string;
  preview: string;  // URL to preview image
  configuration: Partial<ThemeConfiguration>;
}

// Theme context types
export interface ThemeContextValue {
  currentTheme: ThemeConfiguration;
  availableThemes: ThemePresetDefinition[];
  isLoading: boolean;
  error: string | null;
  setTheme: (theme: ThemeConfiguration | ThemePreset) => Promise<void>;
  updateTheme: (updates: Partial<ThemeConfiguration>) => Promise<void>;
  resetTheme: () => Promise<void>;
  previewTheme: (theme: ThemeConfiguration) => void;
  clearPreview: () => void;
  isPreview: boolean;
}

// API types for theme management
export interface ThemeApiResponse {
  success: boolean;
  data?: ThemeConfiguration;
  error?: string;
}

export interface ThemeListApiResponse {
  success: boolean;
  data?: ThemeConfiguration[];
  error?: string;
}

export interface ThemeValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ThemeValidationResult {
  isValid: boolean;
  errors: ThemeValidationError[];
  warnings?: ThemeValidationError[];
} 