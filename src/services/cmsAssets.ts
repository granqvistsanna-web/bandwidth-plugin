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
import type { FramerAPIWithCMS, FramerCMSCollection, FramerCMSItem, FramerCMSField, FramerCMSFieldValue, ImageAsset, FileAsset, ExtendedCanvasNode } from '../types/framer'
import { debugLog } from '../utils/debugLog'
import { handleServiceError, withEmptyArrayFallback, ErrorCode } from '../utils/errorHandler'

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
  itemSlug?: string // CMS item slug (route like "my-blog-post")
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
 * Diagnostic function to inspect Framer API structure
 */
async function diagnoseFramerAPI(): Promise<void> {
  const framerAPI = framer as unknown as FramerAPIWithCMS
  
  debugLog.info('🔍 DIAGNOSTIC: Inspecting Framer API structure...')
  debugLog.info('🔍 framer object keys:', Object.keys(framer).slice(0, 20))
  debugLog.info('🔍 framer.getCollections type:', typeof framerAPI.getCollections)
  debugLog.info('🔍 framer.getActiveCollection type:', typeof framerAPI.getActiveCollection)
  
  // Try to call and see what happens
  try {
    if (typeof framerAPI.getCollections === 'function') {
      const result = await framerAPI.getCollections()
      debugLog.info('🔍 getCollections() result type:', typeof result)
      debugLog.info('🔍 getCollections() is array:', Array.isArray(result))
      if (Array.isArray(result) && result.length > 0) {
        const firstCollection = result[0] as FramerCMSCollection
        debugLog.info('🔍 First collection structure:', {
          keys: Object.keys(firstCollection),
          hasGetItems: typeof firstCollection.getItems === 'function',
          hasGetFields: typeof firstCollection.getFields === 'function',
          name: firstCollection.name,
          id: firstCollection.id
        })
      }
    }
  } catch (error) {
    handleServiceError(error, 'diagnoseFramerAPI', { logLevel: 'warn' })
  }
}

/**
 * Detect CMS collections using official Framer API
 * Uses framer.getCollections() from API 3.0
 */
