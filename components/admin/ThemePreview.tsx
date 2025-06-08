'use client';

import { useState, useEffect } from 'react';
import { ThemeConfiguration } from '@/types/theme';
import { applyTheme } from '@/lib/themes/theme-utils';

interface ThemePreviewProps {
  theme: ThemeConfiguration;
  isActive: boolean;
  onTogglePreview: () => void;
}

export function ThemePreview({ theme, isActive, onTogglePreview }: ThemePreviewProps) {
  const [currentView, setCurrentView] = useState<'components' | 'pages' | 'interactive'>('components');

  useEffect(() => {
    if (isActive) {
      applyTheme(theme);
    }
  }, [theme, isActive]);

  const PreviewWrapper = ({ children, title }: { children: React.ReactNode, title: string }) => (
    <div className="border rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );

  const ComponentsPreview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Buttons Preview */}
        <PreviewWrapper title="Buttons">
          <div className="flex flex-wrap gap-2">
            <button 
              className="px-4 py-2 text-white rounded transition-colors"
              style={{ backgroundColor: theme.colors.primary[500] }}
            >
              Primary
            </button>
            <button 
              className="px-4 py-2 text-white rounded transition-colors"
              style={{ backgroundColor: theme.colors.secondary[500] }}
            >
              Secondary
            </button>
            <button 
              className="px-4 py-2 text-white rounded transition-colors"
              style={{ backgroundColor: theme.colors.accent[500] }}
            >
              Accent
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              className="px-4 py-2 text-white rounded transition-colors"
              style={{ backgroundColor: theme.colors.success }}
            >
              Success
            </button>
            <button 
              className="px-4 py-2 text-white rounded transition-colors"
              style={{ backgroundColor: theme.colors.warning }}
            >
              Warning
            </button>
            <button 
              className="px-4 py-2 text-white rounded transition-colors"
              style={{ backgroundColor: theme.colors.error }}
            >
              Error
            </button>
          </div>
        </PreviewWrapper>

        {/* Form Elements Preview */}
        <PreviewWrapper title="Form Elements">
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="Text input"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ 
                borderColor: theme.colors.gray[300]
              }}
            />
            <select 
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ 
                borderColor: theme.colors.gray[300]
              }}
            >
              <option>Select option</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
            <textarea 
              placeholder="Textarea"
              rows={3}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ 
                borderColor: theme.colors.gray[300]
              }}
            />
          </div>
        </PreviewWrapper>

        {/* Typography Preview */}
        <PreviewWrapper title="Typography">
          <div className="space-y-2">
            <h1 
              className="text-3xl font-bold"
              style={{ 
                fontFamily: theme.typography.fontFamily.display?.join(', ') || theme.typography.fontFamily.sans.join(', '),
                color: theme.colors.gray[900]
              }}
            >
              Display Heading
            </h1>
            <h2 
              className="text-xl font-semibold"
              style={{ 
                fontFamily: theme.typography.fontFamily.serif?.join(', ') || theme.typography.fontFamily.sans.join(', '),
                color: theme.colors.gray[800]
              }}
            >
              Serif Heading
            </h2>
            <p 
              className="text-base"
              style={{ 
                fontFamily: theme.typography.fontFamily.sans.join(', '),
                color: theme.colors.gray[700]
              }}
            >
              This is body text using the sans-serif font family. It demonstrates how the theme affects text rendering.
            </p>
            <code 
              className="text-sm px-2 py-1 rounded"
              style={{ 
                fontFamily: theme.typography.fontFamily.mono?.join(', ') || 'monospace',
                backgroundColor: theme.colors.gray[100],
                color: theme.colors.gray[800]
              }}
            >
              monospace.code()
            </code>
          </div>
        </PreviewWrapper>

        {/* Cards & Layout Preview */}
        <PreviewWrapper title="Cards & Layout">
          <div className="space-y-3">
            <div 
              className="p-4 rounded border"
              style={{ 
                borderColor: theme.colors.gray[200],
                backgroundColor: 'white',
                borderRadius: theme.spacing.borderRadius.lg,
                boxShadow: theme.spacing.shadows.md
              }}
            >
              <h3 
                className="font-semibold mb-2"
                style={{ color: theme.colors.primary[600] }}
              >
                Sample Card
              </h3>
              <p 
                className="text-sm"
                style={{ color: theme.colors.gray[600] }}
              >
                This card demonstrates border radius, shadows, and color combinations.
              </p>
            </div>
            
            <div 
              className="p-3 rounded"
              style={{ 
                backgroundColor: theme.colors.primary[50],
                borderLeft: `4px solid ${theme.colors.primary[500]}`,
                borderRadius: theme.spacing.borderRadius.md
              }}
            >
              <p 
                className="text-sm font-medium"
                style={{ color: theme.colors.primary[800] }}
              >
                Info Alert
              </p>
            </div>
          </div>
        </PreviewWrapper>
      </div>

      {/* Color Palette Preview */}
      <PreviewWrapper title="Color Palette">
        <div className="space-y-4">
          {[
            { name: 'Primary', colors: theme.colors.primary },
            { name: 'Secondary', colors: theme.colors.secondary },
            { name: 'Accent', colors: theme.colors.accent },
            { name: 'Gray', colors: theme.colors.gray }
          ].map(({ name, colors }) => (
            <div key={name}>
              <div className="text-xs font-medium text-gray-600 mb-2">{name}</div>
              <div className="flex">
                {Object.entries(colors).map(([shade, color]) => (
                  <div 
                    key={shade}
                    className="flex-1 h-12 flex items-end justify-center relative group"
                    style={{ backgroundColor: color }}
                  >
                    <div className="absolute bottom-1 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-75 text-white px-1 rounded">
                      {shade}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PreviewWrapper>
    </div>
  );

  const PagesPreview = () => (
    <div className="space-y-6">
      {/* Simulated App Header */}
      <div 
        className="p-4 rounded-lg"
        style={{ 
          backgroundColor: theme.colors.primary[500],
          color: 'white'
        }}
      >
        <div className="flex justify-between items-center">
          <h1 
            className="text-xl font-bold"
            style={{ fontFamily: theme.typography.fontFamily.display?.join(', ') || theme.typography.fontFamily.sans.join(', ') }}
          >
            Travel Itinerary Builder
          </h1>
          <div className="flex gap-2">
            <button 
              className="px-3 py-1 rounded transition-colors"
              style={{ 
                backgroundColor: theme.colors.primary[600],
                color: 'white'
              }}
            >
              Login
            </button>
            <button 
              className="px-3 py-1 rounded transition-colors"
              style={{ 
                backgroundColor: theme.colors.accent[500],
                color: 'white'
              }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* Simulated Content Area */}
      <div className="grid grid-cols-3 gap-4">
        <div 
          className="col-span-2 p-4 rounded-lg"
          style={{ 
            backgroundColor: 'white',
            borderRadius: theme.spacing.borderRadius.lg,
            boxShadow: theme.spacing.shadows.sm,
            border: `1px solid ${theme.colors.gray[200]}`
          }}
        >
          <h2 
            className="text-lg font-semibold mb-3"
            style={{ 
              color: theme.colors.gray[900],
              fontFamily: theme.typography.fontFamily.serif.join(', ')
            }}
          >
            Plan Your Perfect Trip
          </h2>
          <p 
            className="text-sm mb-4"
            style={{ 
              color: theme.colors.gray[600],
              fontFamily: theme.typography.fontFamily.sans.join(', ')
            }}
          >
            Create personalized travel itineraries with our AI-powered trip planning tool.
          </p>
          <button 
            className="px-4 py-2 rounded transition-colors"
            style={{ 
              backgroundColor: theme.colors.primary[500],
              color: 'white'
            }}
          >
            Start Planning
          </button>
        </div>

        <div className="space-y-3">
          <div 
            className="p-3 rounded"
            style={{ 
              backgroundColor: theme.colors.success,
              color: 'white',
              borderRadius: theme.spacing.borderRadius.md
            }}
          >
            <div className="text-sm font-medium">Success!</div>
            <div className="text-xs">Trip saved successfully</div>
          </div>
          
          <div 
            className="p-3 rounded"
            style={{ 
              backgroundColor: theme.colors.warning,
              color: 'white',
              borderRadius: theme.spacing.borderRadius.md
            }}
          >
            <div className="text-sm font-medium">Warning</div>
            <div className="text-xs">Please verify dates</div>
          </div>
        </div>
      </div>
    </div>
  );

  const InteractivePreview = () => {
    const [hoveredButton, setHoveredButton] = useState<string | null>(null);
    const [formValues, setFormValues] = useState({ text: '', select: '' });

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Interactive Theme Testing</h3>
          <p className="text-sm text-gray-600 mb-6">
            Hover and interact with elements to see theme transitions and states
          </p>
        </div>

        {/* Interactive Buttons */}
        <PreviewWrapper title="Hover Effects">
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'primary', color: theme.colors.primary[500], hoverColor: theme.colors.primary[600] },
              { id: 'secondary', color: theme.colors.secondary[500], hoverColor: theme.colors.secondary[600] },
              { id: 'accent', color: theme.colors.accent[500], hoverColor: theme.colors.accent[600] }
            ].map(({ id, color, hoverColor }) => (
              <button
                key={id}
                className="px-4 py-2 text-white rounded transition-all"
                style={{ 
                  backgroundColor: hoveredButton === id ? hoverColor : color,
                  transitionDuration: theme.animations.duration[150] || '150ms',
                  transitionTimingFunction: theme.animations.timing['in-out'] || 'ease-in-out'
                }}
                onMouseEnter={() => setHoveredButton(id)}
                onMouseLeave={() => setHoveredButton(null)}
              >
                {id.charAt(0).toUpperCase() + id.slice(1)} Button
              </button>
            ))}
          </div>
        </PreviewWrapper>

        {/* Interactive Form */}
        <PreviewWrapper title="Form Interactions">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Type something..."
              value={formValues.text}
              onChange={(e) => setFormValues({ ...formValues, text: e.target.value })}
              className="w-full px-3 py-2 border rounded transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                borderColor: formValues.text ? theme.colors.primary[300] : theme.colors.gray[300],
                transitionDuration: theme.animations.duration[150] || '150ms'
              }}
            />
            <select
              value={formValues.select}
              onChange={(e) => setFormValues({ ...formValues, select: e.target.value })}
              className="w-full px-3 py-2 border rounded transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                borderColor: formValues.select ? theme.colors.primary[300] : theme.colors.gray[300],
                transitionDuration: theme.animations.duration[150] || '150ms'
              }}
            >
              <option value="">Select an option...</option>
              <option value="1">Adventure Travel</option>
              <option value="2">Luxury Vacation</option>
              <option value="3">Budget Backpacking</option>
            </select>
          </div>
        </PreviewWrapper>

        {/* Animation Demo */}
        <PreviewWrapper title="Animation Timing">
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(theme.animations.duration).map(([name, duration]) => (
              <div key={name} className="text-center">
                <div 
                  className="w-full h-12 rounded mb-2 transition-all hover:scale-105 cursor-pointer"
                  style={{
                    backgroundColor: theme.colors.primary[500],
                    transitionDuration: duration,
                    transitionTimingFunction: theme.animations.timing['in-out'] || 'ease-in-out'
                  }}
                />
                <div className="text-xs text-gray-600">{name}</div>
                <div className="text-xs text-gray-500">{duration}</div>
              </div>
            ))}
          </div>
        </PreviewWrapper>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Live Theme Preview</h3>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 rounded p-1">
            {[
              { id: 'components', label: 'Components', icon: '🧩' },
              { id: 'pages', label: 'Pages', icon: '📄' },
              { id: 'interactive', label: 'Interactive', icon: '🎮' }
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id as any)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  currentView === view.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="mr-1">{view.icon}</span>
                {view.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={onTogglePreview}
            className={`px-4 py-2 rounded transition-colors ${
              isActive 
                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isActive ? 'Exit Preview' : 'Enable Preview'}
          </button>
        </div>
      </div>

      {/* Preview Notice */}
      {isActive && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="text-blue-500">👁️</div>
            <div className="text-sm text-blue-800">
              <strong>Live Preview Active:</strong> The theme is currently applied to this page. 
              Changes to the theme will be reflected in real-time.
            </div>
          </div>
        </div>
      )}

      {/* Preview Content */}
      <div className="min-h-[500px]">
        {currentView === 'components' && <ComponentsPreview />}
        {currentView === 'pages' && <PagesPreview />}
        {currentView === 'interactive' && <InteractivePreview />}
      </div>

      {/* Theme Info */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            <strong>Current Theme:</strong> {theme.name}
          </div>
          <div>
            <strong>Version:</strong> {theme.version}
          </div>
        </div>
      </div>
    </div>
  );
} 