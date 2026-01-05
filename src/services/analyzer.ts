import type { ProjectAnalysis, PageAnalysis, AnalysisMode, Recommendation, AnalysisProgress } from '../types/analysis'
import { getAllPages } from './traversal'
import { calculateBreakpointData } from './bandwidth'
import { generateRecommendations } from './recommendations'
import { getPublishedUrl, analyzePublishedSite } from './publishedAnalysis'
import { calculateCMSBandwidthImpact } from './cmsAssets'
import { collectAllAssets, collectPageAssetsForBreakpoint, type ManualCMSEstimate } from './assetCollector'
import { debugLog } from '../utils/debugLog'
import { formatBytes } from '../utils/formatBytes'
import { handleServiceError, ErrorCode } from '../utils/errorHandler'
import { resolveNodeRoute, clearRoutesCache } from '../utils/assetPageUsage'

/**
 * Enrich a recommendation with proper route info (Site Page, not breakpoint artboard)
 */
async function enrichWithRouteInfo(rec: Recommendation): Promise<Recommendation> {
  // Skip if no nodeId or if it's a grouped recommendation
  if (!rec.nodeId || rec.nodeId === '' || rec.nodeId.startsWith('svg-optimization-grouped')) {
    return rec
  }

  try {
    const result = await resolveNodeRoute(rec.nodeId)

    if (result.found && result.routeInfo) {
      return {
        ...rec,
        pageName: result.routeInfo.route.name,
        pageSlug: result.routeInfo.route.slug,
        breakpoint: result.routeInfo.breakpoint,
        // Keep pageId as-is (WebPageNode ID if we had it)
        isCMSAsset: rec.isCMSAsset || result.routeInfo.isCMSDetailPage
      }
    }
  } catch (error) {
    // Silently fail - keep original page info
    debugLog.warn(`Failed to resolve route for node ${rec.nodeId}:`, error)
  }

  return rec
}

