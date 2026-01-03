import type { AssetInfo, Recommendation, BreakpointData } from '../types/analysis'

/**
 * Check if SVG content contains expensive features that can slow rendering
 */
function hasExpensiveSVGFeatures(svgContent: string | undefined): boolean {
  if (!svgContent) return false
  
  const content = svgContent.toLowerCase()
  
  // Check for expensive SVG features
  const expensiveFeatures = [
    '<filter',      // Filters (blur, drop-shadow, etc.)
    '<mask',        // Masks
    '<clipPath',    // Clip paths
    '<pattern',     // Patterns
    '<image',       // Embedded raster images
    'feGaussianBlur',
    'feDropShadow',
    'feColorMatrix',
    'feComposite',
    'filter:url',   // CSS filter references
    'mask:url',     // CSS mask references
  ]
  
  return expensiveFeatures.some(feature => content.includes(feature))
}

export function generateRecommendations(
  breakpointData: BreakpointData,
  pageId?: string,
  pageName?: string
): Recommendation[] {
  const recommendations: Recommendation[] = []

  // Track SVGs separately - only count large ones or ones with expensive features
  let largeSvgCount = 0
  let totalLargeSvgBytes = 0
  const SVG_SIZE_THRESHOLD = 50 * 1024 // 50 KB
  const SVG_SMALL_THRESHOLD = 10 * 1024 // 10 KB - below this, skip entirely

  for (const asset of breakpointData.assets) {
    // Handle SVGs with smarter logic
    if (asset.type === 'svg') {
      // Skip very small SVGs (< 10 KB) - these are usually icons and not worth optimizing
      if (asset.estimatedBytes < SVG_SMALL_THRESHOLD) {
        continue
      }
      
      // Check for expensive features or large size
      const hasExpensiveFeatures = hasExpensiveSVGFeatures(asset.svgContent)
      const isLarge = asset.estimatedBytes >= SVG_SIZE_THRESHOLD
      
      // Only create recommendation if large OR has expensive features
      if (isLarge || hasExpensiveFeatures) {
        const svgRec = detectSVGOptimization(asset, pageId, pageName, hasExpensiveFeatures)
        if (svgRec) {
          recommendations.push(svgRec)
          largeSvgCount++
          totalLargeSvgBytes += asset.estimatedBytes
        }
      }
      continue
    }

    // Run detection algorithms for non-SVG assets
    const oversized = detectOversizedImages(asset, pageId, pageName)
    const format = detectFormatIssues(asset, pageId, pageName)
    const compression = detectCompressionOpportunities(asset, pageId, pageName)

    if (oversized) recommendations.push(oversized)
    if (format) recommendations.push(format)
    if (compression) recommendations.push(compression)
  }

  // Add grouped SVG recommendation only if there are multiple large SVGs
  if (largeSvgCount > 5) {
    let potentialSavings = totalLargeSvgBytes * 0.2 // ~20% savings with SVGO
    // Ensure positive integer
    potentialSavings = Math.max(1, Math.round(potentialSavings))
    recommendations.push({
      id: 'svg-optimization-grouped',
      type: 'compression',
      priority: potentialSavings > 100 * 1024 ? 'medium' : 'low',
      nodeId: '',
      nodeName: `${largeSvgCount} large SVG elements`,
      currentBytes: totalLargeSvgBytes,
      potentialSavings,
      description: `${largeSvgCount} large SVG illustrations could be optimized`,
      actionable: `Run large SVGs through SVGO to remove unnecessary metadata and simplify paths (~${Math.round(potentialSavings / 1024)}KB savings)`,
      pageId,
      pageName
    })
  }

  // Deduplicate and sort
  return deduplicateAndSort(recommendations)
}

