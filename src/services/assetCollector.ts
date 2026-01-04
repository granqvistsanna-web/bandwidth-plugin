/**
 * Asset Collection Service
 * 
 * Centralized service for collecting and organizing assets by source and breakpoint.
 * Separates concerns: canvas assets, CMS assets, and manual estimates.
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
  manual: AssetInfo[]
  allUnique: AssetInfo[] // Deduplicated across all sources
}

export interface ManualCMSEstimate {
  id: string
  collectionName: string
  imageCount: number
  avgWidth: number
  avgHeight: number
  format: string
  estimatedBytes: number
  createdAt?: string
}

/**
 * Collect all assets organized by source and breakpoint
 */
export async function collectAllAssets(
  excludedPageIds: string[] = [],
  manualCMSEstimates: ManualCMSEstimate[] = []
): Promise<AssetCollectionResult> {
  debugLog.info('📡 Collecting assets for all breakpoints...')

  // Collect canvas assets for each breakpoint separately
  const [desktopCanvas, tabletCanvas, mobileCanvas] = await Promise.all([
    collectAllAssetsEfficient('desktop', true, excludedPageIds),
    collectAllAssetsEfficient('tablet', true, excludedPageIds),
    collectAllAssetsEfficient('mobile', true, excludedPageIds)
  ])

  debugLog.info(`Collected ${desktopCanvas.length} desktop, ${tabletCanvas.length} tablet, ${mobileCanvas.length} mobile canvas assets`)

  // Collect CMS assets (not breakpoint-specific - CMS assets are the same across breakpoints)
  // Pass desktop canvas URLs for published site comparison
  const canvasImageUrls = new Set(
    desktopCanvas
      .filter(a => a.url)
      .map(a => a.url!)
  )
  const cmsAssets = await collectCMSAssetsWithDeduplication(manualCMSEstimates, canvasImageUrls)

  // Convert manual estimates to AssetInfo
  const manualAssets = convertManualEstimatesToAssets(manualCMSEstimates, cmsAssets.autoDetectedCollections)

  // Build unique asset map across all sources
  const allAssets = [
    ...desktopCanvas,
    ...tabletCanvas,
    ...mobileCanvas,
    ...cmsAssets.assets,
    ...manualAssets
  ]

  const uniqueAssets = deduplicateAssets(allAssets)
  debugLog.success(`✅ Total unique assets: ${uniqueAssets.length}`)

  return {
    canvas: {
      desktop: desktopCanvas,
      tablet: tabletCanvas,
      mobile: mobileCanvas
    },
    cms: cmsAssets.assets,
    manual: manualAssets,
    allUnique: uniqueAssets
  }
}

/**
 * Collect CMS assets with deduplication logic
 */
async function collectCMSAssetsWithDeduplication(
  manualCMSEstimates: ManualCMSEstimate[],
  canvasImageUrls: Set<string>
): Promise<{ assets: AssetInfo[], autoDetectedCollections: Set<string> }> {
  const cmsAssets: unknown[] = []
  const autoDetectedCollections = new Set<string>()

  // Method 1: Official CMS API
  try {
    debugLog.info('📦 Detecting CMS collections using official Framer API...')
    const cmsCollections = await detectCMSCollections()
    debugLog.info(`Found ${cmsCollections.length} CMS collections`)

    if (cmsCollections.length > 0) {
      const cmsItems = await collectCMSItems(cmsCollections)
      const totalItems = cmsItems.reduce((sum, c) => sum + c.items.length, 0)
      
      if (totalItems > 0) {
        const itemAssets = await extractAssetsFromCMSItems(cmsItems)
        cmsAssets.push(...itemAssets)
        debugLog.success(`✅ Extracted ${itemAssets.length} assets from ${totalItems} CMS items`)
      }
    }
  } catch (error) {
    debugLog.warn('Error using official CMS API:', error)
  }

  // Method 2: Heuristic detection
  try {
    debugLog.info('📦 Collecting CMS assets using heuristic detection...')
    const heuristicAssets = await collectCMSAssets()
    cmsAssets.push(...heuristicAssets)
  } catch (error) {
    debugLog.warn('Error in heuristic CMS detection:', error)
  }

  // Method 3: Published site analysis (most accurate)
  try {
    const publishedUrl = await getPublishedUrl()
    if (publishedUrl) {
      debugLog.info('🌐 Extracting CMS assets from published site...')
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
        debugLog.success(`✅ Extracted ${cmsAssetsFromPublished.length} CMS assets from published site`)
      }
    }
  } catch (error) {
    debugLog.warn('Could not extract CMS assets from published site:', error)
  }

  const cmsAssetInfos = convertCMSAssetsToAssetInfo(cmsAssets)

  // Track auto-detected collections to prevent duplicate manual estimates
  for (const asset of cmsAssetInfos) {
    if (asset.cmsCollectionName) {
      autoDetectedCollections.add(asset.cmsCollectionName)
    }
  }

  return {
    assets: cmsAssetInfos,
    autoDetectedCollections
  }
}

/**
 * Convert manual CMS estimates to AssetInfo, filtering out duplicates
 */
function convertManualEstimatesToAssets(
  estimates: ManualCMSEstimate[],
  autoDetectedCollections: Set<string>
): AssetInfo[] {
  return estimates
    .filter(estimate => {
      const isDuplicate = estimate.collectionName && autoDetectedCollections.has(estimate.collectionName)
      if (isDuplicate) {
        debugLog.info(`⚠️ Skipping manual estimate for "${estimate.collectionName}" - already auto-detected`)
      }
      return !isDuplicate
    })
    .map((estimate, index) => ({
      nodeId: `manual-cms-${estimate.id}-${index}`,
      nodeName: `CMS (Manual): ${estimate.collectionName}`,
      type: 'image' as const,
      estimatedBytes: estimate.estimatedBytes,
      dimensions: { width: estimate.avgWidth, height: estimate.avgHeight },
      format: estimate.format,
      visible: true,
      isCMSAsset: true,
      isManualEstimate: true,
      manualEstimateNote: `${estimate.imageCount} images estimated`,
      cmsCollectionName: estimate.collectionName
    }))
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

