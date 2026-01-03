/**
 * CMS Asset Detection using Official Framer Plugin API v3.0
 * 
 * IMPORTANT: This module uses the official Framer CMS API - no extra installation needed.
 * 
 * Requirements:
 * 1. Plugin must call CMS API methods explicitly: framer.getCollections(), collection.getItems(), collection.getFields()
 * 2. CMS collections must exist in the project with image/file fields
 * 3. Field values are asset objects (ImageAsset/FileAsset), NOT strings - must use isImageAsset()/isFileAsset()
 * 4. Plugin runs in canvas mode - CMS API is available as long as methods are called correctly
 * 
 * The CMS API is available in framer-plugin v3.0+ and does NOT require a separate "cms" mode.
 * Canvas mode can access CMS data by explicitly calling the CMS API entry points.
 */

import { framer } from 'framer-plugin'
import type { AssetInfo } from '../types/analysis'
import { debugLog } from '../utils/debugLog'

export interface CMSCollection {
  id: string
  name: string
  itemCount?: number
  fieldNames?: string[] // Field names that might contain assets
}

export interface CMSItem {
  id: string
  collectionId: string
  collectionName: string
  fields?: Record<string, unknown> // CMS item fields
}

export interface CMSAsset {
  id: string
  collectionId: string
  collectionName: string
  itemId?: string // CMS item ID this asset belongs to
  estimatedBytes: number
  estimatedDimensions?: { width: number; height: number }
  format?: string
  isManualEstimate: boolean
  manualEstimateNote?: string
  url?: string // Asset URL (if found)
  fieldName?: string // Field name in CMS item
  status: 'found' | 'not_found' | 'estimated' // Status of asset detection
}

export interface CMSBandwidthImpact {
  totalCMSBytes: number
  estimatedPageviews: number
  itemsPerPage: number
  monthlyBandwidth: number
  assumptions: {
    avgFileSize: number
    itemsPerPage: number
    pageviewsPerMonth: number
  }
}

/**
 * Detect CMS collections using official Framer API
 * Uses framer.getCollections() from API 3.0
 */
export async function detectCMSCollections(): Promise<CMSCollection[]> {
  const collections: CMSCollection[] = []
  
  try {
    // Use official Framer CMS API - getCollections() is available in Plugin API v3.0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const framerAny = framer as any
    
    // Explicitly call the CMS API entry point
    if (typeof framerAny.getCollections === 'function') {
      debugLog.info('📦 Calling framer.getCollections() to access CMS...')
      const apiCollections = await framerAny.getCollections()
      if (Array.isArray(apiCollections)) {
        for (const collection of apiCollections) {
          // Get fields to identify image/file fields
          let fieldNames: string[] = []
          try {
            if (typeof collection.getFields === 'function') {
              const fields = await collection.getFields()
              if (Array.isArray(fields)) {
                fieldNames = fields
                  .filter((field: any) => {
                    // Check if field is image or file type
                    const fieldType = field.type || field.fieldType
                    return fieldType === 'image' || fieldType === 'file' || fieldType === 'ImageAsset' || fieldType === 'FileAsset'
                  })
                  .map((field: any) => field.name || field.key)
              }
            }
          } catch (error) {
            debugLog.warn(`Could not get fields for collection ${collection.name}:`, error)
          }
          
          collections.push({
            id: collection.id || collection.name,
            name: collection.name || 'Unnamed Collection',
            itemCount: collection.itemCount || 0,
            fieldNames: fieldNames.length > 0 ? fieldNames : undefined
          })
        }
        debugLog.success(`✅ Found ${collections.length} CMS collections via official API`)
        return collections
      }
    }
    
    // Fallback: Try to find collections by looking for nodes with collectionId attribute
    debugLog.info('⚠️ Official CMS API not available, trying heuristic detection...')
    const nodesWithCollection = await framer.getNodesWithAttributeSet('collectionId')
    
    const collectionMap = new Map<string, CMSCollection>()
    
    for (const node of nodesWithCollection) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodeAny = node as any
      const collectionId = nodeAny.collectionId || nodeAny.__collectionId
      const collectionName = nodeAny.collectionName || nodeAny.__collectionName || 'CMS Collection'
      
      if (collectionId && !collectionMap.has(collectionId)) {
        collectionMap.set(collectionId, {
          id: collectionId,
          name: collectionName,
          itemCount: 0 // We don't know the count without API access
        })
      }
    }
    
    collections.push(...Array.from(collectionMap.values()))
    debugLog.info(`Found ${collections.length} CMS collections via heuristic detection`)
  } catch (error) {
    debugLog.warn('Error detecting CMS collections:', error)
  }
  
  return collections
}

