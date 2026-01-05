import { framer, supportsBackgroundImage, type ImageAsset, type CanvasNode, type WebPageNode } from 'framer-plugin'
import type { AssetInfo, Breakpoint } from '../types/analysis'
import type { ExtendedCanvasNode } from '../types/framer'
import { debugLog } from '../utils/debugLog'
import { handleServiceError, withEmptyArrayFallback, ErrorCode } from '../utils/errorHandler'

/**
 * Check if a page is a design page (should be excluded from analysis)
 * Design pages are typically:
 * - Named with "Design", "Component", "Template", "Style" prefixes
 * - Used for design system components, not actual pages
 */
function isDesignPage(page: { name?: string; type?: string; path?: string }): boolean {
  const name = (page.name || '').toLowerCase().trim()
  const path = ((page as WebPageNode).path || '').toLowerCase()

  // Common design page naming patterns
  const designPagePatterns = [
    'design',
    'component',
    'template',
    'style',
    'system',
    'library',
    'atoms',
    'molecules',
    'organisms',
    'patterns',
    'ui kit',
    'design system',
    'ds-', // Design system prefix
    '🎨', // Design emoji
    '📐', // Design emoji
  ]

  // Check if page name or path starts with any design pattern
  return designPagePatterns.some(pattern =>
    name.startsWith(pattern) || path.startsWith('/' + pattern)
  )
}

export async function getAllPages(excludeDesignPages: boolean = true): Promise<CanvasNode[]> {
  return withEmptyArrayFallback(async () => {
    // Use getNodesWithType to get actual WebPageNodes (site pages/routes)
    // This is more reliable than getting canvas root children which may include breakpoint artboards
    let allPages: CanvasNode[]

    try {
      const webPages = await framer.getNodesWithType("WebPageNode")
      debugLog.info(`Found ${webPages.length} WebPageNodes via getNodesWithType`)

      if (webPages.length > 0) {
        allPages = webPages
        debugLog.info(`WebPageNodes:`, webPages.map(p => ({
          name: p.name || 'unnamed',
          path: (p as WebPageNode).path || 'no path',
          id: p.id
        })))
      } else {
        // Fallback to canvas root children if no WebPageNodes found
        debugLog.warn('No WebPageNodes found, falling back to canvas root children')
        const root = await framer.getCanvasRoot()
        if (!root) {
          handleServiceError(
            new Error('No canvas root found'),
            'getAllPages',
            { notifyUser: true, code: ErrorCode.NOT_FOUND }
          )
          return []
        }
        allPages = await framer.getChildren(root.id)
        debugLog.info(`Canvas root children:`, allPages.map(p => p.name || p.id))
      }
    } catch (error) {
      // Fallback to canvas root children if getNodesWithType fails
      debugLog.warn('getNodesWithType failed, falling back to canvas root children:', error)
      const root = await framer.getCanvasRoot()
      if (!root) {
        handleServiceError(
          new Error('No canvas root found'),
          'getAllPages',
          { notifyUser: true, code: ErrorCode.NOT_FOUND }
        )
        return []
      }
      allPages = await framer.getChildren(root.id)
    }

    // Filter out design pages if requested
    const pages = excludeDesignPages
      ? allPages.filter(page => !isDesignPage(page))
      : allPages

    const excludedCount = allPages.length - pages.length
    if (excludedCount > 0) {
      debugLog.info(`Excluded ${excludedCount} design page(s) from analysis`)
    }

    debugLog.success(`Found ${pages.length} page(s) for analysis`, pages.map(p => ({
      name: p.name || 'unnamed',
      path: (p as WebPageNode).path || 'no path',
      id: p.id
    })))

    return pages
  }, 'getAllPages')
}

