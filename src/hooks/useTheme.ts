import { useState, useEffect } from 'react'
import { debugLog } from '../utils/debugLog'

export type ThemeMode = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'bandwidth-inspector-theme'

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
        return stored as ThemeMode
      }
    } catch (error) {
      debugLog.warn('Failed to load theme from localStorage:', error)
    }
    return 'system'
  })

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Detect system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateResolvedTheme = () => {
      if (theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')
      } else {
        setResolvedTheme(theme)
      }
    }

    updateResolvedTheme()

    if (theme === 'system') {
      mediaQuery.addEventListener('change', updateResolvedTheme)
      return () => mediaQuery.removeEventListener('change', updateResolvedTheme)
    }
  }, [theme])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    if (resolvedTheme === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.setAttribute('data-theme', 'light')
    }
  }, [resolvedTheme])

  const updateTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    } catch (error) {
      debugLog.warn('Failed to save theme to localStorage:', error)
    }
  }

  return {
    theme,
    resolvedTheme,
    setTheme: updateTheme,
  }
}

