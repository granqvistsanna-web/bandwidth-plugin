import { useState, useMemo } from 'react'
import { framer } from 'framer-plugin'
import type { ProjectAnalysis, AssetInfo } from '../../types/analysis'
import type { FilterState, SortConfig, AssetCounts } from './types'
import { PageSelector } from './PageSelector'
import { AssetFilters } from './AssetFilters'
import { AssetsTable } from './AssetsTable'
import { debugLog } from '../../utils/debugLog'

interface AssetsPanelProps {
  analysis: ProjectAnalysis
  selectedPageId: string | null
  onPageChange?: (pageId: string | null) => void
}

const DEFAULT_FILTERS: FilterState = {
  type: 'all',
  sizeRange: { min: 0, max: Infinity },
  format: 'all',
  pageUsage: 'all'
}

const DEFAULT_SORT: SortConfig = {
  column: 'size',
  direction: 'desc'
}

export function AssetsPanel({ analysis, selectedPageId, onPageChange }: AssetsPanelProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT)

  // Get base assets for selected page or all pages
  const baseAssets = useMemo(() => {
    if (selectedPageId === null) {
      return analysis.overallBreakpoints.desktop.assets
    }
    const page = analysis.pages.find(p => p.pageId === selectedPageId)
    return page?.breakpoints.desktop.assets || []
  }, [analysis, selectedPageId])

  // Apply filters and search
  const filteredAssets = useMemo(() => {
    return baseAssets.filter(asset => {
      // Type filter
      if (filters.type !== 'all') {
        if (filters.type === 'cms') {
          // Filter for CMS assets
          if (!asset.isCMSAsset) {
            return false
          }
        } else if (filters.type === 'image') {
          // Treat both 'image' and 'background' as images
          if (asset.type !== 'image') {
            return false
          }
        } else if (asset.type !== filters.type) {
          return false
        }
      }

      // Size range filter
      if (asset.estimatedBytes < filters.sizeRange.min || asset.estimatedBytes > filters.sizeRange.max) {
        return false
      }

      // Format filter
      if (filters.format !== 'all') {
        const assetFormat = asset.format?.toLowerCase()
        if (!assetFormat || assetFormat !== filters.format) {
          return false
        }
      }


      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const name = (asset.nodeName || '').toLowerCase()
        if (!name.includes(query)) {
          return false
        }
      }

      return true
    })
  }, [baseAssets, filters, searchQuery])

  // Apply sorting
  const sortedAssets = useMemo(() => {
    const sorted = [...filteredAssets]

    // Stable sort: add secondary/tertiary keys for consistent ordering
    sorted.sort((a, b) => {
      let comparison = 0

      switch (sortConfig.column) {
        case 'name':
          comparison = (a.nodeName || '').localeCompare(b.nodeName || '')
          break
        case 'size':
          comparison = a.estimatedBytes - b.estimatedBytes
          break
        case 'dimensions':
          const aArea = a.dimensions.width * a.dimensions.height
          const bArea = b.dimensions.width * b.dimensions.height
          comparison = aArea - bArea
          break
        case 'format':
          comparison = (a.format || '').localeCompare(b.format || '')
          break
        case 'usage':
          comparison = (a.usageCount || 1) - (b.usageCount || 1)
          break
      }

      // Apply sort direction
      if (comparison !== 0) {
        return sortConfig.direction === 'asc' ? comparison : -comparison
      }
      
      // Secondary sort: by node ID for stable ordering when primary values are equal
      return a.nodeId.localeCompare(b.nodeId)
    })

    return sorted
  }, [filteredAssets, sortConfig])

  // Calculate asset counts for filter pills
  const assetCounts = useMemo((): AssetCounts => {
    return {
      all: baseAssets.length,
      images: baseAssets.filter(a => a.type === 'image').length,
      svgs: baseAssets.filter(a => a.type === 'svg').length,
      cms: baseAssets.filter(a => a.isCMSAsset).length
    }
  }, [baseAssets])

  // Handle asset click to select in canvas
  const handleAssetClick = async (nodeId: string) => {
    if (!nodeId || nodeId.trim() === '') {
      framer.notify('Invalid node ID', { variant: 'error' })
      return
    }

    try {
      const node = await framer.getNode(nodeId)
      if (!node) {
        framer.notify('Node not found in canvas. It may have been moved or deleted. Try rescanning to refresh the analysis.', { variant: 'error' })
        return
      }

      await framer.setSelection([nodeId])
      framer.notify('Node selected in canvas', { variant: 'success', durationMs: 1500 })
    } catch (error) {
      debugLog.warn('Failed to select node:', { nodeId, error })
      framer.notify('Could not select node. It may have been moved or deleted. Try rescanning.', { variant: 'error' })
    }
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--framer-color-bg)' }}>
      {/* Filters */}
      <AssetFilters
        filters={filters}
        onFiltersChange={setFilters}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        assetCounts={assetCounts}
      />

      {/* Results Count */}
      {(filters.type !== 'all' || filters.format !== 'all' || filters.sizeRange.min !== 0 || filters.sizeRange.max !== Infinity || searchQuery) && (
        <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--framer-color-divider)', backgroundColor: 'var(--framer-color-bg-secondary)' }}>
          <span className="text-sm" style={{ color: 'var(--framer-color-text-secondary)' }}>
            Showing <span className="font-semibold" style={{ color: 'var(--framer-color-text)' }}>{sortedAssets.length}</span> of {baseAssets.length} assets
          </span>
        </div>
      )}

      {/* Assets Table or Empty State */}
      <div className="flex-1 min-h-0">
        {sortedAssets.length > 0 ? (
          <AssetsTable
            assets={sortedAssets}
            sortConfig={sortConfig}
            onSort={setSortConfig}
            onAssetClick={handleAssetClick}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center py-12 px-4 max-w-sm mx-auto">
              <div className="text-4xl mb-4">
                {baseAssets.length === 0 ? '📦' : '🔍'}
              </div>
              <div className="font-semibold text-lg mb-2" style={{ color: 'var(--framer-color-text)' }}>
                {baseAssets.length === 0 ? 'No Assets Found' : 'No Matching Assets'}
              </div>
              <div className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--framer-color-text-secondary)' }}>
                {baseAssets.length === 0 ? (
                  <>
                    <p className="mb-2">No images or SVGs were detected in your project.</p>
                    <p className="text-xs mb-3" style={{ color: 'var(--framer-color-text-tertiary)' }}>
                      Make sure your pages contain frames with background images or SVG elements. 
                      Images need to be set as background images on frames to be detected. 
                      <a 
                        href="https://www.framer.com/learn/design/images/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline ml-1"
                        style={{ color: 'var(--framer-color-tint)' }}
                      >
                        Learn about adding images in Framer
                      </a>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-2">No assets match your current filters or search query.</p>
                    <p className="text-xs" style={{ color: 'var(--framer-color-text-tertiary)' }}>
                      Try adjusting your filters, clearing the search, or selecting a different page.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
