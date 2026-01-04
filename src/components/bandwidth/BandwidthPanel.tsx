import type { ProjectAnalysis } from '../../types/analysis'
import { BandwidthCalculator } from '../overview/BandwidthCalculator'
import { spacing, typography, framerColors, backgrounds } from '../../styles/designTokens'
import { StatusIndicator } from '../common/StatusIndicator'

interface BandwidthPanelProps {
  analysis: ProjectAnalysis
  lastScanned?: Date | null
  loading?: boolean
  onNavigateToRecommendations?: () => void
}

export function BandwidthPanel({ analysis, lastScanned, loading, onNavigateToRecommendations }: BandwidthPanelProps) {
  return (
    <div style={{
      padding: spacing.lg,
      backgroundColor: backgrounds.page,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm
      }}>
        <h1 style={{
          fontSize: typography.fontSize.md,
          fontWeight: typography.fontWeight.bold,
          color: framerColors.text,
          margin: 0,
          lineHeight: typography.lineHeight.tight,
          letterSpacing: typography.letterSpacing.tighter
        }}>
          Usage Estimate
        </h1>
        <StatusIndicator
          lastScanned={lastScanned}
          loading={loading}
        />
      </div>

      <BandwidthCalculator
        analysis={analysis}
        onNavigateToRecommendations={onNavigateToRecommendations}
      />
    </div>
  )
}