function detectOversizedImages(asset: AssetInfo, pageId?: string, pageName?: string): Recommendation | null {
  // For MVP, flag images larger than certain thresholds
  const { estimatedBytes, dimensions, format } = asset

  // Skip if estimatedBytes is invalid
  if (!isFinite(estimatedBytes) || isNaN(estimatedBytes) || estimatedBytes <= 0) {
    return null
  }

  // Skip SVGs - they're handled separately
  if (asset.type === 'svg') return null

  // Skip tiny images
  if (dimensions.width < 100 || dimensions.height < 100) return null

  // Check if already in optimized format
  const isOptimizedFormat = format === 'webp' || format === 'avif'
  const actualWidth = Math.round(asset.actualDimensions?.width || dimensions.width)
  const actualHeight = Math.round(asset.actualDimensions?.height || dimensions.height)

  // Calculate optimal dimensions
  // Use actual dimensions if available (more accurate), otherwise use rendered dimensions
  const baseWidth = actualWidth > 0 ? actualWidth : dimensions.width
  const baseHeight = actualHeight > 0 ? actualHeight : dimensions.height
  
  // For optimization: use 2x for retina displays, but ensure minimum quality
  // Cap at 1920px (common max width for modern displays) instead of 1600px
  // Ensure we never make images smaller than their rendered size
  const minWidth = Math.max(baseWidth, dimensions.width) // Don't go smaller than rendered
  const optimalWidth = Math.min(Math.ceil(minWidth * 2), 1920)
  const optimalHeight = Math.max(1, Math.ceil((optimalWidth / baseWidth) * baseHeight))

  // Check if image is already at or close to optimal dimensions
  // Allow 10% tolerance for rounding differences
  const widthTolerance = optimalWidth * 0.1
  const heightTolerance = optimalHeight * 0.1
  const isAtOptimalDimensions = 
    Math.abs(actualWidth - optimalWidth) <= widthTolerance &&
    Math.abs(actualHeight - optimalHeight) <= heightTolerance

  // Also check if width is already at or below the max recommended (1600px)
  // This handles cases where the image was optimized to the recommended size
  const isAtRecommendedMaxWidth = actualWidth <= 1600 && actualWidth >= optimalWidth * 0.9

  // If image is already optimized format AND at optimal/recommended dimensions, be more lenient
  if (isOptimizedFormat && (isAtOptimalDimensions || isAtRecommendedMaxWidth)) {
    // For already-optimized images at good dimensions, use much higher threshold
    // Only flag if still extremely large (> 1.5MB) - might need quality reduction
    if (estimatedBytes > 1.5 * 1024 * 1024) {
      // Still very large even after optimization - might be quality issue
      const targetBytes = 800 * 1024 // Target 800KB for already-optimized images
      let potentialSavings = estimatedBytes - targetBytes
      potentialSavings = Math.max(1, Math.round(potentialSavings))
      
      return {
        id: `oversized-${asset.nodeId}`,
        type: 'oversized',
        priority: 'low',
        nodeId: asset.nodeId,
        nodeName: asset.nodeName,
        currentBytes: estimatedBytes,
        potentialSavings,
        description: `Image is still large (${Math.round(estimatedBytes / 1024)}KB, ${actualWidth}x${actualHeight}px, already WebP/AVIF at recommended size)`,
        actionable: 'Consider reducing quality or using more aggressive compression. Image is already at recommended dimensions.',
        url: asset.url,
        pageId,
        pageName,
        imageAssetId: asset.imageAssetId,
        optimalWidth,
        optimalHeight
      }
    }
    // Image is optimized, at good dimensions, and reasonable size - no recommendation needed
    return null
  }

  // Flag very large images (> 500KB)
  // But use higher threshold (800KB) for images that are already optimized format AND at optimal dimensions
  const oversizedThreshold = (isOptimizedFormat && isAtOptimalDimensions) ? 800 * 1024 : 500 * 1024
  
  if (estimatedBytes > oversizedThreshold) {
    // For already-optimized images at optimal size, use higher target
    const targetBytes = (isOptimizedFormat && isAtOptimalDimensions) ? 500 * 1024 : 300 * 1024
    let potentialSavings = estimatedBytes - targetBytes
    // Ensure positive integer
    potentialSavings = Math.max(1, Math.round(potentialSavings))

    // If already WebP/AVIF and at optimal dimensions, suggest quality reduction instead
    if (isOptimizedFormat && isAtOptimalDimensions) {
      return {
        id: `oversized-${asset.nodeId}`,
        type: 'oversized',
        priority: 'low',
        nodeId: asset.nodeId,
        nodeName: asset.nodeName,
        currentBytes: estimatedBytes,
        potentialSavings,
        description: `Image is large (${Math.round(estimatedBytes / 1024)}KB, ${actualWidth}x${actualHeight}px, already WebP/AVIF at optimal size)`,
        actionable: 'Consider reducing quality or using a more aggressive compression. Image is already at recommended dimensions.',
        url: asset.url,
        pageId,
        pageName,
        imageAssetId: asset.imageAssetId,
        optimalWidth,
        optimalHeight
      }
    }

    // If already WebP/AVIF, only suggest resizing (not format conversion)
    const actionable = isOptimizedFormat
      ? `Resize to ${optimalWidth}x${optimalHeight}px (2x rendered size) to reduce file size`
      : `Resize to ${optimalWidth}x${optimalHeight}px (2x rendered size) and compress to WebP/JPEG`

    return {
      id: `oversized-${asset.nodeId}`,
      type: 'oversized',
      priority: 'high',
      nodeId: asset.nodeId,
      nodeName: asset.nodeName,
      currentBytes: estimatedBytes,
      potentialSavings,
      description: `Image is very large (${Math.round(estimatedBytes / 1024)}KB, ${actualWidth}x${actualHeight}px${isOptimizedFormat ? ', already WebP/AVIF' : ''})`,
      actionable,
      url: asset.url,
      pageId,
      pageName,
      imageAssetId: asset.imageAssetId,
      optimalWidth,
      optimalHeight
    }
  }

  // Flag medium-large images (200-500KB)
  if (estimatedBytes > 200 * 1024) {
    // Check if already at optimal dimensions (recalculate for this threshold)
    const mediumBaseWidth = actualWidth > 0 ? actualWidth : dimensions.width
    const mediumBaseHeight = actualHeight > 0 ? actualHeight : dimensions.height
    const mediumMinWidth = Math.max(mediumBaseWidth, dimensions.width)
    const mediumOptimalWidth = Math.min(Math.ceil(mediumMinWidth * 2), 1920)
    const mediumOptimalHeight = Math.max(1, Math.ceil((mediumOptimalWidth / mediumBaseWidth) * mediumBaseHeight))
    const mediumWidthTolerance = mediumOptimalWidth * 0.1
    const mediumHeightTolerance = mediumOptimalHeight * 0.1
    const isAtMediumOptimalDimensions = 
      Math.abs(actualWidth - mediumOptimalWidth) <= mediumWidthTolerance &&
      Math.abs(actualHeight - mediumOptimalHeight) <= mediumHeightTolerance

    // If already optimized format AND at optimal dimensions, skip
    if (isOptimizedFormat && isAtMediumOptimalDimensions) {
      return null
    }

    const targetBytes = 150 * 1024
    let potentialSavings = estimatedBytes - targetBytes
    // Ensure positive integer
    potentialSavings = Math.max(1, Math.round(potentialSavings))

    // If already WebP/AVIF, only suggest resizing
    const actionable = isOptimizedFormat
      ? `Resize to max ${mediumOptimalWidth}px width to reduce file size`
      : `Resize to max ${mediumOptimalWidth}px width and compress to WebP format`

    return {
      id: `oversized-${asset.nodeId}`,
      type: 'oversized',
      priority: 'medium',
      nodeId: asset.nodeId,
      nodeName: asset.nodeName,
      currentBytes: estimatedBytes,
      potentialSavings,
      description: `Image could be smaller (${Math.round(estimatedBytes / 1024)}KB, ${actualWidth}x${actualHeight}px${isOptimizedFormat ? ', already WebP/AVIF' : ''})`,
      actionable,
      url: asset.url,
      pageId,
      pageName,
      imageAssetId: asset.imageAssetId,
      optimalWidth,
      optimalHeight
    }
  }

  return null
}

