import { useState, useEffect, useCallback } from 'react'

export interface PluginSettings {
  includeFramerOptimization: boolean
}

const SETTINGS_STORAGE_KEY = 'bandwidth-inspector-settings'

const DEFAULT_SETTINGS: PluginSettings = {
  includeFramerOptimization: true // Default: assume Framer optimizes images
}

function getInitialSettings(): PluginSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error)
  }
  return DEFAULT_SETTINGS
}

// Initialize settings on module load
let initialSettings: PluginSettings = DEFAULT_SETTINGS
try {
  if (typeof localStorage !== 'undefined') {
    initialSettings = getInitialSettings()
  }
} catch (error) {
  console.warn('Failed to initialize settings:', error)
}

export function useSettings() {
  const [settings, setSettings] = useState<PluginSettings>(initialSettings)

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error)
    }
  }, [settings])

  const updateSetting = useCallback(<K extends keyof PluginSettings>(
    key: K,
    value: PluginSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleFramerOptimization = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      includeFramerOptimization: !prev.includeFramerOptimization
    }))
  }, [])

  return {
    settings,
    updateSetting,
    toggleFramerOptimization,
    includeFramerOptimization: settings.includeFramerOptimization
  }
}

// Export a function to get the current setting (for use in non-React code)
export function getFramerOptimizationSetting(): boolean {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.includeFramerOptimization ?? true
    }
  } catch {
    // Ignore errors
  }
  return true // Default to true
}
