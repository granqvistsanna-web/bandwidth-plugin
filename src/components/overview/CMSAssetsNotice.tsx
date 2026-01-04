import { useState } from 'react'
import { framer } from 'framer-plugin'
import type { ProjectAnalysis } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'
import { CMSManualEstimateModal } from './CMSManualEstimateModal'
import { Button } from '../primitives/Button'
import type { ManualCMSEstimate } from '../../hooks/useAnalysis'
import { debugLog } from '../../utils/debugLog'
import { spacing, typography, borders, colors, surfaces, themeBorders, framerColors } from '../../styles/designTokens'

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
          padding: spacing.lg,
          backgroundColor: surfaces.secondary,
          borderRadius: borders.radius.lg,
          border: `1px solid ${themeBorders.subtle}`,
        }}
      >
        {/* Header */}
        <div style={{
          marginBottom: spacing.md,
        }}>
          <h3 style={{
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            color: framerColors.text,
            margin: 0,
            marginBottom: spacing.xs,
          }}>
            CMS Assets
          </h3>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textSecondary,
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

        {/* Manual Estimates List */}
        {hasManualEstimates && manualCMSEstimates.length > 0 && (
          <div style={{
            marginBottom: spacing.lg,
            paddingTop: spacing.md,
            borderTop: `1px solid ${themeBorders.subtle}`,
          }}>
            <div style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: framerColors.textSecondary,
              marginBottom: spacing.sm,
              fontFamily: typography.fontFamily.sans,
            }}>
              Manual Estimates ({manualCMSEstimates.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {manualCMSEstimates.map((estimate) => (
                <div
                  key={estimate.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: spacing.sm,
                    padding: spacing.md,
                    backgroundColor: surfaces.primary,
                    borderRadius: borders.radius.md,
                    border: `1px solid ${themeBorders.subtle}`,
                  }}
                >
                  <div 
                    style={{ 
                      flex: 1, 
                      minWidth: 0,
                      cursor: onEditEstimate ? 'pointer' : 'default'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onEditEstimate) {
                        setEditingEstimate(estimate)
                        setShowManualEstimateModal(true)
                      }
                    }}
                  >
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: framerColors.text,
                      marginBottom: spacing.xs,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {estimate.collectionName}
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: framerColors.textSecondary,
                      fontFamily: typography.fontFamily.sans,
                    }}>
                      {estimate.imageCount} image{estimate.imageCount !== 1 ? 's' : ''} • {formatBytes(estimate.estimatedBytes)}
                    </div>
                  </div>
                  {onEditEstimate && (
                    <Button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setEditingEstimate(estimate)
                        setShowManualEstimateModal(true)
                      }}
                      variant="ghost"
                      size="sm"
                      title="Edit estimate"
                    >
                      Edit
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm
        }}>
          <Button
            onClick={() => {
              setEditingEstimate(undefined)
              setShowManualEstimateModal(true)
            }}
            variant="secondary"
            fullWidth
          >
            {cmsCount === 0 ? 'Add Manual Estimate' : 'Add Estimate'}
          </Button>

          {/* Guidance Text */}
          {cmsCount === 0 && (
            <div style={{
              padding: spacing.md,
              fontSize: typography.fontSize.xs,
              color: framerColors.textSecondary,
              backgroundColor: surfaces.tertiary,
              borderRadius: borders.radius.md,
              lineHeight: typography.lineHeight.relaxed,
            }}>
              CMS assets are detected from your published site. Add manual estimates if your site isn't published or some collections aren't detected.
            </div>
          )}
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
