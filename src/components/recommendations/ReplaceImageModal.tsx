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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="rounded-2xl shadow-2xl max-w-lg w-full border overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--framer-color-bg)',
          borderColor: 'var(--framer-color-divider)'
        }}
      >
        {/* Header with close button */}
        <div 
          className="relative px-6 pt-6 pb-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--framer-color-divider)' }}
        >
          <h3 className="text-xl font-bold pr-10" style={{ color: 'var(--framer-color-text)' }}>
            Replace Image
          </h3>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              color: 'var(--framer-color-text-secondary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="px-6 py-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center">
              <svg className="w-8 h-8 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--framer-color-tint)' }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm font-medium" style={{ color: 'var(--framer-color-text-secondary)' }}>Checking usage...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Replace only this node option */}
              <button
                onClick={() => setSelectedOption('single')}
                className="w-full px-6 py-5 text-left border-2 rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={selectedOption === 'single' ? {
                  borderColor: 'var(--framer-color-tint)',
                  backgroundColor: 'var(--framer-color-tint-dimmed)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                } : {
                  borderColor: 'var(--framer-color-divider)',
                  backgroundColor: 'var(--framer-color-bg)'
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
                        borderColor: 'var(--framer-color-tint)',
                        backgroundColor: 'var(--framer-color-tint)'
                      } : {
                        borderColor: 'var(--framer-color-text-tertiary)',
                        backgroundColor: 'var(--framer-color-bg)'
                      }}
                    >
                      {selectedOption === 'single' && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-semibold text-base break-words" style={{ color: 'var(--framer-color-text)' }}>
                      Replace only this element
                    </div>
                  </div>
                </div>
              </button>

              {/* Replace everywhere option */}
              {hasMultipleUsages ? (
                <button
                  onClick={() => setSelectedOption('all')}
                  className="w-full px-6 py-5 text-left border-2 rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={selectedOption === 'all' ? {
                    borderColor: 'var(--framer-color-tint)',
                    backgroundColor: 'var(--framer-color-tint-dimmed)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  } : {
                    borderColor: 'var(--framer-color-divider)',
                    backgroundColor: 'var(--framer-color-bg)'
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
                          borderColor: 'var(--framer-color-tint)',
                          backgroundColor: 'var(--framer-color-tint)'
                        } : {
                          borderColor: 'var(--framer-color-text-tertiary)',
                          backgroundColor: 'var(--framer-color-bg)'
                        }}
                      >
                        {selectedOption === 'all' && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold text-base break-words" style={{ color: 'var(--framer-color-text)' }}>
                        Replace everywhere ({usageCount} places)
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                <div 
                  className="w-full px-6 py-5 border-2 rounded-xl cursor-not-allowed"
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
                          borderColor: 'var(--framer-color-text-tertiary)',
                          backgroundColor: 'var(--framer-color-bg-secondary)'
                        }}
                      ></div>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold text-base break-words" style={{ color: 'var(--framer-color-text-tertiary)' }}>Replace everywhere (not available)</div>
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
            backgroundColor: 'var(--framer-color-bg)',
            borderColor: 'var(--framer-color-divider)'
          }}
        >
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              color: 'var(--framer-color-text)',
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
            className="px-6 py-3 text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm"
            style={selectedOption ? {
              backgroundColor: 'var(--framer-color-tint)',
              color: 'var(--framer-color-text-reversed)',
              cursor: 'pointer'
            } : {
              backgroundColor: 'var(--framer-color-bg-tertiary)',
              color: 'var(--framer-color-text-tertiary)',
              cursor: 'not-allowed'
            }}
            onMouseEnter={(e) => {
              if (selectedOption) {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-tint-dark)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedOption) {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-tint)'
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

