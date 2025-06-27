'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Cloud,
  Database,
  Mail,
  Calendar,
  CreditCard,
  BarChart3,
  Webhook,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  ArrowRightLeft,
  Zap,
  Link2,
  Unlink,
  Play,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Integration {
  id: string
  name: string
  type: string
  provider: string
  status: 'connected' | 'disconnected' | 'error'
  isActive: boolean
  lastSync: string | null
  metrics?: {
    totalSynced: number
    lastSyncDuration: number
    errorRate: number
  }
}

const integrationProviders = [
  {
    category: 'CRM',
    providers: [
      { id: 'salesforce', name: 'Salesforce', icon: Cloud, color: 'bg-blue-500' },
      { id: 'hubspot', name: 'HubSpot', icon: Database, color: 'bg-orange-500' },
      { id: 'pipedrive', name: 'Pipedrive', icon: Database, color: 'bg-green-500' }
    ]
  },
  {
    category: 'Communication',
    providers: [
      { id: 'mailchimp', name: 'Mailchimp', icon: Mail, color: 'bg-yellow-500' },
      { id: 'sendgrid', name: 'SendGrid', icon: Mail, color: 'bg-blue-600' },
      { id: 'twilio', name: 'Twilio', icon: Mail, color: 'bg-red-500' }
    ]
  },
  {
    category: 'Calendar',
    providers: [
      { id: 'google', name: 'Google Calendar', icon: Calendar, color: 'bg-blue-500' },
      { id: 'outlook', name: 'Outlook Calendar', icon: Calendar, color: 'bg-blue-700' },
      { id: 'calendly', name: 'Calendly', icon: Calendar, color: 'bg-indigo-500' }
    ]
  },
  {
    category: 'Payment',
    providers: [
      { id: 'stripe', name: 'Stripe', icon: CreditCard, color: 'bg-purple-600' },
      { id: 'paypal', name: 'PayPal', icon: CreditCard, color: 'bg-blue-600' },
      { id: 'square', name: 'Square', icon: CreditCard, color: 'bg-gray-800' }
    ]
  },
  {
    category: 'Analytics',
    providers: [
      { id: 'google_analytics', name: 'Google Analytics', icon: BarChart3, color: 'bg-orange-500' },
      { id: 'mixpanel', name: 'Mixpanel', icon: BarChart3, color: 'bg-purple-500' },
      { id: 'segment', name: 'Segment', icon: BarChart3, color: 'bg-green-600' }
    ]
  },
  {
    category: 'Custom',
    providers: [
      { id: 'webhook', name: 'Webhook', icon: Webhook, color: 'bg-gray-600' },
      { id: 'api', name: 'Custom API', icon: Zap, color: 'bg-indigo-600' }
    ]
  }
]

export default function IntegrationHub() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('connected')

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations)
      }
    } catch (error) {
      console.error('Error fetching integrations:', error)
      toast.error('Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: 'bidirectional' })
      })

      if (response.ok) {
        toast.success('Sync started successfully')
        fetchIntegrations()
      }
    } catch (error) {
      console.error('Error syncing integration:', error)
      toast.error('Failed to start sync')
    }
  }

  const handleToggle = async (integrationId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        toast.success(`Integration ${isActive ? 'activated' : 'deactivated'}`)
        fetchIntegrations()
      }
    } catch (error) {
      console.error('Error toggling integration:', error)
      toast.error('Failed to update integration')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const connectedIntegrations = integrations.filter(i => i.status === 'connected')
  const availableIntegrations = integrationProviders.flatMap(cat => 
    cat.providers.filter(p => !integrations.some(i => i.provider === p.id))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Integration Hub</h2>
          <p className="text-muted-foreground">Connect your favorite tools and automate workflows</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Integration</DialogTitle>
              <DialogDescription>Choose a service to connect</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {integrationProviders.map(category => (
                <div key={category.category}>
                  <h3 className="font-semibold mb-3">{category.category}</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {category.providers
                      .filter(p => !integrations.some(i => i.provider === p.id))
                      .map(provider => {
                        const Icon = provider.icon
                        return (
                          <div
                            key={provider.id}
                            className="p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors"
                            onClick={() => {
                              setSelectedProvider(provider)
                              setShowAddDialog(false)
                              // Open configuration dialog
                            }}
                          >
                            <div className={`w-10 h-10 ${provider.color} rounded flex items-center justify-center mb-2`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="font-medium text-sm">{provider.name}</div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Integrations</p>
                <p className="text-3xl font-bold">{connectedIntegrations.length}</p>
              </div>
              <Link2 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Data Synced Today</p>
                <p className="text-3xl font-bold">
                  {integrations.reduce((sum, i) => sum + (i.metrics?.totalSynced || 0), 0).toLocaleString()}
                </p>
              </div>
              <ArrowRightLeft className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-3xl font-bold">
                  {integrations.length > 0 
                    ? (100 - (integrations.reduce((sum, i) => sum + (i.metrics?.errorRate || 0), 0) / integrations.length)).toFixed(1)
                    : 100}%
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="connected">Connected ({connectedIntegrations.length})</TabsTrigger>
          <TabsTrigger value="available">Available ({availableIntegrations.length})</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="connected" className="space-y-4">
          {connectedIntegrations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Unlink className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No integrations connected</h3>
                <p className="text-muted-foreground mb-4">Connect your first integration to start automating</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Integration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {connectedIntegrations.map(integration => {
                const provider = integrationProviders
                  .flatMap(cat => cat.providers)
                  .find(p => p.id === integration.provider)
                const Icon = provider?.icon || Zap
                
                return (
                  <Card key={integration.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 ${provider?.color || 'bg-gray-500'} rounded flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {integration.name}
                              {getStatusIcon(integration.status)}
                            </CardTitle>
                            <CardDescription>
                              {integration.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={integration.isActive}
                          onCheckedChange={(checked) => handleToggle(integration.id, checked)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Last Sync</p>
                          <p className="text-sm flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {integration.lastSync 
                              ? new Date(integration.lastSync).toLocaleString()
                              : 'Never'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Records Synced</p>
                          <p className="text-sm font-medium">{integration.metrics?.totalSynced || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Error Rate</p>
                          <p className="text-sm font-medium">{integration.metrics?.errorRate || 0}%</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(integration.id)}
                          disabled={!integration.isActive}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync Now
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Logs
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {availableIntegrations.map(provider => {
              const Icon = provider.icon
              return (
                <Card 
                  key={provider.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedProvider(provider)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 ${provider.color} rounded flex items-center justify-center mx-auto mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-medium">{provider.name}</h4>
                    <Button variant="ghost" size="sm" className="mt-2">
                      <Plus className="w-4 h-4 mr-1" />
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>Set up custom webhooks to receive real-time updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Webhook URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    value="https://app.tripnav.ai/api/webhooks/abc123"
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Send POST requests to this URL to trigger custom actions
                </p>
              </div>

              <div>
                <Label>Events</Label>
                <div className="space-y-2 mt-2">
                  {['Lead Created', 'Booking Confirmed', 'Tour Updated', 'Review Received'].map(event => (
                    <div key={event} className="flex items-center space-x-2">
                      <Switch id={event} />
                      <Label htmlFor={event} className="font-normal cursor-pointer">
                        {event}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Secret Key</Label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    type="password"
                    value="whsec_1234567890abcdef"
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="sm">Regenerate</Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Use this key to verify webhook signatures
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}