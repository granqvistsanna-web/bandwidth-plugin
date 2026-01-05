import { useState, useCallback, useEffect, useRef } from 'react'
import { framer } from 'framer-plugin'
import type { Recommendation } from '../../types/analysis'
import { Button } from '../primitives/Button'
import { formatBytes } from '../../utils/formatBytes'
import { optimizeImage } from '../../services/imageOptimizer'
import { downloadOptimizedImage } from '../../services/imageDownloader'
import { ReplaceImageModal } from './ReplaceImageModal'
import { debugLog } from '../../utils/debugLog'
import { spacing, typography, borders, surfaces, themeBorders, themeElevation, framerColors, iconSize } from '../../styles/designTokens'
import { getThumbnailUrl } from '../../utils/imageThumbnail'

interface RecommendationCardProps {
  recommendation: Recommendation
  allPages?: { pageId: string; pageName: string }[]
  onIgnore?: () => void
  isIgnored?: boolean
}

// Priority badge styling - refined approach
function getPriorityBadge(priority: 'high' | 'medium' | 'low'): { bg: string; text: string; label: string } | null {
  switch (priority) {
    case 'high':
      return {
        bg: 'rgba(239, 68, 68, 0.12)',
        text: '#DC2626',
        label: 'High'
      }
    case 'medium':
      return {
        bg: 'rgba(245, 158, 11, 0.12)',
        text: '#D97706',
        label: 'Med'
      }
    case 'low':
      return null // No badge for low priority - keeps UI clean
    default:
      return null
  }
}

