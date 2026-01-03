import type { Breakpoint } from '../../types/analysis'

interface BreakpointTabsProps {
  selectedBreakpoint: Breakpoint
  onBreakpointChange: (breakpoint: Breakpoint) => void
}

export function BreakpointTabs({ selectedBreakpoint, onBreakpointChange }: BreakpointTabsProps) {
  const breakpoints: { id: Breakpoint; label: string; width: string }[] = [
    { id: 'mobile', label: 'Mobile', width: '375px' },
    { id: 'tablet', label: 'Tablet', width: '768px' },
    { id: 'desktop', label: 'Desktop', width: '1440px' }
  ]

  return (
    <div className="flex gap-2">
      {breakpoints.map(bp => (
        <button
          key={bp.id}
          onClick={() => onBreakpointChange(bp.id)}
          className={`flex-1 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
            selectedBreakpoint === bp.id
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <div className="font-semibold">{bp.label}</div>
          <div className="text-xs opacity-75 mt-1">{bp.width}</div>
        </button>
      ))}
    </div>
  )
}
