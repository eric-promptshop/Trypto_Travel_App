"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Plane, 
  Clock,
  Star,
  ArrowRight,
  Globe,
  Camera,
  Heart,
  Share2,
  MoreHorizontal,
  Edit3,
  Eye,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Trip {
  id: string
  name: string
  destination: string
  description: string
  startDate: string
  endDate: string
  status: 'planning' | 'upcoming' | 'ongoing' | 'completed'
  budget: number
  spent: number
  image: string
  travelers: number
  progress: number
  isShared: boolean
  lastUpdated: string
}

interface TravelStats {
  totalTrips: number
  upcomingTrips: number
  totalSpent: number
  totalBudget: number
  favoriteDestination: string
  totalDays: number
}

const mockTrips: Trip[] = [
  {
    id: '1',
    name: 'Peru Adventure',
    destination: 'Cusco, Peru',
    description: 'Explore ancient Incan ruins and vibrant culture in the heart of South America',
    startDate: '2024-03-15',
    endDate: '2024-03-22',
    status: 'upcoming',
    budget: 2500,
    spent: 1800,
    image: '/images/machu-picchu.png',
    travelers: 2,
    progress: 85,
    isShared: true,
    lastUpdated: '2024-01-15'
  },
  {
    id: '2',
    name: 'Brazilian Discovery',
    destination: 'Rio de Janeiro, Brazil',
    description: 'From Rio de Janeiro to the Amazon rainforest - a complete Brazilian experience',
    startDate: '2024-05-10',
    endDate: '2024-05-20',
    status: 'planning',
    budget: 3200,
    spent: 0,
    image: '/images/rio-de-janeiro.png',
    travelers: 1,
    progress: 35,
    isShared: false,
    lastUpdated: '2024-01-12'
  },
  {
    id: '3',
    name: 'Sacred Valley Trek',
    destination: 'Sacred Valley, Peru',
    description: 'Hiking adventure through Peru\'s mystical landscapes and ancient sites',
    startDate: '2024-01-05',
    endDate: '2024-01-10',
    status: 'completed',
    budget: 1800,
    spent: 1650,
    image: '/images/sacred-valley.png',
    travelers: 3,
    progress: 100,
    isShared: true,
    lastUpdated: '2024-01-10'
  }
]

const mockStats: TravelStats = {
  totalTrips: 8,
  upcomingTrips: 2,
  totalSpent: 12500,
  totalBudget: 15000,
  favoriteDestination: 'Peru',
  totalDays: 45
}

