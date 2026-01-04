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
        gap: spacing.md,
        padding: `${spacing.sm} ${spacing.md}`,
        backgroundColor: colors.white,
        borderRadius: borders.radius.md,
        border: `1px solid ${colors.warmGray[200]}`,
        cursor: canClick ? 'pointer' : 'default',
        transition: canClick ? 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        opacity: canClick ? 1 : 0.6,
        marginBottom: spacing.sm,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
      }}
      onMouseEnter={(e) => {
        if (canClick) {
          e.currentTarget.style.backgroundColor = colors.warmGray[50]
          e.currentTarget.style.borderColor = colors.warmGray[300]
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={(e) => {
        if (canClick) {
          e.currentTarget.style.backgroundColor = colors.white
          e.currentTarget.style.borderColor = colors.warmGray[200]
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)'
          e.currentTarget.style.transform = 'translateY(0)'
        }
      }}
    >
      {/* Thumbnail - 48px for better visibility */}
      <div style={{ flexShrink: 0 }}>
        {asset.type === 'svg' ? (
          asset.svgContent ? (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: borders.radius.md,
                border: `1.5px solid ${colors.warmGray[200]}`,
                backgroundColor: colors.warmGray[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden' as const,
                padding: '6px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
              dangerouslySetInnerHTML={{ __html: asset.svgContent }}
            />
          ) : (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: borders.radius.md,
                border: `1.5px solid ${colors.warmGray[200]}`,
                backgroundColor: colors.warmGray[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={colors.warmGray[400]} strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
          )
        ) : asset.url ? (
          <img
            src={asset.url}
            alt={asset.nodeName}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: borders.radius.md,
              border: `1.5px solid ${colors.warmGray[200]}`,
              objectFit: 'cover' as const,
              display: 'block',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        ) : (
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: borders.radius.md,
              border: `1.5px solid ${colors.warmGray[200]}`,
              backgroundColor: colors.warmGray[50],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={colors.warmGray[400]} strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content - cleaner layout */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Name with better typography */}
        <div
          style={{
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            color: colors.almostBlack,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const,
            letterSpacing: '-0.01em',
          }}
          title={asset.nodeName}
        >
          {asset.nodeName || 'Unnamed'}
        </div>

        {/* Metadata - simplified, no badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, fontSize: '11px', color: colors.warmGray[500], fontWeight: typography.fontWeight.medium }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>{asset.type}</span>
          <span style={{ color: colors.warmGray[300] }}>·</span>
          <span>{Math.round(asset.dimensions.width)} × {Math.round(asset.dimensions.height)}</span>
          {asset.format && (
            <>
              <span style={{ color: colors.warmGray[300] }}>·</span>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>{asset.format}</span>
            </>
          )}
        </div>
      </div>

      {/* Size - refined */}
      <div style={{ flexShrink: 0, textAlign: 'right' as const, minWidth: '80px' }}>
        <div
          style={{
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.bold,
            color: colors.almostBlack,
            letterSpacing: '-0.01em',
            marginBottom: '2px',
          }}
        >
          {formatBytes(asset.estimatedBytes)}
        </div>
        <div
          style={{
            fontSize: '10px',
            color: colors.warmGray[500],
            fontWeight: typography.fontWeight.medium,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          {sizeIndicator.label}
        </div>
      </div>
    </div>
  )
})