/**
 * Collect CMS items from collections using official Framer API
 * Uses collection.getItems() to get items with fieldData
 */
export async function collectCMSItems(collections: CMSCollection[]): Promise<Array<{ collectionId: string; items: any[] }>> {
  const results: Array<{ collectionId: string; items: any[] }> = []
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const framerAny = framer as any
    
    // Get all collections from API
    if (typeof framerAny.getCollections === 'function') {
      const apiCollections = await framerAny.getCollections()
      
      for (const collection of collections) {
        // Find matching API collection
        const apiCollection = apiCollections.find((c: any) => 
          (c.id === collection.id) || (c.name === collection.name)
        )
        
        if (apiCollection && typeof apiCollection.getItems === 'function') {
          try {
            const items = await apiCollection.getItems()
            if (Array.isArray(items)) {
              results.push({
                collectionId: collection.id,
                items: items
              })
              debugLog.success(`✅ Collected ${items.length} items from collection: ${collection.name}`)
            }
          } catch (error) {
            debugLog.warn(`Could not get items from collection ${collection.name}:`, error)
          }
        }
      }
    }
  } catch (error) {
    debugLog.warn('Error collecting CMS items:', error)
  }
  
  return results
}

/**
 * Extract assets from CMS items using official Framer API helpers
 * Uses isImageAsset() and isFileAsset() from the API, and asset.measure() for dimensions
 */
export async function extractAssetsFromCMSItems(
  cmsItems: Array<{ collectionId: string; items: any[] }>
): Promise<CMSAsset[]> {
  const assets: CMSAsset[] = []
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const framerAny = framer as any
    
    // Use official Framer API helpers - isImageAsset() and isFileAsset() are provided by the API
    // These are the correct way to check if a field value is an image or file asset
    const isImageAsset = framerAny.isImageAsset || ((value: any): boolean => {
      if (!value || typeof value !== 'object') return false
      // Check for ImageAsset properties - CMS fields return asset objects, not strings
      return typeof value.url === 'string' && (
        value.__class === 'ImageAsset' ||
        value.type === 'ImageAsset' ||
        'measure' in value ||
        'loadBitmap' in value
      )
    })
    
    const isFileAsset = framerAny.isFileAsset || ((value: any): boolean => {
      if (!value || typeof value !== 'object') return false
      // Check for FileAsset properties - CMS fields return asset objects, not strings
      return typeof value.url === 'string' && (
        value.__class === 'FileAsset' ||
        value.type === 'FileAsset'
      )
    })
    
    debugLog.info('📦 Using isImageAsset() and isFileAsset() helpers from Framer API')
    
    // Get collection names for better asset naming
    const collectionMap = new Map<string, string>()
    try {
      if (typeof framerAny.getCollections === 'function') {
        const apiCollections = await framerAny.getCollections()
        for (const apiCollection of apiCollections) {
          collectionMap.set(apiCollection.id || apiCollection.name, apiCollection.name || 'Unnamed Collection')
        }
      }
    } catch (error) {
      debugLog.warn('Could not get collection names:', error)
    }
    
    for (const { collectionId, items } of cmsItems) {
      const collectionName = collectionMap.get(collectionId) || collectionId
      
      for (const item of items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itemAny = item as any
        const fieldData = itemAny.fieldData || itemAny.data || {}
        const itemId = itemAny.id || itemAny.slug || 'unknown'
        
        // Iterate through all fields in fieldData
        // fieldData contains the actual CMS field values - they are asset objects, not strings
        for (const [fieldName, fieldValue] of Object.entries(fieldData)) {
          // CRITICAL: Use official API helpers to check if field value is an image or file asset
          // CMS fields return asset objects, not plain text URLs - must use isImageAsset()/isFileAsset()
          if (isImageAsset(fieldValue) || isFileAsset(fieldValue)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const asset = fieldValue as any
            const imageUrl = asset.url
            
            if (imageUrl && typeof imageUrl === 'string') {
              // Try to get actual dimensions and bytes using ImageAsset.measure()
              let estimatedDimensions = { width: 0, height: 0 }
              let estimatedBytes = 0
              
              // Use official API to measure the image if it's an ImageAsset
              if (isImageAsset(asset) && typeof asset.measure === 'function') {
                try {
                  const size = await asset.measure()
                  estimatedDimensions = { width: size.width, height: size.height }
                  estimatedBytes = estimateImageBytes(estimatedDimensions)
                  debugLog.info(`✅ Measured CMS image: ${collectionName} → ${fieldName} (${size.width}×${size.height}, ${(estimatedBytes / 1024).toFixed(1)} KB)`)
                } catch (error) {
                  debugLog.warn(`Could not measure CMS image ${fieldName}:`, error)
                  // Fall back to URL-based estimation
                  estimatedDimensions = await estimateImageDimensions(imageUrl)
                  estimatedBytes = estimateImageBytes(estimatedDimensions)
                }
              } else {
                // Fall back to URL-based estimation
                estimatedDimensions = await estimateImageDimensions(imageUrl)
                estimatedBytes = estimateImageBytes(estimatedDimensions)
              }
              
              assets.push({
                id: `cms-${collectionId}-${itemId}-${fieldName}`,
                collectionId,
                collectionName,
                itemId,
                estimatedBytes,
                estimatedDimensions,
                format: detectImageFormat(imageUrl),
                isManualEstimate: false,
                url: imageUrl,
                status: 'found',
                fieldName
              })
            }
          }
        }
      }
    }
    
    const totalItems = cmsItems.reduce((sum, c) => sum + c.items.length, 0)
    debugLog.success(`✅ Extracted ${assets.length} assets from ${totalItems} CMS items using official API`)
  } catch (error) {
    debugLog.warn('Error extracting assets from CMS items:', error)
  }
  
  return assets
}

