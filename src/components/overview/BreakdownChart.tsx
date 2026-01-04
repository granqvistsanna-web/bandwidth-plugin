import type { BreakdownData } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'
import { spacing, typography, colors, surfaces, themeBorders, themeElevation, framerColors } from '../../styles/designTokens'

interface BreakdownChartProps {
  breakdown: BreakdownData
  totalBytes: number
}

export function BreakdownChart({ breakdown, totalBytes }: BreakdownChartProps) {
  // Use fixed semantic colors that work well in both light and dark modes
  const items = [
    { label: 'Images', bytes: breakdown.images, shade: colors.accent.primary }, // Primary blue
    { label: 'Fonts', bytes: breakdown.fonts, shade: '#8B5CF6' }, // Purple - visible in both modes
    { label: 'HTML/CSS/JS', bytes: breakdown.htmlCss, shade: '#14B8A6' }, // Teal - visible in both modes
    { label: 'SVG', bytes: breakdown.svg, shade: '#F59E0B' } // Orange - visible in both modes
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: spacing.sm }}>
      {items.map(item => {
        const percentage = totalBytes > 0 ? (item.bytes / totalBytes) * 100 : 0

        return (
          <div key={item.label}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.xs,
              }}
            >
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: framerColors.text,
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  color: framerColors.textSecondary,
                }}
              >
                {formatBytes(item.bytes)} <span style={{ opacity: 0.7 }}>({percentage.toFixed(1)}%)</span>
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                backgroundColor: surfaces.tertiary,
                overflow: 'hidden' as const,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${percentage}%`,
                  backgroundColor: item.shade,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
