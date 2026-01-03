import { useState, useEffect } from 'react'
import { findAllNodesUsingAsset } from '../../services/assetReplacer'

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
  imageAssetId,
  nodeName
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
          console.error('Error finding usage count:', error)
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
  const truncatedNodeName = nodeName.length > 30 ? nodeName.substring(0, 30) + '...' : nodeName

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with close button */}
        <div className="relative px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900 pr-10">
            Replace Image
          </h3>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            aria-label="Close"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="px-6 py-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center">
              <svg className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-gray-500 font-medium">Checking usage...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Replace only this node option */}
              <button
                onClick={() => setSelectedOption('single')}
                className={`w-full px-6 py-5 text-left border-2 rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  selectedOption === 'single'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedOption === 'single'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-400 bg-white group-hover:border-gray-500'
                    }`}>
                      {selectedOption === 'single' && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className={`font-semibold text-base break-words ${
                      selectedOption === 'single' ? 'text-gray-900' : 'text-gray-800'
                    }`}>
                      Replace only this element
                    </div>
                  </div>
                </div>
              </button>

              {/* Replace everywhere option */}
              {hasMultipleUsages ? (
                <button
                  onClick={() => setSelectedOption('all')}
                  className={`w-full px-6 py-5 text-left border-2 rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    selectedOption === 'all'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedOption === 'all'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-400 bg-white group-hover:border-gray-500'
                      }`}>
                        {selectedOption === 'all' && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className={`font-semibold text-base break-words ${
                        selectedOption === 'all' ? 'text-gray-900' : 'text-gray-800'
                      }`}>
                        Replace everywhere ({usageCount} places)
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="w-full px-6 py-5 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-gray-100"></div>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold text-base text-gray-400 break-words">Replace everywhere (not available)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky footer with action buttons */}
        <div className="px-6 py-5 bg-white border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedOption}
            className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              selectedOption
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 cursor-pointer shadow-sm'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Replace Image
          </button>
        </div>
      </div>
    </div>
  )
}

