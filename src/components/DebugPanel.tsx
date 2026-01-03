import type { ProjectAnalysis } from '../types/analysis'

interface DebugPanelProps {
  analysis: ProjectAnalysis
}

export function DebugPanel({ analysis }: DebugPanelProps) {
  const assets = analysis.overallBreakpoints.desktop.assets

  return (
    <div className="p-4 space-y-4 bg-gray-50">
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">Debug Info</h3>

        <div className="space-y-2 text-xs font-mono">
          <div>
            <span className="text-gray-600">Total pages:</span>{' '}
            <span className="text-gray-900">{analysis.totalPages}</span>
          </div>
          <div>
            <span className="text-gray-600">Total assets found:</span>{' '}
            <span className="text-gray-900">{assets.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Total bytes:</span>{' '}
            <span className="text-gray-900">
              {analysis.overallBreakpoints.desktop.totalBytes.toLocaleString()} bytes
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">Assets Detail</h3>

        {assets.length === 0 ? (
          <p className="text-sm text-gray-600">No assets found</p>
        ) : (
          <div className="space-y-3">
            {assets.slice(0, 10).map((asset, index) => (
              <div key={asset.nodeId} className="border-b border-gray-100 pb-2">
                <div className="text-xs font-mono space-y-1">
                  <div><span className="text-gray-600">#{index + 1}</span> <span className="font-semibold">{asset.nodeName}</span></div>
                  <div className="text-gray-600">
                    Type: <span className="text-gray-900">{asset.type}</span> |
                    Format: <span className="text-gray-900">{asset.format || 'unknown'}</span>
                  </div>
                  <div className="text-gray-600">
                    Dimensions: <span className="text-gray-900">{asset.dimensions.width} × {asset.dimensions.height}px</span>
                  </div>
                  <div className="text-gray-600">
                    Estimated: <span className={`font-semibold ${asset.estimatedBytes === 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {asset.estimatedBytes.toLocaleString()} bytes
                    </span>
                  </div>
                  {asset.url && (
                    <div className="text-gray-600 truncate">
                      URL: <span className="text-gray-900 text-[10px]">{asset.url}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {assets.length > 10 && (
              <p className="text-xs text-gray-500 italic">
                ...and {assets.length - 10} more assets
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
