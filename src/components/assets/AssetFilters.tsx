import type { AssetFiltersProps, FilterState } from './types'

interface FilterPillProps {
  label: string
  count: number
  isActive: boolean
  onClick: () => void
}

function FilterPill({ label, count, isActive, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
      style={{
        backgroundColor: isActive ? 'var(--framer-color-tint)' : 'var(--framer-color-bg-secondary)',
        color: isActive ? 'white' : 'var(--framer-color-text-secondary)',
      }}
    >
      {label} <span style={{ opacity: 0.7 }}>({count})</span>
    </button>
  )
}

interface SizeRangeOption {
  label: string
  min: number
  max: number
}

const sizeRangeOptions: SizeRangeOption[] = [
  { label: 'All sizes', min: 0, max: Infinity },
  { label: '<100 KB', min: 0, max: 100 * 1024 },
  { label: '100-200 KB', min: 100 * 1024, max: 200 * 1024 },
  { label: '200-500 KB', min: 200 * 1024, max: 500 * 1024 },
  { label: '500 KB-1 MB', min: 500 * 1024, max: 1024 * 1024 },
  { label: '1 MB+', min: 1024 * 1024, max: Infinity },
]

export function AssetFilters({
  filters,
  onFiltersChange,
  searchQuery,
  onSearchChange,
  assetCounts
}: AssetFiltersProps) {
  const handleTypeChange = (type: FilterState['type']) => {
    onFiltersChange({ ...filters, type })
  }

  const handleSizeRangeChange = (range: { min: number; max: number }) => {
    onFiltersChange({ ...filters, sizeRange: range })
  }

  const handleFormatChange = (format: FilterState['format']) => {
    onFiltersChange({ ...filters, format })
  }

  const handlePageUsageChange = (pageUsage: FilterState['pageUsage']) => {
    onFiltersChange({ ...filters, pageUsage })
  }

  const clearSearch = () => {
    onSearchChange('')
  }

  const clearAllFilters = () => {
    onFiltersChange({
      type: 'all',
      sizeRange: { min: 0, max: Infinity },
      format: 'all',
      pageUsage: 'all'
    })
    onSearchChange('')
  }

  const activeSizeRange = sizeRangeOptions.find(
    option => option.min === filters.sizeRange.min && option.max === filters.sizeRange.max
  ) || sizeRangeOptions[0]

  // Check if any filters are active
  const hasActiveFilters =
    filters.type !== 'all' ||
    filters.format !== 'all' ||
    (filters.sizeRange.min !== 0 || filters.sizeRange.max !== Infinity) ||
    searchQuery.length > 0

  // Get active filter labels
  const getActiveFilters = () => {
    const active: Array<{ label: string; onClear: () => void }> = []

    if (searchQuery) {
      active.push({
        label: `Search: "${searchQuery}"`,
        onClear: clearSearch
      })
    }

    if (filters.type !== 'all') {
      active.push({
        label: `Type: ${filters.type === 'image' ? 'Images' : 'SVGs'}`,
        onClear: () => handleTypeChange('all')
      })
    }

    if (activeSizeRange.label !== 'All sizes') {
      active.push({
        label: `Size: ${activeSizeRange.label}`,
        onClear: () => handleSizeRangeChange({ min: 0, max: Infinity })
      })
    }

    if (filters.format !== 'all') {
      active.push({
        label: `Format: ${filters.format.toUpperCase()}`,
        onClear: () => handleFormatChange('all')
      })
    }

    return active
  }

  const activeFilters = getActiveFilters()

  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--framer-color-divider)' }}>
      {/* Search and Type Filter Row */}
      <div className="flex gap-2">
        {/* Search bar */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search assets..."
            className="w-full pl-3 pr-10 py-2 rounded-lg text-sm border focus:outline-none focus:ring-1"
            style={{
              backgroundColor: 'var(--framer-color-bg)',
              borderColor: 'var(--framer-color-divider)',
              color: 'var(--framer-color-text)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--framer-color-tint)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
            }}
          />
          <svg
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: 'var(--framer-color-text-tertiary)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Type filter dropdown */}
        <select
          value={filters.type}
          onChange={(e) => handleTypeChange(e.target.value as FilterState['type'])}
          className="px-3 py-2 rounded-lg text-sm border cursor-pointer"
          style={{
            backgroundColor: 'var(--framer-color-bg-secondary)',
            borderColor: 'var(--framer-color-divider)',
            color: 'var(--framer-color-text)',
            minWidth: '160px'
          }}
        >
          <option value="all">All ({assetCounts.all})</option>
          <option value="image">Images ({assetCounts.images})</option>
          <option value="svg">SVGs ({assetCounts.svgs})</option>
        </select>
      </div>

      {/* Advanced filters */}
      <div className="flex flex-wrap gap-3">
        {/* Size range dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--framer-color-text-secondary)' }}>
            Size
          </label>
          <select
            value={sizeRangeOptions.indexOf(activeSizeRange)}
            onChange={(e) => handleSizeRangeChange(sizeRangeOptions[parseInt(e.target.value)])}
            className="px-3 py-1.5 rounded-lg text-sm border cursor-pointer"
            style={{
              backgroundColor: 'var(--framer-color-bg-secondary)',
              borderColor: 'var(--framer-color-divider)',
              color: 'var(--framer-color-text)',
              minWidth: '130px'
            }}
          >
            {sizeRangeOptions.map((option, index) => (
              <option key={index} value={index}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Format dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--framer-color-text-secondary)' }}>
            Format
          </label>
          <select
            value={filters.format}
            onChange={(e) => handleFormatChange(e.target.value as FilterState['format'])}
            className="px-3 py-1.5 rounded-lg text-sm border cursor-pointer"
            style={{
              backgroundColor: 'var(--framer-color-bg-secondary)',
              borderColor: 'var(--framer-color-divider)',
              color: 'var(--framer-color-text)',
              minWidth: '130px'
            }}
          >
            <option value="all">All formats</option>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="webp">WebP</option>
            <option value="gif">GIF</option>
            <option value="svg">SVG</option>
          </select>
        </div>
      </div>

      {/* Active Filters Section */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t" style={{ borderColor: 'var(--framer-color-divider)' }}>
          <span className="text-xs font-medium" style={{ color: 'var(--framer-color-text-secondary)' }}>
            Active filters:
          </span>

          {activeFilters.map((filter, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
              style={{
                backgroundColor: 'var(--framer-color-tint-dimmed)',
                color: 'var(--framer-color-tint)'
              }}
            >
              <span>{filter.label}</span>
              <button
                onClick={filter.onClear}
                className="hover:opacity-70 transition-opacity"
                aria-label="Clear filter"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {activeFilters.length > 1 && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-medium hover:opacity-70 transition-opacity px-2 py-1"
              style={{ color: 'var(--framer-color-text-tertiary)' }}
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}