export async function traverseNodeTree(
  nodeId: string,
  breakpoint: Breakpoint,
  maxDepth: number = 100,
  currentDepth: number = 0
): Promise<AssetInfo[]> {
  if (currentDepth >= maxDepth) return []

  const assets: AssetInfo[] = []

  try {
    const node = await framer.getNode(nodeId)

    // Extract asset info from current node
    const asset = await extractAssetInfo(node, breakpoint, currentDepth)
    if (asset) {
      // Verbose per-asset logging removed to reduce debug log noise
      assets.push(asset)
    }

    // Get children and process them
    const children = await framer.getChildren(nodeId)

    if (currentDepth === 0) {
      debugLog.info(`Scanning page: ${node.name || 'unnamed'} (${node.type || 'unknown'})`, {
        childrenCount: children.length,
        breakpoint
      })
    }

    // Process in batches to avoid blocking
    const BATCH_SIZE = 20
    for (let i = 0; i < children.length; i += BATCH_SIZE) {
      const batch = children.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(child =>
          traverseNodeTree(child.id, breakpoint, maxDepth, currentDepth + 1)
        )
      )
      assets.push(...batchResults.flat())

      // Yield to event loop
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  } catch (error) {
    handleServiceError(
      error,
      `traverseNodeTree(${nodeId})`,
      {
        notifyUser: currentDepth === 0, // Only notify for top-level errors
        logLevel: currentDepth === 0 ? 'error' : 'warn',
        code: ErrorCode.API_ERROR
      }
    )
  }

  return assets
}

async function extractAssetInfo(
  node: ExtendedCanvasNode,
  breakpoint: Breakpoint,
  depth: number = 0
): Promise<AssetInfo | null> {
  try {
    // Check if node is visible
    if (node.visible === false) {
      // Only log for top-level nodes to reduce noise
      if (depth < 2) {
        debugLog.info(`Skipping invisible node: ${node.name || node.id}`)
      }
      return null
    }

    // Only log full structure for debugging when explicitly needed (top-level or image nodes)
    // This reduces performance impact and log noise
    const shouldLogFullStructure = depth < 2 && (
      node.type === 'Image' || 
      node.type === 'image' || 
      (node.type === 'Frame' && supportsBackgroundImage(node) && node.backgroundImage)
    )
    
    if (shouldLogFullStructure) {
      // Log full node structure for debugging image detection issues
      const fullNodeStructure: Record<string, unknown> = {}
      for (const key of Object.keys(node)) {
        if (key.startsWith('__')) continue
        const value = node[key]
        if (typeof value === 'string' && value.length > 100) {
          fullNodeStructure[key] = value.substring(0, 100) + '...'
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const objValue = value as Record<string, unknown>
          fullNodeStructure[key] = { 
            type: 'object',
            keys: Object.keys(objValue).slice(0, 20),
            sample: JSON.stringify(objValue).substring(0, 200)
          }
        } else if (Array.isArray(value)) {
          const arrValue = value as unknown[]
          fullNodeStructure[key] = {
            type: 'array',
            length: arrValue.length,
            firstItem: arrValue[0] ? (typeof arrValue[0] === 'object' ? Object.keys(arrValue[0]) : arrValue[0]) : null
          }
        } else {
          fullNodeStructure[key] = value
        }
      }
      debugLog.info(`Full node structure: ${node.name || 'unnamed'} (${node.type || 'unknown'})`, fullNodeStructure)
    }

    // Get actual rendered dimensions using getRect() API
    // This gives us pixel dimensions even when width/height are CSS values
    let dimensions = getNodeDimensions(node)
    try {
      const rect = await node.getRect()
      if (rect && rect.width > 0 && rect.height > 0) {
        dimensions = { width: rect.width, height: rect.height }
      }
    } catch (error) {
      // Fall back to parsed dimensions if getRect fails
      debugLog.warn(`Could not get rect for node: ${node.name}`, error)
    }

    // Check for backgroundImage using the proper trait function
    // This is the correct way according to Framer API docs
    if (supportsBackgroundImage(node) && node.backgroundImage) {
      const image = node.backgroundImage
      // ImageAsset has a .url property
      const imageUrl = image.url
      
      if (imageUrl) {
        // Get intrinsic dimensions using ImageAsset.measure()
        let actualDimensions: { width: number; height: number } | undefined
        try {
          const size = await image.measure()
          actualDimensions = { width: size.width, height: size.height }
        } catch {
          // Continue without actual dimensions
        }

        // Get the page this node belongs to
        const page = await getPageForNode(node.id)
        // Verbose per-asset logging removed
      return {
        nodeId: node.id,
        nodeName: node.name || 'Unnamed',
          type: 'image', // Changed from 'background' to 'image' for consistency
        estimatedBytes: 0,
        dimensions,
          actualDimensions,
          format: detectImageFormat(imageUrl),
        visible: true,
          url: imageUrl,
          imageAssetId: image.id,
        pageId: page?.id,
        pageName: page?.name,
        pageUrl: page?.url,
        pageSlug: page?.slug || page?.name // Use slug if available, fallback to name
      }
      }
    }

    // Check for SVG type nodes
    if (node.type === 'SVG' || node.type === 'svg' || node.__class === 'SVGNode') {
      // Try to get SVG content for feature analysis
      let svgContent: string | undefined
      if (node.svg || node.content) {
        svgContent = (node.svg || node.content) as string
      } else if (node.__svgContent) {
        svgContent = node.__svgContent as string
      }
      
      // Get the page this node belongs to
      const page = await getPageForNode(node.id)
      if (!page) {
        debugLog.warn(`⚠️ No page found for SVG node ${node.name || node.id} - asset will show "Unknown"`)
      }
      
      return {
        nodeId: node.id,
        nodeName: node.name || 'Unnamed',
        type: 'svg',
        estimatedBytes: 0,
        dimensions,
        format: 'svg',
        visible: true,
        svgContent,
        pageId: page?.id,
        pageName: page?.name,
        pageUrl: page?.url,
        pageSlug: page?.slug || page?.name // Use slug if available, fallback to name
      }
    }

    // Note: Framer uses backgroundImage (ImageAsset object) for background images
    // We already checked that above, so no need to check fills/background arrays

    // Only log warnings for nodes that might have images (to reduce noise)
    if (depth < 3 && (node.type === 'Frame' || node.type === 'Image' || node.type === 'image')) {
      debugLog.info(`No asset detected in ${node.type} node: ${node.name || node.id}`)
    }
    return null
  } catch (error) {
    debugLog.error('Error extracting asset info', { nodeId: node.id, error })
    return null
  }
}

