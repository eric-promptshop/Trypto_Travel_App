"use client"

import { useState, useEffect } from 'react'
import { useTrips, type Trip, type TripFilters } from '@/hooks/use-trips'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  MoreVertical,
  Edit3,
  Share2,
  Download,
  Copy,
  Trash2,
  Eye,
  RefreshCw,
  AlertTriangle,
  Plane,
  TrendingUp,
  Sparkles,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, differenceInDays } from 'date-fns'

interface TripDashboardProps {
  onCreateTrip?: () => void
  onEditTrip?: (trip: Trip) => void
  onViewTrip?: (trip: Trip) => void
  className?: string
}

interface AITripSuggestion {
  title: string
  destination: string
  description: string
  duration: number
  bestTimeToGo: string
  estimatedBudget: string
  highlights: string[]
}

interface TripStats {
  total: number
  byStatus: Record<string, number>
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-500', variant: 'secondary' as const },
  active: { label: 'Active', color: 'bg-blue-500', variant: 'default' as const },
  completed: { label: 'Completed', color: 'bg-green-500', variant: 'default' as const },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', variant: 'destructive' as const }
}

export function TripDashboard({ 
  onCreateTrip, 
  onEditTrip, 
  onViewTrip,
  className = "" 
}: TripDashboardProps) {
  const [filters, setFilters] = useState<TripFilters>({ page: 1, limit: 12 })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [stats, setStats] = useState<TripStats | null>(null)
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [aiSuggestions, setAISuggestions] = useState<AITripSuggestion[]>([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)

  const { 
    trips, 
    loading, 
    error, 
    meta, 
    refresh, 
    deleteTrip,
    fetchTrips 
  } = useTrips(filters)

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        setFilters(prev => ({ ...prev, location: searchQuery, page: 1 }))
      } else {
        setFilters(prev => {
          const newFilters = { ...prev, page: 1 }
          delete newFilters.location
          return newFilters
        })
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Load trip statistics
  useEffect(() => {
    // This would typically come from your API
    const mockStats: TripStats = {
      total: trips.length,
      byStatus: trips.reduce((acc, trip) => {
        acc[trip.status] = (acc[trip.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
    setStats(mockStats)
  }, [trips])

  const handleStatusFilter = (status: string) => {
    if (status === 'all') {
      setFilters(prev => {
        const newFilters = { ...prev, page: 1 }
        delete newFilters.status
        return newFilters
      })
    } else {
      setFilters(prev => ({ 
        ...prev, 
        status: status as Trip['status'], 
        page: 1 
      }))
    }
  }

  const handleDeleteTrip = async (trip: Trip) => {
    const success = await deleteTrip(trip.id)
    if (success) {
      setShowDeleteDialog(false)
      setSelectedTrip(null)
    }
  }

  const handleDuplicateTrip = async (trip: Trip) => {
    // This would typically create a copy via API
    console.log('Duplicating trip:', trip.id)
  }

  const formatTripDuration = (startDate: string, endDate: string) => {
    const days = differenceInDays(parseISO(endDate), parseISO(startDate)) + 1
    return `${days} day${days === 1 ? '' : 's'}`
  }

  const fetchAISuggestions = async () => {
    setIsLoadingAI(true)
    try {
      const response = await fetch('/api/trips-ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingTrips: trips.map(t => ({
            destination: t.location,
            duration: differenceInDays(parseISO(t.endDate), parseISO(t.startDate)) + 1,
            date: t.startDate
          })),
          userPreferences: {
            totalTrips: stats?.total || 0,
            commonDestinations: [...new Set(trips.map(t => t.location))].slice(0, 5)
          }
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAISuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Failed to fetch AI suggestions:', error)
      // Fallback suggestions
      setAISuggestions([
        {
          title: 'Northern Lights Adventure',
          destination: 'Reykjavik, Iceland',
          description: 'Experience the magical aurora borealis and explore Iceland\'s stunning landscapes',
          duration: 5,
          bestTimeToGo: 'September to March',
          estimatedBudget: '$2000-3000',
          highlights: ['Aurora viewing', 'Blue Lagoon', 'Golden Circle tour']
        },
        {
          title: 'Japanese Cultural Journey',
          destination: 'Tokyo & Kyoto, Japan',
          description: 'Immerse yourself in ancient traditions and modern innovation',
          duration: 10,
          bestTimeToGo: 'March-May or October-November',
          estimatedBudget: '$3000-4500',
          highlights: ['Cherry blossoms', 'Traditional temples', 'Mount Fuji']
        }
      ])
    } finally {
      setIsLoadingAI(false)
    }
  }

  if (error && !trips.length) {
    return (
      <div className={`container mx-auto p-6 ${className}`}>
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load trips: {error}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refresh}
              className="ml-2 h-6 px-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={`container mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-600 mt-1">
            Plan, organize, and manage your travel adventures
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              setShowAISuggestions(!showAISuggestions)
              if (!showAISuggestions && aiSuggestions.length === 0) {
                fetchAISuggestions()
              }
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Suggestions
          </Button>
          <Button onClick={onCreateTrip} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Trip
          </Button>
        </div>
      </div>

      {/* AI Suggestions */}
      {showAISuggestions && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">AI Trip Suggestions</h3>
            </div>
            {isLoadingAI && <Loader2 className="h-5 w-5 animate-spin text-purple-600" />}
          </div>
          
          {isLoadingAI ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiSuggestions.map((suggestion, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={onCreateTrip}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {suggestion.destination}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">{suggestion.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-1 font-medium">{suggestion.duration} days</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Budget:</span>
                        <span className="ml-1 font-medium">{suggestion.estimatedBudget}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Best time:</span>
                      <span className="ml-1 text-sm font-medium">{suggestion.bestTimeToGo}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.highlights.map((highlight, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Trips</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Plane className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          {Object.entries(statusConfig).map(([status, config]) => (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{config.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.byStatus[status] || 0}
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${config.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search trips by destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trips</SelectItem>
            {Object.entries(statusConfig).map(([status, config]) => (
              <SelectItem key={status} value={status}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {loading && !trips.length ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card>
                  <CardHeader className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            // Trip cards
            trips.map((trip) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                          {trip.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {trip.location}
                        </CardDescription>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewTrip?.(trip)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditTrip?.(trip)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Trip
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateTrip(trip)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={() => {
                              setSelectedTrip(trip)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent 
                    className="space-y-3 cursor-pointer"
                    onClick={() => onViewTrip?.(trip)}
                  >
                    {trip.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {trip.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>{format(parseISO(trip.startDate), 'MMM d')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="h-3 w-3" />
                        <span>{formatTripDuration(trip.startDate, trip.endDate)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={statusConfig[trip.status]?.variant || 'secondary'}
                        className="text-xs"
                      >
                        {statusConfig[trip.status]?.label || trip.status}
                      </Badge>
                      
                      <div className="text-sm font-medium text-gray-900">
                        <span className="text-gray-600">From </span>
                        {format(parseISO(trip.startDate), 'MMM d, yyyy')}
                      </div>
                    </div>

                    {trip.participants && trip.participants.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="h-3 w-3" />
                        {trip.participants.length} traveler{trip.participants.length === 1 ? '' : 's'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {!loading && trips.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Plane className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || filters.status ? 'No trips found' : 'No trips yet'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery || filters.status 
              ? 'Try adjusting your search criteria or filters to find trips.'
              : 'Start planning your next adventure by creating your first trip.'
            }
          </p>
          {!searchQuery && !filters.status && (
            <Button onClick={onCreateTrip} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Trip
            </Button>
          )}
        </motion.div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} trips
          </p>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrev}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={page === meta.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, page }))}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Trip</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTrip?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedTrip && handleDeleteTrip(selectedTrip)}
            >
              Delete Trip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 