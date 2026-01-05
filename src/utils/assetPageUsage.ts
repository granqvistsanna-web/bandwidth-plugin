/**
 * Route Resolver Utility
 *
 * Determines which Site Page (Route) a node/asset belongs to.
 * A "Route" = a published site path like /about, /services, /pricing
 *
 * IMPORTANT: This ignores breakpoint artboards (Desktop/Tablet/Mobile).
 * Those are NOT routes - they are just responsive variants within a route.
 *
 * Return format:
 * {
 *   route: { name: string, slug: string },  // e.g. { name: "About", slug: "/about" }
 *   nodePath?: string,                       // e.g. "Header > Logo > Image"
 *   confidence: 'high' | 'medium' | 'low',
 *   notes?: string
 * }
 */

import { framer, isWebPageNode, type CanvasNode, type WebPageNode } from 'framer-plugin'
import type { AssetPageUsage, PageUsageInfo, ProjectAnalysis } from '../types/analysis'
import { debugLog } from './debugLog'

// Type for nodes with name property (Framer types don't always include name)
type NodeWithName = CanvasNode & { name?: string }
type WebPageNodeWithName = WebPageNode & { name?: string }
type NodeWithBackgroundImage = CanvasNode & {
  backgroundImage?: { url?: string; id?: string }
  image?: { url?: string; id?: string }
}

/**
 * Route info returned by the resolver
 */
export interface RouteInfo {
  route: {
    name: string
    slug: string  // e.g. "/about", "/services", "/"
  }
  pageId?: string  // WebPageNode ID for filtering
  nodePath?: string  // Path to node in hierarchy: "Header > Logo > Image"
  breakpoint?: string  // Breakpoint frame name: "Desktop", "Tablet", "Mobile"
  confidence: 'high' | 'medium' | 'low'
  notes?: string
  isCMSDetailPage?: boolean
  cmsCollectionId?: string
}

/**
 * Common breakpoint frame patterns
 */
const BREAKPOINT_PATTERNS = [
  { pattern: /desktop/i, name: 'Desktop' },
  { pattern: /laptop/i, name: 'Laptop' },
  { pattern: /tablet/i, name: 'Tablet' },
  { pattern: /mobile/i, name: 'Mobile' },
  { pattern: /phone/i, name: 'Phone' },
  { pattern: /1440/i, name: '1440px' },
  { pattern: /1200/i, name: '1200px' },
  { pattern: /1024/i, name: '1024px' },
  { pattern: /768/i, name: '768px' },
  { pattern: /390/i, name: '390px' },
  { pattern: /375/i, name: '375px' },
]

/**
 * Check if a frame name is a breakpoint frame and return normalized name
 */
function getBreakpointName(frameName: string): string | null {
  if (!frameName) return null

  for (const { pattern, name } of BREAKPOINT_PATTERNS) {
    if (pattern.test(frameName)) {
      return name
    }
  }
  return null
}

/**
 * Result of route resolution
 */
export interface RouteResolutionResult {
  found: boolean
  routeInfo?: RouteInfo
  error?: string
}

// Cache for WebPageNodes (routes)
let routesCache: WebPageNode[] | null = null

/**
 * Clear the routes cache (call when analysis needs fresh data)
 */
export function clearRoutesCache(): void {
  routesCache = null
}

// Also export the old name for backwards compatibility
export const clearPagesCache = clearRoutesCache

/**
 * Get all WebPageNodes (actual site routes)
 */
async function getAllRoutes(): Promise<WebPageNode[]> {
  if (routesCache) return routesCache

  try {
    // Use the proper Framer API to get WebPageNodes
    const webPages = await framer.getNodesWithType("WebPageNode")
    routesCache = webPages
    debugLog.info(`Found ${webPages.length} routes:`, webPages.map(p => ({
      name: (p as NodeWithName).name || 'unnamed',
      path: p.path
    })))
    return webPages
  } catch (error) {
    debugLog.error('Failed to get routes:', error)
    return []
  }
}

/**
 * Build the node path (hierarchy) from a node up to its containing route
 * Also captures the breakpoint frame name if encountered
 */
