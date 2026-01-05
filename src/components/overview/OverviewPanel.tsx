import { useState } from 'react'
import { framer } from 'framer-plugin'
import type { ProjectAnalysis } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'
import { BreakdownChart } from './BreakdownChart'
import { generateMarkdownReport, copyToClipboard, downloadJSON } from '../../utils/exportReport'
import { Button } from '../primitives/Button'
import { calculateDeviceWeightedBandwidth } from '../../utils/deviceBandwidth'
import { spacing, typography, borders, colors, backgrounds, surfaces, themeBorders, themeElevation, framerColors } from '../../styles/designTokens'
import { StatusIndicator } from '../common/StatusIndicator'
import { ClipboardDocumentIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid'
import { debugLog } from '../../utils/debugLog'

interface OverviewPanelProps {
  analysis: ProjectAnalysis
  onNavigateToRecommendations?: () => void
  onNavigateToBandwidth?: () => void
  lastScanned?: Date | null
  loading?: boolean
}

export function OverviewPanel({
  analysis,
  onNavigateToRecommendations,
  onNavigateToBandwidth,
  lastScanned,
  loading
}: OverviewPanelProps) {
  const [customCodeExpanded, setCustomCodeExpanded] = useState(false)

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

          {/* Savings Section - Show savings or success state */}
          {totalSavings > 0 ? (
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
                    backgroundColor: 'var(--framer-color-bg-tertiary)',
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
          ) : (
            <>
              {/* Divider */}
              <div style={{
                height: '1px',
                backgroundColor: themeBorders.subtle,
                margin: `${spacing.lg} 0`
              }} />

              {/* Success State - No optimizations needed */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    color: framerColors.text,
                    marginBottom: spacing.xxs
                  }}>
                    Images are optimized
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.xs,
                    color: framerColors.textSecondary
                  }}>
                    No optimization recommendations at this time
                  </div>
                </div>
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
                  {(customCodeExpanded ? customCode.assets : customCode.assets.slice(0, 5)).map((asset, i, arr) => (
                    <div
                      key={i}
                      style={{
                        paddingBottom: spacing.sm,
                        borderBottom: i < arr.length - 1 ? `1px solid ${themeBorders.subtle}` : 'none'
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
                    <button
                      onClick={() => setCustomCodeExpanded(!customCodeExpanded)}
                      style={{
                        fontSize: typography.fontSize.xs,
                        color: 'var(--framer-color-tint)',
                        paddingTop: spacing.xs,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: `${spacing.xs} 0`,
                        transition: 'opacity 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      {customCodeExpanded
                        ? 'Show less'
                        : `+ ${customCode.assets.length - 5} more`}
                    </button>
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
              icon={
                <ClipboardDocumentIcon 
                  style={{ 
                    width: '14px',
                    height: '14px',
                    flexShrink: 0
                  }}
                />
              }
            >
              Copy as Markdown
            </Button>
            <Button
              onClick={handleExportJSON}
              variant="secondary"
              size="sm"
              icon={
                <ArrowDownTrayIcon 
                  style={{ 
                    width: '14px',
                    height: '14px',
                    flexShrink: 0
                  }}
                />
              }
            >
              Download JSON
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
