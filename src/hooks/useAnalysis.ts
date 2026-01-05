import { useState, useCallback, useEffect } from 'react'
import { framer } from 'framer-plugin'
import type { ProjectAnalysis, AnalysisProgress } from '../types/analysis'
import { analyzeProject } from '../services/analyzer'
import { debugLog } from '../utils/debugLog'
import { getExcludedPageIds } from './useSettings'

const IGNORED_RECOMMENDATIONS_STORAGE_KEY = 'bandwidth-inspector-ignored-recommendations'

export function useAnalysis() {
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState<AnalysisProgress | null>(null)
  const [selectedPageId, setSelectedPageId] = useState<string | 'all'>('all')
  const [lastScanned, setLastScanned] = useState<Date | null>(null)
  const [ignoredRecommendationIds, setIgnoredRecommendationIds] = useState<Set<string>>(new Set())

  // Load ignored recommendations from localStorage on mount
  useEffect(() => {
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

  // Save ignored recommendations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(IGNORED_RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(Array.from(ignoredRecommendationIds)))
    } catch (error) {
      debugLog.warn('Failed to save ignored recommendations to localStorage:', error)
    }
  }, [ignoredRecommendationIds])

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
  }, [])

  return {
    analysis,
    loading,
    error,
    progress,
    runAnalysis,
    selectedPageId,
    setSelectedPageId,
    lastScanned,
    ignoredRecommendationIds,
    ignoreRecommendation,
    unignoreRecommendation
  }
}