async function buildNodePath(nodeId: string, stopAtRouteId?: string): Promise<{ path: string; breakpoint?: string }> {
  const pathParts: string[] = []
  let currentId: string | null = nodeId
  let depth = 0
  const maxDepth = 30
  let breakpoint: string | undefined

  try {
    while (currentId && depth < maxDepth) {
      const node = await framer.getNode(currentId)
      if (!node) break

      // Stop if we've reached the route
      if (stopAtRouteId && currentId === stopAtRouteId) break

      // Stop if this is a WebPageNode
      if (isWebPageNode(node)) break

      // Check if this is a breakpoint frame
      const nodeName = (node as NodeWithName).name
      if (nodeName) {
        const breakpointName = getBreakpointName(nodeName)
        if (breakpointName) {
          // Found a breakpoint frame - capture it but don't add to path
          breakpoint = breakpointName
        } else {
          // Regular frame - add to path
          pathParts.unshift(nodeName)
        }
      }

      // Get parent using the proper API
      const parent = await framer.getParent(currentId)
      if (!parent || parent.id === currentId) break

      currentId = parent.id
      depth++
    }
  } catch (error) {
    debugLog.warn('Error building node path:', error)
  }

  return { path: pathParts.join(' > '), breakpoint }
}

/**
 * Resolve the owning Route (Site Page) for a node
 *
 * This traverses up the parent chain until it finds a WebPageNode,
 * which represents an actual published route like /about, /services.
 *
 * @param nodeId - The ID of the node to resolve
 * @returns RouteResolutionResult with route info if found
 */
