import type { AssetInfo, Breakpoint, BreakpointData } from '../types/analysis'
import { getPixelDensity } from '../utils/formatBytes'
import { getFramerOptimizationSetting } from '../hooks/useSettings'

export function estimateImageBytes(
  asset: AssetInfo,
  breakpoint: Breakpoint,
  includeFramerOptimization?: boolean
): number {
  // Use provided setting or read from localStorage
  const useOptimization = includeFramerOptimization ?? getFramerOptimizationSetting()
  // SVGs are vector-based, not pixel-based - use simple estimation
  if (asset.type === 'svg') {
    // Most Framer SVG icons/elements are very small (1-5 KB)
    // Larger SVGs might be 10-20 KB
    const { width, height } = asset.dimensions

    // Estimate based on complexity (larger display size = more complex usually)
    if (width > 0 && height > 0) {
      const area = width * height
      // Simple heuristic: ~1 byte per 100 square pixels of display area
      // This is very rough but better than pixel-based calculation
      const estimatedBytes = Math.max(1 * 1024, Math.min(area / 100, 30 * 1024))
      return estimatedBytes
    }

    // Default for unknown size SVGs
    return 3 * 1024 // 3 KB default for SVG
  }

  const { width, height } = asset.dimensions

  // Prefer actual dimensions if available (more accurate)
  let effectiveWidth = width
  let effectiveHeight = height

  if (asset.actualDimensions && asset.actualDimensions.width > 0 && asset.actualDimensions.height > 0) {
    effectiveWidth = asset.actualDimensions.width
    effectiveHeight = asset.actualDimensions.height
  }

  // Validate dimensions are valid numbers
  if (!effectiveWidth || !effectiveHeight || !isFinite(effectiveWidth) || !isFinite(effectiveHeight) ||
      isNaN(effectiveWidth) || isNaN(effectiveHeight) || effectiveWidth <= 0 || effectiveHeight <= 0) {
    // Default estimate for unknown size raster images
    return 100 * 1024 // Default 100KB for unknown size
  }

  // Apply pixel density multiplier (for raster images)
  // Note: Framer serves responsive images at appropriate sizes
  // Only apply density multiplier if dimensions seem too small (likely not retina-ready)
  const pixelDensity = getPixelDensity(breakpoint)
  // Only scale up if the image appears to be non-retina (very small dimensions)
  // Most Framer images are already served at appropriate sizes
  const shouldScale = effectiveWidth < 400 && effectiveHeight < 400
  const scaledWidth = shouldScale ? effectiveWidth * pixelDensity : effectiveWidth
  const scaledHeight = shouldScale ? effectiveHeight * pixelDensity : effectiveHeight

  // Calculate raw pixel data (RGBA = 4 bytes per pixel)
  const totalPixels = scaledWidth * scaledHeight
  const rawBytes = totalPixels * 4

  // Apply compression ratio based on format
  const compressionRatio = getCompressionRatio(asset.format || 'unknown', asset.type, useOptimization)

  const estimatedBytes = rawBytes * compressionRatio

  // Validate result
  if (!isFinite(estimatedBytes) || isNaN(estimatedBytes) || estimatedBytes < 0) {
    return 100 * 1024 // Fallback to default
  }

  return estimatedBytes
}

function getCompressionRatio(format: string, type: string, includeFramerOptimization: boolean): number {
  if (type === 'svg') return 0.05 // SVGs are very efficient

  if (includeFramerOptimization) {
    // Framer automatically converts images to WebP/AVIF when publishing
    // Based on real-world testing: Framer's optimization is very aggressive
    // Actual compression is better than initial estimates
    // Fine-tuned based on actual usage data: 210 MB estimate vs 270 MB actual
    // Slightly increased ratios to account for real-world overhead
    const optimizedRatios: Record<string, number> = {
      'jpeg': 0.07,  // Framer serves as WebP/AVIF (~93% compression for photos)
      'jpg': 0.07,   // Framer serves as WebP/AVIF
      'png': 0.09,   // Framer serves as WebP (slightly higher for transparency)
      'webp': 0.07,  // Already WebP, Framer may further optimize
      'avif': 0.06,  // Already AVIF (most efficient)
      'svg': 0.05,   // SVGs are very efficient
      'gif': 0.13,   // Framer may convert animated GIFs
      'unknown': 0.08 // Assume Framer optimization (fine-tuned)
    }
    return optimizedRatios[format] || optimizedRatios.unknown
  } else {
    // Source file sizes without Framer's automatic optimization
    const sourceRatios: Record<string, number> = {
      'jpeg': 0.12,  // Standard JPEG compression (more realistic)
      'jpg': 0.12,
      'png': 0.35,   // PNG is larger (lossless)
      'webp': 0.08,  // WebP is efficient
      'avif': 0.06,  // AVIF is most efficient
      'svg': 0.05,
      'gif': 0.25,   // GIF can be large
      'unknown': 0.25 // More realistic estimate
    }
    return sourceRatios[format] || sourceRatios.unknown
  }
}

export function estimateBaseOverhead(): number {
  // Base HTML structure: ~3KB (Framer generates optimized HTML)
  const baseHTML = 3 * 1024

  // Framer's runtime CSS: ~15KB effective (heavily cached via CDN)
  // First visit may be ~25KB but subsequent visits use cache
  const framerCSS = 15 * 1024

  // Custom CSS from page styles: ~3KB
  const customCSS = 3 * 1024

  // Framer JS runtime: ~20KB effective (heavily cached via CDN)
  // First visit may be ~80KB but subsequent visits use cache
  // Most users have cached Framer runtime from other sites
  const framerRuntime = 20 * 1024

  // Additional overhead: analytics, third-party scripts, API calls
  // These are often present on real sites and add ~5-10KB per page
  const additionalOverhead = 7 * 1024

  return baseHTML + framerCSS + customCSS + framerRuntime + additionalOverhead
}

export function estimateFontWeight(uniqueFontFamilies: number): number {
  // WOFF2 fonts are very efficient (~15-25KB per family)
  // Google Fonts subsets to only used characters
  // Framer caches fonts aggressively - most fonts cached from other sites
  // Effective size per page is lower due to caching
  const bytesPerFont = 20 * 1024

  return uniqueFontFamilies * bytesPerFont
}

export function calculateBreakpointData(
  assets: AssetInfo[],
  breakpoint: Breakpoint
): BreakpointData {
  let totalImages = 0
  let totalSVG = 0

  const calculatedAssets: AssetInfo[] = []

  for (const asset of assets) {
    if (!asset.visible) continue

    const estimatedBytes = estimateImageBytes(asset, breakpoint)
    const calculatedAsset = { ...asset, estimatedBytes }
    calculatedAssets.push(calculatedAsset)

    if (asset.type === 'svg') {
      totalSVG += estimatedBytes
    } else {
      totalImages += estimatedBytes
    }
  }

  const baseOverhead = estimateBaseOverhead()

  // Estimate fonts (assume 2-3 font families on average)
  const fontWeight = estimateFontWeight(2.5)

  const totalBytes = totalImages + totalSVG + baseOverhead + fontWeight

  return {
    totalBytes,
    breakdown: {
      images: totalImages,
      fonts: fontWeight,
      htmlCss: baseOverhead,
      svg: totalSVG
    },
    assets: calculatedAssets
  }
}

