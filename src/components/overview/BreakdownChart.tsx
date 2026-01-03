import type { BreakdownData } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'

interface BreakdownChartProps {
  breakdown: BreakdownData
  totalBytes: number
}

export function BreakdownChart({ breakdown, totalBytes }: BreakdownChartProps) {
  const items = [
    { label: 'Images', bytes: breakdown.images, color: '#3b82f6' },
    { label: 'Fonts', bytes: breakdown.fonts, color: '#a855f7' },
    { label: 'HTML/CSS/JS', bytes: breakdown.htmlCss, color: '#22c55e' },
    { label: 'SVG', bytes: breakdown.svg, color: '#eab308' }
  ]

  return (
    <div className="space-y-3">
      {items.map(item => {
        const percentage = totalBytes > 0 ? (item.bytes / totalBytes) * 100 : 0

        return (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium" style={{ color: 'var(--framer-color-text)' }}>{item.label}</span>
              <span className="font-semibold" style={{ color: 'var(--framer-color-text-secondary)' }}>
                {formatBytes(item.bytes)} <span className="font-normal opacity-75">({percentage.toFixed(1)}%)</span>
              </span>
            </div>
            <div 
              className="w-full rounded-full h-2"
              style={{ backgroundColor: 'var(--framer-color-bg-tertiary)' }}
            >
              <div
                className="h-2 rounded-full transition-all"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: item.color
                }}
              ></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
