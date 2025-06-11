import React from 'react';

interface OneHandedSettingsProps {
  settings: {
    enabled: boolean;
    autoDetect: boolean;
    floatingButtonPosition: 'left' | 'right';
    uiScale?: number;
  };
  onUpdateSettings: (settings: any) => void;
}

export const OneHandedSettings: React.FC<OneHandedSettingsProps> = ({
  settings,
  onUpdateSettings
}) => {
  return (
    <div className="one-handed-settings space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        One-Handed Mode Settings
      </h3>
      
      <div className="setting-row flex justify-between items-center">
        <label className="text-gray-700 dark:text-gray-300">
          Enable One-Handed Mode
        </label>
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => onUpdateSettings({ ...settings, enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
      
      <div className="setting-row flex justify-between items-center">
        <label className="text-gray-700 dark:text-gray-300">
          Auto-detect large devices
        </label>
        <input
          type="checkbox"
          checked={settings.autoDetect}
          onChange={(e) => onUpdateSettings({ ...settings, autoDetect: e.target.checked })}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
      
      <div className="setting-row">
        <label className="block text-gray-700 dark:text-gray-300 mb-2">
          Floating Button Position
        </label>
        <select
          value={settings.floatingButtonPosition}
          onChange={(e) => onUpdateSettings({ 
            ...settings, 
            floatingButtonPosition: e.target.value as 'left' | 'right' 
          })}
          className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
        >
          <option value="left">Left Side</option>
          <option value="right">Right Side</option>
        </select>
      </div>
      
      <div className="setting-row">
        <label className="block text-gray-700 dark:text-gray-300 mb-2">
          UI Scale (for easier touch targets): {settings.uiScale || 1}
        </label>
        <input
          type="range"
          min="0.8"
          max="1.2"
          step="0.05"
          value={settings.uiScale || 1}
          onChange={(e) => onUpdateSettings({ 
            ...settings, 
            uiScale: parseFloat(e.target.value) 
          })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
      </div>
    </div>
  );
}; 