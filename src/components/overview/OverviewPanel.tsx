import { framer } from 'framer-plugin'
import type { ProjectAnalysis } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'
import { BreakdownChart } from './BreakdownChart'
import { generateMarkdownReport, copyToClipboard, downloadJSON } from '../../utils/exportReport'
import { CMSAssetsNotice } from './CMSAssetsNotice'
import { debugLog } from '../../utils/debugLog'
import type { ManualCMSEstimate } from '../../hooks/useAnalysis'
import { spacing, typography, borders, colors } from '../../styles/designTokens'
import { formatTimestamp } from '../../utils/formatTimestamp'

interface OverviewPanelProps {
  analysis: ProjectAnalysis
  onNavigateToRecommendations?: () => void
  onRescan?: () => void
  manualCMSEstimates?: ManualCMSEstimate[]
  addManualCMSEstimate?: (estimate: Omit<ManualCMSEstimate, 'id' | 'createdAt'>) => void
  updateManualCMSEstimate?: (id: string, estimate: Partial<Omit<ManualCMSEstimate, 'id' | 'createdAt'>>) => void
  removeManualCMSEstimate?: (id: string) => void
  lastScanned?: Date | null
  loading?: boolean
}

export function OverviewPanel({
  analysis,
  onNavigateToRecommendations,
  onRescan,
  manualCMSEstimates = [],
  removeManualCMSEstimate,
  addManualCMSEstimate,
  updateManualCMSEstimate,
  lastScanned,
  loading
}: OverviewPanelProps) {

  const breakpointData = analysis.overallBreakpoints.desktop
  const recommendations = analysis.allRecommendations
  const customCode = analysis.publishedData?.customCode

  const handleExportMarkdown = async () => {
    try {
      const markdown = generateMarkdownReport(analysis)
      const success = await copyToClipboard(markdown)
      if (success) {
        framer.notify('Markdown report copied to clipboard!', { variant: 'success', durationMs: 2000 })
      } else {
        framer.notify('Failed to copy report', { variant: 'error' })
      }
    } catch (error) {
      debugLog.error('Export failed:', error)
      framer.notify('Export failed', { variant: 'error' })
    }
  }

  const handleExportJSON = async () => {
    try {
      const success = await downloadJSON(analysis)
      if (success) {
        framer.notify('JSON report downloaded!', { variant: 'success', durationMs: 2000 })
      } else {
        framer.notify('Failed to download report', { variant: 'error' })
      }
    } catch (error) {
      debugLog.error('JSON export failed:', error)
      framer.notify('Export failed', { variant: 'error' })
    }
  }

  const totalSavings = recommendations.reduce((sum, r) => sum + r.potentialSavings, 0)
  const currentTotal = breakpointData.totalBytes
  const savingsPercent = currentTotal > 0 ? (totalSavings / currentTotal) * 100 : 0

  return (
    <div style={{
      padding: spacing.lg,
      backgroundColor: 'var(--framer-color-bg)',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg
      }}>
        {/* Page Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md
        }}>
          <h1 style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: 'var(--framer-color-text)',
            margin: 0,
            lineHeight: typography.lineHeight.tight
          }}>
            Overview
          </h1>
          {lastScanned && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: colors.warmGray[100],
              borderRadius: borders.radius.md,
              fontSize: typography.fontSize.xs,
              color: 'var(--framer-color-text-secondary)'
            }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: loading ? '#3b82f6' : '#22c55e',
                  opacity: loading ? 0.8 : 1,
                  flexShrink: 0
                }}
              />
              <span>{loading ? 'analyzing' : formatTimestamp(lastScanned)}</span>
            </div>
          )}
        </div>

        {/* Page Weight - Large, minimal */}
      <div>
          <div style={{
            fontSize: '36px',
            fontWeight: typography.fontWeight.bold,
            lineHeight: '1',
            color: colors.almostBlack,
            marginBottom: spacing.xs,
            letterSpacing: '-0.02em'
          }}>
            {formatBytes(currentTotal)}
      </div>

          {/* Inline secondary metric */}
          <div style={{
            fontSize: typography.fontSize.xs,
            color: colors.warmGray[500]
          }}>
            {breakpointData.assets.length} assets across all pages
          </div>
        </div>

        {/* Savings potential - if exists */}
        {totalSavings > 0 && (
          <div style={{
            backgroundColor: colors.warmGray[100],
            borderRadius: borders.radius.lg,
            padding: spacing.md
          }}>
            {/* Header with savings amount */}
            <div style={{
              marginBottom: spacing.sm
            }}>
              <div style={{
                fontSize: '20px',
                fontWeight: typography.fontWeight.bold,
                lineHeight: '1.1',
                color: colors.almostBlack,
                marginBottom: '2px',
                letterSpacing: '-0.01em'
              }}>
                {formatBytes(totalSavings)}
          </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: colors.warmGray[500]
              }}>
                could be saved ({savingsPercent.toFixed(0)}% reduction)
        </div>
      </div>

            {onNavigateToRecommendations && (
              <button
                onClick={onNavigateToRecommendations}
                style={{
                  padding: `${spacing.xs} ${spacing.md}`,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.white,
                  backgroundColor: colors.almostBlack,
                  border: 'none',
                  borderRadius: borders.radius.sm,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                  width: '100%',
                  marginBottom: spacing.sm
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.85'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                View {recommendations.length} {recommendations.length === 1 ? 'opportunity' : 'opportunities'}
              </button>
            )}

            {/* Top 3 opportunities - compact */}
            <div style={{
              paddingTop: spacing.sm,
              borderTop: `1px solid ${colors.warmGray[200]}`,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.xs
            }}>
              {[...recommendations]
                .sort((a, b) => b.potentialSavings - a.potentialSavings)
                .slice(0, 3)
                .map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: spacing.sm,
                      cursor: 'pointer',
                      padding: spacing.xs,
                      marginLeft: `-${spacing.xs}`,
                      marginRight: `-${spacing.xs}`,
                      borderRadius: borders.radius.sm,
                      transition: 'background-color 0.15s ease'
                    }}
                    onClick={onNavigateToRecommendations}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.warmGray[50]
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.almostBlack,
                        marginBottom: '1px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {rec.nodeName}
                      </div>
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.warmGray[500],
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: '1.3'
                      }}>
                        {rec.actionable || rec.description}
                      </div>
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.almostBlack,
                      flexShrink: 0
                    }}>
                      -{formatBytes(rec.potentialSavings)}
                    </div>
                  </div>
                ))}
          </div>
          </div>
        )}

        {/* Asset Breakdown */}
        <div style={{
          backgroundColor: colors.warmGray[100],
          borderRadius: borders.radius.lg,
          padding: spacing.md
        }}>
          <div style={{
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            color: 'var(--framer-color-text)',
            marginBottom: spacing.sm
          }}>
            Breakdown
          </div>
          <BreakdownChart breakdown={breakpointData.breakdown} totalBytes={breakpointData.totalBytes} />
        </div>

        {/* CMS Assets Notice */}
        <CMSAssetsNotice
          analysis={analysis}
          onCMSEstimateAdded={onRescan}
          manualCMSEstimates={manualCMSEstimates}
          onEditEstimate={() => {}}
          onRemoveEstimate={(id) => {
            if (!id || !removeManualCMSEstimate) return
            try {
              removeManualCMSEstimate(id)
              if (onRescan) {
                setTimeout(() => onRescan(), 500)
              }
            } catch (error) {
              debugLog.error('Failed to remove estimate:', error)
              framer.notify('Failed to remove estimate', { variant: 'error' })
            }
          }}
          onAddEstimate={addManualCMSEstimate}
          onUpdateEstimate={updateManualCMSEstimate}
        />

        {/* Custom Code Assets */}
        {customCode && customCode.hasCustomCode && (
          <div style={{
            backgroundColor: colors.warmGray[100],
            borderRadius: borders.radius.lg,
            padding: spacing.md
          }}>
            <div style={{
              fontSize: typography.fontSize.md,
              fontWeight: typography.fontWeight.semibold,
              color: 'var(--framer-color-text)',
              marginBottom: spacing.sm
            }}>
              Custom code
            </div>
              <div style={{ marginBottom: spacing.sm }}>
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.warmGray[500],
                  marginBottom: '2px'
                }}>
                  Dynamically loaded assets
                </div>
                <div style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.almostBlack
                }}>
                  {formatBytes(customCode.totalEstimatedBytes)}
                </div>
              </div>

              {customCode.assets.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.sm
                }}>
                  {customCode.assets.slice(0, 5).map((asset, i) => (
                    <div
                      key={i}
                      style={{
                        paddingBottom: spacing.sm,
                        borderBottom: i < Math.min(4, customCode.assets.length - 1) ? `1px solid ${colors.warmGray[100]}` : 'none'
                      }}
                    >
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.almostBlack,
                        marginBottom: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {asset.url}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        fontSize: typography.fontSize.xs,
                        color: colors.warmGray[500]
                      }}>
                        <span>{asset.type}</span>
                        {asset.isLazyLoaded && <span>• lazy loaded</span>}
                        {asset.estimatedBytes && <span>• {formatBytes(asset.estimatedBytes)}</span>}
                      </div>
              </div>
            ))}
                  {customCode.assets.length > 5 && (
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.warmGray[500],
                      paddingTop: spacing.xs
                    }}>
                      + {customCode.assets.length - 5} more
                    </div>
                  )}
                </div>
              )}
          </div>
        )}

        {/* Export Actions */}
        <div>
          <div style={{
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            color: colors.almostBlack,
            marginBottom: spacing.sm
          }}>
            Export
          </div>
          <div style={{
            display: 'flex',
            gap: spacing.sm
          }}>
            <button
              onClick={handleExportMarkdown}
              style={{
                flex: 1,
                padding: `${spacing.xs} ${spacing.sm}`,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: colors.almostBlack,
                backgroundColor: colors.white,
                border: `1px solid ${colors.warmGray[200]}`,
                borderRadius: borders.radius.sm,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.warmGray[300]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.warmGray[200]
              }}
            >
              Copy Markdown
            </button>
            <button
              onClick={handleExportJSON}
              style={{
                flex: 1,
                padding: `${spacing.xs} ${spacing.sm}`,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: colors.almostBlack,
                backgroundColor: colors.white,
                border: `1px solid ${colors.warmGray[200]}`,
                borderRadius: borders.radius.sm,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.warmGray[300]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.warmGray[200]
              }}
            >
              Download JSON
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