function detectFormatIssues(asset: AssetInfo, pageId?: string, pageName?: string): Recommendation | null {
  const { format, estimatedBytes, type } = asset

  // Skip if estimatedBytes is invalid
  if (!isFinite(estimatedBytes) || isNaN(estimatedBytes) || estimatedBytes <= 0) {
    return null
  }

  // Skip SVGs
  if (type === 'svg') return null

  // Skip if already WebP or AVIF (these are already optimized formats)
  if (format === 'webp' || format === 'avif') return null

  // Detect PNG photos that should be JPEG/WebP
  if (format === 'png' && estimatedBytes > 100 * 1024) {
    let potentialSavings = estimatedBytes * 0.6 // 60% savings with JPEG
    // Ensure positive integer
    potentialSavings = Math.max(1, Math.round(potentialSavings))
    const actualWidth = Math.round(asset.actualDimensions?.width || asset.dimensions.width)
    const actualHeight = Math.round(asset.actualDimensions?.height || asset.dimensions.height)
    // Don't reduce below rendered size, cap at 1920px for modern displays
    const minWidth = Math.max(actualWidth, asset.dimensions.width)
    const optimalWidth = Math.min(minWidth, 1920)
    const optimalHeight = Math.max(1, Math.round((optimalWidth / actualWidth) * actualHeight))

    return {
      id: `format-${asset.nodeId}`,
      type: 'format',
      priority: potentialSavings > 100 * 1024 ? 'high' : 'medium',
      nodeId: asset.nodeId,
      nodeName: asset.nodeName,
      currentBytes: estimatedBytes,
      potentialSavings,
      description: `PNG format used for photo (${actualWidth}x${actualHeight}px)`,
        actionable: 'Replace with AVIF/WebP format (max 1920px width) for 60% smaller file',
      url: asset.url,
      pageId,
      pageName,
      imageAssetId: asset.imageAssetId,
      optimalWidth,
      optimalHeight
    }
  }

  // Suggest WebP for large JPEGs (but not if already WebP/AVIF)
  if ((format === 'jpeg' || format === 'jpg') && estimatedBytes > 200 * 1024 && format !== 'webp' && format !== 'avif') {
    let potentialSavings = estimatedBytes * 0.3 // 30% savings with WebP
    // Ensure positive integer
    potentialSavings = Math.max(1, Math.round(potentialSavings))
    const actualWidth = Math.round(asset.actualDimensions?.width || asset.dimensions.width)
    const actualHeight = Math.round(asset.actualDimensions?.height || asset.dimensions.height)
    // Don't reduce below rendered size, cap at 1920px for modern displays
    const minWidth = Math.max(actualWidth, asset.dimensions.width)
    const optimalWidth = Math.min(minWidth, 1920)
    const optimalHeight = Math.max(1, Math.round((optimalWidth / actualWidth) * actualHeight))

    return {
      id: `format-webp-${asset.nodeId}`,
      type: 'format',
      priority: 'low',
      nodeId: asset.nodeId,
      nodeName: asset.nodeName,
      currentBytes: estimatedBytes,
      potentialSavings,
      description: `Large JPEG (${actualWidth}x${actualHeight}px)`,
      actionable: `Replace with AVIF/WebP format (max ${optimalWidth}px width) for 30% smaller file`,
      url: asset.url,
      pageId,
      pageName,
      imageAssetId: asset.imageAssetId,
      optimalWidth,
      optimalHeight
    }
  }

  return null
}

