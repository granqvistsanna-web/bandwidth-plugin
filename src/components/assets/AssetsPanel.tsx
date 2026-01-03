import { useState, useEffect } from 'react'
import { framer } from 'framer-plugin'
import type { ProjectAnalysis } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'

// Component to render SVG preview
function SVGPreview({ nodeId, nodeName, dimensions }: { nodeId: string; nodeName: string; dimensions: { width: number; height: number } }) {
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
        className="w-20 h-20 rounded-lg border-2 border-purple-200 bg-white flex items-center justify-center overflow-hidden"
        dangerouslySetInnerHTML={{ __html: svgContent }}
        style={{ 
          maxWidth: '80px',
          maxHeight: '80px',
          padding: '4px'
        }}
      />
    )
  }

  // Fallback: Show distinctive preview with name and dimensions
  return (
    <div className="w-20 h-20 rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 flex flex-col items-center justify-center p-2">
      <svg className="w-8 h-8 text-purple-500 mb-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.57.393A9.065 9.065 0 0021.75 12c0-.638-.057-1.27-.17-1.886M5 14.5l-1.57.393A9.065 9.065 0 002.25 12c0-.638.057-1.27.17-1.886m13.38 0l1.57-.393A9.065 9.065 0 0012 9c-.638 0-1.27.057-1.886.17M5 14.5V19.5a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.8 19.5v-5m-14.8 0h14.8" />
      </svg>
      <div className="text-[8px] font-semibold text-purple-700 text-center leading-tight truncate w-full" title={nodeName}>
        {nodeName.length > 12 ? nodeName.substring(0, 10) + '...' : nodeName}
      </div>
      <div className="text-[7px] text-purple-600 text-center mt-0.5">
        {Math.round(dimensions.width)}×{Math.round(dimensions.height)}
      </div>
    </div>
  )
}

interface AssetsPanelProps {
  analysis: ProjectAnalysis
  selectedPageId: string | 'all'
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
    <div className="w-full p-6">
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">
          {assets.length} Asset{assets.length !== 1 ? 's' : ''}
        </h2>
          <div 
            className="cursor-help flex-shrink-0"
            title="All images and SVGs found in your project. Click an asset to select it in the canvas."
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'size' | 'name')}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 font-medium hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-shrink-0"
        >
          <option value="size">Sort by Size</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      <div className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex flex-col divide-y divide-gray-100">
          {sortedAssets.map((asset) => (
          <button
            key={asset.nodeId}
            onClick={() => handleAssetClick(asset.nodeId)}
              className="w-full hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-full px-6 py-6">
              <div className="flex items-start gap-6 w-full">
                {/* Asset Preview Thumbnail */}
                <div className="flex-shrink-0">
                  {asset.type === 'svg' ? (
                    <SVGPreview 
                      nodeId={asset.nodeId} 
                      nodeName={asset.nodeName || 'Unnamed SVG'}
                      dimensions={asset.dimensions}
                    />
                  ) : asset.url ? (
                    <img
                      src={asset.url}
                      alt={asset.nodeName}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200 bg-gray-50"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        if (target.nextElementSibling) {
                          (target.nextElementSibling as HTMLElement).style.display = 'flex'
                        }
                      }}
                    />
                  ) : null}
                  {/* Fallback for broken images */}
                  {asset.type !== 'svg' && (
                    <div
                      className={`w-24 h-24 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50 ${
                        asset.url ? 'hidden' : ''
                      }`}
                    >
                      <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Content Area */}
              <div className="flex-1 min-w-0">
                  {/* Top Row: Name and File Size */}
                  <div className="flex items-start justify-between gap-6 mb-3 w-full">
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-lg font-semibold text-gray-900 break-words leading-tight mb-2 text-left">
                        {asset.nodeName || 'Unnamed Asset'}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {(() => {
                        const sizeInKB = asset.estimatedBytes / 1024
                        const sizeInMB = asset.estimatedBytes / (1024 * 1024)
                        let sizeColor = 'text-gray-700 bg-gray-50 border border-gray-200'
                        let sizeLabel = ''
                        let showWarning = false
                        
                        if (sizeInMB >= 1) {
                          sizeColor = 'text-red-700 bg-red-50 border-2 border-red-300'
                          sizeLabel = 'Very Large'
                          showWarning = true
                        } else if (sizeInKB >= 500) {
                          sizeColor = 'text-orange-700 bg-orange-50 border-2 border-orange-300'
                          sizeLabel = 'Large'
                          showWarning = true
                        } else if (sizeInKB >= 200) {
                          sizeColor = 'text-yellow-700 bg-yellow-50 border border-yellow-200'
                          sizeLabel = 'Medium'
                        } else {
                          sizeColor = 'text-green-700 bg-green-50 border border-green-200'
                        }
                        
                        return (
                          <div className="flex flex-col items-end gap-1.5">
                            <div className={`text-lg font-bold whitespace-nowrap px-4 py-2 rounded-lg ${sizeColor} shadow-sm`}>
                              {formatBytes(asset.estimatedBytes)}
                            </div>
                            {showWarning && (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>{sizeLabel}</span>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                  
                  {/* Bottom Row: Details */}
                  <div className="flex items-center gap-3 flex-wrap text-left">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      asset.type === 'svg' 
                        ? 'bg-purple-100 text-purple-700' 
                        : asset.type === 'background'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {asset.type}
                    </span>
                    
                    {asset.actualDimensions ? (
                      <>
                        <span className="text-gray-300 text-xs">•</span>
                        <span className="text-xs text-gray-600" title={`Intrinsic: ${asset.actualDimensions.width}×${asset.actualDimensions.height}px`}>
                          {Math.round(asset.actualDimensions.width)}×{Math.round(asset.actualDimensions.height)}px
                        </span>
                        <span className="text-gray-300 text-xs">→</span>
                        <span className="text-xs text-gray-500" title="Rendered dimensions">
                          {Math.round(asset.dimensions.width)}×{Math.round(asset.dimensions.height)}px
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-300 text-xs">•</span>
                        <span className="text-xs text-gray-600">
                          {Math.round(asset.dimensions.width)}×{Math.round(asset.dimensions.height)}px
                        </span>
                      </>
                    )}
                    
                    {asset.format && (
                      <>
                        <span className="text-gray-300 text-xs">•</span>
                        <span className="text-xs font-medium text-gray-600">{asset.format.toUpperCase()}</span>
                      </>
                    )}
                    
                    {asset.usageCount !== undefined && asset.usageCount > 1 && (
                      <>
                        <span className="text-gray-300 text-xs">•</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">
                          {asset.usageCount}×
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
        </div>

        {assets.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📦</div>
            <div className="font-medium text-gray-900 mb-1">No Assets Found</div>
            <div className="text-sm text-gray-600 max-w-xs mx-auto">
              No images or SVGs were detected in your project. Make sure you have frames with background images or SVG elements.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
