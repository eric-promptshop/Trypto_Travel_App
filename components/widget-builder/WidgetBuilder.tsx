'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Code, Copy, Check, Palette, Settings, Eye, Sparkles, Globe, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface WidgetConfig {
  id?: string
  name: string
  type: 'itinerary_builder' | 'tour_showcase' | 'lead_capture' | 'booking_calendar'
  theme: {
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full'
    buttonStyle: 'solid' | 'outline' | 'ghost'
    logoUrl?: string
    logoPosition?: 'left' | 'center' | 'right' | 'hidden'
    customCSS?: string
  }
  features: string[]
  domains: string[]
  settings?: {
    language?: string
    currency?: string
    defaultDestination?: string
    tourCategories?: string[]
    maxTravelers?: number
    dateRangeLimit?: number
    requireEmail?: boolean
    requirePhone?: boolean
    customFields?: Array<{
      name: string
      type: 'text' | 'number' | 'select' | 'checkbox'
      required: boolean
      options?: string[]
    }>
  }
  embedCode?: string
  apiKey?: string
}

const widgetTypes = [
  {
    value: 'itinerary_builder',
    label: 'AI Itinerary Builder',
    description: 'Let travelers plan their perfect trip with AI assistance',
    icon: Sparkles,
    features: ['natural_language_input', 'voice_input', 'ai_suggestions', 'multi_language']
  },
  {
    value: 'tour_showcase',
    label: 'Tour Showcase',
    description: 'Display and promote your tours with smart filtering',
    icon: Globe,
    features: ['tour_recommendations', 'instant_booking', 'analytics']
  },
  {
    value: 'lead_capture',
    label: 'Lead Capture',
    description: 'Capture and qualify leads with AI insights',
    icon: Shield,
    features: ['lead_capture', 'custom_branding', 'chat_support']
  },
  {
    value: 'booking_calendar',
    label: 'Booking Calendar',
    description: 'Allow direct bookings with availability management',
    icon: Settings,
    features: ['instant_booking', 'analytics', 'multi_language']
  }
]

const allFeatures = [
  { value: 'natural_language_input', label: 'Natural Language Input', description: 'Let users describe their trip in their own words' },
  { value: 'voice_input', label: 'Voice Input', description: 'Enable voice commands for hands-free planning' },
  { value: 'ai_suggestions', label: 'AI Suggestions', description: 'Smart recommendations based on preferences' },
  { value: 'tour_recommendations', label: 'Tour Recommendations', description: 'Suggest relevant tours automatically' },
  { value: 'instant_booking', label: 'Instant Booking', description: 'Allow immediate tour reservations' },
  { value: 'lead_capture', label: 'Lead Capture', description: 'Collect traveler information' },
  { value: 'multi_language', label: 'Multi-language Support', description: 'Support multiple languages' },
  { value: 'custom_branding', label: 'Custom Branding', description: 'Match your brand identity' },
  { value: 'analytics', label: 'Analytics Tracking', description: 'Track widget performance' },
  { value: 'chat_support', label: 'Chat Support', description: 'Built-in customer support chat' }
]

