import { useState } from 'react'
import { framer } from 'framer-plugin'
import type { ProjectAnalysis } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'
import { CMSManualEstimateModal } from './CMSManualEstimateModal'
import type { ManualCMSEstimate } from '../../hooks/useAnalysis'
import { debugLog } from '../../utils/debugLog'

interface CMSAssetsNoticeProps {
  analysis: ProjectAnalysis
  onCMSEstimateAdded?: () => void
  manualCMSEstimates?: ManualCMSEstimate[]
  onEditEstimate?: (estimate: ManualCMSEstimate) => void
  onRemoveEstimate?: (id: string) => void
  onAddEstimate?: (estimate: Omit<ManualCMSEstimate, 'id' | 'createdAt'>) => void
  onUpdateEstimate?: (id: string, estimate: Partial<Omit<ManualCMSEstimate, 'id' | 'createdAt'>>) => void
}

export function CMSAssetsNotice({ 
  analysis, 
  onCMSEstimateAdded,
  manualCMSEstimates = [],
  onEditEstimate,
  onRemoveEstimate,
  onAddEstimate,
  onUpdateEstimate
}: CMSAssetsNoticeProps) {
  const [showManualEstimateModal, setShowManualEstimateModal] = useState(false)
  const [editingEstimate, setEditingEstimate] = useState<ManualCMSEstimate | undefined>()
  
  const cmsCount = analysis.cmsAssetsCount || 0
  const cmsBytes = analysis.cmsAssetsBytes || 0
  const hasManualEstimates = analysis.hasManualCMSEstimates || false
  const cmsNotFound = analysis.cmsAssetsNotFound || 0
  const bandwidthImpact = analysis.cmsBandwidthImpact

  // Always show CMS notice - CMS assets often can't be detected automatically
  // Users need to add manual estimates for CMS content

  return (
    <>
      <div
        className="rounded-lg p-4 border"
        style={{
          backgroundColor: '#FAF9F8',
          borderColor: 'var(--framer-color-divider)',
          borderWidth: '1px'
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {cmsCount === 0 ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--framer-color-text-secondary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : hasManualEstimates ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--framer-color-text-secondary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--framer-color-text-secondary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold" style={{ color: 'var(--framer-color-text)' }}>
                CMS Assets
              </h4>
              {cmsCount > 0 && (
                <span
                  className="px-2 py-0.5 rounded text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--framer-color-bg-secondary)',
                    color: 'var(--framer-color-text)'
                  }}
                >
                  {cmsCount} detected
                </span>
              )}
              {hasManualEstimates && (
                <span
                  className="px-2 py-0.5 rounded text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--framer-color-bg-secondary)',
                    color: 'var(--framer-color-text)'
                  }}
                >
                  Manual Estimates
                </span>
              )}
            </div>
            
            <p className="text-xs mb-2" style={{ color: 'var(--framer-color-text-secondary)' }}>
              {cmsCount > 0 ? (
                <>
                  {cmsCount} CMS asset{cmsCount !== 1 ? 's' : ''} automatically detected ({formatBytes(cmsBytes)})
                  {cmsNotFound > 0 && ` • ${cmsNotFound} not found (estimated)`}
                  {hasManualEstimates && ' • Some are manual estimates'}
                  <span className="block mt-1 text-xs" style={{ color: 'var(--framer-color-text-tertiary)' }}>
                    💡 Tip: If you have CMS collections (like blog posts, products, etc.) that aren't detected, add manual estimates for complete analysis.
                  </span>
                  {bandwidthImpact && (
                    <span className="block mt-1">
                      Estimated monthly bandwidth: {formatBytes(bandwidthImpact.monthlyBandwidth)} 
                      ({bandwidthImpact.assumptions.pageviewsPerMonth.toLocaleString()} pageviews × {bandwidthImpact.assumptions.itemsPerPage} items/page)
                    </span>
                  )}
                </>
              ) : (
                <>
                  CMS assets are automatically detected from your published site (blog posts, products, team members, etc.). 
                  If your site isn't published yet or some CMS collections aren't detected, you can add manual estimates.
                </>
              )}
            </p>
            
            {hasManualEstimates && manualCMSEstimates.length > 0 && (
              <div className="mb-3 space-y-2">
                <p className="text-xs font-medium" style={{ color: 'var(--framer-color-text-secondary)' }}>
                  Manual Estimates ({manualCMSEstimates.length}):
                </p>
                <p className="text-xs" style={{ color: 'var(--framer-color-text-tertiary)' }}>
                  Click "Edit" to modify or delete an estimate
                </p>
                {manualCMSEstimates.map((estimate) => (
                  <div
                    key={estimate.id}
                    className="flex items-center justify-between p-2 rounded text-xs"
                    style={{
                      backgroundColor: 'var(--framer-color-bg-tertiary)',
                      border: '1px solid var(--framer-color-divider)',
                      position: 'relative',
                      overflow: 'visible'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-medium truncate" style={{ color: 'var(--framer-color-text)' }}>
                        {estimate.collectionName}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--framer-color-text-secondary)' }}>
                        {estimate.imageCount} image{estimate.imageCount !== 1 ? 's' : ''} • {formatBytes(estimate.estimatedBytes)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {onEditEstimate && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setEditingEstimate(estimate)
                            setShowManualEstimateModal(true)
                          }}
                          className="p-1.5 rounded transition-colors flex-shrink-0"
                          style={{ 
                            color: 'var(--framer-color-text-secondary)',
                            cursor: 'pointer'
                          }}
                          title="Edit estimate"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                            e.currentTarget.style.color = 'var(--framer-color-text)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.color = 'var(--framer-color-text-secondary)'
                          }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Show add button - always available */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingEstimate(undefined)
                  setShowManualEstimateModal(true)
                }}
                className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: cmsCount === 0 ? 'var(--framer-color-tint)' : 'transparent',
                  color: cmsCount === 0 ? 'var(--framer-color-text-reversed)' : 'var(--framer-color-text-secondary)',
                  border: cmsCount === 0 ? 'none' : '1px solid var(--framer-color-divider)'
                }}
                onMouseEnter={(e) => {
                  if (cmsCount === 0) {
                    e.currentTarget.style.opacity = '0.9'
                  } else {
                    e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-tertiary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (cmsCount === 0) {
                    e.currentTarget.style.opacity = '1'
                  } else {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {cmsCount === 0 ? 'Add Manual Estimate' : 'Add Manual Estimate (optional)'}
              </button>
            </div>
            
            {cmsCount === 0 && (
              <p className="text-xs mt-2 p-2 rounded" style={{ 
                backgroundColor: 'var(--framer-color-bg-tertiary)',
                color: 'var(--framer-color-text-secondary)'
              }}>
                <strong>Note:</strong> CMS images are automatically detected from your published site. If your site isn't published yet or some CMS assets are missing, you can add manual estimates.
              </p>
            )}
          </div>
        </div>
      </div>

      {showManualEstimateModal && (
        <CMSManualEstimateModal
          estimateToEdit={editingEstimate}
          onClose={() => {
            setShowManualEstimateModal(false)
            setEditingEstimate(undefined)
          }}
          onEstimateAdded={() => {
            setShowManualEstimateModal(false)
            setEditingEstimate(undefined)
            if (onCMSEstimateAdded) {
              onCMSEstimateAdded()
            }
          }}
          onAddEstimate={onAddEstimate}
          onUpdateEstimate={onUpdateEstimate}
          onRemoveEstimate={onRemoveEstimate ? (id: string) => {
            try {
              // Call the actual remove function from props directly
              if (onRemoveEstimate && typeof onRemoveEstimate === 'function') {
                onRemoveEstimate(id)
              } else {
                framer.notify('Cannot remove estimate: function not available', { variant: 'error' })
                return
              }

              // Close modal and clear editing state immediately
              setShowManualEstimateModal(false)
              setEditingEstimate(undefined)
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error'
              framer.notify(`Failed to remove estimate: ${errorMessage}`, { variant: 'error' })
            }
          } : undefined}
        />
      )}
    </>
  )
}

