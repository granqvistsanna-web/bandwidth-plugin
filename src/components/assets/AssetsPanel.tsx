import { useState, useMemo, useEffect } from 'react'
import { framer } from 'framer-plugin'
import type { ProjectAnalysis } from '../../types/analysis'
import type { FilterState, SortConfig, AssetCounts } from './types'
import { AssetFilters } from './AssetFilters'
import { AssetsTable } from './AssetsTable'
import { debugLog } from '../../utils/debugLog'
import { spacing, typography, borders, backgrounds, framerColors } from '../../styles/designTokens'
import { StatusIndicator } from '../common/StatusIndicator'

interface AssetsPanelProps {
  analysis: ProjectAnalysis
  selectedPageId: string | null
  onPageChange?: (pageId: string | null) => void
  lastScanned?: Date | null
  loading?: boolean
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

const PAGE_SIZE = 50 // Assets per page for better performance

export function AssetsPanel({ analysis, selectedPageId, lastScanned, loading }: AssetsPanelProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT)
  const [currentPage, setCurrentPage] = useState(1)

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

      return true
    })
  }, [baseAssets, filters])

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
        case 'dimensions': {
          const aArea = a.dimensions.width * a.dimensions.height
          const bArea = b.dimensions.width * b.dimensions.height
          comparison = aArea - bArea
          break
        }
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

  // Reset page when filters or sort changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, sortConfig, selectedPageId])

  // Pagination calculations
  const totalPages = Math.ceil(sortedAssets.length / PAGE_SIZE)
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedAssets.slice(start, start + PAGE_SIZE)
  }, [sortedAssets, currentPage])

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
    <div style={{
      padding: spacing.lg,
      backgroundColor: backgrounds.page,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md,
      height: '100%'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xs
      }}>
        <h1 style={{
          fontSize: typography.fontSize.md,
          fontWeight: typography.fontWeight.bold,
          color: framerColors.text,
          margin: 0,
          lineHeight: typography.lineHeight.tight,
          letterSpacing: typography.letterSpacing.tighter
        }}>
          Assets
        </h1>
        <StatusIndicator
          lastScanned={lastScanned}
          loading={loading}
        />
      </div>

      {/* Filters - integrated into layout */}
      <div style={{
        width: '100%'
      }}>
        <AssetFilters
          filters={filters}
          onFiltersChange={setFilters}
          assetCounts={assetCounts}
          sortConfig={sortConfig}
          onSortChange={setSortConfig}
        />
      </div>

      {/* Results Count */}
      {(filters.type !== 'all' || filters.format !== 'all' || filters.sizeRange.min !== 0 || filters.sizeRange.max !== Infinity) && (
        <div style={{
          padding: `${spacing.xs} ${spacing.sm}`,
          backgroundColor: 'var(--surface-tertiary)',
          borderRadius: borders.radius.sm
        }}>
          <span style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textSecondary
          }}>
            Showing <span style={{
              fontWeight: typography.fontWeight.semibold,
              color: framerColors.text
            }}>{sortedAssets.length}</span> of {baseAssets.length}
          </span>
        </div>
      )}

      {/* Assets Table or Empty State */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {sortedAssets.length > 0 ? (
          <>
            <div style={{ flex: 1, minHeight: 0 }}>
              <AssetsTable
                assets={paginatedAssets}
                sortConfig={sortConfig}
                onSort={setSortConfig}
                onAssetClick={handleAssetClick}
              />
            </div>

            {/* Pagination controls - only show if more than one page */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                padding: `${spacing.md} 0`,
                borderTop: `1px solid var(--framer-color-divider)`
              }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    fontSize: typography.fontSize.xs,
                    color: currentPage === 1 ? framerColors.textTertiary : framerColors.text,
                    backgroundColor: 'transparent',
                    border: `1px solid ${currentPage === 1 ? 'transparent' : 'var(--framer-color-divider)'}`,
                    borderRadius: borders.radius.sm,
                    cursor: currentPage === 1 ? 'default' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1
                  }}
                >
                  Previous
                </button>

                <span style={{
                  fontSize: typography.fontSize.xs,
                  color: framerColors.textSecondary,
                  minWidth: '80px',
                  textAlign: 'center'
                }}>
                  {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    fontSize: typography.fontSize.xs,
                    color: currentPage === totalPages ? framerColors.textTertiary : framerColors.text,
                    backgroundColor: 'transparent',
                    border: `1px solid ${currentPage === totalPages ? 'transparent' : 'var(--framer-color-divider)'}`,
                    borderRadius: borders.radius.sm,
                    cursor: currentPage === totalPages ? 'default' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              textAlign: 'center',
              padding: `${spacing.xl} ${spacing.md}`,
              maxWidth: '384px',
              margin: '0 auto'
            }}>
              <div style={{
                marginBottom: spacing.md,
                display: 'flex',
                justifyContent: 'center'
              }}>
                {baseAssets.length === 0 ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={framerColors.textTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={framerColors.textTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                )}
              </div>
              <div style={{
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize.lg,
                marginBottom: spacing.sm,
                color: framerColors.text
              }}>
                {baseAssets.length === 0 ? 'No Assets Found' : 'No Matching Assets'}
              </div>
              <div style={{
                fontSize: typography.fontSize.sm,
                marginBottom: spacing.md,
                lineHeight: typography.lineHeight.relaxed,
                color: framerColors.textSecondary
              }}>
                {baseAssets.length === 0 ? (
                  <>
                    <p style={{ marginBottom: spacing.sm }}>No images or SVGs were detected in your project.</p>
                    <p style={{
                      fontSize: typography.fontSize.xs,
                      marginBottom: spacing.sm,
                      color: framerColors.textTertiary
                    }}>
                      Make sure your pages contain frames with background images or SVG elements.
                      Images need to be set as background images on frames to be detected.
                      <a
                        href="https://www.framer.com/learn/design/images/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: 'underline',
                          marginLeft: spacing.xs,
                          color: 'var(--framer-color-tint)'
                        }}
                      >
                        Learn about adding images in Framer
                      </a>
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ marginBottom: spacing.sm }}>No assets match your current filters.</p>
                    <p style={{
                      fontSize: typography.fontSize.xs,
                      color: framerColors.textTertiary
                    }}>
                      Try adjusting your filters or selecting a different page.
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
