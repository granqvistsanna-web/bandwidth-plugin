import { useState, useEffect, useRef } from 'react'
import type { AssetFiltersProps, FilterState } from './types'
import { spacing, typography, borders, colors, surfaces, themeBorders, themeElevation, framerColors } from '../../styles/designTokens'

export function AssetFilters({
  filters,
  onFiltersChange,
  assetCounts,
  sortConfig,
  onSortChange
}: AssetFiltersProps) {
  const [showFiltersPopover, setShowFiltersPopover] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowFiltersPopover(false)
      }
    }

    if (showFiltersPopover) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showFiltersPopover])

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
          padding: `4px 24px 4px ${spacing.xs}`,
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
          color: framerColors.text,
          backgroundColor: surfaces.primary,
          border: `1px solid ${themeBorders.subtle}`,
          borderRadius: borders.radius.md,
          cursor: 'pointer',
          flex: '0 0 auto',
          minWidth: '90px',
          maxWidth: '100%',
          transition: 'all 0.15s ease',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23525252' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 6px center',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = framerColors.text
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(128, 128, 128, 0.1)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = themeBorders.subtle
          e.currentTarget.style.boxShadow = 'none'
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
            padding: `4px 24px 4px ${spacing.xs}`,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: framerColors.text,
            backgroundColor: surfaces.primary,
            border: `1px solid ${themeBorders.subtle}`,
            borderRadius: borders.radius.md,
            cursor: 'pointer',
            flex: '0 0 auto',
            minWidth: '85px',
            maxWidth: '100%',
            transition: 'all 0.15s ease',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23525252' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 6px center',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = framerColors.text
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(128, 128, 128, 0.1)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = themeBorders.subtle
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <option value="size-desc">Size ↓</option>
          <option value="size-asc">Size ↑</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
        </select>
      )}

      {/* Filters Button with Popover */}
      <div style={{ position: 'relative', flex: '0 0 auto', maxWidth: '100%' }}>
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation()
            setShowFiltersPopover(!showFiltersPopover)
          }}
          style={{
            padding: `4px ${spacing.xs}`,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: activeFilterCount > 0 ? surfaces.primary : framerColors.text,
            backgroundColor: activeFilterCount > 0 ? framerColors.text : surfaces.primary,
            border: `1px solid ${activeFilterCount > 0 ? framerColors.text : themeBorders.subtle}`,
            borderRadius: borders.radius.md,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
            minWidth: '32px',
            height: '28px',
            maxWidth: '100%',
          }}
          onMouseEnter={(e) => {
            if (activeFilterCount === 0) {
              e.currentTarget.style.backgroundColor = surfaces.tertiary
            }
          }}
          onMouseLeave={(e) => {
            if (activeFilterCount === 0) {
              e.currentTarget.style.backgroundColor = surfaces.primary
            }
          }}
        >
          <svg 
            style={{
              width: '16px',
              height: '16px',
              flexShrink: 0,
              display: 'block',
            }}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {activeFilterCount > 0 && (
            <span style={{
              fontSize: '11px',
              fontWeight: typography.fontWeight.bold,
              minWidth: '18px',
              height: '18px',
              borderRadius: borders.radius.full,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: activeFilterCount > 0 ? surfaces.primary : 'transparent',
              color: activeFilterCount > 0 ? framerColors.text : 'inherit',
              padding: '0 4px',
              lineHeight: 1,
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Filters Popover */}
        {showFiltersPopover && (
          <div
            ref={popoverRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              zIndex: 1000,
              minWidth: '220px',
              padding: spacing.md,
              backgroundColor: surfaces.secondary,
              border: `1px solid ${themeBorders.subtle}`,
              borderRadius: borders.radius.lg,
              boxShadow: themeElevation.strong,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
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
                      color: framerColors.text,
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
                      color: framerColors.text,
                      flex: 1,
                    }}
                  >
                    Unoptimized (PNG/JPG)
                  </span>
                </label>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <>
                  <div style={{ height: '1px', backgroundColor: themeBorders.subtle, margin: `${spacing.sm} 0` }} />
            <button
                    onClick={() => {
                      onFiltersChange({ ...filters, sizeRange: { min: 0, max: Infinity }, format: 'all' })
                      setShowFiltersPopover(false)
                    }}
                    style={{
                      padding: `${spacing.xs} ${spacing.sm}`,
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.medium,
                      color: framerColors.textSecondary,
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: borders.radius.sm,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = surfaces.tertiary
                      e.currentTarget.style.color = framerColors.text
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = framerColors.textSecondary
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

    </div>
  )
}
