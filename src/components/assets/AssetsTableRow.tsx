import { memo, useMemo, useCallback } from 'react'
import type { AssetInfo } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'
import { getThumbnailUrl } from '../../utils/imageThumbnail'
import { LazyThumbnail } from './LazyThumbnail'
import { spacing, typography, borders, surfaces, themeBorders, framerColors } from '../../styles/designTokens'

interface AssetsTableRowProps {
  asset: AssetInfo
  onClick: (nodeId: string) => void
  style?: React.CSSProperties
}

// Format badge colors for visual distinction
function getFormatColor(format: string | undefined): { bg: string; text: string } {
  const f = format?.toUpperCase()
  switch (f) {
    case 'PNG':
      return { bg: 'rgba(249, 115, 22, 0.12)', text: '#EA580C' } // Orange
    case 'JPG':
    case 'JPEG':
      return { bg: 'rgba(59, 130, 246, 0.12)', text: '#2563EB' } // Blue
    case 'WEBP':
      return { bg: 'rgba(34, 197, 94, 0.12)', text: '#16A34A' } // Green
    case 'SVG':
      return { bg: 'rgba(168, 85, 247, 0.12)', text: '#9333EA' } // Purple
    case 'AVIF':
      return { bg: 'rgba(20, 184, 166, 0.12)', text: '#0D9488' } // Teal
    case 'GIF':
      return { bg: 'rgba(236, 72, 153, 0.12)', text: '#DB2777' } // Pink
    default:
      return { bg: 'var(--framer-color-bg-tertiary)', text: 'var(--framer-color-text-tertiary)' }
  }
}

// Calculate potential savings for unoptimized assets
// Memoized outside component to avoid recalculation
function calculatePotentialSavings(asset: AssetInfo): number {
  // Don't show savings for CMS assets
  if (asset.isCMSAsset || asset.isManualEstimate) return 0

  const kb = asset.estimatedBytes / 1024

  // Large PNG/JPG files have high savings potential
  if ((asset.format === 'PNG' || asset.format === 'JPG' || asset.format === 'JPEG') && kb >= 200) {
    // Estimate 60-70% savings from converting to WebP/AVIF
    return Math.floor(asset.estimatedBytes * 0.65)
  }

  // Oversized images (dimensions much larger than needed)
  const area = asset.dimensions.width * asset.dimensions.height
  if (area > 4000000 && kb >= 500) { // > 2000x2000px and > 500KB
    // Estimate 50% savings from resizing
    return Math.floor(asset.estimatedBytes * 0.5)
  }

  return 0
}

export const AssetsTableRow = memo(function AssetsTableRow({
  asset,
  onClick,
  style
}: AssetsTableRowProps) {
  // Memoize expensive calculations
  const potentialSavings = useMemo(() => calculatePotentialSavings(asset), [asset])

  const isCMS = asset.isCMSAsset || asset.isManualEstimate || !!asset.cmsItemSlug
  const canClick = !isCMS && asset.nodeId && asset.nodeId.trim() !== ''

  // Generate thumbnail URL for performance (small, low quality for blurry preview)
  const thumbnailUrl = useMemo(() => {
    if (!asset.url) return null
    return getThumbnailUrl(asset.url, 64) // 64px thumbnail with low quality
  }, [asset.url])

  // Memoize click handler
  const handleClick = useCallback(() => {
    if (canClick) {
      onClick(asset.nodeId)
    }
  }, [canClick, onClick, asset.nodeId])

  return (
    <div
      onClick={handleClick}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        padding: `${spacing.sm} 0`,
        backgroundColor: 'transparent',
        borderBottom: `1px solid ${themeBorders.subtle}`,
        cursor: canClick ? 'pointer' : 'default',
        transition: canClick ? 'background-color 0.15s ease' : 'none',
        height: '72px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (canClick) {
          e.currentTarget.style.backgroundColor = 'var(--hover-surface)'
        }
      }}
      onMouseLeave={(e) => {
        if (canClick) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      {/* Thumbnail - fixed 48px */}
      <div style={{ flexShrink: 0, width: '48px', height: '48px' }}>
        {asset.type === 'svg' ? (
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: borders.radius.sm,
              border: `1px solid ${themeBorders.subtle}`,
              backgroundColor: surfaces.tertiary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '6px',
            }}
            dangerouslySetInnerHTML={asset.svgContent ? { __html: asset.svgContent } : undefined}
          >
            {!asset.svgContent && (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={framerColors.textTertiary} strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            )}
          </div>
        ) : asset.url && thumbnailUrl ? (
          <LazyThumbnail
            src={thumbnailUrl}
            alt={asset.nodeName || 'Image'}
            fallbackSrc={asset.url}
            size={48}
          />
        ) : (
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: borders.radius.sm,
              border: `1px solid ${themeBorders.subtle}`,
              backgroundColor: surfaces.tertiary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={framerColors.textTertiary} strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content - constrained to prevent overflow */}
      <div style={{
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '4px'
      }}>
        {/* Name - single line with ellipsis */}
        <div
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: framerColors.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={asset.nodeName}
        >
          {asset.nodeName || 'Unnamed'}
        </div>

        {/* Metadata - single line, no wrapping */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: framerColors.textSecondary,
          overflow: 'hidden',
        }}>
          {/* CMS badge */}
          {isCMS && (
            <span
              style={{
                flexShrink: 0,
                textTransform: 'uppercase',
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '0.03em',
                color: '#6366F1',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                padding: '1px 5px',
                borderRadius: '3px'
              }}
            >
              CMS
            </span>
          )}
          {/* Format badge */}
          {asset.format && (() => {
            const formatColor = getFormatColor(asset.format)
            return (
              <span style={{
                flexShrink: 0,
                textTransform: 'uppercase',
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '0.03em',
                color: formatColor.text,
                backgroundColor: formatColor.bg,
                padding: '1px 5px',
                borderRadius: '3px'
              }}>
                {asset.format}
              </span>
            )
          })()}
          {/* Dimensions - truncate if needed */}
          <span style={{
            color: framerColors.textTertiary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {Math.round(asset.dimensions.width)} × {Math.round(asset.dimensions.height)}
          </span>
        </div>
      </div>

      {/* Size - fixed width right column */}
      <div style={{
        flexShrink: 0,
        textAlign: 'right',
        minWidth: '60px'
      }}>
        <span
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: framerColors.text,
            whiteSpace: 'nowrap'
          }}
        >
          {formatBytes(asset.estimatedBytes)}
        </span>
      </div>
    </div>
  )
})
