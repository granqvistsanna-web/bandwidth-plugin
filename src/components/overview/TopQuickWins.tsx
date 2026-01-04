import { formatBytes } from '../../utils/formatBytes'
import { spacing, typography, borders, colors } from '../../styles/designTokens'
import type { Recommendation } from '../../types/analysis'

interface TopQuickWinsProps {
  recommendations: Recommendation[]
  onItemClick?: (recommendation: Recommendation) => void
}

export function TopQuickWins({ recommendations, onItemClick }: TopQuickWinsProps) {
  // Get top 3 by potential savings
  const top3 = [...recommendations]
    .sort((a, b) => b.potentialSavings - a.potentialSavings)
    .slice(0, 3)

  if (top3.length === 0) {
    return null
  }

  const getNumberColor = (index: number) => {
    const colors = ['#0099FF', '#22c55e', '#3b82f6'] // Blue, Green, Blue
    return colors[index] || colors[0]
  }

  const getSavingsPercent = (current: number, savings: number) => {
    if (current === 0) return '0'
    return ((savings / current) * 100).toFixed(0)
  }

  return (
    <div
      style={{
        backgroundColor: '#FAF9F8',
        border: `1px solid var(--framer-color-divider)`,
        borderRadius: borders.radius.lg,
        padding: spacing.lg,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: 'var(--framer-color-text)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h3
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: 'var(--framer-color-text)',
          }}
        >
          Top 3 Quick Wins
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {top3.map((rec, index) => {
          const savingsPercent = getSavingsPercent(rec.currentBytes, rec.potentialSavings)
          const numberColor = getNumberColor(index)
          
          return (
            <div
              key={rec.id}
              onClick={() => onItemClick?.(rec)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: spacing.sm,
                padding: spacing.sm,
                borderRadius: borders.radius.md,
                cursor: onItemClick ? 'pointer' : 'default',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (onItemClick) {
                  e.currentTarget.style.backgroundColor = '#F5F4F3'
                }
              }}
              onMouseLeave={(e) => {
                if (onItemClick) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              {/* Number Badge */}
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: numberColor,
                  color: colors.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: 'var(--framer-color-text)',
                    marginBottom: '6px',
                  }}
                >
                  {rec.nodeName}
                </div>
                <div
                  style={{
                    fontSize: typography.fontSize.xs,
                    color: 'var(--framer-color-text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  {rec.actionable || rec.description}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.semibold,
                      color: '#22c55e',
                    }}
                  >
                    -{formatBytes(rec.potentialSavings)}
                  </span>
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: '#22c55e',
                    }}
                  >
                    -{savingsPercent}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

