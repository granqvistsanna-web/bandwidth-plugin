import { framer } from 'framer-plugin'
import type { Recommendation } from '../../types/analysis'
import { Badge } from '../common/Badge'
import { formatBytes } from '../../utils/formatBytes'

interface RecommendationCardProps {
  recommendation: Recommendation
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const handleNavigate = async () => {
    try {
      await framer.setSelection([recommendation.nodeId])
      framer.notify('Node selected in canvas', { variant: 'success', durationMs: 1500 })
    } catch {
      framer.notify('Could not select node', { variant: 'error' })
    }
  }

  const typeLabels = {
    oversized: 'Oversized',
    format: 'Format',
    compression: 'Compression'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="flex gap-2">
          <Badge variant={recommendation.priority}>
            {recommendation.priority.toUpperCase()}
          </Badge>
          <Badge variant="default">
            {typeLabels[recommendation.type]}
          </Badge>
        </div>
        <div className="text-sm font-semibold text-green-600">
          Save {formatBytes(recommendation.potentialSavings)}
        </div>
      </div>

      <h4 className="font-medium text-gray-900 mb-1">{recommendation.nodeName}</h4>
      <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
        <div className="text-xs font-medium text-blue-900 mb-1">Action</div>
        <div className="text-sm text-blue-800">{recommendation.actionable}</div>
      </div>

      <button
        onClick={handleNavigate}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium"
      >
        Select in Canvas
      </button>
    </div>
  )
}
