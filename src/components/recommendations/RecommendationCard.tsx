import { useState } from 'react'
import { framer } from 'framer-plugin'
import type { Recommendation } from '../../types/analysis'
import { Badge } from '../primitives/Badge'
import { formatBytes } from '../../utils/formatBytes'
import { optimizeImage } from '../../services/imageOptimizer'
import { replaceImageOnNode, replaceImageEverywhere, canReplaceImage } from '../../services/assetReplacer'
import { ReplaceImageModal } from './ReplaceImageModal'
import { debugLog } from '../../utils/debugLog'
import { colors, spacing, typography, borders } from '../../styles/designTokens'

interface RecommendationCardProps {
  recommendation: Recommendation
  allPages?: { pageId: string; pageName: string }[]
  onIgnore?: () => void
  isIgnored?: boolean
}

export function RecommendationCard({ recommendation, onIgnore, isIgnored = false }: RecommendationCardProps) {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [showReplaceModal, setShowReplaceModal] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)

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
          recommendation.nodeName
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
              } catch {
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
          recommendation.nodeName
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
            } catch {
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
      debugLog.error('Optimization error:', error)
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
    
    debugLog.info('Select in Canvas clicked:', {
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
          debugLog.info(`Navigating to page: ${recommendation.pageName} (${recommendation.pageId})`)
          
          // Try to get the page node and set it as selection to navigate
          // Framer doesn't have a direct navigateToPage API, but selecting the page node should work
          const pageNode = await framer.getNode(recommendation.pageId)
          
          if (pageNode) {
            // Select the page to navigate to it
            await framer.setSelection([recommendation.pageId])
            // Small delay to allow page navigation to complete
            await new Promise(resolve => setTimeout(resolve, 300))
            debugLog.info(`Navigated to page: ${recommendation.pageName}`)
          } else {
            debugLog.warn(`Page node not found: ${recommendation.pageId}, continuing with node selection`)
            framer.notify(`Could not navigate to page "${recommendation.pageName}". Selecting node directly...`, { variant: 'info', durationMs: 2000 })
          }
        } catch (pageNavError) {
          debugLog.warn('Page navigation failed, continuing with node selection:', pageNavError)
          // Continue with node selection even if page navigation fails
          framer.notify(`Could not navigate to page "${recommendation.pageName}". Selecting node directly...`, { variant: 'info', durationMs: 2000 })
        }
      }
      
      debugLog.info('Attempting to select node:', {
        nodeId: recommendation.nodeId,
        nodeName: recommendation.nodeName
      })
      
      // Verify the node exists
      const node = await framer.getNode(recommendation.nodeId)
      
      if (!node) {
        const pageInfo = recommendation.pageName ? ` on page "${recommendation.pageName}"` : ''
        framer.notify(`Node "${recommendation.nodeName}"${pageInfo} not found. It may have been moved or deleted. Try rescanning.`, { variant: 'error' })
        return
      }
      
      debugLog.info('Node found:', {
        id: node.id,
        name: node.name,
        type: node.type
      })
      
      // Attempt selection
      await framer.setSelection([recommendation.nodeId])
      
      debugLog.info('Selection successful')
      const pageInfo = recommendation.pageName ? ` on "${recommendation.pageName}"` : ''
      framer.notify(`Selected "${recommendation.nodeName}"${pageInfo} in canvas`, { variant: 'success', durationMs: 2000 })
    } catch (error) {
      debugLog.error('Selection failed:', error)
      
      // Try to get more info about the error
      try {
        const node = await framer.getNode(recommendation.nodeId)
        const pageInfo = recommendation.pageName ? ` on page "${recommendation.pageName}"` : ''
        
        if (node) {
          // Node exists but selection failed - this is unusual
          framer.notify(`Found node but couldn't select it${pageInfo}. Try selecting "${recommendation.nodeName}" manually in the canvas, or click Rescan to refresh the analysis.`, { variant: 'error', durationMs: 4000 })
        } else {
          framer.notify(`Node "${recommendation.nodeName}"${pageInfo} not found. It may have been moved or deleted. Try rescanning.`, { variant: 'error' })
        }
      } catch (getNodeError) {
        debugLog.error('getNode failed:', getNodeError)
        const pageInfo = recommendation.pageName ? ` on page "${recommendation.pageName}"` : ''
        framer.notify(`Could not find "${recommendation.nodeName}"${pageInfo}. It may have been moved or deleted. Click Rescan to refresh, or look for it manually in the canvas.`, { variant: 'error', durationMs: 4000 })
      }
    }
  }

  const typeLabels = {
    oversized: 'Oversized',
    format: 'Format',
    compression: 'Compression'
  }

  const isCMS = recommendation.isCMSAsset || !!recommendation.cmsItemSlug
  const canSelect = !isCMS && recommendation.nodeId && recommendation.nodeId.trim() !== ''
  const hasPreview = recommendation.url && !recommendation.url.includes('.svg')
  const canOptimize = !isCMS && recommendation.url && 
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
    <div
      style={{
        backgroundColor: colors.white,
        border: `1px solid ${colors.warmGray[200]}`,
        borderRadius: borders.radius.lg,
        padding: spacing.lg,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Content Row with Thumbnail */}
      <div style={{
        display: 'flex',
        gap: spacing.md,
        marginBottom: spacing.lg
      }}>
        {/* Thumbnail - Left Side */}
        {hasPreview && (
          <div
            style={{
              flexShrink: 0,
              width: '64px',
              height: '64px',
              borderRadius: borders.radius.md,
              border: `1.5px solid ${colors.warmGray[200]}`,
              backgroundColor: colors.warmGray[50],
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
          >
            <img
              src={recommendation.url}
              alt={recommendation.nodeName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Content - Right Side */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Savings Badge - Refined */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: `3px ${spacing.sm}`,
            backgroundColor: colors.almostBlack,
            color: colors.white,
            fontSize: '11px',
            fontWeight: typography.fontWeight.bold,
            borderRadius: borders.radius.full,
            alignSelf: 'flex-start',
            letterSpacing: '0.01em'
          }}>
            −{formatBytes(recommendation.potentialSavings)}
          </div>

          {/* Asset Name - Better Typography */}
          <div style={{
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            color: colors.almostBlack,
            lineHeight: typography.lineHeight.tight,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em'
          }}>
            {recommendation.nodeName || 'Unnamed'}
          </div>

          {/* Recommendation Details - Improved Readability */}
          <div style={{
            fontSize: typography.fontSize.xs,
            color: colors.warmGray[600],
            lineHeight: '1.5'
          }}>
            {recommendation.actionable || recommendation.description}
            {(recommendation.pageSlug || recommendation.pageName) && (
              <>
                {' · '}
                {recommendation.pageUrl ? (
                  <a
                    href={recommendation.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: colors.warmGray[600],
                      textDecoration: 'none',
                      borderBottom: `1px solid ${colors.warmGray[300]}`,
                      transition: 'all 0.15s ease',
                      paddingBottom: '1px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = colors.almostBlack
                      e.currentTarget.style.borderBottomColor = colors.almostBlack
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = colors.warmGray[600]
                      e.currentTarget.style.borderBottomColor = colors.warmGray[300]
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {recommendation.pageSlug || recommendation.pageName}
                  </a>
                ) : (
                  <span>{recommendation.pageSlug || recommendation.pageName}</span>
                )}
              </>
            )}
            {isCMS && <span style={{ color: colors.warmGray[400] }}> · CMS</span>}
          </div>
        </div>
      </div>

      {/* Primary Action Button - Only Interactive Elements Have Hover */}
      {canOptimize ? (
        <button
          onClick={handleOptimize}
          disabled={isOptimizing}
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: borders.radius.md,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.xs,
            letterSpacing: '-0.01em',
            ...(isOptimizing ? {
              backgroundColor: colors.warmGray[100],
              color: colors.warmGray[500],
              cursor: 'not-allowed',
              border: `1px solid ${colors.warmGray[200]}`,
              transition: 'none'
            } : {
              backgroundColor: colors.almostBlack,
              color: colors.white,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            })
          }}
          onMouseEnter={(e) => {
            if (!isOptimizing) {
              e.currentTarget.style.backgroundColor = '#000000'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isOptimizing) {
              e.currentTarget.style.backgroundColor = colors.almostBlack
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.transform = 'translateY(0)'
            }
          }}
        >
          {isOptimizing ? (
            <>
              <svg style={{
                width: '14px',
                height: '14px',
                animation: 'spin 1s linear infinite',
                flexShrink: 0
              }} fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{optimizationProgress || 'Optimizing...'}</span>
            </>
          ) : (
            'Optimize'
          )}
        </button>
      ) : canSelect ? (
        <button
          onClick={handleNavigate}
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: borders.radius.md,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: colors.almostBlack,
            color: colors.white,
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '-0.01em',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#000000'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.almostBlack
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          Select in Canvas
        </button>
      ) : (
        <div style={{
          padding: '10px 16px',
          fontSize: typography.fontSize.xs,
          color: colors.warmGray[500],
          textAlign: 'center',
          backgroundColor: colors.warmGray[50],
          borderRadius: borders.radius.md,
          border: `1px solid ${colors.warmGray[200]}`,
          cursor: 'default'
        }}>
          {isCMS ? 'Edit in CMS collection' : 'Multiple items'}
        </div>
      )}

      {/* Secondary Actions - Smart Layout */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTop: `1px solid ${colors.warmGray[100]}`
      }}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: `${spacing.xs} 0`,
            fontSize: '11px',
            color: colors.warmGray[500],
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontWeight: typography.fontWeight.medium,
            transition: 'color 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.almostBlack
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.warmGray[500]
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease'
            }}
          >
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
        </button>

        {onIgnore && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onIgnore()
            }}
            style={{
              padding: `${spacing.xs} 0`,
              fontSize: '11px',
              color: colors.warmGray[500],
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: typography.fontWeight.medium,
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = colors.almostBlack
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.warmGray[500]
            }}
          >
            {isIgnored ? 'Restore' : 'Ignore'}
          </button>
        )}
      </div>

      {/* Expandable Details - Below Actions */}
      {isExpanded && (
        <div style={{
          marginTop: spacing.md,
          padding: spacing.md,
          backgroundColor: colors.warmGray[50],
          borderRadius: borders.radius.md,
          fontSize: typography.fontSize.xs,
          lineHeight: typography.lineHeight.relaxed,
          color: colors.warmGray[600],
          border: `1px solid ${colors.warmGray[100]}`,
          wordBreak: 'break-word'
        }}>
          {recommendation.description}
        </div>
      )}
    </div>
    </>
  )
}
