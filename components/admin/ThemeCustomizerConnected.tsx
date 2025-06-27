'use client';

import { useState, useCallback, useEffect } from 'react';
import { ThemeConfiguration, ThemeColors } from '@/types/theme';
import { validateTheme } from '@/lib/themes/theme-utils';
import { useSession } from 'next-auth/react';
import { Loader2, Save, RefreshCw, Copy, Eye, Upload, Download } from 'lucide-react';

interface ThemeCustomizerProps {
  clientId?: string;
  onThemeApplied?: (theme: ThemeConfiguration) => void;
}

interface SavedTheme {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  tenantId: string;
  tenantName: string;
  colors: ThemeColors;
  fonts: {
    heading: string;
    body: string;
  };
  metadata?: {
    author?: any;
    createdAt: string;
    updatedAt: string;
    version?: string;
  };
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

export function ThemeCustomizerConnected({ clientId, onThemeApplied }: ThemeCustomizerProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [themes, setThemes] = useState<SavedTheme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeConfiguration | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeSection, setActiveSection] = useState<'colors' | 'typography' | 'spacing' | 'animations'>('colors');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');

  // Fetch available themes
  const fetchThemes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (clientId) {
        params.append('tenantId', clientId);
      }
      params.append('includeDefaults', 'true');

