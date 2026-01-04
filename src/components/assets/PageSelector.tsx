import type { ProjectAnalysis } from '../../types/analysis'
import { spacing, typography, borders, colors, surfaces, themeBorders, themeElevation, framerColors } from '../../styles/designTokens'

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
          padding: `6px ${spacing.md}`,
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
          color: framerColors.text,
          backgroundColor: surfaces.primary,
          borderRadius: borders.radius.md,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(128, 128, 128, 0.1)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none'
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
