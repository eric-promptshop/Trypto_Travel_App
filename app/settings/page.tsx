'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Settings,
  Bell,
  Shield,
  Globe,
  Palette,
  CreditCard,
  Smartphone,
  Mail,
  Lock,
  Eye,
  Map,
  DollarSign,
  Calendar,
  ArrowLeft,
  Save,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

// Demo settings data
const demoSettings = {
  notifications: {
    emailNotifications: true,
    tripReminders: true,
    priceAlerts: true,
    newsletters: false,
    smsNotifications: false,
    pushNotifications: true
  },
  privacy: {
    profileVisibility: 'friends',
    shareTrips: true,
    showLocation: false,
    allowAnalytics: true,
    dataSharing: false
  },
  preferences: {
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeZone: 'America/Los_Angeles',
    language: 'en',
    measurementUnit: 'imperial',
    mapProvider: 'google'
  },
  display: {
    theme: 'system',
    compactView: false,
    showTips: true,
    autoplayVideos: false
  },
  billing: {
    plan: 'Free',
    nextBillingDate: null,
    paymentMethod: null,
    autoRenew: false
  }
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [settings, setSettings] = useState(demoSettings)
  const [hasChanges, setHasChanges] = useState(false)

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
    setHasChanges(false)
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    })
  }

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }))
    setHasChanges(true)
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your account preferences and settings</p>
          </div>
          {hasChanges && (
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Globe className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="display">
            <Palette className="h-4 w-4 mr-2" />
            Display
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about your trips and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications" className="text-base">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive trip updates and reminders via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => 
                      updateSetting('notifications', 'emailNotifications', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="trip-reminders" className="text-base">
                      Trip Reminders
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about upcoming trips and activities
                    </p>
                  </div>
                  <Switch
                    id="trip-reminders"
                    checked={settings.notifications.tripReminders}
                    onCheckedChange={(checked) => 
                      updateSetting('notifications', 'tripReminders', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="price-alerts" className="text-base">
                      Price Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Notify me when prices change for saved destinations
                    </p>
                  </div>
                  <Switch
                    id="price-alerts"
                    checked={settings.notifications.priceAlerts}
                    onCheckedChange={(checked) => 
                      updateSetting('notifications', 'priceAlerts', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications" className="text-base">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications on your device
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) => 
                      updateSetting('notifications', 'pushNotifications', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control your privacy and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-visibility">Profile Visibility</Label>
                  <Select
                    value={settings.privacy.profileVisibility}
                    onValueChange={(value) => 
                      updateSetting('privacy', 'profileVisibility', value)
                    }
                  >
                    <SelectTrigger id="profile-visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Choose who can see your profile information
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="share-trips" className="text-base">
                      Share Trip Plans
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your trip itineraries
                    </p>
                  </div>
                  <Switch
                    id="share-trips"
                    checked={settings.privacy.shareTrips}
                    onCheckedChange={(checked) => 
                      updateSetting('privacy', 'shareTrips', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analytics" className="text-base">
                      Analytics & Improvements
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Help us improve by sharing anonymous usage data
                    </p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={settings.privacy.allowAnalytics}
                    onCheckedChange={(checked) => 
                      updateSetting('privacy', 'allowAnalytics', checked)
                    }
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Data Protection</p>
                    <p>Your data is encrypted and stored securely. We never sell your personal information to third parties.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>General Preferences</CardTitle>
              <CardDescription>
                Customize your experience with regional and display settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.preferences.currency}
                    onValueChange={(value) => 
                      updateSetting('preferences', 'currency', value)
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select
                    value={settings.preferences.dateFormat}
                    onValueChange={(value) => 
                      updateSetting('preferences', 'dateFormat', value)
                    }
                  >
                    <SelectTrigger id="date-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.preferences.language}
                    onValueChange={(value) => 
                      updateSetting('preferences', 'language', value)
                    }
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="units">Measurement Units</Label>
                  <Select
                    value={settings.preferences.measurementUnit}
                    onValueChange={(value) => 
                      updateSetting('preferences', 'measurementUnit', value)
                    }
                  >
                    <SelectTrigger id="units">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imperial">Imperial (mi, ft)</SelectItem>
                      <SelectItem value="metric">Metric (km, m)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Customize the appearance of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compact-view" className="text-base">
                      Compact View
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Show more content in less space
                    </p>
                  </div>
                  <Switch
                    id="compact-view"
                    checked={settings.display.compactView}
                    onCheckedChange={(checked) => 
                      updateSetting('display', 'compactView', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-tips" className="text-base">
                      Show Tips & Tutorials
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Display helpful tips throughout the app
                    </p>
                  </div>
                  <Switch
                    id="show-tips"
                    checked={settings.display.showTips}
                    onCheckedChange={(checked) => 
                      updateSetting('display', 'showTips', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Current Plan</h3>
                    <p className="text-sm text-muted-foreground">You're currently on the free plan</p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    Free
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>Unlimited trip planning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>AI-powered itineraries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>Basic travel insights</span>
                  </div>
                </div>
              </div>

              <div>
                <Button className="w-full md:w-auto" size="lg">
                  Upgrade to Pro
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Get advanced features, priority support, and more
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-4">Payment Methods</h3>
                <p className="text-sm text-muted-foreground">
                  No payment methods on file
                </p>
                <Button variant="outline" className="mt-4">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}