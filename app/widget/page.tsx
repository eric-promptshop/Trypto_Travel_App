'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Globe, Shield, Calendar, Mic, Send } from 'lucide-react'

interface WidgetConfig {
  type: string
  theme: any
  features: string[]
  settings: any
  operator: {
    name: string
    logo?: string
    verified: boolean
  }
}

export default function WidgetPage() {
  const searchParams = useSearchParams()
  const [config, setConfig] = useState<WidgetConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parentOrigin, setParentOrigin] = useState<string>('')

  useEffect(() => {
    const apiKey = searchParams.get('apiKey')
    const type = searchParams.get('type')
    const origin = searchParams.get('origin')

    if (!apiKey) {
      setError('No API key provided')
      setLoading(false)
      return
    }

    setParentOrigin(origin || '*')
    verifyWidget(apiKey)

    // Listen for configuration updates from parent
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [searchParams])

  const verifyWidget = async (apiKey: string) => {
    try {
      const response = await fetch('/api/widgets/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Widget-API-Key': apiKey
        },
        body: JSON.stringify({
          domain: new URL(parentOrigin !== '*' ? parentOrigin : window.location.origin).hostname
        })
      })

      if (!response.ok) {
        throw new Error('Widget verification failed')
      }

      const data = await response.json()
      setConfig(data.widget)
      
      // Notify parent that widget is ready
      sendMessage('WIDGET_READY', {})
    } catch (err) {
      console.error('Widget error:', err)
      setError('Failed to load widget')
    } finally {
      setLoading(false)
    }
  }

  const handleMessage = (event: MessageEvent) => {
    // Verify origin if not wildcard
    if (parentOrigin !== '*' && event.origin !== parentOrigin) return

    const { type, ...data } = event.data

    switch (type) {
      case 'WIDGET_CONFIG':
        if (data.config) {
          setConfig(prev => prev ? { ...prev, ...data.config } : null)
        }
        break
      case 'UPDATE_THEME':
        if (data.theme && config) {
          setConfig({ ...config, theme: { ...config.theme, ...data.theme } })
        }
        break
      case 'SET_LANGUAGE':
        if (data.language && config) {
          setConfig({
            ...config,
            settings: { ...config.settings, language: data.language }
          })
        }
        break
      case 'RESET_WIDGET':
        // Reset widget state
        break
    }
  }

  const sendMessage = (type: string, data: any) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type, ...data }, parentOrigin)
    }
  }

  const trackEvent = (eventName: string, eventData?: any) => {
    sendMessage('WIDGET_EVENT', { eventName, eventData })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !config) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-destructive">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-2" />
          <p>{error || 'Widget configuration error'}</p>
        </div>
      </div>
    )
  }

  const renderWidget = () => {
    switch (config.type) {
      case 'itinerary_builder':
        return <ItineraryBuilderWidget config={config} onEvent={trackEvent} sendMessage={sendMessage} />
      case 'tour_showcase':
        return <TourShowcaseWidget config={config} onEvent={trackEvent} />
      case 'lead_capture':
        return <LeadCaptureWidget config={config} onEvent={trackEvent} sendMessage={sendMessage} />
      case 'booking_calendar':
        return <BookingCalendarWidget config={config} onEvent={trackEvent} />
      default:
        return <div>Unknown widget type</div>
    }
  }

  return (
    <div 
      className="min-h-[400px] p-4"
      style={{
        fontFamily: config.theme.fontFamily,
        '--primary': config.theme.primaryColor,
        '--secondary': config.theme.secondaryColor,
      } as any}
    >
      <style jsx global>{`
        .widget-primary {
          background-color: var(--primary);
          color: white;
        }
        .widget-secondary {
          background-color: var(--secondary);
          color: white;
        }
        .widget-border {
          border-color: var(--primary);
        }
        ${config.theme.customCSS || ''}
      `}</style>
      
      {renderWidget()}
    </div>
  )
}

