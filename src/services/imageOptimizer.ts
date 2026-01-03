/**
 * Image optimization service using Canvas API
 * Fetches, resizes, and compresses images for optimization
 */

export interface OptimizeImageOptions {
  url: string
  targetWidth: number
  targetHeight: number
  format: 'webp' | 'jpeg'
  quality?: number // 0-1, default 0.85 for JPEG, 0.90 for WebP
}

export interface OptimizeImageResult {
  data: Uint8Array
  format: string
  originalSize: number
  optimizedSize: number
  hasTransparency: boolean
}

/**
 * Validate image URL
 */
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  // Check if it's a data URL
  if (url.startsWith('data:image/')) return true
  
  // Check if it's a valid HTTP(S) URL
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Fetch image bytes from URL
 */
export async function fetchImageBytes(url: string): Promise<Uint8Array> {
  // Validate URL
  if (!isValidImageUrl(url)) {
    throw new Error('Invalid image URL. URL must be a valid HTTP(S) URL or data URL.')
  }

  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }

    // Check content type
    const contentType = response.headers.get('content-type')
    if (contentType && !contentType.startsWith('image/')) {
      throw new Error(`URL does not point to an image. Content-Type: ${contentType}`)
    }

    const blob = await response.blob()
    
    // Check if blob is actually an image
    if (blob.size === 0) {
      throw new Error('Image file is empty')
    }

    const arrayBuffer = await blob.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Cannot access image URL. Image may be from external source or blocked by CORS.')
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unknown error fetching image')
  }
}

/**
 * Check if image has transparency by loading it and checking alpha channel
 */
async function checkTransparency(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          resolve(false)
          return
        }
        
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Check if any pixel has alpha < 255
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 255) {
            resolve(true)
            return
          }
        }
        resolve(false)
      } catch (error) {
        // If we can't check, assume no transparency
        resolve(false)
      }
    }
    
    img.onerror = () => {
      resolve(false)
    }
    
    img.src = url
  })
}

/**
 * Resize and compress image using Canvas API
 */
export async function optimizeImage(options: OptimizeImageOptions): Promise<OptimizeImageResult> {
  const { url, targetWidth, targetHeight, format, quality } = options

  // Validate dimensions
  if (!targetWidth || !targetHeight || targetWidth <= 0 || targetHeight <= 0) {
    throw new Error('Invalid target dimensions. Width and height must be positive numbers.')
  }

  if (targetWidth > 10000 || targetHeight > 10000) {
    throw new Error('Target dimensions are too large. Maximum size is 10000x10000 pixels.')
  }
  
  // Get original size
  let originalSize = 0
  try {
    const originalBytes = await fetchImageBytes(url)
    originalSize = originalBytes.length
  } catch (error) {
    console.warn('Could not fetch original image to get size:', error)
  }

  // Check for transparency
  const hasTransparency = await checkTransparency(url)

  // Warn if PNG with transparency and user wants JPEG
  if (hasTransparency && format === 'jpeg') {
    console.warn('Image has transparency but JPEG format requested. Transparency will be lost.')
  }

  // Load image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    
    image.onload = () => resolve(image)
    image.onerror = (error) => {
      reject(new Error('Failed to load image. It may be blocked by CORS or invalid.'))
    }
    
    image.src = url
  })

  // Calculate dimensions preserving aspect ratio
  const aspectRatio = img.width / img.height
  let finalWidth = targetWidth
  let finalHeight = targetHeight

  // If target dimensions don't match aspect ratio, adjust to preserve it
  if (targetWidth / targetHeight !== aspectRatio) {
    if (targetWidth / aspectRatio <= targetHeight) {
      finalHeight = targetWidth / aspectRatio
    } else {
      finalWidth = targetHeight * aspectRatio
    }
  }

  // Ensure dimensions are integers
  finalWidth = Math.round(finalWidth)
  finalHeight = Math.round(finalHeight)

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas')
  canvas.width = finalWidth
  canvas.height = finalHeight
  const ctx = canvas.getContext('2d', { alpha: format === 'webp' && hasTransparency })

  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Use high-quality scaling
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, finalWidth, finalHeight)

  // Convert to blob with specified format and quality
  // Use higher quality to prevent pixelation (0.92 for WebP, 0.88 for JPEG)
  const defaultQuality = format === 'webp' ? 0.92 : 0.88
  const finalQuality = quality !== undefined ? quality : defaultQuality
  const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg'

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error(`Failed to convert canvas to ${format}`))
        }
      },
      mimeType,
      finalQuality
    )
  })

  // Convert blob to Uint8Array
  const arrayBuffer = await blob.arrayBuffer()
  const data = new Uint8Array(arrayBuffer)

  return {
    data,
    format: mimeType,
    originalSize,
    optimizedSize: data.length,
    hasTransparency
  }
}

/**
 * Calculate optimal dimensions for an image based on rendered size
 */
export function calculateOptimalDimensions(
  renderedWidth: number,
  renderedHeight: number,
  maxWidth: number = 1600,
  pixelDensity: number = 2
): { width: number; height: number } {
  // Calculate 2x for retina, but cap at maxWidth
  const optimalWidth = Math.min(Math.ceil(renderedWidth * pixelDensity), maxWidth)
  const aspectRatio = renderedHeight / renderedWidth
  const optimalHeight = Math.max(1, Math.round(optimalWidth * aspectRatio))

  return { width: optimalWidth, height: optimalHeight }
}

