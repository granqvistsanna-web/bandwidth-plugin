// ============================================================================
// CORE TYPES
// ============================================================================

/** Device breakpoint for responsive analysis */
export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

/** Asset source - where the asset came from */
export type AssetSource = 'canvas' | 'cms' | 'manual'

/** Priority level for recommendations */
export type RecommendationPriority = 'high' | 'medium' | 'low'

/** Type of optimization recommendation */
export type RecommendationType = 'oversized' | 'format' | 'compression'

// ============================================================================
// SHARED REFERENCE TYPES
// ============================================================================

/** Minimal page reference used across multiple types */
export interface PageReference {
  pageId: string
  pageName: string
}

/** Extended page reference with route information */
export interface PageReferenceWithRoute extends PageReference {
  pagePath?: string | null
}

// ============================================================================
// ANALYSIS PROGRESS
// ============================================================================

/**
 * Progress information during analysis
 */
export interface AnalysisProgress {
  step: 'pages' | 'assets' | 'bandwidth' | 'recommendations' | 'complete'
  message: string
}

// ============================================================================
// PAGE USAGE TYPES
// ============================================================================

/**
 * Page usage information for an asset
 */
export interface PageUsageInfo {
  pageId: string
  pageName: string
  pageSlug: string // Route like "/about", "/services"
  hierarchyPath?: string // Path to the layer in hierarchy (optional)
}

/**
 * Result of asset page usage lookup
 */
export interface AssetPageUsage {
  /** Whether the asset was found */
  found: boolean
  /** The asset identifier used for lookup */
  assetIdentifier: {
    nodeId?: string
    url?: string
    imageAssetId?: string
  }
  /** Pages where this asset is used (empty if not found or CMS) */
  pages: PageUsageInfo[]
  /** Whether this is a CMS-driven asset */
  isCMSAsset: boolean
  /** If asset couldn't be resolved, explains why */
  unresolvedReason?: 'not_found' | 'cms_dynamic' | 'external_url' | 'component_instance' | 'unknown'
  /** Partial information if available even when unresolved */
  partialInfo?: {
    possiblePages?: PageUsageInfo[]
    cmsCollectionName?: string
    cmsItemSlug?: string
    externalUrl?: string
  }
}

// ============================================================================
// ASSET TYPES
// ============================================================================

/**
 * Information about a single asset (image or SVG).
 * Assets can come from canvas (Framer nodes), CMS collections, or manual estimates.
 */
export interface AssetInfo {
  nodeId: string
  nodeName: string
  type: 'image' | 'svg' // Removed 'background' - all background images are now 'image'
  estimatedBytes: number
  dimensions: {
    width: number
    height: number
  }
  actualDimensions?: {
    width: number
    height: number
  }
  format?: string
  visible: boolean
  url?: string
  usageCount?: number
  usedInPages?: { pageId: string; pageName: string }[] // Pages where this asset is used
  pageId?: string // The page this asset instance belongs to
  pageName?: string // The page name this asset instance belongs to
  pageSlug?: string // Page slug/route
  pageUrl?: string // Full published URL of the page
  svgContent?: string // For SVG nodes, store the SVG markup to analyze features
  imageAssetId?: string // ImageAsset.id for tracking and replacement
  isCMSAsset?: boolean // True if this asset comes from CMS
  isManualEstimate?: boolean // True if this is a manual estimate (CMS assets that couldn't be read)
  manualEstimateNote?: string // Note about manual estimate
  cmsCollectionName?: string // Name of CMS collection this asset belongs to
  cmsItemSlug?: string // CMS item slug (for CMS assets)
}

// ============================================================================
// BANDWIDTH & BREAKDOWN TYPES
// ============================================================================

/** Breakdown of bandwidth by content type */
export interface BreakdownData {
  images: number
  fonts: number
  htmlCss: number
  svg: number
}

/** Bandwidth data for a specific breakpoint */
export interface BreakpointData {
  totalBytes: number
  breakdown: BreakdownData
  assets: AssetInfo[]
}

// ============================================================================
// PAGE ANALYSIS TYPES
// ============================================================================

/** Analysis results for a single page */
export interface PageAnalysis {
  pageId: string
  pageName: string
  pagePath?: string | null // Route path like "/about" or "/services"
  breakpoints: {
    mobile: BreakpointData
    tablet: BreakpointData
    desktop: BreakpointData
  }
  totalAssets: number
  recommendations: Recommendation[]
}

// ============================================================================
// RECOMMENDATION TYPES
// ============================================================================

/** An optimization recommendation for an asset */
export interface Recommendation {
  id: string
  type: RecommendationType
  priority: RecommendationPriority
  nodeId: string
  nodeName: string
  currentBytes: number
  potentialSavings: number
  description: string
  actionable: string
  url?: string
  usedInPages?: { pageId: string; pageName: string }[]
  pageId?: string
  pageName?: string // Framer page name/slug (route like "about")
  pageUrl?: string // Full published URL of the page (if published and available)
  pageSlug?: string // Page slug/route (extracted from pageUrl or pageName)
  breakpoint?: string // Breakpoint frame: "Desktop", "Tablet", "Mobile"
  imageAssetId?: string // ImageAsset.id for tracking and replacement
  optimalWidth?: number // Target width for optimization
  optimalHeight?: number // Target height for optimization
  isCMSAsset?: boolean // True if this recommendation is for a CMS asset
  cmsItemSlug?: string // CMS item slug (for CMS assets)
}

// ============================================================================
// COST ESTIMATION TYPES
// ============================================================================

/** Cost estimation for bandwidth usage */
export interface CostEstimation {
  pageViews: number
  totalBytes: number
  estimatedCost: number
  provider: string
}

// ============================================================================
// CMS TYPES
// ============================================================================

/** Analysis mode - canvas (design view) or published (live site) */
export type AnalysisMode = 'canvas' | 'published'

/** CMS bandwidth impact across collections */
export interface CMSBandwidthImpact {
  totalBytes: number
  byCollection: Record<string, number>
  estimatedMonthlyBytes: number
}

// ============================================================================
// PROJECT ANALYSIS (TOP-LEVEL)
// ============================================================================

/**
 * Complete analysis results for a Framer project.
 * This is the main output type returned by the analyzer.
 */
export interface ProjectAnalysis {
  mode: AnalysisMode
  pages: PageAnalysis[]
  totalPages: number
  /** All available pages for Settings UI (includes drafts, for manual exclusion) */
  allAvailablePages?: Array<{ pageId: string; pageName: string; pagePath?: string | null }>
  overallBreakpoints: {
    mobile: BreakpointData
    tablet: BreakpointData
    desktop: BreakpointData
  }
  allRecommendations: Recommendation[]
  cmsAssetsCount?: number
  cmsAssetsBytes?: number
  cmsBandwidthImpact?: CMSBandwidthImpact
  cmsAssetsNotFound?: number
  publishedUrl?: string
  publishedData?: {
    totalBytes: number
    breakdown: {
      images: number
      css: number
      js: number
      fonts: number
      other: number
    }
    customCode?: {
      assets: Array<{
        url: string
        type: 'image' | 'font' | 'video' | 'audio' | 'other'
        source: string
        estimatedBytes?: number
        isLazyLoaded?: boolean
      }>
      totalEstimatedBytes: number
      hasCustomCode: boolean
      warnings: string[]
    }
  }
}
