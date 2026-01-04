import type { ProjectAnalysis } from '../../types/analysis'
import { BandwidthCalculator } from '../overview/BandwidthCalculator'
import { spacing, typography, colors, borders } from '../../styles/designTokens'
import { formatTimestamp } from '../../App'

interface BandwidthPanelProps {
  analysis: ProjectAnalysis
  lastScanned?: Date | null
  loading?: boolean
}

export function BandwidthPanel({ analysis, lastScanned, loading }: BandwidthPanelProps) {
  return (
    <div style={{ padding: spacing.lg, backgroundColor: 'var(--framer-color-bg)' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg
      }}>
        <h1 style={{
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.bold,
          color: 'var(--framer-color-text)',
          margin: 0,
          lineHeight: typography.lineHeight.tight
        }}>
          Usage Estimate
        </h1>
        {lastScanned && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            padding: `${spacing.xs} ${spacing.sm}`,
            backgroundColor: colors.warmGray[100],
            borderRadius: borders.radius.md,
            fontSize: typography.fontSize.xs,
            color: 'var(--framer-color-text-secondary)'
          }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: loading ? '#3b82f6' : '#22c55e',
                opacity: loading ? 0.8 : 1,
                flexShrink: 0
              }}
            />
            <span>{loading ? 'analyzing' : formatTimestamp(lastScanned)}</span>
          </div>
        )}
      </div>

      <BandwidthCalculator analysis={analysis} />
    </div>
  )
}
