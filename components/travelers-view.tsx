"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, UserPlus, Settings, Heart, AlertCircle, Calendar } from 'lucide-react'

// Placeholder data structures for future development
interface TravelerPreferences {
  dietaryRestrictions: string[]
  accessibility: string[]
  interests: string[]
  budgetRange: string
  accommodationPreference: string
}

interface Traveler {
  id: string
  name: string
  email: string
  role: 'organizer' | 'traveler'
  avatar?: string
  age?: number
  preferences: TravelerPreferences
  documents: {
    passport: {
      number: string
      expiryDate: string
      isValid: boolean
    }
    visa?: {
      type: string
      expiryDate: string
      isValid: boolean
    }
  }
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  status: 'confirmed' | 'pending' | 'declined'
}

interface TripGroup {
  travelers: Traveler[]
  groupPreferences: {
    sharedInterests: string[]
    consensusBudget: string
    groupDynamics: string
  }
}

// Mock data for development
const mockTripGroup: TripGroup = {
  travelers: [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      role: 'organizer',
      avatar: '/avatars/sarah.jpg',
      age: 28,
      preferences: {
        dietaryRestrictions: ['Vegetarian'],
        accessibility: [],
        interests: ['Photography', 'Museums', 'Local Cuisine'],
        budgetRange: '$3000-4000',
        accommodationPreference: 'Boutique Hotels'
      },
      documents: {
        passport: {
          number: 'US1234567',
          expiryDate: '2028-06-15',
          isValid: true
        }
      },
      emergencyContact: {
        name: 'Mike Johnson',
        phone: '+1-555-0123',
        relationship: 'Spouse'
      },
      status: 'confirmed'
    },
    {
      id: '2',
      name: 'Alex Chen',
      email: 'alex.chen@email.com',
      role: 'traveler',
      age: 32,
      preferences: {
        dietaryRestrictions: ['Gluten-Free'],
        accessibility: [],
        interests: ['Adventure Sports', 'Hiking', 'Photography'],
        budgetRange: '$2500-3500',
        accommodationPreference: 'Hostels/Budget Hotels'
      },
      documents: {
        passport: {
          number: 'CA9876543',
          expiryDate: '2027-03-20',
          isValid: true
        }
      },
      emergencyContact: {
        name: 'Linda Chen',
        phone: '+1-555-0456',
        relationship: 'Mother'
      },
      status: 'confirmed'
    },
    {
      id: '3',
      name: 'Emma Wilson',
      email: 'emma.wilson@email.com',
      role: 'traveler',
      age: 26,
      preferences: {
        dietaryRestrictions: [],
        accessibility: ['Wheelchair Access'],
        interests: ['Art Galleries', 'Shopping', 'Relaxation'],
        budgetRange: '$4000-5000',
        accommodationPreference: 'Luxury Hotels'
      },
      documents: {
        passport: {
          number: 'UK5555555',
          expiryDate: '2025-11-10',
          isValid: false // Expires soon
        }
      },
      emergencyContact: {
        name: 'James Wilson',
        phone: '+44-7700-900123',
        relationship: 'Father'
      },
      status: 'pending'
    }
  ],
  groupPreferences: {
    sharedInterests: ['Photography', 'Good Food'],
    consensusBudget: '$3000-4000',
    groupDynamics: 'Mixed activity levels - some prefer adventure, others relaxation'
  }
}

interface TravelersViewProps {
  tripId?: string
  editable?: boolean
  onAddTraveler?: () => void
  onUpdateTraveler?: (travelerId: string, updates: Partial<Traveler>) => void
}

export function TravelersView({ tripId, editable = false, onAddTraveler, onUpdateTraveler }: TravelersViewProps) {
  const groupData = mockTripGroup // TODO: Replace with API call using tripId
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'declined': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const hasDocumentIssues = (traveler: Traveler) => {
    const passportExpiry = new Date(traveler.documents.passport.expiryDate)
    const sixMonthsFromNow = new Date()
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
    
    return passportExpiry < sixMonthsFromNow || !traveler.documents.passport.isValid
  }

  return (
    <div className="space-y-6">
      {/* Group Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Travel Group Overview
          </CardTitle>
          <CardDescription>
            {groupData.travelers.length} travelers • {groupData.travelers.filter(t => t.status === 'confirmed').length} confirmed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {groupData.travelers.length}
              </div>
              <div className="text-sm text-gray-500">Total Travelers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {groupData.travelers.filter(t => t.status === 'confirmed').length}
              </div>
              <div className="text-sm text-gray-500">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {groupData.travelers.filter(t => hasDocumentIssues(t)).length}
              </div>
              <div className="text-sm text-gray-500">Document Issues</div>
            </div>
          </div>
          
          {editable && (
            <Button onClick={onAddTraveler} className="w-full mt-4">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Traveler
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Travelers List */}
      <div className="space-y-4">
        {groupData.travelers.map((traveler) => (
          <Card key={traveler.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={traveler.avatar} alt={traveler.name} />
                    <AvatarFallback>
                      {traveler.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{traveler.name}</h3>
                      {traveler.role === 'organizer' && (
                        <Badge variant="outline">Organizer</Badge>
                      )}
                      {hasDocumentIssues(traveler) && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{traveler.email}</p>
                    {traveler.age && (
                      <p className="text-sm text-gray-500">Age: {traveler.age}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(traveler.status)}>
                    {traveler.status}
                  </Badge>
                  {editable && (
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* Preferences */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    Preferences
                  </h4>
                  <div className="space-y-1">
                    <div>
                      <span className="text-gray-500">Budget:</span> {traveler.preferences.budgetRange}
                    </div>
                    <div>
                      <span className="text-gray-500">Accommodation:</span> {traveler.preferences.accommodationPreference}
                    </div>
                    <div>
                      <span className="text-gray-500">Interests:</span> {traveler.preferences.interests.join(', ')}
                    </div>
                    {traveler.preferences.dietaryRestrictions.length > 0 && (
                      <div>
                        <span className="text-gray-500">Dietary:</span> {traveler.preferences.dietaryRestrictions.join(', ')}
                      </div>
                    )}
                    {traveler.preferences.accessibility.length > 0 && (
                      <div>
                        <span className="text-gray-500">Accessibility:</span> {traveler.preferences.accessibility.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Travel Documents
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Passport:</span>
                      <span className={hasDocumentIssues(traveler) ? 'text-red-600' : 'text-green-600'}>
                        {hasDocumentIssues(traveler) ? 'Expires Soon' : 'Valid'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Expires: {traveler.documents.passport.expiryDate}
                    </div>
                    <div>
                      <span className="text-gray-500">Emergency Contact:</span> {traveler.emergencyContact.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {traveler.emergencyContact.phone} ({traveler.emergencyContact.relationship})
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Group Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Group Preferences</CardTitle>
          <CardDescription>
            Shared interests and group dynamics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Shared Interests:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {groupData.groupPreferences.sharedInterests.map((interest, index) => (
                  <Badge key={index} variant="secondary">{interest}</Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="font-medium">Consensus Budget:</span>
              <span className="ml-2">{groupData.groupPreferences.consensusBudget}</span>
            </div>
            <div>
              <span className="font-medium">Group Dynamics:</span>
              <p className="text-sm text-gray-600 mt-1">{groupData.groupPreferences.groupDynamics}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TravelersView 