/**
 * Detect SVG optimization opportunities
 * Only recommends for large SVGs (> 50 KB) or SVGs with expensive features
 */
function detectSVGOptimization(
  asset: AssetInfo,
  pageId?: string,
  pageName?: string,
  hasExpensiveFeatures?: boolean
): Recommendation | null {
  const { estimatedBytes } = asset

  // Skip if estimatedBytes is invalid
  if (!isFinite(estimatedBytes) || isNaN(estimatedBytes) || estimatedBytes <= 0) {
    return null
  }

  // Only for actual SVG nodes (not background images with SVG format)
  // SVGs without URLs are true SVG nodes, not images
  if (asset.type !== 'svg' || asset.url) {
    return null
  }

  const SVG_SIZE_THRESHOLD = 50 * 1024 // 50 KB
  const isLarge = estimatedBytes >= SVG_SIZE_THRESHOLD

  // Only recommend if large OR has expensive features
  if (!isLarge && !hasExpensiveFeatures) {
    return null
  }

  let potentialSavings = estimatedBytes * 0.2 // ~20% savings with SVGO (conservative)
  // Ensure positive integer
  potentialSavings = Math.max(1, Math.round(potentialSavings))

  // Determine priority and description based on size and features
  let priority: 'high' | 'medium' | 'low' = 'low'
  let description = 'SVG could be optimized'
  let actionable = 'Run through SVGO to remove unnecessary metadata and simplify paths'

  if (hasExpensiveFeatures && isLarge) {
    priority = 'medium'
    description = `Large SVG with expensive features (${Math.round(estimatedBytes / 1024)}KB)`
    actionable = 'Consider simplifying filters/masks or replacing with optimized raster image. Run through SVGO first.'
  } else if (hasExpensiveFeatures) {
    priority = 'low'
    description = `SVG contains expensive features (filters, masks, or embedded images)`
    actionable = 'Simplify filters, masks, or embedded images. Consider replacing with raster image if rendering is slow.'
  } else if (isLarge) {
    priority = estimatedBytes > 200 * 1024 ? 'medium' : 'low'
    description = `Large SVG illustration (${Math.round(estimatedBytes / 1024)}KB)`
    actionable = 'Run through SVGO to remove unnecessary metadata, reduce path precision, and minify markup'
  }

  return {
    id: `svg-optimize-${asset.nodeId}`,
    type: 'compression',
    priority,
    nodeId: asset.nodeId,
    nodeName: asset.nodeName,
    currentBytes: estimatedBytes,
    potentialSavings,
    description,
    actionable,
    url: asset.url,
    pageId,
    pageName
  }
}

