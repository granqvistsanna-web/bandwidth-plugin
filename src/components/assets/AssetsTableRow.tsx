import { memo } from 'react'
import type { AssetInfo } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'
import { Badge } from '../primitives/Badge'
import { spacing, typography, colors, borders } from '../../styles/designTokens'

interface AssetsTableRowProps {
  asset: AssetInfo
  onClick: (nodeId: string) => void
  style?: React.CSSProperties
}

function getSizeIndicator(bytes: number): { label: string; shade: string } {
  const kb = bytes / 1024
  if (kb >= 500) return { label: 'Large', shade: colors.gray[800] }
  if (kb >= 200) return { label: 'Medium', shade: colors.gray[600] }
  return { label: 'Small', shade: colors.gray[400] }
}

export const AssetsTableRow = memo(function AssetsTableRow({
  asset,
  onClick,
  style
}: AssetsTableRowProps) {
  const sizeIndicator = getSizeIndicator(asset.estimatedBytes)
  const isCMS = asset.isCMSAsset || asset.isManualEstimate || !!asset.cmsItemSlug
  const canClick = !isCMS && asset.nodeId && asset.nodeId.trim() !== ''

  return (
    <div
      onClick={() => canClick && onClick(asset.nodeId)}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.lg,
        padding: `${spacing.md} 0`,
        backgroundColor: 'transparent',
        borderBottom: `1px solid ${colors.warmGray[100]}`,
        cursor: canClick ? 'pointer' : 'default',
        transition: canClick ? 'background-color 0.15s ease' : 'none',
        opacity: canClick ? 1 : 0.5,
      }}
      onMouseEnter={(e) => {
        if (canClick) {
          e.currentTarget.style.backgroundColor = colors.warmGray[50]
        }
      }}
      onMouseLeave={(e) => {
        if (canClick) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      {/* Thumbnail - 40px compact */}
      <div style={{ flexShrink: 0 }}>
        {asset.type === 'svg' ? (
          asset.svgContent ? (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: borders.radius.sm,
                border: `1px solid ${colors.warmGray[200]}`,
                backgroundColor: colors.warmGray[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden' as const,
                padding: '4px',
              }}
              dangerouslySetInnerHTML={{ __html: asset.svgContent }}
            />
          ) : (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: borders.radius.sm,
                border: `1px solid ${colors.warmGray[200]}`,
                backgroundColor: colors.warmGray[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={colors.warmGray[400]} strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
          )
        ) : asset.url ? (
          <img
            src={asset.url}
            alt={asset.nodeName}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: borders.radius.sm,
              border: `1px solid ${colors.warmGray[200]}`,
              objectFit: 'cover' as const,
              display: 'block',
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        ) : (
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: borders.radius.sm,
              border: `1px solid ${colors.warmGray[200]}`,
              backgroundColor: colors.warmGray[50],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={colors.warmGray[400]} strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content - single line for better scanning */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: spacing.md }}>
        {/* Name */}
        <div
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.almostBlack,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const,
            minWidth: '200px',
            flex: '0 0 auto',
          }}
          title={asset.nodeName}
        >
          {asset.nodeName || 'Unnamed'}
        </div>

        {/* Metadata - inline */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          fontSize: typography.fontSize.xs,
          color: colors.warmGray[500],
          flex: '1 1 auto',
          overflow: 'hidden'
        }}>
          <span style={{
            textTransform: 'uppercase',
            fontSize: '10px',
            fontWeight: typography.fontWeight.semibold,
            letterSpacing: '0.05em',
            color: colors.warmGray[400]
          }}>
            {asset.type}
          </span>
          <span style={{ color: colors.warmGray[300] }}>·</span>
          <span style={{ fontWeight: typography.fontWeight.medium, whiteSpace: 'nowrap' }}>
            {Math.round(asset.dimensions.width)} × {Math.round(asset.dimensions.height)}
          </span>
          {asset.format && (
            <>
              <span style={{ color: colors.warmGray[300] }}>·</span>
              <span style={{
                textTransform: 'uppercase',
                fontSize: '10px',
                fontWeight: typography.fontWeight.semibold,
                letterSpacing: '0.05em',
                color: colors.warmGray[400]
              }}>
                {asset.format}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Size - compact */}
      <div style={{ flexShrink: 0, textAlign: 'right' as const, minWidth: '100px' }}>
        <span
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.almostBlack,
          }}
        >
          {formatBytes(asset.estimatedBytes)}
        </span>
      </div>
    </div>
  )
})
