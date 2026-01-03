import { useState } from 'react'
import type { ProjectAnalysis } from '../../types/analysis'
import { RecommendationCard } from './RecommendationCard'
import { formatBytes } from '../../utils/formatBytes'
import { calculateTotalSavings } from '../../services/recommendations'

interface RecommendationsPanelProps {
  analysis: ProjectAnalysis
}

export function RecommendationsPanel({ analysis }: RecommendationsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  const recommendations = analysis.allRecommendations

  const filteredRecommendations = filter === 'all'
    ? recommendations
    : recommendations.filter(rec => rec.priority === filter)

  const totalSavings = calculateTotalSavings(recommendations)

  const priorityCounts = {
    high: recommendations.filter(r => r.priority === 'high').length,
    medium: recommendations.filter(r => r.priority === 'medium').length,
    low: recommendations.filter(r => r.priority === 'low').length
  }

  return (
    <div className="p-4">
      {recommendations.length > 0 && (
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

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({recommendations.length})
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
          <RecommendationCard key={recommendation.id} recommendation={recommendation} />
        ))}

        {filteredRecommendations.length === 0 && recommendations.length > 0 && (
          <div className="text-center py-12 text-gray-500">
            No {filter} priority recommendations
          </div>
        )}

        {recommendations.length === 0 && (
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