function detectCompressionOpportunities(asset: AssetInfo, pageId?: string, pageName?: string): Recommendation | null {
  const { estimatedBytes, format, type } = asset

  // Skip SVGs - they're handled separately
  if (type === 'svg') return null

  // Skip if already analyzed for format issues
  if (format === 'png' && estimatedBytes > 100 * 1024) return null

  // Skip if estimatedBytes is invalid
  if (!isFinite(estimatedBytes) || isNaN(estimatedBytes) || estimatedBytes <= 0) {
    return null
  }

  // General compression for medium images
  if (estimatedBytes > 150 * 1024 && estimatedBytes <= 200 * 1024) {
    let potentialSavings = estimatedBytes * 0.25
    // Ensure positive integer
    potentialSavings = Math.max(1, Math.round(potentialSavings))

    return {
      id: `compress-${asset.nodeId}`,
      type: 'compression',
      priority: 'medium',
      nodeId: asset.nodeId,
      nodeName: asset.nodeName,
      currentBytes: estimatedBytes,
      potentialSavings,
      description: 'Image could benefit from compression',
      actionable: 'Use TinyPNG, ImageOptim, or Squoosh to compress',
      url: asset.url,
      pageId,
      pageName
    }
  }

  return null
}

function deduplicateAndSort(recommendations: Recommendation[]): Recommendation[] {
  // Deduplicate by ID
  const unique = Array.from(
    new Map(recommendations.map(rec => [rec.id, rec])).values()
  )

  // Sort globally by impact (potentialSavings) first, then by priority
  // This ensures highest impact recommendations appear first regardless of page
  const priorityOrder = { high: 0, medium: 1, low: 2 }

  return unique.sort((a, b) => {
    // Primary sort: by potential savings (descending)
    if (b.potentialSavings !== a.potentialSavings) {
      return b.potentialSavings - a.potentialSavings
    }
    // Secondary sort: by priority
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

export function calculateTotalSavings(recommendations: Recommendation[]): number {
  return recommendations.reduce((total, rec) => total + rec.potentialSavings, 0)
}
