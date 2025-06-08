"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MapPin, 
  Calendar,
  DollarSign,
  Clock,
  Star,
  Target,
  Activity,
  Globe,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from 'lucide-react'
import { motion } from 'framer-motion'

interface AnalyticsDashboardProps {
  dateRange?: {
    start: string
    end: string
  }
  className?: string
}

// Mock data - in a real implementation, this would come from your analytics API
const mockTripData = [
  { month: 'Jan', trips: 45, revenue: 12500, avgDuration: 7 },
  { month: 'Feb', trips: 52, revenue: 15200, avgDuration: 6 },
  { month: 'Mar', trips: 67, revenue: 18900, avgDuration: 8 },
  { month: 'Apr', trips: 78, revenue: 22400, avgDuration: 7 },
  { month: 'May', trips: 89, revenue: 26800, avgDuration: 9 },
  { month: 'Jun', trips: 95, revenue: 31200, avgDuration: 10 }
]

const destinationData = [
  { name: 'Europe', value: 35, color: '#8884d8' },
  { name: 'Asia', value: 28, color: '#82ca9d' },
  { name: 'North America', value: 20, color: '#ffc658' },
  { name: 'South America', value: 10, color: '#ff7c7c' },
  { name: 'Africa', value: 4, color: '#8dd1e1' },
  { name: 'Oceania', value: 3, color: '#d084d0' }
]

const userEngagementData = [
  { day: 'Mon', users: 1200, sessions: 1800, conversion: 12 },
  { day: 'Tue', users: 1400, sessions: 2100, conversion: 15 },
  { day: 'Wed', users: 1600, sessions: 2400, conversion: 18 },
  { day: 'Thu', users: 1350, sessions: 1950, conversion: 14 },
  { day: 'Fri', users: 1800, sessions: 2700, conversion: 22 },
  { day: 'Sat', users: 2200, sessions: 3300, conversion: 28 },
  { day: 'Sun', users: 1900, sessions: 2850, conversion: 25 }
]

const performanceMetrics = {
  totalUsers: 15420,
  totalTrips: 426,
  totalRevenue: 127200,
  avgTripValue: 298,
  conversionRate: 18.5,
  customerSatisfaction: 4.7,
  repeatingCustomers: 65,
  averageResponseTime: 1.2
}

const recentTrends = [
  { metric: 'Trip Bookings', change: 12.5, period: 'vs last month', positive: true },
  { metric: 'User Registrations', change: 8.3, period: 'vs last month', positive: true },
  { metric: 'Average Trip Value', change: -3.2, period: 'vs last month', positive: false },
  { metric: 'Customer Satisfaction', change: 0.2, period: 'vs last month', positive: true },
]

export function AnalyticsDashboard({ 
  dateRange,
  className = ""
}: AnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [isLoading, setIsLoading] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number' 
  }: {
    title: string
    value: number
    change?: number
    icon: any
    format?: 'number' | 'currency' | 'percentage' | 'rating'
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency': return formatCurrency(val)
        case 'percentage': return `${val}%`
        case 'rating': return `${val}/5`
        default: return val.toLocaleString()
      }
    }

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
              {change !== undefined && (
                <div className="flex items-center mt-1">
                  {change > 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(Math.abs(change))}
                  </span>
                </div>
              )}
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Insights into your travel platform performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={performanceMetrics.totalUsers}
          change={8.3}
          icon={Users}
        />
        <StatCard
          title="Total Revenue"
          value={performanceMetrics.totalRevenue}
          change={12.5}
          icon={DollarSign}
          format="currency"
        />
        <StatCard
          title="Conversion Rate"
          value={performanceMetrics.conversionRate}
          change={2.1}
          icon={Target}
          format="percentage"
        />
        <StatCard
          title="Satisfaction"
          value={performanceMetrics.customerSatisfaction}
          change={0.2}
          icon={Star}
          format="rating"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Bookings Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Trip Bookings Trend
            </CardTitle>
            <CardDescription>
              Monthly trip bookings and revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockTripData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value as number) : value,
                    name === 'revenue' ? 'Revenue' : 'Trips'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="trips" 
                  stackId="1"
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="2"
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Destinations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Popular Destinations
            </CardTitle>
            <CardDescription>
              Trip distribution by region
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={destinationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {destinationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Engagement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            User Engagement
          </CardTitle>
          <CardDescription>
            Daily active users and conversion rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={userEngagementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="users" orientation="left" />
              <YAxis yAxisId="conversion" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'conversion' ? `${value}%` : value,
                  name === 'conversion' ? 'Conversion Rate' : 
                  name === 'sessions' ? 'Sessions' : 'Users'
                ]}
              />
              <Bar yAxisId="users" dataKey="users" fill="#8884d8" opacity={0.6} />
              <Bar yAxisId="users" dataKey="sessions" fill="#82ca9d" opacity={0.6} />
              <Line 
                yAxisId="conversion" 
                type="monotone" 
                dataKey="conversion" 
                stroke="#ff7c7c" 
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Trends
            </CardTitle>
            <CardDescription>
              Key performance indicators and their changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTrends.map((trend, index) => (
                <motion.div
                  key={trend.metric}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{trend.metric}</p>
                    <p className="text-sm text-gray-600">{trend.period}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {trend.positive ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`font-semibold ${
                        trend.positive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(trend.change)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Avg Trip Value</span>
                <span className="font-semibold">{formatCurrency(performanceMetrics.avgTripValue)}</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Repeat Customers</span>
                <span className="font-semibold">{performanceMetrics.repeatingCustomers}%</span>
              </div>
              <Progress value={performanceMetrics.repeatingCustomers} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="font-semibold">{performanceMetrics.averageResponseTime}s</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>

            <Separator />

            <div className="text-center pt-2">
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                <TrendingUp className="h-3 w-3 mr-1" />
                Performance: Excellent
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights (Mock) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>
            Automated insights and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Peak Booking Time</h4>
              <p className="text-sm text-blue-700">
                Most users book trips on weekends between 2-6 PM. Consider running campaigns during these hours.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Price Optimization</h4>
              <p className="text-sm text-green-700">
                European destinations are showing 15% higher conversion rates. Consider promoting these packages.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-2">User Retention</h4>
              <p className="text-sm text-purple-700">
                Users who complete profile setup are 3x more likely to book. Improve onboarding flow.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 