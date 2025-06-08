'use client';

import { useState, useCallback } from 'react';
import { ThemeConfiguration, ThemeColors } from '@/types/theme';
import { validateTheme } from '@/lib/themes/theme-utils';

interface ThemeCustomizerProps {
  theme: ThemeConfiguration;
  onThemeChange: (theme: ThemeConfiguration) => void;
  disabled?: boolean;
}

interface ColorPaletteProps {
  label: string;
  colors: {
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
  onChange: (colors: any) => void;
}

function ColorPalette({ label, colors, onChange }: ColorPaletteProps) {
  const handleColorChange = (shade: string, value: string) => {
    onChange({
      ...colors,
      [shade]: value
    });
  };

  const generatePalette = (baseColor: string) => {
    // Simple palette generation - in production, use a more sophisticated algorithm
    const hsl = hexToHsl(baseColor);
    const newColors = {
      50: hslToHex(hsl.h, hsl.s, Math.min(95, hsl.l + 40)),
      100: hslToHex(hsl.h, hsl.s, Math.min(90, hsl.l + 30)),
      200: hslToHex(hsl.h, hsl.s, Math.min(80, hsl.l + 20)),
      300: hslToHex(hsl.h, hsl.s, Math.min(70, hsl.l + 10)),
      400: hslToHex(hsl.h, hsl.s, Math.min(60, hsl.l + 5)),
      500: baseColor,
      600: hslToHex(hsl.h, hsl.s, Math.max(30, hsl.l - 5)),
      700: hslToHex(hsl.h, hsl.s, Math.max(25, hsl.l - 10)),
      800: hslToHex(hsl.h, hsl.s, Math.max(20, hsl.l - 15)),
      900: hslToHex(hsl.h, hsl.s, Math.max(15, hsl.l - 20)),
      950: hslToHex(hsl.h, hsl.s, Math.max(10, hsl.l - 25))
    };
    onChange(newColors);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-medium text-sm">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={colors[500]}
            onChange={(e) => generatePalette(e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            title="Generate palette from base color"
          />
          <span className="text-xs text-gray-500">Base Color</span>
        </div>
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(colors).map(([shade, color]) => (
          <div key={shade} className="space-y-1">
            <input
              type="color"
              value={color}
              onChange={(e) => handleColorChange(shade, e.target.value)}
              className="w-full h-8 border border-gray-300 rounded cursor-pointer"
            />
            <div className="text-xs text-center text-gray-500">{shade}</div>
            <div 
              className="w-full h-6 rounded border"
              style={{ backgroundColor: color }}
              title={color}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple color conversion utilities
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function ThemeCustomizer({ theme, onThemeChange, disabled = false }: ThemeCustomizerProps) {
  const [activeSection, setActiveSection] = useState<'colors' | 'typography' | 'spacing' | 'animations'>('colors');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleColorChange = useCallback((colorType: keyof ThemeColors, newColors: any) => {
    const updatedTheme = {
      ...theme,
      colors: {
        ...theme.colors,
        [colorType]: newColors
      }
    };
    
    // Validate theme
    const validation = validateTheme(updatedTheme);
    setValidationErrors(validation.errors.map(error => error.message));
    
    onThemeChange(updatedTheme);
  }, [theme, onThemeChange]);

  const handleSemanticColorChange = useCallback((colorType: 'success' | 'warning' | 'error' | 'info', color: string) => {
    const updatedTheme = {
      ...theme,
      colors: {
        ...theme.colors,
        [colorType]: color
      }
    };
    
    onThemeChange(updatedTheme);
  }, [theme, onThemeChange]);

  const handleTypographyChange = useCallback((property: string, value: any) => {
    const updatedTheme = {
      ...theme,
      typography: {
        ...theme.typography,
        [property]: value
      }
    };
    
    onThemeChange(updatedTheme);
  }, [theme, onThemeChange]);

  const handleSpacingChange = useCallback((property: string, value: any) => {
    const updatedTheme = {
      ...theme,
      spacing: {
        ...theme.spacing,
        [property]: value
      }
    };
    
    onThemeChange(updatedTheme);
  }, [theme, onThemeChange]);

  const fontOptions = [
    { value: ['Inter', 'system-ui', 'sans-serif'], label: 'Inter (Modern Sans)' },
    { value: ['Roboto', 'system-ui', 'sans-serif'], label: 'Roboto (Clean Sans)' },
    { value: ['Open Sans', 'system-ui', 'sans-serif'], label: 'Open Sans (Friendly)' },
    { value: ['Merriweather', 'Georgia', 'serif'], label: 'Merriweather (Elegant Serif)' },
    { value: ['Georgia', 'serif'], label: 'Georgia (Classic Serif)' },
    { value: ['JetBrains Mono', 'monospace'], label: 'JetBrains Mono (Code)' },
    { value: ['system-ui', 'sans-serif'], label: 'System Default' }
  ];

  if (disabled) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border">
        <div className="text-lg mb-2">🔒</div>
        <div>Theme customization is disabled</div>
        <div className="text-sm mt-1">Select a client to enable editing</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'colors', label: 'Colors', icon: '🎨' },
            { id: 'typography', label: 'Typography', icon: '🔤' },
            { id: 'spacing', label: 'Spacing', icon: '📐' },
            { id: 'animations', label: 'Animations', icon: '✨' }
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeSection === section.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Theme Validation Errors:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Section Content */}
      <div className="space-y-8">
        {activeSection === 'colors' && (
          <div className="space-y-8">
            {/* Brand Colors */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Brand Colors</h3>
              
              <ColorPalette
                label="Primary Colors"
                colors={theme.colors.primary}
                onChange={(colors) => handleColorChange('primary', colors)}
              />
              
              <ColorPalette
                label="Secondary Colors"
                colors={theme.colors.secondary}
                onChange={(colors) => handleColorChange('secondary', colors)}
              />
              
              <ColorPalette
                label="Accent Colors"
                colors={theme.colors.accent}
                onChange={(colors) => handleColorChange('accent', colors)}
              />
              
              <ColorPalette
                label="Gray Colors"
                colors={theme.colors.gray}
                onChange={(colors) => handleColorChange('gray', colors)}
              />
            </div>

            {/* Semantic Colors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Semantic Colors</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'success', label: 'Success', color: theme.colors.success },
                  { key: 'warning', label: 'Warning', color: theme.colors.warning },
                  { key: 'error', label: 'Error', color: theme.colors.error },
                  { key: 'info', label: 'Info', color: theme.colors.info }
                ].map(({ key, label, color }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleSemanticColorChange(key as any, e.target.value)}
                      className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-gray-500">{color}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'typography' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Typography</h3>
            
            {/* Font Families */}
            <div className="space-y-4">
              <h4 className="font-medium">Font Families</h4>
              
              {[
                { key: 'sans', label: 'Sans-serif (Body Text)' },
                { key: 'serif', label: 'Serif (Headings)' },
                { key: 'mono', label: 'Monospace (Code)' },
                { key: 'display', label: 'Display (Large Text)' }
              ].map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <label className="block font-medium text-sm">{label}</label>
                  <select
                    value={JSON.stringify(theme.typography.fontFamily[key as keyof typeof theme.typography.fontFamily])}
                    onChange={(e) => {
                      const newFontFamily = JSON.parse(e.target.value);
                      handleTypographyChange('fontFamily', {
                        ...theme.typography.fontFamily,
                        [key]: newFontFamily
                      });
                    }}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    {fontOptions.map((option, index) => (
                      <option key={index} value={JSON.stringify(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div 
                    className="text-sm p-3 bg-gray-50 rounded border"
                    style={{ fontFamily: (theme.typography.fontFamily[key as keyof typeof theme.typography.fontFamily] as string[]).join(', ') }}
                  >
                    Sample text in {label.toLowerCase()}
                  </div>
                </div>
              ))}
            </div>

            {/* Font Sizes Preview */}
            <div className="space-y-4">
              <h4 className="font-medium">Font Size Scale</h4>
              <div className="space-y-2">
                {Object.entries(theme.typography.fontSize).map(([size, value]) => (
                  <div key={size} className="flex items-center gap-4">
                    <div className="w-12 text-xs text-gray-500">{size}</div>
                    <div className="w-20 text-xs text-gray-500">{value}</div>
                    <div style={{ fontSize: value }}>Sample text</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'spacing' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Spacing & Layout</h3>
            
            {/* Border Radius */}
            <div className="space-y-4">
              <h4 className="font-medium">Border Radius Scale</h4>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(theme.spacing.borderRadius).map(([size, value]) => (
                  <div key={size} className="space-y-2">
                    <div className="text-sm font-medium">{size}</div>
                    <div className="text-xs text-gray-500">{value}</div>
                    <div 
                      className="w-16 h-16 bg-blue-200 border-2 border-blue-400"
                      style={{ borderRadius: value }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Shadows Preview */}
            <div className="space-y-4">
              <h4 className="font-medium">Shadow Scale</h4>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(theme.spacing.shadows).map(([size, value]) => (
                  <div key={size} className="space-y-2">
                    <div className="text-sm font-medium">{size}</div>
                    <div className="text-xs text-gray-500 truncate" title={value}>{value}</div>
                    <div 
                      className="w-16 h-16 bg-white border border-gray-200"
                      style={{ boxShadow: value }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'animations' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Animations & Transitions</h3>
            
            {/* Transition Durations */}
            <div className="space-y-4">
              <h4 className="font-medium">Duration Scale</h4>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(theme.animations.duration).map(([duration, value]) => (
                  <div key={duration} className="text-center">
                    <div className="text-sm font-medium">{duration}</div>
                    <div className="text-xs text-gray-500">{value}</div>
                    <button
                      className="w-full mt-2 p-2 bg-blue-500 text-white rounded transition-all hover:bg-blue-600"
                      style={{ transitionDuration: value }}
                    >
                      Hover me
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Timing Functions */}
            <div className="space-y-4">
              <h4 className="font-medium">Timing Functions</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(theme.animations.timing).map(([timing, value]) => (
                  <div key={timing} className="text-center">
                    <div className="text-sm font-medium">{timing}</div>
                    <div className="text-xs text-gray-500">{value}</div>
                    <button
                      className="w-full mt-2 p-2 bg-green-500 text-white rounded transition-all duration-500 hover:bg-green-600"
                      style={{ transitionTimingFunction: value }}
                    >
                      Hover me
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 