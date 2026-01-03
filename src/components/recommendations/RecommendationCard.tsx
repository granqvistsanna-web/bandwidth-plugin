import { useState } from 'react'
import { framer } from 'framer-plugin'
import type { Recommendation } from '../../types/analysis'
import { Badge } from '../common/Badge'
import { formatBytes } from '../../utils/formatBytes'
import { optimizeImage } from '../../services/imageOptimizer'
import { replaceImageOnNode, replaceImageEverywhere, canReplaceImage } from '../../services/assetReplacer'
import { ReplaceImageModal } from './ReplaceImageModal'

/**
 * Get image dimensions from optimized image data
 */
async function getImageDimensionsFromData(data: Uint8Array, format: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const blob = new Blob([data], { type: format })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      // Fallback to default dimensions
      resolve({ width: 100, height: 100 })
    }
    
    img.src = url
  })
}

interface RecommendationCardProps {
  recommendation: Recommendation
  allPages?: { pageId: string; pageName: string }[]
}

export function RecommendationCard({ recommendation, allPages = [] }: RecommendationCardProps) {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [showReplaceModal, setShowReplaceModal] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState<string>('')

  const handleOptimize = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Validate we have what we need
    if (!recommendation.url || typeof recommendation.url !== 'string' || recommendation.url.trim() === '') {
      framer.notify('No image URL available for optimization', { variant: 'error' })
      return
    }

    if (!recommendation.optimalWidth || !recommendation.optimalHeight || 
        typeof recommendation.optimalWidth !== 'number' || typeof recommendation.optimalHeight !== 'number') {
      framer.notify('Optimal dimensions not available', { variant: 'error' })
      return
    }

    // Skip if image is very small (low impact)
    if (recommendation.currentBytes < 50 * 1024) {
      framer.notify('Image is already small (< 50KB). Optimization impact would be minimal.', { variant: 'info', durationMs: 3000 })
      return
    }

    // Skip if already optimized format and small
    const isOptimizedFormat = recommendation.url.toLowerCase().includes('webp') || 
                              recommendation.url.toLowerCase().includes('avif')
    if (isOptimizedFormat && recommendation.currentBytes < 200 * 1024) {
      framer.notify('Image is already optimized and small. No optimization needed.', { variant: 'info', durationMs: 3000 })
      return
    }

    // Check if we can replace the image
    if (recommendation.nodeId) {
      const canReplace = await canReplaceImage(recommendation.nodeId)
      if (!canReplace.canReplace) {
        framer.notify(`Cannot replace image: ${canReplace.reason}`, { variant: 'error' })
        return
      }
    }

    // Show modal to choose replace scope
    setShowReplaceModal(true)
  }

  const handleConfirmOptimize = async (replaceScope: 'single' | 'all') => {
    setShowReplaceModal(false)
    setIsOptimizing(true)
    setOptimizationProgress('Starting optimization...')

    try {
      if (!recommendation.url || !recommendation.optimalWidth || !recommendation.optimalHeight) {
        throw new Error('Missing required optimization parameters')
      }

      // Determine output format (WebP for photos, JPEG fallback)
      const currentFormat = recommendation.url.toLowerCase()
      const outputFormat: 'webp' | 'jpeg' = 
        currentFormat.includes('.png') && !currentFormat.includes('transparent')
          ? 'webp' // Use WebP for PNG (supports transparency)
          : 'webp' // Default to WebP for best compression

      setOptimizationProgress('Fetching image...')
      
      // Determine format - use WebP for PNGs (supports transparency) or photos
      const isPNG = recommendation.url.toLowerCase().includes('.png')
      const finalFormat: 'webp' | 'jpeg' = isPNG ? 'webp' : outputFormat
      
      // Validate URL is a string before passing to optimizeImage
      const imageUrl = String(recommendation.url).trim()
      if (!imageUrl || imageUrl === '') {
        throw new Error('Invalid image URL')
      }

      // Optimize the image
      const result = await optimizeImage({
        url: imageUrl,
        targetWidth: Number(recommendation.optimalWidth),
        targetHeight: Number(recommendation.optimalHeight),
        format: finalFormat
      })

      // Warn if transparency was detected but we used JPEG
      if (result.hasTransparency && finalFormat === 'jpeg') {
        framer.notify('Warning: Image had transparency which was lost in JPEG conversion. Consider using WebP format.', { variant: 'warning', durationMs: 5000 })
      }

      setOptimizationProgress('Getting dimensions...')

      // Get actual optimized dimensions from the image data
      // This ensures we use the exact dimensions after optimization
      const imageDimensions = await getImageDimensionsFromData(result.data, result.format)
      const optimizedWidth = imageDimensions.width || recommendation.optimalWidth || 100
      const optimizedHeight = imageDimensions.height || recommendation.optimalHeight || 100

      setOptimizationProgress('Replacing image...')

      const savings = result.originalSize - result.optimizedSize
      const savingsFormatted = formatBytes(savings)

      // Replace the image
      if (replaceScope === 'all' && recommendation.imageAssetId) {
        // Replace everywhere
        const replacementResult = await replaceImageEverywhere(
          recommendation.imageAssetId,
          result.data,
          result.format,
          recommendation.nodeName,
          optimizedWidth,
          optimizedHeight
        )
        
        if (replacementResult.success) {
          if (replacementResult.method === 'direct') {
            framer.notify(
              `${replacementResult.message} Saved ${savingsFormatted}.`,
              { variant: 'success', durationMs: 4000 }
            )
          } else {
            // Download method
            framer.notify(
              `Image optimized! ${replacementResult.message} Saved ${savingsFormatted}.`,
              { variant: 'success', durationMs: 6000 }
            )
            // Also select the node to help user find it
            if (recommendation.nodeId) {
              try {
                await framer.setSelection([recommendation.nodeId])
              } catch (e) {
                // Ignore selection errors
              }
            }
          }
        } else {
          framer.notify(`Optimization complete but replacement failed: ${replacementResult.message}`, { variant: 'warning', durationMs: 5000 })
        }
      } else if (recommendation.nodeId) {
        // Replace single node
        const replacementResult = await replaceImageOnNode(
          recommendation.nodeId,
          result.data,
          result.format,
          recommendation.nodeName,
          optimizedWidth,
          optimizedHeight
        )

        if (replacementResult.success) {
          if (replacementResult.method === 'direct') {
            framer.notify(
              `Image optimized and replaced! Saved ${savingsFormatted}.`,
              { variant: 'success', durationMs: 3000 }
            )
          } else {
            // Download method
            framer.notify(
              `Image optimized and downloaded! ${replacementResult.message} Saved ${savingsFormatted}.`,
              { variant: 'success', durationMs: 6000 }
            )
            // Select the node to help user find it
            try {
              await framer.setSelection([recommendation.nodeId])
              framer.notify('Node selected. Drag the downloaded image onto it to replace.', { variant: 'info', durationMs: 5000 })
            } catch (e) {
              // Ignore selection errors
            }
          }
        } else {
          framer.notify(`Optimization complete but replacement failed: ${replacementResult.message}`, { variant: 'warning', durationMs: 5000 })
        }
      } else {
        throw new Error('No node ID or image asset ID available')
      }
    } catch (error) {
      console.error('Optimization error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMessage.includes('CORS') || errorMessage.includes('Cannot access')) {
        framer.notify('Cannot access image URL. Image may be from external source or blocked by CORS.', { variant: 'error', durationMs: 5000 })
      } else if (errorMessage.includes('Failed to load image')) {
        framer.notify('Failed to load image. It may be blocked or invalid.', { variant: 'error' })
      } else {
        framer.notify(`Failed to optimize image: ${errorMessage}`, { variant: 'error' })
      }
    } finally {
      setIsOptimizing(false)
      setOptimizationProgress('')
    }
  }

  const handleNavigate = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Select in Canvas clicked:', {
      nodeId: recommendation.nodeId,
      nodeName: recommendation.nodeName,
      pageId: recommendation.pageId,
      pageName: recommendation.pageName,
      hasNodeId: !!recommendation.nodeId && recommendation.nodeId.trim() !== ''
    })

    // Validate nodeId before attempting selection
    if (!recommendation.nodeId || recommendation.nodeId.trim() === '') {
      framer.notify('This recommendation applies to multiple items and cannot select a specific node', { variant: 'info', durationMs: 3000 })
      return
    }

    try {
      // If recommendation has page info, try to navigate to that page first
      if (recommendation.pageId && recommendation.pageName) {
        try {
          console.log(`Navigating to page: ${recommendation.pageName} (${recommendation.pageId})`)
          
          // Try to get the page node and set it as selection to navigate
          // Framer doesn't have a direct navigateToPage API, but selecting the page node should work
          const pageNode = await framer.getNode(recommendation.pageId)
          
          if (pageNode) {
            // Select the page to navigate to it
            await framer.setSelection([recommendation.pageId])
            // Small delay to allow page navigation to complete
            await new Promise(resolve => setTimeout(resolve, 300))
            console.log(`Navigated to page: ${recommendation.pageName}`)
          } else {
            console.warn(`Page node not found: ${recommendation.pageId}, continuing with node selection`)
            framer.notify(`Could not navigate to page "${recommendation.pageName}". Selecting node directly...`, { variant: 'info', durationMs: 2000 })
          }
        } catch (pageNavError) {
          console.warn('Page navigation failed, continuing with node selection:', pageNavError)
          // Continue with node selection even if page navigation fails
          framer.notify(`Could not navigate to page "${recommendation.pageName}". Selecting node directly...`, { variant: 'info', durationMs: 2000 })
        }
      }
      
      console.log('Attempting to select node:', {
        nodeId: recommendation.nodeId,
        nodeName: recommendation.nodeName
      })
      
      // Verify the node exists
      const node = await framer.getNode(recommendation.nodeId)
      
      if (!node) {
        const pageInfo = recommendation.pageName ? ` on page "${recommendation.pageName}"` : ''
        framer.notify(`Node "${recommendation.nodeName}"${pageInfo} not found. It may have been deleted.`, { variant: 'error' })
        return
      }
      
      console.log('Node found:', {
        id: node.id,
        name: node.name,
        type: node.type
      })
      
      // Attempt selection
      await framer.setSelection([recommendation.nodeId])
      
      console.log('Selection successful')
      const pageInfo = recommendation.pageName ? ` on "${recommendation.pageName}"` : ''
      framer.notify(`Selected "${recommendation.nodeName}"${pageInfo} in canvas`, { variant: 'success', durationMs: 2000 })
    } catch (error) {
      console.error('Selection failed:', error)
      
      // Try to get more info about the error
      try {
        const node = await framer.getNode(recommendation.nodeId)
        const pageInfo = recommendation.pageName ? ` on page "${recommendation.pageName}"` : ''
        
        if (node) {
          // Node exists but selection failed - this is unusual
          framer.notify(`Found node but couldn't select it${pageInfo}. Try selecting "${recommendation.nodeName}" manually in the canvas.`, { variant: 'error', durationMs: 4000 })
        } else {
          framer.notify(`Node "${recommendation.nodeName}"${pageInfo} not found. It may have been deleted or renamed.`, { variant: 'error' })
        }
      } catch (getNodeError) {
        console.error('getNode failed:', getNodeError)
        const pageInfo = recommendation.pageName ? ` on page "${recommendation.pageName}"` : ''
        framer.notify(`Could not find "${recommendation.nodeName}"${pageInfo}. Look for it manually in the canvas.`, { variant: 'error', durationMs: 4000 })
      }
    }
  }

  const typeLabels = {
    oversized: 'Oversized',
    format: 'Format',
    compression: 'Compression'
  }

  const canSelect = recommendation.nodeId && recommendation.nodeId.trim() !== ''
  const hasPreview = recommendation.url && !recommendation.url.includes('.svg')
  const canOptimize = recommendation.url && 
                      recommendation.optimalWidth && 
                      recommendation.optimalHeight && 
                      recommendation.type !== 'compression' && // Skip compression-only recommendations for now
                      !recommendation.url.includes('.svg') // Skip SVGs

  return (
    <>
      <ReplaceImageModal
        isOpen={showReplaceModal}
        onClose={() => setShowReplaceModal(false)}
        onConfirm={handleConfirmOptimize}
        imageAssetId={recommendation.imageAssetId}
        nodeName={recommendation.nodeName}
      />
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3 mb-3">
        {/* Preview thumbnail */}
        {hasPreview && (
          <div className="flex-shrink-0 w-16 h-16 rounded border border-gray-200 overflow-hidden bg-gray-50">
            <img
              src={recommendation.url}
              alt={recommendation.nodeName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image on error
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
        {!hasPreview && (
          <div className="flex-shrink-0 w-16 h-16 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between mb-2">
            <div className="flex gap-2 flex-wrap">
          <Badge variant={recommendation.priority}>
            {recommendation.priority.toUpperCase()}
          </Badge>
          <Badge variant="default">
            {typeLabels[recommendation.type]}
          </Badge>
        </div>
            <div className="text-sm font-semibold text-green-600 flex-shrink-0">
          Save {formatBytes(recommendation.potentialSavings)}
            </div>
          </div>

          {/* Prominent node name */}
          <div className="mb-1">
            <h4 className="font-semibold text-gray-900 text-base break-words">{recommendation.nodeName || 'Unnamed'}</h4>
            {recommendation.pageName && (
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Page: {recommendation.pageName}</span>
              </div>
            )}
            {!canSelect && (
              <div className="text-xs text-amber-600 mt-1">
                <div className="flex items-center gap-1 mb-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>CMS/Settings image - cannot select in canvas</span>
                </div>
                {recommendation.usedInPages && recommendation.usedInPages.length > 0 && (
                  <div className="text-gray-600 mt-1">
                    Used on: {recommendation.usedInPages.map(p => p.pageName).join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
        <div className="text-xs font-medium text-blue-900 mb-1">Action</div>
        <div className="text-sm text-blue-800">{recommendation.actionable}</div>
      </div>

      <div className="flex flex-col gap-2">
        {canOptimize && (
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 min-w-0 ${
              isOptimizing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
            }`}
            title={isOptimizing ? optimizationProgress : 'Resize and compress this image automatically'}
          >
            {isOptimizing ? (
              <>
                <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="truncate min-w-0">{optimizationProgress || 'Optimizing...'}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="truncate">Resize & Compress</span>
              </>
            )}
          </button>
        )}
        <button
          onClick={handleNavigate}
          disabled={!canSelect || isOptimizing}
          className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 min-w-0 ${
            !canSelect || isOptimizing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
          }`}
          title={!canSelect 
            ? 'This recommendation applies to multiple items' 
            : `Select "${recommendation.nodeName}" in canvas`
          }
        >
          {canSelect ? (
            <>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <span className="truncate">
                {recommendation.pageName 
                  ? `Select on "${recommendation.pageName}"`
                  : `Select "${recommendation.nodeName}"`
                }
              </span>
            </>
          ) : (
            <span>Multiple Items</span>
          )}
      </button>
      </div>
    </div>
    </>
  )
}
