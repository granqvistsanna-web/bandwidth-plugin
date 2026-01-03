import { framer } from 'framer-plugin'
import type { AssetInfo, Breakpoint } from '../types/analysis'

export async function getAllPages() {
  try {
    const root = await framer.getCanvasRoot()
    console.log('Canvas root:', root)

    // Try to show what we got
    framer.notify(`Canvas root type: ${root?.type || 'unknown'}`, { durationMs: 3000 })

    // getCanvasRoot returns a single node, we need to get its children (the pages)
    if (!root) {
      console.error('No canvas root found')
      framer.notify('No canvas root found!', { variant: 'error' })
      return []
    }

    // Get all child pages from the root
    const pages = await framer.getChildren(root.id)
    console.log('Found pages:', pages.length, pages)

    framer.notify(`Found ${pages.length} pages`, { durationMs: 3000 })

    return pages
  } catch (error) {
    console.error('Error getting canvas root:', error)
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

    // Show what type of node we're looking at (first level only)
    if (currentDepth === 0) {
      framer.notify(`Scanning node: ${node.name || 'unnamed'} (${node.type || 'unknown type'})`, { durationMs: 2000 })
    }

    // Extract asset info from current node
    const asset = await extractAssetInfo(node)
    if (asset) {
      assets.push(asset)
      framer.notify(`✓ Found asset: ${asset.nodeName}`, { variant: 'success', durationMs: 1500 })
    }

    // Get children and process them
    const children = await framer.getChildren(nodeId)

    if (currentDepth === 0) {
      framer.notify(`Node has ${children.length} children`, { durationMs: 2000 })
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

    if (currentDepth === 0 && assets.length > 0) {
      framer.notify(`Total assets found: ${assets.length}`, { variant: 'success', durationMs: 3000 })
    }
  } catch (error) {
    console.error(`Error traversing node ${nodeId}:`, error)
    framer.notify(`Error scanning: ${error}`, { variant: 'error' })
  }

  return assets
}

async function extractAssetInfo(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: any
): Promise<AssetInfo | null> {
  try {
    // LOG EVERYTHING about this node
    console.log('=== CHECKING NODE ===')
    console.log('Node name:', node.name)
    console.log('Node type/class:', node.type, node.__class, node.constructor?.name)
    console.log('Has background?', !!node.background)
    console.log('Has image?', !!node.image)
    console.log('Node keys:', Object.keys(node).slice(0, 20))
    console.log('Full node:', node)

    // Check if node is visible
    if (node.visible === false) {
      console.log('→ Node is invisible, skipping')
      return null
    }

    // Check if node has image background
    if (node.background && Array.isArray(node.background)) {
      for (const bg of node.background) {
        if (bg.type === 'image' && bg.src) {
          const dimensions = getNodeDimensions(node, breakpoint)
          return {
            nodeId: node.id,
            nodeName: node.name || 'Unnamed',
            type: 'background',
            estimatedBytes: 0, // Will be calculated later
            dimensions,
            format: detectImageFormat(bg.src),
            visible: true,
            url: bg.src
          }
        }
      }
    }

    // Check if node type is image-related
    if (node.__class === 'FrameNode' && node.image) {
      const dimensions = getNodeDimensions(node, breakpoint)
      return {
        nodeId: node.id,
        nodeName: node.name || 'Unnamed',
        type: 'image',
        estimatedBytes: 0,
        dimensions,
        format: detectImageFormat(node.image),
        visible: true,
        url: node.image
      }
    }

    // Check for SVG nodes
    if (node.__class === 'SVGNode') {
      const dimensions = getNodeDimensions(node, breakpoint)
      return {
        nodeId: node.id,
        nodeName: node.name || 'Unnamed',
        type: 'svg',
        estimatedBytes: 0,
        dimensions,
        format: 'svg',
        visible: true
      }
    }

    return null
  } catch (error) {
    console.error('Error extracting asset info:', error)
    return null
  }
}

function getNodeDimensions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: any
): { width: number; height: number } {
  // Try to get node dimensions
  // Framer nodes should have width and height properties
  const width = node.width || 0
  const height = node.height || 0

  console.log('Node dimensions for', node.name || 'unnamed', ':', width, 'x', height, 'node:', node)

  return { width, height }
}

function detectImageFormat(url: string): string {
  if (!url) return 'unknown'

  // Try URL extension
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0]
  if (ext && ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext)) {
    return ext === 'jpg' ? 'jpeg' : ext
  }

  // Check for data URL
  if (url.startsWith('data:image/')) {
    const format = url.match(/data:image\/([a-z]+)/)?.[1]
    if (format) return format
  }

  // Framer asset URLs might have patterns
  if (url.includes('framerusercontent')) {
    // Default to common formats
    return 'jpeg'
  }

  return 'unknown'
}

export async function collectAllAssets(breakpoint: Breakpoint): Promise<AssetInfo[]> {
  const pages = await getAllPages()
  const allAssets: AssetInfo[] = []

  for (const page of pages) {
    const pageAssets = await traverseNodeTree(page.id, breakpoint)
    allAssets.push(...pageAssets)
  }

  return allAssets
}
