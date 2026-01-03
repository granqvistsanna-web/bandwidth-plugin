import { useState } from 'react'
import type { ProjectAnalysis } from '../../types/analysis'
import { RecommendationCard } from './RecommendationCard'
import { formatBytes } from '../../utils/formatBytes'
import { calculateTotalSavings } from '../../services/recommendations'

interface RecommendationsPanelProps {
  analysis: ProjectAnalysis
  selectedPageId: string | 'all'
}

export function RecommendationsPanel({ analysis, selectedPageId }: RecommendationsPanelProps) {
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs text-blue-800">
              <div className="font-medium mb-1">Recommendations ranked globally by impact</div>
              <div className="text-blue-700">
                Assets may be on different pages. Clicking "Select" will navigate to the correct page and highlight the asset.
              </div>
            </div>
          </div>
        </div>
      )}

      {sortedRecommendations.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="text-sm text-green-800 font-medium">Potential Savings</div>
          <div className="text-2xl font-bold text-green-900 mt-1">
            {formatBytes(totalSavings)}
          </div>
          <div className="text-xs text-green-700 mt-1">
            {priorityCounts.high} high • {priorityCounts.medium} medium • {priorityCounts.low} low priority
          </div>
        </div>
      )}

      {/* Top 3 Quick Wins Section */}
      {top3QuickWins.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="font-semibold text-blue-900">Top 3 Quick Wins</h3>
            <span className="ml-auto text-sm font-medium text-blue-700">
              Save {formatBytes(top3Savings)}
            </span>
          </div>
          <div className="space-y-2">
            {top3QuickWins.map((rec, index) => (
              <div
                key={rec.id}
                className="bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{rec.nodeName}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{rec.actionable}</div>
                    <div className="text-xs font-semibold text-blue-700 mt-1">
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
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({sortedRecommendations.length})
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            filter === 'high'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          High ({priorityCounts.high})
        </button>
        <button
          onClick={() => setFilter('medium')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            filter === 'medium'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Medium ({priorityCounts.medium})
        </button>
        <button
          onClick={() => setFilter('low')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            filter === 'low'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
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