function getNodeDimensions(
  node: ExtendedCanvasNode
): { width: number; height: number } {
  // Try to get node dimensions
  // Framer nodes should have width and height properties
  // These might be numbers, strings with units (px, %, fr), or CSS values (fit-content, auto)
  
  const parseDimension = (value: unknown): number => {
    if (typeof value === 'number') {
      return isFinite(value) && !isNaN(value) && value > 0 ? value : 0
    }
    
    if (typeof value === 'string') {
      // Remove units and parse
      const numeric = parseFloat(value.replace(/[^\d.-]/g, ''))
      if (isFinite(numeric) && !isNaN(numeric) && numeric > 0) {
        return numeric
      }
    }
    
    return 0
  }

  const width = parseDimension(node.width)
  const height = parseDimension(node.height)

  return { width, height }
}

function detectImageFormat(url: string): string {
  if (!url) return 'unknown'

  // Check for data URL first (most specific)
  if (url.startsWith('data:image/')) {
    const format = url.match(/data:image\/([a-z]+)/)?.[1]
    if (format) {
      // Normalize jpg to jpeg
      return format === 'jpg' ? 'jpeg' : format
    }
  }

  // Try URL extension (check before query params)
  const urlWithoutQuery = url.split('?')[0]
  const ext = urlWithoutQuery.split('.').pop()?.toLowerCase()
  if (ext && ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'avif'].includes(ext)) {
    return ext === 'jpg' ? 'jpeg' : ext
  }

  // Check for format hints in Framer CDN URLs
  // Framer CDN URLs sometimes have format in the path or query params
  if (url.includes('framerusercontent')) {
    // Check query params for format hints
    const urlObj = new URL(url)
    const formatParam = urlObj.searchParams.get('format') || urlObj.searchParams.get('f')
    if (formatParam && ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(formatParam.toLowerCase())) {
      const normalized = formatParam.toLowerCase() === 'jpg' ? 'jpeg' : formatParam.toLowerCase()
      return normalized
    }
    
    // Check path for format hints (e.g., /image.webp or /image_webp)
    if (url.includes('/webp') || url.includes('_webp')) {
      return 'webp'
    }
    if (url.includes('/avif') || url.includes('_avif')) {
      return 'avif'
    }
    if (url.includes('/png') || url.includes('_png')) {
      return 'png'
    }
    
    // If we can't determine, don't default to jpeg - return unknown
    // This is better than assuming wrong format
    return 'unknown'
  }

  return 'unknown'
}

