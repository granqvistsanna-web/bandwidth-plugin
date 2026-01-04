/**
 * Generate a thumbnail URL for an image
 * Creates smaller, lower quality versions for performance
 */

/**
 * Generate a thumbnail URL from an image URL
 * For Framer CDN URLs, adds query parameters for smaller size
 * For other URLs, returns the original (browser will scale it down)
 */
export function getThumbnailUrl(originalUrl: string, maxSize: number = 64): string {
  if (!originalUrl) return originalUrl

  // Handle data URLs - return as-is (they're usually small already)
  if (originalUrl.startsWith('data:image/')) {
    return originalUrl
  }

  // Handle Framer CDN URLs - add query parameters for thumbnail
  if (originalUrl.includes('framerusercontent.com') || originalUrl.includes('framer.com')) {
    try {
      const url = new URL(originalUrl)
      
      // Add or update query parameters for thumbnail
      // w=width, h=height, q=quality (0-100), fit=scale
      url.searchParams.set('w', maxSize.toString())
      url.searchParams.set('h', maxSize.toString())
      url.searchParams.set('q', '30') // Low quality for blurry preview
      url.searchParams.set('fit', 'cover') // Maintain aspect ratio
      
      return url.toString()
    } catch (error) {
      // If URL parsing fails, return original
      return originalUrl
    }
  }

  // For other URLs, try to add common thumbnail parameters
  // Many CDNs support similar query parameters
  try {
    const url = new URL(originalUrl)
    
    // Try common thumbnail parameters
    if (!url.searchParams.has('w') && !url.searchParams.has('width')) {
      url.searchParams.set('w', maxSize.toString())
    }
    if (!url.searchParams.has('h') && !url.searchParams.has('height')) {
      url.searchParams.set('h', maxSize.toString())
    }
    if (!url.searchParams.has('q') && !url.searchParams.has('quality')) {
      url.searchParams.set('q', '30')
    }
    
    return url.toString()
  } catch (error) {
    // If URL parsing fails, return original
    return originalUrl
  }
}

/**
 * Check if an image URL is from Framer CDN
 */
export function isFramerCDNUrl(url: string): boolean {
  return url.includes('framerusercontent.com') || url.includes('framer.com')
}

