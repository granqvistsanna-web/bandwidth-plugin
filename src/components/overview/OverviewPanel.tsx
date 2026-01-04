import { framer } from 'framer-plugin'
import type { ProjectAnalysis } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'
import { BreakdownChart } from './BreakdownChart'
import { generateMarkdownReport, copyToClipboard, downloadJSON } from '../../utils/exportReport'
import { CMSAssetsNotice } from './CMSAssetsNotice'
import { Button } from '../primitives/Button'
import { calculateDeviceWeightedBandwidth } from '../../utils/deviceBandwidth'
import { debugLog } from '../../utils/debugLog'
import type { ManualCMSEstimate } from '../../hooks/useAnalysis'
import { spacing, typography, borders, colors, backgrounds, surfaces, themeBorders, themeElevation, hoverStates, framerColors } from '../../styles/designTokens'
import { formatTimestamp } from '../../utils/formatTimestamp'

interface OverviewPanelProps {
  analysis: ProjectAnalysis
  onNavigateToRecommendations?: () => void
  onNavigateToBandwidth?: () => void
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
  onNavigateToBandwidth,
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
  const pages = analysis.pages || []

  // Calculate estimated monthly bandwidth using device-weighted estimates
  // Framer serves responsive image variants - smaller on mobile, larger on desktop
  const estimatedMonthlyBandwidth = (() => {
    const defaultPageviews = 5000 // Conservative default
    const defaultPagesPerVisit = 2.5 // Light browsing - conservative estimate

    if (pages.length === 0) {
      // Fallback: use device-weighted overall breakpoint data
      const weightedBytes = calculateDeviceWeightedBandwidth(analysis.overallBreakpoints)
      const bytesPerVisitGB = weightedBytes / (1024 * 1024 * 1024)
      return bytesPerVisitGB * defaultPageviews
    }

    // Use heaviest page + weighted average of other pages
    // Calculate device-weighted bytes for each page
    const sortedPages = [...pages].sort((a, b) => {
      const aWeighted = calculateDeviceWeightedBandwidth(a.breakpoints)
      const bWeighted = calculateDeviceWeightedBandwidth(b.breakpoints)
      return bWeighted - aWeighted
    })

    const heaviestPage = sortedPages[0]
    const otherPages = sortedPages.slice(1)

    const avgOtherPageBytes = otherPages.length > 0
      ? otherPages.reduce((sum, page) => {
          const weighted = calculateDeviceWeightedBandwidth(page.breakpoints)
          return sum + weighted
        }, 0) / otherPages.length
      : 0

    const heaviestPageWeighted = calculateDeviceWeightedBandwidth(heaviestPage.breakpoints)
    const additionalPages = Math.max(0, defaultPagesPerVisit - 1)
    const bytesPerVisit = heaviestPageWeighted + (additionalPages * avgOtherPageBytes)
    const bytesPerVisitGB = bytesPerVisit / (1024 * 1024 * 1024)

    return bytesPerVisitGB * defaultPageviews
  })()

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
      backgroundColor: backgrounds.page,
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg
      }}>
        {/* Compact Header */}
        <div style={{
          marginBottom: spacing.md
        }}>
          <h1 style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: framerColors.text,
            margin: 0,
            marginBottom: spacing.xs,
            lineHeight: typography.lineHeight.tight,
            letterSpacing: '-0.02em'
          }}>
            Overview
          </h1>
          {lastScanned && (
            <div style={{
              fontSize: typography.fontSize.xs,
              color: framerColors.textSecondary
            }}>
              {loading ? 'Analyzing...' : `Scanned ${formatTimestamp(lastScanned)}`}
            </div>
          )}
        </div>

        {/* Page Weight - Hero Card */}
        <div style={{
          padding: spacing.lg,
          backgroundColor: surfaces.secondary,
          borderRadius: borders.radius.lg,
          border: `1px solid ${themeBorders.subtle}`,
          boxShadow: themeElevation.default
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: spacing.sm,
            marginBottom: spacing.xs
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: typography.fontWeight.bold,
              lineHeight: '1',
              color: framerColors.text,
              letterSpacing: '-0.02em'
            }}>
              {formatBytes(currentTotal)}
            </div>
            <div style={{
              fontSize: typography.fontSize.sm,
              color: framerColors.textSecondary,
              fontWeight: typography.fontWeight.medium
            }}>
              total page weight
            </div>
          </div>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textSecondary,
            marginBottom: spacing.xs
          }}>
            {breakpointData.assets.length} assets across all pages
          </div>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textTertiary,
            lineHeight: typography.lineHeight.relaxed
          }}>
            Desktop viewport (1440px) • 3 breakpoints. Framer serves responsive image variants—smaller on mobile, larger on desktop. Monthly estimates account for device distribution.
          </div>
        </div>

        {/* Savings potential - if exists */}
        {totalSavings > 0 && (
          <div style={{
            backgroundColor: surfaces.secondary,
            borderRadius: borders.radius.lg,
            border: `1px solid ${themeBorders.subtle}`,
            boxShadow: themeElevation.default,
            padding: spacing.lg
          }}>
            {/* Header with savings badge */}
            <div style={{
              marginBottom: spacing.sm,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: `4px ${spacing.sm}`,
                backgroundColor: surfaces.tertiary,
                color: framerColors.text,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
                borderRadius: borders.radius.full,
                letterSpacing: '0.01em'
              }}>
                −{formatBytes(totalSavings)}
              </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: framerColors.textSecondary
              }}>
                can be saved ({savingsPercent.toFixed(0)}% reduction)
              </div>
            </div>

            {onNavigateToRecommendations && (
              <Button
                onClick={onNavigateToRecommendations}
                variant="primary"
                size="sm"
                fullWidth
                style={{ marginBottom: spacing.sm }}
              >
                View {recommendations.length} {recommendations.length === 1 ? 'opportunity' : 'opportunities'}
              </Button>
            )}

            {/* Top 3 opportunities - compact */}
            <div style={{
              paddingTop: spacing.sm,
              borderTop: `1px solid ${themeBorders.subtle}`,
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
                      e.currentTarget.style.backgroundColor = hoverStates.surface
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.medium,
                        color: framerColors.text,
                        marginBottom: '1px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {rec.nodeName}
                      </div>
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        color: framerColors.textSecondary,
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
                      color: framerColors.text,
                      flexShrink: 0
                    }}>
                      -{formatBytes(rec.potentialSavings)}
                    </div>
                  </div>
                ))}
          </div>
          </div>
        )}

        {/* Bandwidth Estimate */}
        <div
          style={{
            backgroundColor: surfaces.secondary,
            borderRadius: borders.radius.lg,
            border: `1px solid ${themeBorders.subtle}`,
            boxShadow: themeElevation.default,
            padding: spacing.lg,
            cursor: onNavigateToBandwidth ? 'pointer' : 'default',
            transition: onNavigateToBandwidth ? 'all 0.15s ease' : 'none'
          }}
          onClick={onNavigateToBandwidth}
          onMouseEnter={(e) => {
            if (onNavigateToBandwidth) {
              e.currentTarget.style.backgroundColor = hoverStates.surface
            }
          }}
          onMouseLeave={(e) => {
            if (onNavigateToBandwidth) {
              e.currentTarget.style.backgroundColor = surfaces.secondary
            }
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: spacing.sm,
            marginBottom: spacing.xs
          }}>
            <div style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: framerColors.text,
              lineHeight: 1,
              letterSpacing: '-0.02em'
            }}>
              {estimatedMonthlyBandwidth.toFixed(2)} GB
            </div>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: framerColors.textSecondary,
              fontWeight: typography.fontWeight.medium
            }}>
              per month
            </div>
          </div>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textSecondary
          }}>
            Estimated bandwidth for 5K pageviews
          </div>
          {onNavigateToBandwidth && (
            <div style={{
              fontSize: typography.fontSize.xs,
              color: framerColors.text,
              marginTop: spacing.xs,
              fontWeight: typography.fontWeight.medium
            }}>
              Click to customize estimate →
            </div>
          )}
        </div>

        {/* Asset Breakdown */}
        <div style={{
          backgroundColor: surfaces.secondary,
          borderRadius: borders.radius.lg,
          border: `1px solid ${themeBorders.subtle}`,
          boxShadow: themeElevation.default,
          padding: spacing.lg
        }}>
          <div style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: framerColors.text,
            marginBottom: spacing.xs,
            letterSpacing: '-0.01em'
          }}>
            Breakdown
          </div>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textTertiary,
            marginBottom: spacing.md
          }}>
            Desktop viewport (1440px) • Shows desktop image sizes
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
            backgroundColor: surfaces.secondary,
            borderRadius: borders.radius.lg,
            border: `1px solid ${themeBorders.subtle}`,
            boxShadow: themeElevation.default,
            padding: spacing.lg
          }}>
            <div style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: framerColors.text,
              marginBottom: spacing.md,
              letterSpacing: '-0.01em'
            }}>
              Custom code
            </div>
              <div style={{ marginBottom: spacing.sm }}>
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: framerColors.textSecondary,
                  marginBottom: '2px'
                }}>
                  Dynamically loaded assets
                </div>
                <div style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: framerColors.text
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
                        borderBottom: i < Math.min(4, customCode.assets.length - 1) ? `1px solid ${themeBorders.subtle}` : 'none'
                      }}
                    >
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.medium,
                        color: framerColors.text,
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
                        color: framerColors.textSecondary
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
                      color: framerColors.textSecondary,
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
        <div style={{
          backgroundColor: surfaces.secondary,
          borderRadius: borders.radius.lg,
          border: `1px solid ${themeBorders.subtle}`,
          boxShadow: themeElevation.default,
          padding: spacing.lg
        }}>
          <div style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: framerColors.text,
            marginBottom: spacing.md,
            letterSpacing: '-0.01em'
          }}>
            Export
          </div>
          <div style={{
            display: 'flex',
            gap: spacing.sm
          }}>
            <Button
              onClick={handleExportMarkdown}
              variant="secondary"
              size="sm"
              style={{ flex: 1 }}
            >
              Copy Markdown
            </Button>
            <Button
              onClick={handleExportJSON}
              variant="secondary"
              size="sm"
              style={{ flex: 1 }}
            >
              Download JSON
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
