import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { AssetsTableProps } from './types'
import { AssetsTableRow } from './AssetsTableRow'
import { spacing } from '../../styles/designTokens'

export function AssetsTable({ assets, sortConfig, onSort, onAssetClick }: AssetsTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: assets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 65, // 40px thumbnail + 12px padding top + 12px padding bottom + 1px border
    overscan: 5,
  })

  return (
    <div ref={parentRef} className="h-full overflow-auto" style={{ scrollbarGutter: 'stable' }}>
      <div style={{ position: 'relative', height: `${rowVirtualizer.getTotalSize()}px`, paddingLeft: spacing.lg, paddingRight: spacing.lg }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <AssetsTableRow
            key={assets[virtualRow.index].nodeId}
            asset={assets[virtualRow.index]}
            onClick={onAssetClick}
            style={{
              position: 'absolute',
              top: 0,
              left: spacing.lg,
              right: spacing.lg,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
