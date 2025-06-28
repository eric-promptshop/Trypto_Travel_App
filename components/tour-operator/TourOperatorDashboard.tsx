"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Users, 
  TrendingUp, 
  Calendar,
  Settings,
  Globe,
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  FileUp
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import TourUploadModal from './TourUploadModal'
import TourDetailModal from './TourDetailModal'
import TourUrlImportModal from './TourUrlImportModal'
import { TourAnalyticsDashboard } from '@/components/operator/TourAnalyticsDashboard'
import { LeadManagementTab } from '@/components/operator/LeadManagementTab'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTours } from '@/src/presentation/hooks/useTours'
import { useFeatureFlag } from '@/lib/feature-flags'

interface Tour {
  id: string
  name: string
  destination: string
  duration: string
  price: number
  currency: string
  status: 'active' | 'draft' | 'archived'
  views: number
  bookings: number
  nextDeparture?: string
}

interface DashboardStats {
  totalTours: number
  activeTours: number
  totalBookings: number
  totalRevenue: number
  monthlyViews: number
  conversionRate: number
}

export default function TourOperatorDashboard() {
  const { data: session } = useSession()
  const useNewTourService = useFeatureFlag('USE_NEW_TOUR_SERVICE')
  
  // New service architecture - use the useTours hook
  const {
    tours: newServiceTours,
    loading: newServiceLoading,
    error: newServiceError,
    stats: newServiceStats,
    fetchTours: fetchNewServiceTours,
    fetchStats: fetchNewServiceStats,
    archiveTour: archiveNewServiceTour
  } = useTours()
  
  // Legacy state for gradual migration
  const [legacyTours, setLegacyTours] = useState<Tour[]>([])
  const [legacyStats, setLegacyStats] = useState<DashboardStats>({
    totalTours: 0,
    activeTours: 0,
    totalBookings: 0,
    totalRevenue: 0,
    monthlyViews: 0,
    conversionRate: 0
  })
  const [legacyLoading, setLegacyLoading] = useState(true)
  
  // Shared state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft' | 'archived'>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showUrlImportModal, setShowUrlImportModal] = useState(false)
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null)
  const [tourModalMode, setTourModalMode] = useState<'view' | 'edit'>('view')
  const [tourToDelete, setTourToDelete] = useState<string | null>(null)
  
  // Use new or legacy data based on feature flag
  const tours = useNewTourService 
    ? newServiceTours.map(t => ({
        id: t.id,
        name: t.title,
        destination: t.destinations.join(', '),
        duration: `${t.duration} days`,
        price: t.price.amount,
        currency: t.price.currency,
        status: t.status.toLowerCase() as 'active' | 'draft' | 'archived',
        views: 0, // TODO: Add views tracking to new service
        bookings: 0, // TODO: Add bookings tracking to new service
        nextDeparture: undefined
      }))
    : legacyTours
    
  const stats = useNewTourService && newServiceStats
    ? {
        totalTours: newServiceStats.total,
        activeTours: newServiceStats.published,
        totalBookings: 0, // TODO: Add to new service
        totalRevenue: 0, // TODO: Add to new service
        monthlyViews: 0, // TODO: Add to new service
        conversionRate: 0 // TODO: Add to new service
      }
    : legacyStats
    
  const isLoading = useNewTourService ? newServiceLoading : legacyLoading

  useEffect(() => {
    if (useNewTourService) {
      // Use new service
      fetchNewServiceTours({ includeArchived: true })
      fetchNewServiceStats()
    } else {
      // Use legacy implementation
      fetchLegacyDashboardData()
    }
  }, [useNewTourService])
  
  // Show error if new service has errors
  useEffect(() => {
    if (useNewTourService && newServiceError) {
      toast.error(`Error loading tours: ${newServiceError}`)
    }
  }, [useNewTourService, newServiceError])

  const fetchLegacyDashboardData = async () => {
    try {
      setLegacyLoading(true)
      
      // Fetch tours
      const toursResponse = await fetch('/api/tour-operator/tours')
      
      if (toursResponse.ok) {
        const toursData = await toursResponse.json()
        setLegacyTours(toursData.tours || [])
      } else {
        const errorText = await toursResponse.text()
        console.error('[TourOperatorDashboard] Tours fetch error:', toursResponse.status, errorText)
      }

      // Fetch stats
      const statsResponse = await fetch('/api/tour-operator/stats')
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setLegacyStats(statsData.stats || legacyStats)
      } else {
        const errorText = await statsResponse.text()
        console.error('[TourOperatorDashboard] Stats fetch error:', statsResponse.status, errorText)
      }
    } catch (error) {
      console.error('[TourOperatorDashboard] Error fetching dashboard data:', error)
    } finally {
      setLegacyLoading(false)
    }
  }
  
  const fetchDashboardData = () => {
    if (useNewTourService) {
      fetchNewServiceTours({ includeArchived: true })
      fetchNewServiceStats()
    } else {
      fetchLegacyDashboardData()
    }
  }

  const filteredTours = tours.filter(tour => {
    const matchesSearch = tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tour.destination.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || tour.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewTour = (tour: Tour) => {
    setSelectedTour(tour)
    setTourModalMode('view')
  }

  const handleEditTour = (tour: Tour) => {
    setSelectedTour(tour)
    setTourModalMode('edit')
  }

  const handleDeleteTour = async (tourId: string) => {
    try {
      if (useNewTourService) {
        // Use new service - archive instead of delete
        await archiveNewServiceTour(tourId)
        toast.success('Tour archived successfully!')
      } else {
        // Legacy implementation
        const response = await fetch(`/api/tour-operator/tours/${tourId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Failed to delete tour')
        }
        
        toast.success('Tour deleted successfully!')
      }
      
      fetchDashboardData()
    } catch (error) {
      console.error('Error deleting tour:', error)
      toast.error(useNewTourService ? 'Failed to archive tour' : 'Failed to delete tour')
    } finally {
      setTourToDelete(null)
    }
  }

  const handleCreateFromUrl = () => {
    setShowUrlImportModal(true)
  }

  const handleCreateManually = () => {
    // TODO: Implement manual tour creation
    toast.info('Manual tour creation coming soon!')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tour Operator Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {session?.user?.name || 'Tour Operator'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tours</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTours}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeTours} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.monthlyViews} views this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tours" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tours">Tours</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="tours" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Your Tours</CardTitle>
                  <CardDescription>Manage your tour offerings</CardDescription>
                </div>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Tour
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Create Tour</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowUploadModal(true)}>
                        <FileUp className="h-4 w-4 mr-2" />
                        Upload from Document
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCreateFromUrl()}>
                        <Globe className="h-4 w-4 mr-2" />
                        Import from URL
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCreateManually()}>
                        <Edit className="h-4 w-4 mr-2" />
                        Create Manually
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tours..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterStatus === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('active')}
                  >
                    Active
                  </Button>
                  <Button
                    variant={filterStatus === 'draft' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('draft')}
                  >
                    Draft
                  </Button>
                  <Button
                    variant={filterStatus === 'archived' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('archived')}
                  >
                    Archived
                  </Button>
                </div>
              </div>

              {/* Tours Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Tour Name</th>
                      <th className="text-left py-3 px-4">Destination</th>
                      <th className="text-left py-3 px-4">Duration</th>
                      <th className="text-left py-3 px-4">Price</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Views</th>
                      <th className="text-left py-3 px-4">Bookings</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500">
                          Loading tours...
                        </td>
                      </tr>
                    ) : filteredTours.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500">
                          No tours found. Create your first tour to get started!
                        </td>
                      </tr>
                    ) : (
                      filteredTours.map((tour) => (
                        <tr key={tour.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{tour.name}</td>
                          <td className="py-3 px-4">{tour.destination}</td>
                          <td className="py-3 px-4">{tour.duration}</td>
                          <td className="py-3 px-4">${tour.price}</td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(tour.status)}>
                              {tour.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{tour.views}</td>
                          <td className="py-3 px-4">{tour.bookings}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleViewTour(tour)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditTour(tour)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setTourToDelete(tour.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Tour Templates</CardTitle>
                  <CardDescription>Browse and customize proven tour templates</CardDescription>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/operator/templates'}
                >
                  <Package className="h-4 w-4 mr-2" />
                  View Full Library
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Package className="h-8 w-8 text-blue-600" />
                      <Badge variant="secondary">Popular</Badge>
                    </div>
                    <CardTitle className="text-base mt-2">City Tour Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">12 ready-to-use templates for city tours</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow cursor-pointer border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Package className="h-8 w-8 text-green-600" />
                      <Badge variant="secondary">New</Badge>
                    </div>
                    <CardTitle className="text-base mt-2">Adventure Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">8 templates for outdoor adventures</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow cursor-pointer border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Package className="h-8 w-8 text-purple-600" />
                      <Badge>AI-Generated</Badge>
                    </div>
                    <CardTitle className="text-base mt-2">Custom Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Generate templates with AI assistance</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Access our full library of tour templates to quickly create new offerings
                </p>
                <Button 
                  className="bg-brand-orange-500 hover:bg-brand-orange-600"
                  onClick={() => window.location.href = '/operator/templates'}
                >
                  Browse All Templates
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads">
          <LeadManagementTab />
        </TabsContent>

        <TabsContent value="analytics">
          <TourAnalyticsDashboard operatorName={session?.user?.name || 'Tour Operator'} />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Manage your tour operator profile and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label>Company Name</Label>
                      <Input value={session?.user?.name || ''} disabled />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={session?.user?.email || ''} disabled />
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tour Upload Modal */}
      <TourUploadModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onTourCreated={() => {
          setShowUploadModal(false)
          fetchDashboardData() // Refresh tours list
        }}
      />

      {/* Tour URL Import Modal */}
      <TourUrlImportModal
        isOpen={showUrlImportModal}
        onClose={() => setShowUrlImportModal(false)}
        onTourCreated={() => {
          setShowUrlImportModal(false)
          fetchDashboardData() // Refresh tours list
        }}
      />

      {/* Tour Detail Modal */}
      {selectedTour && (
        <TourDetailModal
          tour={selectedTour}
          isOpen={!!selectedTour}
          onClose={() => setSelectedTour(null)}
          onSave={() => {
            setSelectedTour(null)
            fetchDashboardData()
          }}
          mode={tourModalMode}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!tourToDelete} onOpenChange={() => setTourToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tour</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tour? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => tourToDelete && handleDeleteTour(tourToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}