import { formatBytes } from '../../utils/formatBytes'
import { formatFileSize } from '../../services/imageDownloader'

interface OptimizationResultProps {
  originalSize: number
  optimizedSize: number
  originalDimensions: { width: number; height: number }
  optimizedDimensions: { width: number; height: number }
  format: string
  onDownload?: () => void
  onSelectNode?: () => void
  method: 'direct' | 'download'
}

export function OptimizationResult({
  originalSize,
  optimizedSize,
  originalDimensions,
  optimizedDimensions,
  format,
  onDownload,
  onSelectNode,
  method
}: OptimizationResultProps) {
  const savings = originalSize - optimizedSize
  const savingsPercent = ((savings / originalSize) * 100).toFixed(1)

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h4 className="font-semibold text-green-900">Image Optimized Successfully!</h4>
      </div>

      {/* Before/After Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded p-3 border border-gray-200">
          <div className="text-xs font-medium text-gray-500 mb-2">Before</div>
          <div className="text-lg font-bold text-gray-900">{formatBytes(originalSize)}</div>
          <div className="text-xs text-gray-600 mt-1">
            {Math.round(originalDimensions.width)}×{Math.round(originalDimensions.height)}px
          </div>
        </div>
        <div className="bg-white rounded p-3 border border-green-300">
          <div className="text-xs font-medium text-gray-500 mb-2">After</div>
          <div className="text-lg font-bold text-green-700">{formatBytes(optimizedSize)}</div>
          <div className="text-xs text-gray-600 mt-1">
            {Math.round(optimizedDimensions.width)}×{Math.round(optimizedDimensions.height)}px
          </div>
        </div>
      </div>

      {/* Savings */}
      <div className="bg-white rounded p-3 border border-green-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Savings:</span>
          <span className="text-lg font-bold text-green-700">
            {formatBytes(savings)} ({savingsPercent}%)
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Format: {format.replace('image/', '').toUpperCase()}
        </div>
      </div>

      {/* Actions */}
      {method === 'download' && (
        <div className="space-y-2">
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <div className="text-sm font-medium text-blue-900 mb-1">Next Steps:</div>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Image has been downloaded to your computer</li>
              <li>In Framer, select the node with the original image</li>
              <li>Drag the downloaded image onto the node to replace it</li>
            </ol>
          </div>
          <div className="flex gap-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Again
              </button>
            )}
            {onSelectNode && (
              <button
                onClick={onSelectNode}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                Select Node
              </button>
            )}
          </div>
        </div>
      )}

      {method === 'direct' && (
        <div className="bg-green-100 border border-green-300 rounded p-3">
          <div className="text-sm text-green-800">
            ✓ Image has been automatically replaced in Framer!
          </div>
        </div>
      )}
    </div>
  )
}

