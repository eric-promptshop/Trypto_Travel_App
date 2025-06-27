'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Clock, ExternalLink, Globe, Rocket, Settings } from 'lucide-react'

interface DeploymentConfig {
  tenantId: string
  deploymentType: 'subdomain' | 'custom-domain' | 'path-based'
  domain?: string
  subdomain?: string
  environment: 'staging' | 'production'
  features: string[]
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
    backgroundColor?: string
    brandName?: string
  }
}

interface Deployment {
  id: string
  tenant: string
  type: string
  url: string
  status: string
  features: string[]
  environment: string
}

interface Tenant {
  id: string
  name: string
  slug: string
  domain: string
  isActive: boolean
}

const AVAILABLE_FEATURES = [
  'custom-branding',
  'advanced-analytics',
  'api-access',
  'priority-support',
  'white-label',
  'custom-domain',
  'sso',
  'advanced-integrations',
  'multi-language',
  'advanced-reporting'
]

export default function DeploymentManager() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  
  // Deployment form state
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>({
    tenantId: '',
    deploymentType: 'path-based',
    environment: 'staging',
    features: []
  })

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      const response = await fetch('/api/admin/clients')
      if (response.ok) {
        const data = await response.json()
        setTenants(data.clients || [])
      }
    } catch (error) {
      console.error('Error loading tenants:', error)
    }
  }

  const loadDeploymentStatus = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/admin/deploy?tenantId=${tenantId}`)
      if (response.ok) {
        const data = await response.json()
        // Handle deployment status data
      }
    } catch (error) {
      console.error('Error loading deployment status:', error)
    }
  }

  const handleDeploy = async () => {
    if (!deploymentConfig.tenantId) {
      alert('Please select a tenant')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deploymentConfig)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Add to deployments list
        setDeployments(prev => [...prev, result.deployment])
        
        // Reset form
        setDeploymentConfig({
          tenantId: '',
          deploymentType: 'path-based',
          environment: 'staging',
          features: []
        })
        
        alert(`Deployment successful! URL: ${result.deployment.url}`)
      } else {
        const error = await response.json()
        alert(`Deployment failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Deployment error:', error)
      alert('Deployment failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeatureToggle = (feature: string) => {
    setDeploymentConfig(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'deploying':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getDeploymentTypeDescription = (type: string) => {
    switch (type) {
      case 'subdomain':
        return 'Deploy to a subdomain (e.g., client.yourdomain.com)'
      case 'custom-domain':
        return 'Deploy to a custom domain (e.g., client.com)'
      case 'path-based':
        return 'Deploy to a path (e.g., yourdomain.com/client/name)'
      default:
        return 'Select deployment type'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">White-label Deployment Manager</h2>
        <Badge variant="outline" className="text-sm">
          <Rocket className="w-3 h-3 mr-1" />
          Multi-tenant Enabled
        </Badge>
      </div>

      <Tabs defaultValue="deploy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deploy">Deploy Instance</TabsTrigger>
          <TabsTrigger value="deployments">Active Deployments</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="deploy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Deploy White-label Instance
              </CardTitle>
              <CardDescription>
                Create a branded deployment for your client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tenant Selection */}
              <div className="space-y-2">
                <Label htmlFor="tenant">Select Client</Label>
                <Select
                  value={deploymentConfig.tenantId}
                  onValueChange={(value) => setDeploymentConfig(prev => ({ ...prev, tenantId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client to deploy for" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map(tenant => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Deployment Type */}
              <div className="space-y-2">
                <Label htmlFor="deploymentType">Deployment Type</Label>
                <Select
                  value={deploymentConfig.deploymentType}
                  onValueChange={(value: any) => setDeploymentConfig(prev => ({ ...prev, deploymentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="path-based">Path-based Deployment</SelectItem>
                    <SelectItem value="subdomain">Subdomain Deployment</SelectItem>
                    <SelectItem value="custom-domain">Custom Domain</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {getDeploymentTypeDescription(deploymentConfig.deploymentType)}
                </p>
              </div>

              {/* Domain/Subdomain Configuration */}
              {deploymentConfig.deploymentType === 'subdomain' && (
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input
                    id="subdomain"
                    placeholder="client-name"
                    value={deploymentConfig.subdomain || ''}
                    onChange={(e) => setDeploymentConfig(prev => ({ ...prev, subdomain: e.target.value }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Will be deployed to: {deploymentConfig.subdomain || 'client-name'}.yourdomain.com
                  </p>
                </div>
              )}

              {deploymentConfig.deploymentType === 'custom-domain' && (
                <div className="space-y-2">
                  <Label htmlFor="domain">Custom Domain</Label>
                  <Input
                    id="domain"
                    placeholder="client.com"
                    value={deploymentConfig.domain || ''}
                    onChange={(e) => setDeploymentConfig(prev => ({ ...prev, domain: e.target.value }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Ensure DNS is configured to point to your infrastructure
                  </p>
                </div>
              )}

              {/* Environment */}
              <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <Select
                  value={deploymentConfig.environment}
                  onValueChange={(value: any) => setDeploymentConfig(prev => ({ ...prev, environment: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label>Features</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_FEATURES.map(feature => (
                    <div key={feature} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={feature}
                        checked={deploymentConfig.features.includes(feature)}
                        onChange={() => handleFeatureToggle(feature)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={feature} className="text-sm font-normal">
                        {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleDeploy}
                disabled={isLoading || !deploymentConfig.tenantId}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Deploy Instance
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-4">
          <div className="grid gap-4">
            {deployments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Deployments Yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first white-label deployment to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              deployments.map((deployment) => (
                <Card key={deployment.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(deployment.status)}
                      <div>
                        <h3 className="font-semibold">{deployment.tenant}</h3>
                        <p className="text-sm text-muted-foreground">
                          {deployment.type} • {deployment.environment}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{deployment.status}</Badge>
                      <Button variant="outline" size="sm" asChild>
                        <a href={deployment.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Visit
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Deployment Configuration
              </CardTitle>
              <CardDescription>
                Global settings for white-label deployments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>🌐 <strong>Supported Deployment Types:</strong></p>
                <ul className="ml-4 mt-2 space-y-1">
                  <li>• Path-based: /client/[slug] routing</li>
                  <li>• Subdomain: [client].yourdomain.com</li>
                  <li>• Custom Domain: client.com</li>
                </ul>
                
                <p className="mt-4">🎨 <strong>Branding Features:</strong></p>
                <ul className="ml-4 mt-2 space-y-1">
                  <li>• Custom colors and themes</li>
                  <li>• Logo replacement</li>
                  <li>• White-label URLs</li>
                  <li>• Tenant-specific content</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 