/**
 * Collect CMS assets using heuristic detection (fallback method)
 * This is used when the official API is not available or as a supplement
 */
export async function collectCMSAssets(): Promise<CMSAsset[]> {
  const allAssets: CMSAsset[] = []
  
  try {
    // Method 1: Check component controls for CMS-like data (like Team Card with image controls)
    debugLog.info('🔍 Checking component controls for CMS data...')
    try {
      const allFrames = await framer.getNodesWithType('Frame')
      let componentCMSAssets = 0

      for (const frame of allFrames) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const frameAny = frame as any

        // Check if this component has controls that look like CMS data
        if (frameAny.controls && typeof frameAny.controls === 'object') {
          const controls = frameAny.controls

          // Look for image fields in controls
          for (const [key, value] of Object.entries(controls)) {
            if (value && typeof value === 'object') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const controlValue = value as any

              // Check if this control has an image src/url
              if (controlValue.src || controlValue.url || controlValue.value) {
                let imageUrl: string | undefined

                if (controlValue.src) {
                  imageUrl = typeof controlValue.src === 'string' ? controlValue.src : undefined
                } else if (controlValue.url) {
                  imageUrl = typeof controlValue.url === 'string' ? controlValue.url : undefined
                } else if (controlValue.value && typeof controlValue.value === 'string' && controlValue.value.startsWith('data:framer/asset-reference')) {
                  // Framer asset reference - extract the URL
                  const match = controlValue.value.match(/https:\/\/[^\s]+/)
                  imageUrl = match ? match[0] : undefined
                }

                if (imageUrl && imageUrl.startsWith('http')) {
                  // This looks like a CMS image in component controls
                  const estimatedDimensions = controlValue.pixelWidth && controlValue.pixelHeight
                    ? { width: controlValue.pixelWidth, height: controlValue.pixelHeight }
                    : await estimateImageDimensions(imageUrl)
                  const estimatedBytes = estimateImageBytes(estimatedDimensions)

                  allAssets.push({
                    id: `cms-component-${frame.id}-${key}`,
                    collectionId: 'component-controls',
                    collectionName: frame.name || 'Component Controls',
                    estimatedBytes,
                    estimatedDimensions,
                    format: detectImageFormat(imageUrl),
                    isManualEstimate: false,
                    url: imageUrl,
                    status: 'found',
                    fieldName: key
                  })

                  componentCMSAssets++
                  debugLog.info(`Found CMS asset in component controls: ${frame.name} → ${key} (${(estimatedBytes / 1024).toFixed(1)} KB)`)
                }
              }
            }
          }
        }
      }

      debugLog.info(`Found ${componentCMSAssets} CMS assets in component controls`)
    } catch (error) {
      debugLog.warn('Error checking component controls:', error)
    }
  } catch (error) {
    debugLog.warn('Error collecting CMS assets:', error)
  }
  
  return allAssets
}

