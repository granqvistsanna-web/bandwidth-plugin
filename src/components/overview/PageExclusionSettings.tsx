import { useState } from 'react'
import type { ProjectAnalysis } from '../../types/analysis'

interface PageExclusionSettingsProps {
  analysis: ProjectAnalysis
  excludedPageIds: Set<string>
  onTogglePageExclusion: (pageId: string) => void
  onRescan: () => void
}

export function PageExclusionSettings({
  analysis,
  excludedPageIds,
  onTogglePageExclusion,
  onRescan
}: PageExclusionSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const allPages = analysis.pages
  const excludedCount = excludedPageIds.size

  if (allPages.length === 0) {
    return null
  }

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-lg transition-colors"
        style={{
          backgroundColor: 'var(--framer-color-bg-secondary)',
          border: `1px solid var(--framer-color-divider)`
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-tertiary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
        }}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: framerColors.textSecondary }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium" style={{ color: framerColors.text }}>
            Page Exclusions
          </span>
          {excludedCount > 0 && (
            <span
              className="px-2 py-0.5 rounded text-xs font-semibold"
              style={{
                backgroundColor: 'var(--framer-color-tint-dimmed)',
                color: 'var(--framer-color-tint)'
              }}
            >
              {excludedCount} excluded
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ color: framerColors.textSecondary }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div
          className="mt-2 p-4 rounded-lg border"
          style={{
            backgroundColor: backgrounds.page,
            borderColor: 'var(--framer-color-divider)'
          }}
        >
          <p className="text-xs mb-3" style={{ color: framerColors.textSecondary }}>
            Exclude pages from bandwidth estimates. Excluded pages won't be included in calculations or recommendations.
          </p>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allPages.map((page) => {
              const isExcluded = excludedPageIds.has(page.pageId)
              return (
                <label
                  key={page.pageId}
                  className="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isExcluded ? 'var(--framer-color-bg-tertiary)' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isExcluded) {
                      e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isExcluded) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isExcluded}
                    onChange={() => onTogglePageExclusion(page.pageId)}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{
                      accentColor: 'var(--framer-color-tint)'
                    }}
                  />
                  <span className="text-sm flex-1" style={{ color: framerColors.text }}>
                    {page.pageName}
                  </span>
                  {isExcluded && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                      backgroundColor: 'var(--framer-color-tint-dimmed)',
                      color: 'var(--framer-color-tint)'
                    }}>
                      Excluded
                    </span>
                  )}
                </label>
              )
            })}
          </div>

          {excludedCount > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--framer-color-divider)' }}>
              <button
                onClick={onRescan}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--framer-color-tint)',
                  color: framerColors.textReversed
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                Rescan with Exclusions
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