// Cache of all pages for faster lookup
let pagesCache: Array<{ id: string; name: string }> | null = null

// Cache of page children for faster descendant checking
const pageChildrenCache = new Map<string, string[]>()

/**
 * Clear the pages cache (call this at the start of a new analysis)
 */
export function clearPagesCache(): void {
  pagesCache = null
  pageChildrenCache.clear()
  debugLog.info('Cleared pages cache and page children cache')
}

/**
 * Get all pages and cache them
 */
async function getAllPagesCached(): Promise<Array<{ id: string; name: string }>> {
  if (pagesCache) return pagesCache
  
  try {
    const root = await framer.getCanvasRoot()
    if (!root) {
      debugLog.warn('getAllPagesCached: No canvas root found')
      return []
    }
    
    const allPages = await framer.getChildren(root.id)
    pagesCache = allPages.map(p => ({ id: p.id, name: p.name || 'Unnamed' }))
    debugLog.info(`Cached ${pagesCache.length} pages for lookup:`, pagesCache.map(p => `${p.name} (${p.id})`))
    return pagesCache
  } catch (error) {
    debugLog.warn('Error getting pages for cache:', error)
    return []
  }
}

/**
 * Get children of a page and cache them for faster lookups
 */
async function getPageChildrenCached(pageId: string): Promise<string[]> {
  if (pageChildrenCache.has(pageId)) {
    return pageChildrenCache.get(pageId)!
  }
  
  try {
    const children = await framer.getChildren(pageId)
    const childIds = children.map(c => c.id)
    pageChildrenCache.set(pageId, childIds)
    return childIds
  } catch (error) {
    debugLog.warn(`Error getting children for page ${pageId}:`, error)
    return []
  }
}

/**
 * Check if a node is a descendant of a page by recursively checking children
 * Uses cached children for performance
 */
async function isNodeDescendantOfPage(nodeId: string, pageId: string, currentDepth: number, maxDepth: number): Promise<boolean> {
  if (currentDepth >= maxDepth) return false
  
  try {
    const childIds = await getPageChildrenCached(pageId)
    for (const childId of childIds) {
      if (childId === nodeId) {
        return true
      }
      // Recursively check grandchildren - use the maxDepth parameter to control depth
      // This allows callers to specify how deep to search
      if (currentDepth < maxDepth - 1) {
        const isGrandchild = await isNodeDescendantOfPage(nodeId, childId, currentDepth + 1, maxDepth)
        if (isGrandchild) {
          return true
        }
      }
    }
  } catch (error) {
    // Ignore errors and continue
    debugLog.warn(`isNodeDescendantOfPage: Error checking descendants of page ${pageId} at depth ${currentDepth}:`, error)
  }
  
  return false
}

/**
 * Get the page that a node belongs to by traversing up the parent chain
 * Returns the page node if found, null otherwise
 */
/**
 * Check if a node name indicates it's a breakpoint artboard (not a real page)
 * Breakpoint artboards are containers for responsive layouts, not actual routes
 */
function isBreakpointArtboard(name: string): boolean {
  if (!name) return false
  const normalized = name.toLowerCase().trim()

  // Common breakpoint artboard names in Framer
  const breakpointPatterns = [
    'desktop',
    'tablet',
    'phone',
    'mobile',
    'laptop',
    'wide',
    'narrow',
    // Size-based patterns
    '1440',
    '1200',
    '1024',
    '768',
    '390',
    '375',
    '320',
    // Framer default breakpoint names
    'breakpoint',
    '@media'
  ]

  return breakpointPatterns.some(pattern => normalized.includes(pattern))
}

