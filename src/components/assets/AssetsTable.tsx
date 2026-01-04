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
    estimateSize: () => 100, // 64px thumbnail + 24px padding (12px top + 12px bottom) + ~12px for compact text
    overscan: 5,
  })

  return (
    <div ref={parentRef} className="h-full overflow-auto" style={{ scrollbarGutter: 'stable' }}>
      <div style={{ position: 'relative', height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <AssetsTableRow
            key={assets[virtualRow.index].nodeId}
            asset={assets[virtualRow.index]}
            onClick={onAssetClick}
            style={{
              position: 'absolute',
              top: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
