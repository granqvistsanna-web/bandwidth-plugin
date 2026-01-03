import { useState } from 'react'
import type { ProjectAnalysis } from '../../types/analysis'
import { RecommendationCard } from './RecommendationCard'
import { formatBytes } from '../../utils/formatBytes'
import { calculateTotalSavings } from '../../services/recommendations'

interface RecommendationsPanelProps {
  analysis: ProjectAnalysis
  selectedPageId: string | 'all'
}

export function RecommendationsPanel({ analysis }: RecommendationsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  // Always use all recommendations, sorted globally by impact (potentialSavings)
  // This ensures recommendations are ranked by impact regardless of page filter
  // The page filter in the UI is informational only - recommendations show all pages
  const allRecommendations = analysis.allRecommendations
  
  // Stable sort: ensure consistent ordering across renders
  const sortedRecommendations = [...allRecommendations].sort((a, b) => {
    // Primary sort: by potential savings (descending)
    if (b.potentialSavings !== a.potentialSavings) {
      return b.potentialSavings - a.potentialSavings
    }
    // Secondary sort: by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) {
      return priorityDiff
    }
    // Tertiary sort: by node name (alphabetical) for stable ordering
    const nameA = a.nodeName || ''
    const nameB = b.nodeName || ''
    if (nameA !== nameB) {
      return nameA.localeCompare(nameB)
    }
    // Final sort: by node ID for complete stability
    return (a.nodeId || a.id).localeCompare(b.nodeId || b.id)
  })

  const filteredRecommendations = filter === 'all'
    ? sortedRecommendations
    : sortedRecommendations.filter(rec => rec.priority === filter)

  const totalSavings = calculateTotalSavings(sortedRecommendations)

  const priorityCounts = {
    high: sortedRecommendations.filter(r => r.priority === 'high').length,
    medium: sortedRecommendations.filter(r => r.priority === 'medium').length,
    low: sortedRecommendations.filter(r => r.priority === 'low').length
  }

  // Get top 3 HIGH priority recommendations by potential savings
  // Only show when 3+ high priority recommendations exist
  const highPriorityRecs = sortedRecommendations.filter(r => r.priority === 'high')
  const top3QuickWins = highPriorityRecs.length >= 3
    ? [...highPriorityRecs]
        .sort((a, b) => {
          // Stable sort: primary by savings, secondary by name, tertiary by ID
          if (b.potentialSavings !== a.potentialSavings) {
            return b.potentialSavings - a.potentialSavings
          }
          const nameA = a.nodeName || ''
          const nameB = b.nodeName || ''
          if (nameA !== nameB) {
            return nameA.localeCompare(nameB)
          }
          return (a.nodeId || a.id).localeCompare(b.nodeId || b.id)
        })
        .slice(0, 3)
    : []

  const top3Savings = top3QuickWins.reduce((sum, rec) => sum + rec.potentialSavings, 0)

  return (
    <div className="p-4">
      {/* Info message about cross-page navigation */}
      {sortedRecommendations.length > 0 && (
        <div 
          className="border rounded-lg p-3 mb-4"
          style={{
            backgroundColor: 'var(--framer-color-tint-dimmed)',
            borderColor: 'var(--framer-color-divider)'
          }}
        >
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--framer-color-tint)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs" style={{ color: 'var(--framer-color-text)' }}>
              <div className="font-medium mb-1">Recommendations ranked globally by impact</div>
              <div style={{ color: 'var(--framer-color-text-secondary)' }}>
                Assets may be on different pages. Clicking "Select" will navigate to the correct page and highlight the asset.
              </div>
            </div>
          </div>
        </div>
      )}

      {sortedRecommendations.length > 0 && (
        <div 
          className="border rounded-lg p-4 mb-4"
          style={{
            backgroundColor: 'var(--framer-color-bg-secondary)',
            borderColor: 'var(--framer-color-divider)'
          }}
        >
          <div className="text-sm font-medium" style={{ color: 'var(--framer-color-text-secondary)' }}>Potential Savings</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--framer-color-text)' }}>
            {formatBytes(totalSavings)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--framer-color-text-secondary)' }}>
            {priorityCounts.high} high • {priorityCounts.medium} medium • {priorityCounts.low} low priority
          </div>
        </div>
      )}

      {/* Top 3 Quick Wins Section */}
      {top3QuickWins.length > 0 && (
        <div 
          className="border-2 rounded-xl p-5 mb-4 shadow-sm"
          style={{
            background: 'linear-gradient(to bottom right, var(--framer-color-tint-dimmed), var(--framer-color-bg-secondary))',
            borderColor: 'var(--framer-color-tint)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--framer-color-tint)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="font-bold text-base" style={{ color: 'var(--framer-color-text)' }}>Top 3 Quick Wins</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold" style={{ color: 'var(--framer-color-tint)' }}>
              {formatBytes(top3Savings)}
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--framer-color-text-secondary)' }}>
              combined savings
            </span>
          </div>
          <p className="text-xs mb-4 font-semibold" style={{ color: 'var(--framer-color-tint)' }}>
            ⚡ Start here for maximum impact
          </p>
          <div className="space-y-2">
            {top3QuickWins.map((rec, index) => (
              <div
                key={rec.id}
                className="rounded-lg p-3 border transition-colors"
                style={{
                  backgroundColor: 'var(--framer-color-bg)',
                  borderColor: 'var(--framer-color-divider)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--framer-color-tint)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
                }}
              >
                <div className="flex items-start gap-2">
                  <div 
                    className="flex-shrink-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: 'var(--framer-color-tint)' }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--framer-color-text)' }}>{rec.nodeName}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--framer-color-text-secondary)' }}>{rec.actionable}</div>
                    <div className="text-xs font-semibold mt-1" style={{ color: 'var(--framer-color-tint)' }}>
                      Save {formatBytes(rec.potentialSavings)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
          style={filter === 'all' ? {
            backgroundColor: 'var(--framer-color-tint)',
            color: 'var(--framer-color-text-reversed)'
          } : {
            backgroundColor: 'var(--framer-color-bg-tertiary)',
            color: 'var(--framer-color-text)'
          }}
          onMouseEnter={(e) => {
            if (filter !== 'all') {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'all') {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-tertiary)'
            }
          }}
        >
          All ({sortedRecommendations.length})
        </button>
        <button
          onClick={() => setFilter('high')}
          className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
          style={filter === 'high' ? {
            backgroundColor: '#ef4444',
            color: 'white'
          } : {
            backgroundColor: 'var(--framer-color-bg-tertiary)',
            color: 'var(--framer-color-text)'
          }}
          onMouseEnter={(e) => {
            if (filter !== 'high') {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'high') {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-tertiary)'
            }
          }}
        >
          High ({priorityCounts.high})
        </button>
        <button
          onClick={() => setFilter('medium')}
          className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
          style={filter === 'medium' ? {
            backgroundColor: '#eab308',
            color: 'white'
          } : {
            backgroundColor: 'var(--framer-color-bg-tertiary)',
            color: 'var(--framer-color-text)'
          }}
          onMouseEnter={(e) => {
            if (filter !== 'medium') {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'medium') {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-tertiary)'
            }
          }}
        >
          Medium ({priorityCounts.medium})
        </button>
        <button
          onClick={() => setFilter('low')}
          className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
          style={filter === 'low' ? {
            backgroundColor: '#22c55e',
            color: 'white'
          } : {
            backgroundColor: 'var(--framer-color-bg-tertiary)',
            color: 'var(--framer-color-text)'
          }}
          onMouseEnter={(e) => {
            if (filter !== 'low') {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'low') {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-tertiary)'
            }
          }}
        >
          Low ({priorityCounts.low})
        </button>
      </div>

      <div className="space-y-3">
        {filteredRecommendations.map(recommendation => (
          <RecommendationCard 
            key={recommendation.id} 
            recommendation={recommendation}
            allPages={analysis.pages.map(p => ({ pageId: p.pageId, pageName: p.pageName }))}
          />
        ))}

        {filteredRecommendations.length === 0 && sortedRecommendations.length > 0 && (
          <div className="text-center py-12 px-4">
            <div className="text-3xl mb-3">🔍</div>
            <div className="font-semibold mb-2" style={{ color: 'var(--framer-color-text)' }}>
              No {filter} Priority Recommendations
            </div>
            <div className="text-sm" style={{ color: 'var(--framer-color-text-secondary)' }}>
              Try selecting a different priority filter to see other recommendations.
            </div>
          </div>
        )}

        {sortedRecommendations.length === 0 && (
          <div className="text-center py-12 px-4 max-w-sm mx-auto">
            <div className="text-5xl mb-4">✓</div>
            <div className="font-semibold text-lg mb-2" style={{ color: 'var(--framer-color-text)' }}>
              Great! No Optimization Needed
            </div>
            <div className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--framer-color-text-secondary)' }}>
              <p className="mb-2">Your assets are well-optimized.</p>
              <p className="text-xs" style={{ color: 'var(--framer-color-text-tertiary)' }}>
                Your images are properly sized and formatted. All assets are under recommended thresholds and using efficient formats like WebP or AVIF.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
