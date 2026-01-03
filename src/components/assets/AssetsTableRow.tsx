import { memo } from 'react'
import type { AssetInfo } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'
import { Badge } from '../primitives/Badge'
import { spacing, typography, colors } from '../../styles/designTokens'

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
    <tr
      onClick={() => canClick && onClick(asset.nodeId)}
      style={{
        ...style,
        backgroundColor: colors.white,
        cursor: canClick ? 'pointer' : 'default',
        transition: 'background-color 0.15s ease',
        opacity: canClick ? 1 : 0.7
      }}
      onMouseEnter={(e) => {
        if (canClick) {
          e.currentTarget.style.backgroundColor = colors.gray[50]
        }
      }}
      onMouseLeave={(e) => {
        if (canClick) {
          e.currentTarget.style.backgroundColor = colors.white
        }
      }}
    >
      {/* Preview - 64px square */}
      <td style={{ width: '80px', padding: `${spacing.sm} ${spacing.sm}` }}>
        {asset.type === 'svg' ? (
          asset.svgContent ? (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '4px',
                border: `1px solid ${colors.gray[200]}`,
                backgroundColor: colors.gray[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden' as const,
                margin: '0 auto',
                padding: '4px',
              }}
              dangerouslySetInnerHTML={{ __html: asset.svgContent }}
            />
          ) : (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '4px',
                border: `1px solid ${colors.gray[200]}`,
                backgroundColor: colors.gray[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={colors.gray[400]} strokeWidth="2">
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
              borderRadius: '4px',
              border: `1px solid ${colors.gray[200]}`,
              objectFit: 'cover' as const,
              display: 'block',
              margin: '0 auto',
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
              borderRadius: '4px',
              border: `1px solid ${colors.gray[200]}`,
              backgroundColor: colors.gray[50],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={colors.gray[400]} strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </td>

      {/* Name + Type */}
      <td style={{ minWidth: '200px', padding: `${spacing.sm} ${spacing.sm}` }}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '2px' }}>
          <div
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.black,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' as const,
            }}
            title={asset.nodeName}
          >
            {asset.nodeName || 'Unnamed'}
          </div>
          <Badge variant={asset.type === 'svg' ? 'svg' : 'image'}>{asset.type}</Badge>
        </div>
      </td>

      {/* Dimensions */}
      <td style={{ width: '120px', padding: `${spacing.sm} ${spacing.sm}` }}>
        <div
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.gray[500],
          }}
        >
          {Math.round(asset.dimensions.width)} × {Math.round(asset.dimensions.height)}
        </div>
      </td>

      {/* Format */}
      <td style={{ width: '100px', padding: `${spacing.sm} ${spacing.sm}` }}>
        {asset.format ? (
          <Badge variant="default">{asset.format}</Badge>
        ) : (
          <span style={{ fontSize: typography.fontSize.xs, color: colors.gray[400] }}>—</span>
        )}
      </td>

      {/* Size */}
      <td style={{ width: '140px', padding: `${spacing.sm} ${spacing.sm}` }}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1px' }}>
          <div
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: sizeIndicator.shade,
            }}
          >
            {formatBytes(asset.estimatedBytes)}
          </div>
          <div
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.gray[500],
            }}
          >
            {sizeIndicator.label}
          </div>
        </div>
      </td>

      {/* Usage */}
      <td style={{ width: '100px', padding: `${spacing.sm} ${spacing.sm}`, textAlign: 'center' as const }}>
        {asset.usageCount && asset.usageCount > 1 ? (
          <Badge variant="outline">{asset.usageCount}×</Badge>
        ) : (
          <span style={{ fontSize: typography.fontSize.xs, color: colors.gray[400] }}>1×</span>
        )}
      </td>

      {/* Action */}
      <td style={{ width: '80px', padding: `${spacing.sm} ${spacing.sm}`, textAlign: 'right' as const }}>
        <div
          style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: isCMS ? colors.gray[400] : colors.gray[500],
          }}
          title={isCMS ? 'CMS assets cannot be selected in canvas. Edit them in the CMS collection instead.' : 'Click to select in canvas'}
        >
          {isCMS ? 'CMS' : 'Select'}
        </div>
      </td>
    </tr>
  )
})