export async function resolveNodeRoute(nodeId: string): Promise<RouteResolutionResult> {
  try {
    const node = await framer.getNode(nodeId)
    if (!node) {
      return {
        found: false,
        error: 'Node not found'
      }
    }

    // Check if the node itself is a WebPageNode
    if (isWebPageNode(node)) {
      const webPage = node as WebPageNode
      return {
        found: true,
        routeInfo: {
          route: {
            name: (webPage as WebPageNodeWithName).name || 'Unnamed Route',
            slug: webPage.path || '/'
          },
          pageId: webPage.id,
          confidence: 'high',
          isCMSDetailPage: !!webPage.collectionId,
          cmsCollectionId: webPage.collectionId || undefined
        }
      }
    }

    // Traverse up the parent chain to find the WebPageNode
    let current = node
    let depth = 0
    const maxDepth = 50  // Generous limit for deep hierarchies

    while (depth < maxDepth) {
      const parent = await framer.getParent(current.id)
      if (!parent) break

      // Check if parent is a WebPageNode (the route)
      if (isWebPageNode(parent)) {
        const webPage = parent as WebPageNode
        const { path: nodePath, breakpoint } = await buildNodePath(nodeId, webPage.id)

        return {
          found: true,
          routeInfo: {
            route: {
              name: (webPage as WebPageNodeWithName).name || 'Unnamed Route',
              slug: webPage.path || '/'
            },
            pageId: webPage.id,
            nodePath: nodePath || undefined,
            breakpoint,
            confidence: 'high',
            isCMSDetailPage: !!webPage.collectionId,
            cmsCollectionId: webPage.collectionId || undefined
          }
        }
      }

      current = parent
      depth++
    }

    // If we get here, we couldn't find a WebPageNode
    // This might be a node in a component or design page
    return {
      found: false,
      error: 'Could not find parent route. Node may be in a component, design page, or detached from site pages.'
    }
  } catch (error) {
    debugLog.error('Error resolving node route:', error)
    return {
      found: false,
      error: `Resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get all routes where a node/asset appears
 * This is useful for assets that might be used in multiple places (components)
 *
 * @param identifier - Object with url or imageAssetId to search for
 * @returns Array of RouteInfo for each route where the asset is used
 */
export async function findAssetRoutes(
  identifier: { url?: string; imageAssetId?: string }
): Promise<{ routes: RouteInfo[]; isCMSAsset: boolean; error?: string }> {
  const { url, imageAssetId } = identifier

  if (!url && !imageAssetId) {
    return { routes: [], isCMSAsset: false, error: 'No identifier provided' }
  }

  // Check if this looks like a CMS asset
  const isCMSAsset = url ? (
    url.includes('cms') ||
    url.includes('collection') ||
    url.includes('{{')  // Template binding
  ) : false

  if (isCMSAsset) {
    return {
      routes: [],
      isCMSAsset: true,
      error: 'CMS assets are dynamically bound and their routes cannot be statically determined'
    }
  }

  try {
    const routes = await getAllRoutes()
    const foundRoutes: RouteInfo[] = []
    const seenRouteIds = new Set<string>()

    // Scan each route for the asset
    for (const route of routes) {
      const nodesWithAsset = await scanRouteForAsset(route.id, url, imageAssetId)

      if (nodesWithAsset.length > 0 && !seenRouteIds.has(route.id)) {
        seenRouteIds.add(route.id)

        // Get node path and breakpoint from first found node
        const { path: nodePath, breakpoint } = await buildNodePath(nodesWithAsset[0], route.id)

        foundRoutes.push({
          route: {
            name: (route as WebPageNodeWithName).name || 'Unnamed Route',
            slug: route.path || '/'
          },
          nodePath: nodePath || undefined,
          breakpoint,
          confidence: 'high',
          isCMSDetailPage: !!route.collectionId,
          cmsCollectionId: route.collectionId || undefined
        })
      }
    }

    return { routes: foundRoutes, isCMSAsset: false }
  } catch (error) {
    debugLog.error('Error finding asset routes:', error)
    return {
      routes: [],
      isCMSAsset: false,
      error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Scan a route's descendants for an asset by URL or imageAssetId
 */
async function scanRouteForAsset(
  routeId: string,
  url?: string,
  imageAssetId?: string,
  maxDepth: number = 20
): Promise<string[]> {
  const foundNodes: string[] = []
  const visited = new Set<string>()

  async function scan(nodeId: string, depth: number): Promise<void> {
    if (depth >= maxDepth || visited.has(nodeId)) return
    visited.add(nodeId)

    try {
      const node = await framer.getNode(nodeId)
      if (!node) return

      // Check if node has matching asset
      const nodeWithBg = node as NodeWithBackgroundImage

      // Check background image
      if (nodeWithBg.backgroundImage) {
        const bgUrl = nodeWithBg.backgroundImage?.url || ''
        const bgAssetId = nodeWithBg.backgroundImage?.id || ''

        if ((url && bgUrl === url) || (imageAssetId && bgAssetId === imageAssetId)) {
          foundNodes.push(nodeId)
        }
      }

      // Check image property
      if (nodeWithBg.image) {
        const imgUrl = nodeWithBg.image?.url || ''
        const imgAssetId = nodeWithBg.image?.id || ''

        if ((url && imgUrl === url) || (imageAssetId && imgAssetId === imageAssetId)) {
          foundNodes.push(nodeId)
        }
      }

      // Recurse into children
      const children = await framer.getChildren(nodeId)
      for (const child of children) {
        await scan(child.id, depth + 1)
      }
    } catch {
      // Ignore errors, continue scanning
    }
  }

  await scan(routeId, 0)
  return foundNodes
}

// ============================================================================
// Legacy API compatibility (maps to new route-based API)
// ============================================================================

/**
 * Convert RouteInfo to legacy PageUsageInfo format
 */
function routeToPageUsageInfo(routeInfo: RouteInfo): PageUsageInfo {
  return {
    pageId: '', // Not available from route-based lookup
    pageName: routeInfo.route.name,
    pageSlug: routeInfo.route.slug,
    hierarchyPath: routeInfo.nodePath
  }
}

/**
 * Get page usage for a single asset by node ID
 * @deprecated Use resolveNodeRoute() instead for proper route resolution
 */
export async function getAssetPageUsage(nodeId: string): Promise<AssetPageUsage> {
  const result = await resolveNodeRoute(nodeId)

  if (!result.found || !result.routeInfo) {
    return {
      found: false,
      assetIdentifier: { nodeId },
      pages: [],
      isCMSAsset: false,
      unresolvedReason: 'not_found'
    }
  }

  // Check for CMS detail page
  if (result.routeInfo.isCMSDetailPage) {
    return {
      found: true,
      assetIdentifier: { nodeId },
      pages: [routeToPageUsageInfo(result.routeInfo)],
      isCMSAsset: true,
      partialInfo: {
        cmsCollectionName: result.routeInfo.cmsCollectionId
      }
    }
  }

  return {
    found: true,
    assetIdentifier: { nodeId },
    pages: [routeToPageUsageInfo(result.routeInfo)],
    isCMSAsset: false
  }
}

/**
 * Find all pages where an asset is used
 * @deprecated Use findAssetRoutes() instead for proper route resolution
 */
export async function findAssetUsageAcrossPages(
  identifier: { url?: string; imageAssetId?: string }
): Promise<AssetPageUsage> {
  const result = await findAssetRoutes(identifier)

  if (result.routes.length === 0) {
    return {
      found: false,
      assetIdentifier: identifier,
      pages: [],
      isCMSAsset: result.isCMSAsset,
      unresolvedReason: result.isCMSAsset ? 'cms_dynamic' : 'not_found'
    }
  }

  return {
    found: true,
    assetIdentifier: identifier,
    pages: result.routes.map(routeToPageUsageInfo),
    isCMSAsset: result.isCMSAsset
  }
}

/**
 * Get page usage from existing analysis data (faster than re-scanning)
 */
export function getAssetPageUsageFromAnalysis(
  analysis: ProjectAnalysis,
  identifier: { nodeId?: string; url?: string; imageAssetId?: string }
): AssetPageUsage {
  const { nodeId, url, imageAssetId } = identifier
  const matchingPages: PageUsageInfo[] = []
  const seenPageIds = new Set<string>()
  let isCMS = false

  for (const page of analysis.pages) {
    for (const breakpoint of ['desktop', 'tablet', 'mobile'] as const) {
      const assets = page.breakpoints[breakpoint].assets

      for (const asset of assets) {
        const matches = (
          (nodeId && asset.nodeId === nodeId) ||
          (url && asset.url === url) ||
          (imageAssetId && asset.imageAssetId === imageAssetId)
        )

        if (matches) {
          if (asset.isCMSAsset) isCMS = true

          if (!seenPageIds.has(page.pageId)) {
            seenPageIds.add(page.pageId)
            matchingPages.push({
              pageId: page.pageId,
              pageName: page.pageName,
              pageSlug: page.pageName.toLowerCase() === 'home' ? '/' :
                        `/${page.pageName.toLowerCase().replace(/\s+/g, '-')}`
            })
          }
        }
      }
    }
  }

  // Also check usedInPages field
  const allAssets = analysis.overallBreakpoints.desktop.assets
  for (const asset of allAssets) {
    const matches = (
      (nodeId && asset.nodeId === nodeId) ||
      (url && asset.url === url) ||
      (imageAssetId && asset.imageAssetId === imageAssetId)
    )

    if (matches && asset.usedInPages) {
      for (const pageUsage of asset.usedInPages) {
        if (!seenPageIds.has(pageUsage.pageId)) {
          seenPageIds.add(pageUsage.pageId)
          matchingPages.push({
            pageId: pageUsage.pageId,
            pageName: pageUsage.pageName,
            pageSlug: pageUsage.pageName.toLowerCase() === 'home' ? '/' :
                      `/${pageUsage.pageName.toLowerCase().replace(/\s+/g, '-')}`
          })
        }
      }
    }
  }

  if (matchingPages.length === 0) {
    return {
      found: false,
      assetIdentifier: identifier,
      pages: [],
      isCMSAsset: isCMS,
      unresolvedReason: isCMS ? 'cms_dynamic' : 'not_found'
    }
  }

  return {
    found: true,
    assetIdentifier: identifier,
    pages: matchingPages,
    isCMSAsset: isCMS
  }
}

// ============================================================================
// Test Function
// ============================================================================

/**
 * Test function to verify route resolution works correctly
 */
export async function testRouteResolver(): Promise<void> {
  console.log('=== Route Resolver Test ===')

  try {
    // Test 1: Get all routes
    const routes = await getAllRoutes()
    console.log(`\n1. Found ${routes.length} routes:`)
    routes.forEach(r => {
      console.log(`   - ${(r as WebPageNodeWithName).name || 'unnamed'}: ${r.path || '/'}`)
      if (r.collectionId) {
        console.log(`     (CMS Detail Page, collection: ${r.collectionId})`)
      }
    })

    // Test 2: Resolve route for selected node
    const selection = await framer.getSelection()
    if (selection.length > 0) {
      const selectedNode = selection[0]
      console.log(`\n2. Resolving route for selected node: ${selectedNode.id}`)

      const result = await resolveNodeRoute(selectedNode.id)
      console.log('Result:', JSON.stringify(result, null, 2))
    } else {
      console.log('\n2. No selection - select a layer to test resolveNodeRoute()')
    }

    // Test 3: Find nodes with background images
    const nodesWithBG = await framer.getNodesWithAttributeSet('backgroundImage')
    if (nodesWithBG.length > 0) {
      const testNode = nodesWithBG[0]
      console.log(`\n3. Testing with background image node: ${testNode.id}`)

      const result = await resolveNodeRoute(testNode.id)
      console.log('Route result:', JSON.stringify(result, null, 2))

      // Test cross-route search
      const nodeWithBg = testNode as NodeWithBackgroundImage
      const bgUrl = nodeWithBg.backgroundImage?.url
      if (bgUrl) {
        console.log(`\n4. Searching for asset across all routes...`)
        const routeResults = await findAssetRoutes({ url: bgUrl })
        console.log('Routes using this asset:', JSON.stringify(routeResults, null, 2))
      }
    } else {
      console.log('\n3. No nodes with background images found')
    }

    console.log('\n=== Test Complete ===')
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Export for backwards compatibility
export const testAssetPageUsage = testRouteResolver
