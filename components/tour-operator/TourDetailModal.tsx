"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  Globe, 
  Shield, 
  List,
  Image as ImageIcon,
  Save,
  X,
  Plus,
  Trash2
} from 'lucide-react'
import { useTours } from '@/src/presentation/hooks/useTours'
import { useFeatureFlag } from '@/lib/feature-flags'

interface TourDetailModalProps {
  tour: any
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  mode: 'view' | 'edit'
}

export default function TourDetailModal({ tour, isOpen, onClose, onSave, mode }: TourDetailModalProps) {
  const useNewTourService = useFeatureFlag('USE_NEW_TOUR_SERVICE')
  const { updateTour, publishTour } = useTours()
  const [isEditing, setIsEditing] = useState(mode === 'edit')
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    duration: '',
    description: '',
    price: 0,
    currency: 'USD',
    status: 'draft',
    highlights: [] as string[],
    inclusions: [] as string[],
    exclusions: [] as string[],
    itinerary: [] as any[],
    images: [] as string[]
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (tour) {
      // Parse JSON fields
      const highlights = tour.highlights ? JSON.parse(tour.highlights) : []
      const inclusions = tour.included ? JSON.parse(tour.included) : []
      const exclusions = tour.excluded ? JSON.parse(tour.excluded) : []
      const metadata = tour.metadata ? JSON.parse(tour.metadata) : {}
      const images = tour.images ? JSON.parse(tour.images) : []

      setFormData({
        name: tour.name || '',
        destination: tour.destination || tour.location || '',
        duration: tour.duration || '',
        description: tour.description || '',
        price: tour.price || 0,
        currency: tour.currency || 'USD',
        status: tour.status || 'draft',
        highlights,
        inclusions,
        exclusions,
        itinerary: metadata.itinerary || [],
        images
      })
    }
  }, [tour])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayItemAdd = (field: 'highlights' | 'inclusions' | 'exclusions', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }))
    }
  }

  const handleArrayItemRemove = (field: 'highlights' | 'inclusions' | 'exclusions', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (useNewTourService) {
        // Use new service
        const updates = {
          title: formData.name,
          description: formData.description,
          destinations: [formData.destination],
          duration: parseInt(formData.duration.replace(/\D/g, '') || '1'),
          price: {
            amount: formData.price,
            currency: formData.currency
          },
          included: formData.inclusions,
          excluded: formData.exclusions,
          images: formData.images.map(url => ({ url, alt: formData.name }))
        }
        
        await updateTour(tour.id, updates)
        
        // If status changed to active, publish the tour
        if (formData.status === 'active' && tour.status !== 'active') {
          await publishTour(tour.id)
        }
      } else {
        // Legacy implementation
        const response = await fetch(`/api/tour-operator/tours/${tour.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            location: formData.destination,
            price: formData.price,
            currency: formData.currency,
            highlights: JSON.stringify(formData.highlights),
            included: JSON.stringify(formData.inclusions),
            excluded: JSON.stringify(formData.exclusions),
            images: JSON.stringify(formData.images),
            metadata: JSON.stringify({
              ...JSON.parse(tour.metadata || '{}'),
              itinerary: formData.itinerary
            }),
            active: formData.status === 'active'
          })
        })

        if (!response.ok) {
          throw new Error('Failed to update tour')
        }
      }

      toast.success('Tour updated successfully!')
      onSave()
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving tour:', error)
      toast.error('Failed to save tour')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{isEditing ? 'Edit Tour' : 'Tour Details'}</span>
            {!isEditing && mode === 'edit' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit Tour
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update tour information' : 'View tour details and settings'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Tour Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  disabled={!isEditing}
                  icon={<MapPin className="h-4 w-4" />}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  disabled={!isEditing}
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                  disabled={!isEditing}
                  icon={<DollarSign className="h-4 w-4" />}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="w-full h-10 px-3 border rounded-md"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  disabled={!isEditing}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={!isEditing}
                rows={4}
                className="resize-none"
              />
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {/* Highlights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Highlights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {formData.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex-1">{highlight}</Badge>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleArrayItemRemove('highlights', index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add highlight"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleArrayItemAdd('highlights', (e.target as HTMLInputElement).value)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inclusions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's Included</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {formData.inclusions.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="flex-1">{item}</span>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleArrayItemRemove('inclusions', index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add inclusion"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleArrayItemAdd('inclusions', (e.target as HTMLInputElement).value)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exclusions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's Excluded</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {formData.exclusions.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-red-600">✗</span>
                    <span className="flex-1">{item}</span>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleArrayItemRemove('exclusions', index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add exclusion"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleArrayItemAdd('exclusions', (e.target as HTMLInputElement).value)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="itinerary" className="space-y-4">
            {formData.itinerary.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <List className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No itinerary details available</p>
                </CardContent>
              </Card>
            ) : (
              formData.itinerary.map((day, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base">Day {day.day}: {day.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-2">{day.description}</p>
                    {day.activities && day.activities.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Activities:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {day.activities.map((activity: string, actIndex: number) => (
                            <li key={actIndex}>{activity}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tour Images</CardTitle>
                <CardDescription>Manage images for this tour</CardDescription>
              </CardHeader>
              <CardContent>
                {formData.images.length === 0 ? (
                  <div className="text-center py-8">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No images uploaded yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Tour image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        {isEditing && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== index)
                              }))
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {isEditing && (
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}