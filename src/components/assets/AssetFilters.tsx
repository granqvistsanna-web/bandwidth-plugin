import type { AssetFiltersProps, FilterState } from './types'
import { spacing, typography, borders, surfaces, framerColors } from '../../styles/designTokens'

// Theme-aware chevron icon component
function SelectChevron() {
  return (
    <svg
      width="8"
      height="5"
      viewBox="0 0 8 5"
      fill="none"
      style={{
        position: 'absolute',
        right: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none'
      }}
    >
      <path
        d="M1 1L4 4L7 1"
        stroke={framerColors.textSecondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Active filter styling helper
function getSelectStyles(isActive: boolean) {
  return {
    padding: `${spacing.sm} ${spacing.xl} ${spacing.sm} ${spacing.md}`,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: framerColors.text,
    backgroundColor: isActive ? surfaces.secondary : surfaces.primary,
    border: isActive ? '1px solid var(--framer-color-tint)' : 'none',
    borderRadius: borders.radius.md,
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.15s ease',
    appearance: 'none' as const,
    boxShadow: isActive ? '0 0 0 1px var(--framer-color-tint-dimmed)' : 'none'
  }
}

export function AssetFilters({
  filters,
  onFiltersChange,
  sortConfig,
  onSortChange
}: AssetFiltersProps) {
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as FilterState['type']
    onFiltersChange({ ...filters, type })
  }

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: spacing.sm,
      alignItems: 'center',
      width: '100%',
      maxWidth: '100%'
    }}>
      {/* Type filter */}
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <select
          value={filters.type}
          onChange={handleTypeChange}
          style={getSelectStyles(filters.type !== 'all')}
        >
          <option value="all">All</option>
          <option value="image">Images</option>
          <option value="svg">SVGs</option>
          <option value="cms">CMS</option>
        </select>
        {filters.type !== 'all' && (
          <div style={{
            position: 'absolute',
            left: spacing.sm,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--framer-color-tint)',
            pointerEvents: 'none'
          }} />
        )}
        <SelectChevron />
      </div>

      {/* Sort dropdown */}
      {sortConfig && onSortChange && (
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <select
            value={`${sortConfig.column}-${sortConfig.direction}`}
            onChange={(e) => {
              const [column, direction] = e.target.value.split('-') as [typeof sortConfig.column, 'asc' | 'desc']
              onSortChange({ column, direction })
            }}
            style={getSelectStyles(false)}
          >
            <option value="size-desc">Size ↓</option>
            <option value="size-asc">Size ↑</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>
          <SelectChevron />
        </div>
      )}

    </div>
  )
}
