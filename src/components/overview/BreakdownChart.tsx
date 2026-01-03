import type { BreakdownData } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'

interface BreakdownChartProps {
  breakdown: BreakdownData
  totalBytes: number
}

export function BreakdownChart({ breakdown, totalBytes }: BreakdownChartProps) {
  const items = [
    { label: 'Images', bytes: breakdown.images, color: 'bg-blue-500' },
    { label: 'Fonts', bytes: breakdown.fonts, color: 'bg-purple-500' },
    { label: 'HTML/CSS/JS', bytes: breakdown.htmlCss, color: 'bg-green-500' },
    { label: 'SVG', bytes: breakdown.svg, color: 'bg-yellow-500' }
  ]

  return (
    <div className="space-y-3">
      {items.map(item => {
        const percentage = totalBytes > 0 ? (item.bytes / totalBytes) * 100 : 0

        return (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">{item.label}</span>
              <span className="text-gray-600">{formatBytes(item.bytes)} ({percentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${item.color} h-2 rounded-full transition-all`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
