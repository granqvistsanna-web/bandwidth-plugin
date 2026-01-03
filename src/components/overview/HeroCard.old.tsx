import { formatBytes } from '../../utils/formatBytes'

interface HeroCardProps {
  currentBytes: number
  optimizedBytes: number
  savingsBytes: number
  savingsPercent: string
  recommendationsCount: number
  pageCount: number
  onOptimizeClick?: () => void
}

export function HeroCard({
  currentBytes,
  optimizedBytes,
  savingsBytes,
  savingsPercent,
  recommendationsCount,
  pageCount,
  onOptimizeClick
}: HeroCardProps) {
  const hasSavings = savingsBytes > 0

  return (
    <div
      className="rounded-lg p-6"
      style={{
        background: hasSavings
          ? 'linear-gradient(to bottom right, #22c55e, #16a34a)'
          : 'linear-gradient(to bottom right, var(--framer-color-tint-dimmed), var(--framer-color-bg-secondary))',
        boxShadow: hasSavings ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
      }}
    >
      <h3
        className="text-xs font-medium mb-4 uppercase tracking-wide"
        style={{ color: hasSavings ? 'rgba(255, 255, 255, 0.9)' : 'var(--framer-color-text-tertiary)' }}
      >
        Project Health
      </h3>

      {/* Metrics Row */}
      <div className="flex items-center gap-4 mb-4">
        {/* Current Size */}
        <div className="flex-1">
          <div
            className="text-xs mb-1"
            style={{ color: hasSavings ? 'rgba(255, 255, 255, 0.85)' : 'var(--framer-color-text-secondary)' }}
          >
            Current Size
          </div>
          <div
            className="text-3xl font-bold"
            style={{ color: hasSavings ? 'white' : 'var(--framer-color-text)' }}
          >
            {formatBytes(currentBytes)}
          </div>
        </div>

        {hasSavings && (
          <>
            {/* Arrow */}
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="white">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Optimized Size */}
            <div className="flex-1">
              <div className="text-xs mb-1" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                Optimized
              </div>
              <div className="text-3xl font-bold" style={{ color: 'white' }}>
                {formatBytes(optimizedBytes)}
              </div>
            </div>

            {/* Savings Badge */}
            <div className="flex-shrink-0 text-right">
              <div
                className="inline-block px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="text-xs font-medium mb-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  Savings
                </div>
                <div className="text-2xl font-bold" style={{ color: 'white' }}>
                  {savingsPercent}%
                </div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  {formatBytes(savingsBytes)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Metadata */}
      <p
        className="text-xs mb-4"
        style={{ color: hasSavings ? 'rgba(255, 255, 255, 0.85)' : 'var(--framer-color-text-secondary)' }}
      >
        Desktop viewport (1440px) • {pageCount} {pageCount === 1 ? 'page' : 'pages'}
      </p>

      {/* Action Row */}
      {hasSavings && onOptimizeClick && (
        <div className="pt-4 border-t border-white/20">
          <div className="text-xs font-medium mb-3" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {recommendationsCount} optimization {recommendationsCount !== 1 ? 'opportunities' : 'opportunity'}
          </div>
          <button
            onClick={onOptimizeClick}
            className="w-full px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'white',
              color: '#16a34a'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            View Recommendations
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {!hasSavings && (
        <div className="pt-4 border-t" style={{ borderColor: 'var(--framer-color-divider)' }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--framer-color-text-secondary)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--framer-color-tint)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Your project is already optimized!</span>
          </div>
        </div>
      )}
    </div>
  )
}
