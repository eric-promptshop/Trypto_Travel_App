"use client";

import React, { useState } from 'react';
import { ThumbZoneWrapper } from '@/components/ThumbZoneWrapper';
import { FloatingActionContainer } from '@/components/FloatingActionContainer';
import { OneHandedSettings } from '@/components/settings/OneHandedSettings';
import { Button } from "@/components/ui/button";

export default function OneHandedModePage() {
  const [oneHandedEnabled, setOneHandedEnabled] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    autoDetect: true,
    floatingButtonPosition: 'right' as 'left' | 'right',
    uiScale: 1
  });

  const handleToggleOneHanded = () => {
    const newEnabled = !oneHandedEnabled;
    setOneHandedEnabled(newEnabled);
    setSettings(prev => ({ ...prev, enabled: newEnabled }));
    
    // Apply or remove one-handed mode class
    if (newEnabled) {
      document.body.classList.add('one-handed-mode');
    } else {
      document.body.classList.remove('one-handed-mode');
    }
    
    // Apply UI scaling
    if (settings.uiScale !== 1) {
      document.documentElement.style.setProperty('--one-handed-ui-scale', settings.uiScale.toString());
    }
  };

  const updateSettings = (newSettings: any) => {
    setSettings(newSettings);
    
    // Update UI scale immediately
    if (newSettings.uiScale) {
      document.documentElement.style.setProperty('--one-handed-ui-scale', newSettings.uiScale.toString());
    }
  };

  return (
    <main className="min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            One-Handed Mode Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This demo showcases one-handed mode features that make the app easier to use with just your thumb on larger devices.
          </p>
          
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={handleToggleOneHanded}
              variant={oneHandedEnabled ? "destructive" : "default"}
              className="min-h-[44px] px-6"
            >
              {oneHandedEnabled ? 'Exit One-Handed Mode' : 'Enable One-Handed Mode'}
            </Button>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Status: {oneHandedEnabled ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <OneHandedSettings 
          settings={settings}
          onUpdateSettings={updateSettings}
        />

        {/* Demo Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Interactive Elements Demo
          </h2>
          
          <div className="space-y-6">
            {/* High Priority Actions */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                High Priority Actions (Always in thumb reach when enabled)
              </h3>
              <ThumbZoneWrapper priority="high">
                <Button variant="default" className="w-full">
                  Primary Action Button
                </Button>
              </ThumbZoneWrapper>
            </div>

            {/* Medium Priority Actions */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                Medium Priority Actions (Moved to bottom area)
              </h3>
              <ThumbZoneWrapper priority="medium">
                <div className="flex gap-3">
                  <Button variant="secondary">Edit</Button>
                  <Button variant="secondary">Share</Button>
                  <Button variant="secondary">Delete</Button>
                </div>
              </ThumbZoneWrapper>
            </div>

            {/* Low Priority Content */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                Low Priority Content (No repositioning)
              </h3>
              <ThumbZoneWrapper priority="low">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-300">
                    This content remains in its original position and doesn't get moved for one-handed access.
                    It represents secondary information that users don't need immediate thumb access to.
                  </p>
                </div>
              </ThumbZoneWrapper>
            </div>
          </div>
        </div>

        {/* Form Example */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Form Layout Example
          </h2>
          <div className="form-container space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full p-3 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                placeholder="Enter your email"
              />
            </div>
            
            <div className="primary-actions">
              <ThumbZoneWrapper priority="high">
                <Button variant="default" className="w-full">
                  Submit Form
                </Button>
              </ThumbZoneWrapper>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
            How to Test One-Handed Mode
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
            <li>Click "Enable One-Handed Mode" above</li>
            <li>Notice how high-priority buttons move to the bottom right (thumb-reachable area)</li>
            <li>Try adjusting the UI scale in settings to make touch targets larger</li>
            <li>Experiment with different floating button positions</li>
            <li>Test on different screen sizes to see auto-detection in action</li>
            <li>Check how forms reorganize with important actions at the bottom</li>
          </ol>
        </div>
      </div>

      {/* Floating Action Button Demo */}
      {oneHandedEnabled && (
        <FloatingActionContainer>
          <Button
            variant="default"
            className="w-12 h-12 rounded-full flex items-center justify-center"
            onClick={() => alert('Floating action triggered!')}
          >
            ⚡
          </Button>
        </FloatingActionContainer>
      )}
    </main>
  );
} 