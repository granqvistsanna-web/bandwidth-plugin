import { framer } from 'framer-plugin'
import { useState } from 'react'
import type { ProjectAnalysis } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'
import { BreakdownChart } from './BreakdownChart'
import { BandwidthCalculator } from './BandwidthCalculator'
import { generateMarkdownReport, copyToClipboard, downloadJSON } from '../../utils/exportReport'

interface OverviewPanelProps {
  analysis: ProjectAnalysis
  onNavigateToRecommendations?: () => void
}

export function OverviewPanel({ analysis, onNavigateToRecommendations }: OverviewPanelProps) {
  const [showPageWeightInfo, setShowPageWeightInfo] = useState(false)
  const [showBreakdownInfo, setShowBreakdownInfo] = useState(false)
  
  // Always use overall data
  const breakpointData = analysis.overallBreakpoints.desktop
  const recommendations = analysis.allRecommendations
  const pageCount = analysis.totalPages

  const handleExportMarkdown = async () => {
    try {
      const markdown = generateMarkdownReport(analysis)
      const success = await copyToClipboard(markdown)
      if (success) {
        framer.notify('Markdown report copied to clipboard!', { variant: 'success', durationMs: 2000 })
      } else {
        framer.notify('Failed to copy report', { variant: 'error' })
      }
    } catch (error) {
      console.error('Export failed:', error)
      framer.notify('Export failed', { variant: 'error' })
    }
  }

  const handleExportJSON = async () => {
    try {
      const success = await downloadJSON(analysis)
      if (success) {
        framer.notify('JSON report downloaded!', { variant: 'success', durationMs: 2000 })
      } else {
        framer.notify('Failed to download report', { variant: 'error' })
      }
    } catch (error) {
      console.error('JSON export failed:', error)
      framer.notify('Export failed', { variant: 'error' })
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Export Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleExportMarkdown}
          className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5"
          title="Copy Markdown report to clipboard"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="truncate">Copy MD</span>
        </button>
        <button
          onClick={handleExportJSON}
          className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-1.5"
          title="Download JSON report"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="truncate">JSON</span>
        </button>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 mb-1">Estimated Page Weight</h3>
            <div className="text-4xl font-bold text-blue-900">
              {formatBytes(breakpointData.totalBytes)}
            </div>
            <p className="text-sm text-blue-700 mt-2">
              First page load across {pageCount} {pageCount === 1 ? 'page' : 'pages'}
            </p>
            <p className="text-xs text-blue-600 mt-1 opacity-75">
              Desktop viewport • Canvas estimates
            </p>
          </div>
          <div className="ml-2 relative">
            <button
              onClick={() => setShowPageWeightInfo(!showPageWeightInfo)}
              className="cursor-help focus:outline-none"
              aria-label="Information about page weight"
            >
              <svg className="w-4 h-4 text-blue-600 opacity-60 hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showPageWeightInfo && (
              <div className="absolute right-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-10">
                <p className="mb-2 font-semibold">Estimated Page Weight</p>
                <p className="text-gray-300">
                  Estimated total bytes transferred on first page load. Includes images, SVGs, fonts, and base HTML/CSS/JS overhead.
                </p>
                <button
                  onClick={() => setShowPageWeightInfo(false)}
                  className="mt-2 text-blue-400 hover:text-blue-300 text-[10px]"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bandwidth Calculator */}
      <BandwidthCalculator pageWeightBytes={breakpointData.totalBytes} />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-medium text-gray-900">Breakdown</h3>
          <div className="relative">
            <button
              onClick={() => setShowBreakdownInfo(!showBreakdownInfo)}
              className="cursor-help focus:outline-none"
              aria-label="Information about breakdown"
            >
              <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showBreakdownInfo && (
              <div className="absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-10">
                <p className="mb-2 font-semibold">Breakdown by Category</p>
                <p className="text-gray-300">
                  Breakdown of estimated bytes by category: Images, SVGs, Fonts, and base HTML/CSS/JS runtime.
                </p>
                <button
                  onClick={() => setShowBreakdownInfo(false)}
                  className="mt-2 text-blue-400 hover:text-blue-300 text-[10px]"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
        <BreakdownChart breakdown={breakpointData.breakdown} totalBytes={breakpointData.totalBytes} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Assets</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">
            {breakpointData.assets.length}
          </div>
        </div>
        <div 
          className={`bg-gray-50 rounded-lg p-4 ${onNavigateToRecommendations && recommendations.length > 0 ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
          onClick={onNavigateToRecommendations && recommendations.length > 0 ? onNavigateToRecommendations : undefined}
          title={onNavigateToRecommendations && recommendations.length > 0 ? 'Click to view recommendations' : undefined}
        >
          <div className="text-sm text-gray-600 flex items-center gap-1">
            Recommendations
            {onNavigateToRecommendations && recommendations.length > 0 && (
              <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">
            {recommendations.length}
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-900 mb-3">🔍 Debug Info</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-yellow-800">Assets found:</span>
            <span className="font-mono font-semibold text-yellow-900">{breakpointData.assets.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-yellow-800">Images:</span>
            <span className="font-mono font-semibold text-yellow-900">
              {breakpointData.assets.filter(a => a.type === 'image' || a.type === 'background').length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-yellow-800">SVGs:</span>
            <span className="font-mono font-semibold text-yellow-900">
              {breakpointData.assets.filter(a => a.type === 'svg').length}
            </span>
          </div>
          <div className="pt-2 border-t border-yellow-300">
            <p className="text-yellow-800 font-semibold mb-1">Sample assets:</p>
            {breakpointData.assets.slice(0, 3).map((asset, i) => (
              <div key={i} className="font-mono text-[10px] text-yellow-900 mb-1">
                {asset.nodeName}: {asset.dimensions.width}×{asset.dimensions.height}px = {asset.estimatedBytes.toLocaleString()}b
              </div>
            ))}
            {breakpointData.assets.length === 0 && (
              <p className="text-red-600 font-semibold">⚠️ NO ASSETS FOUND - Image detection is broken!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
