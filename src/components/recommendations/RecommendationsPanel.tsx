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
  
  // Sort globally by potentialSavings (already sorted in generateRecommendations, but ensure it here)
  const sortedRecommendations = [...allRecommendations].sort((a, b) => {
    // Primary sort: by potential savings (descending)
    if (b.potentialSavings !== a.potentialSavings) {
      return b.potentialSavings - a.potentialSavings
    }
    // Secondary sort: by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
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
        .sort((a, b) => b.potentialSavings - a.potentialSavings)
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
          className="border-2 rounded-lg p-4 mb-4"
          style={{
            backgroundColor: 'var(--framer-color-tint-dimmed)',
            borderColor: 'var(--framer-color-tint)'
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--framer-color-tint)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="font-semibold" style={{ color: 'var(--framer-color-text)' }}>Top 3 Quick Wins</h3>
            <span className="ml-auto text-sm font-medium" style={{ color: 'var(--framer-color-tint)' }}>
              Save {formatBytes(top3Savings)}
            </span>
          </div>
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
          <div className="text-center py-12 text-gray-500">
            No {filter} priority recommendations
          </div>
        )}

        {sortedRecommendations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">✓</div>
            <div className="font-medium text-gray-900">No Recommendations</div>
            <div className="text-sm text-gray-600 mt-1">Your bandwidth is optimized!</div>
          </div>
        )}
      </div>
    </div>
  )
}