async function getPageForNode(nodeId: string): Promise<{ id: string; name: string; url?: string; slug?: string } | null> {
  try {
    // Always fetch the full node to ensure we have parent information
    // Nodes from getNodesWithAttributeSet() may not have parent info
    const node = await framer.getNode(nodeId)
    if (!node) {
      debugLog.warn(`getPageForNode: Node ${nodeId} not found`)
      return null
    }

    // Get all pages for lookup
    const allPages = await getAllPagesCached()

    // If this node is a page, return it (but skip if it's a breakpoint artboard)
    const nodeType = node.type || ''
    const nodeTypeLower = nodeType.toLowerCase()
    const nodeName = node.name || ''

    // Check if this node is a page by type or by ID match
    // BUT skip breakpoint artboards - they're not real pages/routes
    if ((nodeTypeLower.includes('page') || allPages.some(p => p.id === node.id)) && !isBreakpointArtboard(nodeName)) {
      const pageName = nodeName || 'Unnamed'
      const pageSlug = pageName
      // Verbose per-asset logging removed

      // Try to get published URL only if this is the current page being viewed
      let pageUrl: string | undefined
      try {
        const publishInfo = await framer.getPublishInfo()
        const currentUrl = publishInfo?.staging?.currentPageUrl || publishInfo?.production?.currentPageUrl
        if (currentUrl) {
          try {
            const urlObj = new URL(currentUrl)
            const currentSlug = urlObj.pathname.replace(/^\//, '') || urlObj.pathname
            if (currentSlug === pageName || currentSlug === pageSlug || urlObj.pathname === `/${pageName}`) {
              pageUrl = currentUrl
            }
          } catch {
            // URL parsing failed, ignore
          }
        }
      } catch {
        // Ignore publish info errors - page name is the important part
      }

      return { id: node.id, name: pageName, url: pageUrl, slug: pageSlug }
    }
    
    // Traverse up the parent chain to find the page
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = node
    let depth = 0
    const maxDepth = 20 // Safety limit
    
    while (current && depth < maxDepth) {
      // Check if current node is a page by type or by ID match
      const currentType = (current.type || '').toLowerCase()
      const currentName = current.name || ''
      const isPageByType = currentType.includes('page')
      const isPageById = allPages.some(p => p.id === current.id)

      // Skip breakpoint artboards - continue traversing up to find the real page
      if (isBreakpointArtboard(currentName)) {
        // Verbose logging removed
        const parentId = current.parent?.id || current.parent
        if (!parentId) break
        const parent = await framer.getNode(parentId)
        if (!parent) break
        current = parent
        depth++
        continue
      }

      if (isPageByType || isPageById) {
        const pageName = currentName || 'Unnamed'
        const pageSlug = pageName
        // Verbose logging removed
        
        // Try to get published URL only if this is the current page
        let pageUrl: string | undefined
        try {
          const publishInfo = await framer.getPublishInfo()
          const currentUrl = publishInfo?.staging?.currentPageUrl || publishInfo?.production?.currentPageUrl
          if (currentUrl) {
            try {
              const urlObj = new URL(currentUrl)
              const currentSlug = urlObj.pathname.replace(/^\//, '') || urlObj.pathname
              if (currentSlug === pageName || currentSlug === pageSlug || urlObj.pathname === `/${pageName}`) {
                pageUrl = currentUrl
              }
            } catch {
              // Ignore URL parsing errors
            }
          }
        } catch {
          // Ignore publish info errors
        }
        
        return { id: current.id, name: pageName, url: pageUrl, slug: pageSlug }
      }
      
      // Get parent ID - parent might be a reference object or just an ID
      // Try multiple ways to get parent ID
      const parentId = current.parent?.id || current.parent
      
      // If no parent in the node object, the node might not have parent info loaded
      // This can happen with nodes from getNodesWithAttributeSet()
      if (!parentId) {
        // Try to get children of all pages and see if this node is a child
        // This is a fallback when parent info is not available
        // Use a recursive helper to check if node is descendant of page
        let foundPage: { id: string; name: string } | null = null
        
        // Try with increased depth for better detection (up to 10 levels)
        for (const page of allPages) {
          try {
            // Check if node is a direct or indirect child of this page
            // Increase depth to 10 for better detection of deeply nested nodes
            const isDescendant = await isNodeDescendantOfPage(current.id, page.id, 0, 10)
            if (isDescendant) {
              foundPage = page
              break
            }
          } catch (error) {
            // Continue checking other pages
            debugLog.warn(`getPageForNode: Error checking if node is descendant of page ${page.name}:`, error)
          }
        }
        
        if (foundPage) {
          // Verbose per-asset logging removed
          return { id: foundPage.id, name: foundPage.name, slug: foundPage.name }
        }

        // If still not found, try a more aggressive search: check if node ID appears in any page's children
        // This handles cases where the node might be in a component or shared element
        for (const page of allPages) {
          try {
            // Get all children recursively (with caching)
            const allChildIds = await getAllDescendantIds(page.id, 0, 15) // Go deeper, up to 15 levels
            if (allChildIds.includes(current.id)) {
              foundPage = page
              break
            }
          } catch {
            // Continue checking other pages
          }
        }

        if (foundPage) {
          return { id: foundPage.id, name: foundPage.name, slug: foundPage.name }
        }

        debugLog.warn(`getPageForNode: No parent ID for node ${nodeId} at depth ${depth}. Node type: ${current.type || 'unknown'}, Node name: ${current.name || 'unnamed'}`)
        break
      }
      
      const parent = await framer.getNode(parentId)
      if (!parent) {
        debugLog.warn(`getPageForNode: Parent ${parentId} not found for node ${nodeId} at depth ${depth}`)
        break
      }
      
      // Check if parent is a page by type or by ID match
      const parentType = (parent.type || '').toLowerCase()
      const parentName = parent.name || ''
      const isParentPageByType = parentType.includes('page')
      const isParentPageById = allPages.some(p => p.id === parent.id)

      // Skip breakpoint artboards - continue traversing up
      if (isBreakpointArtboard(parentName)) {
        // Verbose logging removed
        current = parent
        depth++
        continue
      }

      if (isParentPageByType || isParentPageById) {
        const pageName = parentName || 'Unnamed'
        const pageSlug = pageName
        // Verbose logging removed
        
        // Try to get published URL only if this is the current page
        let pageUrl: string | undefined
        try {
          const publishInfo = await framer.getPublishInfo()
          const currentUrl = publishInfo?.staging?.currentPageUrl || publishInfo?.production?.currentPageUrl
          if (currentUrl) {
            try {
              const urlObj = new URL(currentUrl)
              const currentSlug = urlObj.pathname.replace(/^\//, '') || urlObj.pathname
              if (currentSlug === pageName || currentSlug === pageSlug || urlObj.pathname === `/${pageName}`) {
                pageUrl = currentUrl
              }
            } catch {
              // Ignore URL parsing errors
            }
          }
        } catch {
          // Ignore publish info errors
        }
        
        return { id: parent.id, name: pageName, url: pageUrl, slug: pageSlug }
      }
      
      current = parent
      depth++
    }
    
    // Final fallback: try aggressive search across all pages
    // Note: allPages is already declared earlier in this function
    for (const page of allPages) {
      try {
        const allChildIds = await getAllDescendantIds(page.id, 0, 20) // Very deep search as last resort
        if (allChildIds.includes(node.id)) {
          return { id: page.id, name: page.name, slug: page.name }
        }
      } catch {
        // Continue checking other pages
      }
    }

    // Node could not be mapped to a page (not an error, may be expected for some nodes)
    return null
  } catch (error) {
    debugLog.warn(`Error getting page for node ${nodeId}:`, error)
    return null
  }
}

/**
 * Get all descendant IDs of a page recursively (for aggressive page detection)
 */
async function getAllDescendantIds(pageId: string, currentDepth: number, maxDepth: number): Promise<string[]> {
  if (currentDepth >= maxDepth) return []
  
  const descendantIds: string[] = []
  
  try {
    const childIds = await getPageChildrenCached(pageId)
    descendantIds.push(...childIds)
    
    // Recursively get grandchildren (but limit depth to avoid performance issues)
    if (currentDepth < 10) { // Only go 10 levels deep for performance
      for (const childId of childIds) {
        const grandchildIds = await getAllDescendantIds(childId, currentDepth + 1, maxDepth)
        descendantIds.push(...grandchildIds)
      }
    }
  } catch {
    // Ignore errors and return what we have
  }

  return descendantIds
}

/**
 * Check if a node belongs to a design page by traversing up the parent chain
 */
async function isNodeInDesignPage(nodeId: string): Promise<boolean> {
  try {
    const node = await framer.getNode(nodeId)
    if (!node) return false
    
    // If this node is a page, check if it's a design page
    if (node.type === 'Page' || node.type === 'PageNode') {
      return isDesignPage(node)
    }
    
    // Traverse up the parent chain to find the page
    let current: ExtendedCanvasNode | null = node
    let depth = 0
    const maxDepth = 20 // Safety limit
    
    while (current && depth < maxDepth) {
      // Check if current node is a page
      if (current.type === 'Page' || current.type === 'PageNode') {
        return isDesignPage(current)
      }
      
      // Get parent ID - parent might be a reference object or just an ID
      const parentId = current.parent?.id || current.parent
      if (!parentId) break
      
      const parent = await framer.getNode(parentId)
      if (!parent) break
      
      // Check if parent is a page
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parentAny = parent as any
      if (parentAny.type === 'Page' || parentAny.type === 'PageNode' || parent.type === 'Page') {
        return isDesignPage(parent)
      }
      
      current = parent
      depth++
    }
    
    return false
  } catch (error) {
    debugLog.warn(`Error checking if node ${nodeId} is in design page:`, error)
    return false
  }
}

/**
 * Efficiently collect all assets using Framer's optimized APIs
 * This uses getNodesWithAttributeSet which is much faster than tree traversal
 */
export async function collectAllAssetsEfficient(breakpoint: Breakpoint, excludeDesignPages: boolean = true, excludedPageIds: string[] = []): Promise<AssetInfo[]> {
  const assets: AssetInfo[] = []
  
  try {
    debugLog.info('Collecting assets using efficient API...')
    
    // Get all nodes with background images set (most efficient way)
    const nodesWithBackgroundImages = await framer.getNodesWithAttributeSet('backgroundImage')
    debugLog.info(`Found ${nodesWithBackgroundImages.length} nodes with backgroundImage`)
    
    // Use a Map to track unique images by ID
    const uniqueImages = new Map<string, ImageAsset>()
    
    for (const node of nodesWithBackgroundImages) {
      // Skip if node is in a design page
      if (excludeDesignPages && await isNodeInDesignPage(node.id)) {
        continue
      }
      
      // Get the page this node belongs to
      // Note: Nodes from getNodesWithAttributeSet() may not have parent info, so we need to fetch the full node
      let page = null
      try {
        // Fetch the full node to get parent information
        const fullNode = await framer.getNode(node.id)
        if (fullNode) {
          page = await getPageForNode(fullNode.id)
        } else {
          // Fallback: try with the node we have
          page = await getPageForNode(node.id)
        }
      } catch (error) {
        debugLog.warn(`Error getting page for node ${node.id}:`, error)
        // Continue without page info
      }
      
      // Skip if node is in an excluded page
      if (page && excludedPageIds.includes(page.id)) {
        continue
      }
      
      // Use the trait function to ensure type safety
      if (supportsBackgroundImage(node) && node.backgroundImage) {
        const image = node.backgroundImage
        uniqueImages.set(image.id, image)
        
        const dimensions = getNodeDimensions(node)
        
        // Get intrinsic dimensions using ImageAsset.measure()
        let actualDimensions: { width: number; height: number } | undefined
        try {
          const size = await image.measure()
          actualDimensions = { width: size.width, height: size.height }
        } catch {
          // Continue without actual dimensions
        }

        const asset: AssetInfo = {
          nodeId: node.id,
          nodeName: node.name || 'Unnamed',
          type: 'image', // Changed from 'background' to 'image' for consistency
          estimatedBytes: 0,
          dimensions,
          actualDimensions,
          format: detectImageFormat(image.url),
          visible: node.visible !== false,
          url: image.url,
          imageAssetId: image.id,
          pageId: page?.id,
          pageName: page?.name,
          pageUrl: page?.url,
          pageSlug: page?.slug || page?.name // Use slug if available, fallback to name
        }
        
        assets.push(asset)
      }
    }

    debugLog.success(`✅ Collected ${assets.length} unique background images`)
    
    // Also get SVG nodes
    const svgNodes = await framer.getNodesWithType('SVGNode')
    debugLog.info(`Found ${svgNodes.length} SVG nodes`)
    
    for (const node of svgNodes) {
      // Skip if node is in a design page
      if (excludeDesignPages && await isNodeInDesignPage(node.id)) {
        continue
      }
      
      // Get the page this node belongs to
      // Note: Nodes from getNodesWithType() may not have parent info, so we need to fetch the full node
      let page = null
      try {
        // Fetch the full node to get parent information
        const fullNode = await framer.getNode(node.id)
        if (fullNode) {
          page = await getPageForNode(fullNode.id)
        } else {
          // Fallback: try with the node we have
          page = await getPageForNode(node.id)
        }
      } catch (error) {
        debugLog.warn(`Error getting page for SVG node ${node.id}:`, error)
        // Continue without page info
      }
      
      // Skip if node is in an excluded page
      if (page && excludedPageIds.includes(page.id)) {
        continue
      }
      
      if (node.visible !== false) {
        const dimensions = getNodeDimensions(node)
        
        // Try to get SVG content for feature analysis
        let svgContent: string | undefined
        if (node.svg || node.content) {
          svgContent = (node.svg || node.content) as string
        } else if (node.__svgContent) {
          svgContent = node.__svgContent as string
        }
        
        const asset: AssetInfo = {
          nodeId: node.id,
          nodeName: node.name || 'Unnamed',
          type: 'svg',
          estimatedBytes: 0,
          dimensions,
          format: 'svg',
          visible: true,
          svgContent,
          pageId: page?.id,
          pageName: page?.name,
          pageUrl: page?.url,
          pageSlug: page?.slug || page?.name // Use slug if available, fallback to name
        }
        assets.push(asset)
        if (!page) {
          debugLog.warn(`⚠️ No page found for SVG node ${node.name || node.id} - asset will show "Unknown"`)
        }
        debugLog.success(`Found SVG: ${node.name}`, { hasContent: !!svgContent, page: page?.name || 'NO PAGE' })
      }
    }
    
  } catch (error) {
    debugLog.error('Error collecting assets efficiently', error)
    // Fall back to tree traversal
    return collectAllAssets(breakpoint, excludeDesignPages)
  }
  
  return assets
}

export async function collectAllAssets(breakpoint: Breakpoint, excludeDesignPages: boolean = true): Promise<AssetInfo[]> {
  const pages = await getAllPages(excludeDesignPages)
  const allAssets: AssetInfo[] = []

  for (const page of pages) {
    const pageAssets = await traverseNodeTree(page.id, breakpoint)
    allAssets.push(...pageAssets)
  }

  return allAssets
}

export async function collectPageAssets(pageId: string, breakpoint: Breakpoint): Promise<AssetInfo[]> {
  try {
    debugLog.info(`Collecting assets for page: ${pageId}`)
    const pageAssets = await traverseNodeTree(pageId, breakpoint)
    debugLog.success(`Found ${pageAssets.length} assets for page`)
    return pageAssets
  } catch (error) {
    debugLog.error(`Error collecting assets for page ${pageId}`, error)
    return []
  }
}
