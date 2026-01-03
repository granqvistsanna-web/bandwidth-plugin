import { useState, useEffect } from 'react'
import { framer } from 'framer-plugin'
import type { ProjectAnalysis } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'

// Component to render SVG preview
function SVGPreview({ nodeId, nodeName }: { nodeId: string; nodeName: string; dimensions: { width: number; height: number } }) {
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Try to get SVG content from the node
  useEffect(() => {
    const fetchSVG = async () => {
      try {
        const node = await framer.getNode(nodeId)
        if (node) {
          // Try to get SVG content - SVG nodes might have a content or svg property
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nodeAny = node as any
          if (nodeAny.svg || nodeAny.content) {
            setSvgContent(nodeAny.svg || nodeAny.content)
          } else if (nodeAny.__svgContent) {
            setSvgContent(nodeAny.__svgContent)
          }
        }
      } catch (error) {
        console.warn('Could not fetch SVG content:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSVG()
  }, [nodeId])

  // If we have SVG content, render it
  if (svgContent && !loading) {
    return (
      <div
        className="w-24 h-24 rounded-lg border flex items-center justify-center overflow-hidden"
        dangerouslySetInnerHTML={{ __html: svgContent }}
        style={{
          maxWidth: '96px',
          maxHeight: '96px',
          padding: '4px',
          borderColor: 'var(--framer-color-divider)',
          backgroundColor: 'var(--framer-color-bg)'
        }}
      />
    )
  }

  // Fallback: Show distinctive preview with name and dimensions
  return (
    <div
      className="w-24 h-24 rounded-lg border bg-gradient-to-br flex flex-col items-center justify-center p-2"
      style={{
        borderColor: 'var(--framer-color-divider)',
        backgroundImage: 'linear-gradient(to bottom right, #faf5ff, #f3e8ff)'
      }}
    >
      <svg className="w-8 h-8 text-purple-500 mb-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.57.393A9.065 9.065 0 0021.75 12c0-.638-.057-1.27-.17-1.886M5 14.5l-1.57.393A9.065 9.065 0 002.25 12c0-.638.057-1.27.17-1.886m13.38 0l1.57-.393A9.065 9.065 0 0012 9c-.638 0-1.27.057-1.886.17M5 14.5V19.5a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.8 19.5v-5m-14.8 0h14.8" />
      </svg>
      <div className="text-[9px] font-semibold text-purple-700 text-center leading-tight truncate w-full px-1" title={nodeName}>
        {nodeName.length > 12 ? nodeName.substring(0, 10) + '..' : nodeName}
      </div>
    </div>
  )
}

interface AssetsPanelProps {
  analysis: ProjectAnalysis
  selectedPageId: string | 'all'
}

// Helper function to check if a page name indicates a design page
function isDesignPageName(pageName: string): boolean {
  const name = pageName.toLowerCase().trim()
  const designPagePatterns = [
    'design',
    'component',
    'template',
    'style',
    'system',
    'library',
    'draft',
    'test',
    'archive'
  ]
  return designPagePatterns.some(pattern => name.startsWith(pattern))
}

export function AssetsPanel({ analysis, selectedPageId }: AssetsPanelProps) {
  const [sortBy, setSortBy] = useState<'size' | 'name'>('size')

  // Get assets for selected page or overall
  const pageAnalysis = selectedPageId === 'all'
    ? null
    : analysis.pages.find(p => p.pageId === selectedPageId)

  const assets = pageAnalysis
    ? pageAnalysis.breakpoints.desktop.assets
    : analysis.overallBreakpoints.desktop.assets

  const sortedAssets = [...assets].sort((a, b) => {
    if (sortBy === 'size') {
      return b.estimatedBytes - a.estimatedBytes
    }
    return a.nodeName.localeCompare(b.nodeName)
  })

  const handleAssetClick = async (nodeId: string) => {
    // Validate nodeId before attempting selection
    if (!nodeId || nodeId.trim() === '') {
      framer.notify('Invalid node ID', { variant: 'error' })
      return
    }

    try {
      // Attempt to verify node exists before selection
      const node = await framer.getNode(nodeId)
      if (!node) {
        framer.notify('Node not found in canvas', { variant: 'error' })
        return
      }

      await framer.setSelection([nodeId])
      framer.notify('Node selected in canvas', { variant: 'success', durationMs: 1500 })
    } catch (error) {
      // Stable fallback: show error but don't crash
      console.warn('Failed to select node:', nodeId, error)
      framer.notify('Could not select node. It may have been deleted.', { variant: 'error' })
    }
  }

  return (
    <div className="w-full px-3 py-3">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 gap-3">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--framer-color-text)' }}>
            {assets.length} Asset{assets.length !== 1 ? 's' : ''}
          </h2>
          <div
            className="cursor-help flex-shrink-0"
            title="All images and SVGs found in your project. Click an asset to select it in the canvas."
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--framer-color-text-tertiary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'size' | 'name')}
          className="text-xs border rounded px-2 py-1 font-medium focus:outline-none focus:ring-1 flex-shrink-0"
          style={{
            borderColor: 'var(--framer-color-divider)',
            backgroundColor: 'var(--framer-color-bg)',
            color: 'var(--framer-color-text)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--framer-color-text-tertiary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
          }}
        >
          <option value="size">Sort by Size</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Asset List */}
      <div
        className="w-full border rounded overflow-hidden"
        style={{
          backgroundColor: 'var(--framer-color-bg)',
          borderColor: 'var(--framer-color-divider)'
        }}
      >
        <div className="flex flex-col divide-y" style={{ borderColor: 'var(--framer-color-divider)' }}>
          {sortedAssets.map((asset) => (
            <button
              key={asset.nodeId}
              onClick={() => handleAssetClick(asset.nodeId)}
              className="w-full transition-colors text-left"
              style={{ backgroundColor: 'var(--framer-color-bg)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg)'
              }}
            >
              <div className="w-full px-3 py-4">
                <div className="flex items-center gap-4 w-full">
                  {/* Asset Preview Thumbnail */}
                  <div className="flex-shrink-0">
                    {asset.type === 'svg' ? (
                      <SVGPreview
                        nodeId={asset.nodeId}
                        nodeName={asset.nodeName || 'Unnamed SVG'}
                        dimensions={asset.dimensions}
                      />
                    ) : asset.url ? (
                      <div
                        className="w-24 h-24 rounded-lg border overflow-hidden"
                        style={{
                          borderColor: 'var(--framer-color-divider)',
                          backgroundColor: 'var(--framer-color-bg-secondary)'
                        }}
                      >
                        <img
                          src={asset.url}
                          alt={asset.nodeName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `
                                <svg class="w-8 h-8 m-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: var(--framer-color-text-tertiary)">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              `
                              parent.classList.add('flex', 'items-center', 'justify-center')
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className="w-24 h-24 rounded-lg border flex items-center justify-center"
                        style={{
                          borderColor: 'var(--framer-color-divider)',
                          backgroundColor: 'var(--framer-color-bg-secondary)'
                        }}
                      >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--framer-color-text-tertiary)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    {/* Asset Name */}
                    <h3 className="text-base font-semibold break-words leading-snug" style={{ color: 'var(--framer-color-text)' }}>
                      {asset.nodeName || 'Unnamed Asset'}
                    </h3>

                    {/* Details Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold uppercase"
                        style={asset.type === 'svg' ? {
                          backgroundColor: '#f3e8ff',
                          color: '#7c3aed'
                        } : asset.type === 'background' ? {
                          backgroundColor: 'var(--framer-color-tint-dimmed)',
                          color: 'var(--framer-color-tint)'
                        } : {
                          backgroundColor: '#dcfce7',
                          color: '#166534'
                        }}
                      >
                        {asset.type}
                      </span>

                      <span className="text-xs" style={{ color: 'var(--framer-color-text-tertiary)' }}>•</span>
                      <span className="text-xs" style={{ color: 'var(--framer-color-text-secondary)' }}>
                        {Math.round(asset.dimensions.width)}×{Math.round(asset.dimensions.height)}
                      </span>

                      {asset.format && (
                        <>
                          <span className="text-xs" style={{ color: 'var(--framer-color-text-tertiary)' }}>•</span>
                          <span className="text-xs font-medium" style={{ color: 'var(--framer-color-text-secondary)' }}>{asset.format.toUpperCase()}</span>
                        </>
                      )}

                      {asset.usageCount !== undefined && asset.usageCount > 1 && (
                        <>
                          <span className="text-xs" style={{ color: 'var(--framer-color-text-tertiary)' }}>•</span>
                          <span
                            className="inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold"
                            style={{
                              backgroundColor: 'var(--framer-color-tint-dimmed)',
                              color: 'var(--framer-color-tint)'
                            }}
                          >
                            {asset.usageCount}×
                          </span>
                        </>
                      )}

                      {/* Show page information when viewing all assets */}
                      {selectedPageId === 'all' && asset.usedInPages && asset.usedInPages.length > 0 && (
                        <>
                          <span className="text-xs" style={{ color: 'var(--framer-color-text-tertiary)' }}>•</span>
                          <div className="flex items-center gap-1 flex-wrap">
                            {asset.usedInPages.slice(0, 2).map(pageId => {
                              const page = analysis.pages.find(p => p.pageId === pageId)
                              const pageName = page?.pageName || 'Unknown'
                              const isDesign = isDesignPageName(pageName)

                              return (
                                <span
                                  key={pageId}
                                  className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium"
                                  style={isDesign ? {
                                    backgroundColor: 'var(--framer-color-bg-tertiary)',
                                    color: 'var(--framer-color-text-tertiary)',
                                    fontStyle: 'italic'
                                  } : {
                                    backgroundColor: '#e0e7ff',
                                    color: '#4338ca'
                                  }}
                                  title={isDesign ? `${pageName} (Design page - not counted in bandwidth)` : pageName}
                                >
                                  {isDesign && (
                                    <svg className="w-2.5 h-2.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7H4V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7h-6V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3H4v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3h-6v-3z" />
                                    </svg>
                                  )}
                                  {pageName.length > 12 ? pageName.substring(0, 10) + '..' : pageName}
                                </span>
                              )
                            })}
                            {asset.usedInPages.length > 2 && (
                              <span className="text-[10px]" style={{ color: 'var(--framer-color-text-tertiary)' }}>
                                +{asset.usedInPages.length - 2}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* File Size Badge */}
                  <div className="flex-shrink-0 self-center ml-auto">
                    {(() => {
                      const sizeInKB = asset.estimatedBytes / 1024
                      const sizeInMB = asset.estimatedBytes / (1024 * 1024)
                      let sizeStyle: React.CSSProperties
                      let sizeLabel = ''

                      // Red for large files (>= 500KB)
                      if (sizeInKB >= 500) {
                        sizeStyle = {
                          color: '#991b1b',
                          backgroundColor: '#fee2e2',
                          border: '2px solid #f87171'
                        }
                        sizeLabel = sizeInMB >= 1 ? 'Very Large' : 'Large'
                      }
                      // Yellow for medium files (200KB - 500KB)
                      else if (sizeInKB >= 200) {
                        sizeStyle = {
                          color: '#92400e',
                          backgroundColor: '#fef3c7',
                          border: '2px solid #facc15'
                        }
                        sizeLabel = 'Medium'
                      }
                      // Green for small files (< 200KB)
                      else {
                        sizeStyle = {
                          color: '#166534',
                          backgroundColor: '#dcfce7',
                          border: '2px solid #22c55e'
                        }
                        sizeLabel = 'Small'
                      }

                      return (
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-sm font-bold whitespace-nowrap px-3 py-1.5 rounded-md" style={sizeStyle}>
                            {formatBytes(asset.estimatedBytes)}
                          </div>
                          <div className="text-[10px] font-medium" style={{ color: 'var(--framer-color-text-tertiary)' }}>
                            {sizeLabel}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {assets.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📦</div>
            <div className="font-medium mb-1" style={{ color: 'var(--framer-color-text)' }}>No Assets Found</div>
            <div className="text-sm max-w-xs mx-auto" style={{ color: 'var(--framer-color-text-secondary)' }}>
              No images or SVGs were detected in your project. Make sure you have frames with background images or SVG elements.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
