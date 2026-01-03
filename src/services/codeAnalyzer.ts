/**
 * Code analysis service
 * Analyzes JavaScript bundles to detect dynamically loaded assets from custom code
 */

export interface CodeAsset {
  url: string
  type: 'image' | 'font' | 'video' | 'audio' | 'other'
  source: string // Pattern that detected it (e.g., "fetch('...')", "import('...')")
  estimatedBytes?: number
  isLazyLoaded?: boolean
}

export interface CodeAnalysisResult {
  assets: CodeAsset[]
  totalEstimatedBytes: number
  hasCustomCode: boolean
  warnings: string[]
}

/**
 * Patterns to detect asset loading in JavaScript code
 */
const ASSET_PATTERNS = {
  // Image loading patterns
  image: [
    /fetch\(['"]([^'"]+\.(jpg|jpeg|png|webp|gif|svg|avif))['"]\)/gi,
    /new\s+Image\(\)[^;]*\.src\s*=\s*['"]([^'"]+\.(jpg|jpeg|png|webp|gif|svg|avif))['"]/gi,
    /\.src\s*=\s*['"]([^'"]+\.(jpg|jpeg|png|webp|gif|svg|avif))['"]/gi,
    /import\(['"]([^'"]+\.(jpg|jpeg|png|webp|gif|svg|avif))['"]\)/gi,
    /require\(['"]([^'"]+\.(jpg|jpeg|png|webp|gif|svg|avif))['"]\)/gi,
    /url\(['"]([^'"]+\.(jpg|jpeg|png|webp|gif|svg|avif))['"]\)/gi,
  ],
  // Font loading patterns
  font: [
    /fetch\(['"]([^'"]+\.(woff|woff2|ttf|otf|eot))['"]\)/gi,
    /new\s+FontFace\([^,]+,\s*['"]([^'"]+\.(woff|woff2|ttf|otf|eot))['"]/gi,
    /@font-face[^}]*url\(['"]([^'"]+\.(woff|woff2|ttf|otf|eot))['"]\)/gi,
    /import\(['"]([^'"]+\.(woff|woff2|ttf|otf|eot))['"]\)/gi,
    /require\(['"]([^'"]+\.(woff|woff2|ttf|otf|eot))['"]\)/gi,
  ],
  // Video loading patterns
  video: [
    /fetch\(['"]([^'"]+\.(mp4|webm|ogg|mov))['"]\)/gi,
    /\.src\s*=\s*['"]([^'"]+\.(mp4|webm|ogg|mov))['"]/gi,
    /import\(['"]([^'"]+\.(mp4|webm|ogg|mov))['"]\)/gi,
  ],
  // Audio loading patterns
  audio: [
    /fetch\(['"]([^'"]+\.(mp3|wav|ogg|aac))['"]\)/gi,
    /\.src\s*=\s*['"]([^'"]+\.(mp3|wav|ogg|aac))['"]/gi,
    /import\(['"]([^'"]+\.(mp3|wav|ogg|aac))['"]\)/gi,
  ],
  // Generic asset patterns (CDN URLs, data URLs, etc.)
  other: [
    /fetch\(['"](https?:\/\/[^'"]+)['"]\)/gi,
    /import\(['"](https?:\/\/[^'"]+)['"]\)/gi,
    /require\(['"](https?:\/\/[^'"]+)['"]\)/gi,
  ]
}

/**
 * Check if a URL is likely an asset (not an API endpoint)
 */
function isAssetUrl(url: string): boolean {
  // Skip API endpoints
  if (url.includes('/api/') || url.includes('/graphql') || url.endsWith('.json')) {
    return false
  }
  
  // Check for common asset extensions
  const assetExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif',
                          '.woff', '.woff2', '.ttf', '.otf', '.eot',
                          '.mp4', '.webm', '.ogg', '.mov',
                          '.mp3', '.wav', '.aac']
  
  return assetExtensions.some(ext => url.toLowerCase().includes(ext))
}

/**
 * Extract assets from JavaScript code
 */
export function extractAssetsFromCode(jsCode: string, baseUrl: string): CodeAsset[] {
  const assets: CodeAsset[] = []
  const seenUrls = new Set<string>()

  // Analyze each asset type
  for (const [assetType, patterns] of Object.entries(ASSET_PATTERNS)) {
    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(jsCode)) !== null) {
        const url = match[1] || match[0]
        
        // Skip if already seen
        if (seenUrls.has(url)) continue
        
        // Skip if not an asset URL
        if (!isAssetUrl(url)) continue
        
        // Convert to absolute URL if needed
        let absoluteUrl = url
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
          try {
            absoluteUrl = new URL(url, baseUrl).href
          } catch {
            // Skip invalid URLs
            continue
          }
        }
        
        // Determine if lazy loaded (common patterns)
        const isLazyLoaded = /lazy|onScroll|IntersectionObserver|requestIdleCallback/.test(
          jsCode.substring(Math.max(0, match.index - 100), match.index + 100)
        )
        
        assets.push({
          url: absoluteUrl,
          type: assetType as CodeAsset['type'],
          source: match[0].substring(0, 100), // First 100 chars of the pattern match
          isLazyLoaded
        })
        
        seenUrls.add(url)
      }
    }
  }

  return assets
}

