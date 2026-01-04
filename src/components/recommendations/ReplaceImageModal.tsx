import { useState, useEffect } from 'react'
import { findAllNodesUsingAsset } from '../../services/assetReplacer'
import { debugLog } from '../../utils/debugLog'
import { spacing, typography, borders, surfaces, backgrounds, framerColors } from '../../styles/designTokens'

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
            padding: `${spacing.lg} ${spacing.xl} ${spacing.md}`,
            borderBottom: `1px solid var(--framer-color-divider)`,
            flexShrink: 0
          }}
        >
          <h3 style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            paddingRight: spacing.xl,
            margin: 0,
            color: framerColors.text
          }}>
            Replace Image
          </h3>
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
          padding: `${spacing.xl} ${spacing.xl}`,
          flex: 1,
          overflowY: 'auto'
        }}>
          {loading ? (
            <div style={{
              padding: `${spacing.xxl} 0`,
              textAlign: 'center'
            }}>
              <svg style={{
                width: '32px',
                height: '32px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
                marginBottom: spacing.md,
                color: framerColors.textSecondary
              }} fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: framerColors.textSecondary
              }}>Checking usage...</p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.md
            }}>
              {/* Replace only this node option */}
              <button
                onClick={() => setSelectedOption('single')}
                style={{
                  width: '100%',
                  padding: `${spacing.md} ${spacing.xl}`,
                  textAlign: 'left',
                  border: `2px solid ${selectedOption === 'single' ? framerColors.text : 'var(--framer-color-divider)'}`,
                  borderRadius: borders.radius.lg,
                  backgroundColor: selectedOption === 'single' ? 'var(--framer-color-bg-secondary)' : backgrounds.page,
                  boxShadow: selectedOption === 'single' ? '0 1px 2px rgba(0, 0, 0, 0.04)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (selectedOption !== 'single') {
                    e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
                    e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedOption !== 'single') {
                    e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
                    e.currentTarget.style.backgroundColor = backgrounds.page
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md
                }}>
                  <div style={{ flexShrink: 0 }}>
                    <div 
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: `2px solid ${selectedOption === 'single' ? framerColors.text : framerColors.textTertiary}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selectedOption === 'single' ? framerColors.text : backgrounds.page,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {selectedOption === 'single' && (
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--framer-color-bg)' }}>
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{
                      fontWeight: typography.fontWeight.semibold,
                      fontSize: typography.fontSize.md,
                      wordBreak: 'break-word',
                      color: framerColors.text
                    }}>
                      Replace only this element
                    </div>
                  </div>
                </div>
              </button>

              {/* Replace everywhere option */}
              {hasMultipleUsages ? (
                <button
                  onClick={() => setSelectedOption('all')}
                  style={{
                    width: '100%',
                    padding: `${spacing.md} ${spacing.lg}`,
                    textAlign: 'left',
                    border: `1px solid ${selectedOption === 'all' ? framerColors.text : 'var(--framer-color-divider)'}`,
                    borderRadius: borders.radius.lg,
                    backgroundColor: selectedOption === 'all' ? 'var(--framer-color-bg-secondary)' : backgrounds.page,
                    boxShadow: selectedOption === 'all' ? '0 1px 2px rgba(0, 0, 0, 0.04)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedOption !== 'all') {
                      e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
                      e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedOption !== 'all') {
                      e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
                      e.currentTarget.style.backgroundColor = backgrounds.page
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md
                  }}>
                    <div style={{ flexShrink: 0 }}>
                      <div 
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: `2px solid ${selectedOption === 'all' ? framerColors.text : framerColors.textTertiary}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: selectedOption === 'all' ? framerColors.text : backgrounds.page,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {selectedOption === 'all' && (
                          <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--framer-color-bg)' }}>
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div style={{
                        fontWeight: typography.fontWeight.medium,
                        fontSize: typography.fontSize.sm,
                        wordBreak: 'break-word',
                        color: framerColors.text
                      }}>
                        Replace everywhere ({usageCount} places)
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                <div 
                  style={{
                    width: '100%',
                    padding: `${spacing.md} ${spacing.lg}`,
                    border: `1px solid var(--framer-color-divider)`,
                    borderRadius: borders.radius.lg,
                    cursor: 'not-allowed',
                    backgroundColor: 'var(--framer-color-bg-tertiary)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md
                  }}>
                    <div style={{ flexShrink: 0 }}>
                      <div 
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: `2px solid ${framerColors.textTertiary}`,
                          backgroundColor: 'var(--framer-color-bg-secondary)'
                        }}
                      ></div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div style={{
                        fontWeight: typography.fontWeight.medium,
                        fontSize: typography.fontSize.sm,
                        wordBreak: 'break-word',
                        color: framerColors.textTertiary
                      }}>Replace everywhere (not available)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky footer with action buttons */}
        <div 
          style={{
            padding: `${spacing.md} ${spacing.xl}`,
            borderTop: `1px solid var(--framer-color-divider)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: spacing.md,
            flexShrink: 0,
            backgroundColor: backgrounds.page
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              borderRadius: borders.radius.md,
              color: framerColors.text,
              backgroundColor: 'var(--framer-color-bg-secondary)',
              border: '1px solid var(--framer-color-divider)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedOption}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              borderRadius: borders.radius.md,
              border: '1px solid var(--framer-color-divider)',
              transition: 'all 0.15s ease',
              ...(selectedOption ? {
                backgroundColor: backgrounds.page,
                color: framerColors.text,
                cursor: 'pointer'
              } : {
                backgroundColor: 'var(--framer-color-bg-tertiary)',
                color: framerColors.textTertiary,
                cursor: 'not-allowed',
                opacity: 0.5
              })
            }}
            onMouseEnter={(e) => {
              if (selectedOption) {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                e.currentTarget.style.borderColor = framerColors.textSecondary
              }
            }}
            onMouseLeave={(e) => {
              if (selectedOption) {
                e.currentTarget.style.backgroundColor = backgrounds.page
                e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
              }
            }}
          >
            Replace Image
          </button>
        </div>
      </div>
    </div>
  )
}

