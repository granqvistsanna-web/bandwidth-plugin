import type { AssetsTableHeaderProps, SortConfig } from './types'

interface SortableHeaderProps {
  label: string
  column: SortConfig['column']
  sortConfig: SortConfig
  onSort: (config: SortConfig) => void
  align?: 'left' | 'center' | 'right'
}

function SortableHeader({ label, column, sortConfig, onSort, align = 'left' }: SortableHeaderProps) {
  const isActive = sortConfig.column === column
  const direction = isActive ? sortConfig.direction : null

  const handleClick = () => {
    if (isActive) {
      onSort({
        column,
        direction: direction === 'asc' ? 'desc' : 'asc'
      })
    } else {
      onSort({
        column,
        direction: column === 'name' ? 'asc' : 'desc'
      })
    }
  }

  const alignStyle = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left'

  return (
    <th style={{ textAlign: alignStyle, padding: 0 }}>
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
        style={{
          color: isActive ? 'var(--framer-color-text)' : 'var(--framer-color-text-secondary)',
          justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
          padding: '4px 12px'
        }}
      >
        {label}
        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          {!isActive || direction === 'desc' ? (
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          ) : (
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          )}
        </svg>
      </button>
    </th>
  )
}

export function AssetsTableHeader({ sortConfig, onSort }: AssetsTableHeaderProps) {
  return (
    <thead
      className="sticky top-0 z-10"
      style={{
        backgroundColor: 'var(--framer-color-bg)',
      }}
    >
      <tr style={{ borderBottom: `1px solid var(--framer-color-divider)` }}>
        {/* Preview */}
        <th style={{ width: '64px', padding: 0 }} />

        {/* Name */}
        <th style={{ minWidth: '200px', padding: 0 }}>
          <SortableHeader label="Name" column="name" sortConfig={sortConfig} onSort={onSort} align="left" />
        </th>

        {/* Dimensions */}
        <th style={{ width: '120px', padding: 0 }}>
          <SortableHeader label="Dimensions" column="dimensions" sortConfig={sortConfig} onSort={onSort} align="left" />
        </th>

        {/* Format */}
        <th style={{ width: '100px', padding: 0 }}>
          <SortableHeader label="Format" column="format" sortConfig={sortConfig} onSort={onSort} align="left" />
        </th>

        {/* Size */}
        <th style={{ width: '140px', padding: 0 }}>
          <SortableHeader label="Size" column="size" sortConfig={sortConfig} onSort={onSort} align="left" />
        </th>
      </tr>
    </thead>
  )
}
