import type { AssetInfo, Breakpoint, BreakpointData } from '../types/analysis'
import { getPixelDensity } from '../utils/formatBytes'

export function estimateImageBytes(
  asset: AssetInfo,
  breakpoint: Breakpoint
): number {
  const { width, height } = asset.dimensions

  // Apply pixel density multiplier
  const pixelDensity = getPixelDensity(breakpoint)
  const effectiveWidth = width * pixelDensity
  const effectiveHeight = height * pixelDensity

  // Calculate raw pixel data (RGBA = 4 bytes per pixel)
  const totalPixels = effectiveWidth * effectiveHeight
  const rawBytes = totalPixels * 4

  // Apply compression ratio based on format
  const compressionRatio = getCompressionRatio(asset.format || 'unknown', asset.type)

  return rawBytes * compressionRatio
}

function getCompressionRatio(format: string, type: string): number {
  if (type === 'svg') return 0.05 // SVGs are very efficient

  const ratios: Record<string, number> = {
    'jpeg': 0.15,  // ~85% compression (quality 80)
    'jpg': 0.15,
    'png': 0.40,   // ~60% compression
    'webp': 0.10,  // ~90% compression
    'svg': 0.05,   // Very efficient for vectors
    'gif': 0.30,
    'unknown': 0.30 // Conservative estimate
  }

  return ratios[format] || ratios.unknown
}

export function estimateBaseOverhead(): number {
  // Base HTML structure: ~10KB
  const baseHTML = 10 * 1024

  // Framer's runtime CSS: ~40KB (estimated)
  const framerCSS = 40 * 1024

  // Custom CSS from page styles: ~5-10KB
  const customCSS = 10 * 1024

  // Framer JS runtime: ~100KB (but often cached, so count 50%)
  const framerRuntime = 50 * 1024

  return baseHTML + framerCSS + customCSS + framerRuntime
}

export function estimateFontWeight(uniqueFontFamilies: number): number {
  // Average web font file size: ~100KB per family (with variants)
  const bytesPerFont = 100 * 1024

  // Google Fonts uses WOFF2 format which is efficient
  // Also typically includes subset
  return uniqueFontFamilies * bytesPerFont * 0.6
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
