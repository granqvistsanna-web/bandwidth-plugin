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
  const pixelDensity = getPixelDensity(breakpoint)
  const scaledWidth = effectiveWidth * pixelDensity
  const scaledHeight = effectiveHeight * pixelDensity

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
    // Use WebP-equivalent compression ratios for realistic estimates
    const optimizedRatios: Record<string, number> = {
      'jpeg': 0.10,  // Framer serves as WebP (~90% compression)
      'jpg': 0.10,   // Framer serves as WebP
      'png': 0.12,   // Framer serves as WebP (slightly higher for transparency)
      'webp': 0.10,  // Already WebP
      'avif': 0.08,  // Already AVIF (most efficient)
      'svg': 0.05,   // SVGs are very efficient
      'gif': 0.15,   // Framer may convert animated GIFs
      'unknown': 0.12 // Assume Framer optimization
    }
    return optimizedRatios[format] || optimizedRatios.unknown
  } else {
    // Source file sizes without Framer's automatic optimization
    const sourceRatios: Record<string, number> = {
      'jpeg': 0.15,  // Standard JPEG compression
      'jpg': 0.15,
      'png': 0.40,   // PNG is larger (lossless)
      'webp': 0.10,  // WebP is efficient
      'avif': 0.08,  // AVIF is most efficient
      'svg': 0.05,
      'gif': 0.30,   // GIF can be large
      'unknown': 0.30 // Conservative estimate
    }
    return sourceRatios[format] || sourceRatios.unknown
  }
}

export function estimateBaseOverhead(): number {
  // Base HTML structure: ~5KB (Framer generates optimized HTML)
  const baseHTML = 5 * 1024

  // Framer's runtime CSS: ~25KB (compressed, cached)
  const framerCSS = 25 * 1024

  // Custom CSS from page styles: ~5KB
  const customCSS = 5 * 1024

  // Framer JS runtime: ~30KB effective (heavily cached via CDN)
  // First visit may be ~100KB but subsequent visits use cache
  const framerRuntime = 30 * 1024

  return baseHTML + framerCSS + customCSS + framerRuntime
}

export function estimateFontWeight(uniqueFontFamilies: number): number {
  // WOFF2 fonts are very efficient (~20-40KB per family)
  // Google Fonts subsets to only used characters
  // Framer caches fonts aggressively
  const bytesPerFont = 30 * 1024

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

export function aggregateBreakpointData(
  breakpointDataArray: BreakpointData[]
): BreakpointData {
  let totalImages = 0
  let totalFonts = 0
  let totalHtmlCss = 0
  let totalSVG = 0
  const allAssets: AssetInfo[] = []

  for (const data of breakpointDataArray) {
    totalImages += data.breakdown.images
    totalFonts += data.breakdown.fonts
    totalHtmlCss += data.breakdown.htmlCss
    totalSVG += data.breakdown.svg
    allAssets.push(...data.assets)
  }

  // Deduplicate assets by nodeId
  const uniqueAssets = Array.from(
    new Map(allAssets.map(asset => [asset.nodeId, asset])).values()
  )

  return {
    totalBytes: totalImages + totalFonts + totalHtmlCss + totalSVG,
    breakdown: {
      images: totalImages,
      fonts: totalFonts,
      htmlCss: totalHtmlCss,
      svg: totalSVG
    },
    assets: uniqueAssets
  }
}
