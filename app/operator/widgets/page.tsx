'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import WidgetBuilder from '@/components/widget-builder/WidgetBuilder'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Code, 
  Eye, 
  Settings, 
  BarChart3, 
  Copy, 
  ExternalLink,
  MoreVertical,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Widget {
  id: string
  name: string
  type: string
  apiKey: string
  isActive: boolean
  domains: string[]
  createdAt: string
  analytics?: {
    totalViews: number
    uniqueVisitors: number
    conversions: number
    conversionRate: number
  }
}

export default function WidgetsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list')
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || !['TOUR_OPERATOR', 'ADMIN'].includes(session.user?.role || '')) {
      router.push('/auth/signin')
      return
    }

    fetchWidgets()
  }, [session, status, router])

  const fetchWidgets = async () => {
    try {
      const response = await fetch('/api/widgets')
      if (response.ok) {
        const data = await response.json()
        setWidgets(data.widgets)
      }
    } catch (error) {
      console.error('Error fetching widgets:', error)
      toast.error('Failed to load widgets')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWidget = () => {
    setSelectedWidget(null)
    setActiveTab('builder')
  }

  const handleEditWidget = (widgetId: string) => {
    setSelectedWidget(widgetId)
    setActiveTab('builder')
  }

  const handleToggleWidget = async (widgetId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/widgets/${widgetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        toast.success(`Widget ${isActive ? 'activated' : 'deactivated'}`)
        fetchWidgets()
      }
    } catch (error) {
      console.error('Error toggling widget:', error)
      toast.error('Failed to update widget status')
    }
  }

  const handleDeleteWidget = async (widgetId: string) => {
    if (!confirm('Are you sure you want to delete this widget?')) return

    try {
      const response = await fetch(`/api/widgets/${widgetId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Widget deleted successfully')
        fetchWidgets()
      }
    } catch (error) {
      console.error('Error deleting widget:', error)
      toast.error('Failed to delete widget')
    }
  }

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey)
    toast.success('API key copied to clipboard')
  }

  const getWidgetTypeIcon = (type: string) => {
    switch (type) {
      case 'itinerary_builder': return '✨'
      case 'tour_showcase': return '🌍'
      case 'lead_capture': return '📧'
      case 'booking_calendar': return '📅'
      default: return '🔧'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Widget Manager</h1>
        <p className="text-muted-foreground">Create and manage embeddable widgets for your website</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="list">My Widgets</TabsTrigger>
            <TabsTrigger value="builder">Widget Builder</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          {activeTab === 'list' && (
            <Button onClick={handleCreateWidget}>
              <Plus className="w-4 h-4 mr-2" />
              Create Widget
            </Button>
          )}
        </div>

        <TabsContent value="list" className="space-y-4">
          {widgets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Code className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No widgets yet</h3>
                <p className="text-muted-foreground mb-4">Create your first widget to start capturing leads and bookings</p>
                <Button onClick={handleCreateWidget}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Widget
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {widgets.map(widget => (
                <Card key={widget.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{getWidgetTypeIcon(widget.type)}</div>
                        <div>
                          <CardTitle className="text-xl">{widget.name}</CardTitle>
                          <CardDescription>
                            {widget.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={widget.isActive ? 'default' : 'secondary'}>
                          {widget.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditWidget(widget.id)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Widget
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleWidget(widget.id, !widget.isActive)}>
                              {widget.isActive ? (
                                <>
                                  <ToggleLeft className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteWidget(widget.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">API Key</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {widget.apiKey.substring(0, 20)}...
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyApiKey(widget.apiKey)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Allowed Domains</p>
                        <p className="text-sm">
                          {widget.domains.length > 0 ? widget.domains.join(', ') : 'All domains'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Created</p>
                        <p className="text-sm">
                          {new Date(widget.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {widget.analytics && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">Views</p>
                          <p className="text-2xl font-semibold">{widget.analytics.totalViews.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Visitors</p>
                          <p className="text-2xl font-semibold">{widget.analytics.uniqueVisitors.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Conversions</p>
                          <p className="text-2xl font-semibold">{widget.analytics.conversions}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Conversion Rate</p>
                          <p className="text-2xl font-semibold">{widget.analytics.conversionRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => handleEditWidget(widget.id)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="builder">
          <WidgetBuilder 
            widgetId={selectedWidget || undefined}
            onSave={() => {
              setActiveTab('list')
              fetchWidgets()
            }}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Widget Analytics</CardTitle>
              <CardDescription>Track performance across all your widgets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Detailed analytics coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}