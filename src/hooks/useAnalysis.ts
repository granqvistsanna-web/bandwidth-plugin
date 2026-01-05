import { useState, useCallback, useEffect } from 'react'
import { framer } from 'framer-plugin'
import type { ProjectAnalysis, AnalysisProgress } from '../types/analysis'
import { analyzeProject } from '../services/analyzer'
import type { ManualCMSEstimate } from '../services/assetCollector'
import { debugLog } from '../utils/debugLog'
import { getExcludedPageIds } from './useSettings'
const MANUAL_ESTIMATES_STORAGE_KEY = 'bandwidth-inspector-cms-manual-estimates'
const IGNORED_RECOMMENDATIONS_STORAGE_KEY = 'bandwidth-inspector-ignored-recommendations'

// Re-export for backward compatibility
export type { ManualCMSEstimate } from '../services/assetCollector'

export function useAnalysis() {
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState<AnalysisProgress | null>(null)
  const [selectedPageId, setSelectedPageId] = useState<string | 'all'>('all')
  const [lastScanned, setLastScanned] = useState<Date | null>(null)
  const [manualCMSEstimates, setManualCMSEstimates] = useState<ManualCMSEstimate[]>([])
  const [ignoredRecommendationIds, setIgnoredRecommendationIds] = useState<Set<string>>(new Set())

  // Load manual CMS estimates from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(MANUAL_ESTIMATES_STORAGE_KEY)
      if (stored) {
        const estimates = JSON.parse(stored) as ManualCMSEstimate[]
        setManualCMSEstimates(estimates)
      }
    } catch (error) {
      debugLog.warn('Failed to load manual CMS estimates from localStorage:', error)
    }

    try {
      const stored = localStorage.getItem(IGNORED_RECOMMENDATIONS_STORAGE_KEY)
      if (stored) {
        const ids = JSON.parse(stored) as string[]
        setIgnoredRecommendationIds(new Set(ids))
      }
    } catch (error) {
      debugLog.warn('Failed to load ignored recommendations from localStorage:', error)
    }
  }, [])

  // Save manual CMS estimates to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(MANUAL_ESTIMATES_STORAGE_KEY, JSON.stringify(manualCMSEstimates))
    } catch (error) {
      debugLog.warn('Failed to save manual CMS estimates to localStorage:', error)
    }
  }, [manualCMSEstimates])

  // Save ignored recommendations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(IGNORED_RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(Array.from(ignoredRecommendationIds)))
    } catch (error) {
      debugLog.warn('Failed to save ignored recommendations to localStorage:', error)
    }
  }, [ignoredRecommendationIds])

  const addManualCMSEstimate = useCallback((estimate: Omit<ManualCMSEstimate, 'id' | 'createdAt'>) => {
    const newEstimate: ManualCMSEstimate = {
      ...estimate,
      id: `manual-${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    setManualCMSEstimates(prev => [...prev, newEstimate])
  }, [])

  const updateManualCMSEstimate = useCallback((id: string, estimate: Partial<Omit<ManualCMSEstimate, 'id' | 'createdAt'>>) => {
    setManualCMSEstimates(prev => prev.map(est => 
      est.id === id ? { ...est, ...estimate } : est
    ))
  }, [])

  const removeManualCMSEstimate = useCallback((id: string) => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid estimate ID provided to removeManualCMSEstimate')
      }

      debugLog.info('removeManualCMSEstimate called with id:', id)
      
      setManualCMSEstimates(prev => {
        const beforeCount = prev.length
        const filtered = prev.filter(est => est.id !== id)
        const afterCount = filtered.length
        
        if (beforeCount === afterCount) {
          debugLog.warn(`Estimate with id ${id} was not found in the list`)
          framer.notify('Estimate not found', { variant: 'warning', durationMs: 2000 })
        } else {
          debugLog.success(`Removed estimate ${id}. Remaining estimates: ${afterCount}`, filtered.map(e => e.id))
        }
        
        return filtered
      })
    } catch (error) {
      debugLog.error('Error in removeManualCMSEstimate:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      framer.notify(`Failed to remove estimate: ${errorMessage}`, { variant: 'error', durationMs: 3000 })
      throw error // Re-throw so callers can handle it
    }
  }, [])

  const ignoreRecommendation = useCallback((recommendationId: string) => {
    setIgnoredRecommendationIds(prev => new Set([...prev, recommendationId]))
    framer.notify('Recommendation ignored', { variant: 'success', durationMs: 2000 })
  }, [])

  const unignoreRecommendation = useCallback((recommendationId: string) => {
    setIgnoredRecommendationIds(prev => {
      const next = new Set(prev)
      next.delete(recommendationId)
      return next
    })
    framer.notify('Recommendation restored', { variant: 'success', durationMs: 2000 })
  }, [])

  const runAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    setProgress(null)
    debugLog.clear()
    debugLog.info('Starting new analysis...')

    try {
      // Get excluded pages from settings (shared storage)
      const excludedPageIds = getExcludedPageIds()

      const result = await analyzeProject(
        'canvas',
        excludedPageIds,
        manualCMSEstimates,
        setProgress // Pass progress callback
      )
      setAnalysis(result)
      setLastScanned(new Date())
      setProgress({ step: 'complete', message: 'Analysis complete!' })
      debugLog.success(`Analysis complete! Found ${result.overallBreakpoints.desktop.assets.length} assets`)
      framer.notify('Analysis complete!', { variant: 'success', durationMs: 2000 })
    } catch (err) {
      const error = err as Error
      setError(error)
      setProgress(null)
      debugLog.error('Analysis failed', error)
      framer.notify('Analysis failed: ' + error.message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [manualCMSEstimates])

  return {
    analysis,
    loading,
    error,
    progress,
    runAnalysis,
    selectedPageId,
    setSelectedPageId,
    lastScanned,
    manualCMSEstimates,
    addManualCMSEstimate,
    updateManualCMSEstimate,
    removeManualCMSEstimate,
    ignoredRecommendationIds,
    ignoreRecommendation,
    unignoreRecommendation
  }
}
