import { useState, useCallback } from 'react'
import { framer } from 'framer-plugin'
import type { ProjectAnalysis } from '../types/analysis'
import { analyzeProject } from '../services/analyzer'
import { debugLog } from '../utils/debugLog'

export function useAnalysis() {
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [selectedPageId, setSelectedPageId] = useState<string | 'all'>('all')
  const [lastScanned, setLastScanned] = useState<Date | null>(null)

  const runAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    debugLog.clear()
    debugLog.info('Starting new analysis...')

    try {
      const result = await analyzeProject('canvas')
      setAnalysis(result)
      setLastScanned(new Date())
      debugLog.success(`Analysis complete! Found ${result.overallBreakpoints.desktop.assets.length} assets`)
      framer.notify('Analysis complete!', { variant: 'success', durationMs: 2000 })
    } catch (err) {
      const error = err as Error
      setError(error)
      debugLog.error('Analysis failed', error)
      framer.notify('Analysis failed: ' + error.message, { variant: 'error' })
      console.error('Analysis error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    analysis,
    loading,
    error,
    runAnalysis,
    selectedPageId,
    setSelectedPageId,
    lastScanned
  }
}
