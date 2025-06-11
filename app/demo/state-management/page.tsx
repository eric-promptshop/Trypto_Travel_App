"use client"

import * as React from "react"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  TripCustomizationProvider, 
  useTripCustomization,
  useTripData,
  useSelectedItems,
  usePricing,
  useSession,
  useUIState
} from "@/lib/state/trip-customization-context"
import { 
  Save, 
  Download, 
  Upload, 
  Undo2, 
  Redo2, 
  RefreshCw, 
  Settings,
  Clock,
  Wifi,
  WifiOff,
  User,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2
} from "lucide-react"

// Demo component that uses the state management system
function TripCustomizationDemo() {
  const {
    state,
    updateTripDetails,
    setDestination,
    addDestination,
    removeDestination,
    setDates,
    setTravelers,
    selectAccommodation,
    removeAccommodation,
    selectActivity,
    removeActivity,
    selectTransportation,
    removeTransportation,
    undo,
    redo,
    canUndo,
    canRedo,
    saveTrip,
    calculatePricing,
    setAutoSave,
    resetTrip,
    exportTripData,
    importTripData
  } = useTripCustomization()
  
  const tripData = useTripData()
  const selectedItems = useSelectedItems()
  const pricing = usePricing()
  const session = useSession()
  const uiState = useUIState()
  
  const [importData, setImportData] = useState("")
  
  // Mock data for demo
  const mockAccommodation = {
    id: 'acc_1',
    name: 'Grand Hotel Paris',
    type: 'hotel',
    starRating: 5,
    location: 'Paris, France',
    pricing: {
      currency: 'EUR',
      perNight: 250,
      total: 1750
    },
    selectedDates: {
      checkIn: new Date('2024-07-15'),
      checkOut: new Date('2024-07-22')
    },
    rooms: 1,
    guests: 2
  }
  
  const mockActivity = {
    id: 'act_1',
    name: 'Louvre Museum Tour',
    category: 'cultural',
    duration: {
      min: 180,
      max: 240,
      typical: 210
    },
    location: 'Paris, France',
    pricing: {
      currency: 'EUR',
      adult: 45,
      child: 25
    },
    selectedDate: '2024-07-16',
    selectedTimeSlot: '10:00',
    participants: {
      adults: 2,
      children: 0
    },
    totalPrice: 90
  }
  
  const handleAddMockData = () => {
    updateTripDetails({
      name: 'Paris Adventure',
      primaryDestination: 'Paris',
      additionalDestinations: ['London'],
      startDate: new Date('2024-07-15'),
      endDate: new Date('2024-07-22'),
      duration: 7
    })
    
    selectAccommodation(mockAccommodation)
    selectActivity(mockActivity)
  }
  
  const handleSaveTrip = async () => {
    try {
      await saveTrip()
      alert('Trip saved successfully!')
    } catch (error) {
      alert('Failed to save trip (this is a demo)')
    }
  }
  
  const handleCalculatePricing = async () => {
    try {
      await calculatePricing()
    } catch (error) {
      alert('Failed to calculate pricing (this is a demo)')
    }
  }
  
  const handleExport = () => {
    const data = exportTripData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trip-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const handleImport = () => {
    try {
      importTripData(importData)
      setImportData("")
      alert('Trip data imported successfully!')
    } catch (error) {
      alert('Invalid trip data format')
    }
  }
  
  // Safe JSON stringify function to handle circular references
  const safeStringify = (obj: any) => {
    const seen = new Set()
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]'
        }
        seen.add(value)
      }
      // Skip certain problematic keys that are large or circular
      if (key === 'history' && typeof value === 'object' && value?.past && value?.future) {
        return {
          pastCount: value.past?.length || 0,
          futureCount: value.future?.length || 0,
          note: 'History details hidden to prevent circular references'
        }
      }
      return value
    }, 2)
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">State Management & Backend Integration</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Experience the complete state management system with undo/redo, autosave, backend integration,
            and comprehensive trip customization functionality.
          </p>
        </div>
        
        {/* Status Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {session.isOnline ? (
                    <Wifi className="h-4 w-4 text-green-600" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    {session.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Session: {session.sessionId.slice(-8)}</span>
                </div>
                
                {session.lastSaved && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      Saved: {session.lastSaved.toLocaleTimeString()}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={session.autoSaveEnabled}
                    onCheckedChange={setAutoSave}
                  />
                  <span className="text-sm">Auto-save</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={undo} 
                  disabled={!canUndo}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={redo} 
                  disabled={!canRedo}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                
                {uiState.isDirty && (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Unsaved changes
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="trip-data" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="trip-data">Trip Data</TabsTrigger>
            <TabsTrigger value="selections">Selections</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>
          
          {/* Trip Data Tab */}
          <TabsContent value="trip-data" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Trip Information</CardTitle>
                  <CardDescription>Core trip details and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Trip Name</Label>
                    <Input
                      value={tripData.name}
                      onChange={(e) => updateTripDetails({ name: e.target.value })}
                      placeholder="Enter trip name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Primary Destination</Label>
                    <Input
                      value={tripData.primaryDestination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Enter destination"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Additional Destinations</Label>
                    <div className="flex flex-wrap gap-2">
                      {tripData.additionalDestinations.map((dest, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {dest}
                          <button onClick={() => removeDestination(dest)}>
                            <Minus className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addDestination('London')}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add London
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Adults</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTravelers({ 
                            adults: Math.max(1, tripData.travelers.adults - 1) 
                          })}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{tripData.travelers.adults}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTravelers({ 
                            adults: tripData.travelers.adults + 1 
                          })}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Children</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTravelers({ 
                            children: Math.max(0, tripData.travelers.children - 1) 
                          })}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{tripData.travelers.children}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTravelers({ 
                            children: tripData.travelers.children + 1 
                          })}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <div className="text-center">
                        <span className="text-lg font-medium">{tripData.duration} days</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common operations for testing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={handleAddMockData} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sample Trip Data
                  </Button>
                  
                  <Button 
                    onClick={handleSaveTrip} 
                    variant="outline" 
                    className="w-full"
                    disabled={uiState.isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Trip
                  </Button>
                  
                  <Button 
                    onClick={handleCalculatePricing} 
                    variant="outline" 
                    className="w-full"
                    disabled={pricing.isCalculating}
                  >
                    {pricing.isCalculating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <DollarSign className="h-4 w-4 mr-2" />
                    )}
                    Calculate Pricing
                  </Button>
                  
                  <Button 
                    onClick={resetTrip} 
                    variant="destructive" 
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Trip
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Selections Tab */}
          <TabsContent value="selections" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Accommodations ({selectedItems.accommodations.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedItems.accommodations.map((acc) => (
                    <div key={acc.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{acc.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {acc.pricing.currency} {acc.pricing.perNight}/night
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAccommodation(acc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {selectedItems.accommodations.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No accommodations selected
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Activities ({selectedItems.activities.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedItems.activities.map((act) => (
                    <div key={act.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{act.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {act.pricing.currency} {act.totalPrice}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeActivity(act.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {selectedItems.activities.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No activities selected
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Transportation ({selectedItems.transportation.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedItems.transportation.map((trans) => (
                    <div key={trans.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{trans.from} → {trans.to}</div>
                        <div className="text-sm text-muted-foreground">
                          {trans.pricing.currency} {trans.pricing.total}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTransportation(trans.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {selectedItems.transportation.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No transportation selected
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Pricing</CardTitle>
                <CardDescription>Real-time pricing calculation results</CardDescription>
              </CardHeader>
              <CardContent>
                {pricing.current ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {pricing.current.total.currency} {pricing.current.total.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Trip Cost • {(pricing.current.confidence * 100).toFixed(0)}% confidence
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="font-medium">Accommodations</div>
                        <div className="text-lg">
                          {pricing.current.breakdown.accommodations.currency} {pricing.current.breakdown.accommodations.amount}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Activities</div>
                        <div className="text-lg">
                          {pricing.current.breakdown.activities.currency} {pricing.current.breakdown.activities.amount}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Transportation</div>
                        <div className="text-lg">
                          {pricing.current.breakdown.transportation.currency} {pricing.current.breakdown.transportation.amount}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Meals</div>
                        <div className="text-lg">
                          {pricing.current.breakdown.meals.currency} {pricing.current.breakdown.meals.amount}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Miscellaneous</div>
                        <div className="text-lg">
                          {pricing.current.breakdown.miscellaneous.currency} {pricing.current.breakdown.miscellaneous.amount}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      Last updated: {pricing.current.timestamp.toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No pricing calculated yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Import/Export</CardTitle>
                  <CardDescription>Backup and restore trip data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleExport} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Trip Data
                  </Button>
                  
                  <div className="space-y-2">
                    <Label>Import Trip Data</Label>
                    <textarea
                      className="w-full h-32 p-2 border rounded text-sm font-mono"
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder="Paste JSON trip data here..."
                    />
                    <Button 
                      onClick={handleImport} 
                      className="w-full"
                      disabled={!importData.trim()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Trip Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>History & Errors</CardTitle>
                  <CardDescription>Undo/redo history and error messages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Past states: {state.history.past.length}</span>
                      <span>Future states: {state.history.future.length}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={undo} 
                        disabled={!canUndo}
                        className="flex-1"
                      >
                        <Undo2 className="h-4 w-4 mr-2" />
                        Undo ({state.history.past.length})
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={redo} 
                        disabled={!canRedo}
                        className="flex-1"
                      >
                        <Redo2 className="h-4 w-4 mr-2" />
                        Redo ({state.history.future.length})
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label>Current Errors</Label>
                    {Object.keys(uiState.errors).length > 0 ? (
                      <div className="space-y-1">
                        {Object.entries(uiState.errors).map(([field, message]) => (
                          <Alert key={field} variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>{field}:</strong> {message}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>No errors</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Debug Tab */}
          <TabsContent value="debug" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Full State Debug</CardTitle>
                <CardDescription>Complete state object for debugging</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">
                  {safeStringify(state)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main page component with provider
export default function StateManagementDemo() {
  return (
    <TripCustomizationProvider
      autoSaveInterval={10000} // 10 seconds for demo
      enablePersistence={true}
    >
      <TripCustomizationDemo />
    </TripCustomizationProvider>
  )
} 