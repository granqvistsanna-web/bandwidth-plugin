import { useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { memo } from 'react'
import type { AssetsTableProps } from './types'
import { AssetsTableRow } from './AssetsTableRow'

export const AssetsTable = memo(function AssetsTable({ assets, onAssetClick }: AssetsTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: assets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 3,
  })

  const handleClick = useCallback((nodeId: string) => {
    onAssetClick(nodeId)
  }, [onAssetClick])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Scrollable content */}
      <div
        ref={parentRef}
        style={{
          flex: 1,
          overflow: 'auto',
          scrollbarGutter: 'stable'
        }}
      >
        <div style={{ position: 'relative', height: `${rowVirtualizer.getTotalSize()}px` }}>
          {rowVirtualizer.getVirtualItems().map(virtualRow => (
            <AssetsTableRow
              key={assets[virtualRow.index].nodeId || virtualRow.index}
              asset={assets[virtualRow.index]}
              onClick={handleClick}
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
    </div>
  )
})
