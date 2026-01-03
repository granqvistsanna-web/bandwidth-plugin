import { memo } from 'react'
import type { AssetInfo } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'

interface AssetsTableRowProps {
  asset: AssetInfo
  onClick: (nodeId: string) => void
  style?: React.CSSProperties
}

function getSizeColor(bytes: number) {
  const kb = bytes / 1024
  if (kb >= 500) {
    return { bg: '#fee2e2', color: '#991b1b', border: '#f87171' }
  } else if (kb >= 200) {
    return { bg: '#fef3c7', color: '#92400e', border: '#facc15' }
  } else {
    return { bg: '#dcfce7', color: '#166534', border: '#22c55e' }
  }
}

function getSizeLabel(bytes: number): string {
  const kb = bytes / 1024
  if (kb >= 1000) return 'Very Large'
  if (kb >= 500) return 'Large'
  if (kb >= 200) return 'Medium'
  return 'Small'
}

export const AssetsTableRow = memo(function AssetsTableRow({
  asset,
  onClick,
  style
}: AssetsTableRowProps) {
  const sizeColor = getSizeColor(asset.estimatedBytes)
  const sizeLabel = getSizeLabel(asset.estimatedBytes)

  return (
    <tr
      onClick={() => onClick(asset.nodeId)}
      className="cursor-pointer transition-colors"
      style={{
        ...style,
        backgroundColor: 'var(--framer-color-bg)',
        borderBottom: `1px solid var(--framer-color-divider)`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--framer-color-bg)'
      }}
    >
      {/* Preview */}
      <td style={{ width: '100px', padding: '16px 20px', textAlign: 'center' }}>
        {asset.type === 'svg' ? (
          asset.svgContent ? (
            <div
              className="w-16 h-16 rounded border flex items-center justify-center overflow-hidden flex-shrink-0 mx-auto"
              style={{
                borderColor: 'var(--framer-color-divider)',
                backgroundColor: '#f3e8ff',
                aspectRatio: '1 / 1',
                padding: '4px'
              }}
              dangerouslySetInnerHTML={{ __html: asset.svgContent }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded border flex items-center justify-center flex-shrink-0 mx-auto"
              style={{
                borderColor: 'var(--framer-color-divider)',
                backgroundColor: '#f3e8ff',
                aspectRatio: '1 / 1'
              }}
            >
              <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
          )
        ) : asset.url ? (
          <img
            src={asset.url}
            alt={asset.nodeName}
            className="w-16 h-16 rounded object-cover border flex-shrink-0 mx-auto"
            style={{ borderColor: 'var(--framer-color-divider)', aspectRatio: '1 / 1' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = `
                  <div class="w-16 h-16 rounded border flex items-center justify-center flex-shrink-0 mx-auto" style="border-color: var(--framer-color-divider); background-color: var(--framer-color-bg-secondary); aspect-ratio: 1 / 1;">
                    <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: var(--framer-color-text-tertiary)">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                `
              }
            }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded border flex items-center justify-center flex-shrink-0 mx-auto"
            style={{
              borderColor: 'var(--framer-color-divider)',
              backgroundColor: 'var(--framer-color-bg-secondary)',
              aspectRatio: '1 / 1'
            }}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--framer-color-text-tertiary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </td>

      {/* Name + Type + Page */}
      <td style={{ minWidth: '200px', padding: '16px 20px' }}>
        <div className="flex flex-col gap-1">
          <div className="font-medium text-sm truncate" style={{ color: 'var(--framer-color-text)' }} title={asset.nodeName}>
            {asset.nodeName || 'Unnamed'}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase"
              style={
                asset.type === 'svg'
                  ? { backgroundColor: '#f3e8ff', color: '#7c3aed' }
                  : { backgroundColor: '#dcfce7', color: '#166534' }
              }
            >
              {asset.type}
            </span>
            {asset.isCMSAsset && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  backgroundColor: (asset as any).cmsStatus === 'not_found' 
                    ? 'var(--framer-color-bg-tertiary)' 
                    : 'var(--framer-color-tint-dimmed)',
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  color: (asset as any).cmsStatus === 'not_found'
                    ? 'var(--framer-color-text-secondary)'
                    : 'var(--framer-color-tint)'
                }}
                title={
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (asset as any).cmsStatus === 'not_found' 
                    ? 'CMS asset not found - estimated' 
                    : asset.isManualEstimate 
                      ? 'Manual CMS estimate' 
                      : 'CMS asset'
                }
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(asset as any).cmsStatus === 'not_found' 
                  ? 'CMS (Not Found)' 
                  : asset.isManualEstimate 
                    ? 'CMS (Manual)' 
                    : 'CMS'}
              </span>
            )}
            {asset.pageName && !asset.isCMSAsset && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
                style={{
                  backgroundColor: 'var(--framer-color-bg-tertiary)',
                  color: 'var(--framer-color-text-secondary)'
                }}
                title={asset.pageUrl ? `On page: ${asset.pageName}\nURL: ${asset.pageUrl}` : `On page: ${asset.pageName}`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {asset.pageName}
                {asset.pageUrl && (
                  <svg className="w-2.5 h-2.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" title={asset.pageUrl}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                )}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Dimensions */}
      <td style={{ width: '140px', padding: '16px 20px' }}>
        <div className="flex items-center text-xs gap-1" style={{ color: 'var(--framer-color-text-secondary)' }}>
          <span>{Math.round(asset.dimensions.width)}</span>
          <span>×</span>
          <span>{Math.round(asset.dimensions.height)}</span>
        </div>
      </td>

      {/* Format */}
      <td style={{ width: '120px', padding: '16px 20px' }}>
        {asset.format ? (
          <span
            className="px-2 py-0.5 rounded text-[10px] font-medium uppercase"
            style={{
              backgroundColor: 'var(--framer-color-bg-tertiary)',
              color: 'var(--framer-color-text-secondary)'
            }}
          >
            {asset.format}
          </span>
        ) : (
          <span className="text-xs" style={{ color: 'var(--framer-color-text-tertiary)' }}>
            —
          </span>
        )}
      </td>

      {/* Size */}
      <td style={{ width: '160px', padding: '16px 20px' }}>
        <div className="flex flex-col gap-0.5">
          <div
            className="text-xs font-bold whitespace-nowrap px-2 py-1 rounded"
            style={{
              backgroundColor: sizeColor.bg,
              color: sizeColor.color,
              border: `1px solid ${sizeColor.border}`
            }}
          >
            {formatBytes(asset.estimatedBytes)}
          </div>
          <div className="text-[9px] font-medium" style={{ color: 'var(--framer-color-text-tertiary)' }}>
            {sizeLabel}
          </div>
        </div>
      </td>

      {/* Usage */}
      <td style={{ width: '120px', padding: '16px 20px', textAlign: 'center' }}>
        {asset.usageCount && asset.usageCount > 1 ? (
          <span
            className="text-xs px-2 py-0.5 rounded font-semibold"
            style={{
              backgroundColor: 'var(--framer-color-tint-dimmed)',
              color: 'var(--framer-color-tint)'
            }}
          >
            {asset.usageCount}×
          </span>
        ) : (
          <span className="text-xs" style={{ color: 'var(--framer-color-text-tertiary)' }}>
            1×
          </span>
        )}
      </td>

      {/* Action */}
      <td style={{ width: '100px', padding: '16px 20px', textAlign: 'right' }}>
        <div className="text-xs font-medium" style={{ color: 'var(--framer-color-tint)' }}>
          Select
        </div>
      </td>
    </tr>
  )
})
