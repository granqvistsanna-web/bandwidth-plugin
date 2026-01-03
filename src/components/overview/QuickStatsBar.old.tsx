interface QuickStatsBarProps {
  totalAssets: number
  recommendationsCount: number
  pageCount: number
  onRecommendationsClick?: () => void
}

export function QuickStatsBar({
  totalAssets,
  recommendationsCount,
  pageCount,
  onRecommendationsClick
}: QuickStatsBarProps) {
  return (
    <div
      className="rounded-lg px-6 py-4 flex items-center justify-between"
      style={{
        backgroundColor: 'var(--framer-color-bg-secondary)',
        borderTop: '1px solid var(--framer-color-divider)',
        borderBottom: '1px solid var(--framer-color-divider)'
      }}
    >
      {/* Total Assets */}
      <div className="flex items-center gap-2">
        <div className="text-2xl font-bold" style={{ color: 'var(--framer-color-text)' }}>
          {totalAssets}
        </div>
        <div className="text-sm" style={{ color: 'var(--framer-color-text-secondary)' }}>
          Asset{totalAssets !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Divider */}
      <div
        className="w-px h-8"
        style={{ backgroundColor: 'var(--framer-color-divider)' }}
      />

      {/* Recommendations */}
      <button
        onClick={onRecommendationsClick}
        disabled={!onRecommendationsClick || recommendationsCount === 0}
        className="flex items-center gap-2 transition-opacity"
        style={{
          cursor: onRecommendationsClick && recommendationsCount > 0 ? 'pointer' : 'default'
        }}
        onMouseEnter={(e) => {
          if (onRecommendationsClick && recommendationsCount > 0) {
            e.currentTarget.style.opacity = '0.7'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
      >
        <div className="text-2xl font-bold" style={{ color: 'var(--framer-color-text)' }}>
          {recommendationsCount}
        </div>
        <div className="flex items-center gap-1">
          <div className="text-sm" style={{ color: 'var(--framer-color-text-secondary)' }}>
            Recommendation{recommendationsCount !== 1 ? 's' : ''}
          </div>
          {onRecommendationsClick && recommendationsCount > 0 && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--framer-color-tint)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </button>

      {/* Divider */}
      <div
        className="w-px h-8"
        style={{ backgroundColor: 'var(--framer-color-divider)' }}
      />

      {/* Pages */}
      <div className="flex items-center gap-2">
        <div className="text-2xl font-bold" style={{ color: 'var(--framer-color-text)' }}>
          {pageCount}
        </div>
        <div className="text-sm" style={{ color: 'var(--framer-color-text-secondary)' }}>
          Page{pageCount !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
