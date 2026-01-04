import { formatBytes } from '../../utils/formatBytes'
import { Button } from '../primitives/Button'
import { spacing, typography, borders, surfaces } from '../../styles/designTokens'
import { calculateLoadTime, formatLoadTime } from '../../utils/loadTime'

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
  
  // Calculate health score (0-100)
  const healthScore = hasSavings 
    ? Math.max(0, Math.min(100, 100 - parseFloat(savingsPercent)))
    : 100
  
  // Determine health status
  const getHealthStatus = (score: number) => {
    if (score >= 85) return { label: 'Excellent', color: 'var(--status-success-solid)' }
    if (score >= 70) return { label: 'Good', color: 'var(--status-info-solid)' }
    if (score >= 50) return { label: 'Fair', color: 'var(--status-warning-solid)' }
    return { label: 'Needs Work', color: 'var(--status-error-solid)' }
  }
  
  const healthStatus = getHealthStatus(healthScore)
  const savingsPercentNum = parseFloat(savingsPercent)
  
  // Calculate load times
  const loadTime3G = calculateLoadTime(currentBytes, '3g')
  const loadTime4G = calculateLoadTime(currentBytes, '4g')
  
  // Determine warning level for page weight
  const mb = currentBytes / (1024 * 1024)
  const showWarning = mb >= 5
  const showCritical = mb >= 10

  return (
    <div
      style={{
        backgroundColor: surfaces.secondary,
        border: `1px solid var(--framer-color-divider)`,
        borderRadius: borders.radius.lg,
        padding: spacing.lg,
      }}
    >
      {/* Total Page Weight - Prominent */}
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
          <div
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: framerColors.textSecondary,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.05em',
            }}
          >
            Total Page Weight
          </div>
          {showWarning && (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: showCritical ? 'var(--status-error-solid)' : 'var(--status-warning-solid)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>
        <div
          style={{
            fontSize: '36px',
            fontWeight: typography.fontWeight.bold,
            color: showCritical ? 'var(--status-error-solid)' : showWarning ? 'var(--status-warning-solid)' : framerColors.text,
            lineHeight: typography.lineHeight.tight,
            marginBottom: spacing.sm,
          }}
        >
          {formatBytes(currentBytes)}
        </div>
        
        {/* Load Time Estimates */}
        <div style={{ display: 'flex', gap: spacing.lg }}>
          <div>
            <div
              style={{
                fontSize: typography.fontSize.xs,
                color: framerColors.textTertiary,
                marginBottom: '2px',
              }}
            >
              3G
            </div>
            <div
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: loadTime3G > 10 ? 'var(--status-warning-solid)' : framerColors.text,
              }}
            >
              {formatLoadTime(loadTime3G)}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: typography.fontSize.xs,
                color: framerColors.textTertiary,
                marginBottom: '2px',
              }}
            >
              4G
            </div>
            <div
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: loadTime4G > 5 ? 'var(--status-warning-solid)' : framerColors.text,
              }}
            >
              {formatLoadTime(loadTime4G)}
            </div>
          </div>
        </div>
      </div>


      {hasSavings && (
        <>
          {/* Potential Savings - Prominent Section */}
          <div
            style={{
              padding: spacing.md,
              backgroundColor: 'var(--framer-color-bg-secondary)',
              borderRadius: borders.radius.md,
              marginBottom: spacing.lg,
              border: `1px solid ${healthStatus.color}30`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: healthStatus.color }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <div
                style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  color: framerColors.textSecondary,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.05em',
                }}
              >
                Potential Savings
              </div>
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: typography.fontWeight.bold,
                color: healthStatus.color,
                lineHeight: typography.lineHeight.tight,
                marginBottom: '4px',
              }}
            >
              {formatBytes(savingsBytes)}
            </div>
            <div
              style={{
                fontSize: typography.fontSize.xs,
                color: healthStatus.color,
                marginBottom: spacing.sm,
              }}
            >
              ({savingsPercent}% reduction)
            </div>
            
            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'var(--framer-color-divider)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(savingsPercentNum, 100)}%`,
                  height: '100%',
                  backgroundColor: healthStatus.color,
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        </>
      )}


      {!hasSavings && (
        <div
          style={{
            paddingTop: spacing.md,
            borderTop: `1px solid var(--framer-color-divider)`,
            marginTop: spacing.md,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              fontSize: typography.fontSize.sm,
              color: framerColors.textSecondary,
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Your project is already optimized</span>
          </div>
        </div>
      )}
    </div>
  )
}



