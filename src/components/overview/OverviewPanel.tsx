import type { ProjectAnalysis } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'
import { BreakdownChart } from './BreakdownChart'

interface OverviewPanelProps {
  analysis: ProjectAnalysis
}

export function OverviewPanel({ analysis }: OverviewPanelProps) {
  // Use desktop breakpoint for now (simplified for MVP)
  const breakpointData = analysis.overallBreakpoints.desktop

  return (
    <div className="p-4 space-y-6">

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-900 mb-1">Estimated Page Weight</h3>
        <div className="text-4xl font-bold text-blue-900">
          {formatBytes(breakpointData.totalBytes)}
        </div>
        <p className="text-sm text-blue-700 mt-2">
          First page load across {analysis.totalPages} page{analysis.totalPages !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-blue-600 mt-1 opacity-75">
          Desktop viewport • Canvas estimates
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Breakdown</h3>
        <BreakdownChart breakdown={breakpointData.breakdown} totalBytes={breakpointData.totalBytes} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Assets</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">
            {breakpointData.assets.length}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Recommendations</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">
            {analysis.allRecommendations.length}
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
