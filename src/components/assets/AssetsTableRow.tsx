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
        gap: spacing.sm,
        padding: `${spacing.md} 0`,
        backgroundColor: 'transparent',
        borderBottom: `1px solid ${themeBorders.subtle}`,
        cursor: canClick ? 'pointer' : 'default',
        transition: canClick ? 'background-color 0.15s ease' : 'none',
        minHeight: '80px', // Fixed row height for consistent table layout
        boxSizing: 'border-box',
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
      {/* Thumbnail - 64px */}
      <div style={{ flexShrink: 0 }}>
        {asset.type === 'svg' ? (
          asset.svgContent ? (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: borders.radius.md,
                border: `1px solid ${themeBorders.subtle}`,
                backgroundColor: surfaces.tertiary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden' as const,
                padding: '8px',
              }}
              dangerouslySetInnerHTML={{ __html: asset.svgContent }}
            />
          ) : (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: borders.radius.md,
                border: `1px solid ${themeBorders.subtle}`,
                backgroundColor: surfaces.tertiary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={framerColors.textTertiary} strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
          )
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
              borderRadius: borders.radius.md,
              border: `1px solid ${themeBorders.subtle}`,
              backgroundColor: surfaces.tertiary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={framerColors.textTertiary} strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content - flexible wrapping layout */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
        {/* Name */}
        <div
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: framerColors.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.4',
          }}
          title={asset.nodeName}
        >
          {asset.nodeName || 'Unnamed'}
        </div>

        {/* Metadata - wraps if needed */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          fontSize: typography.fontSize.xs,
          color: framerColors.textSecondary,
          flexWrap: 'wrap',
          lineHeight: '1.6'
        }}>
          {asset.format && (
            <span style={{
              textTransform: 'uppercase',
              fontSize: typography.fontSize.xxs || '10px', // Extra small for badges
              fontWeight: typography.fontWeight.semibold,
              letterSpacing: '0.05em',
              color: framerColors.textTertiary
            }}>
              {asset.format}
            </span>
          )}
          {asset.format && <span style={{ color: framerColors.textTertiary }}>·</span>}
          <span style={{ fontWeight: typography.fontWeight.medium, whiteSpace: 'nowrap' }}>
            {asset.actualDimensions ? (
              <>
                {Math.round(asset.actualDimensions.width)} × {Math.round(asset.actualDimensions.height)}
                <span style={{ color: framerColors.textTertiary, margin: `0 ${spacing.xs}` }}>→</span>
                {Math.round(asset.dimensions.width)} × {Math.round(asset.dimensions.height)}
              </>
            ) : (
              <>
                {Math.round(asset.dimensions.width)} × {Math.round(asset.dimensions.height)}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Size and Savings - compact right column */}
      <div style={{
        flex: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: spacing.sm,
        minWidth: '90px'
      }}>
        {/* Savings badge - if has potential */}
        {potentialSavings > 0 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: `${spacing.xxs} ${spacing.sm}`, // 2px top/bottom for compact badge
            backgroundColor: surfaces.tertiary,
            color: framerColors.text,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.bold,
            borderRadius: borders.radius.full,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap'
          }}>
            −{formatBytes(potentialSavings)}
          </div>
        )}

        {/* Current size */}
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
