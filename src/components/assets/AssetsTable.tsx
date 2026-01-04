import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { AssetsTableProps } from './types'
import { AssetsTableRow } from './AssetsTableRow'

export function AssetsTable({ assets, onAssetClick }: AssetsTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: assets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // 48px thumbnail + 16px padding (8px top + 8px bottom) + ~16px for text
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
