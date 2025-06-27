'use client'

import React, { useState, useEffect } from 'react'
import { useBatteryStatus } from '@/hooks/use-battery-status'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Battery, BatteryLow, Zap, Settings, Activity } from 'lucide-react'

interface BatterySettings {
  enableBatteryOptimization: boolean
  thresholds: {
    lowBattery: number
    mediumBattery: number
    highBattery: number
  }
  manualMode: 'high-performance' | 'balanced' | 'power-saver' | null
  chargingOptimization: boolean
}

interface BatteryIndicatorProps {
  level: number | null
  charging: boolean | null
}

const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({ level, charging }) => {
  if (level === null) return null
  
  const percentage = Math.round(level * 100)
  
  const getColor = () => {
    if (level <= 0.15) return 'bg-red-500'
    if (level <= 0.30) return 'bg-orange-500'
    if (level <= 0.50) return 'bg-yellow-500'
    return 'bg-green-500'
  }
  
  const getIcon = () => {
    if (charging) return <Zap className="w-4 h-4 text-yellow-500" />
    if (level <= 0.15) return <BatteryLow className="w-4 h-4 text-red-500" />
    return <Battery className="w-4 h-4 text-gray-600 dark:text-gray-400" />
  }
  
  return (
    <div className="flex items-center gap-3">
      {getIcon()}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {percentage}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {charging ? 'Charging' : 'Discharging'}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${getColor()}`}
            style={{ width: `${percentage}%` }}
          />
          {charging && (
            <div className="absolute inset-0 bg-yellow-200 dark:bg-yellow-900 opacity-50 animate-pulse rounded-full" />
          )}
        </div>
      </div>
    </div>
  )
}

interface ThresholdSlidersProps {
  thresholds: BatterySettings['thresholds']
  onChange: (thresholds: BatterySettings['thresholds']) => void
}

const ThresholdSliders: React.FC<ThresholdSlidersProps> = ({ thresholds, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Low Battery Threshold</Label>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(thresholds.lowBattery * 100)}%
          </span>
        </div>
        <Slider
          value={[thresholds.lowBattery * 100]}
          onValueChange={(values) => {
            const value = values[0]
            if (typeof value === 'number') {
              onChange({ ...thresholds, lowBattery: value / 100 })
            }
          }}
          min={5}
          max={25}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Enable power saving features below this level
        </p>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Medium Battery Threshold</Label>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(thresholds.mediumBattery * 100)}%
          </span>
        </div>
        <Slider
          value={[thresholds.mediumBattery * 100]}
          onValueChange={(values) => {
            const value = values[0]
            if (typeof value === 'number') {
              onChange({ ...thresholds, mediumBattery: value / 100 })
            }
          }}
          min={20}
          max={40}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Reduce background activity below this level
        </p>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">High Battery Threshold</Label>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(thresholds.highBattery * 100)}%
          </span>
        </div>
        <Slider
          value={[thresholds.highBattery * 100]}
          onValueChange={(values) => {
            const value = values[0]
            if (typeof value === 'number') {
              onChange({ ...thresholds, highBattery: value / 100 })
            }
          }}
          min={40}
          max={70}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Normal operation above this level
        </p>
      </div>
    </div>
  )
}

export function BatterySettings() {
  const { level, charging, powerSaving } = useBatteryStatus()
  
  const [settings, setSettings] = useState<BatterySettings>({
    enableBatteryOptimization: true,
    thresholds: {
      lowBattery: 0.15,
      mediumBattery: 0.30,
      highBattery: 0.50
    },
    manualMode: null,
    chargingOptimization: true
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('batterySettings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (error) {
      }
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('batterySettings', JSON.stringify(settings))
  }, [settings])

  const getCurrentMode = () => {
    if (settings.manualMode) return settings.manualMode
    
    if (!settings.enableBatteryOptimization) return 'balanced'
    
    if (charging && settings.chargingOptimization) return 'high-performance'
    
    if (level !== null) {
      if (level <= settings.thresholds.lowBattery) return 'power-saver'
      if (level <= settings.thresholds.mediumBattery) return 'balanced'
      return 'high-performance'
    }
    
    return 'balanced'
  }

  const currentMode = getCurrentMode()

  const getModeDescription = (mode: string) => {
    switch (mode) {
      case 'high-performance':
        return 'Maximum performance with all features enabled'
      case 'balanced':
        return 'Optimal balance of performance and battery life'
      case 'power-saver':
        return 'Extended battery life with reduced performance'
      default:
        return 'Automatic based on battery level'
    }
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'high-performance':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'balanced':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'power-saver':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Battery className="w-5 h-5" />
            Battery Status
          </CardTitle>
          <CardDescription>
            Monitor your device's battery and performance status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {level !== null ? (
            <>
              <BatteryIndicator level={level} charging={charging} />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Mode:</span>
                <Badge className={getModeColor(currentMode)}>
                  <Activity className="w-3 h-3 mr-1" />
                  {currentMode.charAt(0).toUpperCase() + currentMode.slice(1).replace('-', ' ')}
                </Badge>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getModeDescription(currentMode)}
              </p>
              
              {powerSaving && (
                <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950/50 rounded-md">
                  <BatteryLow className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm text-orange-800 dark:text-orange-200">
                    Power saving mode is active
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Battery status not available on this device
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Battery Optimization Settings
          </CardTitle>
          <CardDescription>
            Customize how the app adapts to your device's battery status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="battery-optimization" className="text-sm font-medium">
                Enable Battery Optimization
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically adjust performance based on battery level
              </p>
            </div>
            <Switch
              id="battery-optimization"
              checked={settings.enableBatteryOptimization}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, enableBatteryOptimization: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="charging-optimization" className="text-sm font-medium">
                Enable Charging Optimization
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use high performance mode when device is charging
              </p>
            </div>
            <Switch
              id="charging-optimization"
              checked={settings.chargingOptimization}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, chargingOptimization: checked }))
              }
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">Performance Mode</Label>
            <RadioGroup
              value={settings.manualMode || 'auto'}
              onValueChange={(value) =>
                setSettings(prev => ({
                  ...prev,
                  manualMode: value === 'auto' ? null : value as any
                }))
              }
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="auto" id="auto" />
                <Label htmlFor="auto" className="text-sm">
                  Automatic (Based on Battery)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high-performance" id="high-performance" />
                <Label htmlFor="high-performance" className="text-sm">
                  High Performance
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="balanced" id="balanced" />
                <Label htmlFor="balanced" className="text-sm">
                  Balanced
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="power-saver" id="power-saver" />
                <Label htmlFor="power-saver" className="text-sm">
                  Power Saver
                </Label>
              </div>
            </RadioGroup>
          </div>

          {settings.enableBatteryOptimization && !settings.manualMode && (
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Battery Level Thresholds
              </Label>
              <ThresholdSliders
                thresholds={settings.thresholds}
                onChange={(newThresholds) =>
                  setSettings(prev => ({ ...prev, thresholds: newThresholds }))
                }
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 