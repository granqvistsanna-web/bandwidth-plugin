export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export interface AssetInfo {
  nodeId: string
  nodeName: string
  type: 'image' | 'svg' | 'background'
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
}

export interface CostEstimation {
  pageViews: number
  totalBytes: number
  estimatedCost: number
  provider: string
}

export interface ProjectAnalysis {
  pages: PageAnalysis[]
  totalPages: number
  overallBreakpoints: {
    mobile: BreakpointData
    tablet: BreakpointData
    desktop: BreakpointData
  }
  allRecommendations: Recommendation[]
}
