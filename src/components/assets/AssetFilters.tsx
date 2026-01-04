import type { AssetFiltersProps, FilterState } from './types'
import { spacing, typography, borders, surfaces, framerColors } from '../../styles/designTokens'

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
      {/* Type + Sort combined */}
      <select
        value={filters.type}
        onChange={handleTypeChange}
        style={{
          padding: `${spacing.sm} ${spacing.xl} ${spacing.sm} ${spacing.md}`,
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
          color: framerColors.text,
          backgroundColor: surfaces.primary,
          border: 'none',
          borderRadius: borders.radius.md,
          cursor: 'pointer',
          flex: 1,
          minWidth: 0,
          transition: 'all 0.15s ease',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L4 4L7 1' stroke='%23525252' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
        }}
      >
        <option value="all">All</option>
        <option value="image">Images</option>
        <option value="svg">SVGs</option>
        <option value="cms">CMS</option>
      </select>

      {/* Sort dropdown */}
      {sortConfig && onSortChange && (
        <select
          value={`${sortConfig.column}-${sortConfig.direction}`}
          onChange={(e) => {
            const [column, direction] = e.target.value.split('-') as [typeof sortConfig.column, 'asc' | 'desc']
            onSortChange({ column, direction })
          }}
          style={{
            padding: `${spacing.sm} ${spacing.xl} ${spacing.sm} ${spacing.md}`,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: framerColors.text,
            backgroundColor: surfaces.primary,
            border: 'none',
            borderRadius: borders.radius.md,
            cursor: 'pointer',
            flex: 1,
            minWidth: 0,
            transition: 'all 0.15s ease',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L4 4L7 1' stroke='%23525252' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          <option value="size-desc">Size ↓</option>
          <option value="size-asc">Size ↑</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
        </select>
      )}

    </div>
  )
}
