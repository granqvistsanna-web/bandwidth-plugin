/**
 * Asset Collection Service
 *
 * Centralized service for collecting and organizing assets by source and breakpoint.
 * Separates concerns: canvas assets and CMS assets.
 */

import type { AssetInfo, Breakpoint } from '../types/analysis'
import { collectAllAssetsEfficient, collectPageAssets } from './traversal'
import {
  collectCMSAssets,
  convertCMSAssetsToAssetInfo,
  extractCMSAssetsFromPublishedSite,
  extractAssetsFromCMSItems,
  collectCMSItems,
  detectCMSCollections
} from './cmsAssets'
import { getPublishedUrl, analyzePublishedSite } from './publishedAnalysis'
import { debugLog } from '../utils/debugLog'

export interface AssetCollectionResult {
  canvas: {
    desktop: AssetInfo[]
    tablet: AssetInfo[]
    mobile: AssetInfo[]
  }
  cms: AssetInfo[]
  allUnique: AssetInfo[] // Deduplicated across all sources
}

/**
 * Collect all assets organized by source and breakpoint
 */
export async function collectAllAssets(
  excludedPageIds: string[] = []
): Promise<AssetCollectionResult> {
  debugLog.info('📡 Collecting assets for all breakpoints...')

  // Collect canvas assets for each breakpoint separately
  // Parameters: breakpoint, excludeDesignPages, excludeDraftPages, excludedPageIds
  const [desktopCanvas, tabletCanvas, mobileCanvas] = await Promise.all([
    collectAllAssetsEfficient('desktop', true, true, excludedPageIds),
    collectAllAssetsEfficient('tablet', true, true, excludedPageIds),
    collectAllAssetsEfficient('mobile', true, true, excludedPageIds)
  ])

  debugLog.success(`✅ Canvas collection complete: ${desktopCanvas.length} desktop, ${tabletCanvas.length} tablet, ${mobileCanvas.length} mobile`)

  // Collect CMS assets (not breakpoint-specific - CMS assets are the same across breakpoints)
  // Pass desktop canvas URLs for published site comparison
  debugLog.info('📦 Starting CMS asset detection...')

  const canvasImageUrls = new Set(
    desktopCanvas
      .filter(a => a.url)
      .map(a => a.url!)
  )
  const cmsAssets = await collectCMSAssetsWithDeduplication(canvasImageUrls)

  debugLog.success(`📦 CMS detection complete: ${cmsAssets.length} assets found`)

  // Build unique asset map across all sources
  const allAssets = [
    ...desktopCanvas,
    ...tabletCanvas,
    ...mobileCanvas,
    ...cmsAssets
  ]

  const uniqueAssets = deduplicateAssets(allAssets)
  debugLog.success(`✅ Total unique assets: ${uniqueAssets.length}`)

  return {
    canvas: {
      desktop: desktopCanvas,
      tablet: tabletCanvas,
      mobile: mobileCanvas
    },
    cms: cmsAssets,
    allUnique: uniqueAssets
  }
}

/**
 * Collect CMS assets with deduplication logic
 */
async function collectCMSAssetsWithDeduplication(
  canvasImageUrls: Set<string>
): Promise<AssetInfo[]> {
  const cmsAssets: unknown[] = []

  // Method 1: Official CMS API
  try {
    const cmsCollections = await detectCMSCollections()

    if (cmsCollections.length > 0) {
      const cmsItems = await collectCMSItems(cmsCollections)
      const totalItems = cmsItems.reduce((sum, c) => sum + c.items.length, 0)

      if (totalItems > 0) {
        const itemAssets = await extractAssetsFromCMSItems(cmsItems)
        cmsAssets.push(...itemAssets)
        debugLog.success(`✅ Extracted ${itemAssets.length} assets from ${totalItems} CMS items`)
      }
    }
  } catch {
    debugLog.warn('CMS API detection failed, trying heuristic method')
  }

  // Method 2: Heuristic detection (fallback)
  try {
    const heuristicAssets = await collectCMSAssets()
    cmsAssets.push(...heuristicAssets)
  } catch {
    // Heuristic detection failed silently
  }

  // Method 3: Published site analysis (most accurate for CMS-only assets)
  try {
    const publishedUrl = await getPublishedUrl()
    if (publishedUrl) {
      const publishedData = await analyzePublishedSite(publishedUrl)
      const publishedImages = publishedData.resources
        .filter(r => r.type === 'image')
        .map(r => ({ url: r.url, actualBytes: r.actualBytes }))

      const cmsAssetsFromPublished = await extractCMSAssetsFromPublishedSite(
        publishedImages,
        canvasImageUrls
      )

      if (cmsAssetsFromPublished.length > 0) {
        cmsAssets.push(...cmsAssetsFromPublished)
      }
    }
  } catch {
    // Published site analysis failed silently
  }

  return convertCMSAssetsToAssetInfo(cmsAssets)
}

/**
 * Deduplicate assets by URL or nodeId
 */
function deduplicateAssets(assets: AssetInfo[]): AssetInfo[] {
  const uniqueMap = new Map<string, AssetInfo>()
  
  for (const asset of assets) {
    const key = asset.url || asset.nodeId
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, asset)
    }
  }
  
  return Array.from(uniqueMap.values())
}

/**
 * Collect assets for a specific page and breakpoint
 */
export async function collectPageAssetsForBreakpoint(
  pageId: string,
  breakpoint: Breakpoint
): Promise<AssetInfo[]> {
  return collectPageAssets(pageId, breakpoint)
}

