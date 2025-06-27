'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Eye, Users, TrendingUp } from 'lucide-react'

interface TourAnalyticsDashboardProps {
  operatorName: string
}

export function TourAnalyticsDashboard({ operatorName }: TourAnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tour Performance Analytics</CardTitle>
          <CardDescription>
            Track how your tours are performing with travelers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Eye className="h-8 w-8 text-blue-600" />
                <span className="text-sm text-blue-600">+15%</span>
              </div>
              <h3 className="text-2xl font-bold">12,345</h3>
              <p className="text-sm text-gray-600">Total Views</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-green-600" />
                <span className="text-sm text-green-600">+23%</span>
              </div>
              <h3 className="text-2xl font-bold">89</h3>
              <p className="text-sm text-gray-600">Leads Generated</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <span className="text-sm text-purple-600">+8%</span>
              </div>
              <h3 className="text-2xl font-bold">4.2%</h3>
              <p className="text-sm text-gray-600">Conversion Rate</p>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Detailed Analytics Coming Soon</h3>
            <p className="text-gray-600">
              Advanced charts and insights will be available here to help you optimize your tours
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Tours</CardTitle>
          <CardDescription>Your most viewed and booked tours this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Sunset City Tour</h4>
                <p className="text-sm text-gray-600">234 views • 12 bookings</p>
              </div>
              <span className="text-green-600 font-semibold">5.1%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Historical Walking Tour</h4>
                <p className="text-sm text-gray-600">189 views • 8 bookings</p>
              </div>
              <span className="text-green-600 font-semibold">4.2%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Food & Wine Experience</h4>
                <p className="text-sm text-gray-600">156 views • 6 bookings</p>
              </div>
              <span className="text-green-600 font-semibold">3.8%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}