"use client"

import { useState, useEffect } from 'react'
import { useItinerary, type ItineraryActivity, type CreateActivityData } from '@/hooks/use-itinerary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Edit3, 
  Trash2, 
  GripVertical,
  Clock,
  MapPin,
  DollarSign,
  Star,
  Phone,
  Globe,
  Save,
  X,
  AlertCircle,
  Bed,
  Car,
  Utensils,
  Camera,
  Palette
} from 'lucide-react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { toast } from 'sonner'

interface ActivityManagerProps {
  tripId: string
  dayNumber: number
  activities: ItineraryActivity[]
  onActivitiesChange?: (activities: ItineraryActivity[]) => void
  className?: string
}

interface ActivityFormData extends Omit<CreateActivityData, 'id'> {
  id?: string
}

const activityTypeConfig = {
  activity: { 
    label: 'Activity', 
    icon: Camera, 
    color: 'bg-blue-500', 
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  },
  accommodation: { 
    label: 'Accommodation', 
    icon: Bed, 
    color: 'bg-purple-500', 
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700'
  },
  transportation: { 
    label: 'Transportation', 
    icon: Car, 
    color: 'bg-green-500', 
    bgColor: 'bg-green-50',
    textColor: 'text-green-700'
  },
  dining: { 
    label: 'Dining', 
    icon: Utensils, 
    color: 'bg-orange-500', 
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700'
  }
}

const defaultFormData: ActivityFormData = {
  type: 'activity',
  time: '09:00',
  title: '',
  description: '',
  location: '',
  duration: '2 hours',
  cost: 0,
  rating: 4.0,
  bookingRequired: false,
  contactInfo: {},
  tips: []
}

