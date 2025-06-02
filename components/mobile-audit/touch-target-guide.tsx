'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Minus, X, ChevronLeft, ChevronRight } from 'lucide-react'

export function TouchTargetGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Touch Target Size Comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visual Grid Reference */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-4">
              The grid shows 44x44px squares - the minimum recommended touch target size
            </p>
            <div 
              className="relative bg-white border border-gray-300 rounded"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(0deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 44px),
                  repeating-linear-gradient(90deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 44px)
                `,
                height: '220px',
                width: '100%',
                maxWidth: '440px'
              }}
            >
              {/* Current Implementation (Bad) */}
              <div className="absolute top-4 left-4">
                <p className="text-xs font-semibold text-red-600 mb-2">Current (Too Small)</p>
                <div className="flex gap-2">
                  <button className="w-8 h-8 bg-red-100 border-2 border-red-500 rounded flex items-center justify-center">
                    <Minus className="w-4 h-4 text-red-700" />
                  </button>
                  <button className="w-8 h-8 bg-red-100 border-2 border-red-500 rounded flex items-center justify-center">
                    <Plus className="w-4 h-4 text-red-700" />
                  </button>
                  <button className="w-6 h-6 bg-red-100 border-2 border-red-500 rounded flex items-center justify-center">
                    <X className="w-3 h-3 text-red-700" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">32x32px, 24x24px</p>
              </div>

              {/* Recommended Implementation (Good) */}
              <div className="absolute top-4 right-4">
                <p className="text-xs font-semibold text-green-600 mb-2">Recommended</p>
                <div className="flex gap-2">
                  <button 
                    className="w-11 h-11 bg-green-100 border-2 border-green-500 rounded flex items-center justify-center"
                    style={{ width: '44px', height: '44px' }}
                  >
                    <Minus className="w-5 h-5 text-green-700" />
                  </button>
                  <button 
                    className="w-11 h-11 bg-green-100 border-2 border-green-500 rounded flex items-center justify-center"
                    style={{ width: '44px', height: '44px' }}
                  >
                    <Plus className="w-5 h-5 text-green-700" />
                  </button>
                  <button 
                    className="w-11 h-11 bg-green-100 border-2 border-green-500 rounded flex items-center justify-center"
                    style={{ width: '44px', height: '44px' }}
                  >
                    <X className="w-5 h-5 text-green-700" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">44x44px minimum</p>
              </div>

              {/* Visual Touch Area Demonstration */}
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs font-semibold text-blue-600 mb-2">Touch Area Overlay</p>
                <div className="flex justify-around items-center">
                  {/* Small button with extended touch area */}
                  <div className="relative">
                    <button className="w-8 h-8 bg-blue-500 text-white rounded flex items-center justify-center relative z-10">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div 
                      className="absolute inset-0 border-2 border-blue-300 border-dashed rounded-lg"
                      style={{
                        width: '44px',
                        height: '44px',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                    <p className="text-xs text-center mt-2">Extended</p>
                  </div>

                  {/* Native 44px button */}
                  <div className="relative">
                    <button 
                      className="bg-blue-500 text-white rounded flex items-center justify-center"
                      style={{ width: '44px', height: '44px' }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <p className="text-xs text-center mt-2">Native</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Common Issues */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Common Touch Target Issues Found:</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-900">Counter Buttons</p>
                  <p className="text-sm text-red-700">h-8 w-8 (32x32px)</p>
                </div>
                <span className="text-red-600 font-semibold">Too Small</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-900">Day Indicators</p>
                  <p className="text-sm text-yellow-700">w-12 h-12 (48x48px)</p>
                </div>
                <span className="text-yellow-600 font-semibold">Borderline</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">Primary Buttons</p>
                  <p className="text-sm text-green-700">Default button height with padding</p>
                </div>
                <span className="text-green-600 font-semibold">Acceptable</span>
              </div>
            </div>
          </div>

          {/* Implementation Tips */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Implementation Tips:</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Use min-w-[44px] min-h-[44px] for all interactive elements</li>
              <li>• Consider using padding to extend touch areas without changing visual size</li>
              <li>• Test with real devices, not just browser emulation</li>
              <li>• Remember that older users may need even larger targets (48-52px)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 