/**
 * Convert CMS assets to AssetInfo format for analysis
 */
export function convertCMSAssetsToAssetInfo(cmsAssets: CMSAsset[]): AssetInfo[] {
  return cmsAssets.map((cmsAsset, index) => ({
    nodeId: cmsAsset.id || `cms-${index}`,
    nodeName: cmsAsset.isManualEstimate
      ? `CMS (Manual): ${cmsAsset.collectionName}`
      : `CMS: ${cmsAsset.collectionName}${cmsAsset.fieldName ? ` → ${cmsAsset.fieldName}` : ''}`,
    type: 'image' as const,
    estimatedBytes: cmsAsset.estimatedBytes,
    dimensions: cmsAsset.estimatedDimensions || { width: 0, height: 0 },
    format: cmsAsset.format,
    visible: true,
    isCMSAsset: true,
    isManualEstimate: cmsAsset.isManualEstimate,
    manualEstimateNote: cmsAsset.manualEstimateNote,
    cmsCollectionName: cmsAsset.collectionName,
    cmsStatus: cmsAsset.status,
    url: cmsAsset.url
  }))
}

/**
 * Extract CMS assets from published site by comparing published images with canvas images
 * Images that appear in the published site but not in the canvas are likely CMS assets
 */
export async function extractCMSAssetsFromPublishedSite(
  publishedImages: Array<{ url: string; actualBytes: number }>,
  canvasImageUrls: Set<string>
): Promise<CMSAsset[]> {
  const cmsAssets: CMSAsset[] = []
  
  try {
    debugLog.info(`Comparing ${publishedImages.length} published images with ${canvasImageUrls.size} canvas images`)
    
    // Group CMS assets by collection for better organization
    const cmsAssetsByCollection = new Map<string, CMSAsset[]>()
    
    // Find images that are in published site but not in canvas
    for (const publishedImage of publishedImages) {
      // Skip if no bytes (invalid image)
      if (publishedImage.actualBytes === 0) {
        continue
      }
      
      // Normalize URLs for comparison
      const normalizedPublishedUrl = normalizeImageUrl(publishedImage.url)
      
      // Check if this image is already in canvas assets
      let foundInCanvas = false
      for (const canvasUrl of canvasImageUrls) {
        const normalizedCanvasUrl = normalizeImageUrl(canvasUrl)
        
        // More flexible matching - check if URLs are similar
        if (normalizedPublishedUrl === normalizedCanvasUrl) {
          foundInCanvas = true
          break
        }
        
        // Also check if one URL contains the other (for CDN variations)
        // Extract just the path/filename for comparison
        const publishedPath = extractPathFromUrl(normalizedPublishedUrl)
        const canvasPath = extractPathFromUrl(normalizedCanvasUrl)
        
        if (publishedPath && canvasPath && (publishedPath === canvasPath || publishedPath.includes(canvasPath) || canvasPath.includes(publishedPath))) {
          foundInCanvas = true
          break
        }
        
        // Also check if the image IDs match (Framer CDN URLs often have image IDs)
        const publishedImageId = extractImageIdFromUrl(publishedImage.url)
        const canvasImageId = extractImageIdFromUrl(canvasUrl)
        if (publishedImageId && canvasImageId && publishedImageId === canvasImageId) {
          foundInCanvas = true
          break
        }
      }
      
      // If not found in canvas, it's likely a CMS asset
      if (!foundInCanvas) {
        const collectionName = extractCollectionNameFromUrl(publishedImage.url)
        const estimatedDimensions = estimateDimensionsFromBytes(publishedImage.actualBytes)
        
        const cmsAsset: CMSAsset = {
          id: `cms-published-${cmsAssets.length}`,
          collectionId: collectionName.toLowerCase().replace(/\s+/g, '-'),
          collectionName,
          estimatedBytes: publishedImage.actualBytes,
          estimatedDimensions,
          format: detectImageFormat(publishedImage.url),
          isManualEstimate: false,
          url: publishedImage.url,
          status: 'found'
        }
        
        // Group by collection
        if (!cmsAssetsByCollection.has(collectionName)) {
          cmsAssetsByCollection.set(collectionName, [])
        }
        cmsAssetsByCollection.get(collectionName)!.push(cmsAsset)
        cmsAssets.push(cmsAsset)
        
        debugLog.info(`Found CMS asset: ${publishedImage.url.substring(0, 60)} (${(publishedImage.actualBytes / 1024).toFixed(1)} KB) → ${collectionName}`)
      }
    }
    
    // Log collection summary
    if (cmsAssetsByCollection.size > 0) {
      debugLog.info(`CMS Assets by Collection:`)
      for (const [collectionName, assets] of cmsAssetsByCollection.entries()) {
        const totalBytes = assets.reduce((sum, a) => sum + a.estimatedBytes, 0)
        debugLog.info(`   - ${collectionName}: ${assets.length} assets (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`)
      }
    }
    
    debugLog.info(`Extracted ${cmsAssets.length} CMS assets from published site (${publishedImages.length - cmsAssets.length} were already in canvas)`)
  } catch (error) {
    debugLog.warn('Error extracting CMS assets from published site:', error)
  }
  
  return cmsAssets
}