// Widget Components
function ItineraryBuilderWidget({ config, onEvent, sendMessage }: any) {
  const [query, setQuery] = useState('')
  const [isRecording, setIsRecording] = useState(false)

  const handleSubmit = () => {
    if (!query.trim()) return
    
    onEvent('itinerary_query_submitted', { query })
    sendMessage('ITINERARY_GENERATED', { query })
    
    // In production, this would call the AI API
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Plan Your Perfect Trip</h2>
            <p className="text-muted-foreground">Tell us about your dream vacation</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'I want to explore ancient ruins in Greece for 7 days with my family'"
              className="min-h-[100px] pr-12"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) {
                  handleSubmit()
                }
              }}
            />
            {config.features.includes('voice_input') && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute bottom-2 right-2"
                onClick={() => {
                  setIsRecording(!isRecording)
                  onEvent('voice_input_toggled', { recording: !isRecording })
                }}
              >
                <Mic className={`w-4 h-4 ${isRecording ? 'text-red-500' : ''}`} />
              </Button>
            )}
          </div>

          <Button 
            onClick={handleSubmit}
            className="w-full widget-primary"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate My Itinerary
          </Button>

          {config.features.includes('ai_suggestions') && (
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-2">Popular destinations:</p>
              <div className="flex flex-wrap gap-2">
                {['Paris', 'Tokyo', 'Bali', 'New York', 'Rome'].map(dest => (
                  <Button
                    key={dest}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery(`Plan a trip to ${dest}`)
                      onEvent('suggestion_clicked', { destination: dest })
                    }}
                  >
                    {dest}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {config.operator.logo && (
          <div className="mt-6 pt-6 border-t text-center">
            <img 
              src={config.operator.logo} 
              alt={config.operator.name}
              className="h-8 mx-auto"
            />
          </div>
        )}
      </div>
    </Card>
  )
}

function TourShowcaseWidget({ config, onEvent }: any) {
  const tours = [
    { id: 1, name: 'City Explorer Tour', price: 89, image: '/api/placeholder/200/150' },
    { id: 2, name: 'Food & Wine Experience', price: 120, image: '/api/placeholder/200/150' },
    { id: 3, name: 'Historical Walking Tour', price: 65, image: '/api/placeholder/200/150' },
    { id: 4, name: 'Sunset Cruise', price: 150, image: '/api/placeholder/200/150' }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <Globe className="w-10 h-10 mx-auto mb-3 text-primary" />
        <h2 className="text-3xl font-bold mb-2">Explore Our Tours</h2>
        <p className="text-muted-foreground">Discover unforgettable experiences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tours.map(tour => (
          <Card key={tour.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
            <img src={tour.image} alt={tour.name} className="w-full h-32 object-cover" />
            <div className="p-4">
              <h3 className="font-semibold mb-1">{tour.name}</h3>
              <p className="text-lg font-bold widget-primary">From ${tour.price}</p>
              <Button 
                className="w-full mt-3 widget-primary"
                size="sm"
                onClick={() => onEvent('tour_clicked', { tourId: tour.id, tourName: tour.name })}
              >
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function LeadCaptureWidget({ config, onEvent, sendMessage }: any) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onEvent('lead_form_submitted', formData)
    sendMessage('LEAD_CAPTURED', formData)
    
    // Reset form
    setFormData({ name: '', email: '', phone: '', message: '' })
  }

  return (
    <Card className="max-w-md mx-auto">
      <div className="p-6">
        <div className="text-center mb-6">
          <Send className="w-10 h-10 mx-auto mb-3 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Get Personalized Recommendations</h2>
          <p className="text-muted-foreground">Tell us about your travel dreams</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Your Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {config.settings?.requireEmail !== false && (
            <div>
              <Input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required={config.settings?.requireEmail}
              />
            </div>
          )}

          {config.settings?.requirePhone && (
            <div>
              <Input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          )}

          <div>
            <Textarea
              placeholder="Tell us about your ideal vacation..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full widget-primary" size="lg">
            Get Recommendations
          </Button>
        </form>
      </div>
    </Card>
  )
}

function BookingCalendarWidget({ config, onEvent }: any) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="p-6">
        <div className="text-center mb-6">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Book Your Adventure</h2>
          <p className="text-muted-foreground">Select your preferred dates</p>
        </div>

        <div className="bg-muted/20 rounded-lg p-6">
          <p className="text-center text-muted-foreground">
            Calendar component would be implemented here
          </p>
        </div>

        <Button 
          className="w-full mt-6 widget-primary" 
          size="lg"
          disabled={!selectedDate}
        >
          Check Availability
        </Button>
      </div>
    </Card>
  )
}