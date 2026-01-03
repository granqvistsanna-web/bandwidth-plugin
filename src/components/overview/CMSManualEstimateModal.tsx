import { useState } from 'react'
import { framer } from 'framer-plugin'
import { formatBytes } from '../../utils/formatBytes'
import { debugLog } from '../../utils/debugLog'

interface CMSManualEstimateModalProps {
  onClose: () => void
  onEstimateAdded: () => void
  estimateToEdit?: {
    id: string
    collectionName: string
    imageCount: number
    avgWidth: number
    avgHeight: number
    format: string
    estimatedBytes: number
  }
  onAddEstimate?: (estimate: Omit<{ id: string; collectionName: string; imageCount: number; avgWidth: number; avgHeight: number; format: string; estimatedBytes: number; createdAt?: string }, 'id' | 'createdAt'>) => void
  onUpdateEstimate?: (id: string, estimate: Partial<Omit<{ id: string; collectionName: string; imageCount: number; avgWidth: number; avgHeight: number; format: string; estimatedBytes: number; createdAt?: string }, 'id' | 'createdAt'>>) => void
  onRemoveEstimate?: (id: string) => void
}

export function CMSManualEstimateModal({ onClose, onEstimateAdded, estimateToEdit, onAddEstimate, onUpdateEstimate, onRemoveEstimate }: CMSManualEstimateModalProps) {
  const isEditMode = !!estimateToEdit
  const [collectionName, setCollectionName] = useState(estimateToEdit?.collectionName || '')
  const [imageCount, setImageCount] = useState(estimateToEdit?.imageCount || 1)
  const [avgWidth, setAvgWidth] = useState(estimateToEdit?.avgWidth || 1920)
  const [avgHeight, setAvgHeight] = useState(estimateToEdit?.avgHeight || 1080)
  const [format, setFormat] = useState(estimateToEdit?.format || 'jpeg')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const estimatedBytesPerImage = Math.round((avgWidth * avgHeight * 4) * (format === 'webp' ? 0.10 : format === 'png' ? 0.40 : 0.15))
  const totalEstimatedBytes = estimatedBytesPerImage * imageCount

  const handleSubmit = async () => {
    if (!collectionName.trim()) {
      framer.notify('Please enter a collection name', { variant: 'error' })
      return
    }

    if (imageCount < 1) {
      framer.notify('Image count must be at least 1', { variant: 'error' })
      return
    }

    setIsSubmitting(true)

    try {
      const estimateData = {
        collectionName: collectionName.trim(),
        imageCount,
        avgWidth,
        avgHeight,
        format,
        estimatedBytes: totalEstimatedBytes
      }
      
      if (isEditMode && estimateToEdit && onUpdateEstimate) {
        // Update existing estimate via hook
        onUpdateEstimate(estimateToEdit.id, estimateData)
        framer.notify(`Updated manual estimate: ${collectionName} (${formatBytes(totalEstimatedBytes)})`, { 
          variant: 'success',
          durationMs: 3000
        })
      } else if (onAddEstimate) {
        // Add new estimate via hook
        onAddEstimate(estimateData)
        framer.notify(`Added manual estimate: ${collectionName} (${formatBytes(totalEstimatedBytes)})`, { 
          variant: 'success',
          durationMs: 3000
        })
      } else {
        // Fallback to localStorage if hook functions not provided
        const estimatesKey = 'bandwidth-inspector-cms-manual-estimates'
        const existing = localStorage.getItem(estimatesKey)
        const estimates = existing ? JSON.parse(existing) : []
        
        if (isEditMode && estimateToEdit) {
          const index = estimates.findIndex((est: any) => est.id === estimateToEdit.id)
          if (index !== -1) {
            estimates[index] = { ...estimateToEdit, ...estimateData }
            localStorage.setItem(estimatesKey, JSON.stringify(estimates))
            framer.notify(`Updated manual estimate: ${collectionName} (${formatBytes(totalEstimatedBytes)})`, { 
              variant: 'success',
              durationMs: 3000
            })
          }
        } else {
          const newEstimate = {
            id: `manual-${Date.now()}`,
            ...estimateData,
            createdAt: new Date().toISOString()
          }
          estimates.push(newEstimate)
          localStorage.setItem(estimatesKey, JSON.stringify(estimates))
          framer.notify(`Added manual estimate: ${collectionName} (${formatBytes(totalEstimatedBytes)})`, { 
            variant: 'success',
            durationMs: 3000
          })
        }
      }
      
      onEstimateAdded()
    } catch (error) {
      debugLog.error('Failed to save manual estimate:', error)
      framer.notify('Failed to save estimate', { variant: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: '#FAF9F8',
          border: '1px solid var(--framer-color-divider)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--framer-color-text)' }}>
            {isEditMode ? 'Edit CMS Manual Estimate' : 'Add CMS Manual Estimate'}
          </h3>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style={{ color: 'var(--framer-color-text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm mb-4" style={{ color: 'var(--framer-color-text-secondary)' }}>
          Add a manual estimate for CMS assets that couldn't be detected automatically. This will be included in your bandwidth totals.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--framer-color-text)' }}>
              Collection Name
            </label>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="e.g., Blog Posts, Products"
              className="w-full px-3 py-2 rounded-md border text-sm transition-colors"
              style={{
                backgroundColor: 'var(--framer-color-bg)',
                borderColor: 'var(--framer-color-divider)',
                color: 'var(--framer-color-text)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--framer-color-text-secondary)'
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg)'
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--framer-color-text)' }}>
                Image Count
              </label>
              <input
                type="number"
                value={imageCount}
                onChange={(e) => setImageCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-full px-3 py-2 rounded border text-sm"
                style={{
                  backgroundColor: 'var(--framer-color-bg-secondary)',
                  borderColor: 'var(--framer-color-divider)',
                  color: 'var(--framer-color-text)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--framer-color-text)' }}>
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm"
                style={{
                  backgroundColor: 'var(--framer-color-bg-secondary)',
                  borderColor: 'var(--framer-color-divider)',
                  color: 'var(--framer-color-text)'
                }}
              >
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--framer-color-text)' }}>
                Avg Width (px)
              </label>
              <input
                type="number"
                value={avgWidth}
                onChange={(e) => setAvgWidth(Math.max(1, parseInt(e.target.value) || 1920))}
                min="1"
                className="w-full px-3 py-2 rounded border text-sm"
                style={{
                  backgroundColor: 'var(--framer-color-bg-secondary)',
                  borderColor: 'var(--framer-color-divider)',
                  color: 'var(--framer-color-text)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--framer-color-text)' }}>
                Avg Height (px)
              </label>
              <input
                type="number"
                value={avgHeight}
                onChange={(e) => setAvgHeight(Math.max(1, parseInt(e.target.value) || 1080))}
                min="1"
                className="w-full px-3 py-2 rounded border text-sm"
                style={{
                  backgroundColor: 'var(--framer-color-bg-secondary)',
                  borderColor: 'var(--framer-color-divider)',
                  color: 'var(--framer-color-text)'
                }}
              />
            </div>
          </div>

          <div
            className="p-3 rounded"
            style={{
              backgroundColor: 'var(--framer-color-bg-secondary)',
              border: '1px solid var(--framer-color-divider)'
            }}
          >
            <div className="text-xs mb-1" style={{ color: 'var(--framer-color-text-secondary)' }}>
              Estimated Total
            </div>
            <div className="text-lg font-semibold" style={{ color: 'var(--framer-color-text)' }}>
              {formatBytes(totalEstimatedBytes)}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--framer-color-text-tertiary)' }}>
              {imageCount} image{imageCount !== 1 ? 's' : ''} × {formatBytes(estimatedBytesPerImage)} each
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-6">
          {isEditMode && estimateToEdit && (
            <>
              {deleteError && (
                <div className="p-3 rounded text-xs" style={{ backgroundColor: 'var(--framer-color-bg-secondary)', color: 'var(--framer-color-text)', border: '1px solid var(--framer-color-divider)' }}>
                  {deleteError}
                </div>
              )}
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  disabled={isDeleting || !onRemoveEstimate}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    
                    if (isDeleting) {
                      return
                    }

                    if (!onRemoveEstimate) {
                      setDeleteError('Delete function not available. Please try refreshing the plugin.')
                      framer.notify('Cannot delete: function not available', { variant: 'error' })
                      return
                    }

                    if (!estimateToEdit || !estimateToEdit.id) {
                      setDeleteError('Invalid estimate data. Cannot delete.')
                      framer.notify('Cannot delete: invalid estimate', { variant: 'error' })
                      return
                    }

                    // Show confirmation UI instead of window.confirm
                    setShowDeleteConfirm(true)
                    setDeleteError(null)
                  }}
                  className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: onRemoveEstimate ? 'transparent' : 'var(--framer-color-bg-secondary)',
                color: onRemoveEstimate ? 'var(--framer-color-text)' : 'var(--framer-color-text-tertiary)',
                border: `1px solid ${onRemoveEstimate ? 'var(--framer-color-divider)' : 'var(--framer-color-divider)'}`,
                cursor: onRemoveEstimate && !isDeleting ? 'pointer' : 'not-allowed'
              }}
              onMouseEnter={(e) => {
                if (!isDeleting && onRemoveEstimate) {
                  e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                  e.currentTarget.style.borderColor = 'var(--framer-color-text-secondary)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
              }}
                >
                  {isDeleting ? 'Deleting...' : onRemoveEstimate ? 'Delete Estimate' : 'Delete Unavailable'}
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="p-3 rounded text-sm" style={{ backgroundColor: 'var(--framer-color-bg-secondary)', color: 'var(--framer-color-text)' }}>
                    Delete "{estimateToEdit?.collectionName}"? This cannot be undone.
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowDeleteConfirm(false)
                      }}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: 'var(--framer-color-bg-tertiary)',
                        color: 'var(--framer-color-text)'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting || !onRemoveEstimate}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        
                        if (isDeleting || !onRemoveEstimate || !estimateToEdit?.id) {
                          return
                        }

                        setIsDeleting(true)
                        setDeleteError(null)

                        try {
                          // Call the remove function directly
                          onRemoveEstimate(estimateToEdit.id)
                          
                          // Show success notification
                          framer.notify(`Deleted estimate: ${estimateToEdit.collectionName}`, { variant: 'success', durationMs: 2000 })

                          // Close the modal
                          onClose()

                          // Trigger rescan after a delay
                          setTimeout(() => {
                            if (onEstimateAdded) {
                              onEstimateAdded()
                            }
                            setIsDeleting(false)
                            setShowDeleteConfirm(false)
                          }, 200)
                        } catch (error) {
                          setIsDeleting(false)
                          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
                          setDeleteError(`Failed to delete: ${errorMessage}`)
                          framer.notify(`Failed to delete estimate: ${errorMessage}`, { variant: 'error', durationMs: 3000 })
                        }
                      }}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: 'var(--framer-color-bg)',
                        color: 'var(--framer-color-text)',
                        border: '1px solid var(--framer-color-divider)',
                        cursor: isDeleting ? 'not-allowed' : 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (!isDeleting) {
                          e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                          e.currentTarget.style.borderColor = 'var(--framer-color-text-secondary)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDeleting) {
                          e.currentTarget.style.backgroundColor = 'var(--framer-color-bg)'
                          e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
                        }
                      }}
                    >
                      {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--framer-color-bg-tertiary)',
                color: 'var(--framer-color-text)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-tertiary)'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !collectionName.trim()}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: isSubmitting || !collectionName.trim()
                  ? 'var(--framer-color-bg-tertiary)'
                  : 'var(--framer-color-bg)',
                color: isSubmitting || !collectionName.trim()
                  ? 'var(--framer-color-text-tertiary)'
                  : 'var(--framer-color-text)',
                border: '1px solid var(--framer-color-divider)'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting && collectionName.trim()) {
                  e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                  e.currentTarget.style.borderColor = 'var(--framer-color-text-secondary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting && collectionName.trim()) {
                  e.currentTarget.style.backgroundColor = 'var(--framer-color-bg)'
                  e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
                }
              }}
            >
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Estimate' : 'Add Estimate')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

