"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  MessageSquare,
  Eye,
  Mail,
  Phone,
  ChevronDown,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  FileText
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Lead {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  destination?: string
  startDate?: string
  endDate?: string
  travelers?: number
  budget?: any
  interests: string[]
  tourIds: string[]
  status: string
  score: number
  createdAt: string
  lastEngagedAt?: string
  source: string
  itinerary?: any
  tours?: Array<{
    id: string
    name: string
    price: number
  }>
}

interface LeadActivity {
  id: string
  type: string
  description: string
  createdAt: string
  metadata?: any
}

export function LeadManagementTab() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [leadActivities, setLeadActivities] = useState<LeadActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [showLeadDetail, setShowLeadDetail] = useState(false)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads')
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLeadActivities = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/activities`)
      if (response.ok) {
        const data = await response.json()
        setLeadActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching lead activities:', error)
    }
  }

  const handleViewLead = async (lead: Lead) => {
    setSelectedLead(lead)
    setShowLeadDetail(true)
    await fetchLeadActivities(lead.id)
  }

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success('Lead status updated')
        fetchLeads()
      }
    } catch (error) {
      toast.error('Failed to update lead status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'qualified': return 'bg-purple-100 text-purple-800'
      case 'converted': return 'bg-green-100 text-green-800'
      case 'lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
    if (score >= 60) return <Star className="h-4 w-4 text-yellow-500" />
    return <AlertCircle className="h-4 w-4 text-gray-400" />
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.destination?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'score':
        return b.score - a.score
      case 'engagement':
        return new Date(b.lastEngagedAt || b.createdAt).getTime() - 
               new Date(a.lastEngagedAt || a.createdAt).getTime()
      default:
        return 0
    }
  })

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lead Management</CardTitle>
              <CardDescription>Track and manage your potential customers</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="score">Highest score</SelectItem>
                <SelectItem value="engagement">Last engaged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lead Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leads.length}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">New This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {leads.filter(l => {
                    const created = new Date(l.createdAt)
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return created > weekAgo
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Qualified</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {leads.filter(l => l.status === 'qualified').length}
                </div>
                <p className="text-xs text-muted-foreground">Ready to convert</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {leads.length > 0 
                    ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Overall</p>
              </CardContent>
            </Card>
          </div>

          {/* Leads Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Lead</th>
                  <th className="text-left py-3 px-4">Destination</th>
                  <th className="text-left py-3 px-4">Trip Details</th>
                  <th className="text-left py-3 px-4">Score</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Source</th>
                  <th className="text-left py-3 px-4">Created</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      Loading leads...
                    </td>
                  </tr>
                ) : sortedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  sortedLeads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">
                            {lead.firstName && lead.lastName 
                              ? `${lead.firstName} ${lead.lastName}`
                              : lead.email}
                          </div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                          {lead.phone && (
                            <div className="text-sm text-gray-500">{lead.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{lead.destination || 'Not specified'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1 text-sm">
                          {lead.startDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span>{format(new Date(lead.startDate), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          {lead.travelers && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-gray-400" />
                              <span>{lead.travelers} travelers</span>
                            </div>
                          )}
                          {lead.budget && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-gray-400" />
                              <span>${lead.budget.min || 0} - ${lead.budget.max || 0}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {getScoreIcon(lead.score)}
                          <span className="font-medium">{lead.score}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{lead.source}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-500">
                          {format(new Date(lead.createdAt), 'MMM d')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewLead(lead)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4" />
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

      {/* Lead Detail Dialog */}
      <Dialog open={showLeadDetail} onOpenChange={setShowLeadDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              View complete information about this lead
            </DialogDescription>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-6">
              {/* Lead Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <div>
                      <Label>Name</Label>
                      <p className="text-sm">
                        {selectedLead.firstName && selectedLead.lastName 
                          ? `${selectedLead.firstName} ${selectedLead.lastName}`
                          : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm">{selectedLead.email}</p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p className="text-sm">{selectedLead.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Trip Preferences</h3>
                  <div className="space-y-2">
                    <div>
                      <Label>Destination</Label>
                      <p className="text-sm">{selectedLead.destination || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label>Travel Dates</Label>
                      <p className="text-sm">
                        {selectedLead.startDate && selectedLead.endDate
                          ? `${format(new Date(selectedLead.startDate), 'MMM d')} - ${format(new Date(selectedLead.endDate), 'MMM d, yyyy')}`
                          : 'Flexible'}
                      </p>
                    </div>
                    <div>
                      <Label>Interests</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedLead.interests.map((interest, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tours Interested In */}
              {selectedLead.tours && selectedLead.tours.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Tours of Interest</h3>
                  <div className="space-y-2">
                    {selectedLead.tours.map((tour) => (
                      <div key={tour.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">{tour.name}</span>
                        <span className="text-sm text-gray-600">${tour.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div>
                <h3 className="font-semibold mb-3">Activity Timeline</h3>
                <div className="space-y-3">
                  {leadActivities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Activity className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {leadActivities.length === 0 && (
                    <p className="text-sm text-gray-500">No activities recorded yet</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Select 
                  value={selectedLead.status} 
                  onValueChange={(value) => handleUpdateStatus(selectedLead.id, value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}