      const response = await fetch(`/api/admin/themes?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch themes');
      
      const data = await response.json();
      setThemes(data.themes || []);
      
      // Select the first theme or the active one
      if (data.themes && data.themes.length > 0) {
        const activeTheme = data.themes.find((t: SavedTheme) => t.isActive) || data.themes[0];
        setSelectedThemeId(activeTheme.id);
        loadTheme(activeTheme);
      }
    } catch (error) {
      console.error('Error fetching themes:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Load a theme for editing
  const loadTheme = (theme: SavedTheme) => {
    const themeConfig: ThemeConfiguration = {
      id: theme.id,
      name: theme.name,
      version: '1.0.0',
      colors: theme.colors,
      typography: {
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          serif: ['Merriweather', 'Georgia', 'serif'],
          mono: ['JetBrains Mono', 'monospace'],
          display: ['Inter', 'system-ui', 'sans-serif']
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
          '5xl': '3rem',
          '6xl': '3.75rem'
        },
        fontWeight: {
          thin: '100',
          light: '300',
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700',
          extrabold: '800'
        },
        lineHeight: {
          tight: '1.25',
          snug: '1.375',
          normal: '1.5',
          relaxed: '1.625',
          loose: '2'
        },
        letterSpacing: {
          tighter: '-0.05em',
          tight: '-0.025em',
          normal: '0',
          wide: '0.025em',
          wider: '0.05em',
          widest: '0.1em'
        }
      },
      spacing: {
        spacing: {
          px: '1px',
          0.5: '0.125rem',
          1: '0.25rem',
          1.5: '0.375rem',
          2: '0.5rem',
          2.5: '0.625rem',
          3: '0.75rem',
          3.5: '0.875rem',
          4: '1rem',
          5: '1.25rem',
          6: '1.5rem',
          7: '1.75rem',
          8: '2rem',
          9: '2.25rem',
          10: '2.5rem',
          11: '2.75rem',
          12: '3rem',
          14: '3.5rem',
          16: '4rem',
          20: '5rem',
          24: '6rem',
          28: '7rem',
          32: '8rem',
          36: '9rem',
          40: '10rem',
          44: '11rem',
          48: '12rem',
          52: '13rem',
          56: '14rem',
          60: '15rem',
          64: '16rem',
          72: '18rem',
          80: '20rem',
          96: '24rem'
        },
        borderRadius: {
          none: '0',
          sm: '0.125rem',
          base: '0.25rem',
          md: '0.375rem',
          lg: '0.5rem',
          xl: '0.75rem',
          '2xl': '1rem',
          '3xl': '1.5rem',
          full: '9999px'
        },
        shadows: {
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
          none: 'none'
        }
      },
      animations: {
        transition: {
          none: 'none',
          all: 'all',
          default: 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform',
          colors: 'background-color, border-color, color, fill, stroke',
          opacity: 'opacity',
          shadow: 'box-shadow',
          transform: 'transform'
        },
        duration: {
          '75': '75ms',
          '100': '100ms',
          '150': '150ms',
          '200': '200ms',
          '300': '300ms',
          '500': '500ms',
          '700': '700ms',
          '1000': '1000ms'
        },
        timing: {
          linear: 'linear',
          'in': 'ease-in',
          'out': 'ease-out',
          'in-out': 'ease-in-out'
        }
      },
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px'
      }
    };

    setCurrentTheme(themeConfig);
    setThemeName(theme.name);
    setThemeDescription(theme.description || '');
    setHasUnsavedChanges(false);
  };

  // Save theme changes
  const saveTheme = async () => {
    if (!currentTheme || !selectedThemeId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/themes/${selectedThemeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: themeName || currentTheme.name,
          description: themeDescription,
          colors: currentTheme.colors,
          fonts: {
            heading: currentTheme.typography.fontFamily.serif[0],
            body: currentTheme.typography.fontFamily.sans[0]
          }
        })
      });

      if (!response.ok) throw new Error('Failed to save theme');
      
      setHasUnsavedChanges(false);
      await fetchThemes(); // Refresh themes list
    } catch (error) {
      console.error('Error saving theme:', error);
    } finally {
      setSaving(false);
    }
  };

  // Create new theme
  const createNewTheme = async () => {
    const newThemeName = prompt('Enter name for new theme:');
    if (!newThemeName) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newThemeName.toLowerCase().replace(/\s+/g, '-'),
          name: newThemeName,
          description: 'Custom theme',
          colors: currentTheme?.colors || {
            primary: generateDefaultPalette('#3b82f6'),
            secondary: generateDefaultPalette('#8b5cf6'),
            accent: generateDefaultPalette('#f59e0b'),
            gray: generateDefaultPalette('#6b7280'),
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6'
          },
          fonts: {
            heading: 'Inter',
            body: 'Inter'
          },
          tenantId: clientId
        })
      });

      if (!response.ok) throw new Error('Failed to create theme');
      
      await fetchThemes();
    } catch (error) {
      console.error('Error creating theme:', error);
    } finally {
      setSaving(false);
    }
  };

  // Duplicate theme
  const duplicateTheme = async () => {
    if (!selectedThemeId) return;

    const newName = prompt('Enter name for duplicated theme:');
    if (!newName) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/themes/${selectedThemeId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          targetTenantId: clientId
        })
      });

      if (!response.ok) throw new Error('Failed to duplicate theme');
      
      await fetchThemes();
    } catch (error) {
      console.error('Error duplicating theme:', error);
    } finally {
      setSaving(false);
    }
  };

  // Preview theme
  const previewTheme = async () => {
    if (!currentTheme || !selectedThemeId) return;

    setShowPreview(true);
    try {
      const response = await fetch(`/api/admin/themes/${selectedThemeId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: clientId,
          temporaryOverrides: {
            colors: currentTheme.colors
          }
        })
      });

      if (!response.ok) throw new Error('Failed to preview theme');
      
      const data = await response.json();
      // You could open a preview window or update the UI here
    } catch (error) {
      console.error('Error previewing theme:', error);
    }
  };

  // Apply theme to client
  const applyTheme = async () => {
    if (!selectedThemeId || !clientId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/themes/${selectedThemeId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: clientId
        })
      });

      if (!response.ok) throw new Error('Failed to apply theme');
      
      const data = await response.json();
      if (onThemeApplied && currentTheme) {
        onThemeApplied(currentTheme);
      }
    } catch (error) {
      console.error('Error applying theme:', error);
    } finally {
      setSaving(false);
    }
  };

  // Generate default palette
  const generateDefaultPalette = (baseColor: string) => {
    const hsl = hexToHsl(baseColor);
    return {
      50: hslToHex(hsl.h, hsl.s, 95),
      100: hslToHex(hsl.h, hsl.s, 90),
      200: hslToHex(hsl.h, hsl.s, 80),
      300: hslToHex(hsl.h, hsl.s, 70),
      400: hslToHex(hsl.h, hsl.s, 60),
      500: baseColor,
      600: hslToHex(hsl.h, hsl.s, 40),
      700: hslToHex(hsl.h, hsl.s, 30),
      800: hslToHex(hsl.h, hsl.s, 20),
      900: hslToHex(hsl.h, hsl.s, 10),
      950: hslToHex(hsl.h, hsl.s, 5)
    };
  };

  // Handle theme changes
  const handleThemeChange = useCallback((updates: Partial<ThemeConfiguration>) => {
    if (!currentTheme) return;

    const updatedTheme = { ...currentTheme, ...updates };
    
    // Validate theme
    const validation = validateTheme(updatedTheme);
    setValidationErrors(validation.errors.map(error => error.message));
    
    setCurrentTheme(updatedTheme);
    setHasUnsavedChanges(true);
  }, [currentTheme]);

  const handleColorChange = useCallback((colorType: keyof ThemeColors, newColors: any) => {
    if (!currentTheme) return;
    
    handleThemeChange({
      colors: {
        ...currentTheme.colors,
        [colorType]: newColors
      }
    });
  }, [currentTheme, handleThemeChange]);

  const handleSemanticColorChange = useCallback((colorType: 'success' | 'warning' | 'error' | 'info', color: string) => {
    if (!currentTheme) return;
    
    handleThemeChange({
      colors: {
        ...currentTheme.colors,
        [colorType]: color
      }
    });
  }, [currentTheme, handleThemeChange]);

  // Fetch themes on mount
  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border">
        <div className="text-lg mb-2">🔒</div>
        <div>Admin access required</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading themes...</p>
      </div>
    );
  }

  if (!currentTheme) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-4">No themes found</p>
        <button
          onClick={createNewTheme}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create New Theme
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Theme Selector and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={selectedThemeId || ''}
            onChange={(e) => {
              const theme = themes.find(t => t.id === e.target.value);
              if (theme) {
                setSelectedThemeId(theme.id);
                loadTheme(theme);
              }
            }}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {themes.map(theme => (
              <option key={theme.id} value={theme.id}>
                {theme.name} {theme.isDefault && '(Default)'} {theme.isActive && '✓'}
              </option>
            ))}
          </select>
          
          {hasUnsavedChanges && (
            <span className="text-sm text-orange-600">• Unsaved changes</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={previewTheme}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Preview theme"
          >
            <Eye className="w-5 h-5" />
          </button>
          
          <button
            onClick={duplicateTheme}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Duplicate theme"
          >
            <Copy className="w-5 h-5" />
          </button>
          
          <button
            onClick={createNewTheme}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Create new theme"
          >
            <Upload className="w-5 h-5" />
          </button>
          
          <button
            onClick={saveTheme}
            disabled={!hasUnsavedChanges || saving}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
          
          {clientId && (
            <button
              onClick={applyTheme}
              disabled={saving || hasUnsavedChanges}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply to Client
            </button>
          )}
        </div>
      </div>

      {/* Theme Name and Description */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Theme Name</label>
          <input
            type="text"
            value={themeName}
            onChange={(e) => {
              setThemeName(e.target.value);
              setHasUnsavedChanges(true);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            value={themeDescription}
            onChange={(e) => {
              setThemeDescription(e.target.value);
              setHasUnsavedChanges(true);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Optional description"
          />
        </div>
      </div>

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
                colors={currentTheme.colors.primary}
                onChange={(colors) => handleColorChange('primary', colors)}
              />
              
              <ColorPalette
                label="Secondary Colors"
                colors={currentTheme.colors.secondary}
                onChange={(colors) => handleColorChange('secondary', colors)}
              />
              
              <ColorPalette
                label="Accent Colors"
                colors={currentTheme.colors.accent}
                onChange={(colors) => handleColorChange('accent', colors)}
              />
              
              <ColorPalette
                label="Gray Colors"
                colors={currentTheme.colors.gray}
                onChange={(colors) => handleColorChange('gray', colors)}
              />
            </div>

            {/* Semantic Colors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Semantic Colors</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'success', label: 'Success', color: currentTheme.colors.success },
                  { key: 'warning', label: 'Warning', color: currentTheme.colors.warning },
                  { key: 'error', label: 'Error', color: currentTheme.colors.error },
                  { key: 'info', label: 'Info', color: currentTheme.colors.info }
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

        {/* Other sections remain the same as original */}
      </div>
    </div>
  );
}