import type { ProjectAnalysis } from '../../types/analysis'
import { spacing, typography, borders, surfaces, themeBorders, framerColors } from '../../styles/designTokens'

interface PageSelectorProps {
  analysis: ProjectAnalysis
  selectedPageId: string | null
  onPageChange: (pageId: string | null) => void
}

export function PageSelector({ analysis, selectedPageId, onPageChange }: PageSelectorProps) {
  const pages = analysis.pages || []

  return (
    <div
      style={{
        padding: `${spacing.sm} ${spacing.lg}`,
        borderBottom: `${borders.width.thin} solid ${themeBorders.subtle}`,
        backgroundColor: surfaces.secondary,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
      }}
    >
      <label
        style={{
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
          color: framerColors.textSecondary,
          whiteSpace: 'nowrap' as const,
        }}
      >
        Page:
      </label>
      <select
        value={selectedPageId || 'all'}
        onChange={(e) => onPageChange(e.target.value === 'all' ? null : e.target.value)}
        style={{
          flex: 1,
          padding: `${spacing.sm} ${spacing.xl} ${spacing.sm} ${spacing.md}`,
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
          color: framerColors.text,
          backgroundColor: surfaces.tertiary,
          border: 'none',
          borderRadius: borders.radius.md,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L4 4L7 1' stroke='%23525252' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center'
        }}
      >
        <option value="all">All Pages ({analysis.overallBreakpoints.desktop.assets.length} assets)</option>
        {pages.map((page) => (
          <option key={page.pageId} value={page.pageId}>
            {page.pageName} ({page.breakpoints.desktop.assets.length} assets)
          </option>
        ))}
      </select>
    </div>
  )
}
