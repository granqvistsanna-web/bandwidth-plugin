export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export interface AssetInfo {
  nodeId: string
  nodeName: string
  type: 'image' | 'svg'
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
  usedInPages?: string[]
  svgContent?: string // For SVG nodes, store the SVG markup to analyze features
  imageAssetId?: string // ImageAsset.id for tracking and replacement
}

export interface BreakdownData {
  images: number
  fonts: number
  htmlCss: number
  svg: number
}

export interface BreakpointData {
  totalBytes: number
  breakdown: BreakdownData
  assets: AssetInfo[]
}

export interface PageAnalysis {
  pageId: string
  pageName: string
  breakpoints: {
    mobile: BreakpointData
    tablet: BreakpointData
    desktop: BreakpointData
  }
  totalAssets: number
  recommendations: Recommendation[]
}

export interface Recommendation {
  id: string
  type: 'oversized' | 'format' | 'compression'
  priority: 'high' | 'medium' | 'low'
  nodeId: string
  nodeName: string
  currentBytes: number
  potentialSavings: number
  description: string
  actionable: string
  url?: string
  usedInPages?: { pageId: string; pageName: string }[]
  pageId?: string
  pageName?: string
  imageAssetId?: string // ImageAsset.id for tracking and replacement
  optimalWidth?: number // Target width for optimization
  optimalHeight?: number // Target height for optimization
}

export interface CostEstimation {
  pageViews: number
  totalBytes: number
  estimatedCost: number
  provider: string
}

export type AnalysisMode = 'canvas' | 'published'

export interface ProjectAnalysis {
  mode: AnalysisMode
  pages: PageAnalysis[]
  totalPages: number
  overallBreakpoints: {
    mobile: BreakpointData
    tablet: BreakpointData
    desktop: BreakpointData
  }
  allRecommendations: Recommendation[]
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
