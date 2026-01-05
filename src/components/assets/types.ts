import type { AssetInfo } from '../../types/analysis'

export type GroupByOption = 'none' | 'impact' | 'page' | 'type' | 'recommendation'

export interface FilterState {
  type: 'all' | 'image' | 'svg' | 'cms'
  sizeRange: {
    min: number
    max: number
  }
  format: 'all' | 'png' | 'jpg' | 'webp' | 'gif' | 'svg'
  pageUsage: 'all' | 'single' | 'multiple'
  groupBy?: GroupByOption
}

export interface SortConfig {
  column: 'name' | 'size' | 'dimensions' | 'format' | 'usage'
  direction: 'asc' | 'desc'
}

export interface AssetCounts {
  all: number
  images: number
  svgs: number
  cms: number
}

export interface AssetFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  assetCounts: AssetCounts
  sortConfig?: SortConfig
  onSortChange?: (config: SortConfig) => void
}

export interface AssetsTableProps {
  assets: AssetInfo[]
  sortConfig: SortConfig
  onSort: (config: SortConfig) => void
  onAssetClick: (nodeId: string) => void
}

export interface AssetsTableRowProps {
  asset: AssetInfo
  onClick: (nodeId: string) => void
}
