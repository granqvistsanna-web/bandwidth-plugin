import { useState, useEffect } from 'react'
import { findAllNodesUsingAsset } from '../../services/assetReplacer'
import { debugLog } from '../../utils/debugLog'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'var(--overlay-modal)' }}>
      <div
        className="rounded-lg max-w-lg w-full border overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--surface-secondary)',
          borderColor: 'var(--framer-color-divider)',
          boxShadow: 'var(--elevation-strong)'
        }}
      >
        {/* Header with close button */}
        <div 
          className="relative px-6 pt-6 pb-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--framer-color-divider)' }}
        >
          <h3 className="text-lg font-semibold pr-10" style={{ color: framerColors.text }}>
            Replace Image
          </h3>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded transition-colors"
            style={{
              color: framerColors.textSecondary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="px-6 py-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center">
              <svg className="w-8 h-8 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24" style={{ color: framerColors.textSecondary }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm font-medium" style={{ color: framerColors.textSecondary }}>Checking usage...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Replace only this node option */}
              <button
                onClick={() => setSelectedOption('single')}
                className="w-full px-6 py-5 text-left border-2 rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={selectedOption === 'single' ? {
                  borderColor: framerColors.text,
                  backgroundColor: 'var(--framer-color-bg-secondary)',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                } : {
                  borderColor: 'var(--framer-color-divider)',
                  backgroundColor: backgrounds.page
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
                    e.currentTarget.style.backgroundColor = 'var(--framer-color-bg)'
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div 
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                      style={selectedOption === 'single' ? {
                        borderColor: framerColors.text,
                        backgroundColor: framerColors.text
                      } : {
                        borderColor: framerColors.textTertiary,
                        backgroundColor: backgrounds.page
                      }}
                    >
                      {selectedOption === 'single' && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--framer-color-bg)' }}>
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-semibold text-base break-words" style={{ color: framerColors.text }}>
                      Replace only this element
                    </div>
                  </div>
                </div>
              </button>

              {/* Replace everywhere option */}
              {hasMultipleUsages ? (
                <button
                  onClick={() => setSelectedOption('all')}
                  className="w-full px-5 py-4 text-left border rounded-lg transition-all duration-200 group"
                  style={selectedOption === 'all' ? {
                    borderColor: framerColors.text,
                    backgroundColor: 'var(--framer-color-bg-secondary)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                  } : {
                    borderColor: 'var(--framer-color-divider)',
                    backgroundColor: backgrounds.page
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
                      e.currentTarget.style.backgroundColor = 'var(--framer-color-bg)'
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div 
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                        style={selectedOption === 'all' ? {
                          borderColor: framerColors.text,
                          backgroundColor: framerColors.text
                        } : {
                          borderColor: framerColors.textTertiary,
                          backgroundColor: backgrounds.page
                        }}
                      >
                        {selectedOption === 'all' && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--framer-color-bg)' }}>
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium text-sm break-words" style={{ color: framerColors.text }}>
                      Replace everywhere ({usageCount} places)
                    </div>
                    </div>
                  </div>
                </button>
              ) : (
                <div 
                  className="w-full px-5 py-4 border rounded-lg cursor-not-allowed"
                  style={{
                    borderColor: 'var(--framer-color-divider)',
                    backgroundColor: 'var(--framer-color-bg-tertiary)'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div 
                        className="w-5 h-5 rounded-full border-2"
                        style={{
                          borderColor: framerColors.textTertiary,
                          backgroundColor: 'var(--framer-color-bg-secondary)'
                        }}
                      ></div>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-medium text-sm break-words" style={{ color: framerColors.textTertiary }}>Replace everywhere (not available)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky footer with action buttons */}
        <div 
          className="px-6 py-5 border-t flex items-center justify-end gap-3 flex-shrink-0"
          style={{
            backgroundColor: backgrounds.page,
            borderColor: 'var(--framer-color-divider)'
          }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium rounded-md transition-all"
            style={{
              color: framerColors.text,
              backgroundColor: 'var(--framer-color-bg-secondary)',
              border: '1px solid var(--framer-color-divider)'
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
            className="px-5 py-2.5 text-sm font-semibold rounded-md transition-all"
            style={selectedOption ? {
              backgroundColor: backgrounds.page,
              color: framerColors.text,
              border: '1px solid var(--framer-color-divider)',
              cursor: 'pointer'
            } : {
              backgroundColor: 'var(--framer-color-bg-tertiary)',
              color: framerColors.textTertiary,
              border: '1px solid var(--framer-color-divider)',
              cursor: 'not-allowed'
            }}
            onMouseEnter={(e) => {
              if (selectedOption) {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                e.currentTarget.style.borderColor = framerColors.textSecondary
              }
            }}
            onMouseLeave={(e) => {
              if (selectedOption) {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg)'
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

