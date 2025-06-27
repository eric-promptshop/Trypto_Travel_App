'use client'

import React, { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Hand, Smartphone, Settings, Move, Target, Zap } from 'lucide-react'
import { useOneHandedMode } from '@/hooks/use-one-handed-mode'

interface OneHandedModeSettings {
  enabled: boolean
  autoDetect: boolean
  floatingButtonPosition: 'left' | 'right'
  adaptiveLayout: boolean
  uiScale: number
  swipeGestures: boolean
  hapticFeedback: boolean
}

interface DeviceInfo {
  screenWidth: number
  screenHeight: number
  isLargeDevice: boolean
  isPortrait: boolean
  pixelRatio: number
}

const TouchZoneVisualizer: React.FC<{ settings: OneHandedModeSettings }> = ({ settings }) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    screenWidth: 0,
    screenHeight: 0,
    isLargeDevice: false,
    isPortrait: true,
    pixelRatio: 1
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setDeviceInfo({
        screenWidth: width,
        screenHeight: height,
        isLargeDevice: width >= 768 || height >= 1024,
        isPortrait: height > width,
        pixelRatio: window.devicePixelRatio || 1
      })
    }
    
    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    return () => window.removeEventListener('resize', updateDeviceInfo)
  }, [])

  const getThumbReachabilityZones = () => {
    const { screenHeight } = deviceInfo
    return {
      easy: { top: screenHeight * 0.6, color: 'bg-green-200 dark:bg-green-900' },
      stretch: { top: screenHeight * 0.3, color: 'bg-yellow-200 dark:bg-yellow-900' },
      difficult: { top: 0, color: 'bg-red-200 dark:bg-red-900' }
    }
  }

  const zones = getThumbReachabilityZones()

  return (
    <div className="relative">
      <h4 className="text-sm font-medium mb-3">Thumb Reachability Zones</h4>
      <div className="relative w-32 h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border">
        {/* Difficult zone */}
        <div 
          className={`absolute w-full ${zones.difficult.color} opacity-30`}
          style={{ 
            top: zones.difficult.top, 
            height: zones.stretch.top - zones.difficult.top 
          }}
        />
        
        {/* Stretch zone */}
        <div 
          className={`absolute w-full ${zones.stretch.color} opacity-30`}
          style={{ 
            top: zones.stretch.top, 
            height: zones.easy.top - zones.stretch.top 
          }}
        />
        
        {/* Easy zone */}
        <div 
          className={`absolute w-full ${zones.easy.color} opacity-30`}
          style={{ 
            top: zones.easy.top, 
            height: 192 - zones.easy.top 
          }}
        />

        {/* Thumb indicator */}
        <div 
          className={`absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg`}
          style={{ 
            bottom: '8px', 
            [settings.floatingButtonPosition]: '8px',
            transform: `scale(${settings.uiScale})` 
          }}
        />

        {/* Labels */}
        <div className="absolute top-2 left-2 text-xs text-gray-600 dark:text-gray-400">
          Difficult
        </div>
        <div className="absolute top-1/2 left-2 text-xs text-gray-600 dark:text-gray-400">
          Stretch
        </div>
        <div className="absolute bottom-8 left-2 text-xs text-gray-600 dark:text-gray-400">
          Easy
        </div>
      </div>
      
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-green-200 dark:bg-green-900 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Easy reach (60-100%)</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-yellow-200 dark:bg-yellow-900 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Stretch required (30-60%)</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-red-200 dark:bg-red-900 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Difficult (0-30%)</span>
        </div>
      </div>
    </div>
  )
}

const DeviceStatusIndicator: React.FC = () => {
  const oneHandedMode = useOneHandedMode()
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    screenWidth: 0,
    screenHeight: 0,
    isLargeDevice: false,
    isPortrait: true,
    pixelRatio: 1
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setDeviceInfo({
        screenWidth: width,
        screenHeight: height,
        isLargeDevice: width >= 768 || height >= 1024,
        isPortrait: height > width,
        pixelRatio: window.devicePixelRatio || 1
      })
    }
    
    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    return () => window.removeEventListener('resize', updateDeviceInfo)
  }, [])

  const getDeviceTypeText = () => {
    if (deviceInfo.screenWidth < 500) return 'Small Phone'
    if (deviceInfo.screenWidth < 768) return 'Large Phone'
    if (deviceInfo.screenWidth < 1024) return 'Tablet'
    return 'Desktop'
  }

  const getOneHandedStatus = () => {
    if (oneHandedMode) return 'Active'
    if (deviceInfo.screenWidth < 500) return 'Auto-Enabled'
    return 'Inactive'
  }

  const getStatusColor = () => {
    const status = getOneHandedStatus()
    if (status === 'Active') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (status === 'Auto-Enabled') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <div>
          <div className="text-sm font-medium">Current Device</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {getDeviceTypeText()} • {deviceInfo.screenWidth}×{deviceInfo.screenHeight}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">One-Handed Mode Status:</span>
        <Badge className={getStatusColor()}>
          <Hand className="w-3 h-3 mr-1" />
          {getOneHandedStatus()}
        </Badge>
      </div>
      
      {deviceInfo.isLargeDevice && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/50 rounded-md">
          <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm text-amber-800 dark:text-amber-200">
            Large device detected - one-handed mode recommended
          </span>
        </div>
      )}
    </div>
  )
}

