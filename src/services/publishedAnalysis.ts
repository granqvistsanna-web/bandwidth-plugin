import { framer } from 'framer-plugin'
import { analyzeAllJavaScriptBundles, type CodeAnalysisResult } from './codeAnalyzer'
import { debugLog } from '../utils/debugLog'
import { handleServiceError, ErrorCode } from '../utils/errorHandler'

export interface PublishedResource {
  url: string
  type: 'image' | 'css' | 'js' | 'font' | 'other'
  actualBytes: number
}

export interface PublishedAnalysisResult {
  siteUrl: string
  isPublished: boolean
  resources: PublishedResource[]
  totalBytes: number
  breakdown: {
    images: number
    css: number
    js: number
    fonts: number
    other: number
  }
  customCode?: CodeAnalysisResult
}

/**
 * Check if the site is published and get the URL
 */
export async function getPublishedUrl(): Promise<string | null> {
  try {
    const publishInfo = await framer.getPublishInfo()

    // Try multiple possible URL locations
    let siteUrl: string | null = null

    if (publishInfo?.url) {
      siteUrl = publishInfo.url
    } else if (publishInfo?.production?.url) {
      siteUrl = publishInfo.production.url
    } else if (publishInfo?.staging?.url) {
      siteUrl = publishInfo.staging.url
    } else if (publishInfo?.currentPageUrl) {
      try {
        const urlObj = new URL(publishInfo.currentPageUrl)
        siteUrl = urlObj.origin
      } catch {
        // Ignore parsing errors
      }
    }

    return siteUrl
  } catch {
    return null
  }
}

/**
 * Analyze the published site by fetching actual resources
 */
