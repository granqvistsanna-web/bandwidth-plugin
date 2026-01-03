/**
 * Asset replacement service
 * Handles replacing backgroundImage on nodes with optimized versions
 */

import { framer, supportsBackgroundImage, type CanvasNode } from 'framer-plugin'
import { downloadOptimizedImage } from './imageDownloader'

export interface ReplacementResult {
  success: boolean
  method: 'direct' | 'download'
  message: string
  nodeCount?: number
  downloadTriggered?: boolean
}

/**
 * Find all nodes that use a specific image asset
 */
export async function findAllNodesUsingAsset(imageAssetId: string): Promise<CanvasNode[]> {
  try {
    // Get all nodes with backgroundImage attribute set
    const nodesWithBackgroundImages = await framer.getNodesWithAttributeSet('backgroundImage')
    
    const matchingNodes: CanvasNode[] = []
    
    for (const node of nodesWithBackgroundImages) {
      if (supportsBackgroundImage(node) && node.backgroundImage) {
        if (node.backgroundImage.id === imageAssetId) {
          matchingNodes.push(node)
        }
      }
    }
    
    return matchingNodes
  } catch (error) {
    console.error('Error finding nodes using asset:', error)
    return []
  }
}

/**
 * Replace backgroundImage on a single node
 * Attempts direct replacement, falls back to download if that fails
 */
export async function replaceImageOnNode(
  nodeId: string,
  optimizedImage: Uint8Array,
  format: string,
  originalName: string
): Promise<ReplacementResult> {
  try {
    // Get the node
    const node = await framer.getNode(nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found`)
    }

    // Verify node supports backgroundImage
    if (!supportsBackgroundImage(node)) {
      throw new Error(`Node ${nodeId} does not support backgroundImage`)
    }

    // Validate optimizedImage is a Uint8Array
    if (!(optimizedImage instanceof Uint8Array)) {
      throw new Error('Optimized image must be a Uint8Array')
    }

    // Convert Uint8Array to Data URL string
    // Framer's addImage expects a Data URL string format, not raw Uint8Array
    // Format should already be a MIME type (e.g., "image/webp", "image/jpeg")
    // But handle both cases for safety
    // NOTE: Direct replacement via framer.addImage() has limitations:
    // 1. addImage() creates a canvas Image node, not an ImageAsset usable as backgroundImage
    // 2. The image appears at wrong position/size on canvas
    // 3. setAttributes() doesn't support setting backgroundImage property
    // 
    // For reliability, we'll use the download method which always works
    // The user can then drag the downloaded image onto the node to replace it
    
    console.log('Using download method for reliable image replacement')
    
    try {
      await downloadOptimizedImage(optimizedImage, format, originalName)
      return {
        success: true,
        method: 'download',
        message: 'Image optimized and downloaded. Please replace it manually in Framer.',
        downloadTriggered: true
      }
    } catch (downloadError) {
      console.error('Download also failed:', downloadError)
      throw new Error(`Failed to replace image: Direct replacement failed and download failed: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`)
    }
  } catch (error) {
    console.error('Error replacing image on node:', error)
    
    // If it's not already a ReplacementResult, try download as last resort
    if (error instanceof Error && !error.message.includes('download')) {
      try {
        await downloadOptimizedImage(optimizedImage, format, originalName)
        return {
          success: true,
          method: 'download',
          message: 'Image optimized and downloaded. Please replace it manually in Framer.',
          downloadTriggered: true
        }
      } catch {
        // Both methods failed
        throw error
      }
    }
    
    throw error
  }
}

/**
 * Replace image on all nodes that use a specific asset
 * Attempts direct replacement, falls back to download if that fails
 */
export async function replaceImageEverywhere(
  imageAssetId: string,
  optimizedImage: Uint8Array,
  format: string,
  originalName: string
): Promise<ReplacementResult> {
  try {
    const nodes = await findAllNodesUsingAsset(imageAssetId)
    
    if (nodes.length === 0) {
      return {
        success: false,
        method: 'direct',
        message: 'No nodes found using this image asset'
      }
    }

    // Try direct replacement on first node
    // If it works, try on all nodes. If not, fall back to download
    try {
      const firstResult = await replaceImageOnNode(nodes[0].id, optimizedImage, format, originalName)
      
      if (firstResult.method === 'direct' && firstResult.success) {
        // Direct replacement worked! Try on remaining nodes
        let successCount = 1
        const errors: string[] = []

        for (let i = 1; i < nodes.length; i++) {
          try {
            const result = await replaceImageOnNode(nodes[i].id, optimizedImage, format, originalName)
            if (result.success && result.method === 'direct') {
              successCount++
            } else {
              errors.push(`${nodes[i].name || nodes[i].id}: ${result.message}`)
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            errors.push(`${nodes[i].name || nodes[i].id}: ${errorMessage}`)
            console.error(`Failed to replace image on node ${nodes[i].id}:`, error)
          }
        }

        if (errors.length > 0) {
          console.warn('Some replacements failed:', errors)
        }

        return {
          success: successCount > 0,
          method: 'direct',
          message: successCount === nodes.length 
            ? `Successfully replaced image on all ${successCount} node${successCount > 1 ? 's' : ''}`
            : `Replaced image on ${successCount} of ${nodes.length} nodes`,
          nodeCount: successCount
        }
      } else {
        // Direct replacement failed, use download
        return firstResult
      }
    } catch {
      // Direct replacement failed completely, use download
      console.warn('Direct replacement failed, using download method')
      await downloadOptimizedImage(optimizedImage, format, originalName)
      return {
        success: true,
        method: 'download',
        message: `Image optimized and downloaded. Please replace it manually in Framer (used in ${nodes.length} place${nodes.length > 1 ? 's' : ''}).`,
        nodeCount: nodes.length,
        downloadTriggered: true
      }
    }
  } catch (error) {
    console.error('Error replacing image everywhere:', error)
    throw error instanceof Error ? error : new Error('Unknown error replacing image')
  }
}

/**
 * Check if a node's backgroundImage can be replaced
 * Useful for validation before attempting replacement
 */
export async function canReplaceImage(nodeId: string): Promise<{ canReplace: boolean; reason?: string }> {
  try {
    const node = await framer.getNode(nodeId)
    if (!node) {
      return { canReplace: false, reason: 'Node not found' }
    }

    if (!supportsBackgroundImage(node)) {
      return { canReplace: false, reason: 'Node does not support backgroundImage' }
    }

    if (!node.backgroundImage) {
      return { canReplace: false, reason: 'Node has no backgroundImage' }
    }

    return { canReplace: true }
  } catch (error) {
    return { canReplace: false, reason: error instanceof Error ? error.message : 'Unknown error' }
  }
}

