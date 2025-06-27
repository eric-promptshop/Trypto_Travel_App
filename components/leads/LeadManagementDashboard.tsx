'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Search,
  Filter,
  Download,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Tag,
  Activity,
  Star,
  Clock,
  ChevronRight,
  Plus,
  Brain,
  TrendingUp,
  MessageSquare,
  FileText,
  UserPlus,
  MoreVertical
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'

interface LeadData {
  id: string
  email: string
  phone?: string
  firstName?: string
  lastName?: string
  source: string
  destination?: string
  startDate?: string
  endDate?: string
  travelers?: number
  budget?: {
    min?: number
    max?: number
    currency: string
  }
  interests: string[]
  score: number
  status: string
  tags: string[]
  createdAt: string
  lastEngagedAt?: string
  context?: any
  activities: Array<{
    id: string
    type: string
    description: string
    createdAt: string
  }>
  _count: {
    activities: number
    bookings: number
  }
}

interface LeadManagementDashboardProps {
  operatorId?: string
}

export default function LeadManagementDashboard({ operatorId }: LeadManagementDashboardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [leads, setLeads] = useState<LeadData[]>([])
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [scoreFilter, setScoreFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Stats
  const [stats, setStats] = useState<any>(null)
  
  const debouncedSearch = useDebounce(searchQuery, 500)

  useEffect(() => {
    fetchLeads()
  }, [operatorId, debouncedSearch, statusFilter, scoreFilter, sortBy, sortOrder, page])

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      })
      
      if (operatorId) params.append('operatorId', operatorId)
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (scoreFilter !== 'all') {
        if (scoreFilter === 'hot') {
          params.append('scoreMin', '80')
        } else if (scoreFilter === 'warm') {
          params.append('scoreMin', '50')
          params.append('scoreMax', '79')
        } else if (scoreFilter === 'cold') {
          params.append('scoreMax', '49')
        }
      }
      
      const response = await fetch(`/api/leads/enhanced?${params}`)
      if (!response.ok) throw new Error('Failed to fetch leads')
      
      const data = await response.json()
      setLeads(data.leads)
      setTotalPages(data.pagination.pages)
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchLeads()
  }

  const handleLeadClick = async (lead: LeadData) => {
    setSelectedLead(lead)
    setShowDetailModal(true)
    
    // Fetch full lead details
    try {
      const response = await fetch(`/api/leads/enhanced/${lead.id}`)
      if (!response.ok) throw new Error('Failed to fetch lead details')
      
      const data = await response.json()
      setSelectedLead(data.lead)
    } catch (error) {
      console.error('Error fetching lead details:', error)
    }
  }

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/enhanced/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) throw new Error('Failed to update status')
      
      toast.success('Lead status updated')
      fetchLeads()
      
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleEnrichLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/enhanced/${leadId}/enrich`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to enrich lead')
      
      const data = await response.json()
      toast.success('Lead enriched with AI insights')
      
      // Refresh lead data
      if (selectedLead?.id === leadId) {
        setSelectedLead(data.lead)
      }
      fetchLeads()
    } catch (error) {
      console.error('Error enriching lead:', error)
      toast.error('Failed to enrich lead')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'qualified': return 'bg-purple-100 text-purple-800'
      case 'proposal': return 'bg-orange-100 text-orange-800'
      case 'won': return 'bg-green-100 text-green-800'
      case 'lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatBudget = (budget?: any) => {
    if (!budget) return 'Not specified'
    const { min, max, currency } = budget
    if (min && max) return `${currency} ${min}-${max}`
    if (min) return `${currency} ${min}+`
    if (max) return `Up to ${currency} ${max}`
    return 'Not specified'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lead Management</h2>
          <p className="text-gray-600">Track and nurture your travel leads</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* TODO: Export functionality */}}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => router.push('/leads/new')}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Avg. score: {stats.averageScore}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Leads</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.statusCounts?.new || 0}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting contact
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qualified</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.statusCounts?.qualified || 0}</div>
              <p className="text-xs text-muted-foreground">
                Ready for proposals
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.statusCounts?.won || 0}</div>
              <p className="text-xs text-muted-foreground">
                Converted to customers
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Scores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="hot">Hot (80+)</SelectItem>
                <SelectItem value="warm">Warm (50-79)</SelectItem>
                <SelectItem value="cold">Cold (&lt;50)</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Added</SelectItem>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="lastEngagedAt">Last Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleLeadClick(lead)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {lead.firstName || lead.lastName ? 
                            `${lead.firstName || ''} ${lead.lastName || ''}`.trim() : 
                            'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                        {lead.phone && (
                          <div className="text-xs text-gray-400">{lead.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {lead.destination || 'Not specified'}
                      </div>
                      {lead.startDate && (
                        <div className="text-xs text-gray-500">
                          {format(new Date(lead.startDate), 'MMM d')}
                          {lead.endDate && ` - ${format(new Date(lead.endDate), 'MMM d, yyyy')}`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-2xl font-bold ${getScoreColor(lead.score)}`}>
                          {lead.score}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {lead._count.activities} activities
                      </div>
                      <div className="text-xs text-gray-500">
                        Last: {lead.lastEngagedAt ? 
                          formatDistanceToNow(new Date(lead.lastEngagedAt), { addSuffix: true }) :
                          'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {/* TODO: Email functionality */}}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEnrichLead(lead.id)}
                        >
                          <Brain className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle>Lead Details</DialogTitle>
                <DialogDescription>
                  View and manage lead information
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Lead Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {selectedLead.email}
                      </div>
                      {selectedLead.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {selectedLead.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-400" />
                        Source: {selectedLead.source}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Trip Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {selectedLead.destination || 'Not specified'}
                      </div>
                      {selectedLead.startDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {format(new Date(selectedLead.startDate), 'MMM d, yyyy')}
                          {selectedLead.endDate && ` - ${format(new Date(selectedLead.endDate), 'MMM d, yyyy')}`}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        {selectedLead.travelers || 1} traveler(s)
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        {formatBudget(selectedLead.budget)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interests */}
                {selectedLead.interests.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.interests.map((interest, index) => (
                        <Badge key={index} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Insights */}
                {selectedLead.context?.enrichment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Travel Persona</p>
                          <p className="text-sm text-gray-600">
                            {selectedLead.context.enrichment.travelPersona}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Next Best Action</p>
                          <p className="text-sm text-gray-600">
                            {selectedLead.context.enrichment.engagementStrategy.nextBestAction}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Personalized Message</p>
                          <p className="text-sm text-gray-600 italic">
                            "{selectedLead.context.enrichment.engagementStrategy.personalizedMessage}"
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <Select
                    value={selectedLead.status}
                    onValueChange={(value) => handleStatusChange(selectedLead.id, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Add Note
                    </Button>
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-1" />
                      Send Proposal
                    </Button>
                    <Button>
                      <Mail className="h-4 w-4 mr-1" />
                      Send Email
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}