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
    estimateSize: () => 72, // Initial estimate, will be measured
    overscan: 5,
    measureElement: (element) => element.getBoundingClientRect().height,
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
            <div
              key={assets[virtualRow.index].nodeId || virtualRow.index}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <AssetsTableRow
                asset={assets[virtualRow.index]}
                onClick={handleClick}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