export function ActivityManager({ 
  tripId, 
  dayNumber, 
  activities: initialActivities,
  onActivitiesChange,
  className = ""
}: ActivityManagerProps) {
  const [activities, setActivities] = useState<ItineraryActivity[]>(initialActivities || [])
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<ActivityFormData>(defaultFormData)
  const [totalCost, setTotalCost] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { 
    addActivity, 
    updateActivity, 
    deleteActivity, 
    loading, 
    error 
  } = useItinerary(tripId)

  // Update local activities when props change
  useEffect(() => {
    setActivities(initialActivities || [])
  }, [initialActivities])

  // Calculate total cost when activities change
  useEffect(() => {
    const total = activities.reduce((sum, activity) => sum + activity.cost, 0)
    setTotalCost(total)
    onActivitiesChange?.(activities)
  }, [activities, onActivitiesChange])

  const handleReorder = (newOrder: ItineraryActivity[]) => {
    setActivities(newOrder)
    // You could implement auto-save here or save on blur
  }

  const handleAddActivity = async () => {
    if (!formData.title.trim() || !formData.location.trim()) {
      toast.error('Please fill in required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const success = await addActivity(dayNumber, {
        ...formData,
        id: undefined // Remove id for creation
      } as CreateActivityData)
      
      if (success) {
        setShowAddForm(false)
        setFormData(defaultFormData)
        toast.success('Activity added successfully')
      }
    } catch (error) {
      toast.error('Failed to add activity')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateActivity = async (activityId: string, updates: Partial<CreateActivityData>) => {
    setIsSubmitting(true)
    try {
      const success = await updateActivity(activityId, updates)
      if (success) {
        setIsEditing(null)
        toast.success('Activity updated successfully')
      }
    } catch (error) {
      toast.error('Failed to update activity')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    setIsSubmitting(true)
    try {
      const success = await deleteActivity(activityId)
      if (success) {
        toast.success('Activity deleted successfully')
      }
    } catch (error) {
      toast.error('Failed to delete activity')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditForm = (activity: ItineraryActivity) => {
    setFormData({
      id: activity.id,
      type: activity.type,
      time: activity.time,
      title: activity.title,
      description: activity.description || '',
      location: activity.location,
      duration: activity.duration,
      cost: activity.cost,
      rating: activity.rating || 4.0,
      bookingRequired: activity.bookingRequired || false,
      contactInfo: activity.contactInfo || {},
      tips: activity.tips || []
    })
    setIsEditing(activity.id)
    setShowAddForm(true)
  }

  const resetForm = () => {
    setFormData(defaultFormData)
    setIsEditing(null)
    setShowAddForm(false)
  }

  const updateFormField = (field: keyof ActivityFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cost)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Add Button and Cost Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Day {dayNumber} Activities
          </h3>
          <p className="text-sm text-gray-600">
            {activities.length} activit{activities.length === 1 ? 'y' : 'ies'} • Total: {formatCost(totalCost)}
          </p>
        </div>
        
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </DialogTrigger>
          <ActivityFormDialog 
            formData={formData}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            onFormChange={updateFormField}
            onSubmit={isEditing ? 
              () => handleUpdateActivity(formData.id!, formData) : 
              handleAddActivity
            }
            onCancel={resetForm}
          />
        </Dialog>
      </div>

      {/* Activities List with Drag and Drop */}
      {activities.length > 0 ? (
        <Reorder.Group 
          axis="y" 
          values={activities} 
          onReorder={handleReorder}
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {activities.map((activity) => (
              <Reorder.Item 
                key={activity.id} 
                value={activity}
                className="touch-manipulation"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <ActivityCard
                    activity={activity}
                    isSubmitting={isSubmitting}
                    onEdit={() => openEditForm(activity)}
                    onDelete={() => handleDeleteActivity(activity.id)}
                  />
                </motion.div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg"
        >
          <Palette className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No activities planned yet</h4>
          <p className="text-gray-500 mb-4">Start building your day by adding activities, meals, or accommodations.</p>
          <Button onClick={() => setShowAddForm(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add First Activity
          </Button>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Error: {error}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Activity Card Component
function ActivityCard({ 
  activity, 
  isSubmitting, 
  onEdit, 
  onDelete 
}: {
  activity: ItineraryActivity
  isSubmitting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const config = activityTypeConfig[activity.type as keyof typeof activityTypeConfig] || activityTypeConfig.activity
  const IconComponent = config.icon

  return (
    <Card className="group hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <div className="flex flex-col items-center gap-2 mt-1">
            <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
              <IconComponent className={`h-5 w-5 ${config.textColor}`} />
            </div>
          </div>

          {/* Activity Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 truncate">{activity.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {config.label}
                  </Badge>
                </div>
                
                {activity.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {activity.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{activity.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate max-w-32">{activity.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{activity.duration}</span>
                  </div>
                  {activity.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span>{activity.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${activity.cost}
                  </p>
                  {activity.bookingRequired && (
                    <Badge variant="secondary" className="text-xs">
                      Booking Required
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    disabled={isSubmitting}
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    disabled={isSubmitting}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {(activity.tips?.length || activity.contactInfo?.phone || activity.contactInfo?.website) && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                {activity.tips?.length && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Tips:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {activity.tips.slice(0, 2).map((tip, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span className="line-clamp-1">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {(activity.contactInfo?.phone || activity.contactInfo?.website) && (
                  <div className="flex gap-4 text-xs">
                    {activity.contactInfo.phone && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="h-3 w-3" />
                        <span>{activity.contactInfo.phone}</span>
                      </div>
                    )}
                    {activity.contactInfo.website && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Globe className="h-3 w-3" />
                        <span className="truncate max-w-24">{activity.contactInfo.website}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Activity Form Dialog Component
function ActivityFormDialog({
  formData,
  isEditing,
  isSubmitting,
  onFormChange,
  onSubmit,
  onCancel
}: {
  formData: ActivityFormData
  isEditing: string | null
  isSubmitting: boolean
  onFormChange: (field: keyof ActivityFormData, value: any) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit' : 'Add'} Activity</DialogTitle>
        <DialogDescription>
          {isEditing ? 'Update the activity details below.' : 'Add a new activity to your itinerary.'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Type and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => onFormChange('type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(activityTypeConfig).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <config.icon className="h-4 w-4" />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => onFormChange('time', e.target.value)}
            />
          </div>
        </div>

        {/* Title and Location */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => onFormChange('title', e.target.value)}
              placeholder="Activity name"
            />
          </div>
          
          <div>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => onFormChange('location', e.target.value)}
              placeholder="Where is this activity?"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onFormChange('description', e.target.value)}
            placeholder="Brief description of the activity"
            rows={3}
          />
        </div>

        {/* Duration and Cost */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              value={formData.duration}
              onChange={(e) => onFormChange('duration', e.target.value)}
              placeholder="e.g., 2 hours, Half day"
            />
          </div>
          
          <div>
            <Label htmlFor="cost">Cost ($)</Label>
            <Input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={formData.cost}
              onChange={(e) => onFormChange('cost', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Rating and Booking Required */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Rating</Label>
            <div className="mt-2">
              <Slider
                value={[formData.rating || 4.0]}
                onValueChange={(value) => onFormChange('rating', value[0])}
                max={5}
                min={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span className="font-medium">{formData.rating?.toFixed(1) || '4.0'}</span>
                <span>5</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-6">
            <Switch
              id="booking"
              checked={formData.bookingRequired || false}
              onCheckedChange={(checked) => onFormChange('bookingRequired', checked)}
            />
            <Label htmlFor="booking">Booking Required</Label>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <Label>Contact Information</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Input
              placeholder="Phone number"
              value={formData.contactInfo?.phone || ''}
              onChange={(e) => onFormChange('contactInfo', { 
                ...formData.contactInfo, 
                phone: e.target.value 
              })}
            />
            <Input
              placeholder="Website"
              value={formData.contactInfo?.website || ''}
              onChange={(e) => onFormChange('contactInfo', { 
                ...formData.contactInfo, 
                website: e.target.value 
              })}
            />
          </div>
        </div>

        {/* Tips */}
        <div>
          <Label htmlFor="tips">Tips (one per line)</Label>
          <Textarea
            id="tips"
            value={formData.tips?.join('\n') || ''}
            onChange={(e) => onFormChange('tips', e.target.value.split('\n').filter(tip => tip.trim()))}
            placeholder="Enter helpful tips, one per line"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add'} Activity
        </Button>
      </div>
    </DialogContent>
  )
} 