/**
 * Analyze JavaScript bundle for dynamically loaded assets
 */
export async function analyzeJavaScriptBundle(
  jsUrl: string,
  baseUrl: string
): Promise<CodeAnalysisResult> {
  const warnings: string[] = []

  try {
    // Fetch the JavaScript bundle
    const response = await fetch(jsUrl, {
      mode: 'cors',
      credentials: 'omit'
    })

    if (!response.ok) {
      warnings.push(`Could not fetch JavaScript bundle: ${response.status}`)
      return {
        assets: [],
        totalEstimatedBytes: 0,
        hasCustomCode: false,
        warnings
      }
    }

    const jsCode = await response.text()
    
    // Check if this looks like custom code (not just Framer's base bundle)
    // Framer bundles are usually minified and don't contain user code patterns
    const hasCustomCode = jsCode.length > 50000 || // Large bundles likely have custom code
                          /export\s+(const|function|class)/.test(jsCode) || // ES6 exports
                          /module\.exports/.test(jsCode) || // CommonJS
                          /fetch\(['"]https?:\/\//.test(jsCode) // External fetches

    if (!hasCustomCode) {
      return {
        assets: [],
        totalEstimatedBytes: 0,
        hasCustomCode: false,
        warnings: ['No custom code detected in JavaScript bundle']
      }
    }

    // Extract assets from the code
    const extractedAssets = extractAssetsFromCode(jsCode, baseUrl)
    const assets: CodeAsset[] = []
    
    // Try to get actual sizes for detected assets
    for (const asset of extractedAssets) {
      try {
        const size = await getAssetSize(asset.url)
        if (size > 0) {
          asset.estimatedBytes = size
        }
      } catch {
        // If we can't get size, estimate based on type
        asset.estimatedBytes = estimateAssetSize(asset.type)
      }
      assets.push(asset)
    }

    const totalEstimatedBytes = assets.reduce(
      (sum, asset) => sum + (asset.estimatedBytes || 0),
      0
    )

    if (assets.length > 0) {
      warnings.push(`Found ${assets.length} dynamically loaded asset(s) in custom code`)
    }

    return {
      assets,
      totalEstimatedBytes,
      hasCustomCode: true,
      warnings
    }
  } catch (error) {
    warnings.push(`Error analyzing JavaScript bundle: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      assets: [],
      totalEstimatedBytes: 0,
      hasCustomCode: false,
      warnings
    }
  }
}

/**
 * Get actual size of an asset via HEAD request
 */
async function getAssetSize(url: string): Promise<number> {
  try {
    // Skip data URLs
    if (url.startsWith('data:')) {
      // Estimate data URL size (base64 is ~33% larger than binary)
      const base64Data = url.split(',')[1]
      if (base64Data) {
        return Math.round(base64Data.length * 0.75) // Approximate binary size
      }
      return 0
    }

    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
      credentials: 'omit'
    })

    if (!response.ok) {
      return 0
    }

    const contentLength = response.headers.get('Content-Length')
    return contentLength ? parseInt(contentLength, 10) : 0
  } catch {
    return 0
  }
}

/**
 * Estimate asset size based on type (fallback when we can't fetch)
 */
function estimateAssetSize(type: CodeAsset['type']): number {
  // Conservative estimates
  const estimates: Record<CodeAsset['type'], number> = {
    image: 200 * 1024, // 200KB average
    font: 50 * 1024,  // 50KB average
    video: 2 * 1024 * 1024, // 2MB average
    audio: 500 * 1024, // 500KB average
    other: 100 * 1024 // 100KB average
  }
  return estimates[type] || 100 * 1024
}

/**
 * Analyze all JavaScript bundles from a published site
 */
export async function analyzeAllJavaScriptBundles(
  siteUrl: string,
  jsUrls: string[]
): Promise<CodeAnalysisResult> {
  const allAssets: CodeAsset[] = []
  const allWarnings: string[] = []
  let totalBytes = 0
  let hasCustomCode = false

  for (const jsUrl of jsUrls) {
    try {
      const result = await analyzeJavaScriptBundle(jsUrl, siteUrl)
      
      if (result.hasCustomCode) {
        hasCustomCode = true
      }
      
      allAssets.push(...result.assets)
      allWarnings.push(...result.warnings)
      totalBytes += result.totalEstimatedBytes
    } catch (error) {
      allWarnings.push(`Error analyzing ${jsUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Deduplicate assets by URL
  const uniqueAssets = Array.from(
    new Map(allAssets.map(asset => [asset.url, asset])).values()
  )

  return {
    assets: uniqueAssets,
    totalEstimatedBytes: totalBytes,
    hasCustomCode,
    warnings: allWarnings
  }
}

