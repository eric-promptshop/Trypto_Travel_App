'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Globe, 
  Settings, 
  FileText, 
  BarChart3, 
  Plus,
  Rocket
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClientManagement, type ClientProfile } from '@/components/admin/ClientManagement'
import DeploymentManager from '@/components/admin/DeploymentManager'

interface DashboardStats {
  totalClients: number
  activeClients: number
  totalLeads: number
  conversionRate: number
}

// Wrapper component for ClientManagement
function ClientManagementWrapper() {
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null)

  return (
    <ClientManagement
      clients={clients}
      onClientsChange={setClients}
      onClientSelect={setSelectedClient}
      selectedClient={selectedClient}
    />
  )
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    totalLeads: 0,
    conversionRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load dashboard statistics
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      
      // Fetch clients stats
      const clientsResponse = await fetch('/api/admin/clients')
      const clientsData = await clientsResponse.json()
      
      if (clientsResponse.ok) {
        const totalClients = clientsData.total || 0
        const activeClients = clientsData.clients?.filter((c: any) => c.isActive).length || 0
        
        setStats(prev => ({
          ...prev,
          totalClients,
          activeClients
        }))
      }
      
      // TODO: Add leads and conversion rate stats when those APIs are ready
      
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Admin Dashboard</h2>
          <Badge variant="outline" className="mt-2 text-xs">
            <Rocket className="w-3 h-3 mr-1" />
            Multi-tenant
          </Badge>
        </div>
        
        <nav className="mt-6">
          <div className="px-3">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'clients', label: 'Client Management', icon: Users },
              { id: 'deployments', label: 'Deployments', icon: Globe },
              { id: 'themes', label: 'Theme Customizer', icon: Settings },
              { id: 'content', label: 'Content Management', icon: FileText },
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-3 py-2 mt-1 text-sm rounded-md transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            {/* Overview Tab */}
            <TabsContent value="overview" className="h-full p-6 space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <Button onClick={() => setActiveTab('clients')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Client
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? '...' : stats.totalClients}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +2 from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Deployments</CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? '...' : stats.activeClients}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Path-based routing enabled
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? '...' : stats.totalLeads}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$12,450</div>
                    <p className="text-xs text-muted-foreground">
                      +20% from last month
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates from your clients and system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Rocket className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Adventure Tours Co deployed</p>
                          <p className="text-xs text-gray-500">Path-based deployment • 2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">New client "Luxury Escapes" created</p>
                          <p className="text-xs text-gray-500">Enterprise plan • 4 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Settings className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Theme updated for "Budget Backpackers"</p>
                          <p className="text-xs text-gray-500">Custom branding applied • 6 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Multi-tenant Features */}
                <Card>
                  <CardHeader>
                    <CardTitle>Multi-tenant Features</CardTitle>
                    <CardDescription>Available white-label capabilities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Custom Branding</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Path-based Routing</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tenant Isolation</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Theme System</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Subdomain Support</span>
                        <Badge variant="secondary">Available</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Custom Domains</span>
                        <Badge variant="secondary">Available</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Client Management Tab */}
            <TabsContent value="clients" className="h-full overflow-y-auto">
              <div className="p-6">
                <ClientManagementWrapper />
              </div>
            </TabsContent>

            {/* Deployments Tab */}
            <TabsContent value="deployments" className="h-full overflow-y-auto">
              <div className="p-6">
                <DeploymentManager />
              </div>
            </TabsContent>

            {/* Theme Customizer Tab */}
            <TabsContent value="themes" className="h-full overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Theme Customizer</h2>
                <p className="text-gray-600 mb-6">Customize themes for your clients.</p>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Available Themes</CardTitle>
                    <CardDescription>Pre-configured themes for different client types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card className="border-2 border-green-200">
                        <CardContent className="p-4">
                          <div className="w-full h-20 bg-gradient-to-r from-green-500 to-green-600 rounded mb-3"></div>
                          <h4 className="font-semibold">Adventure Theme</h4>
                          <p className="text-sm text-gray-600">Used by Adventure Tours Co</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-2 border-purple-200">
                        <CardContent className="p-4">
                          <div className="w-full h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded mb-3"></div>
                          <h4 className="font-semibold">Luxury Theme</h4>
                          <p className="text-sm text-gray-600">Used by Luxury Escapes</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-2 border-red-200">
                        <CardContent className="p-4">
                          <div className="w-full h-20 bg-gradient-to-r from-red-500 to-red-600 rounded mb-3"></div>
                          <h4 className="font-semibold">Budget Theme</h4>
                          <p className="text-sm text-gray-600">Used by Budget Backpackers</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Content Management Tab */}
            <TabsContent value="content" className="h-full overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Content Management</h2>
                <p className="text-gray-600 mb-6">Manage content across all client instances.</p>
                
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tenant-specific Content</CardTitle>
                      <CardDescription>Content isolated by tenant</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        <p>📄 <strong>Content Types:</strong></p>
                        <ul className="ml-4 mt-2 space-y-1">
                          <li>• Pages and Templates</li>
                          <li>• Theme Configurations</li>
                          <li>• Deployment Settings</li>
                          <li>• Custom Assets</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 