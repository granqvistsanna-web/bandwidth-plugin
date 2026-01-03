import { useState } from 'react'
import { framer } from 'framer-plugin'
import type { ProjectAnalysis } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'

interface AssetsPanelProps {
  analysis: ProjectAnalysis
}

export function AssetsPanel({ analysis }: AssetsPanelProps) {
  const [sortBy, setSortBy] = useState<'size' | 'name'>('size')

  // Use desktop breakpoint (simplified for MVP)
  const assets = analysis.overallBreakpoints.desktop.assets

  const sortedAssets = [...assets].sort((a, b) => {
    if (sortBy === 'size') {
      return b.estimatedBytes - a.estimatedBytes
    }
    return a.nodeName.localeCompare(b.nodeName)
  })

  const handleAssetClick = async (nodeId: string) => {
    try {
      await framer.setSelection([nodeId])
      framer.notify('Node selected in canvas', { variant: 'success', durationMs: 1500 })
    } catch {
      framer.notify('Could not select node', { variant: 'error' })
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-medium text-gray-900">
          {assets.length} Asset{assets.length !== 1 ? 's' : ''}
        </h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'size' | 'name')}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          <option value="size">Sort by Size</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      <div className="space-y-2">
        {sortedAssets.map(asset => (
          <button
            key={asset.nodeId}
            onClick={() => handleAssetClick(asset.nodeId)}
            className="w-full bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:shadow-sm transition-all text-left"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{asset.nodeName}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {asset.type.toUpperCase()} • {asset.dimensions.width}×{asset.dimensions.height}px
                  {asset.format && ` • ${asset.format.toUpperCase()}`}
                </div>
              </div>
              <div className="ml-3 text-right">
                <div className="font-semibold text-gray-900">{formatBytes(asset.estimatedBytes)}</div>
              </div>
            </div>
          </button>
        ))}

        {assets.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No assets found
          </div>
        )}
      </div>
    </div>
  )
}
