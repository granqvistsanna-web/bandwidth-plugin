import { useState, useEffect } from 'react'
import { findAllNodesUsingAsset } from '../../services/assetReplacer'
import { debugLog } from '../../utils/debugLog'
import { spacing, typography, borders, surfaces, backgrounds, framerColors, colors } from '../../styles/designTokens'

interface ReplaceImageModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (replaceScope: 'single' | 'all') => void
  imageAssetId?: string
  nodeName: string
}

export function ReplaceImageModal({
  isOpen,
  onClose,
  onConfirm,
  imageAssetId
}: ReplaceImageModalProps) {
  const [usageCount, setUsageCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'single' | 'all' | null>(null)

  useEffect(() => {
    if (isOpen && imageAssetId) {
      setLoading(true)
      setSelectedOption(null) // Reset selection when modal opens
      findAllNodesUsingAsset(imageAssetId)
        .then(nodes => {
          setUsageCount(nodes.length)
          // Auto-select "single" as default
          setSelectedOption('single')
        })
        .catch(error => {
          debugLog.error('Error finding usage count:', error)
          setUsageCount(1) // Default to 1 if we can't determine
          setSelectedOption('single')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setUsageCount(null)
      setSelectedOption(null)
    }
  }, [isOpen, imageAssetId])

  const handleConfirm = () => {
    if (selectedOption) {
      onConfirm(selectedOption)
    }
  }

  if (!isOpen) return null

  const hasMultipleUsages = usageCount !== null && usageCount > 1

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
            Download an optimized version and choose which elements to update
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

        {/* Content - scrollable */}
        <div style={{
          padding: spacing.lg,
          flex: 1,
          overflowY: 'auto'
        }}>
          {loading ? (
            <div style={{
              padding: `${spacing.xl} 0`,
              textAlign: 'center'
            }}>
              <svg style={{
                width: '24px',
                height: '24px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
                marginBottom: spacing.sm,
                color: framerColors.textSecondary
              }} fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: framerColors.textSecondary,
                margin: 0
              }}>Checking usage...</p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm
            }}>
              {/* Replace only this node option */}
              <button
                onClick={() => setSelectedOption('single')}
                style={{
                  width: '100%',
                  padding: spacing.md,
                  textAlign: 'left',
                  border: `2px solid ${selectedOption === 'single' ? framerColors.text : 'var(--framer-color-divider)'}`,
                  borderRadius: borders.radius.md,
                  backgroundColor: selectedOption === 'single' ? 'var(--framer-color-bg-secondary)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (selectedOption !== 'single') {
                    e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedOption !== 'single') {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm
                }}>
                  <div style={{ flexShrink: 0 }}>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: `2px solid ${selectedOption === 'single' ? framerColors.text : framerColors.textSecondary}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selectedOption === 'single' ? framerColors.text : 'transparent',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {selectedOption === 'single' && (
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--framer-color-bg)'
                        }} />
                      )}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: typography.fontWeight.semibold,
                      fontSize: typography.fontSize.sm,
                      color: framerColors.text,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      Update only this element
                    </div>
                  </div>
                </div>
              </button>

              {/* Replace everywhere option - only show if multiple usages */}
              {hasMultipleUsages && (
                <button
                  onClick={() => setSelectedOption('all')}
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    textAlign: 'left',
                    border: `2px solid ${selectedOption === 'all' ? framerColors.text : 'var(--framer-color-divider)'}`,
                    borderRadius: borders.radius.md,
                    backgroundColor: selectedOption === 'all' ? 'var(--framer-color-bg-secondary)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedOption !== 'all') {
                      e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedOption !== 'all') {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm
                  }}>
                    <div style={{ flexShrink: 0 }}>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: `2px solid ${selectedOption === 'all' ? framerColors.text : framerColors.textSecondary}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: selectedOption === 'all' ? framerColors.text : 'transparent',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {selectedOption === 'all' && (
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--framer-color-bg)'
                          }} />
                        )}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: typography.fontWeight.semibold,
                        fontSize: typography.fontSize.sm,
                        color: framerColors.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        Update everywhere ({usageCount} {usageCount === 1 ? 'place' : 'places'})
                      </div>
                    </div>
                  </div>
                </button>
              )}
            </div>
          )}
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
            onClick={handleConfirm}
            disabled={!selectedOption}
            style={{
              padding: `6px ${spacing.md}`,
              minHeight: '32px',
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              borderRadius: borders.radius.md,
              border: 'none',
              transition: 'all 0.15s ease',
              ...(selectedOption ? {
                backgroundColor: colors.accent.primary,
                color: colors.white,
                cursor: 'pointer',
                opacity: 1
              } : {
                backgroundColor: surfaces.tertiary,
                color: framerColors.textSecondary,
                cursor: 'not-allowed',
                opacity: 0.5
              })
            }}
            onMouseEnter={(e) => {
              if (selectedOption) {
                e.currentTarget.style.backgroundColor = '#0088E6'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedOption) {
                e.currentTarget.style.backgroundColor = colors.accent.primary
              }
            }}
          >
            Download & Update
          </button>
        </div>
      </div>
    </div>
  )
}

