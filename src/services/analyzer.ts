import type { ProjectAnalysis, PageAnalysis, AnalysisMode } from '../types/analysis'
import { getAllPages, traverseNodeTree } from './traversal'
import { calculateBreakpointData, aggregateBreakpointData } from './bandwidth'
import { generateRecommendations } from './recommendations'
import { getPublishedUrl, analyzePublishedSite } from './publishedAnalysis'

export async function analyzeProject(mode: AnalysisMode = 'canvas'): Promise<ProjectAnalysis> {
  try {
    const pages = await getAllPages()
    console.log('Pages to analyze:', pages)

    if (!pages || !Array.isArray(pages)) {
      console.error('Pages is not an array:', pages)
      throw new Error('Could not load pages from Framer project')
    }

    if (pages.length === 0) {
      throw new Error('No pages found in project. Try creating a page first.')
    }

    const pageAnalyses: PageAnalysis[] = []

    // Analyze each page
    for (const page of pages) {
      const pageAnalysis = await analyzePage(page)
      pageAnalyses.push(pageAnalysis)
    }

    // Calculate overall statistics across all pages
    const overallMobile = aggregateBreakpointData(
      pageAnalyses.map(p => p.breakpoints.mobile)
    )
    const overallTablet = aggregateBreakpointData(
      pageAnalyses.map(p => p.breakpoints.tablet)
    )
    const overallDesktop = aggregateBreakpointData(
      pageAnalyses.map(p => p.breakpoints.desktop)
    )

    // Collect all recommendations
    const allRecommendations = pageAnalyses.flatMap(p => p.recommendations)

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
            breakdown: publishedData.breakdown
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

async function analyzePage(
  page: { id: string; name?: string }
): Promise<PageAnalysis> {
  const pageId = page.id
  const pageName = page.name || 'Unnamed Page'

  // Collect assets for each breakpoint
  const mobileAssets = await traverseNodeTree(pageId, 'mobile')
  const tabletAssets = await traverseNodeTree(pageId, 'tablet')
  const desktopAssets = await traverseNodeTree(pageId, 'desktop')

  // Calculate bandwidth for each breakpoint
  const mobileData = calculateBreakpointData(mobileAssets, 'mobile')
  const tabletData = calculateBreakpointData(tabletAssets, 'tablet')
  const desktopData = calculateBreakpointData(desktopAssets, 'desktop')

  // Generate recommendations based on desktop (typically largest)
  const recommendations = generateRecommendations(desktopData)

  // Count total unique assets
  const allAssetIds = new Set([
    ...mobileAssets.map(a => a.nodeId),
    ...tabletAssets.map(a => a.nodeId),
    ...desktopAssets.map(a => a.nodeId)
  ])

  return {
    pageId,
    pageName,
    breakpoints: {
      mobile: mobileData,
      tablet: tabletData,
      desktop: desktopData
    },
    totalAssets: allAssetIds.size,
    recommendations
  }
}

export async function analyzeCurrentPage(): Promise<PageAnalysis> {
  try {
    // Get current selection or active page
    const pages = await getAllPages()
    if (!pages || pages.length === 0) {
      throw new Error('No pages found')
    }

    // For now, analyze the first page
    // TODO: Add logic to detect currently active page
    return await analyzePage(pages[0])
  } catch (error) {
    console.error('Error analyzing current page:', error)
    throw error
  }
}