export function RecommendationCard({ recommendation, onIgnore, isIgnored = false }: RecommendationCardProps) {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [showReplaceModal, setShowReplaceModal] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false)
  const [shouldLoadThumbnail, setShouldLoadThumbnail] = useState(false)
  const thumbnailContainerRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])

  const isCMS = recommendation.isCMSAsset || !!recommendation.cmsItemSlug
  const canSelect = !isCMS && recommendation.nodeId && recommendation.nodeId.trim() !== ''
  const hasPreview = recommendation.url && !recommendation.url.includes('.svg')
  const canOptimize = !isCMS && recommendation.url && 
                      recommendation.optimalWidth && 
                      recommendation.optimalHeight && 
                      recommendation.type !== 'compression' && // Skip compression-only recommendations for now
                      !recommendation.url.includes('.svg') // Skip SVGs

  // Use Intersection Observer to load thumbnails when visible
  useEffect(() => {
    const container = thumbnailContainerRef.current
    if (!container || !hasPreview) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoadThumbnail(true)
            observer.disconnect()
          }
        })
      },
      {
        // Start loading when thumbnail is 50px away from viewport
        rootMargin: '50px',
        threshold: 0.01
      }
    )

    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [hasPreview])

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

    // Show modal to confirm download
    setShowReplaceModal(true)
  }

  const handleConfirmOptimize = async () => {
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

      setOptimizationProgress('Preparing download...')

      const savings = result.originalSize - result.optimizedSize
      const savingsFormatted = formatBytes(savings)

      // Always download - user will replace manually
      await downloadOptimizedImage(result.data, result.format, recommendation.nodeName)
      
      // Select the node to help user find it
      if (recommendation.nodeId) {
        try {
          await framer.setSelection([recommendation.nodeId])
        } catch {
          // Ignore selection errors
        }
      }
      
      framer.notify(
        `Image optimized and downloaded! Saved ${savingsFormatted}. Replace the original manually by dragging the downloaded file onto the element.`,
        { variant: 'success', durationMs: 6000 }
      )
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

    setIsSelecting(true)

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
    } finally {
      setIsSelecting(false)
    }
  }

  return (
    <>
      <ReplaceImageModal
        isOpen={showReplaceModal}
        onClose={() => setShowReplaceModal(false)}
        onConfirm={handleConfirmOptimize}
        imageAssetId={recommendation.imageAssetId}
        nodeName={recommendation.nodeName}
        optimalWidth={recommendation.optimalWidth}
        optimalHeight={recommendation.optimalHeight}
        potentialSavings={recommendation.potentialSavings}
      />
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        backgroundColor: surfaces.secondary,
        borderRadius: borders.radius.lg,
        padding: spacing.lg,
        boxShadow: themeElevation.subtle,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
      }}
    >
      {/* Content Row with Thumbnail */}
      <div style={{
        display: 'flex',
        gap: spacing.md,
        marginBottom: spacing.md
      }}>
        {/* Thumbnail - Left Side (loads when visible) */}
        {hasPreview && (
          <div
            ref={thumbnailContainerRef}
            style={{
              flexShrink: 0,
              width: '64px',
              height: '64px',
              borderRadius: borders.radius.md,
              border: `1.5px solid ${themeBorders.subtle}`,
              backgroundColor: surfaces.tertiary,
              overflow: 'hidden',
              boxShadow: themeElevation.subtle,
              position: 'relative'
            }}
          >
            {/* Placeholder */}
            {!thumbnailLoaded && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: shouldLoadThumbnail ? 'pulse 1.5s ease-in-out infinite' : 'none'
                }}
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke={framerColors.textTertiary}
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
            {/* Image - loads when visible in viewport */}
            {shouldLoadThumbnail && (
              <img
                src={getThumbnailUrl(recommendation.url || '', 64)}
                alt={recommendation.nodeName}
                loading="lazy"
                decoding="async"
                onLoad={() => setThumbnailLoaded(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: thumbnailLoaded ? 1 : 0,
                  transition: 'opacity 0.15s ease'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
          </div>
        )}

        {/* Content - Right Side */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {/* Badges Row - Priority + CMS + Savings */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
            {/* CMS Badge - Show when asset is from CMS */}
            {isCMS && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: `${spacing.xxs} ${spacing.sm}`,
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  color: '#6366F1',
                  fontSize: typography.fontSize.xxs || '10px',
                  fontWeight: typography.fontWeight.bold,
                  borderRadius: borders.radius.full,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}
                title={recommendation.cmsItemSlug ? `CMS item: ${recommendation.cmsItemSlug}` : 'CMS-managed asset'}
              >
                CMS
              </div>
            )}
            {/* Priority Badge - Only show for high/medium */}
            {(() => {
              const priorityBadge = getPriorityBadge(recommendation.priority)
              if (!priorityBadge) return null
              return (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: `${spacing.xxs} ${spacing.sm}`,
                  backgroundColor: priorityBadge.bg,
                  color: priorityBadge.text,
                  fontSize: typography.fontSize.xxs || '10px',
                  fontWeight: typography.fontWeight.bold,
                  borderRadius: borders.radius.full,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}>
                  {priorityBadge.label}
                </div>
              )
            })()}
            {/* Savings Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: `${spacing.xxs} ${spacing.sm}`,
              backgroundColor: 'var(--framer-color-bg-tertiary)',
              color: framerColors.text,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.bold,
              borderRadius: borders.radius.full,
              letterSpacing: typography.letterSpacing.normal
            }}>
              −{formatBytes(recommendation.potentialSavings)}
            </div>
          </div>

          {/* Asset Name - Better Typography */}
          <div style={{
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            color: framerColors.text,
            lineHeight: typography.lineHeight.tight,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: typography.letterSpacing.tight
          }}>
            {recommendation.nodeName || 'Unnamed'}
          </div>

          {/* Route Info - Shows the Site Page route */}
          {(() => {
            const routeSlug = recommendation.pageSlug || ''
            const routeName = recommendation.pageName || ''

            let displayText = ''
            if (routeSlug) {
              displayText = routeSlug === '/' ? '/ (Home)' : routeSlug
            } else if (routeName) {
              displayText = routeName.toLowerCase() === 'home' ? '/ (Home)' :
                           `/${routeName.toLowerCase().replace(/\s+/g, '-')}`
            } else {
              return null
            }

            return (
              <div style={{
                fontSize: '11px',
                color: framerColors.textTertiary,
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {displayText}
              </div>
            )
          })()}

          {/* Recommendation Details - Improved Readability */}
          <div style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textSecondary,
            lineHeight: '1.5'
          }}>
            {recommendation.actionable || recommendation.description}
          </div>
        </div>
      </div>

      {/* Primary Actions - Optimize/Select and Ignore */}
      <div style={{
        display: 'flex',
        gap: spacing.sm,
        alignItems: 'stretch'
      }}>
        {/* Primary Action Button */}
        <div style={{ flex: 1 }}>
          {canOptimize ? (
            <Button
              onClick={handleOptimize}
              disabled={isOptimizing}
              variant="primary"
              fullWidth
              icon={isOptimizing ? (
                <svg style={{
                  width: iconSize.sm,
                  height: iconSize.sm,
                  animation: 'spin 1s linear infinite',
                  flexShrink: 0
                }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : undefined}
            >
              {isOptimizing ? (optimizationProgress || 'Optimizing...') : 'Optimize'}
            </Button>
          ) : canSelect ? (
            <Button
              onClick={handleNavigate}
              variant="secondary"
              size="sm"
              fullWidth
              disabled={isSelecting}
              icon={isSelecting ? (
                <svg style={{
                  width: iconSize.sm,
                  height: iconSize.sm,
                  animation: 'spin 1s linear infinite',
                  flexShrink: 0
                }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : undefined}
            >
              {isSelecting ? 'Selecting...' : 'Select in Canvas'}
            </Button>
          ) : (
            <div style={{
              padding: `${spacing.sm} ${spacing.md}`,
              fontSize: typography.fontSize.xs,
              color: framerColors.textSecondary,
              textAlign: 'center',
              backgroundColor: surfaces.tertiary,
              borderRadius: borders.radius.md,
              border: `1px solid ${themeBorders.subtle}`,
              cursor: 'default',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isCMS ? 'Edit in CMS collection' : 'Multiple items'}
            </div>
          )}
        </div>

        {/* Ignore Button - Prominent */}
        {onIgnore && (
          <Button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onIgnore()
            }}
            variant="secondary"
            size="sm"
            title={isIgnored ? 'Restore this recommendation' : 'Ignore this recommendation'}
          >
            {isIgnored ? 'Restore' : 'Ignore'}
          </Button>
        )}
      </div>

      {/* Secondary Actions - Show Details */}
      {!isExpanded && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: spacing.sm,
          paddingTop: spacing.sm,
          borderTop: `1px solid ${themeBorders.subtle}`
        }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.xs,
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: framerColors.textSecondary,
              borderRadius: borders.radius.md,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = surfaces.tertiary
              e.currentTarget.style.color = framerColors.text
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = framerColors.textSecondary
            }}
          >
            <span>Show technical details</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              style={{
                transition: 'transform 0.15s ease',
                flexShrink: 0
              }}
            >
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Expandable Technical Details - Only show actionable info */}
      {isExpanded && (
        <div style={{
          marginTop: spacing.md,
          padding: spacing.md,
          backgroundColor: surfaces.tertiary,
          borderRadius: borders.radius.md,
          fontSize: typography.fontSize.xs,
          lineHeight: typography.lineHeight.relaxed,
          color: framerColors.textSecondary,
          border: `1px solid ${themeBorders.subtle}`
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.sm
          }}>
            {/* File Size Information */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: spacing.xs,
              borderBottom: `1px solid ${themeBorders.subtle}`
            }}>
              <span style={{ color: framerColors.textTertiary }}>Current size:</span>
              <span style={{ fontWeight: typography.fontWeight.medium, color: framerColors.text }}>
                {formatBytes(recommendation.currentBytes)}
              </span>
            </div>

            {/* Potential Savings */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: spacing.xs,
              borderBottom: `1px solid ${themeBorders.subtle}`
            }}>
              <span style={{ color: framerColors.textTertiary }}>Potential savings:</span>
              <span style={{ fontWeight: typography.fontWeight.medium, color: framerColors.text }}>
                {formatBytes(recommendation.potentialSavings)}
              </span>
            </div>

            {/* Dimensions (if available) */}
            {recommendation.optimalWidth && recommendation.optimalHeight && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: spacing.xs,
                borderBottom: `1px solid ${themeBorders.subtle}`
              }}>
                <span style={{ color: framerColors.textTertiary }}>Optimal dimensions:</span>
                <span style={{ fontWeight: typography.fontWeight.medium, color: framerColors.text }}>
                  {recommendation.optimalWidth} × {recommendation.optimalHeight}px
                </span>
              </div>
            )}

            {/* Format (if available) */}
            {recommendation.url && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: (recommendation.pageSlug || recommendation.pageName) ? spacing.xs : 0,
                borderBottom: (recommendation.pageSlug || recommendation.pageName) ? `1px solid ${themeBorders.subtle}` : 'none'
              }}>
                <span style={{ color: framerColors.textTertiary }}>Format:</span>
                <span style={{ fontWeight: typography.fontWeight.medium, color: framerColors.text }}>
                  {recommendation.url.split('.').pop()?.toUpperCase() || 'Unknown'}
                </span>
              </div>
            )}

            {/* Route Location - Shows the Site Page route */}
            {(() => {
              const routeSlug = recommendation.pageSlug || ''
              const routeName = recommendation.pageName || ''

              // Format the route display
              let displayRoute = ''
              if (routeSlug) {
                displayRoute = routeSlug === '/' ? '/ (Home)' : routeSlug
              } else if (routeName) {
                displayRoute = routeName.toLowerCase() === 'home' ? '/ (Home)' :
                              `/${routeName.toLowerCase().replace(/\s+/g, '-')}`
              }

              if (!displayRoute) return null

              return (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: recommendation.breakpoint ? spacing.xs : 0,
                  borderBottom: recommendation.breakpoint ? `1px solid ${themeBorders.subtle}` : 'none'
                }}>
                  <span style={{ color: framerColors.textTertiary }}>Route:</span>
                  <span style={{
                    fontWeight: typography.fontWeight.medium,
                    color: framerColors.text,
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}>
                    {displayRoute}
                  </span>
                </div>
              )
            })()}

            {/* Breakpoint - Shows which breakpoint frame the asset is in */}
            {recommendation.breakpoint && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: framerColors.textTertiary }}>Breakpoint:</span>
                <span style={{
                  fontWeight: typography.fontWeight.medium,
                  color: framerColors.text,
                  fontSize: typography.fontSize.xs
                }}>
                  {recommendation.breakpoint}
                </span>
              </div>
            )}
          </div>

          {/* Hide Details Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: spacing.md,
            paddingTop: spacing.md,
            borderTop: `1px solid ${themeBorders.subtle}`
          }}>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: framerColors.textSecondary,
                borderRadius: borders.radius.md,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = surfaces.tertiary
                e.currentTarget.style.color = framerColors.text
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = framerColors.textSecondary
              }}
            >
              <span>Hide details</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{
                  transform: 'rotate(180deg)',
                  transition: 'transform 0.15s ease',
                  flexShrink: 0
                }}
              >
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