/**
 * Calculate bandwidth impact of CMS assets
 */
export function calculateCMSBandwidthImpact(
  cmsAssets: CMSAsset[],
  assumptions?: {
    itemsPerPage?: number
    pageviewsPerMonth?: number
  }
): CMSBandwidthImpact {
  const totalCMSBytes = cmsAssets.reduce((sum, asset) => sum + asset.estimatedBytes, 0)
  const avgFileSize = cmsAssets.length > 0 ? totalCMSBytes / cmsAssets.length : 0
  const itemsPerPage = assumptions?.itemsPerPage || 10
  const pageviewsPerMonth = assumptions?.pageviewsPerMonth || 10000
  
  // Estimate: each pageview loads X items, each item has Y assets
  // For simplicity, assume 1 asset per item on average
  const monthlyBandwidth = (avgFileSize * itemsPerPage * pageviewsPerMonth)
  
  return {
    totalCMSBytes,
    estimatedPageviews: pageviewsPerMonth,
    itemsPerPage,
    monthlyBandwidth,
    assumptions: {
      avgFileSize,
      itemsPerPage,
      pageviewsPerMonth
    }
  }
}

// Helper functions

/**
 * Extract image ID from Framer CDN URL for comparison
 * Framer URLs often have format: .../images/IMAGE_ID.png?width=...
 */
