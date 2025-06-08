"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, PieChart } from 'lucide-react'

// Placeholder data structures for future development
interface CostBreakdown {
  category: string
  budgeted: number
  actual: number
  currency: string
  percentage: number
}

interface TripCost {
  totalBudget: number
  totalSpent: number
  currency: string
  breakdown: CostBreakdown[]
  savingsOpportunities: {
    category: string
    potentialSavings: number
    recommendation: string
  }[]
}

// Mock data for development
const mockTripCost: TripCost = {
  totalBudget: 5000,
  totalSpent: 3250,
  currency: 'USD',
  breakdown: [
    {
      category: 'Flights',
      budgeted: 1500,
      actual: 1200,
      currency: 'USD',
      percentage: 37
    },
    {
      category: 'Accommodation',
      budgeted: 2000,
      actual: 1600,
      currency: 'USD',
      percentage: 49
    },
    {
      category: 'Activities',
      budgeted: 800,
      actual: 350,
      currency: 'USD',
      percentage: 11
    },
    {
      category: 'Food & Dining',
      budgeted: 500,
      actual: 100,
      currency: 'USD',
      percentage: 3
    },
    {
      category: 'Transportation',
      budgeted: 200,
      actual: 0,
      currency: 'USD',
      percentage: 0
    }
  ],
  savingsOpportunities: [
    {
      category: 'Accommodation',
      potentialSavings: 300,
      recommendation: 'Consider booking accommodations 2 weeks earlier for better rates'
    },
    {
      category: 'Activities',
      potentialSavings: 150,
      recommendation: 'Bundle activity bookings for group discounts'
    }
  ]
}

interface TripCostViewProps {
  tripId?: string
  editable?: boolean
  onUpdateBudget?: (category: string, newBudget: number) => void
}

export function TripCostView({ tripId, editable = false, onUpdateBudget }: TripCostViewProps) {
  const costData = mockTripCost // TODO: Replace with API call using tripId
  const budgetUsedPercentage = (costData.totalSpent / costData.totalBudget) * 100
  const remainingBudget = costData.totalBudget - costData.totalSpent

  const getBudgetStatus = () => {
    if (budgetUsedPercentage < 70) return { color: 'text-green-600', icon: TrendingDown }
    if (budgetUsedPercentage < 90) return { color: 'text-yellow-600', icon: TrendingUp }
    return { color: 'text-red-600', icon: AlertTriangle }
  }

  const budgetStatus = getBudgetStatus()
  const StatusIcon = budgetStatus.icon

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Trip Budget Overview
          </CardTitle>
          <CardDescription>
            Track your spending and stay within budget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ${costData.totalBudget.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Budget</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${costData.totalSpent.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Spent So Far</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(remainingBudget).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                {remainingBudget >= 0 ? 'Remaining' : 'Over Budget'}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Budget Used</span>
              <span className={`text-sm font-medium flex items-center gap-1 ${budgetStatus.color}`}>
                <StatusIcon className="h-4 w-4" />
                {budgetUsedPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={budgetUsedPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {costData.breakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{item.category}</span>
                    <Badge variant={item.actual <= item.budgeted ? "default" : "destructive"}>
                      ${item.actual.toLocaleString()} / ${item.budgeted.toLocaleString()}
                    </Badge>
                  </div>
                  <Progress 
                    value={(item.actual / item.budgeted) * 100} 
                    className="h-2" 
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{((item.actual / item.budgeted) * 100).toFixed(1)}% of budget</span>
                    <span>{item.percentage}% of total</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Savings Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Savings Opportunities</CardTitle>
          <CardDescription>
            Ways to optimize your trip budget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {costData.savingsOpportunities.map((opportunity, index) => (
              <div key={index} className="p-3 border rounded-lg bg-green-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-green-800">{opportunity.category}</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Save ${opportunity.potentialSavings}
                  </Badge>
                </div>
                <p className="text-sm text-green-700">{opportunity.recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TripCostView 