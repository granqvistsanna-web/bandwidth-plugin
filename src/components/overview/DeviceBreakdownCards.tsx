import { formatBytes } from '../../utils/formatBytes'
import { spacing, typography, borders, framerColors } from '../../styles/designTokens'
import type { ProjectAnalysis } from '../../types/analysis'

interface DeviceBreakdownCardsProps {
  analysis: ProjectAnalysis
}

export function DeviceBreakdownCards({ analysis }: DeviceBreakdownCardsProps) {
  const devices = [
    {
      name: 'Desktop',
      breakpoint: 'desktop' as const,
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Tablet',
      breakpoint: 'tablet' as const,
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Mobile',
      breakpoint: 'mobile' as const,
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    }
  ]

  const getSizeColor = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    if (mb >= 5) return '#ef4444' // Red for very large
    if (mb >= 2) return '#f59e0b' // Orange for large
    return framerColors.text // Default
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.md }}>
      {devices.map(device => {
        const data = analysis.overallBreakpoints[device.breakpoint]
        const sizeColor = getSizeColor(data.totalBytes)
        
        return (
          <div
            key={device.breakpoint}
            style={{
              backgroundColor: '#FAF9F8',
              border: `1px solid var(--framer-color-divider)`,
              borderRadius: borders.radius.md,
              padding: spacing.md,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <div style={{ color: framerColors.textSecondary, flexShrink: 0 }}>
              {device.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: typography.fontSize.xs,
                  color: framerColors.textSecondary,
                  marginBottom: '2px',
                }}
              >
                {device.name}
              </div>
              <div
                style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: sizeColor,
                }}
              >
                {formatBytes(data.totalBytes)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}