function extractImageIdFromUrl(url: string): string | null {
  try {
    // Look for Framer image ID pattern
    const match = url.match(/images\/([a-zA-Z0-9]+)\.(png|jpg|jpeg|webp|gif|avif)/i)
    if (match && match[1]) {
      return match[1]
    }
    
    // Also check for asset reference IDs
    const assetRefMatch = url.match(/asset-reference,([a-zA-Z0-9]+)/)
    if (assetRefMatch && assetRefMatch[1]) {
      return assetRefMatch[1]
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Extract just the path/filename from a URL for comparison
 */
function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.pathname.toLowerCase()
  } catch {
    // If URL parsing fails, try to extract path manually
    const match = url.match(/\/[^?#]+/)
    return match ? match[0].toLowerCase() : null
  }
}

/**
 * Normalize image URL for comparison (remove query params, normalize protocol)
 */
function normalizeImageUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // Remove query params and hash for comparison
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`.toLowerCase()
  } catch {
    // If URL parsing fails, return lowercase version
    return url.toLowerCase()
  }
}

/**
 * Extract collection name from URL (heuristic)
 * Looks for common CMS URL patterns including blog, posts, articles, etc.
 */
function extractCollectionNameFromUrl(url: string): string {
  const urlLower = url.toLowerCase()
  
  // Common CMS URL patterns - expanded to include blog, posts, articles, etc.
  const patterns = [
    /\/blog\/([^\/]+)/,
    /\/posts\/([^\/]+)/,
    /\/articles\/([^\/]+)/,
    /\/news\/([^\/]+)/,
    /\/cms\/([^\/]+)/,
    /\/collection\/([^\/]+)/,
    /\/content\/([^\/]+)/,
    /\/uploads\/([^\/]+)/,
    /\/media\/([^\/]+)/,
    /\/assets\/([^\/]+)/,
    /\/images\/([^\/]+)/,
    /\/blog-images\/([^\/]+)/,
    /\/post-images\/([^\/]+)/
  ]
  
  for (const pattern of patterns) {
    const match = urlLower.match(pattern)
    if (match && match[1]) {
      const collectionName = match[1].split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
      
      // If we found a specific pattern, use it
      if (pattern.source.includes('blog') || pattern.source.includes('post') || pattern.source.includes('article')) {
        return collectionName
      }
    }
  }
  
  // Check for common CMS collection indicators in the URL path
  if (urlLower.includes('/blog') || urlLower.includes('blog-')) {
    return 'Blog'
  }
  if (urlLower.includes('/post') || urlLower.includes('post-')) {
    return 'Posts'
  }
  if (urlLower.includes('/article') || urlLower.includes('article-')) {
    return 'Articles'
  }
  if (urlLower.includes('/news') || urlLower.includes('news-')) {
    return 'News'
  }
  if (urlLower.includes('/product') || urlLower.includes('product-')) {
    return 'Products'
  }
  if (urlLower.includes('/team') || urlLower.includes('team-')) {
    return 'Team'
  }
  if (urlLower.includes('/testimonial') || urlLower.includes('testimonial-')) {
    return 'Testimonials'
  }
  
  // Default to generic name
  return 'CMS Collection'
}

/**
 * Estimate image dimensions from bytes (heuristic)
 */
function estimateDimensionsFromBytes(bytes: number): { width: number; height: number } {
  // Rough estimate: assume JPEG compression ratio of ~0.1 (10% of uncompressed)
  // For a typical photo, bytes ≈ width × height × 0.1
  const estimatedPixels = bytes / 0.1
  const estimatedSide = Math.sqrt(estimatedPixels)
  
  // Round to reasonable dimensions
  return {
    width: Math.round(estimatedSide),
    height: Math.round(estimatedSide * 0.75) // Assume 4:3 aspect ratio
  }
}

/**
 * Estimate image bytes from dimensions (heuristic)
 */
function estimateImageBytes(dimensions: { width: number; height: number }): number {
  // Rough estimate: assume JPEG compression ratio of ~0.1
  // bytes ≈ width × height × 0.1
  return Math.round(dimensions.width * dimensions.height * 0.1)
}

/**
 * Estimate image dimensions from URL (heuristic)
 */
async function estimateImageDimensions(url: string): Promise<{ width: number; height: number }> {
  // Try to extract dimensions from URL (some CDNs include dimensions)
  const dimensionMatch = url.match(/(\d+)x(\d+)/i)
  if (dimensionMatch) {
    return {
      width: parseInt(dimensionMatch[1], 10),
      height: parseInt(dimensionMatch[2], 10)
    }
  }
  
  // Try to fetch and measure (if CORS allows)
  try {
    const img = new Image()
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      img.onload = () => resolve({ width: img.width, height: img.height })
      img.onerror = reject
      img.src = url
      setTimeout(() => reject(new Error('Timeout')), 5000)
    })
    return dimensions
  } catch {
    // Fall back to default estimate
    return { width: 1920, height: 1080 }
  }
}

/**
 * Detect image format from URL
 */
function detectImageFormat(url: string): string {
  const urlLower = url.toLowerCase()
  if (urlLower.includes('.webp') || urlLower.includes('/webp')) return 'webp'
  if (urlLower.includes('.avif') || urlLower.includes('/avif')) return 'avif'
  if (urlLower.includes('.png')) return 'png'
  if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) return 'jpeg'
  if (urlLower.includes('.gif')) return 'gif'
  if (urlLower.includes('.svg')) return 'svg'
  return 'unknown'
}
