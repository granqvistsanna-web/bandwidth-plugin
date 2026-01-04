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
import { spacing, typography, borders, colors, backgrounds, surfaces, themeBorders, themeElevation, framerColors } from '../../styles/designTokens'
import { StatusIndicator } from '../common/StatusIndicator'

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

  // Safety checks
  if (!analysis.overallBreakpoints) {
    return (
      <div style={{ padding: spacing.lg, color: framerColors.text }}>
        <p>Analysis data is incomplete. Please rescan the project.</p>
      </div>
    )
  }

  const breakpointData = analysis.overallBreakpoints.desktop
  const recommendations = analysis.allRecommendations || []
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

  const rawTotalSavings = recommendations.reduce((sum, r) => sum + r.potentialSavings, 0)
  const currentTotal = breakpointData.totalBytes
  // Safety: Cap savings at 90% of total to prevent impossible values (e.g., 1GB savings on 872MB total)
  const totalSavings = Math.min(rawTotalSavings, currentTotal * 0.9)
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
        gap: spacing.md
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.sm
        }}>
          <h1 style={{
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.bold,
            color: framerColors.text,
            margin: 0,
            lineHeight: typography.lineHeight.tight,
            letterSpacing: typography.letterSpacing.tighter
          }}>
            Overview
          </h1>
          <StatusIndicator
            lastScanned={lastScanned}
            loading={loading}
          />
        </div>

        {/* Hero Section - Flat Single Card */}
        <div style={{
          padding: spacing.lg,
          backgroundColor: surfaces.secondary,
          borderRadius: borders.radius.lg,
          boxShadow: themeElevation.subtle
        }}>
          {/* Total Page Weight Section */}
          <div>
            <div style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: framerColors.text,
              marginBottom: spacing.xs
            }}>
              Total page weight
            </div>

            <div style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              lineHeight: typography.lineHeight.tight,
              color: framerColors.text,
              letterSpacing: typography.letterSpacing.tighter,
              marginBottom: spacing.xs
            }}>
              {formatBytes(currentTotal)}
            </div>

            <div style={{
              fontSize: typography.fontSize.xs,
              color: framerColors.textSecondary
            }}>
              {breakpointData.assets.length} assets across all pages
            </div>
          </div>

          {/* Savings Section - Only if savings exist */}
          {totalSavings > 0 && (
            <>
              {/* Divider */}
              <div style={{
                height: '1px',
                backgroundColor: themeBorders.subtle,
                margin: `${spacing.lg} 0`
              }} />

              {/* Savings Section */}
              <div>
                <div style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: framerColors.text,
                  marginBottom: spacing.xs
                }}>
                  Potential savings
                </div>

                {/* Metrics Row - Savings left, Badge right */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: spacing.md
                }}>
                  <div style={{
                    fontSize: typography.fontSize.md,
                    fontWeight: typography.fontWeight.bold,
                    lineHeight: typography.lineHeight.tight,
                    color: framerColors.text,
                    letterSpacing: typography.letterSpacing.tight
                  }}>
                    {formatBytes(totalSavings)}
                  </div>

                  <div style={{
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.medium,
                    color: framerColors.textSecondary,
                    backgroundColor: 'rgba(0, 0, 0, 0.06)',
                    padding: `${spacing.xxs} ${spacing.sm}`,
                    borderRadius: borders.radius.full,
                    whiteSpace: 'nowrap' as const
                  }}>
                    {savingsPercent.toFixed(0)}% lighter
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: surfaces.tertiary,
                  borderRadius: borders.radius.sm,
                  overflow: 'hidden',
                  marginBottom: spacing.md
                }}>
                  <div style={{
                    height: '100%',
                    width: `${savingsPercent}%`,
                    backgroundColor: colors.accent.primary,
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                {/* CTA Button with Count */}
                {onNavigateToRecommendations && (
                  <Button
                    onClick={onNavigateToRecommendations}
                    variant="primary"
                    size="sm"
                    fullWidth
                  >
                    View {recommendations.length} {recommendations.length === 1 ? 'recommendation' : 'recommendations'}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bandwidth Estimate */}
        <div style={{
          backgroundColor: surfaces.secondary,
          borderRadius: borders.radius.lg,
          boxShadow: themeElevation.subtle,
          padding: spacing.lg
        }}>
          <div style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: framerColors.text,
            marginBottom: spacing.xs
          }}>
            Monthly bandwidth
          </div>
          <div style={{
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.bold,
            color: framerColors.text,
            lineHeight: typography.lineHeight.none,
            letterSpacing: typography.letterSpacing.tighter,
            marginBottom: spacing.sm
          }}>
            {estimatedMonthlyBandwidth.toFixed(2)} GB
          </div>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textSecondary,
            marginBottom: onNavigateToBandwidth ? spacing.sm : 0
          }}>
            Based on 5K pageviews • 2.5 pages per visit
          </div>
          {onNavigateToBandwidth && (
            <Button
              onClick={onNavigateToBandwidth}
              variant="secondary"
              size="sm"
              fullWidth
            >
              Customize estimate
            </Button>
          )}
        </div>

        {/* Asset Breakdown */}
        <div style={{
          backgroundColor: surfaces.secondary,
          borderRadius: borders.radius.lg,
          boxShadow: themeElevation.subtle,
          padding: spacing.lg
        }}>
          <div style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: framerColors.text,
            marginBottom: spacing.md
          }}>
            Asset breakdown
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
            boxShadow: themeElevation.subtle,
            padding: spacing.lg
          }}>
            <div style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: framerColors.text,
              marginBottom: spacing.sm
            }}>
              Custom code assets
            </div>
              <div style={{ marginBottom: spacing.sm }}>
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: framerColors.textSecondary,
                  marginBottom: spacing.xxs
                }}>
                  Dynamically loaded assets
                </div>
                <div style={{
                  fontSize: typography.fontSize.md,
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
                        marginBottom: spacing.xxs,
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
          boxShadow: themeElevation.subtle,
          padding: spacing.lg
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: spacing.sm
          }}>
            <Button
              onClick={handleExportMarkdown}
              variant="secondary"
              size="sm"
            >
              Copy as Markdown
            </Button>
            <Button
              onClick={handleExportJSON}
              variant="secondary"
              size="sm"
            >
              Download JSON
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
