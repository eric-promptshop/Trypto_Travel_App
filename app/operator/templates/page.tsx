'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Search, 
  Plus, 
  Filter, 
  Copy, 
  Edit3, 
  Eye, 
  Trash2, 
  Download,
  Upload,
  Globe,
  Clock,
  Users,
  DollarSign,
  MapPin,
  Star,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface TourTemplate {
  id: string
  name: string
  description: string
  destination: string
  category: string
  duration: string
  price: {
    amount: number
    currency: string
    perPerson: boolean
  }
  groupSize: {
    min: number
    max: number
  }
  difficulty: 'Easy' | 'Moderate' | 'Challenging'
  languages: string[]
  highlights: string[]
  included: string[]
  excluded: string[]
  imageUrl?: string
  rating?: number
  usageCount: number
  isAiGenerated?: boolean
  createdAt: string
  updatedAt: string
}

const CATEGORIES = [
  'All Categories',
  'Adventure',
  'Cultural',
  'Food & Wine',
  'History',
  'Nature',
  'Photography',
  'Relaxation',
  'Shopping',
  'Walking Tours',
  'Water Activities'
]

const DESTINATIONS = [
  'All Destinations',
  'Paris, France',
  'Rome, Italy',
  'Tokyo, Japan',
  'New York, USA',
  'Barcelona, Spain',
  'London, UK',
  'Dubai, UAE',
  'Sydney, Australia',
  'Bangkok, Thailand',
  'Amsterdam, Netherlands'
]

// Mock data for templates
const MOCK_TEMPLATES: TourTemplate[] = [
  {
    id: '1',
    name: 'Romantic Paris Evening Tour',
    description: 'Experience the magic of Paris at night with a guided tour of illuminated landmarks.',
    destination: 'Paris, France',
    category: 'Cultural',
    duration: '4 hours',
    price: { amount: 89, currency: 'EUR', perPerson: true },
    groupSize: { min: 2, max: 20 },
    difficulty: 'Easy',
    languages: ['English', 'French', 'Spanish'],
    highlights: ['Eiffel Tower sparkle show', 'Seine River cruise', 'Montmartre district'],
    included: ['Professional guide', 'River cruise ticket', 'Metro passes'],
    excluded: ['Meals', 'Hotel transfers'],
    rating: 4.8,
    usageCount: 156,
    isAiGenerated: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20'
  },
  {
    id: '2',
    name: 'Ancient Rome Skip-the-Line Tour',
    description: 'Skip the queues and explore the Colosseum, Roman Forum, and Palatine Hill.',
    destination: 'Rome, Italy',
    category: 'History',
    duration: '3.5 hours',
    price: { amount: 75, currency: 'EUR', perPerson: true },
    groupSize: { min: 1, max: 25 },
    difficulty: 'Moderate',
    languages: ['English', 'Italian', 'German'],
    highlights: ['Colosseum arena floor', 'Roman Forum', 'Palatine Hill'],
    included: ['Skip-the-line tickets', 'Expert guide', 'Headsets'],
    excluded: ['Food and drinks', 'Transportation'],
    rating: 4.9,
    usageCount: 234,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18'
  }
]

export default function TourTemplatesPage() {
  const [templates, setTemplates] = useState<TourTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [selectedDestination, setSelectedDestination] = useState('All Destinations')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/tour-operator/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      } else {
        console.error('Failed to fetch templates')
        // Fallback to mock data if API fails
        setTemplates(MOCK_TEMPLATES)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      setTemplates(MOCK_TEMPLATES)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All Categories' || template.category === selectedCategory
    const matchesDestination = selectedDestination === 'All Destinations' || template.destination === selectedDestination
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'ai' && template.isAiGenerated) ||
                      (activeTab === 'custom' && !template.isAiGenerated)

    return matchesSearch && matchesCategory && matchesDestination && matchesTab
  })

  const handleUseTemplate = async (template: TourTemplate) => {
    try {
      // Create a new tour from the template
      const response = await fetch('/api/tour-operator/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          name: `New Tour from ${template.name}`,
          customizations: {
            // Allow operator to customize these later
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create tour from template')
      }

      const data = await response.json()
      toast.success(`Created new tour: ${data.tour.name}`)
      
      // Redirect to tour edit page
      window.location.href = `/operator/tours/${data.tour.id}/edit`
    } catch (error) {
      console.error('Error using template:', error)
      toast.error('Failed to create tour from template')
    }
  }

  const handleCreateNew = () => {
    toast.info('Tour builder coming soon!')
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Tour Template Library</h1>
            <p className="text-gray-600 mt-2">
              Browse and customize proven tour templates or create your own
            </p>
          </div>
          <Button onClick={handleCreateNew} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Create New Tour
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">AI-Generated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {templates.filter(t => t.isAiGenerated).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Most Popular</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Ancient Rome</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {templates.reduce((sum, t) => sum + t.usageCount, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDestination} onValueChange={setSelectedDestination}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DESTINATIONS.map(destination => (
                <SelectItem key={destination} value={destination}>
                  {destination}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="mr-2 h-4 w-4" />
            AI-Generated
          </TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search query
            </p>
            <Button onClick={() => {
              setSearchQuery('')
              setSelectedCategory('All Categories')
              setSelectedDestination('All Destinations')
            }}>
              Clear Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {template.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                      {template.isAiGenerated && (
                        <Badge variant="outline" className="text-xs">
                          <Sparkles className="mr-1 h-3 w-3" />
                          AI
                        </Badge>
                      )}
                    </div>
                  </div>
                  {template.rating && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{template.rating}</span>
                    </div>
                  )}
                </div>
                <CardDescription className="line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{template.destination}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{template.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{template.groupSize.min}-{template.groupSize.max}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span>{template.price.currency} {template.price.amount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span>{template.languages.length} langs</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Used {template.usageCount} times
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button 
                  className="flex-1"
                  onClick={() => handleUseTemplate(template)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Use Template
                </Button>
                <Button variant="outline" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Tours
            </CardTitle>
            <CardDescription>
              Import existing tours from CSV or your website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Start Import
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Tour Builder
            </CardTitle>
            <CardDescription>
              Let AI create custom tours based on your requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Generate Tour
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Templates
            </CardTitle>
            <CardDescription>
              Download your templates for backup or sharing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Export All
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}