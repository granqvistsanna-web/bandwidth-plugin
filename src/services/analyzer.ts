import type { ProjectAnalysis, PageAnalysis, AnalysisMode, Recommendation } from '../types/analysis'
import { getAllPages, collectAllAssetsEfficient, collectPageAssets } from './traversal'
import { calculateBreakpointData } from './bandwidth'
import { generateRecommendations } from './recommendations'
import { getPublishedUrl, analyzePublishedSite } from './publishedAnalysis'
import { 
  collectCMSAssets, 
  convertCMSAssetsToAssetInfo, 
  extractCMSAssetsFromPublishedSite,
  extractAssetsFromCMSItems,
  collectCMSItems,
  detectCMSCollections,
  calculateCMSBandwidthImpact
} from './cmsAssets'
import { debugLog } from '../utils/debugLog'
import { formatBytes } from '../utils/formatBytes'

export async function analyzeProject(
  mode: AnalysisMode = 'canvas', 
  excludedPageIds: string[] = [],
  manualCMSEstimates: Array<{
    id: string
    collectionName: string
    imageCount: number
    avgWidth: number
    avgHeight: number
    format: string
    estimatedBytes: number
  }> = []
): Promise<ProjectAnalysis> {
  try {
    debugLog.info('🚀 Starting project analysis...')
    // Clear pages cache at the start of analysis
    const { clearPagesCache } = await import('./traversal')
    clearPagesCache()
    
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

    // Use efficient collection for overall project analysis
    debugLog.info('📡 Collecting assets using efficient API (getNodesWithAttributeSet)...')
    const canvasAssets = await collectAllAssetsEfficient('desktop', true, excludedPageIds) // Exclude design pages and user-excluded pages

        // Collect CMS assets using official Framer CMS API
        debugLog.info('📦 Detecting CMS collections using official Framer API...')
        const cmsCollections = await detectCMSCollections()
        debugLog.info(`Found ${cmsCollections.length} CMS collections:`, cmsCollections.map(c => c.name))

        // Try to collect CMS items and extract assets from them using official API
        let cmsAssets: any[] = []
        if (cmsCollections.length > 0) {
          debugLog.info('📦 Collecting CMS items and extracting assets from fieldData...')
          const cmsItems = await collectCMSItems(cmsCollections)
          const totalItems = cmsItems.reduce((sum, c) => sum + c.items.length, 0)
          
          if (totalItems > 0) {
            const itemAssets = await extractAssetsFromCMSItems(cmsItems)
            cmsAssets.push(...itemAssets)
            debugLog.success(`✅ Extracted ${itemAssets.length} assets from ${totalItems} CMS items using official API`)
          } else {
            debugLog.warn('⚠️ No CMS items found in collections')
          }
        } else {
          debugLog.warn('⚠️ No CMS collections detected. Make sure your site has CMS collections set up.')
        }
    
    // Also try heuristic detection
    debugLog.info('📦 Collecting CMS assets using heuristic detection...')
    const heuristicAssets = await collectCMSAssets()
    cmsAssets.push(...heuristicAssets)
    
    const cmsAssetInfos = convertCMSAssetsToAssetInfo(cmsAssets)
    
    // Add manual CMS estimates
    const manualCMSEstimatesInfos: AssetInfo[] = manualCMSEstimates.map((estimate, index) => ({
      nodeId: `manual-cms-${estimate.id}-${index}`,
      nodeName: `CMS (Manual): ${estimate.collectionName}`,
      type: 'image' as const, // Changed from 'background' to 'image' for consistency
      estimatedBytes: estimate.estimatedBytes,
      dimensions: { width: estimate.avgWidth, height: estimate.avgHeight },
      format: estimate.format,
      visible: true,
      isCMSAsset: true,
      isManualEstimate: true,
      manualEstimateNote: `${estimate.imageCount} images estimated`,
      cmsCollectionName: estimate.collectionName
    }))
    
    // Combine canvas, detected CMS, and manual CMS assets
    let desktopAssets = [...canvasAssets, ...cmsAssetInfos, ...manualCMSEstimatesInfos]
    let publishedCMSCount = 0 // Initialize for debug summary
    
    // Try to extract CMS assets from published site (more accurate)
    try {
      debugLog.info('🌐 Checking if site is published...')
      const publishedUrl = await getPublishedUrl()
      
      if (publishedUrl) {
        debugLog.info('🌐 Extracting CMS assets from published site...')
        debugLog.info(`Published URL: ${publishedUrl}`)
        
        const publishedData = await analyzePublishedSite(publishedUrl)
        debugLog.info(`Published site analysis found ${publishedData.resources.length} total resources`)
        
        const publishedImages = publishedData.resources
          .filter(r => r.type === 'image')
          .map(r => ({ url: r.url, actualBytes: r.actualBytes }))
        
        debugLog.info(`Found ${publishedImages.length} images in published site`)
        
        // Get all canvas image URLs for comparison
        const canvasImageUrls = new Set(
          canvasAssets
            .filter(a => a.url)
            .map(a => a.url!)
        )
        
        debugLog.info(`Comparing with ${canvasImageUrls.size} canvas image URLs`)
        
        // Extract CMS assets (images in published site but not in canvas)
        const cmsAssetsFromPublished = await extractCMSAssetsFromPublishedSite(
          publishedImages,
          canvasImageUrls
        )
        
        if (cmsAssetsFromPublished.length > 0) {
          publishedCMSCount = cmsAssetsFromPublished.length
          const cmsAssetInfosFromPublished = convertCMSAssetsToAssetInfo(cmsAssetsFromPublished)
          // Merge published CMS assets with previously detected CMS assets (avoid duplicates)
          // Combine all CMS assets, then deduplicate by URL
          const allCMSAssetInfos = [...cmsAssetInfos, ...cmsAssetInfosFromPublished]
          const uniqueCMSAssets = new Map<string, AssetInfo>()
          for (const asset of allCMSAssetInfos) {
            const key = asset.url || asset.nodeId
            if (!uniqueCMSAssets.has(key)) {
              uniqueCMSAssets.set(key, asset)
            }
          }
          desktopAssets = [...canvasAssets, ...Array.from(uniqueCMSAssets.values()), ...manualCMSEstimatesInfos]
          debugLog.success(`✅ Extracted ${cmsAssetsFromPublished.length} CMS assets from published site`)
          debugLog.info('📦 CMS Assets from published site:', cmsAssetInfosFromPublished.map(a => ({
            name: a.nodeName,
            bytes: a.estimatedBytes,
            url: a.url?.substring(0, 60)
          })))
        } else {
          debugLog.info('No CMS assets found in published site (all images are in canvas)')
        }
      } else {
        debugLog.info('ℹ️ Site is not published. CMS assets can only be detected from published sites.')
        debugLog.info('💡 Tip: Publish your site to automatically detect CMS assets, or add manual estimates.')
      }
    } catch (error) {
      debugLog.warn('Could not extract CMS assets from published site:', error)
      debugLog.info('💡 This might mean the site is not published or there was a network error.')
      // Continue with canvas analysis only
    }

    debugLog.success(`✅ Collected ${canvasAssets.length} canvas assets`)
    if (cmsAssetInfos.length > 0) {
      debugLog.success(`✅ Found ${cmsAssetInfos.length} CMS assets from canvas detection`)
    } else {
      debugLog.info('ℹ️ No CMS assets detected from canvas (this is normal if site is published - CMS assets will be detected from published site)')
    }
    debugLog.success(`Total assets: ${desktopAssets.length}`)

    if (desktopAssets.length > 0) {
      debugLog.info('Sample assets:', desktopAssets.slice(0, 3).map(a => ({
        name: a.nodeName,
        type: a.type,
        format: a.format,
        dimensions: `${a.dimensions.width}x${a.dimensions.height}`,
        url: a.url?.substring(0, 50)
      })))
    } else {
      debugLog.warn('⚠️ No assets found! This might indicate an issue with image detection.')
    }

    // Calculate bandwidth for desktop (simplified for MVP)
    debugLog.info('💰 Calculating bandwidth estimates...')
    const overallDesktop = calculateBreakpointData(desktopAssets, 'desktop')
    const overallMobile = calculateBreakpointData(desktopAssets, 'mobile')
    const overallTablet = calculateBreakpointData(desktopAssets, 'tablet')

    debugLog.success(`Total bandwidth: ${(overallDesktop.totalBytes / 1024 / 1024).toFixed(2)} MB`)

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
          
          // Collect assets for this specific page
          const pageDesktopAssets = await collectPageAssets(page.id, 'desktop')
          
          // Calculate bandwidth for this page
          const pageDesktop = calculateBreakpointData(pageDesktopAssets, 'desktop')
          const pageMobile = calculateBreakpointData(pageDesktopAssets, 'mobile')
          const pageTablet = calculateBreakpointData(pageDesktopAssets, 'tablet')
          
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
            totalAssets: desktopAssets.length,
            recommendations: []
          }
        }
      })
    )

    // Merge all page-specific recommendations into overall list
    // This ensures we have page info for recommendations and they're ranked globally
    const pageRecommendations = pageAnalyses.flatMap(page => page.recommendations)
    
    // Create a map of recommendations by nodeId to deduplicate
    // Prefer page-specific recommendations (with page info) over overall ones
    const recommendationMap = new Map<string, Recommendation>()
    
    // First, add all page-specific recommendations (they have page info)
    for (const rec of pageRecommendations) {
      if (rec.nodeId) {
        recommendationMap.set(rec.nodeId, rec)
      } else {
        // For recommendations without nodeId (like grouped SVGs), use the ID
        recommendationMap.set(rec.id, rec)
      }
    }
    
    // Then, add overall recommendations only if they don't already exist
    // This ensures we don't lose recommendations that weren't found in page-specific analysis
    for (const rec of overallRecommendations) {
      const key = rec.nodeId || rec.id
      if (!recommendationMap.has(key)) {
        recommendationMap.set(key, rec)
      }
    }
    
    // Convert back to array and sort globally by impact (stable sort)
    const allRecommendations = Array.from(recommendationMap.values())
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

    // Calculate CMS asset statistics
    const cmsAssetsInAnalysis = desktopAssets.filter(a => a.isCMSAsset)
    const cmsAssetsBytes = cmsAssetsInAnalysis.reduce((sum, asset) => sum + asset.estimatedBytes, 0)
    const hasManualCMSEstimates = cmsAssetsInAnalysis.some(a => a.isManualEstimate)
    const cmsAssetsNotFound = cmsAssetsInAnalysis.filter(a => 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a as any).cmsStatus === 'not_found'
    ).length
    
    // Debug: Log CMS asset count
    debugLog.info(`📊 CMS Assets Summary:`)
    debugLog.info(`   - Total CMS assets in analysis: ${cmsAssetsInAnalysis.length}`)
    debugLog.info(`   - From canvas detection: ${cmsAssetInfos.length}`)
    debugLog.info(`   - From published site: ${publishedCMSCount || 0}`)
    debugLog.info(`   - Manual estimates: ${manualCMSEstimates.length}`)
    debugLog.info(`   - Total CMS bytes: ${formatBytes(cmsAssetsBytes)}`)
    if (cmsAssetsInAnalysis.length === 0) {
      debugLog.warn(`⚠️ No CMS assets detected! This could mean:`)
      debugLog.warn(`   1. Site is not published (CMS assets only detected from published sites)`)
      debugLog.warn(`   2. All images are also in canvas (not detected as CMS)`)
      debugLog.warn(`   3. Component controls don't contain image data`)
      debugLog.warn(`   💡 Try: Publish your site or add manual CMS estimates`)
    }
    
    // Calculate CMS bandwidth impact (combine all CMS assets including manual estimates)
    const allCMSAssetsForImpact = [
      ...cmsAssets,
      ...manualCMSEstimates.map((est, idx) => ({
        id: `manual-${est.id}-${idx}`,
        collectionId: est.collectionName.toLowerCase().replace(/\s+/g, '-'),
        collectionName: est.collectionName,
        estimatedBytes: est.estimatedBytes,
        estimatedDimensions: { width: est.avgWidth, height: est.avgHeight },
        format: est.format,
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
      cmsAssetsCount: cmsAssetsInAnalysis.length,
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
          debugLog.error('Failed to analyze published site:', error)
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

