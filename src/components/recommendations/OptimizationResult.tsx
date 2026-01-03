import { formatBytes } from '../../utils/formatBytes'

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
    <div 
      className="border rounded-lg p-4 space-y-4"
      style={{
        backgroundColor: '#dcfce7',
        borderColor: '#86efac'
      }}
    >
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#22c55e' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h4 className="font-semibold" style={{ color: '#166534' }}>Image Optimized Successfully!</h4>
      </div>

      {/* Before/After Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          className="rounded p-3 border"
          style={{
            backgroundColor: 'var(--framer-color-bg)',
            borderColor: 'var(--framer-color-divider)'
          }}
        >
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--framer-color-text-tertiary)' }}>Before</div>
          <div className="text-lg font-bold" style={{ color: 'var(--framer-color-text)' }}>{formatBytes(originalSize)}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--framer-color-text-secondary)' }}>
            {Math.round(originalDimensions.width)}×{Math.round(originalDimensions.height)}px
          </div>
        </div>
        <div 
          className="rounded p-3 border"
          style={{
            backgroundColor: 'var(--framer-color-bg)',
            borderColor: '#22c55e'
          }}
        >
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--framer-color-text-tertiary)' }}>After</div>
          <div className="text-lg font-bold" style={{ color: '#166534' }}>{formatBytes(optimizedSize)}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--framer-color-text-secondary)' }}>
            {Math.round(optimizedDimensions.width)}×{Math.round(optimizedDimensions.height)}px
          </div>
        </div>
      </div>

      {/* Savings */}
      <div 
        className="rounded p-3 border"
        style={{
          backgroundColor: 'var(--framer-color-bg)',
          borderColor: '#86efac'
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: 'var(--framer-color-text)' }}>Savings:</span>
          <span className="text-lg font-bold" style={{ color: '#166534' }}>
            {formatBytes(savings)} ({savingsPercent}%)
          </span>
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--framer-color-text-tertiary)' }}>
          Format: {format.replace('image/', '').toUpperCase()}
        </div>
      </div>

      {/* Actions */}
      {method === 'download' && (
        <div className="space-y-2">
          <div 
            className="border rounded p-3"
            style={{
              backgroundColor: 'var(--framer-color-tint-dimmed)',
              borderColor: 'var(--framer-color-divider)'
            }}
          >
            <div className="text-sm font-medium mb-1" style={{ color: 'var(--framer-color-tint)' }}>Next Steps:</div>
            <ol className="text-xs space-y-1 list-decimal list-inside" style={{ color: 'var(--framer-color-text)' }}>
              <li>Image has been downloaded to your computer</li>
              <li>In Framer, select the node with the original image</li>
              <li>Drag the downloaded image onto the node to replace it</li>
            </ol>
          </div>
          <div className="flex gap-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: '#22c55e',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#16a34a'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#22c55e'
                }}
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
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--framer-color-tint)',
                  color: 'var(--framer-color-text-reversed)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--framer-color-tint-dark)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--framer-color-tint)'
                }}
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
        <div 
          className="border rounded p-3"
          style={{
            backgroundColor: '#dcfce7',
            borderColor: '#86efac'
          }}
        >
          <div className="text-sm" style={{ color: '#166534' }}>
            ✓ Image has been automatically replaced in Framer!
          </div>
        </div>
      )}
    </div>
  )
}

