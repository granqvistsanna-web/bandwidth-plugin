import { useState } from 'react'
import type { AssetFiltersProps, FilterState } from './types'
import { spacing, typography, borders, colors } from '../../styles/designTokens'

export function AssetFilters({
  filters,
  onFiltersChange,
  searchQuery,
  onSearchChange,
  assetCounts
}: AssetFiltersProps) {
  const [showFiltersPopover, setShowFiltersPopover] = useState(false)

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as FilterState['type']
    onFiltersChange({ ...filters, type })
  }

  const toggleLargeFiles = () => {
    const isActive = filters.sizeRange.min === 500 * 1024
    onFiltersChange({
      ...filters,
      sizeRange: isActive ? { min: 0, max: Infinity } : { min: 500 * 1024, max: Infinity }
    })
  }

  const toggleUnoptimized = () => {
    const isActive = filters.format === 'png' || filters.format === 'jpg'
    onFiltersChange({
      ...filters,
      format: isActive ? 'all' : 'png'
    })
  }

  const isLargeFilesActive = filters.sizeRange.min === 500 * 1024
  const isUnoptimizedActive = filters.format === 'png' || filters.format === 'jpg'
  const activeFilterCount = (isLargeFilesActive ? 1 : 0) + (isUnoptimizedActive ? 1 : 0)

  const clearAllFilters = () => {
    onFiltersChange({
      type: 'all',
      sizeRange: { min: 0, max: Infinity },
      format: 'all',
      pageUsage: 'all'
    })
    onSearchChange('')
  }

  return (
    <div
      style={{
        padding: spacing.sm,
        backgroundColor: 'var(--framer-color-bg)',
      }}
    >
      {/* Single Row: Search + Type + Filters */}
      <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
        {/* Search Input */}
        <div className="relative" style={{ flex: 1, minWidth: 0 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            style={{
              width: '100%',
              padding: `6px ${spacing.sm}`,
              paddingRight: searchQuery ? '28px' : spacing.sm,
              fontSize: typography.fontSize.xs,
              color: colors.almostBlack,
              backgroundColor: colors.white,
              border: `1px solid ${colors.warmGray[200]}`,
              borderRadius: borders.radius.md,
              transition: 'all 0.15s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.warmGray[400]
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.05)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.warmGray[200]
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-1.5 top-1/2 transform -translate-y-1/2"
              style={{
                color: 'var(--framer-color-text-tertiary)',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--framer-color-text)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--framer-color-text-tertiary)'
              }}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
            </button>
          )}
        </div>

        {/* Type Dropdown */}
        <select
          value={filters.type}
          onChange={handleTypeChange}
          style={{
            padding: `6px ${spacing.sm}`,
            paddingRight: spacing.lg,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: colors.almostBlack,
            backgroundColor: colors.white,
            border: `1px solid ${colors.warmGray[200]}`,
            borderRadius: borders.radius.md,
            cursor: 'pointer',
            minWidth: '100px',
            transition: 'all 0.15s ease',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23525252' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = colors.warmGray[400]
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.05)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = colors.warmGray[200]
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <option value="all">All ({assetCounts.all})</option>
          <option value="image">Images ({assetCounts.images})</option>
          <option value="svg">SVGs ({assetCounts.svgs})</option>
          <option value="cms">CMS ({assetCounts.cms})</option>
        </select>

        {/* Filters Button with Popover */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFiltersPopover(!showFiltersPopover)}
            style={{
              padding: `6px ${spacing.sm}`,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: activeFilterCount > 0 ? 'var(--framer-color-bg)' : 'var(--framer-color-text)',
              backgroundColor: activeFilterCount > 0 ? 'var(--framer-color-text)' : 'var(--framer-color-bg)',
              border: `1px solid ${activeFilterCount > 0 ? 'var(--framer-color-text)' : 'var(--framer-color-divider)'}`,
              borderRadius: borders.radius.md,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (activeFilterCount === 0) {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeFilterCount === 0) {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg)'
              }
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {activeFilterCount > 0 && (
              <span
            style={{
                  fontSize: '10px',
                  fontWeight: typography.fontWeight.semibold,
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: borders.radius.sm,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.white,
                  color: colors.gray[800],
                }}
              >
                {activeFilterCount}
          </span>
            )}
          </button>

          {/* Filters Popover */}
          {showFiltersPopover && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                zIndex: 50,
                minWidth: '200px',
                padding: spacing.sm,
                backgroundColor: 'var(--framer-color-bg)',
                border: `1px solid var(--framer-color-divider)`,
                borderRadius: borders.radius.md,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                {/* Large Files Toggle */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    padding: `${spacing.xs} ${spacing.sm}`,
                    cursor: 'pointer',
                    borderRadius: borders.radius.sm,
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isLargeFilesActive}
                    onChange={toggleLargeFiles}
                    style={{ cursor: 'pointer' }}
                  />
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.medium,
                      color: 'var(--framer-color-text)',
                      flex: 1,
                    }}
                  >
                    Large files (500KB+)
                  </span>
                </label>

                {/* Unoptimized Toggle */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    padding: `${spacing.xs} ${spacing.sm}`,
                    cursor: 'pointer',
                    borderRadius: borders.radius.sm,
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isUnoptimizedActive}
                    onChange={toggleUnoptimized}
                    style={{ cursor: 'pointer' }}
                  />
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.medium,
                      color: 'var(--framer-color-text)',
                      flex: 1,
                    }}
                  >
                    Unoptimized (PNG/JPG)
                  </span>
                </label>

                {/* Clear Filters */}
                {activeFilterCount > 0 && (
                  <>
                    <div style={{ height: '1px', backgroundColor: 'var(--framer-color-divider)', margin: `${spacing.xs} 0` }} />
              <button
                      onClick={() => {
                        onFiltersChange({ ...filters, sizeRange: { min: 0, max: Infinity }, format: 'all' })
                        setShowFiltersPopover(false)
                      }}
                      style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.medium,
                        color: 'var(--framer-color-text-secondary)',
                        textAlign: 'left',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: borders.radius.sm,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                        e.currentTarget.style.color = 'var(--framer-color-text)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = 'var(--framer-color-text-secondary)'
                      }}
                    >
                      Clear filters
              </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clear All Button (only if search or type filter active) */}
        {(searchQuery || filters.type !== 'all') && (
            <button
              onClick={clearAllFilters}
            style={{
              padding: `6px ${spacing.sm}`,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: 'var(--framer-color-text-secondary)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--framer-color-text)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--framer-color-text-secondary)'
            }}
          >
            Clear
            </button>
          )}
        </div>
    </div>
  )
}
