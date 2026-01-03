import { useState } from 'react'
import type { ProjectAnalysis } from '../../types/analysis'
import { RecommendationCard } from './RecommendationCard'
import { formatBytes } from '../../utils/formatBytes'
import { calculateTotalSavings } from '../../services/recommendations'
import { spacing, typography, borders, colors } from '../../styles/designTokens'

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


  return (
    <div className="p-6" style={{ backgroundColor: 'var(--framer-color-bg)' }}>
      {sortedRecommendations.length > 0 && (
        <div 
          className="border rounded-lg p-4 mb-5"
          style={{
            backgroundColor: '#FAF9F8',
            borderColor: 'var(--framer-color-divider)'
          }}
        >
          <div className="text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--framer-color-text-tertiary)', letterSpacing: '0.05em' }}>Potential Savings</div>
          <div className="text-2xl font-semibold mb-2" style={{ color: 'var(--framer-color-text)', lineHeight: '1.2' }}>
            {formatBytes(totalSavings)}
          </div>
          <div className="text-xs" style={{ color: 'var(--framer-color-text-secondary)' }}>
            {priorityCounts.high} high • {priorityCounts.medium} medium • {priorityCounts.low} low priority
          </div>
        </div>
      )}

      <div className="flex gap-1.5 mb-5 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className="px-2 py-1 rounded transition-colors"
          style={
            filter === 'all'
              ? {
                  backgroundColor: 'var(--framer-color-text)',
                  color: 'var(--framer-color-bg)',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  border: `1px solid var(--framer-color-text)`,
                }
              : {
                  backgroundColor: '#FAF9F8',
                  color: 'var(--framer-color-text)',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  border: `1px solid var(--framer-color-divider)`,
                }
          }
          onMouseEnter={(e) => {
            if (filter !== 'all') {
              e.currentTarget.style.backgroundColor = '#F5F4F3'
              e.currentTarget.style.borderColor = 'var(--framer-color-text-secondary)'
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'all') {
              e.currentTarget.style.backgroundColor = '#FAF9F8'
              e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
            }
          }}
        >
          All ({sortedRecommendations.length})
        </button>
        <button
          onClick={() => setFilter('high')}
          className="px-2 py-1 rounded transition-colors"
          style={
            filter === 'high'
              ? {
                  backgroundColor: 'var(--framer-color-text)',
                  color: 'var(--framer-color-bg)',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  border: `1px solid var(--framer-color-text)`,
                }
              : {
                  backgroundColor: '#FAF9F8',
                  color: 'var(--framer-color-text)',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  border: `1px solid var(--framer-color-divider)`,
                }
          }
          onMouseEnter={(e) => {
            if (filter !== 'high') {
              e.currentTarget.style.backgroundColor = '#F5F4F3'
              e.currentTarget.style.borderColor = 'var(--framer-color-text-secondary)'
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'high') {
              e.currentTarget.style.backgroundColor = '#FAF9F8'
              e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
            }
          }}
        >
          High ({priorityCounts.high})
        </button>
        <button
          onClick={() => setFilter('medium')}
          className="px-2 py-1 rounded transition-colors"
          style={
            filter === 'medium'
              ? {
                  backgroundColor: 'var(--framer-color-text)',
                  color: 'var(--framer-color-bg)',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  border: `1px solid var(--framer-color-text)`,
                }
              : {
                  backgroundColor: '#FAF9F8',
                  color: 'var(--framer-color-text)',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  border: `1px solid var(--framer-color-divider)`,
                }
          }
          onMouseEnter={(e) => {
            if (filter !== 'medium') {
              e.currentTarget.style.backgroundColor = '#F5F4F3'
              e.currentTarget.style.borderColor = 'var(--framer-color-text-secondary)'
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'medium') {
              e.currentTarget.style.backgroundColor = '#FAF9F8'
              e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
            }
          }}
        >
          Medium ({priorityCounts.medium})
        </button>
        <button
          onClick={() => setFilter('low')}
          className="px-2 py-1 rounded transition-colors"
          style={
            filter === 'low'
              ? {
                  backgroundColor: 'var(--framer-color-text)',
                  color: 'var(--framer-color-bg)',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  border: `1px solid var(--framer-color-text)`,
                }
              : {
                  backgroundColor: '#FAF9F8',
                  color: 'var(--framer-color-text)',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  border: `1px solid var(--framer-color-divider)`,
                }
          }
          onMouseEnter={(e) => {
            if (filter !== 'low') {
              e.currentTarget.style.backgroundColor = '#F5F4F3'
              e.currentTarget.style.borderColor = 'var(--framer-color-text-secondary)'
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'low') {
              e.currentTarget.style.backgroundColor = '#FAF9F8'
              e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
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
