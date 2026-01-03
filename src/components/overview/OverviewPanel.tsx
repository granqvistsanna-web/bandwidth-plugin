import type { ProjectAnalysis, Breakpoint } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'
import { BreakpointTabs } from './BreakpointTabs'
import { BreakdownChart } from './BreakdownChart'

interface OverviewPanelProps {
  analysis: ProjectAnalysis
  selectedBreakpoint: Breakpoint
  onBreakpointChange: (breakpoint: Breakpoint) => void
}

export function OverviewPanel({ analysis, selectedBreakpoint, onBreakpointChange }: OverviewPanelProps) {
  const breakpointData = analysis.overallBreakpoints[selectedBreakpoint]

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-sm font-medium text-gray-600 mb-2">Breakpoint</h2>
        <BreakpointTabs
          selectedBreakpoint={selectedBreakpoint}
          onBreakpointChange={onBreakpointChange}
        />
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-900 mb-1">Estimated Page Weight</h3>
        <div className="text-4xl font-bold text-blue-900">
          {formatBytes(breakpointData.totalBytes)}
        </div>
        <p className="text-sm text-blue-700 mt-2">
          First page load across {analysis.totalPages} page{analysis.totalPages !== 1 ? 's' : ''}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Breakdown</h3>
        <BreakdownChart breakdown={breakpointData.breakdown} totalBytes={breakpointData.totalBytes} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Assets</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">
            {breakpointData.assets.length}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Recommendations</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">
            {analysis.allRecommendations.length}
          </div>
        </div>
      </div>
    </div>
  )
}
