import { useState, useCallback } from 'react'
import { framer } from 'framer-plugin'
import type { ProjectAnalysis } from '../types/analysis'
import { analyzeProject } from '../services/analyzer'

export function useAnalysis() {
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const runAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await analyzeProject('canvas')
      setAnalysis(result)
      framer.notify('Analysis complete!', { variant: 'success', durationMs: 2000 })
    } catch (err) {
      const error = err as Error
      setError(error)
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
    runAnalysis
  }
}
