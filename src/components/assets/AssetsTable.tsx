import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { AssetsTableProps } from './types'
import { AssetsTableHeader } from './AssetsTableHeader'
import { AssetsTableRow } from './AssetsTableRow'

export function AssetsTable({ assets, sortConfig, onSort, onAssetClick }: AssetsTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: assets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  })

  return (
    <div ref={parentRef} className="h-full overflow-auto" style={{ scrollbarGutter: 'stable' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: '100%', width: 'max-content' }}>
        <AssetsTableHeader sortConfig={sortConfig} onSort={onSort} />
        <tbody style={{ position: 'relative', height: `${rowVirtualizer.getTotalSize()}px` }}>
          {rowVirtualizer.getVirtualItems().map(virtualRow => (
            <AssetsTableRow
              key={assets[virtualRow.index].nodeId}
              asset={assets[virtualRow.index]}
              onClick={onAssetClick}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
