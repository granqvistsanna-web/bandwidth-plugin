import type { AssetInfo, Recommendation, BreakpointData } from '../types/analysis'

export function generateRecommendations(breakpointData: BreakpointData): Recommendation[] {
  const recommendations: Recommendation[] = []

  for (const asset of breakpointData.assets) {
    // Run all detection algorithms
    const oversized = detectOversizedImages(asset)
    const format = detectFormatIssues(asset)
    const compression = detectCompressionOpportunities(asset)

    if (oversized) recommendations.push(oversized)
    if (format) recommendations.push(format)
    if (compression) recommendations.push(compression)
  }

  // Deduplicate and sort
  return deduplicateAndSort(recommendations)
}

function detectOversizedImages(asset: AssetInfo): Recommendation | null {
  // For MVP, flag images larger than certain thresholds
  const { estimatedBytes, dimensions } = asset

  // Skip tiny images
  if (dimensions.width < 100 || dimensions.height < 100) return null

  // Flag very large images
  if (estimatedBytes > 500 * 1024) {
    const targetBytes = 300 * 1024 // Target 300KB
    const potentialSavings = estimatedBytes - targetBytes

    return {
      id: `oversized-${asset.nodeId}`,
      type: 'oversized',
      priority: 'high',
      nodeId: asset.nodeId,
      nodeName: asset.nodeName,
      currentBytes: estimatedBytes,
      potentialSavings,
      description: `Image is very large (${Math.round(estimatedBytes / 1024)}KB)`,
      actionable: `Reduce image size to max ${Math.ceil(dimensions.width * 2)}×${Math.ceil(dimensions.height * 2)}px and compress`
    }
  }

  // Flag medium-large images
  if (estimatedBytes > 200 * 1024) {
    const targetBytes = 150 * 1024
    const potentialSavings = estimatedBytes - targetBytes

    return {
      id: `oversized-${asset.nodeId}`,
      type: 'oversized',
      priority: 'medium',
      nodeId: asset.nodeId,
      nodeName: asset.nodeName,
      currentBytes: estimatedBytes,
      potentialSavings,
      description: `Image could be smaller (${Math.round(estimatedBytes / 1024)}KB)`,
      actionable: `Optimize image dimensions and compression`
    }
  }

  return null
}

function detectFormatIssues(asset: AssetInfo): Recommendation | null {
  const { format, estimatedBytes, type } = asset

  // Skip SVGs
  if (type === 'svg') return null

  // Detect PNG photos that should be JPEG/WebP
  if (format === 'png' && estimatedBytes > 100 * 1024) {
    const potentialSavings = estimatedBytes * 0.6 // 60% savings with JPEG

    return {
      id: `format-${asset.nodeId}`,
      type: 'format',
      priority: potentialSavings > 100 * 1024 ? 'high' : 'medium',
      nodeId: asset.nodeId,
      nodeName: asset.nodeName,
      currentBytes: estimatedBytes,
      potentialSavings,
      description: 'PNG format used for photographic content',
      actionable: 'Convert to JPEG or WebP format (60% smaller)'
    }
  }

  // Suggest WebP for large JPEGs
  if ((format === 'jpeg' || format === 'jpg') && estimatedBytes > 200 * 1024) {
    const potentialSavings = estimatedBytes * 0.3 // 30% savings with WebP

    return {
      id: `format-webp-${asset.nodeId}`,
      type: 'format',
      priority: 'low',
      nodeId: asset.nodeId,
      nodeName: asset.nodeName,
      currentBytes: estimatedBytes,
      potentialSavings,
      description: 'Could use modern WebP format',
      actionable: 'Convert to WebP for better compression (~30% smaller)'
    }
  }

  return null
}

function detectCompressionOpportunities(asset: AssetInfo): Recommendation | null {
  const { estimatedBytes, format, type } = asset

  // Skip if already analyzed for format issues
  if (format === 'png' && estimatedBytes > 100 * 1024) return null

  // SVG optimization
  if (type === 'svg' && estimatedBytes > 50 * 1024) {
    const potentialSavings = estimatedBytes * 0.3

    return {
      id: `svg-compress-${asset.nodeId}`,
      type: 'compression',
      priority: 'low',
      nodeId: asset.nodeId,
      nodeName: asset.nodeName,
      currentBytes: estimatedBytes,
      potentialSavings,
      description: 'SVG could be optimized',
      actionable: 'Run through SVGO or similar optimization tool'
    }
  }

  // General compression for medium images
  if (estimatedBytes > 150 * 1024 && estimatedBytes <= 200 * 1024) {
    const potentialSavings = estimatedBytes * 0.25

    return {
      id: `compress-${asset.nodeId}`,
      type: 'compression',
      priority: 'medium',
      nodeId: asset.nodeId,
      nodeName: asset.nodeName,
      currentBytes: estimatedBytes,
      potentialSavings,
      description: 'Image could benefit from compression',
      actionable: 'Use TinyPNG, ImageOptim, or Squoosh to compress'
    }
  }

  return null
}

function deduplicateAndSort(recommendations: Recommendation[]): Recommendation[] {
  // Deduplicate by ID
  const unique = Array.from(
    new Map(recommendations.map(rec => [rec.id, rec])).values()
  )

  // Sort by priority then savings
  const priorityOrder = { high: 0, medium: 1, low: 2 }

  return unique.sort((a, b) => {
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    return b.potentialSavings - a.potentialSavings
  })
}

export function calculateTotalSavings(recommendations: Recommendation[]): number {
  return recommendations.reduce((total, rec) => total + rec.potentialSavings, 0)
}
