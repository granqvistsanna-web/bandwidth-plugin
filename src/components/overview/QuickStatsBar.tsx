import { spacing, typography, borders, backgrounds, framerColors } from '../../styles/designTokens'

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
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
        gap: spacing.lg,
        alignItems: 'center',
        padding: `${spacing.lg} ${spacing.xl}`,
        backgroundColor: backgrounds.page,
        border: `1px solid var(--framer-color-divider)`,
        borderRadius: borders.radius.lg,
      }}
    >
      {/* Total Assets */}
      <div>
        <div
          style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textTertiary,
            marginBottom: '6px',
            fontWeight: typography.fontWeight.medium,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
          }}
        >
          Assets
        </div>
        <div
          style={{
            fontSize: '28px',
            fontWeight: typography.fontWeight.semibold,
            color: framerColors.text,
            lineHeight: typography.lineHeight.tight,
          }}
        >
          {totalAssets}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '40px',
          backgroundColor: 'var(--framer-color-divider)',
        }}
      />

      {/* Recommendations */}
      <button
        onClick={onRecommendationsClick}
        disabled={!onRecommendationsClick || recommendationsCount === 0}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: onRecommendationsClick && recommendationsCount > 0 ? 'pointer' : 'default',
          textAlign: 'left' as const,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (onRecommendationsClick && recommendationsCount > 0) {
            e.currentTarget.style.opacity = '0.7'
            const numberEl = e.currentTarget.querySelector('[data-number]') as HTMLElement
            if (numberEl) {
              numberEl.style.transform = 'translateX(2px)'
            }
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1'
          const numberEl = e.currentTarget.querySelector('[data-number]') as HTMLElement
          if (numberEl) {
            numberEl.style.transform = 'translateX(0)'
          }
        }}
      >
        <div
          style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textTertiary,
            marginBottom: '6px',
            fontWeight: typography.fontWeight.medium,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
          }}
        >
          Recommendations
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <div
            data-number
            style={{
              fontSize: '28px',
              fontWeight: typography.fontWeight.semibold,
              color: framerColors.text,
              lineHeight: typography.lineHeight.tight,
              transition: 'transform 0.15s ease',
            }}
          >
            {recommendationsCount}
          </div>
          {onRecommendationsClick && recommendationsCount > 0 && (
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: framerColors.textTertiary }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </button>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '40px',
          backgroundColor: 'var(--framer-color-divider)',
        }}
      />

      {/* Pages */}
      <div>
        <div
          style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textTertiary,
            marginBottom: '6px',
            fontWeight: typography.fontWeight.medium,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
          }}
        >
          Pages
        </div>
        <div
          style={{
            fontSize: '28px',
            fontWeight: typography.fontWeight.semibold,
            color: framerColors.text,
            lineHeight: typography.lineHeight.tight,
          }}
        >
          {pageCount}
        </div>
      </div>
    </div>
  )
}