const fontOptions = [
  { value: 'Inter', label: 'Inter (Modern)' },
  { value: 'system-ui', label: 'System Default' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Playfair Display', label: 'Playfair Display (Elegant)' },
  { value: 'Georgia', label: 'Georgia (Classic)' }
]

interface WidgetBuilderProps {
  widgetId?: string
  onSave?: (widget: WidgetConfig) => void
}

export default function WidgetBuilder({ widgetId, onSave }: WidgetBuilderProps) {
  const [config, setConfig] = useState<WidgetConfig>({
    name: 'My Travel Widget',
    type: 'itinerary_builder',
    theme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      fontFamily: 'Inter',
      borderRadius: 'md',
      buttonStyle: 'solid',
      logoPosition: 'left'
    },
    features: ['natural_language_input', 'ai_suggestions', 'lead_capture'],
    domains: [],
    settings: {
      language: 'en',
      currency: 'USD',
      maxTravelers: 10,
      dateRangeLimit: 365,
      requireEmail: true,
      requirePhone: false
    }
  })

  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [domainInput, setDomainInput] = useState('')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  useEffect(() => {
    if (widgetId) {
      fetchWidget()
    }
  }, [widgetId])

  const fetchWidget = async () => {
    try {
      const response = await fetch(`/api/widgets/${widgetId}`)
      if (response.ok) {
        const data = await response.json()
        setConfig(data.widget)
      }
    } catch (error) {
      console.error('Error fetching widget:', error)
      toast.error('Failed to load widget configuration')
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const url = widgetId ? `/api/widgets/${widgetId}` : '/api/widgets'
      const method = widgetId ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        const data = await response.json()
        setConfig({ ...config, ...data.widget, embedCode: data.embedCode })
        toast.success(widgetId ? 'Widget updated successfully' : 'Widget created successfully')
        onSave?.(data.widget)
      } else {
        throw new Error('Failed to save widget')
      }
    } catch (error) {
      console.error('Error saving widget:', error)
      toast.error('Failed to save widget configuration')
    } finally {
      setLoading(false)
    }
  }

  const copyEmbedCode = () => {
    if (config.embedCode) {
      navigator.clipboard.writeText(config.embedCode)
      setCopied(true)
      toast.success('Embed code copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const addDomain = () => {
    if (domainInput && !config.domains.includes(domainInput)) {
      setConfig({ ...config, domains: [...config.domains, domainInput] })
      setDomainInput('')
    }
  }

  const removeDomain = (domain: string) => {
    setConfig({ ...config, domains: config.domains.filter(d => d !== domain) })
  }

  const updateTheme = (key: string, value: any) => {
    setConfig({ ...config, theme: { ...config.theme, [key]: value } })
  }

  const toggleFeature = (feature: string) => {
    const features = config.features.includes(feature)
      ? config.features.filter(f => f !== feature)
      : [...config.features, feature]
    setConfig({ ...config, features })
  }

  const selectedType = widgetTypes.find(t => t.value === config.type)
  const TypeIcon = selectedType?.icon || Sparkles

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Widget Configuration</CardTitle>
            <CardDescription>Customize your travel widget's appearance and behavior</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basics" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="basics" className="space-y-4">
                <div>
                  <Label htmlFor="name">Widget Name</Label>
                  <Input
                    id="name"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    placeholder="My Travel Widget"
                  />
                </div>

                <div>
                  <Label>Widget Type</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {widgetTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <div
                          key={type.value}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            config.type === type.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setConfig({ ...config, type: type.value as any })}
                        >
                          <Icon className="w-5 h-5 mb-2 text-primary" />
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <Label htmlFor="language">Default Language</Label>
                  <Select
                    value={config.settings?.language || 'en'}
                    onValueChange={(value) => setConfig({
                      ...config,
                      settings: { ...config.settings, language: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select
                    value={config.settings?.currency || 'USD'}
                    onValueChange={(value) => setConfig({
                      ...config,
                      settings: { ...config.settings, currency: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="CHF">CHF (Fr)</SelectItem>
                      <SelectItem value="CNY">CNY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="design" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary">Primary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="primary"
                        type="color"
                        value={config.theme.primaryColor}
                        onChange={(e) => updateTheme('primaryColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={config.theme.primaryColor}
                        onChange={(e) => updateTheme('primaryColor', e.target.value)}
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondary">Secondary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="secondary"
                        type="color"
                        value={config.theme.secondaryColor}
                        onChange={(e) => updateTheme('secondaryColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={config.theme.secondaryColor}
                        onChange={(e) => updateTheme('secondaryColor', e.target.value)}
                        placeholder="#1E40AF"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="font">Font Family</Label>
                  <Select
                    value={config.theme.fontFamily}
                    onValueChange={(value) => updateTheme('fontFamily', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map(font => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Border Radius</Label>
                  <div className="flex gap-2 mt-2">
                    {(['none', 'sm', 'md', 'lg', 'full'] as const).map(radius => (
                      <Button
                        key={radius}
                        variant={config.theme.borderRadius === radius ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateTheme('borderRadius', radius)}
                      >
                        {radius}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Button Style</Label>
                  <div className="flex gap-2 mt-2">
                    {(['solid', 'outline', 'ghost'] as const).map(style => (
                      <Button
                        key={style}
                        variant={config.theme.buttonStyle === style ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateTheme('buttonStyle', style)}
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="logo">Logo URL (optional)</Label>
                  <Input
                    id="logo"
                    type="url"
                    value={config.theme.logoUrl || ''}
                    onChange={(e) => updateTheme('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <Label htmlFor="css">Custom CSS (optional)</Label>
                  <Textarea
                    id="css"
                    value={config.theme.customCSS || ''}
                    onChange={(e) => updateTheme('customCSS', e.target.value)}
                    placeholder=".widget-container { /* your styles */ }"
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <div className="space-y-3">
                  {allFeatures.map(feature => (
                    <div key={feature.value} className="flex items-start space-x-3">
                      <Switch
                        id={feature.value}
                        checked={config.features.includes(feature.value)}
                        onCheckedChange={() => toggleFeature(feature.value)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={feature.value} className="font-medium cursor-pointer">
                          {feature.label}
                        </Label>
                        <div className="text-sm text-muted-foreground">{feature.description}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <Label>Lead Capture Settings</Label>
                    <Badge variant="secondary">
                      {config.features.includes('lead_capture') ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  {config.features.includes('lead_capture') && (
                    <div className="space-y-3 pl-4">
                      <div className="flex items-center space-x-3">
                        <Switch
                          id="requireEmail"
                          checked={config.settings?.requireEmail ?? true}
                          onCheckedChange={(checked) => setConfig({
                            ...config,
                            settings: { ...config.settings, requireEmail: checked }
                          })}
                        />
                        <Label htmlFor="requireEmail">Require Email</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Switch
                          id="requirePhone"
                          checked={config.settings?.requirePhone ?? false}
                          onCheckedChange={(checked) => setConfig({
                            ...config,
                            settings: { ...config.settings, requirePhone: checked }
                          })}
                        />
                        <Label htmlFor="requirePhone">Require Phone</Label>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <div>
                  <Label>Allowed Domains</Label>
                  <div className="text-sm text-muted-foreground mb-2">
                    Restrict widget usage to specific domains (leave empty to allow all)
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      placeholder="example.com"
                      onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                    />
                    <Button onClick={addDomain} size="sm">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {config.domains.map(domain => (
                      <Badge key={domain} variant="secondary" className="gap-1">
                        {domain}
                        <button
                          onClick={() => removeDomain(domain)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Rate Limiting</Label>
                  <div className="text-sm text-muted-foreground mb-2">
                    Maximum requests per hour: {config.settings?.maxRequests || 1000}
                  </div>
                  <Slider
                    value={[config.settings?.maxRequests || 1000]}
                    onValueChange={(value) => setConfig({
                      ...config,
                      settings: { ...config.settings, maxRequests: value[0] }
                    })}
                    max={10000}
                    min={100}
                    step={100}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? 'Saving...' : (widgetId ? 'Update Widget' : 'Create Widget')}
          </Button>
          {config.embedCode && (
            <Button variant="outline" onClick={copyEmbedCode}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Live Preview
            </CardTitle>
            <CardDescription>See how your widget will look on different devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
              >
                Desktop
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
              >
                Mobile
              </Button>
            </div>

            <div className={`bg-gray-100 rounded-lg p-4 ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
              <div
                className="bg-white rounded-lg shadow-lg overflow-hidden"
                style={{
                  fontFamily: config.theme.fontFamily,
                  borderRadius: {
                    none: '0',
                    sm: '0.125rem',
                    md: '0.375rem',
                    lg: '0.5rem',
                    full: '9999px'
                  }[config.theme.borderRadius],
                }}
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <TypeIcon className="w-8 h-8" style={{ color: config.theme.primaryColor }} />
                    <h3 className="text-xl font-semibold">{selectedType?.label}</h3>
                  </div>

                  {config.type === 'itinerary_builder' && (
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Tell us about your dream trip...</p>
                        <div className="flex gap-2">
                          <input
                            className="flex-1 px-3 py-2 border rounded"
                            placeholder="e.g., 'Family vacation to Paris for 5 days'"
                            style={{ borderColor: config.theme.primaryColor + '40' }}
                          />
                          {config.features.includes('voice_input') && (
                            <button className="p-2 rounded" style={{ backgroundColor: config.theme.primaryColor + '20' }}>
                              🎤
                            </button>
                          )}
                        </div>
                      </div>
                      <button
                        className="w-full py-3 rounded font-medium text-white"
                        style={{
                          backgroundColor: config.theme.buttonStyle === 'solid' ? config.theme.primaryColor : 'transparent',
                          color: config.theme.buttonStyle === 'solid' ? 'white' : config.theme.primaryColor,
                          border: config.theme.buttonStyle !== 'ghost' ? `2px solid ${config.theme.primaryColor}` : 'none'
                        }}
                      >
                        Generate Itinerary
                      </button>
                    </div>
                  )}

                  {config.type === 'tour_showcase' && (
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="border rounded-lg p-3">
                          <div className="h-24 bg-gray-200 rounded mb-2"></div>
                          <div className="text-sm font-medium">Tour {i}</div>
                          <div className="text-xs text-gray-500">From $99</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {config.type === 'lead_capture' && (
                    <form className="space-y-3">
                      <input className="w-full px-3 py-2 border rounded" placeholder="Your Name" />
                      {config.settings?.requireEmail && (
                        <input className="w-full px-3 py-2 border rounded" placeholder="Email Address" />
                      )}
                      {config.settings?.requirePhone && (
                        <input className="w-full px-3 py-2 border rounded" placeholder="Phone Number" />
                      )}
                      <textarea className="w-full px-3 py-2 border rounded" rows={3} placeholder="Tell us about your travel plans..." />
                      <button
                        className="w-full py-2 rounded font-medium"
                        style={{
                          backgroundColor: config.theme.primaryColor,
                          color: 'white'
                        }}
                      >
                        Get Personalized Recommendations
                      </button>
                    </form>
                  )}

                  {config.type === 'booking_calendar' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-7 gap-1 text-xs text-center">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                          <div key={i} className="p-2 font-medium">{day}</div>
                        ))}
                        {Array.from({ length: 30 }, (_, i) => (
                          <div
                            key={i}
                            className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                            style={{ borderColor: config.theme.primaryColor + '40' }}
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {config.features.includes('custom_branding') && config.theme.logoUrl && (
                    <div className="mt-4 pt-4 border-t">
                      <img src={config.theme.logoUrl} alt="Logo" className="h-8 mx-auto" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {config.embedCode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Embed Code
              </CardTitle>
              <CardDescription>Copy this code to add the widget to your website</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{config.embedCode}</code>
                </pre>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={copyEmbedCode}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}