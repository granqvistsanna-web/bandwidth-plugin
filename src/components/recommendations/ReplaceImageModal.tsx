import { useState } from 'react'
import { spacing, typography, borders, surfaces, framerColors, colors } from '../../styles/designTokens'
import { formatBytes } from '../../utils/formatBytes'

interface ReplaceImageModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  imageAssetId?: string
  nodeName: string
  optimalWidth?: number
  optimalHeight?: number
  potentialSavings?: number
}

export function ReplaceImageModal({
  isOpen,
  onClose,
  onConfirm,
  optimalWidth,
  optimalHeight,
  potentialSavings
}: ReplaceImageModalProps) {
  const [showOptimizationInstructions, setShowOptimizationInstructions] = useState(false)
  
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }}>
      <div
        style={{
          borderRadius: borders.radius.lg,
          maxWidth: '512px',
          width: '100%',
          border: `1px solid var(--framer-color-divider)`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          backgroundColor: surfaces.secondary,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Header with close button */}
        <div
          style={{
            position: 'relative',
            padding: spacing.lg,
            borderBottom: `1px solid var(--framer-color-divider)`,
            flexShrink: 0
          }}
        >
          <h3 style={{
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.bold,
            paddingRight: spacing.xl,
            margin: 0,
            marginBottom: spacing.xs,
            color: framerColors.text
          }}>
            Download Optimized Image
          </h3>
          <p style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textSecondary,
            margin: 0,
            lineHeight: typography.lineHeight.relaxed
          }}>
            The optimized image will be downloaded. Replace the original image manually in Framer.
          </p>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: spacing.md,
              right: spacing.md,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: borders.radius.md,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: framerColors.textSecondary,
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label="Close"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: spacing.lg,
          flex: 1,
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textSecondary,
            lineHeight: typography.lineHeight.relaxed,
            marginBottom: spacing.md
          }}>
            <p style={{ margin: 0 }}>
              The optimized image will be downloaded to your computer. You can then replace the original image in Framer by dragging the downloaded file onto the element.
            </p>
          </div>

          {/* What happens when you optimize - Collapsible */}
          <div style={{
            marginBottom: spacing.sm
          }}>
            <button
              onClick={() => setShowOptimizationInstructions(!showOptimizationInstructions)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: spacing.sm,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: borders.radius.md,
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = surfaces.tertiary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: framerColors.text
              }}>
                What happens when you optimize?
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{
                  transform: showOptimizationInstructions ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease',
                  color: framerColors.textSecondary
                }}
              >
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {showOptimizationInstructions && (
              <div style={{
                padding: spacing.md,
                backgroundColor: surfaces.tertiary,
                borderRadius: borders.radius.md,
                marginTop: spacing.xs
              }}>
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: framerColors.textSecondary,
                  lineHeight: typography.lineHeight.relaxed
                }}>
                  <ul style={{
                    margin: 0,
                    paddingLeft: spacing.md,
                    listStyle: 'disc',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.xs,
                    marginBottom: spacing.xs
                  }}>
                    {optimalWidth && optimalHeight && (
                      <li><strong style={{ color: framerColors.text }}>Image processing:</strong> The image will be resized to {optimalWidth} × {optimalHeight}px and compressed to reduce file size</li>
                    )}
                    <li><strong style={{ color: framerColors.text }}>Format conversion:</strong> The image will be converted to WebP format for better compression (if applicable)</li>
                    <li><strong style={{ color: framerColors.text }}>Download:</strong> The optimized image will be downloaded to your computer</li>
                    <li><strong style={{ color: framerColors.text }}>Manual replacement:</strong> Replace the original image in Framer by dragging the downloaded file onto the element</li>
                    <li><strong style={{ color: framerColors.text }}>Updated totals:</strong> Bandwidth estimates will update after you replace the image and run a new scan</li>
                  </ul>
                  {potentialSavings !== undefined && potentialSavings > 0 && (
                    <div style={{
                      marginTop: spacing.xs,
                      paddingTop: spacing.xs,
                      fontSize: typography.fontSize.xs,
                      color: framerColors.textTertiary,
                      fontStyle: 'italic'
                    }}>
                      Estimated savings: {formatBytes(potentialSavings)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky footer with action buttons */}
        <div
          style={{
            padding: spacing.lg,
            borderTop: `1px solid var(--framer-color-divider)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: spacing.sm,
            flexShrink: 0,
            backgroundColor: surfaces.secondary
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              borderRadius: borders.radius.md,
              color: framerColors.text,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
              opacity: 1
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.7'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: `6px ${spacing.md}`,
              minHeight: '32px',
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              borderRadius: borders.radius.md,
              border: 'none',
              transition: 'all 0.15s ease',
              backgroundColor: colors.accent.primary,
              color: colors.white,
              cursor: 'pointer',
              opacity: 1
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0088E6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.accent.primary
            }}
          >
            Download Optimized Image
          </button>
        </div>
      </div>
    </div>
  )
}

