import { useState, useEffect, useCallback } from 'react'

export interface PluginSettings {
  includeFramerOptimization: boolean
  excludedPageIds: string[] // Pages to exclude from analysis (for draft pages, etc.)
}

const SETTINGS_STORAGE_KEY = 'bandwidth-inspector-settings'

const DEFAULT_SETTINGS: PluginSettings = {
  includeFramerOptimization: true, // Default: assume Framer optimizes images
  excludedPageIds: [] // No pages excluded by default
}

export function useSettings() {
  const [settings, setSettings] = useState<PluginSettings>(() => {
    // Initialize from localStorage on first render (lazy initialization)
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          return { ...DEFAULT_SETTINGS, ...parsed }
        }
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error)
    }
    return DEFAULT_SETTINGS
  })

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

  const togglePageExclusion = useCallback((pageId: string) => {
    setSettings(prev => {
      const isExcluded = prev.excludedPageIds.includes(pageId)
      return {
        ...prev,
        excludedPageIds: isExcluded
          ? prev.excludedPageIds.filter(id => id !== pageId)
          : [...prev.excludedPageIds, pageId]
      }
    })
  }, [])

  const setExcludedPageIds = useCallback((pageIds: string[]) => {
    setSettings(prev => ({
      ...prev,
      excludedPageIds: pageIds
    }))
  }, [])

  return {
    settings,
    updateSetting,
    toggleFramerOptimization,
    includeFramerOptimization: settings.includeFramerOptimization,
    excludedPageIds: settings.excludedPageIds,
    togglePageExclusion,
    setExcludedPageIds
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

// Export a function to get excluded page IDs (for use in non-React code)
export function getExcludedPageIds(): string[] {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.excludedPageIds ?? []
    }
  } catch {
    // Ignore errors
  }
  return [] // Default to no exclusions
}
