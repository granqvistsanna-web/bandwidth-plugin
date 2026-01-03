import { framer, supportsBackgroundImage, type ImageAsset } from 'framer-plugin'
import type { AssetInfo, Breakpoint } from '../types/analysis'
import { debugLog } from '../utils/debugLog'

/**
 * Check if a page is a design page (should be excluded from analysis)
 * Design pages are typically:
 * - Named with "Design", "Component", "Template", "Style" prefixes
 * - Used for design system components, not actual pages
 */
function isDesignPage(page: { name?: string; type?: string }): boolean {
  if (!page.name) return false
  
  const name = page.name.toLowerCase().trim()
  
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
  
  // Check if page name starts with any design pattern
  return designPagePatterns.some(pattern => name.startsWith(pattern))
}

export async function getAllPages(excludeDesignPages: boolean = true) {
  try {
    const root = await framer.getCanvasRoot()
    debugLog.info(`Canvas root found: ${root?.type || 'unknown'}`, root)

    // getCanvasRoot returns a single node, we need to get its children (the pages)
    if (!root) {
      debugLog.error('No canvas root found')
      framer.notify('No canvas root found!', { variant: 'error' })
      return []
    }

    // Get all child pages from the root
    const allPages = await framer.getChildren(root.id)
    
    // Filter out design pages if requested
    const pages = excludeDesignPages 
      ? allPages.filter(page => !isDesignPage(page))
      : allPages
    
    const excludedCount = allPages.length - pages.length
    if (excludedCount > 0) {
      debugLog.info(`Excluded ${excludedCount} design page(s) from analysis`)
    }
    
    debugLog.success(`Found ${pages.length} page(s) for analysis`, pages.map(p => p.name || p.id))

    return pages
  } catch (error) {
    debugLog.error('Error getting canvas root', error)
    framer.notify(`Error: ${error}`, { variant: 'error' })
    return []
  }
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
      debugLog.success(`Found asset: ${asset.nodeName} (${asset.type})`, {
        nodeId: asset.nodeId,
        url: asset.url,
        dimensions: asset.dimensions
      })
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
    debugLog.error(`Error traversing node ${nodeId}`, error)
    // Only show critical errors, not every traversal error
    if (currentDepth === 0) {
    framer.notify(`Error scanning: ${error}`, { variant: 'error' })
    }
  }

  return assets
}

async function extractAssetInfo(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: any,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fullNodeStructure: any = {}
      for (const key of Object.keys(node)) {
        if (key.startsWith('__')) continue
        const value = node[key]
        if (typeof value === 'string' && value.length > 100) {
          fullNodeStructure[key] = value.substring(0, 100) + '...'
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const objValue = value as any
          fullNodeStructure[key] = { 
            type: 'object',
            keys: Object.keys(objValue).slice(0, 20),
            sample: JSON.stringify(objValue).substring(0, 200)
          }
        } else if (Array.isArray(value)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const arrValue = value as any[]
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
          debugLog.info(`Measured image: ${node.name}`, actualDimensions)
        } catch (error) {
          debugLog.warn(`Failed to measure image: ${node.name}`, error)
          // Continue without actual dimensions
        }
        
        debugLog.success(`Found backgroundImage: ${node.name}`, { url: imageUrl, type: node.type })
      return {
        nodeId: node.id,
        nodeName: node.name || 'Unnamed',
          type: 'background',
        estimatedBytes: 0,
        dimensions,
          actualDimensions,
          format: detectImageFormat(imageUrl),
        visible: true,
          url: imageUrl,
          imageAssetId: image.id
        }
      }
    }

    // Check for SVG type nodes
    if (node.type === 'SVG' || node.type === 'svg' || node.__class === 'SVGNode') {
      // Try to get SVG content for feature analysis
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodeAny = node as any
      let svgContent: string | undefined
      if (nodeAny.svg || nodeAny.content) {
        svgContent = nodeAny.svg || nodeAny.content
      } else if (nodeAny.__svgContent) {
        svgContent = nodeAny.__svgContent
      }
      
      return {
        nodeId: node.id,
        nodeName: node.name || 'Unnamed',
        type: 'svg',
        estimatedBytes: 0,
        dimensions,
        format: 'svg',
        visible: true,
        svgContent
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: any
): { width: number; height: number } {
  // Try to get node dimensions
  // Framer nodes should have width and height properties
  // These might be numbers, strings with units (px, %, fr), or CSS values (fit-content, auto)
  
  const parseDimension = (value: any): number => {
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

/**
 * Check if a node belongs to a design page by traversing up the parent chain
 */
async function isNodeInDesignPage(nodeId: string): Promise<boolean> {
  try {
    const node = await framer.getNode(nodeId)
    if (!node) return false
    
    // If this node is a page, check if it's a design page
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeAny = node as any
    if (nodeAny.type === 'Page' || nodeAny.type === 'PageNode' || node.type === 'Page') {
      return isDesignPage(node)
    }
    
    // Traverse up the parent chain to find the page
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = node
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
export async function collectAllAssetsEfficient(breakpoint: Breakpoint, excludeDesignPages: boolean = true): Promise<AssetInfo[]> {
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
      
      // Use the trait function to ensure type safety
      if (supportsBackgroundImage(node) && node.backgroundImage) {
        const image = node.backgroundImage
        uniqueImages.set(image.id, image)
        
        const dimensions = getNodeDimensions(node)
        const asset: AssetInfo = {
          nodeId: node.id,
          nodeName: node.name || 'Unnamed',
          type: 'background',
          estimatedBytes: 0,
          dimensions,
          format: detectImageFormat(image.url),
          visible: node.visible !== false,
          url: image.url,
          imageAssetId: image.id
        }
        
        assets.push(asset)
        debugLog.success(`Found backgroundImage: ${node.name}`, { url: image.url })
      }
    }
    
    debugLog.success(`Collected ${assets.length} unique background images`)
    
    // Also get SVG nodes
    const svgNodes = await framer.getNodesWithType('SVGNode')
    debugLog.info(`Found ${svgNodes.length} SVG nodes`)
    
    for (const node of svgNodes) {
      // Skip if node is in a design page
      if (excludeDesignPages && await isNodeInDesignPage(node.id)) {
        continue
      }
      
      if (node.visible !== false) {
        const dimensions = getNodeDimensions(node)
        
        // Try to get SVG content for feature analysis
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nodeAny = node as any
        let svgContent: string | undefined
        if (nodeAny.svg || nodeAny.content) {
          svgContent = nodeAny.svg || nodeAny.content
        } else if (nodeAny.__svgContent) {
          svgContent = nodeAny.__svgContent
        }
        
        const asset: AssetInfo = {
          nodeId: node.id,
          nodeName: node.name || 'Unnamed',
          type: 'svg',
          estimatedBytes: 0,
          dimensions,
          format: 'svg',
          visible: true,
          svgContent
        }
        assets.push(asset)
        debugLog.success(`Found SVG: ${node.name}`, { hasContent: !!svgContent })
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