export function TravelDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [trips, setTrips] = useState<Trip[]>(mockTrips)
  const [stats, setStats] = useState<TravelStats>(mockStats)

  const getStatusColor = (status: Trip['status']) => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ongoing':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: Trip['status']) => {
    switch (status) {
      case 'planning':
        return <Edit3 className="w-3 h-3" />
      case 'upcoming':
        return <Calendar className="w-3 h-3" />
      case 'ongoing':
        return <Plane className="w-3 h-3" />
      case 'completed':
        return <Star className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Travel Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Plan, track, and manage your adventures
              </p>
            </div>
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link href="/plan">
                <Plus className="w-5 h-5 mr-2" />
                Plan New Trip
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Trips</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalTrips}</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Upcoming</p>
                  <p className="text-3xl font-bold text-green-900">{stats.upcomingTrips}</p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <Plane className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Total Spent</p>
                  <p className="text-3xl font-bold text-purple-900">
                    ${stats.totalSpent.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Travel Days</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.totalDays}</p>
                </div>
                <div className="p-3 bg-orange-200 rounded-full">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Quick Actions</CardTitle>
                  <CardDescription>
                    Get started with your travel planning
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto p-6 flex flex-col items-center gap-3" asChild>
                    <Link href="/plan">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <Plus className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">Create New Trip</p>
                        <p className="text-sm text-gray-600">Start planning your next adventure</p>
                      </div>
                    </Link>
                  </Button>

                  <Button variant="outline" className="h-auto p-6 flex flex-col items-center gap-3" asChild>
                    <Link href="/demo">
                      <div className="p-3 bg-green-100 rounded-full">
                        <Eye className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">Explore Demo</p>
                        <p className="text-sm text-gray-600">See what's possible</p>
                      </div>
                    </Link>
                  </Button>

                  <Button variant="outline" className="h-auto p-6 flex flex-col items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Share2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Import Itinerary</p>
                      <p className="text-sm text-gray-600">Upload existing plans</p>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Trips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {trips.slice(0, 6).map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                    {/* Trip Image */}
                    <div className="relative h-48 overflow-hidden">
                      <div 
                        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                        style={{ 
                          backgroundImage: `url(${trip.image})`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover'
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Status Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge className={cn("border", getStatusColor(trip.status))}>
                          {getStatusIcon(trip.status)}
                          <span className="ml-1 capitalize">{trip.status}</span>
                        </Badge>
                      </div>

                      {/* Share Badge */}
                      {trip.isShared && (
                        <div className="absolute top-4 right-4">
                          <Badge variant="secondary" className="bg-white/90 text-gray-700">
                            <Share2 className="w-3 h-3 mr-1" />
                            Shared
                          </Badge>
                        </div>
                      )}

                      {/* Trip Info Overlay */}
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="text-lg font-semibold mb-1">{trip.name}</h3>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>{trip.destination}</span>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{trip.description}</p>
                      
                      {/* Trip Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                          </div>
                          <span className="text-gray-500">{calculateDays(trip.startDate, trip.endDate)} days</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{trip.travelers} {trip.travelers === 1 ? 'traveler' : 'travelers'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>${trip.spent.toLocaleString()} / ${trip.budget.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Planning Progress</span>
                            <span className="text-gray-900 font-medium">{trip.progress}%</span>
                          </div>
                          <Progress value={trip.progress} className="h-2" />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="flex-1" asChild>
                          <Link href={`/trip/${trip.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Trip
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {trips.filter(trip => trip.status === 'upcoming' || trip.status === 'planning').map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  {/* Same trip card structure as above */}
                  <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                    <div className="relative h-48 overflow-hidden">
                      <div 
                        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                        style={{ 
                          backgroundImage: `url(${trip.image})`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover'
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      <div className="absolute top-4 left-4">
                        <Badge className={cn("border", getStatusColor(trip.status))}>
                          {getStatusIcon(trip.status)}
                          <span className="ml-1 capitalize">{trip.status}</span>
                        </Badge>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="text-lg font-semibold mb-1">{trip.name}</h3>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>{trip.destination}</span>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(trip.startDate)}</span>
                          </div>
                          <span className="text-blue-600 font-medium">
                            {Math.ceil((new Date(trip.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days to go
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Planning Progress</span>
                            <span className="text-gray-900 font-medium">{trip.progress}%</span>
                          </div>
                          <Progress value={trip.progress} className="h-2" />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <Button size="sm" className="flex-1" asChild>
                          <Link href={`/trip/${trip.id}`}>
                            Continue Planning
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {trips.filter(trip => trip.status === 'completed').map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                    <div className="relative h-48 overflow-hidden">
                      <div 
                        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                        style={{ 
                          backgroundImage: `url(${trip.image})`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover'
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      <div className="absolute top-4 left-4">
                        <Badge className={cn("border", getStatusColor(trip.status))}>
                          {getStatusIcon(trip.status)}
                          <span className="ml-1 capitalize">{trip.status}</span>
                        </Badge>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="text-lg font-semibold mb-1">{trip.name}</h3>
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>Trip completed</span>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <p className="text-gray-600 text-sm line-clamp-2">{trip.description}</p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total spent</span>
                          <span className="text-gray-900 font-medium">${trip.spent.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Camera className="w-4 h-4 mr-2" />
                          View Memories
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 