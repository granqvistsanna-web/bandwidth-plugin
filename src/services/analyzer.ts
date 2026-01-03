import type { ProjectAnalysis, PageAnalysis, AnalysisMode, AssetInfo, Recommendation } from '../types/analysis'
import { getAllPages, collectAllAssetsEfficient, collectPageAssets } from './traversal'
import { calculateBreakpointData, aggregateBreakpointData } from './bandwidth'
import { generateRecommendations } from './recommendations'
import { getPublishedUrl, analyzePublishedSite } from './publishedAnalysis'
import { debugLog } from '../utils/debugLog'

export async function analyzeProject(mode: AnalysisMode = 'canvas'): Promise<ProjectAnalysis> {
  try {
    debugLog.info('🚀 Starting project analysis...')
    const pages = await getAllPages(true) // Exclude design pages by default
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
    const desktopAssets = await collectAllAssetsEfficient('desktop', true) // Exclude design pages

    debugLog.success(`✅ Collected ${desktopAssets.length} assets total`)

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

    // Analyze each page individually
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
          const pageRecommendations = generateRecommendations(pageDesktop, page.id, page.name || 'Unnamed Page')
          
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
    
    // Convert back to array and sort globally by impact
    const allRecommendations = Array.from(recommendationMap.values())
      .sort((a, b) => {
        // Primary sort: by potential savings (descending)
        if (b.potentialSavings !== a.potentialSavings) {
          return b.potentialSavings - a.potentialSavings
        }
        // Secondary sort: by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

    const result: ProjectAnalysis = {
      mode,
      pages: pageAnalyses,
      totalPages: pages.length,
      overallBreakpoints: {
        mobile: overallMobile,
        tablet: overallTablet,
        desktop: overallDesktop
      },
      allRecommendations
    }

    // If published mode, also fetch published site data
    if (mode === 'published') {
      const publishedUrl = await getPublishedUrl()

      if (publishedUrl) {
        console.log('Fetching published site data from:', publishedUrl)
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
          console.error('Failed to analyze published site:', error)
          // Fall back to canvas analysis
        }
      } else {
        console.warn('Site is not published, falling back to canvas analysis')
      }
    }

    return result
  } catch (error) {
    console.error('Error analyzing project:', error)
    throw error
  }
}