export async function detectCMSCollections(): Promise<CMSCollection[]> {
  const collections: CMSCollection[] = []
  
  try {
    // Run diagnostic first
    await diagnoseFramerAPI()
    
    // Use official Framer CMS API - getCollections() is available in Plugin API v3.0
    const framerAPI = framer as unknown as FramerAPIWithCMS
    
    // Explicitly call the CMS API entry point
    if (typeof framerAPI.getCollections === 'function') {
      debugLog.info('📦 Calling framer.getCollections() to access CMS...')
      try {
        const apiCollections = await framerAPI.getCollections()
        debugLog.info(`📦 getCollections() returned:`, {
          type: typeof apiCollections,
          isArray: Array.isArray(apiCollections),
          length: Array.isArray(apiCollections) ? apiCollections.length : 'N/A'
        })
        
        if (Array.isArray(apiCollections)) {
          if (apiCollections.length === 0) {
            debugLog.warn('⚠️ getCollections() returned an empty array - no CMS collections found in project')
          }
          
          for (const collection of apiCollections) {
            debugLog.info(`📦 Processing collection: ${collection.name || 'Unnamed'} (id: ${collection.id || 'no-id'})`)
            
            // Get fields to identify image/file fields
            let fieldNames: string[] = []
            try {
              if (typeof collection.getFields === 'function') {
                debugLog.info(`📦 Getting fields for collection: ${collection.name}...`)
                const fields = await collection.getFields()
                debugLog.info(`📦 getFields() returned:`, {
                  type: typeof fields,
                  isArray: Array.isArray(fields),
                  length: Array.isArray(fields) ? fields.length : 'N/A'
                })
                
                if (Array.isArray(fields)) {
                  fieldNames = fields
                    .filter((field: any) => {
                      // Check if field is image or file type
                      const fieldType = field.type || field.fieldType || field.kind
                      const isImageOrFile = fieldType === 'image' || fieldType === 'file' || 
                                           fieldType === 'ImageAsset' || fieldType === 'FileAsset' ||
                                           fieldType === 'Image' || fieldType === 'File'
                      if (isImageOrFile) {
                        debugLog.info(`  ✅ Found image/file field: ${field.name || field.key} (type: ${fieldType})`)
                      }
                      return isImageOrFile
                    })
                    .map((field: any) => field.name || field.key)
                  
                  debugLog.info(`📦 Collection ${collection.name} has ${fieldNames.length} image/file fields:`, fieldNames)
                } else {
                  debugLog.warn(`⚠️ getFields() did not return an array for collection ${collection.name}`)
                }
              } else {
                debugLog.warn(`⚠️ Collection ${collection.name} does not have getFields() method`)
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
        } else {
          debugLog.warn(`⚠️ getCollections() did not return an array. Got:`, typeof apiCollections)
        }
      } catch (error) {
        debugLog.error('❌ Error calling getCollections():', error)
        debugLog.error('Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
      }
    } else {
      debugLog.warn('⚠️ framer.getCollections is not a function - CMS API may not be available')
    }
    
    // Fallback: Try to find collections by looking for nodes with collectionId attribute
    debugLog.info('⚠️ Official CMS API not available, trying heuristic detection...')
    const nodesWithCollection = await framer.getNodesWithAttributeSet('collectionId')
    
    const collectionMap = new Map<string, CMSCollection>()
    
    for (const node of nodesWithCollection) {
       
      const extendedNode = node as ExtendedCanvasNode
      const collectionId = (extendedNode.collectionId || extendedNode.__collectionId) as string | undefined
      const collectionName = (extendedNode.collectionName || extendedNode.__collectionName || 'CMS Collection') as string
      
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
export async function collectCMSItems(collections: CMSCollection[]): Promise<Array<{ collectionId: string; items: FramerCMSItem[] }>> {
  const results: Array<{ collectionId: string; items: FramerCMSItem[] }> = []
  
  try {
    const framerAPI = framer as unknown as FramerAPIWithCMS
    
    // Get all collections from API
    if (typeof framerAPI.getCollections === 'function') {
      debugLog.info(`📦 Getting API collections to match with ${collections.length} detected collections...`)
      const apiCollections = await framerAPI.getCollections()
      debugLog.info(`📦 API returned ${apiCollections?.length || 0} collections`)
      
      if (!Array.isArray(apiCollections) || apiCollections.length === 0) {
        debugLog.warn('⚠️ getCollections() returned empty or invalid result')
        return results
      }
      
      // Log all API collections for debugging
      debugLog.info('📦 API Collections:', (apiCollections as FramerCMSCollection[]).map((c) => ({
        id: c.id,
        name: c.name,
        hasGetItems: typeof c.getItems === 'function'
      })))
      
      for (const collection of collections) {
        debugLog.info(`📦 Looking for collection: ${collection.name} (id: ${collection.id})`)
        
        // Find matching API collection - try multiple matching strategies
        const apiCollection = (apiCollections as FramerCMSCollection[]).find((c) => {
          const idMatch = c.id === collection.id
          const nameMatch = c.name === collection.name
          const idStringMatch = String(c.id) === String(collection.id)
          const nameLowerMatch = (c.name || '').toLowerCase() === (collection.name || '').toLowerCase()
          
          if (idMatch || nameMatch || idStringMatch || nameLowerMatch) {
            debugLog.info(`✅ Matched collection: ${c.name} (id: ${c.id}) with ${collection.name} (id: ${collection.id})`)
            return true
          }
          return false
        })
        
        if (!apiCollection) {
          debugLog.warn(`⚠️ Could not find matching API collection for: ${collection.name} (id: ${collection.id})`)
          debugLog.info('Available API collections:', (apiCollections as FramerCMSCollection[]).map((c) => `${c.name} (${c.id})`))
          continue
        }
        
        if (typeof apiCollection.getItems !== 'function') {
          debugLog.warn(`⚠️ Collection ${apiCollection.name} does not have getItems() method`)
          continue
        }
        
        try {
          debugLog.info(`📦 Calling getItems() on collection: ${apiCollection.name}...`)
          const items = await apiCollection.getItems()
          
          // Detailed diagnostic logging
          debugLog.info(`📦 getItems() returned:`, {
            type: typeof items,
            isArray: Array.isArray(items),
            length: Array.isArray(items) ? items.length : 'N/A',
            constructor: items?.constructor?.name
          })
          
          if (Array.isArray(items) && items.length > 0) {
            const firstItem = items[0]
            debugLog.info(`📦 First item structure:`, {
              keys: Object.keys(firstItem),
              hasFieldData: 'fieldData' in firstItem,
              hasData: 'data' in firstItem,
              hasFields: 'fields' in firstItem,
              fieldDataKeys: firstItem.fieldData ? Object.keys(firstItem.fieldData) : [],
              fieldDataSample: firstItem.fieldData ? Object.entries(firstItem.fieldData).slice(0, 3).map(([k, v]) => ({
                key: k,
                valueType: typeof v,
                valueIsObject: typeof v === 'object' && v !== null,
                valueKeys: typeof v === 'object' && v !== null ? Object.keys(v).slice(0, 5) : []
              })) : []
            })
          }
          
          if (Array.isArray(items)) {
            if (items.length === 0) {
              debugLog.warn(`⚠️ Collection ${apiCollection.name} has no items`)
            } else {
              results.push({
                collectionId: collection.id,
                items: items
              })
              debugLog.success(`✅ Collected ${items.length} items from collection: ${collection.name}`)
            }
          } else {
            debugLog.warn(`⚠️ getItems() did not return an array for collection ${apiCollection.name}. Got:`, typeof items)
          }
        } catch (error) {
          debugLog.error(`❌ Error getting items from collection ${collection.name}:`, error)
          debugLog.error('Error details:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          })
        }
      }
    } else {
      debugLog.warn('⚠️ framer.getCollections is not a function - CMS API may not be available')
    }
  } catch (error) {
    debugLog.error('❌ Error collecting CMS items:', error)
    debugLog.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
  }
  
  debugLog.info(`📦 Total CMS items collected: ${results.reduce((sum, r) => sum + r.items.length, 0)} items from ${results.length} collections`)
  return results
}

/**
 * Extract assets from CMS items using official Framer API helpers
 * Uses isImageAsset() and isFileAsset() from the API, and asset.measure() for dimensions
 */
export async function extractAssetsFromCMSItems(
  cmsItems: Array<{ collectionId: string; items: FramerCMSItem[] }>
): Promise<CMSAsset[]> {
  const assets: CMSAsset[] = []
  
  try {
    const framerAPI = framer as unknown as FramerAPIWithCMS
    
    // Use official Framer API helpers - isImageAsset() and isFileAsset() are provided by the API
    // These are the correct way to check if a field value is an image or file asset
    const isImageAsset = framerAPI.isImageAsset || ((value: unknown): value is ImageAsset => {
      if (!value || typeof value !== 'object') return false
      // Check for ImageAsset properties - CMS fields return asset objects, not strings
      return typeof value.url === 'string' && (
        value.__class === 'ImageAsset' ||
        value.type === 'ImageAsset' ||
        'measure' in value ||
        'loadBitmap' in value
      )
    })
    
    const isFileAsset = framerAPI.isFileAsset || ((value: unknown): value is FileAsset => {
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
      if (typeof framerAPI.getCollections === 'function') {
        const apiCollections = await framerAPI.getCollections()
        for (const apiCollection of (apiCollections || []) as FramerCMSCollection[]) {
          collectionMap.set(apiCollection.id || apiCollection.name, apiCollection.name || 'Unnamed Collection')
        }
      }
    } catch (error) {
      debugLog.warn('Could not get collection names:', error)
    }
    
    for (const { collectionId, items } of cmsItems) {
      const collectionName = collectionMap.get(collectionId) || collectionId
      debugLog.info(`📦 Processing collection: ${collectionName} with ${items.length} items`)
      
      for (const item of items) {
         
        const itemData = item as FramerCMSItem
        
        // Try multiple possible field data locations
        let fieldData: Record<string, FramerCMSFieldValue> = itemData.fields || {}
        const itemId = itemData.id || 'unknown'
        const itemSlug = itemData.slug || itemData.id || 'unknown' // Extract slug from CMS item
        
        // Check if fieldData values are wrapped in { value, type } structure (new API format)
        // According to Framer docs, fieldData might be structured as { value, type } objects
        const unwrappedFieldData: Record<string, FramerCMSFieldValue> = {}
        for (const [key, value] of Object.entries(fieldData)) {
          // Check if value is an object with { value, type } structure
          if (value && typeof value === 'object' && 'value' in value && !('url' in value)) {
            // New API format: { value: actualValue, type: 'image' | 'file' | ... }
            const wrappedValue = value as { value: unknown; type?: string }
            unwrappedFieldData[key] = wrappedValue.value as FramerCMSFieldValue
            debugLog.info(`📦 Unwrapped field ${key} from {value, type} structure (type: ${wrappedValue.type})`)
          } else {
            // Old format: direct value
            unwrappedFieldData[key] = value
          }
        }
        fieldData = unwrappedFieldData
        
        debugLog.info(`📦 Processing item: ${itemId} (slug: ${itemSlug})`)
        debugLog.info(`📦 Item fieldData keys:`, Object.keys(fieldData))
        
        let foundAssetsInItem = 0
        
        // Iterate through all fields in fieldData
        // fieldData contains the actual CMS field values - they are asset objects, not strings
        for (const [fieldName, fieldValue] of Object.entries(fieldData)) {
          try {
            // CRITICAL: Use official API helpers to check if field value is an image or file asset
            // CMS fields return asset objects, not plain text URLs - must use isImageAsset()/isFileAsset()
            if (isImageAsset(fieldValue) || isFileAsset(fieldValue)) {
              foundAssetsInItem++
               
              const asset = fieldValue as ImageAsset | FileAsset
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
                    try {
                      estimatedDimensions = await estimateImageDimensions(imageUrl)
                      estimatedBytes = estimateImageBytes(estimatedDimensions)
                    } catch (dimError) {
                      debugLog.warn(`Could not estimate dimensions from URL for ${fieldName}:`, dimError)
                      // Final fallback: use default dimensions
                      estimatedDimensions = { width: 1920, height: 1080 }
                      estimatedBytes = estimateImageBytes(estimatedDimensions)
                    }
                  }
                } else {
                  // Fall back to URL-based estimation
                  try {
                    estimatedDimensions = await estimateImageDimensions(imageUrl)
                    estimatedBytes = estimateImageBytes(estimatedDimensions)
                  } catch (dimError) {
                    debugLog.warn(`Could not estimate dimensions from URL for ${fieldName}:`, dimError)
                    // Final fallback: use default dimensions
                    estimatedDimensions = { width: 1920, height: 1080 }
                    estimatedBytes = estimateImageBytes(estimatedDimensions)
                  }
                }
                
                assets.push({
                  id: `cms-${collectionId}-${itemId}-${fieldName}`,
                  collectionId,
                  collectionName,
                  itemId,
                  itemSlug, // Add slug to CMS asset
                  estimatedBytes,
                  estimatedDimensions,
                  format: detectImageFormat(imageUrl),
                  isManualEstimate: false,
                  url: imageUrl,
                  status: 'found',
                  fieldName
                })
                debugLog.info(`✅ Found ${foundAssetsInItem} asset(s) in item ${itemId} so far`)
              }
            } else {
              // Log why this field was skipped (only for first few items to reduce noise)
              if (foundAssetsInItem < 1) {
                if (fieldValue === null || fieldValue === undefined) {
                  debugLog.info(`  ⏭️ Skipped field ${fieldName}: null/undefined`)
                } else if (typeof fieldValue === 'string') {
                  debugLog.info(`  ⏭️ Skipped field ${fieldName}: string value (not an asset object)`)
                } else {
                  debugLog.info(`  ⏭️ Skipped field ${fieldName}: not recognized as image/file asset`)
                }
              }
            }
          } catch (fieldError) {
            // Catch errors per field so one bad field doesn't stop processing the whole item
            debugLog.warn(`Error processing field ${fieldName} in item ${itemId}:`, fieldError)
            continue
          }
        }
        
        if (foundAssetsInItem === 0) {
          debugLog.warn(`⚠️ Item ${itemId} has no image/file assets in its fields`)
        } else {
          debugLog.info(`✅ Found ${foundAssetsInItem} assets in item ${itemId}`)
        }
      }
    }
    
    const totalItems = cmsItems.reduce((sum, c) => sum + c.items.length, 0)
    debugLog.success(`✅ Extracted ${assets.length} assets from ${totalItems} CMS items using official API`)
    
    if (assets.length === 0 && totalItems > 0) {
      debugLog.warn('⚠️ No assets extracted despite having CMS items. Possible issues:')
      debugLog.warn('  1. Items may not have image/file fields')
      debugLog.warn('  2. Field values may not be asset objects (check fieldData structure)')
      debugLog.warn('  3. isImageAsset()/isFileAsset() helpers may not be working correctly')
    }
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
         
        const extendedFrame = frame as ExtendedCanvasNode

        // Check if this component has controls that look like CMS data
        const controls = extendedFrame.controls as Record<string, unknown> | undefined
        if (controls && typeof controls === 'object') {
          // Look for image fields in controls
          for (const [key, value] of Object.entries(controls)) {
            if (value && typeof value === 'object') {
              const controlValue = value as Record<string, unknown>

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
    cmsItemSlug: cmsAsset.itemSlug, // Include CMS item slug
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
    /\/blog\/([^/]+)/,
    /\/posts\/([^/]+)/,
    /\/articles\/([^/]+)/,
    /\/news\/([^/]+)/,
    /\/cms\/([^/]+)/,
    /\/collection\/([^/]+)/,
    /\/content\/([^/]+)/,
    /\/uploads\/([^/]+)/,
    /\/media\/([^/]+)/,
    /\/assets\/([^/]+)/,
    /\/images\/([^/]+)/,
    /\/blog-images\/([^/]+)/,
    /\/post-images\/([^/]+)/
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
