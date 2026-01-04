import { useState, useEffect } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'bandwidth-inspector-theme'

// Set initial theme immediately (synchronously) before any rendering
function getInitialTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
      return stored as ThemeMode
    }
  } catch (error) {
    console.warn('Failed to load theme from localStorage:', error)
  }
  return 'light' // Default to light mode for immediate rendering
}

// Apply data-theme attribute immediately
function applyTheme(theme: 'light' | 'dark') {
  try {
    document.documentElement.setAttribute('data-theme', theme)
    console.log('✅ Set data-theme to:', theme)
  } catch (error) {
    console.error('❌ Failed to set data-theme:', error)
  }
}

// Initialize theme immediately on module load (with safety checks)
let initialTheme: ThemeMode = 'light'
let initialResolved: 'light' | 'dark' = 'light'

try {
  if (typeof document !== 'undefined') {
    initialTheme = getInitialTheme()
    initialResolved = initialTheme === 'system' ? 'light' : initialTheme
    applyTheme(initialResolved)
  }
} catch (error) {
  console.warn('Failed to initialize theme:', error)
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(initialResolved)

  // Update theme when user changes setting
  useEffect(() => {
    console.log('🎨 Theme effect running - theme:', theme)

    const newResolvedTheme = theme === 'system' ? 'light' : theme
    console.log('🎨 Resolved theme:', newResolvedTheme)

    applyTheme(newResolvedTheme)
    setResolvedTheme(newResolvedTheme)

    // Log CSS variable values for debugging
    try {
      if (typeof document !== 'undefined' && document.documentElement) {
        const surfacePrimary = getComputedStyle(document.documentElement).getPropertyValue('--surface-primary').trim()
        const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim()
        console.log('🎨 CSS Variables - surface:', surfacePrimary, 'text:', textPrimary)
      }
    } catch (error) {
      console.warn('Failed to read CSS variables:', error)
    }
  }, [theme])

  const updateTheme = (newTheme: ThemeMode) => {
    console.log('🎨 Updating theme to:', newTheme)
    setTheme(newTheme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
      console.log('✅ Saved theme to localStorage')
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
    }
  }

  return {
    theme,
    resolvedTheme,
    setTheme: updateTheme,
  }
}