export async function analyzeProject(
  mode: AnalysisMode = 'canvas',
  excludedPageIds: string[] = [],
  manualCMSEstimates: ManualCMSEstimate[] = [],
  onProgress?: (progress: AnalysisProgress) => void
): Promise<ProjectAnalysis> {
  try {
    debugLog.info('🚀 Starting project analysis...')

    // Report progress: Finding pages
    onProgress?.({ step: 'pages', message: 'Finding pages...' })

    // Clear caches at the start of analysis
    const { clearPagesCache } = await import('./traversal')
    clearPagesCache()
    clearRoutesCache() // Clear routes cache for fresh route resolution

    const allPages = await getAllPages(true) // Exclude design pages by default
    
    // Filter out user-excluded pages
    const pages = allPages.filter(page => !excludedPageIds.includes(page.id))
    
    if (excludedPageIds.length > 0) {
      debugLog.info(`Excluded ${excludedPageIds.length} user-selected page(s) from analysis`)
    }
    
    debugLog.success(`Found ${pages.length} pages`, pages.map(p => p.name || p.id))

    if (!pages || !Array.isArray(pages)) {
      debugLog.error('Pages is not an array:', pages)
      throw new Error('Could not load pages from Framer project')
    }

    if (pages.length === 0) {
      debugLog.error('No pages found in project')
      throw new Error('No pages found in project. Try creating a page first.')
    }

    // Report progress: Collecting assets
    onProgress?.({ step: 'assets', message: `Collecting assets from ${pages.length} pages...` })

    // Collect all assets organized by source and breakpoint
    const assetCollection = await collectAllAssets(excludedPageIds, manualCMSEstimates)
    
    const { canvas, cms, manual } = assetCollection

    debugLog.success(`✅ Collected assets: ${canvas.desktop.length} desktop, ${canvas.tablet.length} tablet, ${canvas.mobile.length} mobile canvas assets`)
    debugLog.success(`✅ CMS assets: ${cms.length}, Manual estimates: ${manual.length}`)

    // Report progress: Calculating bandwidth
    const totalAssets = canvas.desktop.length + cms.length + manual.length
    onProgress?.({ step: 'bandwidth', message: `Calculating bandwidth for ${totalAssets} assets...` })

    // Calculate bandwidth for each breakpoint using breakpoint-specific assets
    // CRITICAL: Each breakpoint must use its own assets + CMS + manual (CMS/manual are same across breakpoints)
    debugLog.info('💰 Calculating bandwidth estimates for each breakpoint...')
    const overallDesktop = calculateBreakpointData([...canvas.desktop, ...cms, ...manual], 'desktop')
    const overallTablet = calculateBreakpointData([...canvas.tablet, ...cms, ...manual], 'tablet')
    const overallMobile = calculateBreakpointData([...canvas.mobile, ...cms, ...manual], 'mobile')

    debugLog.success(`Total bandwidth: ${(overallDesktop.totalBytes / 1024 / 1024).toFixed(2)} MB`)

    // Report progress: Generating recommendations
    onProgress?.({ step: 'recommendations', message: 'Generating optimization recommendations...' })

    // Generate recommendations based on desktop (typically largest)
    // Note: Overall recommendations don't have page context since they aggregate all pages
    // We'll merge page-specific recommendations later to get page info
    debugLog.info('🎯 Generating optimization recommendations...')
    const overallRecommendations = generateRecommendations(overallDesktop)
    debugLog.success(`Generated ${overallRecommendations.length} overall recommendations`)

    // Analyze each page individually (only non-excluded pages)
    debugLog.info('📄 Analyzing individual pages...')
    const pageAnalyses: PageAnalysis[] = await Promise.all(
      pages.map(async (page) => {
        try {
          debugLog.info(`Analyzing page: ${page.name || page.id}`)
          
          // Collect assets for this specific page for each breakpoint
          const [pageDesktopAssets, pageTabletAssets, pageMobileAssets] = await Promise.all([
            collectPageAssetsForBreakpoint(page.id, 'desktop'),
            collectPageAssetsForBreakpoint(page.id, 'tablet'),
            collectPageAssetsForBreakpoint(page.id, 'mobile')
          ])
          
          // Calculate bandwidth for this page using breakpoint-specific assets
          // Note: Page-level analysis doesn't include CMS assets (they're project-wide)
          const pageDesktop = calculateBreakpointData(pageDesktopAssets, 'desktop')
          const pageTablet = calculateBreakpointData(pageTabletAssets, 'tablet')
          const pageMobile = calculateBreakpointData(pageMobileAssets, 'mobile')
          
          // Generate recommendations for this page with page context
          // Try to get page slug from publish info
          let pageSlug: string | undefined
          try {
            const publishInfo = await framer.getPublishInfo()
            if (publishInfo && publishInfo.currentPageUrl) {
              try {
                const urlObj = new URL(publishInfo.currentPageUrl)
                pageSlug = urlObj.pathname
                if (pageSlug.startsWith('/')) {
                  pageSlug = pageSlug.substring(1)
                }
              } catch {
                pageSlug = page.name || 'Unnamed Page'
              }
            } else {
              pageSlug = page.name || 'Unnamed Page'
            }
          } catch {
            pageSlug = page.name || 'Unnamed Page'
          }
          const pageRecommendations = generateRecommendations(pageDesktop, page.id, page.name || 'Unnamed Page', pageSlug)
          
          debugLog.success(`Page ${page.name || page.id}: ${pageDesktopAssets.length} assets, ${pageRecommendations.length} recommendations`)
          
          return {
            pageId: page.id,
            pageName: page.name || 'Unnamed Page',
            breakpoints: {
              mobile: pageMobile,
              tablet: pageTablet,
              desktop: pageDesktop
            },
            totalAssets: pageDesktopAssets.length,
            recommendations: pageRecommendations
          }
        } catch (error) {
          debugLog.error(`Error analyzing page ${page.name || page.id}`, error)
          // Fall back to overall data if page analysis fails
          return {
            pageId: page.id,
            pageName: page.name || 'Unnamed Page',
            breakpoints: {
              mobile: overallMobile,
              tablet: overallTablet,
              desktop: overallDesktop
            },
            totalAssets: overallDesktop.assets.length,
            recommendations: []
          }
        }
      })
    )

    // Merge all page-specific recommendations into overall list
    // This ensures we have page info for recommendations and they're ranked globally
    const pageRecommendations = pageAnalyses.flatMap(page => page.recommendations)

    // Create a map of recommendations by nodeId to deduplicate
    // IMPORTANT: Use nodeId (not rec.id) to ensure same asset doesn't have multiple recommendations
    // This prevents double-counting when same image appears on multiple pages
    const recommendationMap = new Map<string, Recommendation>()

    // Track which pages use each asset (by URL for cross-page tracking)
    const urlToPages = new Map<string, { pageId: string; pageName: string }[]>()

    // First pass: collect all page info for each URL
    for (const rec of pageRecommendations) {
      if (rec.url && rec.pageId && rec.pageName) {
        const pages = urlToPages.get(rec.url) || []
        // Only add if not already in the list
        if (!pages.some(p => p.pageId === rec.pageId)) {
          pages.push({ pageId: rec.pageId, pageName: rec.pageName })
        }
        urlToPages.set(rec.url, pages)
      }
    }

    // Second pass: add page-specific recommendations with usedInPages populated
    for (const rec of pageRecommendations) {
      const key = rec.nodeId || rec.id
      const existing = recommendationMap.get(key)

      // Get all pages where this URL is used
      const pagesForUrl = rec.url ? urlToPages.get(rec.url) : undefined
      const usedInPages = pagesForUrl && pagesForUrl.length > 0 ? pagesForUrl :
                          (rec.pageId && rec.pageName ? [{ pageId: rec.pageId, pageName: rec.pageName }] : undefined)

      // Keep the recommendation with higher potential savings, but merge page info
      if (!existing || rec.potentialSavings > existing.potentialSavings) {
        recommendationMap.set(key, { ...rec, usedInPages })
      } else if (existing && usedInPages) {
        // Merge page info if we have more pages
        const existingPages = existing.usedInPages || []
        const mergedPages = [...existingPages]
        for (const page of usedInPages) {
          if (!mergedPages.some(p => p.pageId === page.pageId)) {
            mergedPages.push(page)
          }
        }
        if (mergedPages.length > existingPages.length) {
          recommendationMap.set(key, { ...existing, usedInPages: mergedPages })
        }
      }
    }

    // Then, add overall recommendations only if they don't already exist
    // This ensures we don't lose recommendations that weren't found in page-specific analysis
    for (const rec of overallRecommendations) {
      const key = rec.nodeId || rec.id
      if (!recommendationMap.has(key)) {
        // Try to get page info from URL mapping
        const pagesForUrl = rec.url ? urlToPages.get(rec.url) : undefined
        const usedInPages = pagesForUrl && pagesForUrl.length > 0 ? pagesForUrl :
                            (rec.pageId && rec.pageName ? [{ pageId: rec.pageId, pageName: rec.pageName }] : undefined)
        recommendationMap.set(key, { ...rec, usedInPages })
      }
    }
    
    // Convert back to array and sort globally by impact (stable sort)
    const sortedRecommendations = Array.from(recommendationMap.values())
      .sort((a, b) => {
        // Primary sort: by potential savings (descending)
        if (b.potentialSavings !== a.potentialSavings) {
          return b.potentialSavings - a.potentialSavings
        }
        // Secondary sort: by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) {
          return priorityDiff
        }
        // Tertiary sort: by node name (alphabetical) for stable ordering
        const nameA = a.nodeName || ''
        const nameB = b.nodeName || ''
        if (nameA !== nameB) {
          return nameA.localeCompare(nameB)
        }
        // Final sort: by node ID for complete stability
        return (a.nodeId || a.id).localeCompare(b.nodeId || b.id)
      })

    // Enrich recommendations with proper route info (Site Page, not breakpoint artboard)
    // This uses WebPageNode.path to get the actual route slug like /about, /services
    debugLog.info('🔗 Enriching recommendations with route info...')
    const allRecommendations = await Promise.all(
      sortedRecommendations.map(rec => enrichWithRouteInfo(rec))
    )
    debugLog.success(`✅ Enriched ${allRecommendations.length} recommendations with route info`)

    // Calculate CMS asset statistics
    const allCMSAssets = [...cms, ...manual]
    const cmsAssetsBytes = allCMSAssets.reduce((sum, asset) => sum + asset.estimatedBytes, 0)
    const hasManualCMSEstimates = manual.length > 0
    const cmsAssetsNotFound = allCMSAssets.filter(a =>
      (a as { cmsStatus?: string }).cmsStatus === 'not_found'
    ).length
    
    // Debug: Log CMS asset count
    debugLog.info(`📊 CMS Assets Summary:`)
    debugLog.info(`   - Total CMS assets: ${allCMSAssets.length}`)
    debugLog.info(`   - Auto-detected: ${cms.length}`)
    debugLog.info(`   - Manual estimates: ${manual.length}`)
    debugLog.info(`   - Total CMS bytes: ${formatBytes(cmsAssetsBytes)}`)
    if (allCMSAssets.length === 0) {
      debugLog.warn(`⚠️ No CMS assets detected! This could mean:`)
      debugLog.warn(`   1. Site is not published (CMS assets only detected from published sites)`)
      debugLog.warn(`   2. All images are also in canvas (not detected as CMS)`)
      debugLog.warn(`   3. Component controls don't contain image data`)
      debugLog.warn(`   💡 Try: Publish your site or add manual CMS estimates`)
    }
    
    // Calculate CMS bandwidth impact (combine all CMS assets including manual estimates)
    const allCMSAssetsForImpact = [
      ...cms.map((asset, idx) => ({
        id: asset.nodeId || `cms-${idx}`,
        collectionId: asset.cmsCollectionName?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
        collectionName: asset.cmsCollectionName || 'Unknown',
        estimatedBytes: asset.estimatedBytes,
        estimatedDimensions: asset.dimensions,
        format: asset.format || 'unknown',
        isManualEstimate: false,
        status: 'found' as const
      })),
      ...manual.map((est, idx) => ({
        id: `manual-${est.nodeId}-${idx}`,
        collectionId: est.cmsCollectionName?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
        collectionName: est.cmsCollectionName || 'Unknown',
        estimatedBytes: est.estimatedBytes,
        estimatedDimensions: est.dimensions,
        format: est.format || 'unknown',
        isManualEstimate: true,
        status: 'estimated' as const
      }))
    ]
    const cmsBandwidthImpact = allCMSAssetsForImpact.length > 0 
      ? calculateCMSBandwidthImpact(allCMSAssetsForImpact)
      : undefined

    const result: ProjectAnalysis = {
      mode,
      pages: pageAnalyses,
      totalPages: pages.length,
      overallBreakpoints: {
        mobile: overallMobile,
        tablet: overallTablet,
        desktop: overallDesktop
      },
      allRecommendations,
      cmsAssetsCount: allCMSAssets.length,
      cmsAssetsBytes,
      hasManualCMSEstimates,
      cmsBandwidthImpact,
      cmsAssetsNotFound
    }

    // If published mode, also fetch published site data
    if (mode === 'published') {
      const publishedUrl = await getPublishedUrl()

      if (publishedUrl) {
        debugLog.info('Fetching published site data from:', publishedUrl)
        try {
          const publishedData = await analyzePublishedSite(publishedUrl)
          result.publishedUrl = publishedUrl
          result.publishedData = {
            totalBytes: publishedData.totalBytes,
            breakdown: publishedData.breakdown,
            customCode: publishedData.customCode ? {
              assets: publishedData.customCode.assets,
              totalEstimatedBytes: publishedData.customCode.totalEstimatedBytes,
              hasCustomCode: publishedData.customCode.hasCustomCode,
              warnings: publishedData.customCode.warnings
            } : undefined
          }
        } catch (error) {
          handleServiceError(error, 'analyzeProject.publishedSite', {
            notifyUser: false,
            logLevel: 'warn',
            code: ErrorCode.NETWORK_ERROR
          })
          // Fall back to canvas analysis
        }
      } else {
        debugLog.warn('Site is not published, falling back to canvas analysis')
      }
    }

    return result
  } catch (error) {
    debugLog.error('Error analyzing project:', error)
    throw error
  }
}

