import type { ProjectAnalysis } from '../../types/analysis'
import { BandwidthCalculator } from '../overview/BandwidthCalculator'
import { spacing, typography, colors, borders, surfaces, themeBorders, themeElevation, framerColors, backgrounds } from '../../styles/designTokens'
import { formatTimestamp } from '../../utils/formatTimestamp'

interface BandwidthPanelProps {
  analysis: ProjectAnalysis
  lastScanned?: Date | null
  loading?: boolean
}

export function BandwidthPanel({ analysis, lastScanned, loading }: BandwidthPanelProps) {
  return (
    <div style={{
      padding: spacing.lg,
      backgroundColor: backgrounds.page,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md,
      height: '100%'
    }}>
      {/* Compact Header */}
      <div style={{
        marginBottom: spacing.xl
      }}>
        <h1 style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.bold,
          color: framerColors.text,
          margin: 0,
          marginBottom: spacing.xs,
          lineHeight: typography.lineHeight.tight,
          letterSpacing: '-0.02em'
        }}>
          Usage Estimate
        </h1>
        {lastScanned && (
          <div style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textSecondary
          }}>
            {loading ? 'Analyzing...' : `Scanned ${formatTimestamp(lastScanned)}`}
          </div>
        )}
      </div>

      <BandwidthCalculator analysis={analysis} />
    </div>
  )
}
