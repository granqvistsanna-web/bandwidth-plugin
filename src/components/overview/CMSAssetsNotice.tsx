import { useState } from 'react'
import { framer } from 'framer-plugin'
import type { ProjectAnalysis } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'
import { CMSManualEstimateModal } from './CMSManualEstimateModal'
import type { ManualCMSEstimate } from '../../hooks/useAnalysis'
import { debugLog } from '../../utils/debugLog'
import { spacing, typography, borders, colors } from '../../styles/designTokens'

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

  return (
    <>
      <div
        style={{
          padding: spacing.md,
          backgroundColor: colors.warmGray[100],
          borderRadius: borders.radius.lg,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.sm,
        }}>
          <div>
            <h3 style={{
              fontSize: typography.fontSize.md,
              fontWeight: typography.fontWeight.semibold,
              color: 'var(--framer-color-text)',
              margin: 0,
              marginBottom: spacing.xs,
            }}>
              CMS Assets
            </h3>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: 'var(--framer-color-text-secondary)',
              fontFamily: typography.fontFamily.sans,
            }}>
              {cmsCount > 0 ? (
                <>
                  {cmsCount} detected • {formatBytes(cmsBytes)}
                  {cmsNotFound > 0 && ` • ${cmsNotFound} estimated`}
                </>
              ) : (
                'Not detected'
              )}
            </div>
          </div>
        </div>

        {/* Manual Estimates List */}
        {hasManualEstimates && manualCMSEstimates.length > 0 && (
          <div style={{
            marginBottom: spacing.md,
            paddingTop: spacing.md,
            borderTop: `${borders.width.thin} solid var(--framer-color-divider)`,
          }}>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: 'var(--framer-color-text-secondary)',
              marginBottom: spacing.sm,
              fontFamily: typography.fontFamily.sans,
            }}>
              Manual Estimates ({manualCMSEstimates.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
              {manualCMSEstimates.map((estimate) => (
                <div
                  key={estimate.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: spacing.sm,
                    backgroundColor: 'var(--framer-color-bg)',
                    borderRadius: borders.radius.sm,
                    border: `${borders.width.thin} solid var(--framer-color-divider)`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onEditEstimate) {
                      setEditingEstimate(estimate)
                      setShowManualEstimateModal(true)
                    }
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: 'var(--framer-color-text)',
                      marginBottom: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {estimate.collectionName}
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: 'var(--framer-color-text-secondary)',
                      fontFamily: typography.fontFamily.sans,
                    }}>
                      {estimate.imageCount} image{estimate.imageCount !== 1 ? 's' : ''} • {formatBytes(estimate.estimatedBytes)}
                    </div>
                  </div>
                  {onEditEstimate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setEditingEstimate(estimate)
                        setShowManualEstimateModal(true)
                      }}
                      style={{
                        padding: spacing.xs,
                        fontSize: typography.fontSize.xs,
                        color: 'var(--framer-color-text-secondary)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: borders.radius.sm,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                        e.currentTarget.style.color = 'var(--framer-color-text)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = 'var(--framer-color-text-secondary)'
                      }}
                      title="Edit estimate"
                    >
                      edit
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={() => {
            setEditingEstimate(undefined)
            setShowManualEstimateModal(true)
          }}
          style={{
            padding: `${spacing.xs} ${spacing.md}`,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: 'var(--framer-color-text)',
            backgroundColor: 'transparent',
            border: `${borders.width.thin} solid var(--framer-color-divider)`,
            borderRadius: borders.radius.sm,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--framer-color-text-secondary)'
            e.currentTarget.style.backgroundColor = 'var(--framer-color-bg)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          {cmsCount === 0 ? 'Add Manual Estimate' : 'Add Estimate'}
        </button>

        {/* Guidance Text */}
        {cmsCount === 0 && (
          <div style={{
            marginTop: spacing.sm,
            padding: spacing.sm,
            fontSize: typography.fontSize.xs,
            color: 'var(--framer-color-text-secondary)',
            backgroundColor: 'var(--framer-color-bg)',
            borderRadius: borders.radius.sm,
          }}>
            CMS assets are detected from your published site. Add manual estimates if your site isn't published or some collections aren't detected.
          </div>
        )}
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
              if (onRemoveEstimate && typeof onRemoveEstimate === 'function') {
                onRemoveEstimate(id)
              } else {
                framer.notify('Cannot remove estimate: function not available', { variant: 'error' })
                return
              }
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
