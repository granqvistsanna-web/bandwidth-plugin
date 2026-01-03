import type { ProjectAnalysis } from '../../types/analysis'
import { BandwidthCalculator } from '../overview/BandwidthCalculator'
import { spacing, typography, colors } from '../../styles/designTokens'

interface BandwidthPanelProps {
  analysis: ProjectAnalysis
}

export function BandwidthPanel({ analysis }: BandwidthPanelProps) {
  return (
    <div className="p-6" style={{ backgroundColor: 'var(--framer-color-bg)' }}>
      <div style={{ marginBottom: spacing.xl }}>
        <h2
          style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: 'var(--framer-color-text)',
            marginBottom: spacing.xs,
          }}
        >
          Bandwidth Usage Estimator
        </h2>
        <p
          style={{
            fontSize: typography.fontSize.sm,
            color: 'var(--framer-color-text-secondary)',
          }}
        >
          Calculate your expected monthly bandwidth usage based on traffic patterns and page weight.
        </p>
      </div>

      <BandwidthCalculator analysis={analysis} />
    </div>
  )
}
