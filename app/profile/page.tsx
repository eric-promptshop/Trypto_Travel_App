'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Globe, 
  Briefcase,
  Camera,
  Save,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

// Demo user profile data
const demoProfileData = {
  name: 'Demo User',
  email: 'demo@example.com',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  bio: 'Passionate traveler with a love for discovering hidden gems and experiencing local cultures. I\'ve visited over 25 countries and counting!',
  occupation: 'Digital Nomad',
  website: 'https://demo-traveler.com',
  joinedDate: 'January 2024',
  languages: ['English', 'Spanish', 'French'],
  travelStyle: ['Adventure', 'Cultural', 'Food & Wine'],
  favoriteDestinations: ['Peru', 'Japan', 'Iceland', 'New Zealand'],
  travelStats: {
    tripsPlanned: 12,
    countriesVisited: 25,
    citiesExplored: 87,
    milesFlown: 125000
  }
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState(demoProfileData)

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  const handleSave = () => {
    setIsEditing(false)
    toast({
      title: "Profile updated",
      description: "Your profile changes have been saved successfully.",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/trips" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Trips
        </Link>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your personal information and travel preferences</p>
      </div>

      <div className="grid gap-8">
        {/* Profile Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src="/placeholder-user.jpg" alt={profileData.name} />
                  <AvatarFallback className="text-2xl">{getInitials(profileData.name)}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2">{profileData.name}</h2>
                <p className="text-muted-foreground mb-4">{profileData.email}</p>
                
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                  <Badge variant="secondary">
                    <MapPin className="h-3 w-3 mr-1" />
                    {profileData.location}
                  </Badge>
                  <Badge variant="secondary">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {profileData.occupation}
                  </Badge>
                  <Badge variant="secondary">
                    <Calendar className="h-3 w-3 mr-1" />
                    Joined {profileData.joinedDate}
                  </Badge>
                </div>

                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Travel Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(profileData.travelStats).map(([key, value]) => (
            <Card key={key}>
              <CardContent className="text-center p-6">
                <div className="text-3xl font-bold text-primary">
                  {value.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="preferences">Travel Preferences</TabsTrigger>
            <TabsTrigger value="about">About Me</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={profileData.occupation}
                      onChange={(e) => setProfileData({...profileData, occupation: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profileData.website}
                      onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Travel Preferences</CardTitle>
                <CardDescription>
                  Tell us about your travel style and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-3 block">Languages Spoken</Label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.languages.map((lang) => (
                      <Badge key={lang} variant="secondary">
                        <Globe className="h-3 w-3 mr-1" />
                        {lang}
                      </Badge>
                    ))}
                    {isEditing && (
                      <Button size="sm" variant="outline">
                        + Add Language
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Travel Style</Label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.travelStyle.map((style) => (
                      <Badge key={style} variant="secondary">
                        {style}
                      </Badge>
                    ))}
                    {isEditing && (
                      <Button size="sm" variant="outline">
                        + Add Style
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Favorite Destinations</Label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.favoriteDestinations.map((dest) => (
                      <Badge key={dest} variant="secondary">
                        <MapPin className="h-3 w-3 mr-1" />
                        {dest}
                      </Badge>
                    ))}
                    {isEditing && (
                      <Button size="sm" variant="outline">
                        + Add Destination
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>About Me</CardTitle>
                <CardDescription>
                  Share a bit about yourself and your travel experiences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  disabled={!isEditing}
                  rows={6}
                  placeholder="Tell us about yourself..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}