export function OneHandedSettings() {
  const oneHandedMode = useOneHandedMode()
  
  const [settings, setSettings] = useState<OneHandedModeSettings>({
    enabled: false,
    autoDetect: true,
    floatingButtonPosition: 'right',
    adaptiveLayout: true,
    uiScale: 1,
    swipeGestures: true,
    hapticFeedback: true
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('oneHandedSettings')
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
    localStorage.setItem('oneHandedSettings', JSON.stringify(settings))
    
    // Apply CSS classes to body for global styling
    if (settings.enabled || oneHandedMode) {
      document.body.classList.add('one-handed-mode')
    } else {
      document.body.classList.remove('one-handed-mode')
    }
    
    // Apply UI scaling
    if (settings.uiScale !== 1) {
      document.documentElement.style.setProperty('--one-handed-ui-scale', settings.uiScale.toString())
    } else {
      document.documentElement.style.removeProperty('--one-handed-ui-scale')
    }
  }, [settings, oneHandedMode])

  const testOneHandedMode = () => {
    // Temporarily enable one-handed mode for testing
    document.body.classList.add('one-handed-mode', 'one-handed-test')
    
    // Remove test class after 3 seconds
    setTimeout(() => {
      document.body.classList.remove('one-handed-test')
      if (!settings.enabled && !oneHandedMode) {
        document.body.classList.remove('one-handed-mode')
      }
    }, 3000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hand className="w-5 h-5" />
            One-Handed Mode Status
          </CardTitle>
          <CardDescription>
            Monitor device compatibility and current one-handed mode status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeviceStatusIndicator />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            One-Handed Mode Settings
          </CardTitle>
          <CardDescription>
            Customize one-handed operation for easier thumb access on large devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="one-handed-enabled" className="text-sm font-medium">
                Enable One-Handed Mode
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Manually enable one-handed optimizations
              </p>
            </div>
            <Switch
              id="one-handed-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-detect" className="text-sm font-medium">
                Auto-detect Large Devices
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically enable for tablets and large phones
              </p>
            </div>
            <Switch
              id="auto-detect"
              checked={settings.autoDetect}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, autoDetect: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="adaptive-layout" className="text-sm font-medium">
                Adaptive Layout
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically reposition UI elements for thumb access
              </p>
            </div>
            <Switch
              id="adaptive-layout"
              checked={settings.adaptiveLayout}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, adaptiveLayout: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="swipe-gestures" className="text-sm font-medium">
                Swipe Gestures
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enable swipe navigation for common actions
              </p>
            </div>
            <Switch
              id="swipe-gestures"
              checked={settings.swipeGestures}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, swipeGestures: checked }))
              }
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">Floating Button Position</Label>
            <RadioGroup
              value={settings.floatingButtonPosition}
              onValueChange={(value) =>
                setSettings(prev => ({
                  ...prev,
                  floatingButtonPosition: value as 'left' | 'right'
                }))
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="left" id="position-left" />
                <Label htmlFor="position-left" className="text-sm">
                  Left Side
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="right" id="position-right" />
                <Label htmlFor="position-right" className="text-sm">
                  Right Side
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">UI Scale</Label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(settings.uiScale * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.uiScale * 100]}
              onValueChange={(values) => {
                const value = values[0]
                if (typeof value === 'number') {
                  setSettings(prev => ({ ...prev, uiScale: value / 100 }))
                }
              }}
              min={80}
              max={120}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Scale touch targets for easier interaction
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={testOneHandedMode}
              variant="outline"
              className="w-full"
            >
              <Zap className="w-4 h-4 mr-2" />
              Test One-Handed Mode (3 seconds)
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Preview how the interface adapts with current settings
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Move className="w-5 h-5" />
            Thumb Reachability Guide
          </CardTitle>
          <CardDescription>
            Visual guide showing optimal placement zones for different device orientations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TouchZoneVisualizer settings={settings} />
        </CardContent>
      </Card>
    </div>
  )
} 