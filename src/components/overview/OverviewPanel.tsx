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
  const customCode = analysis.publishedData?.customCode

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
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          style={{
            backgroundColor: 'var(--framer-color-tint)',
            color: 'var(--framer-color-text-reversed)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--framer-color-tint-dark)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--framer-color-tint)'
          }}
          title="Copy Markdown report to clipboard"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="truncate">Copy MD</span>
        </button>
        <button
          onClick={handleExportJSON}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          style={{
            backgroundColor: 'var(--framer-color-bg-tertiary)',
            color: 'var(--framer-color-text)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-tertiary)'
          }}
          title="Download JSON report"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="truncate">JSON</span>
        </button>
      </div>

      <div 
        className="rounded-lg p-6"
        style={{
          background: `linear-gradient(to bottom right, var(--framer-color-tint-dimmed), var(--framer-color-bg-secondary))`
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--framer-color-tint)' }}>Estimated Page Weight</h3>
            <div className="text-4xl font-bold" style={{ color: 'var(--framer-color-text)' }}>
              {formatBytes(breakpointData.totalBytes)}
            </div>
            <p className="text-sm mt-2" style={{ color: 'var(--framer-color-text-secondary)' }}>
              First page load across {pageCount} {pageCount === 1 ? 'page' : 'pages'}
            </p>
            <p className="text-xs mt-1 opacity-75" style={{ color: 'var(--framer-color-text-tertiary)' }}>
              Desktop viewport • Canvas estimates
            </p>
          </div>
          <div className="ml-2 relative">
            <button
              onClick={() => setShowPageWeightInfo(!showPageWeightInfo)}
              className="cursor-pointer focus:outline-none rounded-full p-1 transition-all"
              style={{ 
                backgroundColor: showPageWeightInfo ? 'var(--framer-color-bg-tertiary)' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!showPageWeightInfo) {
                  e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-tertiary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!showPageWeightInfo) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
              aria-label="Information about page weight"
            >
              <svg 
                className="w-4 h-4 transition-opacity" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                style={{ 
                  color: 'var(--framer-color-tint)',
                  opacity: showPageWeightInfo ? 1 : 0.6
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showPageWeightInfo && (
              <div 
                className="absolute right-0 top-8 w-72 text-xs rounded-lg p-4 shadow-xl z-20 border"
                style={{
                  backgroundColor: 'var(--framer-color-text)',
                  color: 'var(--framer-color-text-reversed)',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="font-semibold text-sm flex-1" style={{ color: 'var(--framer-color-text-reversed)' }}>Estimated Page Weight</p>
                  <button
                    onClick={() => setShowPageWeightInfo(false)}
                    className="cursor-pointer flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors"
                    style={{ 
                      color: 'var(--framer-color-text-reversed)',
                      opacity: 0.7
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.7'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    aria-label="Close"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="mb-2 leading-relaxed" style={{ color: 'var(--framer-color-text-reversed)', opacity: 0.9 }}>
                  Estimated total bytes transferred on first page load. Includes images, SVGs, fonts, and base HTML/CSS/JS overhead.
                </p>
                <p className="pt-2 border-t leading-relaxed" style={{ color: 'var(--framer-color-text-reversed)', opacity: 0.8, borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                  <strong>Note:</strong> Video files, external scripts, and third-party resources are not included in this estimate.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bandwidth Calculator */}
      <BandwidthCalculator pageWeightBytes={breakpointData.totalBytes} />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-medium" style={{ color: 'var(--framer-color-text)' }}>Breakdown</h3>
          <div className="relative">
            <button
              onClick={() => setShowBreakdownInfo(!showBreakdownInfo)}
              className="cursor-pointer focus:outline-none rounded-full p-1 transition-all"
              style={{ 
                backgroundColor: showBreakdownInfo ? 'var(--framer-color-bg-tertiary)' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!showBreakdownInfo) {
                  e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-tertiary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!showBreakdownInfo) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
              aria-label="Information about breakdown"
            >
              <svg 
                className="w-4 h-4 transition-opacity" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                style={{ 
                  color: 'var(--framer-color-text-tertiary)',
                  opacity: showBreakdownInfo ? 1 : 0.6
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--framer-color-text-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--framer-color-text-tertiary)'
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showBreakdownInfo && (
              <div 
                className="absolute left-0 top-8 w-72 text-xs rounded-lg p-4 shadow-xl z-20 border"
                style={{
                  backgroundColor: 'var(--framer-color-text)',
                  color: 'var(--framer-color-text-reversed)',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="font-semibold text-sm flex-1" style={{ color: 'var(--framer-color-text-reversed)' }}>Breakdown by Category</p>
                  <button
                    onClick={() => setShowBreakdownInfo(false)}
                    className="cursor-pointer flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors"
                    style={{ 
                      color: 'var(--framer-color-text-reversed)',
                      opacity: 0.7
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.7'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    aria-label="Close"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="leading-relaxed" style={{ color: 'var(--framer-color-text-reversed)', opacity: 0.9 }}>
                  Breakdown of estimated bytes by category: Images, SVGs, Fonts, and base HTML/CSS/JS runtime.
                </p>
              </div>
            )}
          </div>
        </div>
        <BreakdownChart breakdown={breakpointData.breakdown} totalBytes={breakpointData.totalBytes} />
      </div>

      {/* Custom Code Assets Section */}
      {customCode && customCode.hasCustomCode && (
        <div 
          className="border rounded-lg p-4"
          style={{
            backgroundColor: 'var(--framer-color-bg-secondary)',
            borderColor: 'var(--framer-color-divider)'
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--framer-color-text)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Custom Code Assets
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--framer-color-text-secondary)' }}>
                Assets loaded dynamically by custom code (code overrides/components)
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold" style={{ color: 'var(--framer-color-text)' }}>
                {formatBytes(customCode.totalEstimatedBytes)}
              </div>
              <div className="text-xs" style={{ color: 'var(--framer-color-text-secondary)' }}>
                {customCode.assets.length} asset{customCode.assets.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          
          {customCode.assets.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {customCode.assets.slice(0, 5).map((asset, i) => (
                <div 
                  key={i} 
                  className="rounded p-2 text-xs"
                  style={{ backgroundColor: 'var(--framer-color-bg)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate" style={{ color: 'var(--framer-color-text)' }} title={asset.url}>
                        {asset.url.length > 50 ? asset.url.substring(0, 50) + '...' : asset.url}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span 
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            backgroundColor: 'var(--framer-color-tint-dimmed)',
                            color: 'var(--framer-color-tint)'
                          }}
                        >
                          {asset.type}
                        </span>
                        {asset.isLazyLoaded && (
                          <span 
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              backgroundColor: 'var(--framer-color-bg-secondary)',
                              color: 'var(--framer-color-text-secondary)'
                            }}
                          >
                            Lazy
                          </span>
                        )}
                        {asset.estimatedBytes && (
                          <span style={{ color: 'var(--framer-color-text-secondary)' }}>
                            {formatBytes(asset.estimatedBytes)}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] mt-1 truncate" style={{ color: 'var(--framer-color-text-tertiary)' }} title={asset.source}>
                        Source: {asset.source.length > 60 ? asset.source.substring(0, 60) + '...' : asset.source}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {customCode.assets.length > 5 && (
                <div className="text-xs text-center pt-1" style={{ color: 'var(--framer-color-text-secondary)' }}>
                  + {customCode.assets.length - 5} more asset{customCode.assets.length - 5 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
          
          {customCode.warnings.length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--framer-color-divider)' }}>
              <div className="text-xs space-y-1" style={{ color: 'var(--framer-color-text-secondary)' }}>
                {customCode.warnings.map((warning, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--framer-color-text-tertiary)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div 
          className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--framer-color-bg-secondary)' }}
        >
          <div className="text-sm" style={{ color: 'var(--framer-color-text-secondary)' }}>Total Assets</div>
          <div className="text-2xl font-semibold mt-1" style={{ color: 'var(--framer-color-text)' }}>
            {breakpointData.assets.length}
          </div>
        </div>
        <div 
          className={`rounded-lg p-4 transition-colors ${onNavigateToRecommendations && recommendations.length > 0 ? 'cursor-pointer' : ''}`}
          style={{ backgroundColor: 'var(--framer-color-bg-secondary)' }}
          onMouseEnter={(e) => {
            if (onNavigateToRecommendations && recommendations.length > 0) {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-tertiary)'
            }
          }}
          onMouseLeave={(e) => {
            if (onNavigateToRecommendations && recommendations.length > 0) {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
            }
          }}
          onClick={onNavigateToRecommendations && recommendations.length > 0 ? onNavigateToRecommendations : undefined}
          title={onNavigateToRecommendations && recommendations.length > 0 ? 'Click to view recommendations' : undefined}
        >
          <div className="text-sm flex items-center gap-1" style={{ color: 'var(--framer-color-text-secondary)' }}>
            Recommendations
            {onNavigateToRecommendations && recommendations.length > 0 && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--framer-color-tint)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
          <div className="text-2xl font-semibold mt-1" style={{ color: 'var(--framer-color-text)' }}>
            {recommendations.length}
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div 
        className="border rounded-lg p-4"
        style={{
          backgroundColor: 'var(--framer-color-bg-secondary)',
          borderColor: 'var(--framer-color-divider)'
        }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--framer-color-text)' }}>🔍 Debug Info</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span style={{ color: 'var(--framer-color-text-secondary)' }}>Assets found:</span>
            <span className="font-mono font-semibold" style={{ color: 'var(--framer-color-text)' }}>{breakpointData.assets.length}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--framer-color-text-secondary)' }}>Images:</span>
            <span className="font-mono font-semibold" style={{ color: 'var(--framer-color-text)' }}>
              {breakpointData.assets.filter(a => a.type === 'image' || a.type === 'background').length}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--framer-color-text-secondary)' }}>SVGs:</span>
            <span className="font-mono font-semibold" style={{ color: 'var(--framer-color-text)' }}>
              {breakpointData.assets.filter(a => a.type === 'svg').length}
            </span>
          </div>
          <div className="pt-2 border-t" style={{ borderColor: 'var(--framer-color-divider)' }}>
            <p className="font-semibold mb-1" style={{ color: 'var(--framer-color-text)' }}>Sample assets:</p>
            {breakpointData.assets.slice(0, 3).map((asset, i) => (
              <div key={i} className="font-mono text-[10px] mb-1" style={{ color: 'var(--framer-color-text-secondary)' }}>
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