export async function analyzePublishedSite(siteUrl: string): Promise<PublishedAnalysisResult> {
  debugLog.info('Analyzing published site:', siteUrl)

  const resources: PublishedResource[] = []
  let totalBytes = 0

  try {
    // Fetch the published HTML
    const response = await fetch(siteUrl, {
      mode: 'cors',
      credentials: 'omit'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch site: ${response.status}`)
    }

    const html = await response.text()
    debugLog.info('Fetched HTML, length:', html.length)

    // Parse HTML to find resources
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Find all images from various sources
    const images = doc.querySelectorAll('img[src]')
    debugLog.info('Found images:', images.length)

    for (const img of Array.from(images)) {
      const src = img.getAttribute('src')
      if (!src) continue

      const absoluteUrl = makeAbsoluteUrl(src, siteUrl)
      const size = await getResourceSize(absoluteUrl)

      if (size > 0) {
        resources.push({
          url: absoluteUrl,
          type: 'image',
          actualBytes: size
        })
        totalBytes += size
      }
    }

    // Find images with srcset (responsive images)
    const imagesWithSrcset = doc.querySelectorAll('img[srcset]')
    for (const img of Array.from(imagesWithSrcset)) {
      const srcset = img.getAttribute('srcset')
      if (!srcset) continue
      
      // Parse srcset (format: "url1 1x, url2 2x" or "url1 100w, url2 200w")
      const srcsetUrls = srcset.split(',').map(s => s.trim().split(/\s+/)[0])
      for (const srcsetUrl of srcsetUrls) {
        if (!srcsetUrl) continue
        const absoluteUrl = makeAbsoluteUrl(srcsetUrl, siteUrl)
        const size = await getResourceSize(absoluteUrl)
        
        if (size > 0) {
          // Check if we already have this URL (avoid duplicates)
          if (!resources.find(r => r.url === absoluteUrl)) {
            resources.push({
              url: absoluteUrl,
              type: 'image',
              actualBytes: size
            })
            totalBytes += size
          }
        }
      }
    }

    // Find CSS background images
    const elementsWithBackgrounds = doc.querySelectorAll('[style*="background"]')
    for (const el of Array.from(elementsWithBackgrounds)) {
      const style = el.getAttribute('style') || ''
      const urlMatch = style.match(/url\(['"]?([^'"()]+)['"]?\)/)
      if (urlMatch) {
        const absoluteUrl = makeAbsoluteUrl(urlMatch[1], siteUrl)
        const size = await getResourceSize(absoluteUrl)

        if (size > 0) {
          // Check if we already have this URL
          if (!resources.find(r => r.url === absoluteUrl)) {
            resources.push({
              url: absoluteUrl,
              type: 'image',
              actualBytes: size
            })
            totalBytes += size
          }
        }
      }
    }
    
    // Find background images from CSS classes (Framer often uses inline styles or CSS)
    // Also check for picture elements and source elements
    const pictureElements = doc.querySelectorAll('picture source[srcset]')
    for (const source of Array.from(pictureElements)) {
      const srcset = source.getAttribute('srcset')
      if (!srcset) continue
      
      const srcsetUrls = srcset.split(',').map(s => s.trim().split(/\s+/)[0])
      for (const srcsetUrl of srcsetUrls) {
        if (!srcsetUrl) continue
        const absoluteUrl = makeAbsoluteUrl(srcsetUrl, siteUrl)
        const size = await getResourceSize(absoluteUrl)
        
        if (size > 0 && !resources.find(r => r.url === absoluteUrl)) {
          resources.push({
            url: absoluteUrl,
            type: 'image',
            actualBytes: size
          })
          totalBytes += size
        }
      }
    }

    // Find CSS files
    const cssLinks = doc.querySelectorAll('link[rel="stylesheet"]')
    for (const link of Array.from(cssLinks)) {
      const href = link.getAttribute('href')
      if (!href) continue

      const absoluteUrl = makeAbsoluteUrl(href, siteUrl)
      const size = await getResourceSize(absoluteUrl)

      if (size > 0) {
        resources.push({
          url: absoluteUrl,
          type: 'css',
          actualBytes: size
        })
        totalBytes += size
      }
    }

    // Find JS files
    const scripts = doc.querySelectorAll('script[src]')
    const jsUrls: string[] = []
    
    for (const script of Array.from(scripts)) {
      const src = script.getAttribute('src')
      if (!src) continue

      const absoluteUrl = makeAbsoluteUrl(src, siteUrl)
      const size = await getResourceSize(absoluteUrl)

      if (size > 0) {
        resources.push({
          url: absoluteUrl,
          type: 'js',
          actualBytes: size
        })
        totalBytes += size
        jsUrls.push(absoluteUrl)
      }
    }

    // Analyze JavaScript bundles for custom code assets
    let customCodeAnalysis: CodeAnalysisResult | undefined
    if (jsUrls.length > 0) {
      try {
        customCodeAnalysis = await analyzeAllJavaScriptBundles(siteUrl, jsUrls)
        
        // Add custom code assets to resources
        for (const asset of customCodeAnalysis.assets) {
          if (asset.estimatedBytes) {
            resources.push({
              url: asset.url,
              type: asset.type === 'image' ? 'image' : 
                    asset.type === 'font' ? 'font' : 'other',
              actualBytes: asset.estimatedBytes
            })
            totalBytes += asset.estimatedBytes
          }
        }
      } catch (error) {
        handleServiceError(error, 'analyzePublishedSite.customCode', {
          notifyUser: false,
          logLevel: 'warn',
          code: ErrorCode.API_ERROR
        })
      }
    }

    // Calculate breakdown
    const breakdown = {
      images: resources.filter(r => r.type === 'image').reduce((sum, r) => sum + r.actualBytes, 0),
      css: resources.filter(r => r.type === 'css').reduce((sum, r) => sum + r.actualBytes, 0),
      js: resources.filter(r => r.type === 'js').reduce((sum, r) => sum + r.actualBytes, 0),
      fonts: resources.filter(r => r.type === 'font').reduce((sum, r) => sum + r.actualBytes, 0),
      other: resources.filter(r => r.type === 'other').reduce((sum, r) => sum + r.actualBytes, 0)
    }

    return {
      siteUrl,
      isPublished: true,
      resources,
      totalBytes,
      breakdown,
      customCode: customCodeAnalysis
    }
  } catch (error) {
    const serviceError = handleServiceError(error, 'analyzePublishedSite', {
      notifyUser: false,
      logLevel: 'error',
      code: ErrorCode.NETWORK_ERROR,
      defaultMessage: 'Failed to analyze published site'
    })
    throw new Error(serviceError.message)
  }
}

/**
 * Get the actual size of a resource via HEAD request
 */
async function getResourceSize(url: string): Promise<number> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
      credentials: 'omit'
    })

    if (!response.ok) {
      debugLog.warn(`Failed to fetch resource: ${url} (${response.status})`)
      return 0
    }

    const contentLength = response.headers.get('Content-Length')
    return contentLength ? parseInt(contentLength, 10) : 0
      } catch (error) {
        handleServiceError(error, `getResourceSize(${url})`, {
          notifyUser: false,
          logLevel: 'warn',
          code: ErrorCode.NETWORK_ERROR
        })
        return 0
      }
}

/**
 * Convert relative URL to absolute URL
 */
function makeAbsoluteUrl(url: string, baseUrl: string): string {
  // Already absolute
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // Protocol-relative
  if (url.startsWith('//')) {
    return 'https:' + url
  }

  // Relative to root
  if (url.startsWith('/')) {
    const base = new URL(baseUrl)
    return base.origin + url
  }

  // Relative to current path
  return new URL(url, baseUrl).href
}
